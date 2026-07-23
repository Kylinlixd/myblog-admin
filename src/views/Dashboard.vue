<template>
  <div class="dashboard-page">
    <header class="dashboard-heading">
      <div><span class="page-kicker">OVERVIEW</span><h1>欢迎回来，{{ userStore.nickname || '管理员' }}</h1><p>快速了解博客内容状态，并继续今天的创作。</p></div>
      <router-link class="create-button" to="/dashboard/dynamics/create"><plus-outlined /> 新建内容</router-link>
    </header>

    <a-alert v-if="error" type="error" show-icon :message="error" class="dashboard-alert">
      <template #action><a-button size="small" @click="loadStats">重试</a-button></template>
    </a-alert>

    <section class="stats-grid" aria-label="内容统计">
      <a-skeleton v-if="loading" v-for="item in 4" :key="item" active class="stat-card" />
      <article v-else v-for="item in statCards" :key="item.key" class="stat-card">
        <div class="stat-icon" :style="{ color: item.color, background: item.background }"><component :is="item.icon" /></div>
        <div><span>{{ item.label }}</span><strong>{{ item.value }}</strong></div>
        <router-link :to="item.path" :aria-label="`管理${item.label}`"><export-outlined /></router-link>
      </article>
    </section>

    <section class="dashboard-grid">
      <article class="panel trend-panel">
        <div class="panel-heading"><div><span class="page-kicker">ACTIVITY</span><h2>近七天发布趋势</h2></div><router-link to="/dashboard/dynamics">内容管理</router-link></div>
        <div v-if="daily.length" class="trend-dashboard">
          <div class="trend-summary" aria-label="近七天发布统计">
            <div><span>7天发布</span><strong>{{ totalDaily }}</strong><small>篇内容</small></div>
            <div><span>日均发布</span><strong>{{ averageDaily }}</strong><small>篇/天</small></div>
            <div><span>单日峰值</span><strong>{{ maxDaily }}</strong><small>篇内容</small></div>
          </div>

          <div class="trend-chart" role="img" aria-label="近七天每日发布数量柱状图">
            <div class="trend-gridline"></div>
            <div class="trend-gridline trend-gridline--middle"></div>
            <div
              v-for="item in trendColumns"
              :key="item.day"
              class="trend-column"
              :class="{ 'trend-column--peak': item.isPeak }"
            >
              <div class="trend-bar-track">
                <span v-if="item.isPeak && item.count > 0" class="trend-peak">峰值</span>
                <div class="trend-bar" :style="{ height: item.height }">
                  <strong>{{ item.count }}</strong>
                </div>
              </div>
              <time>{{ item.day }}</time>
            </div>
          </div>
        </div>
        <div v-else class="panel-empty"><read-outlined /><strong>最近还没有发布记录</strong><span>创建一篇内容后，趋势会显示在这里。</span></div>
      </article>

      <aside class="panel quick-panel">
        <div class="panel-heading"><div><span class="page-kicker">QUICK ACTIONS</span><h2>快捷操作</h2></div></div>
        <router-link v-for="action in quickActions" :key="action.path" :to="action.path" class="quick-action"><span><component :is="action.icon" /></span><div><strong>{{ action.label }}</strong><small>{{ action.description }}</small></div><right-outlined /></router-link>
      </aside>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { CommentOutlined, ExportOutlined, FileTextOutlined, FolderOutlined, PlusOutlined, ReadOutlined, RightOutlined, TagsOutlined } from '@ant-design/icons-vue'
import request from '@/services/http/client'
import { useUserStore } from '@/stores/user'
import { mapDashboardStats } from './dashboard/stats'

