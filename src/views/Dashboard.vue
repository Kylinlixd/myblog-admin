<template>
  <div class="dashboard-page">
    <section class="dashboard-intro">
      <div class="intro-copy">
        <span class="section-label">{{ currentDate }} · 内容运营台</span>
        <h1>欢迎回来，{{ userStore.nickname || '管理员' }}</h1>
        <p>看清内容节奏，处理读者反馈，然后继续今天的创作。</p>
      </div>
      <div class="intro-focus">
        <span>当前内容实体</span>
        <strong>{{ totalEntities }}</strong>
        <router-link class="create-button" to="/dashboard/dynamics/create">
          <plus-outlined /> 新建内容
        </router-link>
      </div>
    </section>

    <a-alert v-if="error" type="error" show-icon :message="error" class="dashboard-alert">
      <template #action><a-button size="small" @click="loadStats">重试</a-button></template>
    </a-alert>

    <section class="metric-rail" aria-label="内容统计">
      <template v-if="loading">
        <a-skeleton v-for="item in 4" :key="item" active :paragraph="false" class="metric-skeleton" />
      </template>
      <router-link v-else v-for="(item, index) in metrics" :key="item.key" :to="item.path" class="metric-item">
        <span class="metric-index">0{{ index + 1 }}</span>
        <component :is="item.icon" class="metric-icon" />
        <div><span>{{ item.label }}</span><strong>{{ item.value }}</strong></div>
        <right-outlined class="metric-arrow" />
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
          <div><span class="section-label">发布节奏</span><h2>近七天内容趋势</h2></div>
          <router-link to="/dashboard/dynamics">查看全部内容 <right-outlined /></router-link>
        </header>

        <div class="trend-summary" aria-label="近七天发布统计">
          <div><span>七天发布</span><strong>{{ totalDaily }}</strong><small>篇</small></div>
          <div><span>日均发布</span><strong>{{ averageDaily }}</strong><small>篇/天</small></div>
          <div><span>单日峰值</span><strong>{{ maxDaily }}</strong><small>篇</small></div>
        </div>

        <div v-if="daily.length" class="trend-line-chart">
          <svg viewBox="0 0 700 260" role="img" aria-labelledby="trend-chart-title trend-chart-description">
            <title id="trend-chart-title">近七天每日发布数量折线图</title>
            <desc id="trend-chart-description">七天共发布 {{ totalDaily }} 篇，峰值为 {{ maxDaily }} 篇。</desc>
            <defs>
              <linearGradient id="trend-area-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#315bea" stop-opacity=".24" />
                <stop offset="1" stop-color="#315bea" stop-opacity=".02" />
              </linearGradient>
            </defs>
            <g class="trend-guides" aria-hidden="true">
              <line v-for="y in [36, 112, 188]" :key="y" x1="36" :y1="y" x2="664" :y2="y" />
            </g>
            <g class="trend-axis" aria-hidden="true">
              <text x="8" y="40">{{ maxDaily }}</text>
              <text x="8" y="116">{{ Math.round(maxDaily / 2) }}</text>
              <text x="8" y="192">0</text>
            </g>
            <polygon class="trend-area" :points="trendAreaPoints" />
            <polyline class="trend-line" :points="trendLinePoints" />
            <g
              v-for="item in trendPoints"
              :key="item.day"
              class="trend-point"
              :class="{ 'trend-point--peak': item.isPeak }"
              tabindex="0"
              :aria-label="`${item.day}发布${item.count}篇`"
            >
              <circle :cx="item.x" :cy="item.y" r="5" />
              <circle v-if="item.isPeak" class="trend-highlight" :cx="item.x" :cy="item.y" r="13" />
              <text class="trend-value" :x="item.x" :y="item.y - 14">{{ item.count }}</text>
              <text class="trend-day" :x="item.x" y="238">{{ item.day }}</text>
            </g>
          </svg>
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
            <div><span class="section-label">内容脉络</span><h2>活跃主题</h2></div>
          </header>

          <div v-if="hasTaxonomy" class="taxonomy-columns">
            <div v-if="dashboardData.categories.length" class="taxonomy-group">
              <div class="taxonomy-title"><span>分类</span><router-link to="/dashboard/category">管理</router-link></div>
              <div class="taxonomy-list">
                <div v-for="item in dashboardData.categories" :key="`category-${item.name}`" class="taxonomy-item">
                  <div><strong>{{ item.name }}</strong><span>{{ item.count }} 篇</span></div>
                  <i><span :style="{ width: `${taxonomyShare(item, dashboardData.categories)}%` }" /></i>
                </div>
              </div>
            </div>
            <div v-if="dashboardData.tags.length" class="taxonomy-group">
              <div class="taxonomy-title"><span>标签</span><router-link to="/dashboard/tags">管理</router-link></div>
              <div class="taxonomy-list">
                <div v-for="item in dashboardData.tags" :key="`tag-${item.name}`" class="taxonomy-item">
                  <div><strong>{{ item.name }}</strong><span>{{ item.count }} 篇</span></div>
                  <i><span :style="{ width: `${taxonomyShare(item, dashboardData.tags)}%` }" /></i>
                </div>
              </div>
            </div>
          </div>
          <div v-else-if="!loading" class="compact-empty">分类与标签的发布数据会显示在这里。</div>
        </section>

        <section class="quick-actions" aria-label="快捷操作">
          <div class="quick-heading"><span class="section-label">下一步</span><h2>快捷操作</h2></div>
          <router-link v-for="action in quickActions" :key="action.path" :to="action.path" class="quick-action">
            <component :is="action.icon" />
            <div><strong>{{ action.label }}</strong><span>{{ action.description }}</span></div>
            <right-outlined />
          </router-link>
        </section>
      </aside>
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
  TagsOutlined
} from '@ant-design/icons-vue'

