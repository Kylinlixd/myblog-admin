<template>
  <div class="dashboard-page">
    <section class="dashboard-intro">
      <div class="intro-copy">
        <span class="section-label">{{ currentDate }} · 内容运营台</span>
        <h1>欢迎回来，{{ userStore.nickname || '管理员' }}</h1>
        <p>看清内容节奏，处理读者反馈，然后继续今天的创作。</p>
      </div>
      <div class="intro-actions">
        <router-link class="create-button" to="/dashboard/dynamics/create">
          <plus-outlined /> 新建内容
        </router-link>
      </div>
    </section>

    <a-alert v-if="error" type="error" show-icon :message="error" class="dashboard-alert">
      <template #action><a-button size="small" aria-label="重试" @click="loadStats">重试</a-button></template>
    </a-alert>

    <section class="metric-rail" aria-label="内容统计">
      <template v-if="loading">
        <a-skeleton v-for="item in 4" :key="item" active :paragraph="false" class="metric-skeleton" />
      </template>
      <router-link v-else v-for="item in metrics" :key="item.key" :to="item.path" class="metric-item" @click="item.key === 'comments' && acknowledgeCommentCount()">
        <component :is="item.icon" class="metric-icon" />
        <span class="metric-label">{{ item.label }}</span>
        <span class="metric-value-wrap">
          <strong class="metric-value">{{ item.value }}</strong>
          <i v-if="item.key === 'comments' && (commentNotifications.hasUnread || commentCountChanged)" class="metric-unread-dot" aria-label="有新评论" />
        </span>
      </router-link>
    </section>

    <section class="access-overview" aria-label="访问概览">
      <div><span>近七天接口访问</span><strong>{{ dashboardData.access.requests }}</strong><small>次</small></div>
      <div><span>近七天独立 IP</span><strong>{{ dashboardData.access.uniqueIps }}</strong><small>个</small></div>
      <router-link to="/dashboard/access-logs">查看访问日志 <right-outlined /></router-link>
    </section>

    <section class="operations-grid">
      <article class="workspace-panel content-pulse">
        <header class="panel-heading">
          <div><span class="section-label">发布节奏</span><h2>近七天内容&访问趋势</h2><small class="panel-range">{{ rangeLabel }}</small></div>
          <router-link to="/dashboard/dynamics">查看全部内容 &gt;</router-link>
        </header>

        <div class="trend-summary" aria-label="近七天发布统计">
          <div><span>七天发布</span><strong>{{ summaryValue(totalDaily) }}</strong><small>篇</small></div>
          <div><span>日均发布</span><strong>{{ summaryValue(averageDaily) }}</strong><small>篇/天</small></div>
          <div><span>单日峰值</span><strong>{{ summaryValue(maxDaily) }}</strong><small>篇</small></div>
        </div>

        <DashboardChart v-if="daily.length" class="trend-line-chart" :option="publishingOption(daily)" :label="`近七天内容与访问趋势，共发布 ${totalDaily} 篇，访问 ${dashboardData.visits.pv} PV`" />
        <div v-else-if="error" class="panel-empty panel-empty--error">
          <warning-outlined />
          <strong>发布统计暂时不可用</strong>
          <span>数据请求失败，请点击上方“重试”。</span>
        </div>
        <div v-else-if="!loading" class="panel-empty">
          <read-outlined />
          <strong>最近还没有发布记录</strong>
          <span>创建内容后，这里会呈现你的发布节奏。</span>
        </div>
      </article>

      <aside class="operations-side">
        <section class="workspace-panel taxonomy-panel">
          <header class="panel-heading">
            <div><span class="section-label">内容脉络</span><h2>主题阅读分布</h2></div>
            <router-link to="/dashboard/category">管理 &gt;</router-link>
          </header>

          <div v-if="hasTaxonomy" class="taxonomy-columns">
            <div v-if="dashboardData.categories.length" class="taxonomy-group">
              <div class="taxonomy-title"><span>分类</span><router-link to="/dashboard/category">管理 &gt;</router-link></div>
              <div class="taxonomy-list">
                <div v-for="item in dashboardData.categories" :key="`category-${item.name}`" class="taxonomy-item">
                  <div><strong>{{ item.name }}</strong><span>{{ item.count }}篇 · 总阅读 {{ formatNumber(item.views) }}</span></div>
                  <i><span :style="{ width: `${taxonomyShare(item, dashboardData.categories)}%` }" /></i>
                </div>
              </div>
            </div>
            <div v-if="dashboardData.tags.length" class="taxonomy-group">
              <div class="taxonomy-title"><span>标签</span><router-link to="/dashboard/tags">管理 &gt;</router-link></div>
              <div class="taxonomy-list">
                <div v-for="item in dashboardData.tags" :key="`tag-${item.name}`" class="taxonomy-item">
                  <div><strong>{{ item.name }}</strong><span>{{ item.count }}篇 · 总阅读 {{ formatNumber(item.views) }}</span></div>
                  <i><span :style="{ width: `${taxonomyShare(item, dashboardData.tags)}%` }" /></i>
                </div>
              </div>
            </div>
          </div>
          <div v-else-if="!loading" class="compact-empty">分类与标签的发布数据会显示在这里。</div>
        </section>


      </aside>
    </section>
    <section class="insights-grid" aria-label="阅读与安全数据">
      <article class="workspace-panel insight-card" id="visit-overview">
        <header class="panel-heading"><div><span class="section-label">读者足迹</span><h2>7天访问总览</h2></div><router-link to="/dashboard/access-logs?view=visits">查看访问统计 &gt;</router-link></header>
        <div class="insight-kpis">
          <div><span>7天总PV</span><strong>{{ formatNumber(dashboardData.visits.pv) }}</strong></div>
          <div><span>7天UV</span><strong>{{ formatNumber(dashboardData.visits.uv) }}</strong></div>
          <div><span>日均阅读</span><strong>{{ formatNumber(dashboardData.visits.average) }}</strong></div>
          <div><span title="IP＋浏览器识别访客；间隔30分钟划分会话，单次阅读会话占比">跳出率 <small>估算</small></span><strong>{{ dashboardData.visits.bounceRate == null ? '—' : `${dashboardData.visits.bounceRate}%` }}</strong></div>
        </div>
        <DashboardChart v-if="daily.length" class="mini-chart" :option="visitsOption(daily)" label="近七天每日文章访问 PV 趋势" />
        <div v-else class="compact-empty">{{ loading ? '正在加载访问数据…' : '暂无访问数据' }}</div>
        <p class="card-note">PV 按文章详情访问计 · UV 按 IP＋浏览器去重</p>
      </article>
      <article class="workspace-panel insight-card">
        <header class="panel-heading"><div><span class="section-label">阅读焦点</span><h2>热门文章 TOP5</h2></div><router-link to="/dashboard/dynamics">查看全部文章 &gt;</router-link></header>
        <div class="article-list-head"><span>文章标题</span><span>阅读 / 评论</span></div>
        <ol v-if="dashboardData.hotArticles.length" class="hot-articles">
          <li v-for="(article, index) in dashboardData.hotArticles" :key="article.id">
            <span class="article-rank" :class="{ 'article-rank--top': index < 3 }">{{ String(index + 1).padStart(2, '0') }}</span>
            <router-link :to="`/dashboard/dynamics/edit/${article.id}`" :title="article.title">{{ article.title }}<span v-if="index < 3 && article.view_count > 0" aria-label="高热度"> 🔥</span></router-link>
            <div class="article-counts"><strong>{{ formatNumber(article.view_count) }}</strong><span>{{ formatNumber(article.comment_count) }} 评论</span></div>
          </li>
        </ol>
        <div v-else class="compact-empty">{{ loading ? '正在加载热门文章…' : '发布文章后，这里展示阅读排行。' }}</div>
        <p class="card-note">按已发布文章累计阅读量排序</p>
      </article>
      <article class="workspace-panel insight-card">
        <header class="panel-heading"><div><span class="section-label">安全观察</span><h2>访问安全简报</h2></div><router-link to="/dashboard/access-logs">查看访问日志 &gt;</router-link></header>
        <div class="insight-kpis security-kpis">
          <div><span>近7日独立IP</span><strong>{{ formatNumber(dashboardData.security.uniqueIps) }}</strong></div>
          <div><span>中风险IP</span><strong class="risk-medium">{{ dashboardData.security.medium }}</strong></div>
          <div><span>高风险IP</span><strong class="risk-high">{{ dashboardData.security.high }}</strong></div>
          <div><span>严重风险IP</span><strong class="risk-critical">{{ dashboardData.security.critical }}</strong></div>
        </div>
        <div class="risk-list-heading">TOP 3 风险来源</div>
        <ul v-if="dashboardData.security.topIps.length" class="risk-ip-list">
          <li v-for="ip in dashboardData.security.topIps" :key="ip.ip_address"><span class="risk-ip-address" :title="ip.ip_address">{{ ip.ip_address }}</span><span class="risk-badge" :class="`risk-${ip.risk_level}`">{{ riskLabel(ip.risk_level) }}</span><strong>{{ formatNumber(ip.requests) }}<small> 次</small></strong></li>
        </ul>
        <div v-else class="compact-empty">{{ loading ? '正在加载安全数据…' : '近7日未发现中风险及以上 IP' }}</div>
        <p class="card-note">已排除生效白名单 · 风险依据近7日请求</p>
      </article>
    </section>
        <section class="quick-actions" aria-label="快捷操作">
          <div class="quick-heading"><span class="section-label">下一步</span><h2>快捷操作</h2></div>
          <router-link v-for="action in quickActions" :key="action.path" :to="action.path" class="quick-action">
            <component :is="action.icon" />
            <div><strong>{{ action.label }}</strong><span>{{ action.description }}</span></div>
            <right-outlined />
          </router-link>
        </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  CommentOutlined,
  FileTextOutlined,
  FolderOutlined,
  PlusOutlined,
  ReadOutlined,
  RightOutlined,
  TagsOutlined,
  WarningOutlined
} from '@ant-design/icons-vue'

