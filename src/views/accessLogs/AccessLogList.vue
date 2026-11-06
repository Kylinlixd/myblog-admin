<template>
  <div class="admin-page access-log-page">
    <PageHeader compact :title="t('logMgr.pageTitle')" :subtitle="t('logMgr.subtitle')" />

    <section v-if="showVisits" class="visits-panel">
      <div class="visits-heading"><h2>{{ t('logMgr.visitsHeading') }}</h2><router-link to="/dashboard">{{ t('logMgr.backToDashboard') }} &gt;</router-link></div>
      <p>{{ t('logMgr.visitsDesc') }}</p>
      <div v-if="visitError" role="alert">{{ visitError }} <a-button @click="loadVisits">{{ t('common.retry') }}</a-button></div>
      <template v-else-if="visitStats">
        <div class="security-summary">
          <div class="summary-card"><span>{{ t('logMgr.pv7') }}</span><strong>{{ visitStats.visits.pv }}</strong></div>
          <div class="summary-card"><span>{{ t('logMgr.uv7') }}</span><strong>{{ visitStats.visits.uv }}</strong></div>
          <div class="summary-card"><span>{{ t('logMgr.dailyAvg') }}</span><strong>{{ visitStats.visits.average }}</strong></div>
          <div class="summary-card"><span>{{ t('logMgr.bounceRate') }}</span><strong>{{ visitStats.visits.bounceRate == null ? '—' : `${visitStats.visits.bounceRate}%` }}</strong></div>
        </div>
        <DashboardChart :option="visitsOption(visitStats.daily)" :label="t('logMgr.visitsHeading')" />
      </template>
      <p v-else>{{ t('logMgr.loadingVisits') }}</p>
    </section>
    <section class="security-summary" :aria-label="t('logMgr.securityOverview')">
      <button class="summary-card" :class="{ 'summary-card--selected': currentView === 'profiles' }" type="button" @click="selectSummary('profiles')"><span>{{ t('logMgr.activeIps') }}</span><strong>{{ overviewValue('active_ips') }}</strong><small>{{ t('logMgr.viewIpProfiles') }}</small></button>
      <button class="summary-card summary-card--danger" :class="{ 'summary-card--selected': currentView === 'high-risk' }" type="button" @click="selectSummary('high-risk')"><span>{{ t('logMgr.highRiskIps') }}</span><strong>{{ overviewValue('high_risk_ips') }}</strong><small>{{ t('logMgr.viewHighRiskProfiles') }}</small></button>
      <button class="summary-card summary-card--rule" :class="{ 'summary-card--selected': currentView === 'rules' }" type="button" @click="selectSummary('rules')"><span>{{ t('logMgr.activeRules') }}</span><strong>{{ overviewValue('active_rules') }}</strong><small>{{ t('logMgr.viewRuleDetails') }}</small></button>
      <button class="summary-card" :class="{ 'summary-card--selected': currentView === 'blocks' }" type="button" @click="selectSummary('blocks')"><span>{{ t('logMgr.blockedHits') }}</span><strong>{{ overviewValue('blocked_requests') }}</strong><small>{{ t('logMgr.viewBlockedRecords') }}</small></button>
    </section>

    <div v-if="currentView === 'profiles' || currentView === 'high-risk'" class="access-log-toolbar">
      <a-form class="access-log-filters" @submit.prevent="applyFilters">
        <a-form-item :label="t('logMgr.filterIp')"><a-input v-model:value="filters.ip" allow-clear :placeholder="t('logMgr.ipPlaceholder')" /></a-form-item>
        <a-form-item :label="t('logMgr.filterRisk')">
          <a-select v-model:value="filters.risk" allow-clear :placeholder="t('logMgr.allFilter')" style="width: 150px">
            <a-select-option value="low">{{ t('adminShared.risk.low') }}</a-select-option>
            <a-select-option value="medium">{{ t('adminShared.risk.medium') }}</a-select-option>
            <a-select-option value="high">{{ t('adminShared.risk.high') }}</a-select-option>
            <a-select-option value="critical">{{ t('adminShared.risk.critical') }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item :label="t('logMgr.filterNetwork')">
          <a-select v-model:value="filters.network" allow-clear :placeholder="t('logMgr.networkPlaceholder')" style="width: 140px">
            <a-select-option value="private">{{ t('logMgr.networkPrivate') }}</a-select-option>
            <a-select-option value="public">{{ t('logMgr.networkPublic') }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item :label="t('logMgr.regionLabel')"><a-input v-model:value="filters.region" allow-clear :placeholder="t('logMgr.regionPlaceholder')" /></a-form-item>
        <div class="filter-actions">
          <a-button @click="resetFilters">{{ t('component.reset') }}</a-button>
          <a-button type="primary" html-type="submit">{{ t('logMgr.applyFilters') }}</a-button>
        </div>
      </a-form>
    </div>

    <section v-if="currentView === 'rules'" class="summary-detail-card">
      <header><div><h2>{{ t('logMgr.rulesTitle') }}</h2><p>{{ t('logMgr.rulesDesc') }}</p></div></header>
      <div v-if="activeRules.length" class="rules-list">
        <div v-for="rule in activeRules" :key="rule.id" class="rule-summary-row"><a-tag :color="ruleColor(rule.rule_type)">{{ ruleLabel(rule.rule_type) }}</a-tag><strong>{{ rule.target }}</strong><span>{{ rule.reason || t('logMgr.noReason') }}</span><small>{{ rule.expires_at ? t('logMgr.validUntil', { date: formatDate(rule.expires_at) }) : t('logMgr.validForever') }}</small></div>
      </div>
      <div v-else class="state-box">{{ t('logMgr.noRules') }}</div>
    </section>
    <section v-else-if="currentView === 'blocks'" class="summary-detail-card">
      <header><div><h2>{{ t('logMgr.blockedTitle') }}</h2><p>{{ t('logMgr.blockedDesc') }}</p></div></header>
      <div v-if="blockedLoading" class="state-box">{{ t('logMgr.loadingBlocked') }}</div>
      <div v-else-if="blockedError" class="state-box" role="alert">{{ blockedError }}</div>
      <div v-else-if="blockedLogs.length" class="blocked-log-list">
        <div v-for="log in blockedLogs" :key="log.id" class="blocked-log-row">
          <strong>{{ log.ip_address || t('logMgr.unknownIp') }}</strong>
          <code>{{ log.method }} {{ log.path }}</code>
          <a-tag color="error">{{ log.security_action === 'rate_limited' ? t('logMgr.rule.rateLimit') : t('logMgr.rule.ban') }}</a-tag>
          <span>{{ formatDate(log.created_at) }}</span>
        </div>
      </div>
      <div v-else class="state-box">{{ t('logMgr.blockedLoadFailed') }}</div>
    </section>

    <DataTable v-if="currentView !== 'rules' && currentView !== 'blocks'"
      :data="profiles"
      :columns="columns"
      :loading="loadingProfiles"
      column-storage-key="access-logs"
      row-key="ip_address"
    >
      <template #ip="{ row }">
        <div class="ip-cell">
          <strong>{{ row.ip_address || t('logMgr.unidentified') }}</strong>
          <a-tag :color="ipColor(row.scope)">{{ row.ip_type }}</a-tag>
        </div>
      </template>
      <template #geo="{ row }">
        <span class="geo-cell">{{ geoText(row) }}</span>
      </template>
      <template #behavior="{ row }">
        <div class="behavior-cell">
          <strong>{{ t('logMgr.totalRequests', { n: totalRequestsText(row) }) }}</strong>
          <small>{{ t('logMgr.failureRate', { n: failureRateText(row) }) }}</small>
          <a-tag v-if="hasAnomaly(row)" :color="anomalyColor(row.behavior?.risk?.anomaly_level)">{{ anomalyLabel(row.behavior?.risk?.anomaly_level) }}</a-tag>
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
          <span v-if="!row.rules || !row.rules.length" class="muted">{{ t('logMgr.noRulesApplied') }}</span>
        </div>
      </template>
      <template #action="{ row }">
        <a-space>
          <a-button size="small" type="primary" ghost @click="openProfile(row)">{{ t('logMgr.profileButton') }}</a-button>
          <a-button size="small" @click="openRuleModal(row)">{{ t('logMgr.addProtection') }}</a-button>
        </a-space>
      </template>
    </DataTable>
    <Pagination v-if="currentView === 'profiles' || currentView === 'high-risk' || currentView === 'blocks'"
      :total="total"
      :current-page="page"
      :page-size="pageSize"
      @current-change="changePage"
      @size-change="changeSize"
    />

    <a-drawer
      v-model:open="drawerOpen"
      :width="Math.min(760, documentWidth - 16)"
      :title="t('logMgr.profileModalTitle')"
    >
      <div v-if="loadingDetail" class="state-box">{{ t('logMgr.loadingProfile') }}</div>
      <div v-else-if="selectedProfile" class="profile-detail">
        <section>
          <h3>{{ t('logMgr.profileGeo') }}</h3>
          <dl class="detail-grid">
            <div><dt>IP</dt><dd>{{ selectedProfile.ip_address }}</dd></div>
            <div><dt>{{ t('logMgr.field.type') }}</dt><dd>{{ selectedProfile.ip_type }}</dd></div>
            <div><dt>归属</dt><dd>{{ geoText(selectedProfile) }}</dd></div>
            <div><dt>{{ t('logMgr.field.risk') }}</dt><dd>{{ riskLabel(selectedProfile.risk_level) }} · {{ selectedProfile.risk_score }} 分</dd></div>
          </dl>
        </section>
        <section>
          <h3>{{ t('logMgr.profileBehavior') }}</h3>
          <div class="behavior-chips">
            <span>总请求：{{ totalRequestsText(selectedProfile) }}</span>
            <span>认证失败：{{ countText(selectedProfile.behavior?.risk?.auth_failures) }}</span>
            <span>客户端错误（4xx）：{{ countText(selectedProfile.behavior?.risk?.client_errors) }}</span>
            <span>服务端错误（5xx）：{{ countText(selectedProfile.behavior?.risk?.server_errors) }}</span>
            <span>写操作：{{ countText(selectedProfile.behavior?.risk?.write_count) }}</span>
            <span>失败率：{{ failureRateText(selectedProfile) }}</span>
          </div>
          <div v-if="hasAnomaly(selectedProfile)" class="anomaly-summary">
            <a-tag :color="anomalyColor(selectedProfile.behavior?.risk?.anomaly_level)">{{ anomalyLabel(selectedProfile.behavior?.risk?.anomaly_level) }}</a-tag>
            <span>{{ anomalyReasonsText(selectedProfile) }}</span>
          </div>
          <p class="risk-reason">安全风险：{{ riskReasonsText(selectedProfile) }}</p>
        </section>
        <section v-if="selectedProfile.rules?.length">
          <h3>{{ t('logMgr.profileCurrent') }}</h3>
          <div v-for="rule in selectedProfile.rules" :key="rule.id" class="rule-row">
            <a-tag :color="ruleColor(rule.rule_type)">{{ ruleLabel(rule.rule_type) }}</a-tag>
            <span>{{ rule.reason || t('logMgr.noReason') }}</span>
            <a-button size="small" type="link" danger @click="revokeRule(rule)">{{ t('logMgr.revoke') }}</a-button>
          </div>
        </section>
        <section>
          <h3>{{ t('logMgr.profileRecent') }}</h3>
          <div v-if="selectedProfile.recent_logs?.length" class="recent-logs">
            <div v-for="log in selectedProfile.recent_logs" :key="log.id" class="log-row">
              <span>{{ log.method }}</span><code>{{ log.path }}</code><a-tag :color="log.status_code < 400 ? 'success' : 'error'">{{ log.status_code }}</a-tag>
            </div>
          </div>
          <div v-else class="muted">{{ t('logMgr.noRequests') }}</div>
        </section>
      </div>
    </a-drawer>

    <a-modal v-model:open="ruleModalOpen" :title="t('logMgr.ruleModalTitle')" :confirm-loading="savingRule" ok-text="保存规则" @ok="submitRule">
      <a-form layout="vertical">
        <a-form-item :label="t('logMgr.field.target')"><a-input v-model:value="ruleForm.target" disabled /></a-form-item>
        <a-form-item :label="t('logMgr.field.ruleType')">
          <a-select v-model:value="ruleForm.rule_type">
            <a-select-option value="whitelist">{{ t('logMgr.rule.whitelist') }}</a-select-option>
            <a-select-option value="blacklist">{{ t('logMgr.rule.blacklist') }}</a-select-option>
            <a-select-option value="ban">{{ t('logMgr.rule.ban') }}</a-select-option>
            <a-select-option value="rate_limit">{{ t('logMgr.rule.rateLimit') }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item :label="t('logMgr.field.attackLevel')">
          <a-select v-model:value="ruleForm.attack_level">
            <a-select-option value="low">{{ t('logMgr.level.low') }}</a-select-option>
            <a-select-option value="medium">{{ t('logMgr.level.medium') }}</a-select-option>
            <a-select-option value="high">{{ t('logMgr.level.high') }}</a-select-option>
            <a-select-option value="critical">{{ t('logMgr.level.critical') }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item v-if="ruleForm.rule_type === 'ban'" :label="t('logMgr.field.banMode')">
          <a-checkbox v-model:checked="ruleForm.is_permanent">{{ t('logMgr.permanentBan') }}</a-checkbox>
        </a-form-item>
        <a-form-item v-if="ruleForm.rule_type === 'ban' && !ruleForm.is_permanent" :label="t('logMgr.field.expiresAt')">
          <a-input v-model:value="ruleForm.expires_at" type="datetime-local" />
        </a-form-item>
        <template v-if="ruleForm.rule_type === 'rate_limit'">
          <a-form-item :label="t('logMgr.field.windowRequests')"><a-input-number v-model:value="ruleForm.requests" :min="1" :max="1000000" /></a-form-item>
          <a-form-item :label="t('logMgr.field.windowSeconds')"><a-input-number v-model:value="ruleForm.window_seconds" :min="1" :max="86400" /></a-form-item>
        </template>
        <a-form-item :label="t('logMgr.field.reason')"><a-textarea v-model:value="ruleForm.reason" :rows="3" maxlength="500" show-count /></a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import request from '@/services/http/client'
import DashboardChart from '@/views/dashboard/DashboardChart.vue'
import { visitsOption } from '@/views/dashboard/charts'
import { mapDashboardData } from '@/views/dashboard/stats'
import { message } from 'ant-design-vue'
import {
  createAccessLogRule,
  getAccessLogList,
  getAccessLogOverview,
  getAccessLogProfileDetail,
  getAccessLogProfiles,
  getAccessLogRules,
  revokeAccessLogRule
} from '@/api/accessLog'
import DataTable from '@/components/common/DataTable.vue'
import Pagination from '@/components/common/Pagination.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import { t } from '@/i18n'

const route = useRoute()
const showVisits = computed(() => route.query.view === 'visits')
const visitStats = ref(null)
const visitError = ref('')
async function loadVisits() {
  visitError.value = ''
  try { visitStats.value = mapDashboardData(await request.get('/api/stats/')) }
  catch (error) { visitError.value = error?.message || t('logMgr.visitLoadFailed') }
}
onMounted(() => { if (showVisits.value) loadVisits() })

const columns = [
  { key: 'ip', label: t('logMgr.column.ip'), slot: 'ip', width: '210px' },
  { key: 'geo', label: t('logMgr.column.geo'), slot: 'geo', width: '180px' },
  { key: 'behavior', label: t('logMgr.column.behavior'), slot: 'behavior', width: '130px' },
  { key: 'risk', label: t('logMgr.column.risk'), slot: 'risk', width: '210px' },
  { key: 'last_seen', label: t('logMgr.column.lastSeen'), slot: 'last_seen', width: '170px' },
  { key: 'rules', label: t('logMgr.column.rules'), slot: 'rules', width: '160px' },
  { key: 'action', label: t('adminShared.actions'), slot: 'action', width: '160px', fixed: 'right' }
]

const profiles = ref([])
const rules = ref([])
const activeRules = computed(() => rules.value.filter((rule) => rule.status === 'active' && (!rule.expires_at || new Date(rule.expires_at) > new Date())))
const loadingProfiles = ref(false)
const loadingRules = ref(false)
const overview = ref(null)
const overviewLoading = ref(false)
const blockedLogs = ref([])
const blockedTotal = ref(0)
const blockedLoading = ref(false)
const blockedError = ref('')
const total = ref(0)
const profileRequestId = ref(0)
const overviewRequestId = ref(0)
const blockedRequestId = ref(0)
const page = ref(1)
const pageSize = ref(20)
const filters = ref({ ip: '', risk: undefined, network: undefined, region: '' })
const documentWidth = ref(window.innerWidth)

const drawerOpen = ref(false)
const selectedProfile = ref(null)
const loadingDetail = ref(false)
const ruleModalOpen = ref(false)
const savingRule = ref(false)
const ruleForm = ref(emptyRuleForm())

const currentView = ref(route.query.view === 'high-risk' ? 'high-risk' : route.query.view === 'rules' ? 'rules' : route.query.view === 'blocks' ? 'blocks' : 'profiles')

const overviewValue = (key) => overview.value?.[key] ?? '—'

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

const riskLabel = (level) => ({ normal: t('adminShared.risk.low'), low: t('adminShared.risk.low'), medium: t('adminShared.risk.medium'), high: t('adminShared.risk.high'), critical: t('adminShared.risk.critical'), unknown: t('logMgr.unknown') }[level] || level)
const riskColor = (level) => ({ normal: 'success', low: 'blue', medium: 'orange', high: 'volcano', critical: 'red', unknown: 'default' }[level] || 'default')
const ruleLabel = (type) => ({ whitelist: t('logMgr.rule.whitelist'), blacklist: t('logMgr.rule.blacklist'), ban: t('logMgr.rule.ban'), rate_limit: t('logMgr.rule.rateLimit') }[type] || type)
const ruleColor = (type) => ({ whitelist: 'green', blacklist: 'red', ban: 'volcano', rate_limit: 'gold' }[type] || 'blue')
const ipColor = (scope) => ({ public: 'blue', private: 'orange', loopback: 'green', reserved: 'red', unknown: 'default' }[scope] || 'default')
const formatDate = (value) => value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '-'
const countText = (value) => t('logMgr.countTimes', { n: value ?? 0 })
const totalRequestsText = (row) => {
  const value = row?.behavior?.total_requests
  return value == null ? '—' : countText(value)
}
const failureRateText = (row) => {
  const value = row?.behavior?.risk?.error_rate
  return value == null ? '—' : `${value}%`
}
const anomalyLabel = (level) => ({ medium: t('logMgr.anomaly.medium'), high: t('logMgr.anomaly.high'), critical: t('logMgr.anomaly.critical') }[level] || '')
const anomalyColor = (level) => ({ medium: 'gold', high: 'volcano', critical: 'red' }[level] || 'default')
const hasAnomaly = (row) => ['medium', 'high', 'critical'].includes(row?.behavior?.risk?.anomaly_level)
const anomalyReasonsText = (row) => (row?.behavior?.risk?.anomaly_reasons || []).join('，') || t('logMgr.anomalyFallback')
const geoText = (row) => {
  const geo = row.geo
  if (!geo) return t('logMgr.unknown')
  return [geo.location || [...new Set([geo.country, geo.region, geo.city].filter(Boolean))].join(' · '), geo.isp].filter(Boolean).join(' · ') || (geo.matched ? t('logMgr.localDbHit') : t('logMgr.unknown'))
}
const riskReasonsText = (row) => (row.risk_reasons || []).join('，') || t('logMgr.riskReasonsFallback')

async function loadProfiles() {
  const requestId = ++profileRequestId.value
  loadingProfiles.value = true
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      window: '7d',
      ...Object.fromEntries(Object.entries(filters.value).filter(([, value]) => value))
    }
    if (currentView.value === 'high-risk') params.riskGroup = 'high_plus'
    const response = await getAccessLogProfiles(params)
    if (requestId !== profileRequestId.value) return
    profiles.value = response?.data?.list || []
    total.value = response?.data?.total || 0
  } catch (error) {
    message.error(error?.message || t('logMgr.ipProfileFailed'))
  } finally {
    if (requestId === profileRequestId.value) loadingProfiles.value = false
  }
}

async function loadOverview() {
  if (typeof getAccessLogOverview !== 'function') return
  const requestId = ++overviewRequestId.value
  overviewLoading.value = true
  try {
    const response = await getAccessLogOverview()
    if (requestId !== overviewRequestId.value) return
    overview.value = response?.data || response || null
  } catch (error) {
    message.error(error?.message || t('logMgr.securityOverviewFailed'))
  } finally {
    if (requestId === overviewRequestId.value) overviewLoading.value = false
  }
}

async function loadBlockedLogs() {
  if (typeof getAccessLogList !== 'function') return
  const requestId = ++blockedRequestId.value
  blockedLoading.value = true
  blockedError.value = ''
  try {
    const response = await getAccessLogList({ page: page.value, pageSize: pageSize.value, securityGroup: 'blocked', window: '7d' })
    if (requestId !== blockedRequestId.value) return
    const data = response?.data || response || {}
    blockedLogs.value = data.items ?? data.list ?? data.results ?? []
    blockedTotal.value = data.total ?? data.count ?? blockedLogs.value.length
    total.value = blockedTotal.value
  } catch (error) {
    blockedError.value = error?.message || t('logMgr.blockedLoadFailed')
  } finally {
    if (requestId === blockedRequestId.value) blockedLoading.value = false
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
  const viewRequest = currentView.value === 'blocks'
    ? loadBlockedLogs()
    : currentView.value === 'rules'
      ? Promise.resolve()
      : loadProfiles()
  await Promise.all([loadOverview(), loadRules(), viewRequest])
}

function applyFilters() { page.value = 1; loadProfiles() }
function replaceViewQuery(view) {
  const url = new URL(window.location.href)
  if (view) url.searchParams.set('view', view)
  else url.searchParams.delete('view')
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
}
function resetFilters() { filters.value = { ip: '', risk: undefined, network: undefined, region: '' }; currentView.value = 'profiles'; replaceViewQuery('profiles'); applyFilters() }
function selectSummary(view) {
  currentView.value = view
  replaceViewQuery(view)
  if (view === 'profiles' || view === 'high-risk') {
    filters.value = { ip: '', risk: undefined, network: undefined, region: '' }
    page.value = 1
    loadProfiles()
  } else if (view === 'blocks') {
    page.value = 1
    loadBlockedLogs()
  }
}
function changePage(value) { page.value = value; currentView.value === 'blocks' ? loadBlockedLogs() : loadProfiles() }
function changeSize(value) { pageSize.value = value; page.value = 1; currentView.value === 'blocks' ? loadBlockedLogs() : loadProfiles() }

async function openProfile(row) {
  drawerOpen.value = true
  loadingDetail.value = true
  selectedProfile.value = null
  try {
    const response = await getAccessLogProfileDetail(row.ip_address)
    selectedProfile.value = response?.data || null
    if (!selectedProfile.value) message.error(t('logMgr.profileEmpty'))
  } catch (error) {
    message.error(error?.message || t('logMgr.profileLoadFailed'))
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
    if (!payload.reason.trim()) message.error(t('logMgr.reasonRequired'))
    else {
      await createAccessLogRule(payload)
      message.success(t('logMgr.ruleCreated'))
      ruleModalOpen.value = false
      await loadAll()
    }
  } catch (error) {
    message.error(error?.message || t('logMgr.ruleCreateFailed'))
  } finally {
    savingRule.value = false
  }
}

async function revokeRule(rule) {
  try {
    await revokeAccessLogRule(rule.id)
    message.success(t('logMgr.ruleRevoked'))
    await Promise.all([loadRules(), selectedProfile.value ? openProfile({ ip_address: selectedProfile.value.ip_address }) : Promise.resolve()])
  } catch (error) {
    message.error(error?.message || t('logMgr.revokeFailed'))
  }
}

const handleResize = () => { documentWidth.value = window.innerWidth }
onMounted(() => {
  window.addEventListener('resize', handleResize)
  loadAll()
})
onBeforeUnmount(() => window.removeEventListener('resize', handleResize))
</script>

<style scoped>
.access-log-page { max-width: 1440px; }
.security-summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 16px; }
.summary-card { padding: 16px 18px; border: 1px solid var(--color-border); border-radius: 10px; background: #fff; box-shadow: 0 2px 8px rgb(20 32 58 / 4%); }
.summary-card { display: block; width: 100%; text-align: left; cursor: pointer; transition: border-color .18s ease, background-color .18s ease, transform .18s ease; }
.summary-card:hover { border-color: #9bb3f5; background: #fbfcff; transform: translateY(-1px); }
.summary-card--selected { border-color: var(--color-primary); box-shadow: 0 0 0 2px rgb(49 91 234 / 12%); }
.summary-card span { display: block; color: var(--color-text-muted); font-size: 12px; }
.summary-card strong { display: block; margin-top: 8px; color: var(--color-text); font-size: 26px; font-weight: 750; }
.summary-card small { display: block; margin-top: 8px; color: var(--color-primary); font-size: 11px; }
.summary-card--danger { border-color: #fbc4c4; background: #fff5f5; }
.summary-card--danger strong { color: #c0392b; }
.summary-card--rule { border-color: #ead2a7; background: #fffaf0; }
.summary-card--rule strong { color: #9a5b11; }
.access-log-toolbar { display: flex; align-items: stretch; gap: 12px; margin-bottom: 16px; }
.access-log-filters { display: grid; min-width: 0; flex: 1 1 auto; grid-template-columns: minmax(190px, 1.25fr) minmax(140px, .8fr) minmax(140px, .8fr) minmax(190px, 1.15fr) auto; align-items: center; gap: 12px; padding: 12px; border: 1px solid var(--color-border); border-radius: 10px; background: #fff; }
.access-log-filters :deep(.ant-form-item) { display: flex; min-width: 0; align-items: center; margin: 0; }
.access-log-filters :deep(.ant-form-item-label) { flex: 0 0 auto; padding: 0 8px 0 0; }
.access-log-filters :deep(.ant-form-item-label > label) { color: var(--color-text-secondary); }
.access-log-filters :deep(.ant-form-item-control) { min-width: 0; flex: 1; }
.access-log-filters :deep(.ant-form-item-control-input), .access-log-filters :deep(.ant-form-item-control-input-content) { min-width: 0; width: 100%; }
.access-log-filters :deep(.ant-input), .access-log-filters :deep(.ant-select) { width: 100% !important; }
.filter-actions { display: flex; align-items: center; justify-content: flex-end; gap: 8px; }
.ip-cell { display: grid; gap: 4px; }
.ip-cell strong { color: var(--color-text); font-size: 13px; }
.ip-cell .ant-tag { width: fit-content; font-size: 11px; }
.geo-cell { color: var(--color-text); font-size: 12px; }
.behavior-cell { display: grid; gap: 3px; }
.behavior-cell small { color: var(--color-text-muted); font-size: 11px; }
.behavior-cell .ant-tag { width: fit-content; margin: 2px 0 0; font-size: 11px; }
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
.anomaly-summary { display: flex; align-items: flex-start; flex-wrap: wrap; gap: 8px; margin-top: 10px; color: #344054; font-size: 12px; line-height: 1.5; }
.anomaly-summary span { min-width: 0; overflow-wrap: anywhere; }
.rule-row, .log-row { display: flex; align-items: center; gap: 8px; padding: 9px 0; border-bottom: 1px solid #eef1f5; }
.log-row code { min-width: 0; flex: 1; overflow: hidden; color: #344054; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.log-row .ant-tag { flex: 0 0 auto; }
@media (max-width: 1100px) {
  .access-log-toolbar { flex-wrap: wrap; }
  .access-log-filters { flex-basis: 100%; grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .filter-actions { grid-column: 4; }
}
@media (max-width: 900px) { .security-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); } .access-log-filters { grid-template-columns: repeat(2, minmax(0, 1fr)); } .filter-actions { grid-column: 1 / -1; justify-self: end; } }
@media (max-width: 560px) { .security-summary { grid-template-columns: 1fr; } .access-log-toolbar { align-items: stretch; flex-direction: column; } .access-log-filters { grid-template-columns: 1fr; } .filter-actions { grid-column: auto; justify-self: stretch; } .filter-actions .ant-btn { flex: 1; } }
.visits-panel { margin-bottom: 20px; padding: 24px; background: #fff; border: 1px solid #e5eaf2; border-radius: 16px; }
.visits-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.visits-heading h2 { margin: 0; font-size: 20px; }
.visits-panel p { color: #8691a4; font-size: 12px; }
.visits-heading a { color: #315bea; }
.summary-detail-card { padding: 18px; border: 1px solid var(--color-border); border-radius: 10px; background: #fff; }
.summary-detail-card header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.summary-detail-card h2 { margin: 0; color: var(--color-text); font-size: 16px; }
.summary-detail-card p { margin: 4px 0 0; color: var(--color-text-muted); font-size: 12px; }
.rule-summary-row { display: grid; grid-template-columns: 90px minmax(120px, 180px) minmax(0, 1fr) 140px; gap: 10px; align-items: center; padding: 11px 0; border-top: 1px solid #eef1f5; color: var(--color-text-secondary); font-size: 12px; }
.rule-summary-row strong { color: var(--color-text); }
.blocked-log-list { display: grid; }
.blocked-log-row { display: grid; grid-template-columns: 150px minmax(0, 1fr) 60px 170px; gap: 12px; align-items: center; padding: 11px 0; border-top: 1px solid #eef1f5; color: var(--color-text-secondary); font-size: 12px; }
.blocked-log-row strong { color: var(--color-text); }
.blocked-log-row code { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
@media (max-width: 720px) { .rule-summary-row { grid-template-columns: 1fr 1fr; } .rule-summary-row span, .rule-summary-row small { grid-column: span 2; } }
@media (max-width: 720px) { .blocked-log-row { grid-template-columns: 1fr 1fr; } .blocked-log-row code { grid-column: span 2; } }
</style>
