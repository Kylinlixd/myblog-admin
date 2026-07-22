<template>
  <div class="home-page">
    <section class="hero app-container">
      <div class="hero-copy">
        <span class="eyebrow">LIXD · PERSONAL NOTES</span>
        <h1>记录技术实践，<br /><em>也记录持续成长。</em></h1>
        <p>这里整理 Vue、Django 与产品开发中的真实经验，也分享生活中的观察和思考。</p>
        <div class="hero-actions">
          <router-link class="primary-action" to="/blog/blogdynamic">开始阅读 <arrow-right-outlined /></router-link>
          <router-link class="secondary-action" to="/blog/about">了解作者</router-link>
        </div>
      </div>
      <div class="hero-panel">
        <span>正在持续更新</span>
        <strong>{{ latest.length }}</strong>
        <p>篇近期内容</p>
        <div class="hero-tags"><span v-for="tag in tags.slice(0, 4)" :key="tag.id"># {{ tag.name }}</span></div>
      </div>
    </section>

    <section class="content-section app-container">
      <div class="latest-column surface-card">
        <div class="section-heading">
          <div><span class="eyebrow">LATEST</span><h2>最近更新</h2></div>
          <router-link to="/blog/blogdynamic">查看全部 <arrow-right-outlined /></router-link>
        </div>
        <AsyncState v-if="loading || error || !latest.length" :loading="loading" :error="error" :empty="!loading && !error && !latest.length" @retry="loadHome" />
        <div v-else class="article-list"><ArticleCard v-for="item in latest" :key="item.id" :article="item" /></div>
      </div>

      <aside class="discover-column">
        <section class="discover-card surface-card">
          <span class="eyebrow">POPULAR</span><h2>热门内容</h2>
          <router-link v-for="(item, index) in hot.slice(0, 5)" :key="item.id" :to="`/blog/dynamics/${item.id}`" class="popular-item">
            <span>{{ String(index + 1).padStart(2, '0') }}</span><strong>{{ item.title }}</strong>
          </router-link>
        </section>
        <section class="discover-card surface-card">
          <span class="eyebrow">EXPLORE</span><h2>按主题探索</h2>
          <div class="topic-list"><router-link v-for="item in categories.slice(0, 8)" :key="item.id" :to="`/blog/categories/${item.id}/`">{{ item.name }}</router-link></div>
        </section>
      </aside>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ArrowRightOutlined } from '@ant-design/icons-vue'
import { getBlogCategoryList, getBlogTagList, getHotDynamics, getRecentDynamics } from '@/api/blog'
import ArticleCard from '@/components/blog/ArticleCard.vue'
import AsyncState from '@/components/common/AsyncState.vue'

const latest = ref([])
const hot = ref([])
const categories = ref([])
const tags = ref([])
const loading = ref(true)
const error = ref('')

const extractList = (response) => {
  const data = response?.data ?? response
  return data?.items || data?.list || (Array.isArray(data) ? data : [])
}

async function loadHome() {
  loading.value = true
  error.value = ''
  try {
    const [recentResult, hotResult, categoryResult, tagResult] = await Promise.all([
      getRecentDynamics({ limit: 6 }), getHotDynamics({ limit: 5 }), getBlogCategoryList(), getBlogTagList()
    ])
    latest.value = extractList(recentResult)
    hot.value = extractList(hotResult)
    categories.value = extractList(categoryResult)
    tags.value = extractList(tagResult)
  } catch (reason) {
    error.value = reason?.message || '请检查后端服务是否正常运行。'
  } finally {
    loading.value = false
  }
}

onMounted(loadHome)
</script>

<style scoped>
.home-page { padding: 44px 0 72px; }
.hero { display: grid; min-height: 430px; grid-template-columns: minmax(0, 1.45fr) minmax(280px, .55fr); align-items: center; gap: 56px; padding-block: 46px 70px; }
.eyebrow { color: var(--color-primary); font-size: 11px; font-weight: 800; letter-spacing: .16em; }
.hero h1 { max-width: 760px; margin: 15px 0 22px; color: var(--color-text); font-size: clamp(42px, 6.2vw, 76px); letter-spacing: -.055em; line-height: 1.06; }
.hero h1 em { color: var(--color-primary); font-style: normal; }
.hero-copy > p { max-width: 650px; color: var(--color-text-secondary); font-size: 17px; }
.hero-actions { display: flex; margin-top: 30px; gap: 12px; }
.primary-action, .secondary-action { display: inline-flex; min-height: 46px; align-items: center; justify-content: center; gap: 9px; padding: 0 20px; border-radius: 999px; font-weight: 700; }
.primary-action { background: var(--color-primary); color: white; box-shadow: 0 10px 24px rgb(49 91 234 / 22%); }
.secondary-action { border: 1px solid var(--color-border); background: white; }
.hero-panel { position: relative; overflow: hidden; padding: 32px; border: 1px solid #dbe4fb; border-radius: 24px; background: linear-gradient(145deg, #fff, #eef3ff); box-shadow: var(--shadow-float); }
.hero-panel::after { position: absolute; width: 180px; height: 180px; border-radius: 50%; background: rgb(49 91 234 / 8%); content: ''; right: -70px; top: -70px; }
.hero-panel > span, .hero-panel > p { color: var(--color-text-secondary); }
.hero-panel > strong { display: block; margin-top: 16px; color: var(--color-primary); font-size: 72px; line-height: 1; }
.hero-panel > p { margin: 6px 0 24px; }
.hero-tags { display: flex; flex-wrap: wrap; gap: 8px; }
.hero-tags span { padding: 5px 9px; border-radius: 999px; background: white; color: var(--color-text-secondary); font-size: 12px; }
.content-section { display: grid; grid-template-columns: minmax(0, 1fr) 330px; align-items: start; gap: 24px; }
.latest-column { padding: 30px; }
.section-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; padding-bottom: 12px; }
.section-heading h2, .discover-card h2 { margin: 5px 0 0; font-size: 24px; }
.section-heading > a { color: var(--color-primary); font-size: 13px; font-weight: 650; }
.discover-column { display: grid; gap: 20px; }
.discover-card { padding: 24px; }
.popular-item { display: grid; grid-template-columns: 32px 1fr; gap: 10px; padding: 13px 0; border-bottom: 1px solid var(--color-border); }
.popular-item > span { color: var(--color-primary); font: 700 12px ui-monospace, monospace; }
.popular-item strong { font-size: 14px; line-height: 1.45; }
.topic-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
.topic-list a { padding: 7px 10px; border-radius: 999px; background: var(--color-primary-soft); color: var(--color-primary); font-size: 12px; font-weight: 650; }
@media (max-width: 900px) { .hero { min-height: auto; grid-template-columns: 1fr; gap: 30px; padding-block: 28px 48px; } .hero-panel { display: none; } .content-section { grid-template-columns: 1fr; } .discover-column { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 620px) { .home-page { padding-top: 22px; } .hero h1 { font-size: 43px; } .hero-actions { align-items: stretch; flex-direction: column; } .latest-column { padding: 20px; } .discover-column { grid-template-columns: 1fr; } }
</style>