const userStore = useUserStore()
const loading = ref(true)
const error = ref('')
const stats = ref(mapDashboardStats())
const daily = ref([])
const maxDaily = computed(() => Math.max(...daily.value.map((item) => item.count), 1))
const totalDaily = computed(() => daily.value.reduce((sum, item) => sum + (Number(item.count) || 0), 0))
const averageDaily = computed(() => {
  if (!daily.value.length) return '0'
  const average = totalDaily.value / daily.value.length
  return Number.isInteger(average) ? String(average) : average.toFixed(1)
})
const trendColumns = computed(() => daily.value.map((item) => {
  const count = Number(item.count) || 0
  const ratio = count / maxDaily.value
  return {
    ...item,
    count,
    height: `${Math.max(count > 0 ? 18 : 6, ratio * 100)}%`,
    isPeak: count === maxDaily.value && maxDaily.value > 0
  }
}))
const statCards = computed(() => [
  { key: 'dynamics', label: '内容总数', value: stats.value.dynamics, path: '/dashboard/dynamics', icon: FileTextOutlined, color: '#315bea', background: '#eef3ff' },
  { key: 'categories', label: '分类总数', value: stats.value.categories, path: '/dashboard/category', icon: FolderOutlined, color: '#d97706', background: '#fff7e8' },
  { key: 'tags', label: '标签总数', value: stats.value.tags, path: '/dashboard/tags', icon: TagsOutlined, color: '#7c3aed', background: '#f4efff' },
  { key: 'comments', label: '评论总数', value: stats.value.comments, path: '/dashboard/comments', icon: CommentOutlined, color: '#0f9f75', background: '#eafaf4' }
])
const quickActions = [
  { label: '发布新内容', description: '撰写并发布一篇新的博客内容', path: '/dashboard/dynamics/create', icon: PlusOutlined },
  { label: '处理评论', description: '查看并审核读者留言', path: '/dashboard/comments', icon: CommentOutlined },
  { label: '整理分类', description: '维护清晰的内容结构', path: '/dashboard/category', icon: FolderOutlined }
]

async function loadStats() {
  loading.value = true; error.value = ''
  try {
    const response = await request.get('/api/stats/')
    stats.value = mapDashboardStats(response)
    daily.value = response?.data?.daily || []
  } catch (reason) {
    error.value = reason?.message || '仪表盘数据加载失败'
  } finally { loading.value = false }
}
onMounted(loadStats)
</script>

