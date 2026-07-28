<template>
  <main ref="homePage" class="home-page">
    <section class="hero app-container" @pointermove="moveHero" @pointerleave="resetHero">
      <div class="hero-ambient" aria-hidden="true" />
      <div class="hero-stage">
        <div class="hero-copy">
          <h1 class="hero-title" aria-label="探索技术，无限可能">
            <span class="hero-title__line">探索技术</span>
            <span class="hero-title__line hero-title__line--accent" aria-hidden="true">
              <span>无限</span>
              <span class="hero-title__portal">
                <img :src="featureImage" alt="" />
              </span>
              <span>可能</span>
            </span>
          </h1>
          <p>把开发经验、产品过程与值得记住的瞬间，连成一座可以反复进入的数字花园。</p>
          <div class="hero-actions">
            <router-link class="primary-action" to="/blog/blogdynamic">开始阅读 <arrow-right-outlined /></router-link>
            <router-link class="secondary-action" to="/blog/about">认识作者</router-link>
          </div>
          <a class="hero-scroll-cue" href="#garden-signal">向下探索</a>
        </div>

        <router-link
          v-if="featured"
          class="hero-feature group"
          :to="`/blog/dynamics/${featured.id}`"
        >
          <img
            :src="featureImage"
            :alt="featured.title"
            loading="eager"
          />
          <div class="hero-feature__ambient" aria-hidden="true" />
          <div class="hero-feature__wash" />
          <div class="hero-feature__copy">
            <span>编辑精选</span>
            <h2>{{ featured.title }}</h2>
            <p>{{ readingMeta(featured) }}</p>
          </div>
        </router-link>
        <div v-else class="hero-feature hero-feature--empty">
          <img src="/warm-garden-visual.svg" alt="温暖数字花园技术插画" loading="eager" />
          <div class="hero-feature__ambient" aria-hidden="true" />
          <div class="hero-feature__copy">
            <span>数字花园正在生长</span>
            <h2>第一篇值得反复阅读的内容，很快会出现在这里。</h2>
          </div>
        </div>
      </div>
    </section>

    <section class="visual-ribbon" aria-label="数字花园视觉切片">
      <div class="visual-ribbon__track">
        <article
          v-for="(item, index) in visualStories"
          :key="item.id || item.title"
          class="image-reveal"
          :class="`image-reveal--${index + 1}`"
        >
          <router-link v-if="item.id" :to="`/blog/dynamics/${item.id}`">
            <img :src="storyImage(item)" :alt="item.title" loading="lazy" />
          </router-link>
          <img v-else :src="storyImage(item)" :alt="item.title" loading="lazy" />
          <div><span>0{{ index + 1 }}</span><strong>{{ item.title }}</strong></div>
        </article>
      </div>
    </section>

    <section id="garden-signal" class="signal-section app-container" aria-label="数字花园理念">
      <div class="signal-ambient" aria-hidden="true" />
      <div class="signal-content">
        <div class="signal-meta">
          <p class="signal-note">每一次构建，都从一个值得追问的问题开始。</p>
          <div class="signal-path" aria-hidden="true">
            <div class="signal-path__track"><i class="signal-path__progress" /></div>
            <div class="signal-path__steps">
              <span>问题</span>
              <span>判断</span>
              <span>构建</span>
            </div>
          </div>
        </div>
        <h2 class="scrub-reveal" aria-label="技术不是孤立的答案，而是一条从问题、判断到持续构建的路径。">
          <span>技术不是孤立的答案，</span>
          <span>而是一条从问题、判断</span>
          <span>到持续构建的路径。</span>
        </h2>
      </div>
    </section>

    <section class="interest-section app-container">
      <header class="chapter-heading">
        <h2>最近在思考与<br />构建的事。</h2>
        <p>从最新文章、热门内容和主题入口进入，每一块内容都有明确去向。</p>
      </header>

      <AsyncState
        v-if="loading || error || !latest.length"
        :loading="loading"
        :error="error"
        :empty="!loading && !error && !latest.length"
        @retry="loadHome"
      />
      <div v-else class="bento-grid">
        <router-link class="bento-card bento-card--lead group" :to="`/blog/dynamics/${latest[0].id}`">
          <img v-if="mediaUrl(latest[0])" :src="mediaUrl(latest[0])" :alt="latest[0].title" loading="lazy" />
          <div class="bento-card__ambient" />
          <div class="bento-card__wash" />
          <div class="bento-card__copy">
            <span>最近更新</span>
            <h3>{{ latest[0].title }}</h3>
            <p>{{ excerpt(latest[0]) }}</p>
          </div>
        </router-link>

        <section class="bento-card bento-card--topics">
          <div>
            <h3>按主题探索</h3>
            <p>从技术、产品与生活进入内容脉络。</p>
          </div>
          <div class="topic-list">
            <router-link
              v-for="item in categories.slice(0, 6)"
              :key="item.id"
              :to="`/blog/categories/${item.id}/`"
            >{{ item.name }}</router-link>
          </div>
        </section>

        <section class="bento-card bento-card--popular">
          <h3>正在被阅读</h3>
          <router-link
            v-for="item in hot.slice(0, 3)"
            :key="item.id"
            :to="`/blog/dynamics/${item.id}`"
          >
            <span>{{ String(hot.indexOf(item) + 1).padStart(2, '0') }}</span>
            <strong>{{ item.title }}</strong>
          </router-link>
        </section>
      </div>
    </section>

    <section v-if="latest.length" class="story-section app-container">
      <div class="story-intro">
        <h2>值得慢下来读的内容。</h2>
        <p>真实项目中的判断、失败与修正，比孤立的技巧更值得被记录。</p>
        <router-link to="/blog/blogdynamic">浏览全部文章 <arrow-right-outlined /></router-link>
      </div>
      <div class="story-stack">
        <router-link
          v-for="item in latest.slice(0, 3)"
          :key="item.id"
          class="story-card group"
          :to="`/blog/dynamics/${item.id}`"
        >
          <div class="story-card__media">
            <img v-if="mediaUrl(item)" :src="mediaUrl(item)" :alt="item.title" loading="lazy" />
            <div v-else class="story-card__fallback" />
          </div>
          <div class="story-card__body">
            <span>{{ item.category?.name || '持续构建' }}</span>
            <h3>{{ item.title }}</h3>
            <p>{{ excerpt(item) }}</p>
          </div>
        </router-link>
      </div>
    </section>

    <section v-if="categories.length" class="topic-section app-container">
      <header class="chapter-heading">
        <h2>从一个主题，<br />进入更深的脉络。</h2>
        <p>悬停、键盘聚焦或触摸选择主题，直接进入对应文章集合。</p>
      </header>
      <div class="topic-accordion">
        <router-link
          v-for="(item, index) in categories.slice(0, 4)"
          :key="item.id"
          :to="`/blog/categories/${item.id}/`"
          :style="{ '--topic-index': index }"
        >
          <span>{{ item.name }}</span>
          <p>{{ item.description || '沿着这个主题继续阅读。' }}</p>
        </router-link>
      </div>
    </section>

    <section class="manifesto-section app-container">
      <div class="manifesto-heading">
        <span>创作方法</span>
        <p>这座数字花园如何保持真实、清晰和持续生长。</p>
      </div>
      <div class="manifesto-carousel cinematic-card" aria-live="polite">
        <div class="manifesto-number">{{ String(manifestoIndex + 1).padStart(2, '0') }}</div>
        <transition name="manifesto" mode="out-in">
          <article :key="currentManifesto.title">
            <p>{{ currentManifesto.eyebrow }}</p>
            <h2>{{ currentManifesto.title }}</h2>
            <span>{{ currentManifesto.body }}</span>
          </article>
        </transition>
        <div class="manifesto-controls" aria-label="切换创作原则">
          <button type="button" aria-label="上一条创作原则" @click="previousManifesto">上一条</button>
          <span>{{ manifestoIndex + 1 }} / {{ manifestos.length }}</span>
          <button type="button" aria-label="下一条创作原则" @click="nextManifesto">下一条</button>
        </div>
      </div>
    </section>

    <div v-if="tags.length" class="tag-marquee" aria-label="博客主题">
      <div>
        <span v-for="item in [...tags, ...tags]" :key="`${item.id}-${tags.indexOf(item)}`">{{ item.name }}</span>
      </div>
    </div>

    <section class="final-cta app-container">
      <h2>保持好奇，<br />继续构建。</h2>
      <p>进入完整归档，或者通过搜索找到你正在解决的问题。</p>
      <div class="hero-actions">
        <router-link class="primary-action" to="/blog/blogdynamic">浏览全部文章</router-link>
        <router-link class="secondary-action" to="/blog/search">搜索内容</router-link>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { ArrowRightOutlined } from '@ant-design/icons-vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { getBlogCategoryList, getBlogTagList, getHotDynamics, getRecentDynamics } from '@/api/blog'
