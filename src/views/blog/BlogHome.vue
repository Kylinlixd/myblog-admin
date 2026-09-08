<template>
  <div class="home-page">
    <section ref="heroSection" class="home-hero" aria-labelledby="home-title" @pointermove="handleHeroPointer" @pointerleave="resetHeroPointer">
      <canvas ref="particleCanvas" class="hero-particle-canvas" :class="{ 'hero-particle-canvas--settled': titleReady }" aria-hidden="true" />
      <div class="hero-atmosphere" aria-hidden="true">
        <span class="hero-light-sheet hero-light-sheet--one" />
        <span class="hero-light-sheet hero-light-sheet--two" />
        <span class="hero-trace hero-trace--one" />
        <span class="hero-trace hero-trace--two" />
      </div>
      <div class="hero-inner app-container">
        <div class="hero-copy">
          <h1 id="home-title" class="hero-title" :class="{ 'hero-title--ready': titleReady }" aria-label="探索技术，无限可能">
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

const particleCanvas = ref(null)
const heroSection = ref(null)
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
let heroVisibilityObserver
let visibilityHandler
let compactScreenMediaQuery
let compactScreenChangeHandler
let titleReadyTimer
let pointerFrame
let pointerTarget = { x: 0, y: 0 }
let pointerCurrent = { x: 0, y: 0 }
const compactScreen = ref(false)
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
function updateCompactScreen() {
  const next = window.matchMedia?.('(max-width: 760px)').matches || window.innerWidth < 760
  compactScreen.value = Boolean(next)
}
function animateHeroPointer() {
  if (pointerFrame) return
  const tick = () => {
    pointerCurrent.x += (pointerTarget.x - pointerCurrent.x) * .075; pointerCurrent.y += (pointerTarget.y - pointerCurrent.y) * .075
    heroSection.value?.style.setProperty('--hero-shift-x', `${pointerCurrent.x * 35}px`); heroSection.value?.style.setProperty('--hero-shift-y', `${pointerCurrent.y * 24}px`)
    if (Math.abs(pointerTarget.x - pointerCurrent.x) < .001 && Math.abs(pointerTarget.y - pointerCurrent.y) < .001) { pointerCurrent = { ...pointerTarget }; pointerFrame = undefined; return }
    pointerFrame = requestAnimationFrame(tick)
  }
  pointerFrame = requestAnimationFrame(tick)
}
function handleHeroPointer(event) {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || !heroSection.value) return
  const rect = heroSection.value.getBoundingClientRect(); pointerTarget = { x: (event.clientX - rect.left) / rect.width - .5, y: (event.clientY - rect.top) / rect.height - .5 }; animateHeroPointer()
}
function resetHeroPointer() { pointerTarget = { x: 0, y: 0 }; animateHeroPointer() }

