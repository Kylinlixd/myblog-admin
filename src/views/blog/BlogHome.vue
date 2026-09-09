<template>
  <div class="home-page">
    <section ref="heroSection" class="home-hero" aria-labelledby="home-title" @pointerenter="activateFluidCursor">
      <div class="hero-fluid-wash" aria-hidden="true" />
      <FluidCursor v-if="fluidCursorVisible" class="home-fluid-cursor" :sim-resolution="64" :dye-resolution="480" :capture-resolution="256" :density-dissipation="4.8" :velocity-dissipation="2.8" :pressure-iterations="10" :splat-radius=".12" :splat-force="2800" :shading="false" :color-update-speed="7" />
      <div class="hero-inner app-container">
        <div class="hero-copy">
          <h1 id="home-title" :class="['hero-title', `hero-title--${titlePhase}`]" aria-label="探索技术，无限可能，开发、构建、应用">
            <span class="hero-title__lead">{{ typedLead }}</span>
            <span class="hero-title__accent">{{ typedAccent }}</span>
          </h1>
          <div class="hero-title-loop" :class="`hero-title-loop--${trailPhase}`" aria-live="polite" aria-label="动态关键词">
            <span class="hero-title-loop__word">{{ typedTrail }}<i v-if="['typing', 'deleting'].includes(trailPhase)" class="hero-title-loop__cursor" aria-hidden="true">_</i></span>
          </div>
        </div>
      </div>
      <a class="hero-scroll-cue" href="#latest-posts" aria-label="滚动到最新文章" @click="scrollToLatest"><span aria-hidden="true" /></a>
    </section>

    <section id="latest-posts" ref="latestSection" class="latest-section home-lazy-section app-container" aria-labelledby="latest-title">
      <div class="section-heading"><h2 id="latest-title">最新文章</h2><p>从最近一次更新开始，顺着真实问题进入文章。</p></div>
      <AsyncState v-if="loading || error || !latest.length" :loading="loading" :error="error" :empty="!loading && !error && !latest.length" @retry="loadLatest" />
      <div v-else class="article-list">
        <router-link v-for="item in latest" :key="item.id" class="article-row" :to="`/blog/dynamics/${item.id}`">
          <div class="article-body">
            <div class="article-meta"><span>{{ item.category?.name || '持续构建' }}</span><time v-if="articleDate(item)" :datetime="articleDate(item)">{{ formatDate(item) }}</time></div>
            <h3>{{ item.title }}</h3><p>{{ excerpt(item) }}</p>
          </div><span class="article-arrow" aria-hidden="true">↗</span>
        </router-link>
      </div>
      <router-link class="section-link" to="/blog/blogdynamic">浏览全部文章 <span aria-hidden="true">→</span></router-link>
    </section>

    <section id="topics" ref="categorySection" class="topics-section home-lazy-section app-container" aria-labelledby="topics-title">
      <div class="section-heading"><h2 id="topics-title">主题分类</h2><p>按主题浏览，找到属于你的阅读路径。</p></div>
      <div v-if="categoryLoading || (!categoriesLoaded && !categoryError)" class="category-skeleton" role="status" aria-label="正在加载主题分类"><span v-for="index in 4" :key="index" /></div>
      <div v-else-if="categoryError" class="category-error" role="alert"><p>{{ categoryError }}</p><button type="button" @click="loadCategories">重新加载分类</button></div>
      <div v-else-if="categories.length" class="category-list"><router-link v-for="item in categories" :key="item.id" class="category-row" :to="`/blog/categories/${item.id}/`"><span class="category-name">{{ item.name }}</span><span class="category-description">{{ item.description || '沿着这个主题继续阅读。' }}</span><span class="category-arrow" aria-hidden="true">↗</span></router-link></div>
      <p v-else class="category-empty">新的主题正在整理中。</p>
    </section>
  </div>
</template>