import { normalizeCollectionResponse } from '@/api/collections'
import { buildApiUrl } from '@/utils/apiBaseUrl'
import AsyncState from '@/components/common/AsyncState.vue'

gsap.registerPlugin(ScrollTrigger)

const homePage = ref(null)
const latest = ref([])
const hot = ref([])
const categories = ref([])
const tags = ref([])
const loading = ref(true)
const error = ref('')
const manifestoIndex = ref(0)
let motionContext
let tiltX
let tiltY

const featured = computed(() => latest.value.find((item) => mediaUrl(item)) || latest.value[0])
const fallbackStories = [
  { title: '代码与自然一起生长', fallback: '/warm-garden-visual.svg' },
  { title: '在生活里保留观察', fallback: '/about-avatar.jpg' },
  { title: '把判断连接成路径', fallback: '/warm-garden-visual.svg' }
]
const visualStories = computed(() => [
  ...latest.value.slice(0, 3),
  ...fallbackStories
].slice(0, 3))
const featureImage = computed(() => mediaUrl(featured.value) || '/warm-garden-visual.svg')
const extractList = (response) => normalizeCollectionResponse(response).results
const manifestos = [
  { eyebrow: '从真实问题出发', title: '记录判断，不只展示答案。', body: '保留项目里的取舍、失败与修正，让经验可以在下一次真实问题中被复用。' },
  { eyebrow: '让知识彼此连接', title: '每一次阅读，都有继续探索的方向。', body: '通过文章、分类与标签形成路径，让零散笔记逐渐生长成完整的知识脉络。' },
  { eyebrow: '持续构建与复盘', title: '完成不是终点，沉淀才是。', body: '把每次构建变成下一次行动的起点，在持续发布中保持清醒和好奇。' }
]
const currentManifesto = computed(() => manifestos[manifestoIndex.value])

function previousManifesto() {
  manifestoIndex.value = (manifestoIndex.value - 1 + manifestos.length) % manifestos.length
}

function nextManifesto() {
  manifestoIndex.value = (manifestoIndex.value + 1) % manifestos.length
}

function mediaUrl(article) {
  const media = article?.mediaUrls || article?.files || []
  const first = Array.isArray(media) ? media[0] : media
  return buildApiUrl(typeof first === 'string' ? first : first?.url || first?.file_url || '')
}

function storyImage(article) {
  return mediaUrl(article) || article?.fallback || '/warm-garden-visual.svg'
}

