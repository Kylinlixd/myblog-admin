<template>
  <div class="home-page">
    <section ref="heroSection" class="home-hero" aria-labelledby="home-title" @pointermove="handleHeroPointer" @pointerleave="resetHeroPointer">
      <div class="hero-light-field" aria-hidden="true" />
      <canvas ref="heroEffectCanvas" class="hero-effect-canvas" aria-hidden="true" />
      <div class="hero-inner app-container">
        <div class="hero-copy">
          <h1 id="home-title" class="hero-title" aria-label="探索技术，无限可能">
            <span class="hero-title__lead">探索技术</span>
            <span class="hero-title__accent">无限可能</span>
          </h1>
        </div>
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

const heroSection = ref(null)
const heroEffectCanvas = ref(null)
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
let heroEffectFrame
let heroEffectResizeObserver
let heroEffectVisibilityHandler
let heroEffectContext
let heroEffectWidth = 0
let heroEffectHeight = 0
let heroEffectLastTime = 0
let heroEffectLastPoint
let heroEffectPointerActive = false
let heroEffectReducedMotion = false
let heroTrail = []
let heroStars = []
const maxTrailPoints = 28
const maxStars = 24
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
function resizeHeroEffect() {
  const canvas = heroEffectCanvas.value
  const section = heroSection.value
  if (!canvas || !section || !heroEffectContext) return
  const rect = section.getBoundingClientRect()
  const ratio = Math.min(window.devicePixelRatio || 1, 1.5)
  heroEffectWidth = rect.width
  heroEffectHeight = rect.height
  canvas.width = Math.floor(rect.width * ratio)
  canvas.height = Math.floor(rect.height * ratio)
  canvas.style.width = `${rect.width}px`
  canvas.style.height = `${rect.height}px`
  heroEffectContext.setTransform(ratio, 0, 0, ratio, 0, 0)
}
function addHeroStar(x, y, velocityX, velocityY) {
  if (heroStars.length >= maxStars) heroStars.shift()
  heroStars.push({
    x,
    y,
    velocityX: velocityX * .12 + (Math.random() - .5) * 12,
    velocityY: velocityY * .12 + (Math.random() - .5) * 12,
    age: 0,
    lifetime: 520 + Math.random() * 480,
    size: 1.5 + Math.random() * 2.4,
    rotation: Math.random() * Math.PI,
    rotationSpeed: (Math.random() - .5) * .006
  })
}
function drawHeroStar(context, star, alpha) {
  const radius = star.size
  context.save()
  context.translate(star.x, star.y)
  context.rotate(star.rotation)
  context.globalAlpha = alpha
  context.fillStyle = star.size > 3 ? 'rgb(220 166 108 / 72%)' : 'rgb(255 239 207 / 78%)'
  context.shadowBlur = 10
  context.shadowColor = 'rgb(214 145 84 / 38%)'
  context.beginPath()
  context.moveTo(0, -radius * 1.8)
  context.lineTo(radius * .48, -radius * .48)
  context.lineTo(radius * 1.8, 0)
  context.lineTo(radius * .48, radius * .48)
  context.lineTo(0, radius * 1.8)
  context.lineTo(-radius * .48, radius * .48)
  context.lineTo(-radius * 1.8, 0)
  context.lineTo(-radius * .48, -radius * .48)
  context.closePath()
  context.fill()
  context.restore()
}
function renderHeroEffect(now) {
  heroEffectFrame = undefined
  if (!heroEffectContext || document.visibilityState === 'hidden') return
  const elapsed = Math.min(40, Math.max(0, now - heroEffectLastTime || 16))
  heroEffectLastTime = now
  const context = heroEffectContext
  context.clearRect(0, 0, heroEffectWidth, heroEffectHeight)
  heroTrail = heroTrail.filter((point) => now - point.time < 980)
  if (heroTrail.length > 1) {
    context.save()
    context.globalCompositeOperation = 'lighter'
    for (let index = 1; index < heroTrail.length; index += 1) {
      const previous = heroTrail[index - 1]
      const current = heroTrail[index]
      const age = now - current.time
      const alpha = Math.max(0, 1 - age / 980)
      const distance = Math.hypot(current.x - previous.x, current.y - previous.y) || 1
      const normalX = -(current.y - previous.y) / distance
      const normalY = (current.x - previous.x) / distance
      for (const band of [-1, 0, 1]) {
        const offset = band * (1.6 + alpha * 1.8)
        context.beginPath()
        context.moveTo(previous.x + normalX * offset, previous.y + normalY * offset)
        context.lineTo(current.x + normalX * offset, current.y + normalY * offset)
        context.lineWidth = band === 0 ? 1.4 + alpha * 2.2 : .65 + alpha
        context.strokeStyle = band === 0 ? `rgb(199 127 73 / ${alpha * .52})` : `rgb(247 218 177 / ${alpha * .25})`
        context.shadowBlur = band === 0 ? 13 : 7
        context.shadowColor = 'rgb(205 134 79 / 28%)'
        context.stroke()
      }
    }
    context.restore()
  }
  heroStars = heroStars.filter((star) => {
    star.age += elapsed
    star.x += star.velocityX * elapsed / 1000
    star.y += star.velocityY * elapsed / 1000
    star.rotation += star.rotationSpeed * elapsed
    const alpha = Math.max(0, 1 - star.age / star.lifetime)
    if (alpha > 0) drawHeroStar(context, star, alpha)
    return alpha > 0
  })
  const pointerFresh = heroEffectPointerActive && heroEffectLastPoint && now - heroEffectLastPoint.time < 90
  if (pointerFresh || heroTrail.length || heroStars.length) scheduleHeroEffect()
}
function scheduleHeroEffect() {
  if (heroEffectFrame || heroEffectReducedMotion || document.visibilityState === 'hidden') return
  heroEffectFrame = requestAnimationFrame(renderHeroEffect)
}
function handleHeroPointer(event) {
  if (event.pointerType === 'touch' || heroEffectReducedMotion || !heroSection.value) return
  const rect = heroSection.value.getBoundingClientRect()
  const point = { x: event.clientX - rect.left, y: event.clientY - rect.top, time: performance.now() }
  const previous = heroEffectLastPoint
  heroEffectPointerActive = true
  if (!previous) heroTrail.push(point)
  else {
    const distance = Math.hypot(point.x - previous.x, point.y - previous.y)
    const steps = Math.min(7, Math.max(1, Math.ceil(distance / 12)))
    for (let index = 1; index <= steps; index += 1) {
      const progress = index / steps
      const sample = { x: previous.x + (point.x - previous.x) * progress, y: previous.y + (point.y - previous.y) * progress, time: point.time - (steps - index) * 12 }
      heroTrail.push(sample)
      if (distance > 12 && index % 2 === 0) addHeroStar(sample.x, sample.y, point.x - previous.x, point.y - previous.y)
    }
  }
  heroTrail = heroTrail.slice(-maxTrailPoints)
  heroEffectLastPoint = point
  scheduleHeroEffect()
}
function resetHeroPointer() {
  heroEffectPointerActive = false
  heroEffectLastPoint = undefined
  scheduleHeroEffect()
}
function startHeroEffect() {
  const canvas = heroEffectCanvas.value
  if (!canvas || window.navigator.userAgent.includes('jsdom')) return
  heroEffectReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false
  if (heroEffectReducedMotion) return
  heroEffectContext = canvas.getContext('2d')
  if (!heroEffectContext) return
  resizeHeroEffect()
  if (typeof ResizeObserver !== 'undefined') {
    heroEffectResizeObserver = new ResizeObserver(resizeHeroEffect)
    heroEffectResizeObserver.observe(heroSection.value)
  }
  heroEffectVisibilityHandler = () => {
    if (document.visibilityState === 'hidden') {
      cancelAnimationFrame(heroEffectFrame)
      heroEffectFrame = undefined
    } else if (heroEffectPointerActive || heroTrail.length || heroStars.length) scheduleHeroEffect()
  }
  document.addEventListener('visibilitychange', heroEffectVisibilityHandler)
}
onMounted(() => {
  if ('IntersectionObserver' in window) {
    latestObserver = new IntersectionObserver((entries) => { if (entries.some((entry) => entry.isIntersecting)) { latestObserver.disconnect(); loadLatest() } }, { rootMargin: '240px 0px' }); latestObserver.observe(latestSection.value)
  } else loadLatest()
  observeCategories()
  startHeroEffect()
})
onBeforeUnmount(() => {
  categoryObserver?.disconnect()
  latestObserver?.disconnect()
  heroEffectResizeObserver?.disconnect()
  if (heroEffectVisibilityHandler) document.removeEventListener('visibilitychange', heroEffectVisibilityHandler)
  cancelAnimationFrame(heroEffectFrame)
})
</script>

