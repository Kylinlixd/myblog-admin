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
const compactScreen = typeof window !== 'undefined' && (window.matchMedia?.('(max-width: 760px)').matches || window.innerWidth < 760)
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
    heroSection.value?.style.setProperty('--hero-shift-x', `${pointerCurrent.x * 30}px`); heroSection.value?.style.setProperty('--hero-shift-y', `${pointerCurrent.y * 22}px`)
    heroSection.value?.style.setProperty('--hero-pointer-x', `${(pointerCurrent.x + .5) * 100}%`); heroSection.value?.style.setProperty('--hero-pointer-y', `${(pointerCurrent.y + .5) * 100}%`)
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
    particles = compactScreen ? [] : [...createTextPoints('探索技术', startX, startY, fontSize, '#27342f', 1), ...createTextPoints('无限可能', startX + fontSize * 4.55, startY, fontSize, '#b85e2d', 2)]
    const ambientPoints = compactScreen ? [
      [.2, .28, 1.1, .1, '#d7a56f'], [.38, .2, 1.5, .12, '#b9c1ad'], [.62, .24, 1.6, .12, '#d7a56f'], [.82, .32, 1.2, .1, '#c88753'],
      [.25, .58, 1.4, .1, '#c88753'], [.48, .66, 1.1, .1, '#d7a56f'], [.7, .6, 1.8, .12, '#879b8a'], [.88, .72, 1.2, .1, '#d7a56f']
    ] : [
      [.58, .22, 1.4, .16, '#c88753'], [.67, .18, 2.1, .2, '#d7a56f'], [.77, .24, 1.2, .13, '#879b8a'], [.86, .2, 1.6, .15, '#c88753'],
      [.62, .38, 1.1, .12, '#879b8a'], [.73, .36, 1.7, .17, '#d7a56f'], [.84, .41, 2.3, .2, '#c88753'], [.92, .35, 1.2, .13, '#b9c1ad'],
      [.57, .58, 2.1, .18, '#d7a56f'], [.68, .56, 1.2, .13, '#879b8a'], [.79, .61, 1.6, .15, '#c88753'], [.9, .57, 2, .17, '#d7a56f'],
      [.61, .76, 1.3, .13, '#b9c1ad'], [.72, .73, 2.2, .18, '#c88753'], [.83, .79, 1.1, .12, '#879b8a'], [.94, .72, 1.7, .15, '#d7a56f']
    ]
    ambient = ambientPoints.map(([x, y, radius, alpha, color], index) => ({ x: width * x, y: height * y, radius, alpha, color, phase: index * 1.37 }))
    network = compactScreen ? [] : [
      { x: width * .54, y: height * .2, width: width * .2, height: height * -.08, alpha: .14, phase: .4 },
      { x: width * .68, y: height * .27, width: width * .25, height: height * .1, alpha: .12, phase: 2.1 },
      { x: width * .58, y: height * .47, width: width * .25, height: height * -.12, alpha: .12, phase: 3.3 },
      { x: width * .72, y: height * .62, width: width * .2, height: height * .1, alpha: .1, phase: 4.6 },
      { x: width * .63, y: height * .78, width: width * .28, height: height * -.08, alpha: .1, phase: 5.8 }
    ]
    startedAt = performance.now()
  }
  function drawFlowRibbons(now, elapsed) {
    const breath = reduceMotion ? 0 : Math.sin(now / 9200) * .5 + .5
    const shiftX = pointerCurrent.x * width * .025; const shiftY = pointerCurrent.y * height * .02
    const ribbons = compactScreen ? [
      { y: .32, bend: .07, phase: .3, colors: ['rgb(255 249 238 / 0%)', `rgb(226 185 139 / ${.17 + breath * .055})`, 'rgb(255 249 238 / 0%)'] },
      { y: .63, bend: -.06, phase: 2.5, colors: ['rgb(255 249 238 / 0%)', `rgb(169 187 166 / ${.13 + breath * .045})`, 'rgb(255 249 238 / 0%)'] }
    ] : [
      { y: .24, bend: -.12, phase: .2, colors: ['rgb(206 150 101 / 0%)', `rgb(206 150 101 / ${.11 + breath * .045})`, 'rgb(234 202 164 / 0%)'] },
      { y: .4, bend: .1, phase: 1.7, colors: ['rgb(255 249 238 / 0%)', `rgb(255 249 238 / ${.16 + breath * .04})`, 'rgb(188 204 187 / 0%)'] },
      { y: .62, bend: -.09, phase: 3.1, colors: ['rgb(173 193 169 / 0%)', `rgb(151 173 151 / ${.1 + breath * .035})`, 'rgb(206 150 101 / 0%)'] },
      { y: .78, bend: .08, phase: 4.4, colors: ['rgb(206 150 101 / 0%)', `rgb(206 150 101 / ${.08 + breath * .035})`, 'rgb(234 202 164 / 0%)'] }
    ]
    for (const ribbon of ribbons) {
      const drift = reduceMotion ? 0 : Math.sin(now / 7800 + ribbon.phase) * height * .014
      const startX = width * (compactScreen ? .02 : .12) + shiftX; const endX = width * (compactScreen ? 1.08 : 1.08) + shiftX; const startY = height * ribbon.y + drift + shiftY
      const gradient = context.createLinearGradient(startX, 0, endX, 0); gradient.addColorStop(0, ribbon.colors[0]); gradient.addColorStop(.48, ribbon.colors[1]); gradient.addColorStop(1, ribbon.colors[2])
      context.save(); context.beginPath(); context.moveTo(startX, startY); context.bezierCurveTo(width * .38 + shiftX, startY + height * ribbon.bend, width * .7 + shiftX, startY - height * ribbon.bend, endX, startY + drift * .6)
      context.lineWidth = Math.max(compactScreen ? 30 : 24, width * .018); context.lineCap = 'round'; context.strokeStyle = gradient; context.globalAlpha = .78; context.shadowBlur = compactScreen ? 30 : 24; context.shadowColor = 'rgb(202 150 102 / 14%)'; context.stroke(); context.restore()
    }
    void elapsed
  }
  function drawOrbitSystem(now) {
    if (compactScreen) return
    const centerX = width * .76 + pointerCurrent.x * width * .02; const centerY = height * (.52 + pointerCurrent.y * .018)
    const orbits = [
      { rx: width * .35, ry: height * .16, rotation: -.16, alpha: .1, phase: .2 },
      { rx: width * .29, ry: height * .24, rotation: .22, alpha: .075, phase: 2.1 },
      { rx: width * .2, ry: height * .31, rotation: -.42, alpha: .06, phase: 4.2 }
    ]
    for (const orbit of orbits) {
      context.save(); context.translate(centerX, centerY); context.rotate(orbit.rotation); context.beginPath(); context.ellipse(0, 0, orbit.rx, orbit.ry, 0, Math.PI * .12, Math.PI * 1.86); context.strokeStyle = `rgb(137 151 133 / ${orbit.alpha})`; context.lineWidth = 1.4; context.stroke()
      const angle = reduceMotion ? orbit.phase : now / 12000 + orbit.phase; const dotX = Math.cos(angle) * orbit.rx; const dotY = Math.sin(angle) * orbit.ry
      context.beginPath(); context.arc(dotX, dotY, 2.1, 0, Math.PI * 2); context.fillStyle = 'rgb(202 137 80 / 24%)'; context.shadowBlur = 12; context.shadowColor = 'rgb(202 137 80 / 25%)'; context.fill(); context.restore()
    }
  }
  function drawAtmosphere(now, elapsed) {
    const breath = reduceMotion ? 0 : Math.sin(now / 11000) * .5 + .5; const parallaxX = pointerCurrent.x * width * .018; const parallaxY = pointerCurrent.y * height * .014; const centerX = width * (.69 + Math.sin(now / 17000) * .018) + parallaxX; const centerY = height * (.5 + Math.cos(now / 14500) * .024) + parallaxY
    const leftLight = context.createRadialGradient(width * .22 + parallaxX * .4, height * .5 + parallaxY, 0, width * .22 + parallaxX * .4, height * .5 + parallaxY, width * .62)
    leftLight.addColorStop(0, `rgb(255 249 238 / ${.14 + breath * .03})`); leftLight.addColorStop(.52, 'rgb(236 216 193 / 8%)'); leftLight.addColorStop(1, 'rgb(248 241 229 / 0%)'); context.fillStyle = leftLight; context.fillRect(0, 0, width, height)
    const cloud = context.createRadialGradient(centerX, centerY, width * .025, centerX, centerY, width * .72)
    cloud.addColorStop(0, `rgb(194 140 91 / ${.16 + breath * .06})`); cloud.addColorStop(.28, `rgb(220 187 145 / ${.14 + breath * .045})`); cloud.addColorStop(.56, 'rgb(151 170 147 / 10%)'); cloud.addColorStop(1, 'rgb(248 241 229 / 0%)'); context.fillStyle = cloud; context.fillRect(0, 0, width, height)
    drawFlowRibbons(now, elapsed); drawOrbitSystem(now)
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
      context.beginPath(); context.arc(particle.x + driftX, particle.y + driftY, particle.radius, 0, Math.PI * 2); context.globalAlpha = particle.alpha * pulse; context.fillStyle = particle.color; context.shadowBlur = particle.radius > 2 ? 8 : 4; context.shadowColor = 'rgb(196 126 76 / 24%)'; context.fill()
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
  titleReadyTimer = window.setTimeout(() => { titleReady.value = true }, compactScreen ? 450 : 2200)
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
.home-hero::before { position: absolute; z-index: 1; inset: -12% -12% -10% -10%; border-radius: 50%; background: radial-gradient(ellipse 42% 58% at 27% 50%, rgb(255 249 238 / 28%), transparent 76%), radial-gradient(ellipse 62% 72% at 72% 42%, rgb(199 147 98 / 28%), transparent 72%), radial-gradient(ellipse 52% 64% at 70% 76%, rgb(141 162 141 / 22%), transparent 76%), radial-gradient(ellipse 80% 88% at 48% 54%, rgb(255 251 243 / 34%), transparent 74%); content: ''; filter: blur(62px); animation: hero-nebula 22s ease-in-out infinite alternate; pointer-events: none; }
.home-hero::after { position: absolute; z-index: 0; inset: 0; background: radial-gradient(ellipse 84% 94% at 52% 50%, transparent 45%, rgb(137 108 80 / 8%) 100%), radial-gradient(ellipse 58% 72% at 72% 48%, rgb(239 224 204 / 52%), transparent 78%), radial-gradient(ellipse 52% 76% at 24% 48%, rgb(244 229 211 / 30%), transparent 78%), linear-gradient(110deg, #f3eadc 0%, #f8f1e7 48%, #eee1cf 100%); content: ''; pointer-events: none; }
.hero-particle-canvas { position: absolute; z-index: 2; inset: 0; width: 100%; height: 100%; pointer-events: none; }.hero-particle-canvas--settled { opacity: 1; }
.hero-glow-field { position: absolute; z-index: 1; inset: -6%; overflow: hidden; pointer-events: none; box-shadow: inset 0 0 180px 28px rgb(116 91 67 / 12%); transform: translate3d(var(--hero-shift-x, 0px), var(--hero-shift-y, 0px), 0); will-change: transform; }.hero-glow-field::before, .hero-glow-field::after { position: absolute; display: block; width: 78%; height: 68%; border-radius: 50%; content: ''; filter: blur(58px); animation: hero-cloud 24s ease-in-out infinite alternate, hero-ribbon-breathe 11s ease-in-out infinite alternate; }.hero-glow-field::before { top: -2%; right: -8%; background: radial-gradient(ellipse at var(--hero-pointer-x, 72%) var(--hero-pointer-y, 48%), rgb(207 149 97 / 24%), transparent 48%), radial-gradient(ellipse at 68% 32%, rgb(237 201 160 / 24%), transparent 64%), radial-gradient(ellipse at 44% 72%, rgb(141 163 142 / 18%), transparent 68%); }.hero-glow-field::after { right: -3%; bottom: -8%; background: radial-gradient(ellipse at 45% 36%, rgb(225 191 149 / 20%), transparent 58%), radial-gradient(ellipse at 72% 70%, rgb(136 159 139 / 18%), transparent 70%), linear-gradient(145deg, transparent 25%, rgb(211 161 111 / 14%) 55%, transparent 80%); animation-delay: -12s, -5s; }.hero-glow-field { opacity: .92; animation: hero-field-breathe 18s ease-in-out infinite alternate; }
.hero-blob { position: absolute; display: block; overflow: hidden; border-radius: 63% 37% 46% 54% / 45% 58% 42% 55%; filter: blur(30px); mix-blend-mode: multiply; opacity: .4; will-change: transform, border-radius; animation: hero-blob-morph 22s ease-in-out infinite alternate, hero-blob-breathe 12s ease-in-out infinite alternate; }.hero-blob--one { top: 13%; right: 4%; width: 58%; height: 52%; background: radial-gradient(ellipse at 40% 38%, rgb(215 169 119 / 82%), transparent 61%), radial-gradient(ellipse at 72% 63%, rgb(132 158 137 / 68%), transparent 70%); }.hero-blob--two { top: 32%; right: 13%; width: 54%; height: 48%; background: radial-gradient(ellipse at 60% 38%, rgb(238 216 182 / 86%), transparent 62%), radial-gradient(ellipse at 38% 68%, rgb(180 137 98 / 54%), transparent 69%); animation-delay: -7s, -3s; }.hero-blob--three { top: 18%; right: 27%; width: 44%; height: 44%; background: radial-gradient(ellipse at 58% 48%, rgb(154 170 146 / 64%), transparent 64%), radial-gradient(ellipse at 35% 52%, rgb(245 226 204 / 78%), transparent 72%); animation-delay: -13s, -6s; }
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
@keyframes hero-glow-drift { from { transform: translate3d(-8px, 5px, 0) scale(.92); opacity: .48; } to { transform: translate3d(8px, -7px, 0) scale(1.08); opacity: .82; } }
@keyframes hero-nebula { from { transform: translate3d(-2%, 1%, 0) rotate(-2deg) scale(.96); opacity: .62; } to { transform: translate3d(3%, -2%, 0) rotate(3deg) scale(1.05); opacity: .96; } }
@keyframes hero-cloud { from { transform: translate3d(-3%, 2%, 0) scale(.94) rotate(-3deg); opacity: .48; } to { transform: translate3d(4%, -3%, 0) scale(1.08) rotate(3deg); opacity: .95; } }
@keyframes hero-field-breathe { from { opacity: .58; } to { opacity: .9; } }
@keyframes hero-ribbon-breathe { from { opacity: .68; } 50% { opacity: .96; } to { opacity: .76; } }
@keyframes hero-blob-morph { from { transform: translate3d(-2%, 2%, 0) rotate(-7deg) scale(.9); border-radius: 63% 37% 46% 54% / 45% 58% 42% 55%; } 50% { border-radius: 42% 58% 64% 36% / 58% 38% 62% 42%; } to { transform: translate3d(4%, -3%, 0) rotate(8deg) scale(1.06); border-radius: 54% 46% 36% 64% / 38% 62% 44% 56%; } }
@keyframes hero-blob-breathe { from { opacity: .16; filter: blur(28px); } to { opacity: .34; filter: blur(19px); } }
.home-lazy-section { content-visibility: auto; contain-intrinsic-size: 720px; scroll-margin-top: 94px; }.latest-section { padding-block: 24px 40px; }
.section-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-bottom: 22px; }.section-heading h2 { margin: 0; font-size: 25px; font-weight: 700; letter-spacing: -.025em; line-height: 1.4; }.section-heading > p { margin: 0; color: var(--home-muted); font-size: 13px; line-height: 1.7; }
.article-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }.article-row { display: grid; grid-template-columns: minmax(0, 1fr) 18px; gap: 16px; min-height: 178px; padding: 26px; border: 1px solid var(--home-line); border-radius: 18px; background: #fffaf2; transition: border-color .18s ease, background-color .18s ease; }.article-row:hover { border-color: #bcb4a4; background: #fffcf6; }.article-body { min-width: 0; }.article-meta { display: flex; flex-wrap: wrap; gap: 8px 14px; align-items: center; font-size: 12px; line-height: 1.6; color: var(--home-accent); }.article-meta time { color: var(--home-muted); font-variant-numeric: tabular-nums; }.article-body h3 { margin: 12px 0 10px; font-size: 19px; line-height: 1.55; font-weight: 650; overflow-wrap: anywhere; }.article-body p { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; margin: 0; color: var(--home-muted); font-size: 13px; line-height: 1.85; overflow-wrap: anywhere; }.article-arrow { align-self: end; color: #8b9187; font-size: 18px; }
.section-link { display: table; margin: 24px auto 0; padding: 10px 18px; color: var(--home-muted); font-size: 13px; }.section-link:hover { color: var(--home-accent); }.section-link span { margin-left: 10px; }.topics-section { padding-top: 32px; border-top: 1px solid var(--home-line); contain-intrinsic-size: auto 280px; }.category-list { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }.category-row { display: grid; grid-template-columns: minmax(0, 1fr) 16px; gap: 9px; padding: 20px; border: 1px solid var(--home-line); border-radius: 14px; background: #eee9df; transition: border-color .18s ease; }.category-row:nth-child(4n + 2) { background: #e9ece3; }.category-row:nth-child(4n + 3) { background: #f0e7db; }.category-row:nth-child(4n + 4) { background: #ebe8e1; }.category-row:hover { border-color: #bcb4a4; }.category-name { font-size: 15px; font-weight: 650; overflow-wrap: anywhere; }.category-description { grid-column: 1 / -1; color: var(--home-muted); font-size: 12px; line-height: 1.75; overflow-wrap: anywhere; }.category-arrow { grid-column: 2; grid-row: 1; color: #838b7f; }.category-skeleton { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; min-height: 110px; }.category-skeleton span { border: 1px solid var(--home-line); border-radius: 14px; background: #eee9df; }.category-error, .category-empty { color: var(--home-muted); font-size: 14px; padding-block: 20px; }.category-error button { border: 1px solid var(--home-line); border-radius: 999px; padding: 9px 16px; background: #fffaf2; color: var(--home-ink); cursor: pointer; }.home-page a:focus-visible, .home-page button:focus-visible { outline: 2px solid var(--home-accent); outline-offset: 4px; }.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }
@media (max-width: 760px) {
  .home-hero { min-height: calc(100dvh - var(--header-height)); padding-block: 44px 60px; }
  .home-hero::before { inset: -18%; background: radial-gradient(ellipse 92% 66% at 50% 42%, rgb(213 172 128 / 22%), transparent 74%), radial-gradient(ellipse 100% 62% at 28% 72%, rgb(252 242 226 / 18%), transparent 78%), radial-gradient(ellipse 100% 58% at 76% 66%, rgb(155 174 152 / 13%), transparent 80%); filter: blur(55px); }
  .home-hero::after { background: linear-gradient(155deg, #f4ede2 0%, #f8f1e7 50%, #f1e8da 100%); }
  .hero-inner { padding-inline: 16px; }
  .hero-copy { width: 100%; padding: 18px 0; }
  .hero-title { width: 100%; min-height: 80px; font-size: clamp(24px, 7.8vw, 32px); gap: .05em; letter-spacing: -.12em; }
  .hero-glow-field { inset: -3%; box-shadow: inset 0 0 120px 20px rgb(116 91 67 / 8%); }
  .hero-glow-field::before, .hero-glow-field::after { left: -5%; right: auto; width: 110%; height: 60%; filter: blur(44px); }
  .hero-glow-field::before { top: 0; background: radial-gradient(ellipse at var(--hero-pointer-x, 50%) var(--hero-pointer-y, 48%), rgb(207 149 97 / 18%), transparent 55%), radial-gradient(ellipse at 52% 45%, rgb(237 201 160 / 20%), transparent 72%); }
  .hero-glow-field::after { bottom: -8%; background: radial-gradient(ellipse at 42% 48%, rgb(225 191 149 / 16%), transparent 66%), radial-gradient(ellipse at 68% 58%, rgb(136 159 139 / 13%), transparent 74%); }
  .hero-blob { opacity: .12; filter: blur(34px); }
  .hero-blob--one { right: -12%; width: 120%; }
  .hero-blob--two { right: -8%; width: 116%; }
  .hero-blob--three { right: -6%; width: 112%; }
  .section-heading { align-items: flex-start; flex-direction: column; gap: 6px; margin-bottom: 18px; }
  .section-heading h2 { font-size: 22px; }
  .article-list { grid-template-columns: 1fr; gap: 12px; }
  .article-row { min-height: 0; padding: 22px; }
  .article-body h3 { font-size: 18px; }
  .category-list, .category-skeleton { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .category-row { padding: 16px; }
  .home-page { padding-bottom: 40px; }
}
@media (prefers-reduced-motion: reduce) { .hero-button, .hero-scroll-cue span, .hero-title, .hero-particle-canvas, .home-hero::before, .home-hero::after, .hero-glow-field, .hero-glow-field::before, .hero-glow-field::after, .hero-blob, .article-row, .category-row { animation: none; transition: none; } }
</style>