function excerpt(article) {
  return (article?.summary || article?.content || '点击阅读完整内容。')
    .replace(/[#>*_`\[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 110)
}

function readingMeta(article) {
  const words = (article?.content || '').replace(/\s+/g, '').length
  return `${Math.max(1, Math.ceil(words / 360))} 分钟阅读 · ${article?.category?.name || '最新文章'}`
}

function moveHero(event) {
  if (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    window.matchMedia('(hover: none)').matches
  ) return

  const bounds = event.currentTarget.getBoundingClientRect()
  const x = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width))
  const y = Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height))

  event.currentTarget.style.setProperty('--hero-pointer-x', `${x * 100}%`)
  event.currentTarget.style.setProperty('--hero-pointer-y', `${y * 100}%`)
  tiltX?.((0.5 - y) * 5)
  tiltY?.((x - 0.5) * 7)
}

function resetHero(event) {
  event.currentTarget.style.setProperty('--hero-pointer-x', '50%')
  event.currentTarget.style.setProperty('--hero-pointer-y', '42%')
  tiltX?.(0)
  tiltY?.(0)
}

function setupMotion() {
  motionContext?.revert()
  if (!homePage.value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  motionContext = gsap.context(() => {
    const heroFeature = homePage.value.querySelector('.hero-feature')
    if (heroFeature) {
      tiltX = gsap.quickTo(heroFeature, 'rotationX', { duration: .45, ease: 'power3.out' })
      tiltY = gsap.quickTo(heroFeature, 'rotationY', { duration: .45, ease: 'power3.out' })
    }

    gsap.fromTo('.hero-title__line', { opacity: 0, yPercent: 110, rotateX: -16 }, { opacity: 1, yPercent: 0, rotateX: 0, duration: 1.1, stagger: .1, ease: 'power4.out' })
    gsap.fromTo('.hero-copy > p, .hero-actions, .hero-scroll-cue', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .85, stagger: .08, delay: .28, ease: 'power3.out' })
    gsap.fromTo('.hero-feature', { opacity: 0, scale: 0.88 }, { opacity: 1, scale: 1, duration: 1.15, ease: 'power3.out', delay: 0.15 })
    gsap.fromTo('.hero-feature img', { scale: 1.16, opacity: .58 }, {
      scale: 1,
      opacity: 1,
      scrollTrigger: { trigger: '.hero-feature', start: 'top 90%', end: 'bottom 42%', scrub: true }
    })
    gsap.to('.visual-ribbon__track', {
      xPercent: -10,
      ease: 'none',
      scrollTrigger: { trigger: '.visual-ribbon', start: 'top bottom', end: 'bottom top', scrub: true }
    })
    gsap.fromTo('.image-reveal', {
      clipPath: 'inset(18% 14% 18% 14% round 28px)',
      y: 70,
      opacity: .45
    }, {
      clipPath: 'inset(0% 0% 0% 0% round 28px)',
      y: 0,
      opacity: 1,
      stagger: .09,
      scrollTrigger: { trigger: '.visual-ribbon', start: 'top 88%', end: 'center 48%', scrub: true }
    })
    gsap.fromTo('.signal-path__progress', { scaleX: 0 }, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: { trigger: '.signal-section', start: 'top 72%', end: 'center 42%', scrub: true }
    })
    gsap.fromTo('.signal-note, .signal-path__steps span', { opacity: .18, y: 16 }, {
      opacity: 1,
      y: 0,
      stagger: .08,
      scrollTrigger: { trigger: '.signal-section', start: 'top 76%', end: 'top 46%', scrub: true }
    })
    gsap.fromTo('.scrub-reveal span', { opacity: .1, y: 52, filter: 'blur(8px)' }, {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      stagger: .14,
      scrollTrigger: { trigger: '.scrub-reveal', start: 'top 82%', end: 'bottom 46%', scrub: true }
    })
    if (window.matchMedia('(min-width: 901px)').matches && homePage.value.querySelector('.story-section')) {
      ScrollTrigger.create({
        trigger: '.story-section',
        start: 'top top+=110',
        end: 'bottom bottom-=110',
        pin: '.story-intro',
        pinSpacing: false
      })
    }
    gsap.utils.toArray('.story-card').forEach((card) => {
      gsap.fromTo(card, { scale: 0.88, opacity: 0.42 }, {
        scale: 1,
        opacity: 1,
        scrollTrigger: { trigger: card, start: 'top 88%', end: 'top 42%', scrub: true }
      })
      const media = card.querySelector('.story-card__media')
      if (media) {
        gsap.fromTo(media, { scale: .84, opacity: .36 }, {
          scale: 1,
          opacity: 1,
          scrollTrigger: { trigger: card, start: 'top 92%', end: 'top 48%', scrub: true }
        })
      }
    })
    ScrollTrigger.refresh()
  }, homePage.value)
}

async function loadHome() {
  loading.value = true
  error.value = ''
  try {
    const [recentResult, hotResult, categoryResult, tagResult] = await Promise.all([
      getRecentDynamics({ limit: 6 }),
      getHotDynamics({ limit: 5 }),
      getBlogCategoryList(),
      getBlogTagList()
    ])
    latest.value = extractList(recentResult)
    hot.value = extractList(hotResult)
    categories.value = extractList(categoryResult)
    tags.value = extractList(tagResult)
    await nextTick()
    setupMotion()
  } catch (reason) {
    error.value = reason?.message || '请检查后端服务是否正常运行。'
  } finally {
    loading.value = false
  }
}

onMounted(loadHome)
onBeforeUnmount(() => {
  tiltX = undefined
  tiltY = undefined
  motionContext?.revert()
})
</script>

