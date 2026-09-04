<template>
  <div class="admin-page access-log-page">
    <PageHeader title="访问日志与安全防护" subtitle="识别 IP 类型、归属与行为画像，并对风险来源执行人工防护规则。" />

    <section class="security-summary" aria-label="安全概览">
      <div class="summary-card"><span>活跃 IP</span><strong>{{ total }}</strong></div>
      <div class="summary-card summary-card--danger"><span>高风险 IP</span><strong>{{ highRiskCount }}</strong></div>
      <div class="summary-card summary-card--rule"><span>生效防护规则</span><strong>{{ activeRules.length }}</strong></div>
      <div class="summary-card"><span>封禁/限流命中</span><strong>{{ blockedCount }}</strong></div>
    </section>

    <div class="access-log-toolbar">
      <a-form layout="inline" class="access-log-filters" @submit.prevent="applyFilters">
        <a-form-item label="IP"><a-input v-model:value="filters.ip" allow-clear placeholder="IP 或 CIDR" /></a-form-item>
        <a-form-item label="风险">
          <a-select v-model:value="filters.risk" allow-clear placeholder="全部" style="width: 150px">
            <a-select-option value="high">高 / 严重</a-select-option>
            <a-select-option value="critical">严重</a-select-option>
          </a-select>
        </a-form-item>
        <a-button type="primary" html-type="submit">筛选</a-button>
        <a-button @click="resetFilters">重置</a-button>
      </a-form>
      <a-button @click="loadAll" :loading="loadingProfiles">刷新</a-button>
    </div>

    <DataTable
      :data="profiles"
      :columns="columns"
      :loading="loadingProfiles"
      row-key="ip_address"
    >
      <template #ip="{ row }">
        <div class="ip-cell">
          <strong>{{ row.ip_address || '未识别' }}</strong>
          <a-tag :color="ipColor(row.scope)">{{ row.ip_type }}</a-tag>
        </div>
      </template>
      <template #geo="{ row }">
        <span class="geo-cell">{{ geoText(row) }}</span>
      </template>
      <template #behavior="{ row }">
        <div class="behavior-cell">
          <strong>{{ row.behavior?.total_requests || 0 }} 次请求</strong>
          <small>{{ row.behavior?.risk?.recent_1m || 0 }} 次/分钟</small>
        </div>
      </template>
      <template #risk="{ row }">
        <a-tag :color="riskColor(row.risk_level)">{{ riskLabel(row.risk_level) }}</a-tag>
        <span class="risk-score">{{ row.risk_score ?? 0 }}</span>
        <small class="risk-reason" :title="riskReasonsText(row)">{{ riskReasonsText(row) }}</small>
      </template>
      <template #last_seen="{ row }">
        {{ formatDate(row.behavior?.last_seen || row.last_seen) }}
      </template>
      <template #rules="{ row }">
        <div class="rule-cell">
          <a-tag v-for="rule in row.rules" :key="rule.id" :color="ruleColor(rule.rule_type)">
            {{ ruleLabel(rule.rule_type) }}
          </a-tag>
          <span v-if="!row.rules || !row.rules.length" class="muted">无防护规则</span>
        </div>
      </template>
      <template #action="{ row }">
        <a-space>
          <a-button size="small" type="primary" ghost @click="openProfile(row)">画像</a-button>
          <a-button size="small" @click="openRuleModal(row)">添加防护</a-button>
        </a-space>
      </template>
    </DataTable>
    <Pagination
      :total="total"
      :current-page="page"
      :page-size="pageSize"
      @current-change="changePage"
      @size-change="changeSize"
    />

    <a-drawer
      v-model:open="drawerOpen"
      :width="Math.min(760, documentWidth - 16)"
      title="IP 安全画像"
    >
      <div v-if="loadingDetail" class="state-box">正在加载画像...</div>
      <div v-else-if="selectedProfile" class="profile-detail">
        <section>
          <h3>归属画像</h3>
          <dl class="detail-grid">
            <div><dt>IP</dt><dd>{{ selectedProfile.ip_address }}</dd></div>
            <div><dt>类型</dt><dd>{{ selectedProfile.ip_type }}</dd></div>
            <div><dt>归属</dt><dd>{{ geoText(selectedProfile) }}</dd></div>
            <div><dt>风险</dt><dd>{{ riskLabel(selectedProfile.risk_level) }} · {{ selectedProfile.risk_score }} 分</dd></div>
          </dl>
        </section>
        <section>
          <h3>行为画像</h3>
          <div class="behavior-chips">
            <span>总请求 {{ selectedProfile.behavior?.total_requests || 0 }}</span>
            <span>认证失败 {{ selectedProfile.behavior?.risk?.auth_failures || 0 }}</span>
            <span>4xx/5xx {{ (selectedProfile.behavior?.risk?.client_errors || 0) + (selectedProfile.behavior?.risk?.server_errors || 0) }}</span>
            <span>写操作 {{ selectedProfile.behavior?.risk?.write_count || 0 }}</span>
          </div>
          <p class="risk-reason">{{ riskReasonsText(selectedProfile) }}</p>
        </section>
        <section v-if="selectedProfile.rules?.length">
          <h3>当前防护</h3>
          <div v-for="rule in selectedProfile.rules" :key="rule.id" class="rule-row">
            <a-tag :color="ruleColor(rule.rule_type)">{{ ruleLabel(rule.rule_type) }}</a-tag>
            <span>{{ rule.reason || '无原因说明' }}</span>
            <a-button size="small" type="link" danger @click="revokeRule(rule)">撤销</a-button>
          </div>
        </section>
        <section>
          <h3>最近请求</h3>
          <div v-if="selectedProfile.recent_logs?.length" class="recent-logs">
            <div v-for="log in selectedProfile.recent_logs" :key="log.id" class="log-row">
              <span>{{ log.method }}</span><code>{{ log.path }}</code><a-tag :color="log.status_code < 400 ? 'success' : 'error'">{{ log.status_code }}</a-tag>
            </div>
          </div>
          <div v-else class="muted">暂无请求记录</div>
        </section>
      </div>
    </a-drawer>

    <a-modal v-model:open="ruleModalOpen" title="添加防护规则" :confirm-loading="savingRule" ok-text="保存规则" @ok="submitRule">
      <a-form layout="vertical">
        <a-form-item label="目标"><a-input v-model:value="ruleForm.target" disabled /></a-form-item>
        <a-form-item label="规则类型">
          <a-select v-model:value="ruleForm.rule_type">
            <a-select-option value="whitelist">白名单</a-select-option>
            <a-select-option value="blacklist">黑名单</a-select-option>
            <a-select-option value="ban">封禁</a-select-option>
            <a-select-option value="rate_limit">限流</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="攻击等级">
          <a-select v-model:value="ruleForm.attack_level">
            <a-select-option value="low">低</a-select-option>
            <a-select-option value="medium">中</a-select-option>
            <a-select-option value="high">高</a-select-option>
            <a-select-option value="critical">严重</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item v-if="ruleForm.rule_type === 'ban'" label="封禁方式">
          <a-checkbox v-model:checked="ruleForm.is_permanent">永久封禁</a-checkbox>
        </a-form-item>
        <a-form-item v-if="ruleForm.rule_type === 'ban' && !ruleForm.is_permanent" label="过期时间">
          <a-input v-model:value="ruleForm.expires_at" type="datetime-local" />
        </a-form-item>
        <template v-if="ruleForm.rule_type === 'rate_limit'">
          <a-form-item label="窗口请求数"><a-input-number v-model:value="ruleForm.requests" :min="1" :max="1000000" /></a-form-item>
          <a-form-item label="窗口秒数"><a-input-number v-model:value="ruleForm.window_seconds" :min="1" :max="86400" /></a-form-item>
        </template>
        <a-form-item label="原因说明"><a-textarea v-model:value="ruleForm.reason" :rows="3" maxlength="500" show-count /></a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { message } from 'ant-design-vue'