import request from '@/services/http/client'
import { useUserStore } from '@/stores/user'
import { mapDashboardData } from './dashboard/stats'

const userStore = useUserStore()
const currentDate = new Intl.DateTimeFormat('zh-CN', {
  month: 'long',
  day: 'numeric',
  weekday: 'long'
}).format(new Date())
const loading = ref(true)
const error = ref('')
const dashboardData = ref(mapDashboardData())

const metrics = computed(() => [
  { key: 'dynamics', label: '内容', value: dashboardData.value.total.dynamics, path: '/dashboard/dynamics', icon: FileTextOutlined },
  { key: 'categories', label: '分类', value: dashboardData.value.total.categories, path: '/dashboard/category', icon: FolderOutlined },
  { key: 'tags', label: '标签', value: dashboardData.value.total.tags, path: '/dashboard/tags', icon: TagsOutlined },
  { key: 'comments', label: '评论', value: dashboardData.value.total.comments, path: '/dashboard/comments', icon: CommentOutlined }
])
const totalEntities = computed(() => metrics.value.reduce((sum, item) => sum + item.value, 0))
const daily = computed(() => dashboardData.value.daily)
const totalDaily = computed(() => daily.value.reduce((sum, item) => sum + item.count, 0))
const maxDaily = computed(() => Math.max(0, ...daily.value.map((item) => item.count)))
const averageDaily = computed(() => {
  if (!daily.value.length) return '0'
  const average = totalDaily.value / daily.value.length
  return Number.isInteger(average) ? String(average) : average.toFixed(1)
})
const trendPoints = computed(() => {
  const left = 36
  const right = 664
  const top = 36
  const bottom = 188
  const divisor = Math.max(daily.value.length - 1, 1)
  const peak = Math.max(maxDaily.value, 1)

  return daily.value.map((item, index) => ({
    ...item,
    x: left + ((right - left) * index) / divisor,
    y: bottom - ((bottom - top) * item.count) / peak,
    isPeak: item.count > 0 && item.count === maxDaily.value
  }))
})
const trendLinePoints = computed(() => trendPoints.value.map((item) => `${item.x},${item.y}`).join(' '))
const trendAreaPoints = computed(() => {
  if (!trendPoints.value.length) return ''
  const first = trendPoints.value[0]
  const last = trendPoints.value[trendPoints.value.length - 1]
  return `${first.x},188 ${trendLinePoints.value} ${last.x},188`
})
const hasTaxonomy = computed(() => dashboardData.value.categories.length || dashboardData.value.tags.length)

const quickActions = [
  { label: '发布新内容', description: '进入编辑器继续创作', path: '/dashboard/dynamics/create', icon: PlusOutlined },
  { label: '处理评论', description: '审核和维护读者讨论', path: '/dashboard/comments', icon: CommentOutlined },
  { label: '整理内容结构', description: '维护分类与主题关系', path: '/dashboard/category', icon: FolderOutlined }
]

function taxonomyShare(item, items) {
  const peak = Math.max(1, ...items.map((entry) => entry.count))
  return Math.round((item.count / peak) * 100)
}

