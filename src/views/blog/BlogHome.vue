<template>
  <main class="home-page">
    <section class="home-hero app-container" aria-labelledby="home-title">
      <div class="hero-copy">
        <p class="eyebrow">LIXD / TECHNICAL NOTES</p>
        <h1 id="home-title" aria-label="探索技术，无限可能">
          <span class="hero-title__lead">探索技术</span>
          <span class="hero-title__accent">无限可能。</span>
        </h1>
        <p class="hero-description">
          记录开发经验、产品过程与持续构建中的判断，让每一次阅读都能通向下一步行动。
        </p>
        <div class="hero-meta" aria-label="博客信息">
          <span>最新文章</span>
          <span aria-hidden="true">·</span>
          <span>持续更新</span>
        </div>
      </div>
      <a class="hero-jump" href="#latest-articles">
        <span>查看最新文章</span>
        <span aria-hidden="true">↓</span>
      </a>
    </section>

    <section id="latest-articles" class="latest-section home-lazy-section app-container" aria-labelledby="latest-title">
      <div class="section-heading">
        <div>
          <p class="eyebrow">01 / LATEST</p>
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
          <span class="article-index">{{ String(index + 1).padStart(2, '0') }}</span>
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
          <p class="eyebrow">02 / TOPICS</p>
          <h2 id="topics-title">主题分类</h2>
        </div>
        <p>按主题浏览，找到属于你的阅读路径。</p>
      </div>

      <div v-if="categoryLoading" class="category-skeleton" role="status" aria-label="正在加载主题分类">
        <span v-for="index in 4" :key="index" />
      </div>
      <div v-else-if="categoryError" class="category-error" role="alert">
        <p>{{ categoryError }}</p>
        <button type="button" @click="loadCategories">重新加载分类</button>
      </div>
      <div v-else-if="categories.length" class="category-list">
        <router-link v-for="(item, index) in categories" :key="item.id" class="category-row" :to="`/blog/categories/${item.id}/`">
          <span class="category-index">{{ String(index + 1).padStart(2, '0') }}</span>
          <span class="category-name">{{ item.name }}</span>
          <span class="category-description">{{ item.description || '沿着这个主题继续阅读。' }}</span>
          <span class="category-arrow" aria-hidden="true">↗</span>
        </router-link>
      </div>
      <p v-else class="category-empty">新的主题正在整理中。</p>
    </section>
  </main>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { getBlogCategoryList, getRecentDynamics } from '@/api/blog'
import { normalizeCollectionResponse } from '@/api/collections'
import AsyncState from '@/components/common/AsyncState.vue'

const categorySection = ref(null)
const latest = ref([])
const categories = ref([])
const loading = ref(true)
const error = ref('')
const categoryLoading = ref(false)
const categoryError = ref('')
const categoriesLoaded = ref(false)
let categoryObserver

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
    latest.value = extractList(await getRecentDynamics({ limit: 8 }))
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
  loadLatest()
  observeCategories()
})

onBeforeUnmount(() => categoryObserver?.disconnect())
</script>

<style scoped>
.home-page {
  --home-ink: #172436;
  --home-muted: #6c716d;
  --home-soft: #918b80;
  --home-line: rgb(78 62 45 / 16%);
  --home-line-strong: rgb(78 62 45 / 28%);
  --home-accent: #b85e2d;
  width: 100%;
  overflow: hidden;
  color: var(--home-ink);
}

.home-hero {
  display: flex;
  min-height: clamp(510px, calc(100dvh - 62px), 700px);
  flex-direction: column;
  justify-content: center;
  padding-block: 104px 92px;
}

.hero-copy { max-width: 820px; }
.eyebrow { margin: 0; color: var(--home-accent); font-size: 11px; font-weight: 750; letter-spacing: .16em; line-height: 1.4; }
.hero-copy h1 { max-width: 820px; margin: 22px 0 28px; font-size: clamp(3.8rem, 9vw, 8rem); font-weight: 760; letter-spacing: -.085em; line-height: .92; text-wrap: balance; }
.hero-title__lead, .hero-title__accent { display: block; }
.hero-title__accent { color: var(--home-accent); }
.hero-description { max-width: 540px; margin: 0; color: var(--home-muted); font-size: clamp(15px, 1.5vw, 18px); line-height: 1.85; }
.hero-meta { display: flex; align-items: center; gap: 12px; margin-top: 30px; color: var(--home-soft); font-size: 12px; }
.hero-jump { display: flex; width: max-content; align-items: center; gap: 18px; margin-top: clamp(64px, 10vh, 100px); border-bottom: 1px solid var(--home-line-strong); padding-bottom: 10px; color: var(--home-ink); font-size: 12px; font-weight: 700; }
.hero-jump span:last-child { color: var(--home-accent); font-size: 18px; line-height: 1; transition: transform .2s ease; }
.hero-jump:hover span:last-child { transform: translateY(3px); }