import {
  createAccessLogRule,
  getAccessLogProfileDetail,
  getAccessLogProfiles,
  getAccessLogRules,
  revokeAccessLogRule
} from '@/api/accessLog'
import DataTable from '@/components/common/DataTable.vue'
import Pagination from '@/components/common/Pagination.vue'
import PageHeader from '@/components/common/PageHeader.vue'

const columns = [
  { label: 'IP 地址', slot: 'ip', width: '210px' },
  { label: '归属画像', slot: 'geo', width: '180px' },
  { label: '行为画像', slot: 'behavior', width: '130px' },
  { label: '风险', slot: 'risk', width: '210px' },
  { label: '最近访问', slot: 'last_seen', width: '170px' },
  { label: '当前规则', slot: 'rules', width: '160px' },
  { label: '操作', slot: 'action', width: '160px', fixed: 'right' }
]

const profiles = ref([])
const rules = ref([])
const activeRules = computed(() => rules.value.filter((rule) => rule.status === 'active'))
const blockedCount = computed(() => rules.value.filter((rule) => ['blacklist', 'ban', 'rate_limit'].includes(rule.rule_type) && rule.status === 'active').length)
const loadingProfiles = ref(false)
const loadingRules = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const filters = ref({ ip: '', risk: undefined })
const documentWidth = ref(window.innerWidth)