<style scoped>
.home-page { width: 100%; max-width: 100%; overflow-x: hidden; background: #060b14; color: #edf3ff; font-family: Outfit, Geist, ui-sans-serif, system-ui, sans-serif; }
.hero { --hero-pointer-x: 50%; --hero-pointer-y: 42%; position: relative; min-height: clamp(760px, 86dvh, 980px); padding-block: clamp(104px, 11vh, 138px) clamp(64px, 8vh, 96px); }
.hero::before { position: absolute; inset: 0 -12vw; background: radial-gradient(circle at var(--hero-pointer-x) var(--hero-pointer-y), rgb(71 111 255 / 16%), transparent 28%); content: ''; opacity: .9; pointer-events: none; transition: opacity .3s ease; }
.hero-ambient { position: absolute; top: 8%; left: 44%; width: min(580px, 54vw); aspect-ratio: 1; border-radius: 50%; background: conic-gradient(from 210deg, #315bea, #152c5f, #54c5dc, #315bea); filter: blur(130px); opacity: .12; pointer-events: none; animation: hero-drift 14s ease-in-out infinite alternate; }
.hero-stage { position: relative; z-index: 1; display: grid; width: 100%; grid-template-columns: minmax(0, 7fr) minmax(330px, 5fr); align-items: center; gap: clamp(38px, 6vw, 88px); perspective: 1200px; }
.hero-copy { position: relative; z-index: 2; min-width: 0; text-align: left; perspective: 900px; }
.hero h1 { width: 100%; max-width: 760px; margin: 0 0 28px; font-size: clamp(4.7rem, 7.2vw, 7.7rem); font-weight: 760; letter-spacing: -.082em; line-height: .88; text-wrap: balance; }
.hero-title__line { display: block; overflow: hidden; padding: .05em .06em .08em 0; color: #edf3ff; transform-origin: 0 100%; }
.hero-title__line--accent { display: flex; align-items: center; gap: clamp(10px, 1.2vw, 18px); margin-top: .07em; color: #789cff; text-shadow: 0 0 56px rgb(82 122 255 / 24%); }
.hero-title__portal { position: relative; display: inline-block; overflow: hidden; width: clamp(68px, 7vw, 104px); height: .5em; flex: 0 0 auto; border: 1px solid rgb(151 181 255 / 42%); border-radius: 999px; background: radial-gradient(circle at 30% 20%, #6385ff, #102141 66%); box-shadow: inset 0 1px rgb(255 255 255 / 16%), 0 0 34px rgb(74 111 255 / 28%); transform: rotate(-5deg) translateY(.03em); }
.hero-title__portal::after { position: absolute; inset: 0; background: linear-gradient(115deg, transparent 25%, rgb(255 255 255 / 28%) 48%, transparent 70%); content: ''; transform: translateX(-120%); animation: portal-scan 5s ease-in-out infinite; }
.hero-title__portal img { width: 100%; height: 100%; object-fit: cover; opacity: .86; filter: saturate(.78) contrast(1.1); }
.hero-copy > p { max-width: 610px; margin: 0; color: #9aaac2; font-size: clamp(15px, 1.4vw, 18px); line-height: 1.75; text-wrap: pretty; }
.hero-actions { display: flex; justify-content: flex-start; gap: 10px; margin-top: 28px; }
.primary-action, .secondary-action { display: inline-flex; min-height: 48px; align-items: center; justify-content: center; gap: 9px; padding: 0 20px; border-radius: 999px; font-size: 13px; font-weight: 750; transition: transform .25s ease, border-color .25s ease, background .25s ease; }
.primary-action { background: #edf3ff; color: #07101d; box-shadow: 0 14px 35px rgb(0 0 0 / 25%); }
.secondary-action { border: 1px solid #2b405f; color: #edf3ff; }
.primary-action:hover, .secondary-action:hover { transform: translateY(-2px); }
.secondary-action:hover { border-color: #6588ef; background: rgb(77 116 255 / 10%); }
.hero-scroll-cue { display: inline-flex; align-items: center; gap: 12px; margin-top: 46px; color: #7186a8; font-size: 11px; font-weight: 700; letter-spacing: .14em; }
.hero-scroll-cue::before { width: 42px; height: 1px; background: linear-gradient(90deg, #789cff, transparent); content: ''; transition: width .3s ease; }
.hero-scroll-cue:hover { color: #b9c9e3; }
.hero-scroll-cue:hover::before { width: 60px; }
.hero-feature { position: relative; display: block; overflow: hidden; width: 100%; height: clamp(430px, 52vw, 570px); margin: 0; border: 1px solid rgb(124 155 220 / 28%); border-radius: 32px 32px 32px 10px; background: #0d1828; box-shadow: 0 44px 110px rgb(0 0 0 / 48%), 0 0 0 1px rgb(118 154 255 / 5%); text-align: left; transform-style: preserve-3d; will-change: transform; }
.hero-feature::after { position: absolute; inset: 0; z-index: 1; border: 1px solid rgb(255 255 255 / 7%); border-radius: inherit; background: radial-gradient(circle at var(--hero-pointer-x) var(--hero-pointer-y), rgb(125 163 255 / 14%), transparent 38%); content: ''; pointer-events: none; }
.hero-feature img, .bento-card img, .story-card img { width: 100%; height: 100%; object-fit: cover; transition: transform .7s ease, opacity .4s ease; }
.group:hover img { transform: scale(1.05); }
.hero-feature__ambient, .bento-card__ambient, .story-card__fallback { position: absolute; inset: 0; background: radial-gradient(circle at 25% 20%, rgb(72 112 255 / 44%), transparent 45%), linear-gradient(145deg, #13243d, #07101c); }
.hero-feature__wash, .bento-card__wash { position: absolute; inset: 0; background: linear-gradient(100deg, #07101e 4%, rgb(7 16 30 / 36%) 72%), linear-gradient(to top, #07101e, transparent 58%); }
.hero-feature__copy { position: absolute; z-index: 2; right: 30px; bottom: 32px; left: 30px; max-width: 620px; transform: translateZ(32px); }
.hero-feature__copy span, .bento-card__copy span, .story-card__body > span { color: #8baaff; font-size: 11px; font-weight: 700; letter-spacing: .08em; }
.hero-feature__copy h2 { margin: 10px 0 9px; font-size: clamp(30px, 4vw, 52px); letter-spacing: -.045em; line-height: 1; }
.hero-feature__copy p { margin: 0; color: #aebbd0; font-size: 13px; }
.signal-section { position: relative; display: grid; min-height: clamp(700px, 78vh, 900px); align-content: center; overflow: hidden; padding-block: clamp(104px, 12vh, 150px); scroll-margin-top: 80px; isolation: isolate; }
.signal-section::before { position: absolute; inset: 6% -12vw; z-index: -2; background-image: linear-gradient(rgb(132 161 230 / 4%) 1px, transparent 1px), linear-gradient(90deg, rgb(132 161 230 / 4%) 1px, transparent 1px); background-size: 76px 76px; content: ''; mask-image: radial-gradient(ellipse at center, black 0%, transparent 76%); pointer-events: none; }
.signal-section::after { position: absolute; top: 48%; left: 51%; z-index: -1; width: min(820px, 72vw); height: 420px; border-radius: 50%; background: #315bea; content: ''; filter: blur(170px); opacity: .11; pointer-events: none; transform: translate(-50%, -50%); }
.signal-ambient { position: absolute; top: 17%; right: 3%; z-index: -1; width: clamp(180px, 22vw, 330px); aspect-ratio: 1; border: 1px solid rgb(126 159 255 / 11%); border-radius: 50%; box-shadow: 0 0 0 42px rgb(80 113 214 / 3%), 0 0 0 96px rgb(80 113 214 / 2%); opacity: .8; pointer-events: none; }
.signal-content { width: 100%; }
.signal-meta { display: grid; grid-template-columns: minmax(200px, 4fr) minmax(360px, 8fr); align-items: end; gap: clamp(42px, 8vw, 130px); margin-bottom: clamp(52px, 7vh, 78px); }
.signal-note { max-width: 280px; margin: 0; color: #7f91ad; font-size: 13px; line-height: 1.7; }
.signal-path { min-width: 0; }
.signal-path__track { position: relative; height: 1px; background: rgb(112 140 194 / 22%); }
.signal-path__track::before, .signal-path__track::after { position: absolute; top: 50%; width: 7px; height: 7px; border: 1px solid #6689f5; border-radius: 50%; background: #07111f; content: ''; transform: translateY(-50%); }
.signal-path__track::before { left: 0; }
.signal-path__track::after { right: 0; }
.signal-path__progress { position: absolute; inset: -1px 0 auto; display: block; height: 2px; background: linear-gradient(90deg, #4c6fd8, #90b6ff 55%, #d8e8ff); box-shadow: 0 0 18px rgb(93 137 255 / 62%); transform: scaleX(1); transform-origin: left center; will-change: transform; }
.signal-path__steps { display: flex; justify-content: space-between; margin-top: 15px; color: #7288aa; font-size: 10px; font-weight: 720; letter-spacing: .17em; }
.signal-path__steps span:nth-child(2) { color: #91aaff; }
.signal-path__steps span:last-child { color: #c3d5f2; }
.scrub-reveal { width: 100%; max-width: 1220px; margin: 0; font-size: clamp(3rem, 6.9vw, 7rem); letter-spacing: -.075em; line-height: .91; }
.scrub-reveal span { display: block; color: #e8efff; white-space: nowrap; will-change: transform, opacity, filter; }
.scrub-reveal span:nth-child(2) { padding-left: clamp(0px, 7vw, 106px); color: #91aaff; }
.scrub-reveal span:nth-child(3) { padding-left: clamp(0px, 14vw, 212px); color: #dce8ff; text-shadow: 0 0 60px rgb(90 130 255 / 18%); }
.interest-section, .story-section, .topic-section { padding-block: 140px; }
.chapter-heading { display: flex; align-items: end; justify-content: space-between; gap: 40px; margin-bottom: 46px; }
.chapter-heading h2, .story-intro h2 { max-width: 820px; margin: 0; font-size: clamp(2.8rem, 6vw, 5rem); letter-spacing: -.06em; line-height: .94; }
.chapter-heading > p, .story-intro > p { max-width: 380px; margin: 0; color: #8fa0b9; line-height: 1.65; }
.bento-grid { display: grid; grid-auto-flow: dense; grid-template-columns: repeat(12, minmax(0, 1fr)); grid-template-rows: repeat(2, 230px); gap: 12px; }
.bento-card { position: relative; overflow: hidden; border: 1px solid #1b2b42; border-radius: 22px; background: #0a1321; }
.bento-card--lead { grid-column: span 7; grid-row: span 2; }
.bento-card--topics, .bento-card--popular { grid-column: span 5; grid-row: span 1; padding: 26px; }
.bento-card--topics { display: flex; flex-direction: column; justify-content: space-between; background: radial-gradient(circle at 100% 0, rgb(52 95 255 / 22%), transparent 55%), #0a1321; }
.bento-card h3 { margin: 0; font-size: 25px; letter-spacing: -.035em; }
.bento-card--topics p { margin: 7px 0 0; color: #8799b4; }
.bento-card__copy { position: absolute; z-index: 2; right: 26px; bottom: 26px; left: 26px; }
.bento-card__copy h3 { margin: 7px 0; font-size: clamp(26px, 3vw, 40px); }
.bento-card__copy p { display: -webkit-box; max-width: 560px; margin: 0; overflow: hidden; color: #a3b0c4; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.topic-list { display: flex; flex-wrap: wrap; gap: 8px; }
.topic-list a { padding: 7px 10px; border: 1px solid #2a405f; border-radius: 999px; color: #a8b9d1; font-size: 11px; }
.topic-list a:hover { border-color: #6488f2; color: white; }
.bento-card--popular > a { display: grid; grid-template-columns: 30px minmax(0, 1fr); gap: 8px; padding: 11px 0; border-bottom: 1px solid #1c2c42; }
.bento-card--popular > a:last-child { border-bottom: 0; }
.bento-card--popular > a span { color: #6e8ee8; font-size: 10px; font-weight: 700; }
.bento-card--popular > a strong { overflow: hidden; color: #b9c7da; font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
.story-section { display: grid; grid-template-columns: 5fr 7fr; align-items: start; gap: 78px; }
.story-intro { align-self: start; }
.story-intro a { display: inline-flex; align-items: center; gap: 8px; margin-top: 25px; color: #8da9ff; font-size: 13px; font-weight: 700; }
.story-stack { display: grid; gap: 22px; }
.story-card { position: sticky; top: 110px; display: block; overflow: hidden; min-height: 390px; border: 1px solid #21334e; border-radius: 24px; background: #0d1828; box-shadow: 0 -16px 60px rgb(0 0 0 / 20%); }
.story-card:nth-child(2) { top: 134px; background: #101d31; }
.story-card:nth-child(3) { top: 158px; background: #13233b; }
.story-card__media { position: relative; height: 235px; overflow: hidden; }
.story-card__fallback { position: static; width: 100%; height: 100%; }
.story-card__body { padding: 25px; }
.story-card__body h3 { margin: 8px 0; font-size: 27px; letter-spacing: -.035em; }
.story-card__body p { margin: 0; color: #8fa0b8; line-height: 1.6; }
.topic-accordion { display: flex; min-height: 470px; gap: 8px; }
.topic-accordion a { position: relative; display: flex; min-width: 0; flex: 1; flex-direction: column; justify-content: flex-end; overflow: hidden; padding: 24px; border: 1px solid #21334e; border-radius: 20px; background: radial-gradient(circle at calc(25% + var(--topic-index) * 18%) 20%, rgb(57 98 225 / 34%), transparent 48%), linear-gradient(155deg, #14233b, #08111e); transition: flex .65s ease, transform .35s ease; }
.topic-accordion a:hover, .topic-accordion a:focus-visible { flex: 2.7; transform: translateY(-4px); }
.topic-accordion span { font-size: 22px; font-weight: 700; }
.topic-accordion p { max-width: 260px; margin: 8px 0 0; color: #8799b2; opacity: 0; transition: opacity .4s ease; }
.topic-accordion a:hover p, .topic-accordion a:focus-visible p { opacity: 1; }
.manifesto-section { display: grid; grid-template-columns: 4fr 8fr; align-items: start; gap: 70px; padding-block: 150px; }
.manifesto-heading { position: sticky; top: 130px; }
.manifesto-heading > span { color: #789cff; font-size: 10px; font-weight: 750; letter-spacing: .18em; }
.manifesto-heading p { max-width: 300px; margin: 18px 0 0; color: #8fa0b9; line-height: 1.7; }
.manifesto-carousel { position: relative; display: grid; min-height: 480px; overflow: hidden; grid-template-rows: auto 1fr auto; padding: clamp(26px, 5vw, 58px); }
.manifesto-carousel::before { position: absolute; right: -110px; bottom: -150px; width: 420px; height: 420px; border-radius: 50%; background: #315bea; filter: blur(130px); opacity: .14; content: ''; pointer-events: none; }
.manifesto-number { color: #667b9b; font-size: 11px; font-weight: 750; letter-spacing: .16em; }
.manifesto-carousel article { position: relative; z-index: 1; align-self: center; }
.manifesto-carousel article p { margin: 0 0 18px; color: #789cff; font-size: 11px; font-weight: 750; letter-spacing: .12em; text-transform: uppercase; }
.manifesto-carousel article h2 { max-width: 760px; margin: 0; font-size: clamp(2.6rem, 5vw, 5.3rem); letter-spacing: -.064em; line-height: .94; }
.manifesto-carousel article span { display: block; max-width: 610px; margin-top: 24px; color: #98a9c1; font-size: 16px; line-height: 1.75; }
.manifesto-controls { position: relative; z-index: 1; display: flex; align-items: center; justify-content: space-between; gap: 16px; border-top: 1px solid #22344e; padding-top: 20px; }
.manifesto-controls button { min-width: 78px; min-height: 42px; border: 1px solid #2d4364; border-radius: 999px; background: #0b1727; color: #cbd7e9; cursor: pointer; transition: border-color .2s ease, background .2s ease, transform .2s ease; }
.manifesto-controls button:hover { border-color: #789cff; background: #132441; transform: translateY(-2px); }
.manifesto-controls span { color: #71839d; font-size: 11px; font-weight: 700; letter-spacing: .12em; }
.manifesto-enter-active, .manifesto-leave-active { transition: opacity .25s ease, transform .25s ease; }
.manifesto-enter-from { opacity: 0; transform: translateX(20px); }
.manifesto-leave-to { opacity: 0; transform: translateX(-20px); }
.tag-marquee { overflow: hidden; border-block: 1px solid #18283d; padding: 23px 0; color: #6f93ff; }
.tag-marquee > div { display: flex; width: max-content; animation: marquee 28s linear infinite; }
.tag-marquee span { padding-right: 52px; font-size: clamp(2rem, 5vw, 4.1rem); font-weight: 700; letter-spacing: -.045em; }
.tag-marquee span::after { margin-left: 52px; content: '·'; color: #2b4268; }
.final-cta { padding-block: 170px 145px; text-align: center; }
.final-cta h2 { max-width: 1080px; margin: 0 auto; font-size: clamp(3.7rem, 8vw, 7.3rem); letter-spacing: -.074em; line-height: .86; }
.final-cta p { max-width: 570px; margin: 30px auto 0; color: #8c9db7; font-size: 17px; }

/* Warm editorial garden */
.home-page { background: #f4efe5; color: #172436; }
.hero::before { background: radial-gradient(circle at var(--hero-pointer-x) var(--hero-pointer-y), rgb(222 154 91 / 26%), transparent 30%); }
.hero-ambient { background: conic-gradient(from 210deg, #d88949, #f0c184, #77998f, #d88949); opacity: .2; }
.hero-title__line { color: #172436; }
.hero-title__line--accent { color: #b85e2d; text-shadow: 0 18px 58px rgb(168 84 38 / 15%); }
.hero-title__portal { border-color: rgb(159 91 47 / 36%); background: #d89a61; box-shadow: inset 0 1px rgb(255 255 255 / 45%), 0 12px 34px rgb(135 79 40 / 19%); }
.hero-copy > p { color: #52606a; }
.primary-action { background: #172436; color: #fff9ef; box-shadow: 0 14px 35px rgb(46 50 49 / 20%); }
.secondary-action { border-color: rgb(68 59 48 / 24%); color: #172436; background: rgb(255 250 242 / 44%); }
.secondary-action:hover { border-color: #b85e2d; background: rgb(200 111 55 / 9%); }
.hero-scroll-cue { color: #756b5f; }
.hero-scroll-cue::before { background: linear-gradient(90deg, #c86f37, transparent); }
.hero-scroll-cue:hover { color: #a64e23; }
.hero-feature { border-color: rgb(113 82 51 / 18%); background: #d5a16d; box-shadow: 0 44px 110px rgb(92 59 31 / 23%), 0 0 0 1px rgb(255 255 255 / 30%); }
.hero-feature::after { border-color: rgb(255 255 255 / 34%); background: radial-gradient(circle at var(--hero-pointer-x) var(--hero-pointer-y), rgb(255 242 214 / 30%), transparent 40%); }
.hero-feature__ambient, .bento-card__ambient, .story-card__fallback { background: radial-gradient(circle at 24% 18%, rgb(226 152 87 / 52%), transparent 46%), linear-gradient(145deg, #9cb0a5, #405f5b); }
.hero-feature__wash, .bento-card__wash { background: linear-gradient(100deg, rgb(24 38 45 / 82%) 4%, rgb(24 38 45 / 18%) 72%), linear-gradient(to top, rgb(24 38 45 / 86%), transparent 62%); }
.hero-feature__copy { color: #fffaf2; }
.hero-feature__copy span, .bento-card__copy span, .story-card__body > span { color: #f1b678; }
.hero-feature__copy p { color: #e4e7df; }

.visual-ribbon { position: relative; z-index: 2; width: 100%; overflow: hidden; padding: 34px 0 70px; }
.visual-ribbon__track { display: grid; width: 116%; margin-left: -3%; grid-template-columns: 1.08fr .78fr .94fr; align-items: center; gap: clamp(14px, 2vw, 28px); will-change: transform; }
.image-reveal { position: relative; overflow: hidden; min-height: 310px; border-radius: 30px 10px 30px 30px; background: #d7bc98; box-shadow: 0 24px 64px rgb(91 63 36 / 14%); will-change: clip-path, transform, opacity; }
.image-reveal--1 { height: clamp(360px, 35vw, 500px); }
.image-reveal--2 { height: clamp(280px, 27vw, 390px); transform: translateY(46px); }
.image-reveal--3 { height: clamp(330px, 31vw, 450px); transform: translateY(-24px); }
.image-reveal > a { display: block; height: 100%; }
.image-reveal img { width: 100%; height: 100%; object-fit: cover; transition: transform .7s ease, filter .4s ease; }
.image-reveal--2 img { object-position: 54% 32%; }
.image-reveal--3 img { object-position: 78% 48%; }
.image-reveal:hover img { filter: saturate(1.08); transform: scale(1.035); }
.image-reveal > div { position: absolute; right: 20px; bottom: 18px; left: 20px; display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; color: white; text-shadow: 0 2px 18px rgb(0 0 0 / 45%); pointer-events: none; }
.image-reveal::after { position: absolute; inset: 45% 0 0; background: linear-gradient(transparent, rgb(25 43 45 / 64%)); content: ''; pointer-events: none; }
.image-reveal > div { z-index: 1; }
.image-reveal span { font-size: 10px; font-weight: 750; letter-spacing: .16em; }
.image-reveal strong { max-width: 260px; font-size: clamp(16px, 1.7vw, 24px); line-height: 1.1; text-align: right; }

.signal-section::before { background-image: linear-gradient(rgb(117 88 58 / 7%) 1px, transparent 1px), linear-gradient(90deg, rgb(117 88 58 / 7%) 1px, transparent 1px); }
.signal-section::after { background: #d59456; opacity: .13; }
.signal-ambient { border-color: rgb(175 98 49 / 15%); box-shadow: 0 0 0 42px rgb(184 103 50 / 4%), 0 0 0 96px rgb(184 103 50 / 2%); }
.signal-note, .chapter-heading > p, .story-intro > p { color: #68655f; }
.signal-path__track { background: rgb(113 82 51 / 22%); }
.signal-path__track::before, .signal-path__track::after { border-color: #c86f37; background: #f4efe5; }
.signal-path__progress { background: linear-gradient(90deg, #a64e23, #d99154 55%, #5e887d); box-shadow: 0 0 18px rgb(200 111 55 / 32%); }
.signal-path__steps { color: #7e7164; }
.signal-path__steps span:nth-child(2) { color: #b85e2d; }
.signal-path__steps span:last-child { color: #315d59; }
.scrub-reveal span, .scrub-reveal span:nth-child(3) { color: #172436; text-shadow: none; }
.scrub-reveal span:nth-child(2) { color: #b85e2d; }

.bento-card { border-color: rgb(92 69 47 / 16%); background: #fffaf2; box-shadow: 0 20px 54px rgb(91 63 36 / 9%); }
.bento-card--topics { background: radial-gradient(circle at 100% 0, rgb(219 143 77 / 22%), transparent 55%), #fffaf2; }
.bento-card--topics p, .bento-card__copy p, .story-card__body p { color: #5f686d; }
.topic-list a { border-color: rgb(100 74 49 / 20%); color: #5d635f; }
.topic-list a:hover { border-color: #c86f37; color: #a64e23; }
.bento-card--popular > a { border-bottom-color: rgb(100 74 49 / 12%); }
.bento-card--popular > a span { color: #b85e2d; }
.bento-card--popular > a strong { color: #34434d; }
.story-intro a, .manifesto-heading > span, .manifesto-carousel article p { color: #b85e2d; }
.story-card, .story-card:nth-child(2), .story-card:nth-child(3) { border-color: rgb(92 69 47 / 16%); background: #fffaf2; box-shadow: 0 -16px 60px rgb(91 63 36 / 12%); }
.topic-accordion a { border-color: rgb(92 69 47 / 16%); background: radial-gradient(circle at calc(25% + var(--topic-index) * 18%) 20%, rgb(220 148 83 / 32%), transparent 48%), linear-gradient(155deg, #fff7eb, #e7dbc9); }
.topic-accordion p, .manifesto-heading p, .manifesto-carousel article span { color: #646a68; }
.manifesto-carousel::before { background: #d58b4b; opacity: .16; }
.manifesto-number, .manifesto-controls span { color: #81796d; }
.manifesto-controls { border-top-color: rgb(92 69 47 / 14%); }
.manifesto-controls button { border-color: rgb(92 69 47 / 22%); background: #fffaf2; color: #283842; }
.manifesto-controls button:hover { border-color: #c86f37; background: #f8e8d4; }
.tag-marquee { border-block-color: rgb(92 69 47 / 15%); color: #b85e2d; }
.tag-marquee span::after { color: #b6a38c; }
.final-cta p { color: #696a65; }
@keyframes marquee { to { transform: translateX(-50%); } }
@keyframes hero-drift { from { transform: translate3d(-7%, -6%, 0) scale(.86); } to { transform: translate3d(10%, 9%, 0) scale(1.12); } }
@keyframes portal-scan { 0%, 58% { transform: translateX(-120%); } 82%, 100% { transform: translateX(120%); } }
@media (max-width: 900px) { .hero { min-height: auto; padding-block: 125px 90px; } .hero-stage { grid-template-columns: 1fr; gap: 50px; } .hero-copy { text-align: center; } .hero h1 { max-width: 820px; margin-inline: auto; } .hero-title__line--accent { justify-content: center; } .hero-copy > p { margin-inline: auto; } .hero-actions { justify-content: center; } .hero-scroll-cue { margin-top: 36px; } .hero-feature { width: min(680px, 100%); height: 420px; margin-inline: auto; border-radius: 28px; } .visual-ribbon__track { width: 150%; grid-template-columns: repeat(3, 1fr); } .image-reveal { min-height: 260px; } .signal-section { min-height: 720px; } .signal-meta { grid-template-columns: 1fr; gap: 30px; } .signal-note { max-width: 360px; } .scrub-reveal span:nth-child(2), .scrub-reveal span:nth-child(3) { padding-left: 0; } .interest-section, .story-section, .topic-section { padding-block: 100px; } .chapter-heading { align-items: flex-start; flex-direction: column; } .bento-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); grid-template-rows: auto; } .bento-card--lead, .bento-card--topics, .bento-card--popular { grid-column: auto; grid-row: auto; min-height: 260px; } .bento-card--lead { grid-column: 1 / -1; min-height: 420px; } .story-section { grid-template-columns: 1fr; gap: 42px; } .manifesto-section { grid-template-columns: 1fr; gap: 34px; padding-block: 100px; } .manifesto-heading { position: static; } }
@media (max-width: 640px) { .hero { padding-top: 102px; } .hero h1 { font-size: clamp(3.15rem, 15.2vw, 4.6rem); line-height: .88; } .hero-title__portal { width: clamp(52px, 15vw, 70px); } .hero-actions { align-items: stretch; flex-direction: column; } .hero-scroll-cue { margin-top: 30px; } .hero-feature { height: 350px; border-radius: 22px; } .hero-feature__copy { right: 20px; bottom: 22px; left: 20px; } .hero-feature__copy h2 { font-size: clamp(27px, 9vw, 38px); } .visual-ribbon { padding-bottom: 28px; } .visual-ribbon__track { width: 235%; margin-left: -8%; } .image-reveal, .image-reveal--1, .image-reveal--2, .image-reveal--3 { height: 270px; min-height: 270px; border-radius: 20px 7px 20px 20px; } .signal-section { min-height: 650px; padding-block: 88px; } .signal-section::before { background-size: 48px 48px; } .signal-meta { margin-bottom: 48px; } .signal-note { max-width: 265px; font-size: 12px; } .signal-path__steps { font-size: 9px; } .scrub-reveal { font-size: clamp(1.75rem, 8.85vw, 2.35rem); letter-spacing: -.068em; line-height: 1.02; } .interest-section, .story-section, .topic-section { padding-block: 78px; } .bento-grid { grid-template-columns: 1fr; } .bento-card--lead { grid-column: auto; min-height: 370px; } .story-card, .story-card:nth-child(2), .story-card:nth-child(3) { position: relative; top: auto; min-height: 0; } .topic-accordion { min-height: 0; flex-direction: column; } .topic-accordion a { min-height: 170px; } .topic-accordion p { opacity: 1; } .manifesto-section { padding-block: 80px; } .manifesto-carousel { min-height: 440px; } .final-cta { padding-block: 105px 90px; } }
@media (hover: none) { .hero-feature { transform: none !important; } }
@media (prefers-reduced-motion: reduce) { .hero::before { opacity: .4; } .hero-ambient, .hero-title__portal::after, .tag-marquee > div { animation: none; } .hero-feature, .story-card, .visual-ribbon__track, .image-reveal { position: relative; top: auto !important; opacity: 1 !important; clip-path: none !important; transform: none !important; } .hero-title__line, .signal-note, .signal-path__steps span, .scrub-reveal span, .story-card__media { opacity: 1 !important; filter: none !important; transform: none !important; } .signal-path__progress { transform: scaleX(1) !important; } .manifesto-enter-active, .manifesto-leave-active { transition: none; } }
</style>
