<template>
  <div class="home-page">
    <section class="home-hero app-container" aria-labelledby="home-title">
      <canvas ref="particleCanvas" class="hero-particle-canvas" :class="{ 'hero-particle-canvas--settled': titleReady }" aria-hidden="true" />
      <div class="hero-glow-field" aria-hidden="true"><span class="hero-glow hero-glow--one" /><span class="hero-glow hero-glow--two" /><span class="hero-glow hero-glow--three" /></div>
      <div class="hero-copy">
        <h1 id="home-title" class="hero-title" :class="{ 'hero-title--ready': titleReady }" aria-label="探索技术，无限可能">
          <span class="hero-title__lead">探索技术</span>
          <span class="hero-title__accent">无限可能</span>
        </h1>
      </div>
      <a class="hero-scroll-cue" href="#latest-posts" aria-label="滚动到最新文章"><span aria-hidden="true" /></a>
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
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { getBlogCategoryList, getRecentDynamics } from '@/api/blog'
import { normalizeCollectionResponse } from '@/api/collections'
import AsyncState from '@/components/common/AsyncState.vue'

const particleCanvas = ref(null)
const categorySection = ref(null)
const latestSection = ref(null)
const latest = ref([])
const categories = ref([])
const loading = ref(true)
const error = ref('')
const categoryLoading = ref(false)
const categoryError = ref('')
const categoriesLoaded = ref(false)
const titleReady = ref(false)
let categoryObserver
let latestObserver
let particleFrame
let particleResizeObserver
let titleReadyTimer
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

function startParticleTitle() {
  if (window.navigator.userAgent.includes('jsdom')) return
  const canvas = particleCanvas.value
  let context
  try { context = canvas?.getContext('2d') } catch { return }
  if (!canvas || !context) return
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const particleSize = 2
  let particles = []; let ambient = []; let width = 0; let height = 0; let startedAt = 0
  function createTextPoints(text, x, y, fontSize, color, seed) {
    const buffer = document.createElement('canvas'); const bufferContext = buffer.getContext('2d'); if (!bufferContext) return []
    buffer.width = Math.ceil(fontSize * text.length * 1.25); buffer.height = Math.ceil(fontSize * 1.35)
    bufferContext.font = `750 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif`; bufferContext.textBaseline = 'top'; bufferContext.fillStyle = '#000'; bufferContext.fillText(text, 0, 0)
    const pixels = bufferContext.getImageData(0, 0, buffer.width, buffer.height).data; const points = []; const step = fontSize > 48 ? 4 : 3
    for (let py = 0; py < buffer.height; py += step) for (let px = 0; px < buffer.width; px += step) if (pixels[(py * buffer.width + px) * 4 + 3] > 100) {
      const angle = (seed + px * 0.17 + py * 0.23) * 2.4; const distance = 42 + ((seed * 19 + px + py) % 90)
      points.push({ x: x + px, y: y + py, color, startX: x + px + Math.cos(angle) * distance, startY: y + py + Math.sin(angle) * distance, delay: seed * 90 + (px + py) * 1.2 })
    }
    return points
  }
  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect(); const ratio = Math.min(window.devicePixelRatio || 1, 2); width = rect.width; height = rect.height
    canvas.width = Math.floor(width * ratio); canvas.height = Math.floor(height * ratio); canvas.style.width = `${width}px`; canvas.style.height = `${height}px`; context.setTransform(ratio, 0, 0, ratio, 0, 0)
    const fontSize = Math.min(92, Math.max(42, width * 0.075)); const titleWidth = fontSize * 8.8; const startX = Math.max(18, (width - titleWidth) / 2); const startY = Math.max(70, (height - fontSize) / 2)
    particles = [...createTextPoints('探索技术', startX, startY, fontSize, '#27342f', 1), ...createTextPoints('无限可能', startX + fontSize * 4.55, startY, fontSize, '#b85e2d', 2)]
    ambient = Array.from({ length: 18 }, (_, index) => ({ x: width * (0.54 + ((index * 17) % 39) / 100), y: height * (0.13 + ((index * 29) % 72) / 100), length: 24 + (index % 4) * 18, angle: -0.35 + (index % 5) * 0.18, alpha: 0.08 + (index % 3) * 0.025 }))
    startedAt = performance.now()
  }
  function render(now) {
    if (!width || !height) resize(); context.clearRect(0, 0, width, height); const elapsed = now - startedAt
    context.lineWidth = 1
    for (const line of ambient) {
      context.beginPath(); context.moveTo(line.x, line.y); context.lineTo(line.x + Math.cos(line.angle) * line.length, line.y + Math.sin(line.angle) * line.length); context.strokeStyle = `rgb(96 112 99 / ${line.alpha})`; context.stroke()
      context.beginPath(); context.arc(line.x, line.y, 2.5, 0, Math.PI * 2); context.fillStyle = `rgb(184 94 45 / ${line.alpha * 1.7})`; context.fill()
    }
    for (const particle of particles) {
      const duration = particle.color === '#27342f' ? 1050 : 1450; const progress = reduceMotion ? 1 : Math.min(1, Math.max(0, (elapsed - particle.delay) / duration)); const eased = 1 - Math.pow(1 - progress, 3); const drift = progress === 1 && !reduceMotion ? Math.sin(now / 1700 + particle.x) * 0.45 : 0
      context.globalAlpha = 0.28 + eased * 0.72; context.fillStyle = particle.color; context.shadowBlur = particle.color === '#b85e2d' ? 7 : 0; context.shadowColor = 'rgb(184 94 45 / 35%)'; context.fillRect(particle.startX + (particle.x - particle.startX) * eased, particle.startY + (particle.y - particle.startY) * eased + drift, particleSize, particleSize)
    }
    context.shadowBlur = 0; context.globalAlpha = 1; particleFrame = requestAnimationFrame(render)
  }
  resize()
  if (typeof ResizeObserver !== 'undefined') {
    particleResizeObserver = new ResizeObserver(resize)
    particleResizeObserver.observe(canvas.parentElement)
  }
  particleFrame = requestAnimationFrame(render)
}