function startParticleTitle() {
  if (window.navigator.userAgent.includes('jsdom')) return
  const canvas = particleCanvas.value
  let context
  try { context = canvas?.getContext('2d') } catch { return }
  if (!canvas || !context) return
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const particleSize = 2
  let particles = []; let width = 0; let height = 0; let startedAt = performance.now(); let isHeroVisible = true
  function createTextPoints(text, x, y, fontSize, color, seed) {
    const buffer = document.createElement('canvas'); const bufferContext = buffer.getContext('2d'); if (!bufferContext) return []
    buffer.width = Math.ceil(fontSize * text.length * 1.25); buffer.height = Math.ceil(fontSize * 1.35)
    bufferContext.font = `800 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif`; bufferContext.textBaseline = 'top'; bufferContext.fillStyle = '#000'; bufferContext.fillText(text, 0, 0)
    const pixels = bufferContext.getImageData(0, 0, buffer.width, buffer.height).data; const points = []; const step = fontSize > 48 ? 4 : 3
    for (let py = 0; py < buffer.height; py += step) for (let px = 0; px < buffer.width; px += step) if (pixels[(py * buffer.width + px) * 4 + 3] > 100) {
      const angle = (seed + px * 0.17 + py * 0.23) * 2.4; const distance = 42 + ((seed * 19 + px + py) % 90)
      points.push({ x: x + px, y: y + py, color, startX: x + px + Math.cos(angle) * distance, startY: y + py + Math.sin(angle) * distance, delay: seed * 90 + (px + py) * 1.2 })
    }
    return points
  }
  function resize() {
    updateCompactScreen()
    const rect = canvas.parentElement.getBoundingClientRect(); const viewportWidth = window.visualViewport?.width || window.innerWidth; const ratio = Math.min(window.devicePixelRatio || 1, 1.5); width = Math.min(rect.width, viewportWidth); height = rect.height
    canvas.width = Math.floor(width * ratio); canvas.height = Math.floor(height * ratio); canvas.style.width = `${width}px`; canvas.style.height = `${height}px`; context.setTransform(ratio, 0, 0, ratio, 0, 0)
    const titleLead = heroSection.value?.querySelector('.hero-title__lead'); const titleAccent = heroSection.value?.querySelector('.hero-title__accent')
    if (compactScreen.value || !titleLead || !titleAccent) { particles = []; return }
    const leadRect = titleLead.getBoundingClientRect(); const accentRect = titleAccent.getBoundingClientRect(); const fontSize = Number.parseFloat(window.getComputedStyle(titleLead).fontSize) || Math.min(84, Math.max(42, width * .068)); const titleRect = canvas.parentElement.getBoundingClientRect(); const leadX = leadRect.left - titleRect.left; const accentX = accentRect.left - titleRect.left; const leadY = leadRect.top - titleRect.top + Math.max(0, (leadRect.height - fontSize) / 2); const accentY = accentRect.top - titleRect.top + Math.max(0, (accentRect.height - fontSize) / 2)
    particles = [...createTextPoints('探索技术', leadX, leadY, fontSize, '#27342f', 1), ...createTextPoints('无限可能', accentX, accentY, fontSize, '#b85e2d', 2)]
  }
  function scheduleRender() {
    if (particleFrame || !isHeroVisible || document.visibilityState === 'hidden') return
    particleFrame = requestAnimationFrame(render)
  }
  function render(now) {
    particleFrame = undefined
    if (!isHeroVisible || document.visibilityState === 'hidden') return
    if (!width || !height) resize(); context.clearRect(0, 0, width, height); const elapsed = now - startedAt
    for (const particle of particles) {
      const duration = particle.color === '#27342f' ? 1050 : 1450; const progress = reduceMotion ? 1 : Math.min(1, Math.max(0, (elapsed - particle.delay) / duration)); const eased = 1 - Math.pow(1 - progress, 3); const drift = progress === 1 && !reduceMotion ? Math.sin(now / 1700 + particle.x) * 0.45 : 0
      const titleRevealAt = compactScreen.value ? 450 : 2200; const titleAlpha = titleReady.value ? Math.max(0, 1 - Math.min(1, (elapsed - titleRevealAt) / 1400)) : 1; context.globalAlpha = (0.28 + eased * 0.72) * titleAlpha; context.fillStyle = particle.color; context.shadowBlur = particle.color === '#b85e2d' ? 7 : 0; context.shadowColor = 'rgb(184 94 45 / 35%)'; context.fillRect(particle.startX + (particle.x - particle.startX) * eased, particle.startY + (particle.y - particle.startY) * eased + drift, particleSize, particleSize)
    }
    context.shadowBlur = 0; context.globalAlpha = 1; scheduleRender()
  }
  resize()
  if (typeof ResizeObserver !== 'undefined') {
    particleResizeObserver = new ResizeObserver(resize)
    particleResizeObserver.observe(canvas.parentElement)
  }
  compactScreenMediaQuery = window.matchMedia?.('(max-width: 760px)')
  compactScreenChangeHandler = () => { updateCompactScreen(); resize() }
  compactScreenMediaQuery?.addEventListener?.('change', compactScreenChangeHandler)
  visibilityHandler = () => { if (document.visibilityState === 'hidden') { cancelAnimationFrame(particleFrame); particleFrame = undefined } else scheduleRender() }
  document.addEventListener('visibilitychange', visibilityHandler)
  if (typeof IntersectionObserver !== 'undefined' && heroSection.value) {
    heroVisibilityObserver = new IntersectionObserver(([entry]) => { isHeroVisible = entry.isIntersecting; if (isHeroVisible) scheduleRender(); else { cancelAnimationFrame(particleFrame); particleFrame = undefined } }, { threshold: 0 })
    heroVisibilityObserver.observe(heroSection.value)
  }
  scheduleRender()
}

