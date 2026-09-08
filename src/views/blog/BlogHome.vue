<template>
  <div class="home-page">
    <section ref="heroSection" class="home-hero" aria-labelledby="home-title" @pointermove="handleHeroPointer" @pointerleave="resetHeroPointer">
      <canvas ref="particleCanvas" class="hero-particle-canvas" :class="{ 'hero-particle-canvas--settled': titleReady }" aria-hidden="true" />
      <div class="hero-glow-field" aria-hidden="true"><span class="hero-blob hero-blob--one" /><span class="hero-blob hero-blob--two" /><span class="hero-blob hero-blob--three" /></div>
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
let titleReadyTimer
let pointerFrame
let pointerTarget = { x: 0, y: 0 }
let pointerCurrent = { x: 0, y: 0 }
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
function animateHeroPointer() {
  if (pointerFrame) return
  const tick = () => {
    pointerCurrent.x += (pointerTarget.x - pointerCurrent.x) * .075; pointerCurrent.y += (pointerTarget.y - pointerCurrent.y) * .075
    heroSection.value?.style.setProperty('--hero-shift-x', `${pointerCurrent.x * 18}px`); heroSection.value?.style.setProperty('--hero-shift-y', `${pointerCurrent.y * 14}px`)
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
  let particles = []; let ambient = []; let network = []; let width = 0; let height = 0; let startedAt = 0
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
    const fontSize = Math.min(84, Math.max(42, width * 0.068)); const titleWidth = fontSize * 8.8; const startX = Math.max(18, (width - titleWidth) / 2); const startY = Math.max(70, (height - fontSize) / 2)
    particles = [...createTextPoints('探索技术', startX, startY, fontSize, '#27342f', 1), ...createTextPoints('无限可能', startX + fontSize * 4.55, startY, fontSize, '#b85e2d', 2)]
    ambient = Array.from({ length: 8 }, (_, index) => ({ x: width * (0.66 + ((index * 19) % 26) / 100), y: height * (0.18 + ((index * 31) % 52) / 100), radius: 1.1 + (index % 3) * .55, alpha: 0.1 + (index % 3) * 0.02, phase: index * 1.9 }))
    network = [
      { x: width * .69, y: height * .22, width: width * .22, height: height * .08, alpha: .1, phase: .4 },
      { x: width * .75, y: height * .42, width: width * .18, height: -height * .06, alpha: .08, phase: 2.1 }
    ]
    startedAt = performance.now()
  }
  function drawAtmosphere(now, elapsed) {
    const breath = reduceMotion ? 0 : Math.sin(now / 11000) * .5 + .5; const centerX = width * (.68 + Math.sin(now / 17000) * .012); const centerY = height * (.5 + Math.cos(now / 14500) * .018)
    const leftLight = context.createRadialGradient(width * .24, height * .5, 0, width * .24, height * .5, width * .54)
    leftLight.addColorStop(0, `rgb(255 249 238 / ${.1 + breath * .025})`); leftLight.addColorStop(.55, 'rgb(236 216 193 / 6%)'); leftLight.addColorStop(1, 'rgb(248 241 229 / 0%)'); context.fillStyle = leftLight; context.fillRect(0, 0, width, height)
    const cloud = context.createRadialGradient(centerX, centerY, width * .02, centerX, centerY, width * .7)
    cloud.addColorStop(0, `rgb(194 140 91 / ${.1 + breath * .035})`); cloud.addColorStop(.3, `rgb(220 187 145 / ${.09 + breath * .025})`); cloud.addColorStop(.58, 'rgb(151 170 147 / 6%)'); cloud.addColorStop(1, 'rgb(248 241 229 / 0%)')
    context.fillStyle = cloud; context.fillRect(0, 0, width, height)
  }
  function render(now) {
    if (!width || !height) resize(); context.clearRect(0, 0, width, height); const elapsed = now - startedAt
    drawAtmosphere(now, elapsed)
    context.lineWidth = 1
    for (const path of network) {
      const motion = reduceMotion ? 0 : Math.sin(now / 6200 + path.phase) * 8; const startX = path.x + motion; const startY = path.y; const endX = startX + path.width; const endY = startY + path.height
      context.beginPath(); context.moveTo(startX, startY); context.bezierCurveTo(startX + path.width * .32, startY - path.height * .8, endX - path.width * .28, endY + path.height * .8, endX, endY); context.strokeStyle = `rgb(122 132 116 / ${path.alpha})`; context.stroke()
      const progress = reduceMotion ? .55 : (elapsed / 9000 + path.phase / 8) % 1; const pulseX = startX + path.width * progress; const pulseY = startY + path.height * (.28 + Math.sin(progress * Math.PI) * .2)
      context.beginPath(); context.arc(pulseX, pulseY, 1.7, 0, Math.PI * 2); context.fillStyle = `rgb(198 133 79 / ${path.alpha * 2.6})`; context.shadowBlur = 8; context.shadowColor = 'rgb(198 133 79 / 28%)'; context.fill(); context.shadowBlur = 0
    }
    for (const particle of ambient) {
      const driftX = reduceMotion ? 0 : Math.sin(now / 4700 + particle.phase) * 12; const driftY = reduceMotion ? 0 : Math.cos(now / 5800 + particle.phase) * 9; const pulse = reduceMotion ? 1 : .72 + Math.sin(now / 2100 + particle.phase) * .22
      context.beginPath(); context.arc(particle.x + driftX, particle.y + driftY, particle.radius, 0, Math.PI * 2); context.globalAlpha = particle.alpha * pulse; context.fillStyle = particle.phase % 2 > 1 ? '#c88652' : '#879886'; context.shadowBlur = particle.radius > 2 ? 8 : 4; context.shadowColor = 'rgb(196 126 76 / 24%)'; context.fill()
    }
    for (const particle of particles) {
      const duration = particle.color === '#27342f' ? 1050 : 1450; const progress = reduceMotion ? 1 : Math.min(1, Math.max(0, (elapsed - particle.delay) / duration)); const eased = 1 - Math.pow(1 - progress, 3); const drift = progress === 1 && !reduceMotion ? Math.sin(now / 1700 + particle.x) * 0.45 : 0
      const titleAlpha = titleReady.value ? 0 : 1; context.globalAlpha = (0.28 + eased * 0.72) * titleAlpha; context.fillStyle = particle.color; context.shadowBlur = particle.color === '#b85e2d' ? 7 : 0; context.shadowColor = 'rgb(184 94 45 / 35%)'; context.fillRect(particle.startX + (particle.x - particle.startX) * eased, particle.startY + (particle.y - particle.startY) * eased + drift, particleSize, particleSize)
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
onBeforeUnmount(() => { categoryObserver?.disconnect(); latestObserver?.disconnect(); particleResizeObserver?.disconnect(); cancelAnimationFrame(particleFrame); cancelAnimationFrame(pointerFrame); window.clearTimeout(titleReadyTimer) })
</script>

<style scoped>
.home-page { --header-height: 62px; --home-ink: #27342f; --home-muted: #687068; --home-accent: #b85e2d; --home-line: #e5ddcf; color: var(--home-ink); padding-bottom: 64px; }
.home-page .app-container { max-width: 1120px; }
.home-hero { position: relative; display: flex; width: 100%; max-width: none; min-height: calc(100dvh - var(--header-height)); align-items: center; justify-content: center; overflow: hidden; isolation: isolate; padding-block: 80px 72px; }
.home-hero::before { position: absolute; z-index: -2; inset: -8% -10% -8% -6%; border-radius: 50%; background: radial-gradient(ellipse 38% 54% at 26% 48%, rgb(237 216 194 / 18%), transparent 76%), radial-gradient(ellipse 56% 68% at 68% 43%, rgb(199 147 98 / 20%), transparent 72%), radial-gradient(ellipse 48% 58% at 73% 72%, rgb(141 162 141 / 15%), transparent 76%), radial-gradient(ellipse 74% 82% at 48% 54%, rgb(255 251 243 / 26%), transparent 74%); content: ''; filter: blur(54px); animation: hero-nebula 22s ease-in-out infinite alternate; }
.home-hero::after { position: absolute; z-index: -3; inset: 0; background: radial-gradient(ellipse 84% 94% at 52% 50%, transparent 48%, rgb(137 108 80 / 5%) 100%), radial-gradient(ellipse 48% 66% at 70% 48%, rgb(239 224 204 / 42%), transparent 78%), radial-gradient(ellipse 44% 70% at 24% 48%, rgb(244 229 211 / 22%), transparent 78%), linear-gradient(110deg, #f4ede2 0%, #f7f0e6 50%, #f1e9dc 100%); content: ''; }
.hero-particle-canvas { position: absolute; z-index: -1; inset: 0; width: 100%; height: 100%; pointer-events: none; }.hero-particle-canvas--settled { opacity: 1; }
.hero-glow-field { position: absolute; z-index: -1; inset: -3%; overflow: hidden; pointer-events: none; box-shadow: inset 0 0 180px 28px rgb(116 91 67 / 8%); transform: translate3d(var(--hero-shift-x, 0px), var(--hero-shift-y, 0px), 0); will-change: transform; }.hero-glow-field::before, .hero-glow-field::after { position: absolute; display: block; width: 62%; height: 56%; border-radius: 50%; background: radial-gradient(ellipse at 52% 45%, rgb(201 149 99 / 10%), transparent 65%), radial-gradient(ellipse at 72% 66%, rgb(141 162 141 / 8%), transparent 72%); content: ''; filter: blur(52px); animation: hero-cloud 24s ease-in-out infinite alternate; }.hero-glow-field::before { top: 5%; right: -8%; }.hero-glow-field::after { right: 3%; bottom: 1%; background: radial-gradient(ellipse at 46% 44%, rgb(224 190 149 / 8%), transparent 68%), radial-gradient(ellipse at 78% 60%, rgb(136 159 139 / 9%), transparent 72%); animation-delay: -12s; }.hero-glow-field { opacity: .72; animation: hero-field-breathe 18s ease-in-out infinite alternate; }
.hero-blob { position: absolute; display: block; overflow: hidden; border-radius: 63% 37% 46% 54% / 45% 58% 42% 55%; filter: blur(22px); mix-blend-mode: multiply; opacity: .27; will-change: transform, border-radius; animation: hero-blob-morph 22s ease-in-out infinite alternate, hero-blob-breathe 12s ease-in-out infinite alternate; }.hero-blob--one { top: 18%; right: 9%; width: 51%; height: 47%; background: radial-gradient(ellipse at 40% 38%, rgb(215 169 119 / 70%), transparent 61%), radial-gradient(ellipse at 72% 63%, rgb(132 158 137 / 58%), transparent 70%); }.hero-blob--two { top: 34%; right: 19%; width: 47%; height: 43%; background: radial-gradient(ellipse at 60% 38%, rgb(238 216 182 / 75%), transparent 62%), radial-gradient(ellipse at 38% 68%, rgb(180 137 98 / 42%), transparent 69%); animation-delay: -7s, -3s; }.hero-blob--three { top: 22%; right: 31%; width: 38%; height: 38%; background: radial-gradient(ellipse at 58% 48%, rgb(154 170 146 / 48%), transparent 64%), radial-gradient(ellipse at 35% 52%, rgb(245 226 204 / 64%), transparent 72%); animation-delay: -13s, -6s; }
.hero-inner { display: flex; width: 100%; max-width: 1120px; align-items: center; justify-content: center; }
.hero-copy { position: relative; z-index: 1; display: flex; max-width: 1120px; flex-direction: column; align-items: center; padding: 24px; }
.hero-title { display: flex; max-width: 100%; min-height: clamp(90px, 10vw, 120px); align-items: center; justify-content: center; gap: .18em; margin: 0; font-size: clamp(36px, 6.8vw, 84px); font-weight: 800; letter-spacing: -.065em; line-height: 1.08; text-align: center; white-space: nowrap; opacity: 0; transform: translateY(5px) scale(.985); transition: opacity 1.4s cubic-bezier(.22, .8, .25, 1), transform 1.4s cubic-bezier(.22, .8, .25, 1); }.hero-title--ready { opacity: 1; transform: translateY(0) scale(1); }.hero-title__accent { color: var(--home-accent); }
.hero-button { display: inline-flex; min-height: 42px; align-items: center; justify-content: center; border-radius: 999px; padding: 0 18px; font-size: 13px; transition: transform .2s ease, background-color .2s ease, color .2s ease; }
.hero-button:hover { transform: translateY(-2px); }.hero-button:active { transform: translateY(1px) scale(.98); }
.hero-button--primary { background: #34453e; color: #fffaf2; }.hero-button--primary:hover { background: #25372f; }
.hero-button--secondary { border: 1px solid var(--home-line); color: var(--home-muted); background: rgb(255 250 242 / 68%); }.hero-button--secondary:hover { border-color: #bcb4a4; color: var(--home-accent); background: #fffaf2; }
.hero-scroll-cue { position: absolute; bottom: 24px; left: 50%; display: grid; width: 28px; height: 30px; place-items: center; transform: translateX(-50%); opacity: .7; }
.hero-scroll-cue span { width: 13px; height: 13px; border-right: 1.5px solid var(--home-ink); border-bottom: 1.5px solid var(--home-ink); transform: rotate(45deg) translate(-2px, -2px); animation: hero-bounce 1.5s ease-in-out infinite; }
@keyframes hero-bounce { 0%, 100% { transform: rotate(45deg) translate(-2px, -2px); } 50% { transform: rotate(45deg) translate(4px, 4px); } }
@keyframes hero-glow-drift { from { transform: translate3d(-8px, 5px, 0) scale(.92); opacity: .48; } to { transform: translate3d(8px, -7px, 0) scale(1.08); opacity: .82; } }
@keyframes hero-nebula { from { transform: translate3d(-2%, 1%, 0) rotate(-2deg) scale(.96); opacity: .62; } to { transform: translate3d(3%, -2%, 0) rotate(3deg) scale(1.05); opacity: .96; } }
@keyframes hero-cloud { from { transform: translate3d(-3%, 2%, 0) scale(.94) rotate(-3deg); opacity: .48; } to { transform: translate3d(4%, -3%, 0) scale(1.08) rotate(3deg); opacity: .95; } }
@keyframes hero-field-breathe { from { opacity: .58; } to { opacity: .9; } }
@keyframes hero-blob-morph { from { transform: translate3d(-2%, 2%, 0) rotate(-7deg) scale(.9); border-radius: 63% 37% 46% 54% / 45% 58% 42% 55%; } 50% { border-radius: 42% 58% 64% 36% / 58% 38% 62% 42%; } to { transform: translate3d(4%, -3%, 0) rotate(8deg) scale(1.06); border-radius: 54% 46% 36% 64% / 38% 62% 44% 56%; } }
@keyframes hero-blob-breathe { from { opacity: .16; filter: blur(28px); } to { opacity: .34; filter: blur(19px); } }
.home-lazy-section { content-visibility: auto; contain-intrinsic-size: 720px; scroll-margin-top: 94px; }.latest-section { padding-block: 24px 40px; }
.section-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-bottom: 22px; }.section-heading h2 { margin: 0; font-size: 25px; font-weight: 700; letter-spacing: -.025em; line-height: 1.4; }.section-heading > p { margin: 0; color: var(--home-muted); font-size: 13px; line-height: 1.7; }
.article-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }.article-row { display: grid; grid-template-columns: minmax(0, 1fr) 18px; gap: 16px; min-height: 178px; padding: 26px; border: 1px solid var(--home-line); border-radius: 18px; background: #fffaf2; transition: border-color .18s ease, background-color .18s ease; }.article-row:hover { border-color: #bcb4a4; background: #fffcf6; }.article-body { min-width: 0; }.article-meta { display: flex; flex-wrap: wrap; gap: 8px 14px; align-items: center; font-size: 12px; line-height: 1.6; color: var(--home-accent); }.article-meta time { color: var(--home-muted); font-variant-numeric: tabular-nums; }.article-body h3 { margin: 12px 0 10px; font-size: 19px; line-height: 1.55; font-weight: 650; overflow-wrap: anywhere; }.article-body p { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; margin: 0; color: var(--home-muted); font-size: 13px; line-height: 1.85; overflow-wrap: anywhere; }.article-arrow { align-self: end; color: #8b9187; font-size: 18px; }
.section-link { display: table; margin: 24px auto 0; padding: 10px 18px; color: var(--home-muted); font-size: 13px; }.section-link:hover { color: var(--home-accent); }.section-link span { margin-left: 10px; }.topics-section { padding-top: 32px; border-top: 1px solid var(--home-line); contain-intrinsic-size: auto 280px; }.category-list { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }.category-row { display: grid; grid-template-columns: minmax(0, 1fr) 16px; gap: 9px; padding: 20px; border: 1px solid var(--home-line); border-radius: 14px; background: #eee9df; transition: border-color .18s ease; }.category-row:nth-child(4n + 2) { background: #e9ece3; }.category-row:nth-child(4n + 3) { background: #f0e7db; }.category-row:nth-child(4n + 4) { background: #ebe8e1; }.category-row:hover { border-color: #bcb4a4; }.category-name { font-size: 15px; font-weight: 650; overflow-wrap: anywhere; }.category-description { grid-column: 1 / -1; color: var(--home-muted); font-size: 12px; line-height: 1.75; overflow-wrap: anywhere; }.category-arrow { grid-column: 2; grid-row: 1; color: #838b7f; }.category-skeleton { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; min-height: 110px; }.category-skeleton span { border: 1px solid var(--home-line); border-radius: 14px; background: #eee9df; }.category-error, .category-empty { color: var(--home-muted); font-size: 14px; padding-block: 20px; }.category-error button { border: 1px solid var(--home-line); border-radius: 999px; padding: 9px 16px; background: #fffaf2; color: var(--home-ink); cursor: pointer; }.home-page a:focus-visible, .home-page button:focus-visible { outline: 2px solid var(--home-accent); outline-offset: 4px; }.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }
@media (max-width: 760px) { .home-hero { min-height: calc(100dvh - var(--header-height)); padding-block: 44px 60px; }.hero-copy { padding: 18px; }.hero-title { min-height: 80px; font-size: clamp(28px, 8.7vw, 54px); gap: .12em; }.hero-glow--one { right: 8%; }.hero-glow--two { right: 18%; }.section-heading { align-items: flex-start; flex-direction: column; gap: 6px; margin-bottom: 18px; }.section-heading h2 { font-size: 22px; }.article-list { grid-template-columns: 1fr; gap: 12px; }.article-row { min-height: 0; padding: 22px; }.article-body h3 { font-size: 18px; }.category-list, .category-skeleton { grid-template-columns: repeat(2, minmax(0, 1fr)); }.category-row { padding: 16px; }.home-page { padding-bottom: 40px; } }
@media (prefers-reduced-motion: reduce) { .hero-button, .hero-scroll-cue span, .hero-title, .hero-particle-canvas, .home-hero::before, .home-hero::after, .hero-glow-field, .hero-glow-field::before, .hero-glow-field::after, .hero-blob, .article-row, .category-row { animation: none; transition: none; } }
</style>