<script setup>
import { defineAsyncComponent, onBeforeUnmount, onMounted, ref } from 'vue'
import { getBlogCategoryList, getRecentDynamics } from '@/api/blog'
import { normalizeCollectionResponse } from '@/api/collections'
import AsyncState from '@/components/common/AsyncState.vue'

const FluidCursor = defineAsyncComponent(() => import('@/components/blog/FluidCursor.vue'))

const heroSection = ref(null)
const fluidCursorVisible = ref(false)
const typedLead = ref('')
const typedAccent = ref('')
const typedTrail = ref('')
const titlePhase = ref('typing')
const trailPhase = ref('typing')
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
let typewriterTimer
let titleSettleTimer
let trailTimer
const extractList = (response) => normalizeCollectionResponse(response).results

function excerpt(article) { return (article?.summary || article?.content || '点击阅读完整内容。').replace(/[#>*_`\[\]]/g, '').replace(/\s+/g, ' ').trim().slice(0, 110) }
function articleDate(article) { return article?.published_at || article?.publishedAt || article?.created_at || article?.createdAt || '' }
function formatDate(article) { const value = articleDate(article); if (!value) return ''; const date = new Date(value); return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date) }

async function loadLatest() {
  loading.value = true; error.value = ''
  try { latest.value = extractList(await getRecentDynamics({ limit: 6 })).slice(0, 6) } catch (reason) { error.value = reason?.message || '请检查后端服务是否正常运行。' } finally { loading.value = false }
}
async function loadCategories() {
  if (categoriesLoaded.value || categoryLoading.value) return
  categoryLoading.value = true; categoryError.value = ''
  try { categories.value = extractList(await getBlogCategoryList()); categoriesLoaded.value = true } catch (reason) { categoryError.value = reason?.message || '主题分类暂时无法加载。' } finally { categoryLoading.value = false }
}
function observeCategories() {
  if (!categorySection.value) return
  if (!('IntersectionObserver' in window)) { loadCategories(); return }
  categoryObserver = new IntersectionObserver((entries) => { if (entries.some((entry) => entry.isIntersecting)) { loadCategories(); categoryObserver.disconnect() } }, { rootMargin: '240px 0px' })
  categoryObserver.observe(categorySection.value)
}
function activateFluidCursor(event) {
  if (event.pointerType !== 'touch') fluidCursorVisible.value = true
}
function scrollToLatest(event) {
  event.preventDefault()
  latestSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
function startTitleTyping() {
  const lead = '探索技术'
  const accent = '无限可能'
  const trailWords = ['开发', '构建', '应用']
  const leadDelays = [180, 118, 148, 126]
  const accentDelays = [176, 122, 150, 120, 136]
  const typeDelays = [176, 122, 150, 120]
  const deleteSpeed = 58
  const waitTime = 1500
  let trailWordIndex = 0
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    typedLead.value = lead
    typedAccent.value = accent
    typedTrail.value = trailWords[0]
    titlePhase.value = 'breathing'
    trailPhase.value = 'breathing'
    return
  }
  let leadIndex = 0
  let accentIndex = 0
  const scheduleTrailCycle = (initial = false) => {
    if (initial) {
      trailWordIndex = 0
      typedTrail.value = ''
    } else {
      trailPhase.value = 'deleting'
    }
    const deleteNext = () => {
      if (!initial && typedTrail.value) {
        typedTrail.value = typedTrail.value.slice(0, -1)
        trailTimer = window.setTimeout(deleteNext, deleteSpeed)
        return
      }
      if (!initial) trailWordIndex = (trailWordIndex + 1) % trailWords.length
      const word = trailWords[trailWordIndex]
      let wordIndexInText = 0
      trailPhase.value = 'typing'
      const typeWord = () => {
        if (wordIndexInText < word.length) {
          typedTrail.value = word.slice(0, ++wordIndexInText)
          trailTimer = window.setTimeout(typeWord, typeDelays[wordIndexInText - 1] || 120)
          return
        }
        trailPhase.value = 'breathing'
        trailTimer = window.setTimeout(() => scheduleTrailCycle(false), waitTime)
      }
      typeWord()
    }
    deleteNext()
  }
  const typeNext = () => {
    if (leadIndex < lead.length) {
      typedLead.value = lead.slice(0, ++leadIndex)
      typewriterTimer = window.setTimeout(typeNext, leadDelays[leadIndex - 1])
      return
    }
    if (accentIndex < accent.length) {
      typedAccent.value = accent.slice(0, ++accentIndex)
      if (accentIndex === accent.length) {
        titlePhase.value = 'settling'
        titleSettleTimer = window.setTimeout(() => {
          titlePhase.value = 'breathing'
          trailTimer = window.setTimeout(() => scheduleTrailCycle(true), 700)
        }, 560)
        return
      }
      typewriterTimer = window.setTimeout(typeNext, accentDelays[accentIndex - 1] || 120)
    }
  }
  typeNext()
}
onMounted(() => {
  if ('IntersectionObserver' in window) {
    latestObserver = new IntersectionObserver((entries) => { if (entries.some((entry) => entry.isIntersecting)) { latestObserver.disconnect(); loadLatest() } }, { rootMargin: '240px 0px' }); latestObserver.observe(latestSection.value)
  } else loadLatest()
  observeCategories()
  startTitleTyping()
})
onBeforeUnmount(() => {
  categoryObserver?.disconnect()
  latestObserver?.disconnect()
  window.clearTimeout(typewriterTimer)
  window.clearTimeout(titleSettleTimer)
  window.clearTimeout(trailTimer)
})
</script>

<style scoped>
.home-page { --home-ink: #27342f; --home-muted: #687068; --home-accent: #b85e2d; --home-line: #e5ddcf; color: var(--home-ink); padding-bottom: 64px; }
.home-page .app-container { max-width: 1120px; }
.home-hero { position: relative; display: flex; width: 100%; max-width: none; min-height: calc(100dvh - var(--header-height)); align-items: center; justify-content: center; overflow: hidden; isolation: isolate; padding-block: 80px 72px; background: #f5efe5; }
.hero-fluid-wash { position: absolute; z-index: 0; inset: 0; pointer-events: none; background: radial-gradient(ellipse 78% 86% at 74% 48%, rgb(229 188 144 / 24%), transparent 68%), radial-gradient(ellipse 72% 72% at 25% 62%, rgb(255 251 239 / 42%), transparent 74%), linear-gradient(118deg, #f5efe5 0%, #f7f0e6 48%, #eee4d5 100%); }
.hero-fluid-wash::after { position: absolute; inset: -18%; background: radial-gradient(ellipse 40% 28% at 68% 38%, rgb(255 220 169 / 14%), transparent 74%), radial-gradient(ellipse 34% 38% at 77% 72%, rgb(184 210 191 / 12%), transparent 76%); content: ''; filter: blur(54px); animation: hero-fluid-breathe 18s ease-in-out infinite alternate; }

.hero-inner { position: relative; z-index: 3; display: flex; width: 100%; max-width: 1120px; align-items: center; justify-content: center; }
.hero-copy { position: relative; z-index: 1; display: flex; max-width: 1120px; flex-direction: column; align-items: center; padding: 24px; }
.hero-title { display: flex; max-width: 100%; min-height: clamp(90px, 10vw, 120px); align-items: center; justify-content: center; gap: .18em; margin: 0; font-size: clamp(36px, 6.8vw, 84px); font-weight: 800; letter-spacing: -.065em; line-height: 1.08; text-align: center; white-space: nowrap; }.hero-title__lead, .hero-title__accent { display: inline-flex; width: 4em; align-items: center; text-align: left; }.hero-title__accent { color: var(--home-accent); }.hero-title-loop { display: flex; min-height: 1.6em; align-items: center; justify-content: center; margin-top: 8px; color: var(--home-accent); font-size: clamp(14px, 1.45vw, 18px); font-weight: 600; letter-spacing: .22em; text-align: center; }.hero-title-loop__word { display: inline-block; min-width: 3em; text-align: center; }.hero-title-loop__cursor { display: inline-block; margin-left: .1em; color: currentColor; font-size: 1em; font-weight: 500; line-height: inherit; vertical-align: baseline; opacity: .52; animation: hero-caret-pulse 1.7s ease-in-out infinite; }.hero-title--settling { animation: hero-title-settle 560ms cubic-bezier(.22, .75, .3, 1) both; }.hero-title--breathing .hero-title__lead, .hero-title--breathing .hero-title__accent { animation: hero-title-breathe 8s ease-in-out infinite; transform-origin: center; }.hero-title-loop--breathing .hero-title-loop__word { animation: hero-title-breathe 8s ease-in-out infinite; transform-origin: center; }
.hero-button { display: inline-flex; min-height: 42px; align-items: center; justify-content: center; border-radius: 999px; padding: 0 18px; font-size: 13px; transition: transform .2s ease, background-color .2s ease, color .2s ease; }
.hero-button:hover { transform: translateY(-2px); }.hero-button:active { transform: translateY(1px) scale(.98); }
.hero-button--primary { background: #34453e; color: #fffaf2; }.hero-button--primary:hover { background: #25372f; }
.hero-button--secondary { border: 1px solid var(--home-line); color: var(--home-muted); background: rgb(255 250 242 / 68%); }.hero-button--secondary:hover { border-color: #bcb4a4; color: var(--home-accent); background: #fffaf2; }
.hero-scroll-cue { position: absolute; z-index: 3; bottom: 24px; left: 50%; display: grid; width: 28px; height: 30px; place-items: center; transform: translateX(-50%); opacity: .7; }
.hero-scroll-cue span { width: 13px; height: 13px; border-right: 1.5px solid var(--home-ink); border-bottom: 1.5px solid var(--home-ink); transform: rotate(45deg) translate(-2px, -2px); animation: hero-bounce 1.5s ease-in-out infinite; }
@keyframes hero-bounce { 0%, 100% { transform: rotate(45deg) translate(-2px, -2px); } 50% { transform: rotate(45deg) translate(4px, 4px); } }
@keyframes hero-fluid-breathe { from { opacity: .62; transform: translate3d(-2%, 1%, 0) scale(.96); } to { opacity: 1; transform: translate3d(2%, -1%, 0) scale(1.06); } }
@keyframes hero-caret-pulse { 0%, 100% { opacity: .22; transform: scaleY(.84); } 50% { opacity: .46; transform: scaleY(1); } }
@keyframes hero-title-settle { 0% { transform: scale(.998); filter: drop-shadow(0 0 0 rgb(184 94 45 / 0%)); } 45% { transform: scale(1.006); filter: drop-shadow(0 0 16px rgb(184 94 45 / 12%)); } 100% { transform: scale(1); filter: drop-shadow(0 0 0 rgb(184 94 45 / 0%)); } }
@keyframes hero-title-breathe { 0%, 100% { opacity: .975; transform: translateY(0); } 50% { opacity: 1; transform: translateY(-1px); } }
.home-lazy-section { content-visibility: auto; contain-intrinsic-size: 720px; scroll-margin-top: 94px; }.latest-section { padding-block: 24px 40px; }
.section-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-bottom: 22px; }.section-heading h2 { margin: 0; font-size: 25px; font-weight: 700; letter-spacing: -.025em; line-height: 1.4; }.section-heading > p { margin: 0; color: var(--home-muted); font-size: 13px; line-height: 1.7; }
.article-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }.article-row { display: grid; grid-template-columns: minmax(0, 1fr) 18px; gap: 16px; min-height: 178px; padding: 26px; border: 1px solid var(--home-line); border-radius: 18px; background: #fffaf2; transition: border-color .18s ease, background-color .18s ease; }.article-row:hover { border-color: #bcb4a4; background: #fffcf6; }.article-body { min-width: 0; }.article-meta { display: flex; flex-wrap: wrap; gap: 8px 14px; align-items: center; font-size: 12px; line-height: 1.6; color: var(--home-accent); }.article-meta time { color: var(--home-muted); font-variant-numeric: tabular-nums; }.article-body h3 { margin: 12px 0 10px; font-size: 19px; line-height: 1.55; font-weight: 650; overflow-wrap: anywhere; }.article-body p { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; margin: 0; color: var(--home-muted); font-size: 13px; line-height: 1.85; overflow-wrap: anywhere; }.article-arrow { align-self: end; color: #8b9187; font-size: 18px; }
.section-link { display: table; margin: 24px auto 0; padding: 10px 18px; color: var(--home-muted); font-size: 13px; }.section-link:hover { color: var(--home-accent); }.section-link span { margin-left: 10px; }.topics-section { padding-top: 32px; border-top: 1px solid var(--home-line); contain-intrinsic-size: auto 280px; }.category-list { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }.category-row { display: grid; grid-template-columns: minmax(0, 1fr) 16px; gap: 9px; padding: 20px; border: 1px solid var(--home-line); border-radius: 14px; background: #eee9df; transition: border-color .18s ease; }.category-row:nth-child(4n + 2) { background: #e9ece3; }.category-row:nth-child(4n + 3) { background: #f0e7db; }.category-row:nth-child(4n + 4) { background: #ebe8e1; }.category-row:hover { border-color: #bcb4a4; }.category-name { font-size: 15px; font-weight: 650; overflow-wrap: anywhere; }.category-description { grid-column: 1 / -1; color: var(--home-muted); font-size: 12px; line-height: 1.75; overflow-wrap: anywhere; }.category-arrow { grid-column: 2; grid-row: 1; color: #838b7f; }.category-skeleton { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; min-height: 110px; }.category-skeleton span { border: 1px solid var(--home-line); border-radius: 14px; background: #eee9df; }.category-error, .category-empty { color: var(--home-muted); font-size: 14px; padding-block: 20px; }.category-error button { border: 1px solid var(--home-line); border-radius: 999px; padding: 9px 16px; background: #fffaf2; color: var(--home-ink); cursor: pointer; }.home-page a:focus-visible, .home-page button:focus-visible { outline: 2px solid var(--home-accent); outline-offset: 4px; }.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }
@media (max-width: 760px) {
  .home-hero { min-height: calc(100dvh - var(--header-height)); padding-block: 44px 60px; }
  .hero-inner { padding-inline: 16px; }
  .hero-copy { width: 100%; padding: 18px 0; }
      .hero-title { width: 100%; min-height: 80px; font-size: clamp(24px, 7.8vw, 32px); gap: .05em; letter-spacing: -.12em; }
  .hero-fluid-wash { background: radial-gradient(ellipse 90% 58% at 68% 46%, rgb(229 188 144 / 22%), transparent 72%), #f5efe5; }
  .hero-fluid-wash::after { inset: -12% -28%; filter: blur(38px); }
  .section-heading { align-items: flex-start; flex-direction: column; gap: 6px; margin-bottom: 18px; }
  .section-heading h2 { font-size: 22px; }
  .article-list { grid-template-columns: 1fr; gap: 12px; }
  .article-row { min-height: 0; padding: 22px; }
  .article-body h3 { font-size: 18px; }
  .category-list, .category-skeleton { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .category-row { padding: 16px; }
  .home-page { padding-bottom: 40px; }
}
        @media (prefers-reduced-motion: reduce) { .hero-button, .hero-scroll-cue span, .hero-fluid-wash::after, .hero-title-loop__cursor, .hero-title--settling, .hero-title--breathing .hero-title__lead, .hero-title--breathing .hero-title__accent, .hero-title-loop--breathing .hero-title-loop__word, .article-row, .category-row { animation: none; transition: none; } }
</style>