import request from '@/services/http/client'
import { useUserStore } from '@/stores/user'
import { useCommentNotificationsStore } from '@/stores/commentNotifications'
import { mapDashboardData } from './dashboard/stats'
import DashboardChart from './dashboard/DashboardChart.vue'
import { publishingOption, visitsOption } from './dashboard/charts'

const userStore = useUserStore()
const commentNotifications = useCommentNotificationsStore()
const currentDate = new Intl.DateTimeFormat('zh-CN', {
  month: 'long',
  day: 'numeric',
  weekday: 'long'
}).format(new Date())
const loading = ref(true)
const error = ref('')
const dashboardData = ref(mapDashboardData())
const commentCountChanged = ref(false)
const COMMENT_COUNT_SEEN_KEY = 'dashboard.comments.seenCount'

const metrics = computed(() => [
  { key: 'dynamics', label: '内容', value: dashboardData.value.total.dynamics, path: '/dashboard/dynamics', icon: FileTextOutlined },
  { key: 'categories', label: '分类', value: dashboardData.value.total.categories, path: '/dashboard/category', icon: FolderOutlined },
  { key: 'tags', label: '标签', value: dashboardData.value.total.tags, path: '/dashboard/tags', icon: TagsOutlined },
  { key: 'comments', label: '评论', value: dashboardData.value.total.comments, path: '/dashboard/comments', icon: CommentOutlined }
])
const daily = computed(() => dashboardData.value.daily)
const totalDaily = computed(() => daily.value.reduce((sum, item) => sum + item.count, 0))
const maxDaily = computed(() => Math.max(0, ...daily.value.map((item) => item.count)))
const averageDaily = computed(() => {
  if (!daily.value.length) return '0'
  const average = totalDaily.value / daily.value.length
  return Number.isInteger(average) ? String(average) : average.toFixed(1)
})
const rangeLabel = computed(() => {
  const range = dashboardData.value.range
  if (!range?.start || !range?.end) return '北京时间 · 近七天'
  return `${range.start.slice(5)}—${range.end.slice(5)} · ${range.timezone === 'Asia/Shanghai' ? '北京时间' : range.timezone}`
})
const hasTaxonomy = computed(() => dashboardData.value.categories.length || dashboardData.value.tags.length)