async function loadStats() {
  loading.value = true
  error.value = ''
  try {
    dashboardData.value = mapDashboardData(await request.get('/api/stats/'))
  } catch (reason) {
    error.value = reason?.message || '仪表盘数据加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(loadStats)
</script>

<style scoped>
.dashboard-page { width: min(100%, 1600px); margin: 0 auto; color: var(--color-text); font-variant-numeric: tabular-nums; }
.dashboard-intro { position: relative; display: grid; overflow: hidden; min-height: 224px; grid-template-columns: minmax(0, 1fr) auto; align-items: end; gap: clamp(40px, 7vw, 110px); padding: clamp(30px, 4vw, 54px); border: 1px solid #18376d; border-radius: 22px 22px 8px 8px; background: #0a1c3c; color: white; box-shadow: 0 22px 54px rgb(20 39 82 / 17%); }
.dashboard-intro::after { position: absolute; top: -170px; right: -110px; width: 480px; height: 480px; border-radius: 50%; background: radial-gradient(circle, rgb(68 113 240 / 38%), transparent 68%); content: ''; pointer-events: none; }
.intro-copy, .intro-focus { position: relative; z-index: 1; }
.section-label { color: var(--color-primary); font-size: 11px; font-weight: 750; letter-spacing: .08em; }
.dashboard-intro .section-label { color: #9bb4ff; }
.intro-copy h1 { max-width: 820px; margin: 12px 0 11px; color: white; font-size: clamp(34px, 4vw, 54px); letter-spacing: -.05em; line-height: .98; }
.intro-copy p { max-width: 560px; margin: 0; color: #bac8e3; font-size: 14px; line-height: 1.7; }
.intro-focus { display: grid; min-width: 250px; justify-items: end; }
.intro-focus > span { color: #91a3c4; font-size: 11px; }
.intro-focus > strong { margin: 4px 0 19px; color: white; font-size: clamp(46px, 5vw, 68px); letter-spacing: -.06em; line-height: .9; }
.create-button { display: inline-flex; min-height: 44px; align-items: center; gap: 8px; padding: 0 18px; border-radius: 10px; background: #f4f7ff; color: #0a1c3c; font-size: 13px; font-weight: 760; box-shadow: 0 10px 24px rgb(0 0 0 / 18%); }
.dashboard-alert { margin-block: 16px; }
.metric-rail { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border: 1px solid var(--color-border); border-top: 0; border-radius: 0 0 16px 16px; background: #fff; box-shadow: var(--shadow-card); }
.metric-item { display: grid; min-width: 0; min-height: 112px; grid-template-columns: auto auto 1fr auto; align-items: center; gap: 14px; padding: 20px clamp(18px, 2vw, 30px); border-right: 1px solid var(--color-border); transition: background var(--transition-fast); }
.metric-item:last-child { border-right: 0; }
.metric-item:hover { background: #f7f9ff; }
.metric-index { color: #a8b1c1; font-size: 10px; font-weight: 750; letter-spacing: .08em; }
.metric-icon { color: var(--color-primary); font-size: 18px; }
.metric-item div { display: grid; gap: 4px; }
.metric-item div span { color: var(--color-text-secondary); font-size: 11px; }
.metric-item div strong { font-size: clamp(26px, 2.4vw, 36px); letter-spacing: -.04em; line-height: 1; }
.metric-arrow { color: #aeb7c6; font-size: 11px; }
.metric-skeleton { min-height: 112px; padding: 28px; border-right: 1px solid var(--color-border); }
.access-overview { display: grid; grid-template-columns: 1fr 1fr auto; align-items: center; gap: 24px; margin-top: 16px; padding: 16px 22px; border: 1px solid #dbe5ff; border-radius: 14px; background: linear-gradient(105deg, #f8faff, #fff); }
.access-overview div { display: flex; align-items: baseline; gap: 8px; }
.access-overview span { color: var(--color-text-secondary); font-size: 11px; }
.access-overview strong { color: var(--color-primary); font-size: 26px; letter-spacing: -.04em; }
.access-overview small { color: var(--color-text-muted); font-size: 10px; }
.access-overview a { display: inline-flex; align-items: center; gap: 6px; color: var(--color-primary); font-size: 12px; font-weight: 700; }
.operations-grid { display: grid; grid-template-columns: minmax(0, 9fr) minmax(300px, 3fr); align-items: start; gap: 20px; margin-top: 20px; }
.workspace-panel { border: 1px solid var(--color-border); border-radius: 16px; background: #fff; box-shadow: var(--shadow-card); }
.content-pulse { min-width: 0; min-height: 570px; padding: clamp(24px, 3vw, 38px); }
.panel-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 28px; }
.panel-heading h2, .quick-heading h2 { margin: 5px 0 0; font-size: 21px; letter-spacing: -.025em; }
.panel-heading > a { display: inline-flex; min-height: 44px; align-items: center; gap: 7px; color: var(--color-primary); font-size: 12px; font-weight: 700; }
.trend-summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border-block: 1px solid var(--color-border); }
.trend-summary div { display: flex; min-width: 0; align-items: baseline; gap: 7px; padding: 18px 0; }
.trend-summary div + div { padding-left: clamp(18px, 3vw, 42px); border-left: 1px solid var(--color-border); }
.trend-summary span { color: var(--color-text-secondary); font-size: 11px; font-weight: 650; }
.trend-summary strong { font-size: clamp(25px, 3vw, 38px); letter-spacing: -.05em; line-height: 1; }
.trend-summary small { color: var(--color-text-muted); font-size: 10px; }
.trend-line-chart { min-height: 330px; padding-top: 26px; }
.trend-line-chart svg { display: block; width: 100%; height: auto; overflow: visible; }
.trend-guides line { stroke: #e8edf5; stroke-width: 1; stroke-dasharray: 4 7; }
.trend-area { fill: url(#trend-area-fill); }
.trend-line { fill: none; stroke: var(--color-primary); stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; filter: drop-shadow(0 8px 12px rgb(49 91 234 / 16%)); }
.trend-point { outline: 0; }
.trend-point circle { fill: white; stroke: #7390ed; stroke-width: 4; transition: r var(--transition-fast), fill var(--transition-fast); }
.trend-point .trend-highlight { fill: none; stroke: #315bea; stroke-width: 1.5; stroke-dasharray: 3 4; opacity: .72; }
.trend-point--peak circle { fill: var(--color-primary); stroke: #dce5ff; }
.trend-point:hover circle, .trend-point:focus-visible circle { r: 8; fill: var(--color-primary); }
.trend-point:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 5px; }
.trend-value, .trend-day { fill: #55647b; font-size: 11px; font-weight: 700; text-anchor: middle; }
.trend-point--peak .trend-value { fill: var(--color-primary); }
.trend-day { fill: var(--color-text-secondary); font-size: 10px; font-weight: 650; }
.trend-axis text { fill: var(--color-text-muted); font-size: 10px; font-weight: 700; text-anchor: end; }
.panel-empty { display: grid; min-height: 330px; place-content: center; justify-items: center; gap: 8px; color: var(--color-text-muted); text-align: center; }
.panel-empty svg { margin-bottom: 6px; color: #a8b5c8; font-size: 28px; }
.panel-empty strong { color: var(--color-text); }
.panel-empty span, .compact-empty { color: var(--color-text-muted); font-size: 12px; }
.operations-side { display: grid; gap: 20px; }
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
@media (max-width: 1180px) { .operations-grid { grid-template-columns: 1fr; } .operations-side { grid-template-columns: minmax(0, 1fr) minmax(280px, .72fr); } }
@media (max-width: 820px) { .dashboard-intro { grid-template-columns: 1fr; align-items: start; } .intro-focus { min-width: 0; grid-template-columns: 1fr auto; align-items: center; justify-items: start; gap: 0 18px; } .intro-focus > strong { grid-row: span 2; margin: 0; } .create-button { grid-column: 1; } .metric-rail { grid-template-columns: repeat(2, minmax(0, 1fr)); } .metric-item:nth-child(2) { border-right: 0; } .metric-item:nth-child(-n + 2) { border-bottom: 1px solid var(--color-border); } .operations-side { grid-template-columns: 1fr; } }
@media (max-width: 640px) { .dashboard-intro { min-height: 0; padding: 26px 22px; border-radius: 16px 16px 7px 7px; } .intro-copy h1 { font-size: 34px; } .intro-focus { grid-template-columns: 1fr; gap: 10px; } .intro-focus > strong { grid-row: auto; } .metric-rail { grid-template-columns: 1fr; } .metric-item, .metric-item:nth-child(2) { min-height: 88px; border-right: 0; border-bottom: 1px solid var(--color-border); } .metric-item:last-child { border-bottom: 0; } .access-overview { grid-template-columns: 1fr 1fr; gap: 12px; } .access-overview a { grid-column: 1 / -1; padding-top: 8px; } .content-pulse, .taxonomy-panel { padding: 20px; } .panel-heading { align-items: flex-start; flex-direction: column; gap: 8px; } .trend-summary { grid-template-columns: 1fr; } .trend-summary div, .trend-summary div + div { padding: 13px 0; border-left: 0; border-bottom: 1px solid var(--color-border); } .trend-summary div:last-child { border-bottom: 0; } .trend-line-chart { min-height: 220px; margin-inline: -8px; padding-top: 18px; } }
</style>