<style scoped>
.home-page { --home-ink: #27342f; --home-muted: #687068; --home-accent: #b85e2d; --home-line: #e5ddcf; color: var(--home-ink); padding-bottom: 64px; }
.home-page .app-container { max-width: 1120px; }
.home-hero { position: relative; display: flex; width: 100%; max-width: none; min-height: calc(100dvh - var(--header-height)); align-items: center; justify-content: center; overflow: hidden; isolation: isolate; padding-block: 80px 72px; background: #f5efe5; }
.hero-light-field { position: absolute; z-index: 0; inset: -16%; overflow: hidden; pointer-events: none; background: radial-gradient(ellipse 52% 68% at 74% 44%, rgb(212 157 106 / 18%), transparent 72%), radial-gradient(ellipse 48% 54% at 60% 72%, rgb(151 169 151 / 12%), transparent 74%), radial-gradient(ellipse 70% 80% at 18% 48%, rgb(255 252 244 / 34%), transparent 78%); }
.hero-light-field::before { position: absolute; inset: 4% -8%; background: radial-gradient(ellipse 32% 28% at 68% 35%, rgb(231 182 132 / 21%), transparent 74%), radial-gradient(ellipse 42% 30% at 78% 68%, rgb(192 173 135 / 16%), transparent 76%); content: ''; filter: blur(48px); animation: hero-light-breathe 16s ease-in-out infinite alternate; }
.hero-light-field::after { position: absolute; inset: -20% -10%; background: linear-gradient(112deg, transparent 24%, rgb(255 246 226 / 12%) 42%, rgb(205 147 98 / 12%) 54%, transparent 72%); content: ''; filter: blur(22px); animation: hero-light-sweep 19s ease-in-out infinite alternate; }
.hero-effect-canvas { position: absolute; z-index: 2; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.hero-inner { position: relative; z-index: 3; display: flex; width: 100%; max-width: 1120px; align-items: center; justify-content: center; }
.hero-copy { position: relative; z-index: 1; display: flex; max-width: 1120px; flex-direction: column; align-items: center; padding: 24px; }
.hero-title { display: flex; max-width: 100%; min-height: clamp(90px, 10vw, 120px); align-items: center; justify-content: center; gap: .18em; margin: 0; font-size: clamp(36px, 6.8vw, 84px); font-weight: 800; letter-spacing: -.065em; line-height: 1.08; text-align: center; white-space: nowrap; }.hero-title__accent { color: var(--home-accent); }
.hero-button { display: inline-flex; min-height: 42px; align-items: center; justify-content: center; border-radius: 999px; padding: 0 18px; font-size: 13px; transition: transform .2s ease, background-color .2s ease, color .2s ease; }
.hero-button:hover { transform: translateY(-2px); }.hero-button:active { transform: translateY(1px) scale(.98); }
.hero-button--primary { background: #34453e; color: #fffaf2; }.hero-button--primary:hover { background: #25372f; }
.hero-button--secondary { border: 1px solid var(--home-line); color: var(--home-muted); background: rgb(255 250 242 / 68%); }.hero-button--secondary:hover { border-color: #bcb4a4; color: var(--home-accent); background: #fffaf2; }
.hero-scroll-cue { position: absolute; z-index: 3; bottom: 24px; left: 50%; display: grid; width: 28px; height: 30px; place-items: center; transform: translateX(-50%); opacity: .7; }
.hero-scroll-cue span { width: 13px; height: 13px; border-right: 1.5px solid var(--home-ink); border-bottom: 1.5px solid var(--home-ink); transform: rotate(45deg) translate(-2px, -2px); animation: hero-bounce 1.5s ease-in-out infinite; }
@keyframes hero-bounce { 0%, 100% { transform: rotate(45deg) translate(-2px, -2px); } 50% { transform: rotate(45deg) translate(4px, 4px); } }
@keyframes hero-light-breathe { from { opacity: .62; transform: translate3d(-2%, 1%, 0) scale(.96); } to { opacity: 1; transform: translate3d(2%, -1%, 0) scale(1.06); } }
@keyframes hero-light-sweep { from { opacity: .28; transform: translate3d(-4%, 2%, 0) rotate(-3deg) scale(.98); } to { opacity: .68; transform: translate3d(4%, -2%, 0) rotate(3deg) scale(1.04); } }
.home-lazy-section { content-visibility: auto; contain-intrinsic-size: 720px; scroll-margin-top: 94px; }.latest-section { padding-block: 24px 40px; }
.section-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-bottom: 22px; }.section-heading h2 { margin: 0; font-size: 25px; font-weight: 700; letter-spacing: -.025em; line-height: 1.4; }.section-heading > p { margin: 0; color: var(--home-muted); font-size: 13px; line-height: 1.7; }
.article-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }.article-row { display: grid; grid-template-columns: minmax(0, 1fr) 18px; gap: 16px; min-height: 178px; padding: 26px; border: 1px solid var(--home-line); border-radius: 18px; background: #fffaf2; transition: border-color .18s ease, background-color .18s ease; }.article-row:hover { border-color: #bcb4a4; background: #fffcf6; }.article-body { min-width: 0; }.article-meta { display: flex; flex-wrap: wrap; gap: 8px 14px; align-items: center; font-size: 12px; line-height: 1.6; color: var(--home-accent); }.article-meta time { color: var(--home-muted); font-variant-numeric: tabular-nums; }.article-body h3 { margin: 12px 0 10px; font-size: 19px; line-height: 1.55; font-weight: 650; overflow-wrap: anywhere; }.article-body p { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; margin: 0; color: var(--home-muted); font-size: 13px; line-height: 1.85; overflow-wrap: anywhere; }.article-arrow { align-self: end; color: #8b9187; font-size: 18px; }
.section-link { display: table; margin: 24px auto 0; padding: 10px 18px; color: var(--home-muted); font-size: 13px; }.section-link:hover { color: var(--home-accent); }.section-link span { margin-left: 10px; }.topics-section { padding-top: 32px; border-top: 1px solid var(--home-line); contain-intrinsic-size: auto 280px; }.category-list { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }.category-row { display: grid; grid-template-columns: minmax(0, 1fr) 16px; gap: 9px; padding: 20px; border: 1px solid var(--home-line); border-radius: 14px; background: #eee9df; transition: border-color .18s ease; }.category-row:nth-child(4n + 2) { background: #e9ece3; }.category-row:nth-child(4n + 3) { background: #f0e7db; }.category-row:nth-child(4n + 4) { background: #ebe8e1; }.category-row:hover { border-color: #bcb4a4; }.category-name { font-size: 15px; font-weight: 650; overflow-wrap: anywhere; }.category-description { grid-column: 1 / -1; color: var(--home-muted); font-size: 12px; line-height: 1.75; overflow-wrap: anywhere; }.category-arrow { grid-column: 2; grid-row: 1; color: #838b7f; }.category-skeleton { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; min-height: 110px; }.category-skeleton span { border: 1px solid var(--home-line); border-radius: 14px; background: #eee9df; }.category-error, .category-empty { color: var(--home-muted); font-size: 14px; padding-block: 20px; }.category-error button { border: 1px solid var(--home-line); border-radius: 999px; padding: 9px 16px; background: #fffaf2; color: var(--home-ink); cursor: pointer; }.home-page a:focus-visible, .home-page button:focus-visible { outline: 2px solid var(--home-accent); outline-offset: 4px; }.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }
@media (max-width: 760px) {
  .home-hero { min-height: calc(100dvh - var(--header-height)); padding-block: 44px 60px; }
  .hero-inner { padding-inline: 16px; }
  .hero-copy { width: 100%; padding: 18px 0; }
  .hero-title { width: 100%; min-height: 80px; font-size: clamp(24px, 7.8vw, 32px); gap: .05em; letter-spacing: -.12em; }
  .hero-light-field { inset: -10%; background: radial-gradient(ellipse 72% 44% at 70% 34%, rgb(212 157 106 / 17%), transparent 74%), radial-gradient(ellipse 78% 52% at 40% 76%, rgb(176 169 137 / 11%), transparent 76%), #f5efe5; }
  .hero-light-field::before { inset: 8% -20%; filter: blur(36px); }
  .hero-light-field::after { inset: -8% -30%; filter: blur(18px); }
  .hero-effect-canvas { opacity: .82; }
  .section-heading { align-items: flex-start; flex-direction: column; gap: 6px; margin-bottom: 18px; }
  .section-heading h2 { font-size: 22px; }
  .article-list { grid-template-columns: 1fr; gap: 12px; }
  .article-row { min-height: 0; padding: 22px; }
  .article-body h3 { font-size: 18px; }
  .category-list, .category-skeleton { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .category-row { padding: 16px; }
  .home-page { padding-bottom: 40px; }
}
    @media (prefers-reduced-motion: reduce) { .hero-button, .hero-scroll-cue span, .hero-light-field::before, .hero-light-field::after, .article-row, .category-row { animation: none; transition: none; } .hero-effect-canvas { display: none; } }
</style>
