<template>
  <div class="home-page">
    <section class="home-hero app-container" aria-labelledby="home-title">
      <div class="hero-copy">
        <p class="eyebrow">开发 · 记录 · 思考</p>
        <h1 id="home-title" aria-label="探索技术，无限可能">
          <span class="hero-title__lead">探索技术</span>
          <span class="hero-title__accent">无限可能</span>
        </h1>
        <p class="hero-description">
          记录开发经验、产品过程与持续构建中的判断，让每一次阅读都能通向下一步行动。
        </p>
      </div>
      <a class="hero-jump" href="#latest-articles">
        <span>查看最新文章</span>
        <span aria-hidden="true">↓</span>
      </a>
      <a class="topics-jump" href="#topics">按主题浏览 →</a>
    </section>

    <section id="latest-articles" ref="latestSection" class="latest-section home-lazy-section app-container" aria-labelledby="latest-title">
      <div class="section-heading">
        <div>
          <h2 id="latest-title">最新文章</h2>
        </div>
        <p>从最近一次更新开始，顺着真实问题进入文章。</p>
      </div>

      <AsyncState
        v-if="loading || error || !latest.length"
        :loading="loading"
        :error="error"
        :empty="!loading && !error && !latest.length"
        @retry="loadLatest"
      />
      <div v-else class="article-list">
        <router-link
          v-for="(item, index) in latest"
          :key="item.id"
          class="article-row"
          :to="`/blog/dynamics/${item.id}`"
        >
          <div class="article-body">
            <div class="article-meta">
              <span>{{ item.category?.name || '持续构建' }}</span>
              <time v-if="articleDate(item)" :datetime="articleDate(item)">{{ formatDate(item) }}</time>
            </div>
            <h3>{{ item.title }}</h3>
            <p>{{ excerpt(item) }}</p>
          </div>
          <span class="article-arrow" aria-hidden="true">↗</span>
        </router-link>
      </div>

      <router-link class="section-link" to="/blog/blogdynamic">
        浏览全部文章 <span aria-hidden="true">→</span>
      </router-link>
    </section>

    <section
      id="topics"
      ref="categorySection"
      class="topics-section home-lazy-section app-container"
      aria-labelledby="topics-title"
    >
      <div class="section-heading">
        <div>
          <h2 id="topics-title">主题分类</h2>
        </div>
        <p>按主题浏览，找到属于你的阅读路径。</p>
      </div>

      <div v-if="categoryLoading || (!categoriesLoaded && !categoryError)" class="category-skeleton" role="status" aria-label="正在加载主题分类">
        <span v-for="index in 4" :key="index" />
      </div>
      <div v-else-if="categoryError" class="category-error" role="alert">
        <p>{{ categoryError }}</p>
        <button type="button" @click="loadCategories">重新加载分类</button>
      </div>
      <div v-else-if="categories.length" class="category-list">
        <router-link v-for="(item, index) in categories" :key="item.id" class="category-row" :to="`/blog/categories/${item.id}/`">
          <span class="category-name">{{ item.name }}</span>
          <span class="category-description">{{ item.description || '沿着这个主题继续阅读。' }}</span>
          <span class="category-arrow" aria-hidden="true">↗</span>
        </router-link>
      </div>
      <p v-else class="category-empty">新的主题正在整理中。</p>
    </section>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { getBlogCategoryList, getRecentDynamics } from '@/api/blog'
import { normalizeCollectionResponse } from '@/api/collections'
import AsyncState from '@/components/common/AsyncState.vue'

const categorySection = ref(null)
const latestSection = ref(null)
const latest = ref([])
const categories = ref([])
const loading = ref(true)
const error = ref('')
const categoryLoading = ref(false)
const categoryError = ref('')
const categoriesLoaded = ref(false)
let categoryObserver
let latestObserver

const extractList = (response) => normalizeCollectionResponse(response).results

function excerpt(article) {
  return (article?.summary || article?.content || '点击阅读完整内容。')
    .replace(/[#>*_`\[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 110)
}

function articleDate(article) {
  return article?.published_at || article?.publishedAt || article?.created_at || article?.createdAt || ''
}

function formatDate(article) {
  const value = articleDate(article)
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}

async function loadLatest() {
  loading.value = true
  error.value = ''
  try {
    latest.value = extractList(await getRecentDynamics({ limit: 6 })).slice(0, 6)
  } catch (reason) {
    error.value = reason?.message || '请检查后端服务是否正常运行。'
  } finally {
    loading.value = false
  }
}

async function loadCategories() {
  if (categoriesLoaded.value || categoryLoading.value) return
  categoryLoading.value = true
  categoryError.value = ''
  try {
    categories.value = extractList(await getBlogCategoryList())
    categoriesLoaded.value = true
  } catch (reason) {
    categoryError.value = reason?.message || '主题分类暂时无法加载。'
  } finally {
    categoryLoading.value = false
  }
}

function observeCategories() {
  if (!categorySection.value) return
  if (!('IntersectionObserver' in window)) {
    loadCategories()
    return
  }

  categoryObserver = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      loadCategories()
      categoryObserver.disconnect()
    }
  }, { rootMargin: '240px 0px' })
  categoryObserver.observe(categorySection.value)
}

onMounted(() => {
  if ('IntersectionObserver' in window) {
    latestObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        latestObserver.disconnect()
        loadLatest()
      }
    }, { rootMargin: '240px 0px' })
    latestObserver.observe(latestSection.value)
  } else {
    loadLatest()
  }
  observeCategories()
})