onMounted(() => {
  updateCompactScreen()
  startParticleTitle()
  titleReadyTimer = window.setTimeout(() => { titleReady.value = true }, compactScreen.value ? 450 : 2200)
  if ('IntersectionObserver' in window) {
    latestObserver = new IntersectionObserver((entries) => { if (entries.some((entry) => entry.isIntersecting)) { latestObserver.disconnect(); loadLatest() } }, { rootMargin: '240px 0px' }); latestObserver.observe(latestSection.value)
  } else loadLatest()
  observeCategories()
})
onBeforeUnmount(() => { categoryObserver?.disconnect(); latestObserver?.disconnect(); particleResizeObserver?.disconnect(); heroVisibilityObserver?.disconnect(); compactScreenMediaQuery?.removeEventListener?.('change', compactScreenChangeHandler); if (visibilityHandler) document.removeEventListener('visibilitychange', visibilityHandler); cancelAnimationFrame(particleFrame); cancelAnimationFrame(pointerFrame); window.clearTimeout(titleReadyTimer) })
</script>

<style scoped>
.home-page { --home-ink: #27342f; --home-muted: #687068; --home-accent: #b85e2d; --home-line: #e5ddcf; color: var(--home-ink); padding-bottom: 64px; }
.home-page .app-container { max-width: 1120px; }
.home-hero { position: relative; display: flex; width: 100%; max-width: none; min-height: calc(100dvh - var(--header-height)); align-items: center; justify-content: center; overflow: hidden; isolation: isolate; padding-block: 80px 72px; }
.home-hero::before { position: absolute; z-index: 0; inset: 0; background: radial-gradient(ellipse 88% 72% at 30% 42%, rgb(255 251 243 / 62%), transparent 76%), radial-gradient(ellipse 74% 66% at 70% 56%, rgb(228 199 164 / 24%), transparent 78%), linear-gradient(120deg, #f6efe4 0%, #f5eee3 52%, #eee4d4 100%); content: ''; animation: hero-base-breathe 24s ease-in-out infinite alternate; pointer-events: none; }
.home-hero::after { position: absolute; z-index: 0; inset: 0; background: radial-gradient(ellipse 92% 88% at 50% 50%, transparent 54%, rgb(117 92 67 / 5%) 100%); content: ''; pointer-events: none; }
.hero-particle-canvas { position: absolute; z-index: 2; inset: 0; width: 100%; height: 100%; pointer-events: none; }.hero-particle-canvas--settled { opacity: 1; }
.hero-atmosphere { position: absolute; z-index: 1; inset: -8%; overflow: hidden; pointer-events: none; transform: translate3d(var(--hero-shift-x, 0px), var(--hero-shift-y, 0px), 0); transition: transform 220ms cubic-bezier(.22, .8, .25, 1); will-change: transform; }
    .hero-atmosphere::before { position: absolute; inset: 8% -2% 8%; background: radial-gradient(ellipse 52% 42% at 64% 38%, rgb(214 163 116 / 48%), transparent 75%), radial-gradient(ellipse 58% 48% at 76% 68%, rgb(163 180 159 / 34%), transparent 76%), radial-gradient(ellipse 84% 64% at 40% 48%, rgb(255 252 244 / 58%), transparent 78%); content: ''; filter: blur(54px); animation: hero-atmosphere-breathe 24s ease-in-out infinite alternate; }
    .hero-atmosphere::after { position: absolute; inset: -14% -8% -12% 18%; background: linear-gradient(154deg, transparent 25%, rgb(217 165 113 / 25%) 39%, rgb(214 157 103 / 40%) 50%, transparent 67%), linear-gradient(28deg, transparent 34%, rgb(171 188 168 / 22%) 52%, transparent 72%); content: ''; filter: blur(24px); opacity: .96; transform: translate3d(calc(var(--hero-shift-x, 0px) * .28), calc(var(--hero-shift-y, 0px) * .22), 0); animation: hero-atmosphere-veil 28s ease-in-out infinite alternate; }
    .hero-light-sheet { position: absolute; display: block; border-radius: 50%; filter: blur(26px); opacity: .94; will-change: transform, opacity; }
    .hero-light-sheet--one { top: 6%; left: -16%; width: 96%; height: 36%; background: linear-gradient(95deg, transparent 0%, rgb(247 229 207 / 24%) 18%, rgb(211 163 117 / 46%) 48%, rgb(235 199 161 / 34%) 76%, transparent 100%); transform: translate3d(calc(var(--hero-shift-x, 0px) * .55), calc(var(--hero-shift-y, 0px) * .45), 0) rotate(-8deg); animation: hero-light-sheet-one 26s ease-in-out infinite alternate, hero-sheet-breathe 22s ease-in-out infinite alternate; }
    .hero-light-sheet--two { right: -18%; bottom: 4%; width: 100%; height: 42%; background: linear-gradient(102deg, transparent 0%, rgb(236 221 195 / 22%) 16%, rgb(164 181 159 / 36%) 48%, rgb(216 183 143 / 40%) 76%, transparent 100%); transform: translate3d(calc(var(--hero-shift-x, 0px) * -.8), calc(var(--hero-shift-y, 0px) * .65), 0) rotate(-9deg); animation: hero-light-sheet-two 28s ease-in-out infinite alternate, hero-sheet-breathe 24s ease-in-out -8s infinite alternate; }
    .hero-trace { position: absolute; display: block; width: 68%; height: 22%; border-top: 1px solid rgb(154 128 97 / 20%); border-radius: 50%; filter: blur(.6px); opacity: .62; transform: translate3d(var(--hero-shift-x, 0px), var(--hero-shift-y, 0px), 0); will-change: transform, opacity; }
.hero-trace--one { top: 21%; right: -4%; transform: translate3d(calc(var(--hero-shift-x, 0px) * .8), calc(var(--hero-shift-y, 0px) * .7), 0) rotate(-8deg); animation: hero-trace-drift-one 26s ease-in-out infinite alternate; }
.hero-trace--two { bottom: 19%; left: 1%; width: 64%; border-color: rgb(130 151 132 / 12%); transform: translate3d(calc(var(--hero-shift-x, 0px) * -.5), calc(var(--hero-shift-y, 0px) * .6), 0) rotate(-12deg); animation: hero-trace-drift-two 29s ease-in-out -10s infinite alternate; }
.hero-inner { position: relative; z-index: 3; display: flex; width: 100%; max-width: 1120px; align-items: center; justify-content: center; }
.hero-copy { position: relative; z-index: 1; display: flex; max-width: 1120px; flex-direction: column; align-items: center; padding: 24px; }
.hero-title { display: flex; max-width: 100%; min-height: clamp(90px, 10vw, 120px); align-items: center; justify-content: center; gap: .18em; margin: 0; font-size: clamp(36px, 6.8vw, 84px); font-weight: 800; letter-spacing: -.065em; line-height: 1.08; text-align: center; white-space: nowrap; opacity: 0; transform: translateY(5px) scale(.985); transition: opacity 1.4s cubic-bezier(.22, .8, .25, 1), transform 1.4s cubic-bezier(.22, .8, .25, 1); }.hero-title--ready { opacity: 1; transform: translateY(0) scale(1); }.hero-title__accent { color: var(--home-accent); }
.hero-button { display: inline-flex; min-height: 42px; align-items: center; justify-content: center; border-radius: 999px; padding: 0 18px; font-size: 13px; transition: transform .2s ease, background-color .2s ease, color .2s ease; }
.hero-button:hover { transform: translateY(-2px); }.hero-button:active { transform: translateY(1px) scale(.98); }
.hero-button--primary { background: #34453e; color: #fffaf2; }.hero-button--primary:hover { background: #25372f; }
.hero-button--secondary { border: 1px solid var(--home-line); color: var(--home-muted); background: rgb(255 250 242 / 68%); }.hero-button--secondary:hover { border-color: #bcb4a4; color: var(--home-accent); background: #fffaf2; }
.hero-scroll-cue { position: absolute; z-index: 3; bottom: 24px; left: 50%; display: grid; width: 28px; height: 30px; place-items: center; transform: translateX(-50%); opacity: .7; }
.hero-scroll-cue span { width: 13px; height: 13px; border-right: 1.5px solid var(--home-ink); border-bottom: 1.5px solid var(--home-ink); transform: rotate(45deg) translate(-2px, -2px); animation: hero-bounce 1.5s ease-in-out infinite; }
@keyframes hero-bounce { 0%, 100% { transform: rotate(45deg) translate(-2px, -2px); } 50% { transform: rotate(45deg) translate(4px, 4px); } }
    @keyframes hero-base-breathe { from { opacity: .82; } to { opacity: 1; } }
    @keyframes hero-atmosphere-breathe { from { transform: scale(.97) translate3d(-1%, 1%, 0); opacity: .7; } to { transform: scale(1.03) translate3d(1%, -1%, 0); opacity: 1; } }
    @keyframes hero-atmosphere-veil { from { opacity: .62; transform: translate3d(calc(var(--hero-shift-x, 0px) * .28 - 1%), calc(var(--hero-shift-y, 0px) * .22 + 1%), 0) scale(.98); } to { opacity: .94; transform: translate3d(calc(var(--hero-shift-x, 0px) * .28 + 1%), calc(var(--hero-shift-y, 0px) * .22 - 1%), 0) scale(1.02); } }
@keyframes hero-light-sheet-one { from { transform: translate3d(calc(var(--hero-shift-x, 0px) * .55 - 1%), calc(var(--hero-shift-y, 0px) * .45 + 2%), 0) rotate(-8deg) scale(.96); } to { transform: translate3d(calc(var(--hero-shift-x, 0px) * .55 + 1%), calc(var(--hero-shift-y, 0px) * .45 - 2%), 0) rotate(-5deg) scale(1.04); } }
@keyframes hero-light-sheet-two { from { transform: translate3d(calc(var(--hero-shift-x, 0px) * -.8 + 1%), calc(var(--hero-shift-y, 0px) * .65 - 2%), 0) rotate(-9deg) scale(1.02); } to { transform: translate3d(calc(var(--hero-shift-x, 0px) * -.8 - 1%), calc(var(--hero-shift-y, 0px) * .65 + 2%), 0) rotate(-5deg) scale(.96); } }
@keyframes hero-sheet-breathe { from { opacity: .48; } to { opacity: .82; } }
@keyframes hero-trace-drift-one { from { opacity: .24; transform: translate3d(calc(var(--hero-shift-x, 0px) * .8 - 1%), calc(var(--hero-shift-y, 0px) * .7 + 1%), 0) rotate(-8deg); } to { opacity: .58; transform: translate3d(calc(var(--hero-shift-x, 0px) * .8 + 1%), calc(var(--hero-shift-y, 0px) * .7 - 1%), 0) rotate(-4deg); } }
@keyframes hero-trace-drift-two { from { opacity: .2; transform: translate3d(calc(var(--hero-shift-x, 0px) * -.5 - 1%), calc(var(--hero-shift-y, 0px) * .6 + 1%), 0) rotate(-12deg); } to { opacity: .5; transform: translate3d(calc(var(--hero-shift-x, 0px) * -.5 + 1%), calc(var(--hero-shift-y, 0px) * .6 - 1%), 0) rotate(-8deg); } }
.home-lazy-section { content-visibility: auto; contain-intrinsic-size: 720px; scroll-margin-top: 94px; }.latest-section { padding-block: 24px 40px; }
.section-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-bottom: 22px; }.section-heading h2 { margin: 0; font-size: 25px; font-weight: 700; letter-spacing: -.025em; line-height: 1.4; }.section-heading > p { margin: 0; color: var(--home-muted); font-size: 13px; line-height: 1.7; }
.article-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }.article-row { display: grid; grid-template-columns: minmax(0, 1fr) 18px; gap: 16px; min-height: 178px; padding: 26px; border: 1px solid var(--home-line); border-radius: 18px; background: #fffaf2; transition: border-color .18s ease, background-color .18s ease; }.article-row:hover { border-color: #bcb4a4; background: #fffcf6; }.article-body { min-width: 0; }.article-meta { display: flex; flex-wrap: wrap; gap: 8px 14px; align-items: center; font-size: 12px; line-height: 1.6; color: var(--home-accent); }.article-meta time { color: var(--home-muted); font-variant-numeric: tabular-nums; }.article-body h3 { margin: 12px 0 10px; font-size: 19px; line-height: 1.55; font-weight: 650; overflow-wrap: anywhere; }.article-body p { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; margin: 0; color: var(--home-muted); font-size: 13px; line-height: 1.85; overflow-wrap: anywhere; }.article-arrow { align-self: end; color: #8b9187; font-size: 18px; }
.section-link { display: table; margin: 24px auto 0; padding: 10px 18px; color: var(--home-muted); font-size: 13px; }.section-link:hover { color: var(--home-accent); }.section-link span { margin-left: 10px; }.topics-section { padding-top: 32px; border-top: 1px solid var(--home-line); contain-intrinsic-size: auto 280px; }.category-list { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }.category-row { display: grid; grid-template-columns: minmax(0, 1fr) 16px; gap: 9px; padding: 20px; border: 1px solid var(--home-line); border-radius: 14px; background: #eee9df; transition: border-color .18s ease; }.category-row:nth-child(4n + 2) { background: #e9ece3; }.category-row:nth-child(4n + 3) { background: #f0e7db; }.category-row:nth-child(4n + 4) { background: #ebe8e1; }.category-row:hover { border-color: #bcb4a4; }.category-name { font-size: 15px; font-weight: 650; overflow-wrap: anywhere; }.category-description { grid-column: 1 / -1; color: var(--home-muted); font-size: 12px; line-height: 1.75; overflow-wrap: anywhere; }.category-arrow { grid-column: 2; grid-row: 1; color: #838b7f; }.category-skeleton { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; min-height: 110px; }.category-skeleton span { border: 1px solid var(--home-line); border-radius: 14px; background: #eee9df; }.category-error, .category-empty { color: var(--home-muted); font-size: 14px; padding-block: 20px; }.category-error button { border: 1px solid var(--home-line); border-radius: 999px; padding: 9px 16px; background: #fffaf2; color: var(--home-ink); cursor: pointer; }.home-page a:focus-visible, .home-page button:focus-visible { outline: 2px solid var(--home-accent); outline-offset: 4px; }.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }
@media (max-width: 760px) {
  .home-hero { min-height: calc(100dvh - var(--header-height)); padding-block: 44px 60px; }
  .hero-inner { padding-inline: 16px; }
  .hero-copy { width: 100%; padding: 18px 0; }
  .hero-title { width: 100%; min-height: 80px; font-size: clamp(24px, 7.8vw, 32px); gap: .05em; letter-spacing: -.12em; }
  .hero-atmosphere { inset: -5%; }
      .hero-atmosphere::before { inset: 8% 0 10%; background: radial-gradient(ellipse 78% 38% at 35% 30%, rgb(229 197 163 / 30%), transparent 76%), radial-gradient(ellipse 78% 42% at 65% 70%, rgb(177 190 169 / 22%), transparent 78%); filter: blur(34px); }
      .hero-atmosphere::after { inset: -8% -24% -10% 0; background: linear-gradient(158deg, transparent 24%, rgb(217 165 113 / 26%) 45%, rgb(214 157 103 / 34%) 55%, transparent 73%), linear-gradient(24deg, transparent 34%, rgb(171 188 168 / 23%) 54%, transparent 74%); filter: blur(22px); }
  .hero-light-sheet--one { top: 12%; left: -28%; width: 156%; height: 26%; opacity: .72; }
  .hero-light-sheet--two { right: -28%; bottom: 12%; width: 156%; height: 28%; opacity: .62; }
  .hero-trace { width: 88%; opacity: .36; }
  .hero-trace--one { top: 22%; right: -30%; }
  .hero-trace--two { bottom: 22%; left: -20%; }
  .section-heading { align-items: flex-start; flex-direction: column; gap: 6px; margin-bottom: 18px; }
  .section-heading h2 { font-size: 22px; }
  .article-list { grid-template-columns: 1fr; gap: 12px; }
  .article-row { min-height: 0; padding: 22px; }
  .article-body h3 { font-size: 18px; }
  .category-list, .category-skeleton { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .category-row { padding: 16px; }
  .home-page { padding-bottom: 40px; }
}
    @media (prefers-reduced-motion: reduce) { .hero-button, .hero-scroll-cue span, .hero-title, .hero-particle-canvas, .home-hero::before, .home-hero::after, .hero-atmosphere, .hero-atmosphere::before, .hero-atmosphere::after, .hero-light-sheet, .hero-trace, .article-row, .category-row { animation: none; transition: none; } }
</style>