const drawerOpen = ref(false)
const selectedProfile = ref(null)
const loadingDetail = ref(false)
const ruleModalOpen = ref(false)
const savingRule = ref(false)
const ruleForm = ref(emptyRuleForm())

const highRiskCount = computed(() => profiles.value.filter((item) => ['high', 'critical'].includes(item.risk_level)).length)

function emptyRuleForm() {
  return {
    target: '',
    rule_type: 'ban',
    attack_level: 'high',
    requests: 100,
    window_seconds: 60,
    is_permanent: false,
    expires_at: '',
    reason: ''
  }
}

const riskLabel = (level) => ({ normal: '正常', low: '低', medium: '中', high: '高', critical: '严重', unknown: '未知' }[level] || level)
const riskColor = (level) => ({ normal: 'success', low: 'blue', medium: 'orange', high: 'volcano', critical: 'red', unknown: 'default' }[level] || 'default')
const ruleLabel = (type) => ({ whitelist: '白名单', blacklist: '黑名单', ban: '封禁', rate_limit: '限流' }[type] || type)
const ruleColor = (type) => ({ whitelist: 'green', blacklist: 'red', ban: 'volcano', rate_limit: 'gold' }[type] || 'blue')
const ipColor = (scope) => ({ public: 'blue', private: 'orange', loopback: 'green', reserved: 'red', unknown: 'default' }[scope] || 'default')
const formatDate = (value) => value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '-'
const geoText = (row) => {
  const geo = row.geo
  if (!geo) return '未知'
  return [geo.country, geo.region, geo.city].filter(Boolean).join(' · ') || (geo.matched ? '本地库已命中' : '未知')
}
const riskReasonsText = (row) => (row.risk_reasons || []).join('，') || '未发现明显异常'

async function loadProfiles() {
  loadingProfiles.value = true
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      ...Object.fromEntries(Object.entries(filters.value).filter(([, value]) => value))
    }
    const response = await getAccessLogProfiles(params)
    profiles.value = response?.data?.list || []
    total.value = response?.data?.total || 0
  } catch (error) {
    message.error(error?.message || 'IP 画像加载失败')
  } finally {
    loadingProfiles.value = false
  }
}

async function loadRules() {
  if (loadingRules.value) return
  loadingRules.value = true
  try {
    const result = await getAccessLogRules()
    rules.value = Array.isArray(result) ? result : []
  } catch {
    rules.value = []
  } finally {
    loadingRules.value = false
  }
}

async function loadAll() {
  await Promise.all([loadProfiles(), loadRules()])
}

function applyFilters() { page.value = 1; loadProfiles() }
function resetFilters() { filters.value = { ip: '', risk: undefined }; applyFilters() }
function changePage(value) { page.value = value; loadProfiles() }
function changeSize(value) { pageSize.value = value; page.value = 1; loadProfiles() }

async function openProfile(row) {
  drawerOpen.value = true
  loadingDetail.value = true
  selectedProfile.value = null
  try {
    const response = await getAccessLogProfileDetail(row.ip_address)
    selectedProfile.value = response?.data || null
    if (!selectedProfile.value) message.error('画像详情为空')
  } catch (error) {
    message.error(error?.message || '画像详情加载失败')
  } finally {
    loadingDetail.value = false
  }
}

function openRuleModal(row) {
  ruleForm.value = { ...emptyRuleForm(), target: row.ip_address || '' }
  ruleModalOpen.value = true
}