onBeforeUnmount(() => {
  categoryObserver?.disconnect()
  latestObserver?.disconnect()
})
</script>

<style scoped>
.home-page {
  --home-ink: #27342f;
  --home-muted: #687068;
  --home-accent: #b85e2d;
  --home-line: #e5ddcf;
  color: var(--home-ink);
  padding-bottom: 64px;
}
.home-page .app-container { max-width: 1120px; }
.home-hero { display: flex; flex-wrap: wrap; align-content: center; align-items: center; gap: 0 24px; padding-block: 64px 44px; }
.hero-copy { flex-basis: 100%; }
.eyebrow { margin: 0 0 16px; color: var(--home-muted); font-size: 12px; letter-spacing: .12em; }
.hero-copy h1 { display: flex; flex-wrap: wrap; gap: 0 18px; margin: 0; font-size: clamp(34px, 4.3vw, 54px); font-weight: 750; letter-spacing: -.04em; line-height: 1.3; }
.hero-title__accent { color: var(--home-accent); }
.hero-description { max-width: 620px; margin: 18px 0 24px; color: var(--home-muted); font-size: 15px; line-height: 1.85; }
.hero-jump { display: inline-flex; align-items: center; gap: 18px; border-radius: 999px; background: #34453e; color: #fffaf2; padding: 11px 20px; font-size: 13px; }
.topics-jump { padding-block: 12px; color: var(--home-muted); font-size: 13px; }
.hero-jump:hover { background: #25372f; }
.topics-jump:hover, .section-link:hover { color: var(--home-accent); }
.home-lazy-section { content-visibility: auto; contain-intrinsic-size: 720px; scroll-margin-top: 94px; }
.latest-section { padding-block: 24px 40px; }
.section-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-bottom: 22px; }
.section-heading h2 { margin: 0; font-size: 25px; font-weight: 700; letter-spacing: -.025em; line-height: 1.4; }
.section-heading > p { margin: 0; color: var(--home-muted); font-size: 13px; line-height: 1.7; }
.article-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.article-row { display: grid; grid-template-columns: minmax(0, 1fr) 18px; gap: 16px; min-height: 178px; padding: 26px; border: 1px solid var(--home-line); border-radius: 18px; background: #fffaf2; transition: border-color .18s ease, background-color .18s ease; }
.article-row:hover { border-color: #bcb4a4; background: #fffcf6; }
.article-body { min-width: 0; }
.article-meta { display: flex; flex-wrap: wrap; gap: 8px 14px; align-items: center; font-size: 12px; line-height: 1.6; color: var(--home-accent); }
.article-meta time { color: var(--home-muted); font-variant-numeric: tabular-nums; }
.article-body h3 { margin: 12px 0 10px; font-size: 19px; line-height: 1.55; font-weight: 650; overflow-wrap: anywhere; }
.article-body p { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; margin: 0; color: var(--home-muted); font-size: 13px; line-height: 1.85; overflow-wrap: anywhere; }
.article-arrow { align-self: end; color: #8b9187; font-size: 18px; }
.section-link { display: table; margin: 24px auto 0; padding: 10px 18px; color: var(--home-muted); font-size: 13px; }
.section-link span { margin-left: 10px; }
.topics-section { padding-top: 32px; border-top: 1px solid var(--home-line); contain-intrinsic-size: auto 280px; }
.category-list { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.category-row { display: grid; grid-template-columns: minmax(0, 1fr) 16px; gap: 9px; padding: 20px; border: 1px solid var(--home-line); border-radius: 14px; background: #eee9df; transition: border-color .18s ease; }
.category-row:nth-child(4n + 2) { background: #e9ece3; }
.category-row:nth-child(4n + 3) { background: #f0e7db; }
.category-row:nth-child(4n + 4) { background: #ebe8e1; }
.category-row:hover { border-color: #bcb4a4; }
.category-name { font-size: 15px; font-weight: 650; overflow-wrap: anywhere; }
.category-description { grid-column: 1 / -1; color: var(--home-muted); font-size: 12px; line-height: 1.75; overflow-wrap: anywhere; }
.category-arrow { grid-column: 2; grid-row: 1; color: #838b7f; }
.category-skeleton { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; min-height: 110px; }
.category-skeleton span { border: 1px solid var(--home-line); border-radius: 14px; background: #eee9df; }
.category-error, .category-empty { color: var(--home-muted); font-size: 14px; padding-block: 20px; }
.category-error button { border: 1px solid var(--home-line); border-radius: 999px; padding: 9px 16px; background: #fffaf2; color: var(--home-ink); cursor: pointer; }
.home-page a:focus-visible, .home-page button:focus-visible { outline: 2px solid var(--home-accent); outline-offset: 4px; }
@media (max-width: 760px) {
  .home-hero { padding-block: 44px 28px; }
  .hero-copy h1 { gap: 0 12px; }
  .hero-description { font-size: 14px; }
  .section-heading { align-items: flex-start; flex-direction: column; gap: 6px; margin-bottom: 18px; }
  .section-heading h2 { font-size: 22px; }
  .article-list { grid-template-columns: 1fr; gap: 12px; }
  .article-row { min-height: 0; padding: 22px; }
  .article-body h3 { font-size: 18px; }
  .category-list, .category-skeleton { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .category-row { padding: 16px; }
  .home-page { padding-bottom: 40px; }
}
@media (prefers-reduced-motion: reduce) {
  .article-row, .category-row { transition: none; }
}
</style>