const quickActions = [
  { label: '发布新内容', description: '进入编辑器继续创作', path: '/dashboard/dynamics/create', icon: PlusOutlined },
  { label: '处理评论', description: '审核和维护读者讨论', path: '/dashboard/comments', icon: CommentOutlined },
  { label: '整理内容结构', description: '维护分类与主题关系', path: '/dashboard/category', icon: FolderOutlined }
]

function syncCommentCount(total) {
  const current = Number(total) || 0
  try {
    const seenValue = localStorage.getItem(COMMENT_COUNT_SEEN_KEY)
    if (seenValue === null) {
      commentCountChanged.value = current > 0
      return
    }
    const seen = Number(seenValue) || 0
    commentCountChanged.value = current > seen
    if (current < seen) localStorage.setItem(COMMENT_COUNT_SEEN_KEY, String(current))
  } catch {
    commentCountChanged.value = false
  }
}

function acknowledgeCommentCount() {
  const current = Number(dashboardData.value.total.comments) || 0
  try { localStorage.setItem(COMMENT_COUNT_SEEN_KEY, String(current)) } catch { /* storage unavailable */ }
  commentCountChanged.value = false
}

function taxonomyShare(item, items) {
  const peak = Math.max(1, ...items.map((entry) => entry.views))
  return Math.round((item.views / peak) * 100)
}