<style scoped>
.dashboard-page { width: min(100%, 1380px); margin: 0 auto; }
.dashboard-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 28px; }
.page-kicker { color: var(--color-primary); font-size: 10px; font-weight: 800; letter-spacing: .16em; }
.dashboard-heading h1 { margin: 5px 0 4px; color: var(--color-text); font-size: clamp(25px, 3vw, 34px); letter-spacing: -.025em; }
.dashboard-heading p { margin: 0; color: var(--color-text-secondary); }
.create-button { display: inline-flex; min-height: 44px; align-items: center; gap: 8px; padding: 0 18px; border-radius: 999px; background: var(--color-primary); color: white; font-weight: 700; box-shadow: 0 10px 22px rgb(49 91 234 / 20%); }
.dashboard-alert { margin-bottom: 18px; }
.stats-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 18px; }
.stat-card { display: flex; min-height: 126px; align-items: center; gap: 15px; padding: 22px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: white; box-shadow: var(--shadow-card); }
.stat-icon { display: grid; width: 48px; height: 48px; flex: 0 0 auto; place-items: center; border-radius: 13px; font-size: 21px; }
.stat-card > div:nth-child(2) { display: flex; min-width: 0; flex-direction: column; }
.stat-card span { color: var(--color-text-secondary); font-size: 12px; }
.stat-card strong { color: var(--color-text); font-size: 28px; line-height: 1.25; }
.stat-card > a { margin-left: auto; color: var(--color-text-muted); }
.dashboard-grid { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(300px, .65fr); align-items: start; gap: 18px; margin-top: 18px; }
.panel { min-height: 360px; padding: 26px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: white; box-shadow: var(--shadow-card); }
.panel-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 28px; }
.panel-heading h2 { margin: 4px 0 0; font-size: 20px; }
.panel-heading > a { color: var(--color-primary); font-size: 12px; font-weight: 700; }
.trend-panel { overflow: hidden; }
.trend-dashboard { display: grid; gap: 24px; }
.trend-summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1px; overflow: hidden; border: 1px solid #dbe5ff; border-radius: 8px; background: #dbe5ff; }
.trend-summary div { display: grid; gap: 4px; padding: 16px 18px; background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%); }
.trend-summary span { color: var(--color-text-secondary); font-size: 12px; font-weight: 700; }
.trend-summary strong { color: var(--color-text); font-size: 26px; line-height: 1; }
.trend-summary small { color: var(--color-text-muted); font-size: 11px; }
.trend-chart { position: relative; display: grid; min-height: 236px; grid-template-columns: repeat(7, minmax(0, 1fr)); align-items: end; gap: 14px; padding: 22px 2px 0; }
.trend-gridline { position: absolute; right: 0; left: 0; top: 42px; height: 1px; background: linear-gradient(90deg, transparent, #e2e8f0 12%, #e2e8f0 88%, transparent); }
.trend-gridline--middle { top: 122px; opacity: .75; }
.trend-column { position: relative; z-index: 1; display: grid; min-width: 0; grid-template-rows: 1fr auto; gap: 10px; align-self: stretch; }
.trend-bar-track { position: relative; display: flex; min-height: 188px; align-items: flex-end; justify-content: center; border-radius: 8px; background: linear-gradient(180deg, #f8fafc 0%, #eef3ff 100%); }
.trend-bar { position: relative; width: min(54px, 68%); min-height: 8px; border-radius: 8px 8px 4px 4px; background: linear-gradient(180deg, #37bdf8 0%, #315bea 68%, #2142b8 100%); box-shadow: 0 12px 22px rgb(49 91 234 / 20%); transition: height .2s ease; }
.trend-bar strong { position: absolute; right: 50%; bottom: calc(100% + 7px); transform: translateX(50%); color: var(--color-text); font-size: 12px; line-height: 1; }
.trend-column time { overflow: hidden; color: var(--color-text-secondary); font-size: 11px; font-weight: 700; text-align: center; text-overflow: ellipsis; white-space: nowrap; }
.trend-column--peak .trend-bar { background: linear-gradient(180deg, #34d399 0%, #0f9f75 100%); box-shadow: 0 12px 22px rgb(15 159 117 / 20%); }
.trend-peak { position: absolute; top: -13px; left: 50%; z-index: 2; padding: 3px 7px; border-radius: 999px; background: #0f9f75; color: white; font-size: 10px; font-weight: 800; transform: translateX(-50%); white-space: nowrap; }
.panel-empty { display: grid; min-height: 230px; place-items: center; align-content: center; gap: 7px; color: var(--color-text-muted); text-align: center; }
.panel-empty svg { margin-bottom: 7px; font-size: 28px; }
.panel-empty strong { color: var(--color-text); }
.panel-empty span { font-size: 12px; }
.quick-panel { min-height: 360px; }
.quick-action { display: grid; grid-template-columns: 42px 1fr 16px; align-items: center; gap: 12px; padding: 14px 0; border-bottom: 1px solid var(--color-border); }
.quick-action > span { display: grid; width: 40px; height: 40px; place-items: center; border-radius: 11px; background: var(--color-primary-soft); color: var(--color-primary); }
.quick-action div { display: flex; min-width: 0; flex-direction: column; }
.quick-action strong { font-size: 13px; }
.quick-action small { overflow: hidden; color: var(--color-text-muted); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.quick-action > svg { color: var(--color-text-muted); }
@media (max-width: 1080px) { .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .dashboard-grid { grid-template-columns: 1fr; } }
@media (max-width: 760px) { .trend-summary { grid-template-columns: 1fr; } .trend-chart { gap: 8px; min-height: 214px; } .trend-bar-track { min-height: 166px; } .trend-bar { width: min(38px, 72%); } .trend-column time { font-size: 10px; } }
@media (max-width: 600px) { .dashboard-heading { align-items: stretch; flex-direction: column; } .create-button { justify-content: center; } .stats-grid { grid-template-columns: 1fr; } .stat-card { min-height: 104px; } .panel { padding: 20px; } }
</style>