.home-lazy-section { content-visibility: auto; contain-intrinsic-size: 720px; }
.latest-section, .topics-section { border-top: 1px solid var(--home-line); padding-block: clamp(76px, 9vw, 128px); }
.section-heading { display: flex; align-items: end; justify-content: space-between; gap: 32px; margin-bottom: 42px; }
.section-heading h2 { margin: 12px 0 0; font-size: clamp(2.25rem, 5vw, 4.6rem); letter-spacing: -.07em; line-height: .98; }
.section-heading > p { max-width: 270px; margin: 0; color: var(--home-muted); font-size: 13px; line-height: 1.75; }

.article-list { border-top: 1px solid var(--home-line); }
.article-row { display: grid; grid-template-columns: 54px minmax(0, 1fr) 32px; align-items: start; gap: 22px; border-bottom: 1px solid var(--home-line); padding: 24px 14px 24px 0; transition: background-color .2s ease, padding-inline .2s ease; }
.article-row:hover { background: rgb(255 250 242 / 72%); padding-inline: 14px; }
.article-index { padding-top: 5px; color: var(--home-soft); font-size: 11px; font-variant-numeric: tabular-nums; letter-spacing: .1em; }
.article-body { min-width: 0; }
.article-meta { display: flex; flex-wrap: wrap; gap: 10px; color: var(--home-accent); font-size: 11px; font-weight: 700; letter-spacing: .04em; }
.article-meta time { color: var(--home-soft); font-weight: 500; }
.article-body h3 { margin: 9px 0 8px; font-size: clamp(1.2rem, 2.3vw, 1.65rem); letter-spacing: -.045em; line-height: 1.3; }
.article-body p { max-width: 720px; margin: 0; overflow: hidden; color: var(--home-muted); font-size: 13px; line-height: 1.7; text-overflow: ellipsis; white-space: nowrap; }
.article-arrow, .category-arrow { color: var(--home-accent); font-size: 21px; line-height: 1; transition: transform .2s ease; }
.article-row:hover .article-arrow, .category-row:hover .category-arrow { transform: translate(3px, -3px); }
.section-link { display: inline-flex; align-items: center; gap: 14px; margin-top: 28px; color: var(--home-ink); font-size: 12px; font-weight: 750; }
.section-link span { color: var(--home-accent); font-size: 18px; }

.topics-section { padding-bottom: clamp(96px, 12vw, 170px); }
.category-list { border-top: 1px solid var(--home-line); }
.category-row { display: grid; grid-template-columns: 54px minmax(150px, .7fr) minmax(0, 1.5fr) 32px; align-items: center; gap: 22px; border-bottom: 1px solid var(--home-line); padding: 22px 14px 22px 0; transition: background-color .2s ease, padding-inline .2s ease; }
.category-row:hover { background: rgb(255 250 242 / 72%); padding-inline: 14px; }
.category-index { color: var(--home-soft); font-size: 11px; font-variant-numeric: tabular-nums; letter-spacing: .1em; }
.category-name { font-size: 17px; font-weight: 700; letter-spacing: -.03em; }
.category-description { color: var(--home-muted); font-size: 13px; }
.category-skeleton { display: grid; gap: 1px; border-top: 1px solid var(--home-line); }
.category-skeleton span { height: 64px; border-bottom: 1px solid var(--home-line); background: linear-gradient(90deg, transparent, rgb(255 250 242 / 70%), transparent); animation: skeleton-sweep 1.5s ease-in-out infinite; }
.category-error, .category-empty { border-top: 1px solid var(--home-line); padding-top: 24px; color: var(--home-muted); font-size: 13px; }
.category-error p { margin: 0 0 12px; }
.category-error button { border: 1px solid var(--home-line-strong); border-radius: 999px; padding: 8px 14px; background: transparent; color: var(--home-ink); cursor: pointer; font-size: 12px; }
.category-error button:hover { border-color: var(--home-accent); color: var(--home-accent); }

@keyframes skeleton-sweep { 50% { opacity: .45; } }

@media (max-width: 700px) {
  .home-hero { min-height: 550px; padding-block: 100px 72px; }
  .hero-copy h1 { margin-top: 18px; font-size: clamp(3.25rem, 15vw, 5.4rem); }
  .hero-description { max-width: 330px; font-size: 14px; }
  .section-heading { align-items: flex-start; flex-direction: column; gap: 18px; margin-bottom: 30px; }
  .section-heading > p { max-width: 300px; }
  .article-row { grid-template-columns: 32px minmax(0, 1fr) 22px; gap: 12px; padding-block: 20px; }
  .article-row:hover, .category-row:hover { padding-inline: 0; background: transparent; }
  .article-body p { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; white-space: normal; }
  .category-row { grid-template-columns: 32px minmax(0, 1fr) 22px; gap: 12px; padding-block: 20px; }
  .category-description { grid-column: 2 / 3; margin-top: -7px; }
  .category-arrow { grid-column: 3; grid-row: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .hero-jump span:last-child, .article-arrow, .category-arrow { transition: none; }
  .category-skeleton span { animation: none; }
}
</style>