async function submitRule() {
  savingRule.value = true
  try {
    const payload = { ...ruleForm.value }
    if (payload.expires_at) payload.expires_at = new Date(payload.expires_at).toISOString()
    else payload.expires_at = null
    if (!['ban'].includes(payload.rule_type)) payload.expires_at = null
    if (payload.rule_type === 'ban' && payload.is_permanent) payload.expires_at = null
    if (payload.rule_type !== 'rate_limit') {
      delete payload.requests
      delete payload.window_seconds
    }
    if (!payload.reason.trim()) message.error('请填写原因说明')
    else {
      await createAccessLogRule(payload)
      message.success('防护规则已创建')
      ruleModalOpen.value = false
      await loadAll()
    }
  } catch (error) {
    message.error(error?.message || '规则创建失败')
  } finally {
    savingRule.value = false
  }
}

async function revokeRule(rule) {
  try {
    await revokeAccessLogRule(rule.id)
    message.success('规则已撤销')
    await Promise.all([loadRules(), selectedProfile.value ? openProfile({ ip_address: selectedProfile.value.ip_address }) : Promise.resolve()])
  } catch (error) {
    message.error(error?.message || '撤销失败')
  }
}

onMounted(() => {
  window.addEventListener('resize', () => { documentWidth.value = window.innerWidth })
  loadAll()
})
</script>

<style scoped>
.access-log-page { max-width: 1440px; }
.security-summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 16px; }
.summary-card { padding: 16px 18px; border: 1px solid var(--color-border); border-radius: 10px; background: #fff; box-shadow: 0 2px 8px rgb(20 32 58 / 4%); }
.summary-card span { display: block; color: var(--color-text-muted); font-size: 12px; }
.summary-card strong { display: block; margin-top: 8px; color: var(--color-text); font-size: 26px; font-weight: 750; }
.summary-card--danger { border-color: #fbc4c4; background: #fff5f5; }
.summary-card--danger strong { color: #c0392b; }
.summary-card--rule { border-color: #ead2a7; background: #fffaf0; }
.summary-card--rule strong { color: #9a5b11; }
.access-log-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.access-log-filters { padding: 12px; border: 1px solid var(--color-border); border-radius: 10px; background: #fff; }
.ip-cell { display: grid; gap: 4px; }
.ip-cell strong { color: var(--color-text); font-size: 13px; }
.ip-cell .ant-tag { width: fit-content; font-size: 11px; }
.geo-cell { color: var(--color-text); font-size: 12px; }
.behavior-cell { display: grid; gap: 3px; }
.behavior-cell small { color: var(--color-text-muted); font-size: 11px; }
.risk-score { margin-left: 6px; color: var(--color-text); font-size: 12px; font-weight: 700; }
.risk-reason { display: block; max-width: 180px; margin-top: 4px; overflow: hidden; color: var(--color-text-muted); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.rule-cell { display: flex; flex-wrap: wrap; gap: 4px; }
.muted { color: var(--color-text-muted); font-size: 12px; }
.state-box { padding: 60px 0; text-align: center; color: var(--color-text-muted); }
.profile-detail section { margin-bottom: 24px; }
.profile-detail h3 { margin: 0 0 12px; font-size: 15px; }
.detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin: 0; }
.detail-grid div { padding: 12px; border: 1px solid var(--color-border); border-radius: 8px; background: #fff; }
.detail-grid dt { color: var(--color-text-muted); font-size: 11px; }
.detail-grid dd { margin: 6px 0 0; color: var(--color-text); font-size: 14px; font-weight: 650; overflow-wrap: anywhere; }
.behavior-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.behavior-chips span { padding: 6px 10px; border-radius: 999px; background: #eef2ff; color: #344054; font-size: 12px; }
.rule-row, .log-row { display: flex; align-items: center; gap: 8px; padding: 9px 0; border-bottom: 1px solid #eef1f5; }
.log-row code { min-width: 0; flex: 1; overflow: hidden; color: #344054; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.log-row .ant-tag { flex: 0 0 auto; }
@media (max-width: 900px) { .security-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 560px) { .security-summary { grid-template-columns: 1fr; } .access-log-toolbar { align-items: stretch; flex-direction: column; } }
</style>