onMounted(() => {
  startParticleTitle()
  titleReadyTimer = window.setTimeout(() => { titleReady.value = true }, 2200)
  if ('IntersectionObserver' in window) {
    latestObserver = new IntersectionObserver((entries) => { if (entries.some((entry) => entry.isIntersecting)) { latestObserver.disconnect(); loadLatest() } }, { rootMargin: '240px 0px' }); latestObserver.observe(latestSection.value)
  } else loadLatest()
  observeCategories()
})
onBeforeUnmount(() => { categoryObserver?.disconnect(); latestObserver?.disconnect(); particleResizeObserver?.disconnect(); cancelAnimationFrame(particleFrame); window.clearTimeout(titleReadyTimer) })
</script>

<style scoped>
.home-page { --header-height: 62px; --home-ink: #27342f; --home-muted: #687068; --home-accent: #b85e2d; --home-line: #e5ddcf; color: var(--home-ink); padding-bottom: 64px; }
.home-page .app-container { max-width: 1120px; }
.home-hero { position: relative; display: flex; min-height: calc(100dvh - var(--header-height)); align-items: center; justify-content: center; overflow: hidden; isolation: isolate; padding-block: 80px 72px; }
.home-hero::before { position: absolute; z-index: -2; inset: 7% 5% 10% 42%; border-radius: 48% 36% 42% 30%; background: radial-gradient(circle at 56% 48%, rgb(211 187 149 / 25%), transparent 68%); content: ''; filter: blur(18px); }
.home-hero::after { position: absolute; z-index: -3; inset: 0; background: radial-gradient(ellipse at 75% 18%, rgb(219 177 126 / 20%), transparent 30%), radial-gradient(ellipse at 88% 74%, rgb(154 171 151 / 17%), transparent 34%), linear-gradient(112deg, transparent 35%, rgb(255 250 241 / 42%) 52%, transparent 72%); content: ''; }
.hero-particle-canvas { position: absolute; z-index: -1; inset: 0; width: 100%; height: 100%; pointer-events: none; transition: opacity 1.1s cubic-bezier(.22, .8, .25, 1); }.hero-particle-canvas--settled { opacity: 0; }
.hero-glow-field { position: absolute; z-index: -1; inset: 0; overflow: hidden; pointer-events: none; }.hero-glow { position: absolute; display: block; border-radius: 50%; filter: blur(2px); opacity: .7; }.hero-glow--one { top: 16%; right: 15%; width: 18px; height: 18px; background: #d8a36e; box-shadow: 0 0 38px 16px rgb(216 163 110 / 22%); }.hero-glow--two { top: 29%; right: 27%; width: 8px; height: 8px; background: #9aa78f; box-shadow: 0 0 30px 11px rgb(154 167 143 / 22%); }.hero-glow--three { right: 7%; bottom: 22%; width: 12px; height: 12px; background: #d6b895; box-shadow: 0 0 34px 14px rgb(214 184 149 / 18%); }
.hero-copy { position: relative; z-index: 1; display: flex; max-width: 1120px; flex-direction: column; align-items: center; padding: 24px; }
.hero-title { display: flex; min-height: clamp(90px, 10vw, 120px); align-items: center; justify-content: center; gap: .18em; margin: 0; font-size: clamp(42px, 7.5vw, 92px); font-weight: 800; letter-spacing: -.065em; line-height: 1.08; text-align: center; white-space: nowrap; opacity: .18; transform: translateY(5px) scale(.985); transition: opacity 1.4s cubic-bezier(.22, .8, .25, 1), transform 1.4s cubic-bezier(.22, .8, .25, 1); }.hero-title--ready { opacity: 1; transform: translateY(0) scale(1); }.hero-title__accent { color: var(--home-accent); }
.hero-button { display: inline-flex; min-height: 42px; align-items: center; justify-content: center; border-radius: 999px; padding: 0 18px; font-size: 13px; transition: transform .2s ease, background-color .2s ease, color .2s ease; }
.hero-button:hover { transform: translateY(-2px); }.hero-button:active { transform: translateY(1px) scale(.98); }
.hero-button--primary { background: #34453e; color: #fffaf2; }.hero-button--primary:hover { background: #25372f; }
.hero-button--secondary { border: 1px solid var(--home-line); color: var(--home-muted); background: rgb(255 250 242 / 68%); }.hero-button--secondary:hover { border-color: #bcb4a4; color: var(--home-accent); background: #fffaf2; }
.hero-scroll-cue { position: absolute; bottom: 24px; left: 50%; display: grid; width: 28px; height: 30px; place-items: center; transform: translateX(-50%); opacity: .7; }
.hero-scroll-cue span { width: 13px; height: 13px; border-right: 1.5px solid var(--home-ink); border-bottom: 1.5px solid var(--home-ink); transform: rotate(45deg) translate(-2px, -2px); animation: hero-bounce 1.5s ease-in-out infinite; }
@keyframes hero-bounce { 0%, 100% { transform: rotate(45deg) translate(-2px, -2px); } 50% { transform: rotate(45deg) translate(4px, 4px); } }
.home-lazy-section { content-visibility: auto; contain-intrinsic-size: 720px; scroll-margin-top: 94px; }.latest-section { padding-block: 24px 40px; }
.section-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-bottom: 22px; }.section-heading h2 { margin: 0; font-size: 25px; font-weight: 700; letter-spacing: -.025em; line-height: 1.4; }.section-heading > p { margin: 0; color: var(--home-muted); font-size: 13px; line-height: 1.7; }
.article-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }.article-row { display: grid; grid-template-columns: minmax(0, 1fr) 18px; gap: 16px; min-height: 178px; padding: 26px; border: 1px solid var(--home-line); border-radius: 18px; background: #fffaf2; transition: border-color .18s ease, background-color .18s ease; }.article-row:hover { border-color: #bcb4a4; background: #fffcf6; }.article-body { min-width: 0; }.article-meta { display: flex; flex-wrap: wrap; gap: 8px 14px; align-items: center; font-size: 12px; line-height: 1.6; color: var(--home-accent); }.article-meta time { color: var(--home-muted); font-variant-numeric: tabular-nums; }.article-body h3 { margin: 12px 0 10px; font-size: 19px; line-height: 1.55; font-weight: 650; overflow-wrap: anywhere; }.article-body p { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; margin: 0; color: var(--home-muted); font-size: 13px; line-height: 1.85; overflow-wrap: anywhere; }.article-arrow { align-self: end; color: #8b9187; font-size: 18px; }
.section-link { display: table; margin: 24px auto 0; padding: 10px 18px; color: var(--home-muted); font-size: 13px; }.section-link:hover { color: var(--home-accent); }.section-link span { margin-left: 10px; }.topics-section { padding-top: 32px; border-top: 1px solid var(--home-line); contain-intrinsic-size: auto 280px; }.category-list { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }.category-row { display: grid; grid-template-columns: minmax(0, 1fr) 16px; gap: 9px; padding: 20px; border: 1px solid var(--home-line); border-radius: 14px; background: #eee9df; transition: border-color .18s ease; }.category-row:nth-child(4n + 2) { background: #e9ece3; }.category-row:nth-child(4n + 3) { background: #f0e7db; }.category-row:nth-child(4n + 4) { background: #ebe8e1; }.category-row:hover { border-color: #bcb4a4; }.category-name { font-size: 15px; font-weight: 650; overflow-wrap: anywhere; }.category-description { grid-column: 1 / -1; color: var(--home-muted); font-size: 12px; line-height: 1.75; overflow-wrap: anywhere; }.category-arrow { grid-column: 2; grid-row: 1; color: #838b7f; }.category-skeleton { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; min-height: 110px; }.category-skeleton span { border: 1px solid var(--home-line); border-radius: 14px; background: #eee9df; }.category-error, .category-empty { color: var(--home-muted); font-size: 14px; padding-block: 20px; }.category-error button { border: 1px solid var(--home-line); border-radius: 999px; padding: 9px 16px; background: #fffaf2; color: var(--home-ink); cursor: pointer; }.home-page a:focus-visible, .home-page button:focus-visible { outline: 2px solid var(--home-accent); outline-offset: 4px; }.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }
@media (max-width: 760px) { .home-hero { min-height: calc(100dvh - var(--header-height)); padding-block: 44px 60px; }.hero-copy { padding: 18px; }.hero-title { min-height: 80px; font-size: clamp(28px, 8.7vw, 54px); gap: .12em; }.hero-glow--one { right: 8%; }.hero-glow--two { right: 18%; }.section-heading { align-items: flex-start; flex-direction: column; gap: 6px; margin-bottom: 18px; }.section-heading h2 { font-size: 22px; }.article-list { grid-template-columns: 1fr; gap: 12px; }.article-row { min-height: 0; padding: 22px; }.article-body h3 { font-size: 18px; }.category-list, .category-skeleton { grid-template-columns: repeat(2, minmax(0, 1fr)); }.category-row { padding: 16px; }.home-page { padding-bottom: 40px; } }
@media (prefers-reduced-motion: reduce) { .hero-button, .hero-scroll-cue span, .hero-title, .hero-particle-canvas, .article-row, .category-row { animation: none; transition: none; } }
</style>