const formatNumber = value => new Intl.NumberFormat('zh-CN').format(Number(value) || 0)
const summaryValue = value => (loading.value || error.value ? '—' : value)
const riskLabel = level => ({ medium: '中风险', high: '高风险', critical: '严重风险' }[level] || '低风险')

async function loadStats() {
  loading.value = true
  error.value = ''
  try {
    dashboardData.value = mapDashboardData(await request.get('/api/stats/'))
    syncCommentCount(dashboardData.value.total.comments)
  } catch (reason) {
    error.value = reason?.message || '仪表盘数据加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadStats()
  commentNotifications.refresh()
})
</script>

<style scoped>
.dashboard-page { width: min(100%, 1600px); margin: 0 auto; color: var(--color-text); font-variant-numeric: tabular-nums; }
.dashboard-intro { display: grid; min-height: 184px; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: clamp(40px, 7vw, 110px); padding: clamp(28px, 3.5vw, 44px); border: 1px solid #18376d; border-radius: 22px 22px 8px 8px; background: linear-gradient(118deg, #0a1c3c 0%, #0a1c3c 58%, #112b5b 100%); color: white; box-shadow: 0 22px 54px rgb(20 39 82 / 17%); }
.intro-copy, .intro-actions { position: relative; z-index: 1; }
.section-label { color: var(--color-primary); font-size: 11px; font-weight: 750; letter-spacing: .08em; }
.dashboard-intro .section-label { color: #9bb4ff; }
.intro-copy h1 { max-width: 820px; margin: 12px 0 11px; color: white; font-size: clamp(32px, 3.4vw, 48px); letter-spacing: -.05em; line-height: .98; }
.intro-copy p { max-width: 560px; margin: 0; color: #bac8e3; font-size: 14px; line-height: 1.7; }
.intro-actions { display: grid; min-width: 170px; justify-items: end; }
.create-button { display: inline-flex; min-height: 44px; align-items: center; gap: 8px; padding: 0 18px; border-radius: 10px; background: #f4f7ff; color: #0a1c3c; font-size: 13px; font-weight: 760; box-shadow: 0 10px 24px rgb(0 0 0 / 18%); }
.dashboard-alert { margin-block: 16px; }
.metric-rail { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border: 1px solid var(--color-border); border-top: 0; border-radius: 0 0 16px 16px; background: #fff; box-shadow: var(--shadow-card); }
.metric-item { display: grid; min-width: 0; min-height: 132px; grid-template-rows: auto auto auto; align-content: center; justify-items: center; gap: 7px; padding: 20px clamp(18px, 2vw, 30px); border-right: 1px solid var(--color-border); transition: background var(--transition-fast); }
.metric-item:last-child { border-right: 0; }
.metric-item:hover { background: #f7f9ff; }
.metric-icon { color: var(--color-primary); font-size: 17px; }
.metric-label { display: inline-flex; align-items: center; color: var(--color-text-secondary); font-size: 11px; }
.metric-value-wrap { display: inline-flex; align-items: center; gap: 8px; }
.metric-unread-dot { width: 8px; height: 8px; flex: 0 0 auto; border-radius: 50%; background: #ef4444; box-shadow: 0 0 0 3px rgb(239 68 68 / 14%); }
.metric-value { color: var(--color-text); font-size: clamp(28px, 2.4vw, 36px); letter-spacing: -.04em; line-height: 1; }
.metric-skeleton { min-height: 132px; padding: 28px; border-right: 1px solid var(--color-border); }
.access-overview { display: grid; grid-template-columns: 1fr 1fr auto; align-items: center; gap: 24px; margin-top: 16px; padding: 16px 22px; border: 1px solid #dbe5ff; border-radius: 14px; background: linear-gradient(105deg, #f8faff, #fff); }
.access-overview div { display: flex; align-items: baseline; gap: 8px; }
.access-overview span { color: var(--color-text-secondary); font-size: 11px; }
.access-overview strong { color: var(--color-primary); font-size: 26px; letter-spacing: -.04em; }
.access-overview small { color: var(--color-text-muted); font-size: 10px; }
.access-overview a { display: inline-flex; align-items: center; gap: 6px; color: var(--color-primary); font-size: 12px; font-weight: 700; }
.operations-grid { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(360px, 1fr); align-items: stretch; gap: 20px; margin-top: 20px; }
.workspace-panel { border: 1px solid var(--color-border); border-radius: 16px; background: #fff; box-shadow: var(--shadow-card); }
.content-pulse { min-width: 0; min-height: 510px; padding: clamp(24px, 3vw, 38px); }
.panel-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 28px; }
.panel-heading h2, .quick-heading h2 { margin: 5px 0 0; font-size: 21px; letter-spacing: -.025em; }
.panel-range { display: block; margin-top: 6px; color: var(--color-text-muted); font-size: 11px; }
.panel-heading > a { display: inline-flex; min-height: 44px; align-items: center; gap: 7px; color: var(--color-primary); font-size: 12px; font-weight: 700; }
.trend-summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border-block: 1px solid var(--color-border); }
.trend-summary div { display: flex; min-width: 0; align-items: baseline; gap: 7px; padding: 18px 0; }
.trend-summary div + div { padding-left: clamp(18px, 3vw, 42px); border-left: 1px solid var(--color-border); }
.trend-summary span { color: var(--color-text-secondary); font-size: 11px; font-weight: 650; }
.trend-summary strong { font-size: clamp(25px, 3vw, 38px); letter-spacing: -.05em; line-height: 1; }
.trend-summary small { color: var(--color-text-muted); font-size: 10px; }
.trend-line-chart { margin-top: 20px; }
.panel-empty { display: grid; min-height: 330px; place-content: center; justify-items: center; gap: 8px; color: var(--color-text-muted); text-align: center; }
.panel-empty svg { margin-bottom: 6px; color: #a8b5c8; font-size: 28px; }
.panel-empty--error svg { color: #f59e0b; }
.panel-empty strong { color: var(--color-text); }
.panel-empty span, .compact-empty { color: var(--color-text-muted); font-size: 12px; }
.operations-side { display: grid; min-width: 0; }
.taxonomy-panel { padding: 26px; }
.taxonomy-panel .panel-heading { margin-bottom: 20px; }
.taxonomy-columns, .taxonomy-group, .taxonomy-list { display: grid; }
.taxonomy-columns { gap: 26px; }
.taxonomy-group { gap: 13px; }
.taxonomy-title { display: flex; align-items: center; justify-content: space-between; padding-bottom: 9px; border-bottom: 1px solid var(--color-border); }
.taxonomy-title span { color: var(--color-text-secondary); font-size: 11px; font-weight: 750; }
.taxonomy-title a { color: var(--color-primary); font-size: 11px; }
.taxonomy-list { gap: 13px; }
.taxonomy-item { display: grid; gap: 7px; }
.taxonomy-item > div { display: flex; min-width: 0; align-items: center; justify-content: space-between; gap: 12px; }
.taxonomy-item strong { overflow: hidden; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.taxonomy-item div span { flex: 0 0 auto; color: var(--color-text-muted); font-size: 10px; }
.taxonomy-item > i { overflow: hidden; height: 3px; border-radius: 2px; background: #edf0f5; }
.taxonomy-item > i span { display: block; height: 100%; border-radius: inherit; background: var(--color-primary); }
.compact-empty { padding-block: 24px; line-height: 1.7; }
.quick-actions { padding: 6px 4px 0; }
.quick-heading { padding: 4px 10px 10px; }
.quick-action { display: grid; min-height: 68px; grid-template-columns: 20px 1fr 14px; align-items: center; gap: 12px; padding: 12px 10px; border-bottom: 1px solid var(--color-border); transition: color var(--transition-fast), transform var(--transition-fast); }
.quick-action:hover { color: var(--color-primary); transform: translateX(3px); }
.quick-action > svg:first-child { color: var(--color-primary); font-size: 16px; }
.quick-action > svg:last-child { color: var(--color-text-muted); font-size: 10px; }
.quick-action div { display: grid; min-width: 0; gap: 3px; }
.quick-action strong { font-size: 12px; }
.quick-action span { overflow: hidden; color: var(--color-text-muted); font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
@media (max-width: 1180px) { .operations-grid { grid-template-columns: 1fr; } .operations-side { grid-template-columns: 1fr; } }
    @media (max-width: 820px) { .dashboard-intro { grid-template-columns: 1fr; align-items: start; } .intro-actions { min-width: 0; justify-items: start; } .metric-rail { grid-template-columns: repeat(2, minmax(0, 1fr)); } .metric-item:nth-child(2) { border-right: 0; } .metric-item:nth-child(-n + 2) { border-bottom: 1px solid var(--color-border); } .operations-side { grid-template-columns: 1fr; } }
    @media (max-width: 640px) { .dashboard-intro { min-height: 0; padding: 26px 22px; border-radius: 16px 16px 7px 7px; } .intro-copy h1 { font-size: 34px; } .intro-actions { width: 100%; } .create-button { justify-content: center; } .metric-rail { grid-template-columns: 1fr; } .metric-item, .metric-item:nth-child(2) { min-height: 88px; border-right: 0; border-bottom: 1px solid var(--color-border); } .metric-item:last-child { border-bottom: 0; } .access-overview { grid-template-columns: 1fr 1fr; gap: 12px; } .access-overview a { grid-column: 1 / -1; padding-top: 8px; } .content-pulse, .taxonomy-panel { padding: 20px; } .panel-heading { align-items: flex-start; flex-direction: column; gap: 8px; } .trend-summary { grid-template-columns: 1fr; } .trend-summary div, .trend-summary div + div { padding: 13px 0; border-left: 0; border-bottom: 1px solid var(--color-border); } .trend-summary div:last-child { border-bottom: 0; } .trend-line-chart { min-height: 220px; margin-inline: -8px; padding-top: 18px; } }

.insights-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; margin-top: 20px; }
.insight-card { display: flex; min-width: 0; flex-direction: column; padding: 24px; }
.insight-card .panel-heading { gap: 10px; align-items: center; margin-bottom: 22px; }
.insight-card .panel-heading h2 { font-size: 18px; }
.insight-card .panel-heading > a { flex-shrink: 0; font-size: 11px; }
.insight-kpis { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 22px 16px; padding: 20px 0; border-block: 1px solid #edf0f5; }
.insight-kpis > div { display: grid; gap: 8px; }
.insight-kpis > div > span { color: #7a8699; font-size: 11px; }
.insight-kpis strong { color: #1c2c48; font-size: clamp(24px, 2.3vw, 32px); line-height: 1; font-weight: 750; letter-spacing: -.04em; }
.insight-kpis small { font-size: 9px; color: #9aa4b3; }
.mini-chart { height: 140px; margin-top: 12px; }
.card-note { margin: auto 0 0; padding-top: 16px; font-size: 10px; color: #929caf; line-height: 1.6; }
.article-list-head { display: flex; justify-content: space-between; padding-bottom: 12px; border-bottom: 1px solid #edf0f5; color: #929caf; font-size: 10px; }
.hot-articles, .risk-ip-list { list-style: none; padding: 0; margin: 0; }
.hot-articles li { display: grid; grid-template-columns: 22px minmax(0, 1fr) auto; align-items: center; gap: 9px; min-height: 63px; border-bottom: 1px solid #edf0f5; }
.article-rank { font-size: 12px; color: #a5afbf; font-weight: 750; }
.article-rank--top { color: #315bea; }
.hot-articles a { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; color: #31415b; }
.hot-articles a:hover { color: #315bea; }
.article-counts { display: grid; gap: 4px; text-align: right; }
.article-counts strong { color: #31415b; font-size: 13px; }
.article-counts span { color: #929caf; font-size: 10px; }
.risk-medium, .insight-kpis .risk-medium { color: #f59e0b; }
.risk-high, .insight-kpis .risk-high { color: #f97316; }
.risk-critical, .insight-kpis .risk-critical { color: #ef4444; }
.risk-list-heading { padding: 18px 0 4px; color: #929caf; font-size: 10px; letter-spacing: .04em; }
.risk-ip-list li { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; gap: 10px; align-items: center; min-height: 42px; border-bottom: 1px solid #edf0f5; }
.risk-ip-address { overflow: hidden; text-overflow: ellipsis; font-size: 11px; font-variant-numeric: tabular-nums; }
.risk-badge { padding: 3px 5px; border-radius: 4px; background: #f8fafc; font-size: 10px; }
.risk-ip-list strong { font-size: 12px; }
.risk-ip-list small { color: #929caf; font-weight: 400; }
.quick-actions { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; margin-top: 20px; }
.quick-heading { grid-column: 1 / -1; }
@media (max-width: 1180px) { .insight-card { padding: 20px; } .insight-card .panel-heading { align-items: flex-start; flex-direction: column; gap: 2px; } }
@media (max-width: 900px) { .insights-grid { grid-template-columns: 1fr; } .insight-card .panel-heading { flex-direction: row; align-items: center; } .insight-kpis { grid-template-columns: repeat(4, minmax(0, 1fr)); } .quick-actions { grid-template-columns: 1fr; gap: 8px; } }
@media (max-width: 480px) { .insight-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } .insight-card .panel-heading { align-items: flex-start; flex-direction: column; } }
</style>
