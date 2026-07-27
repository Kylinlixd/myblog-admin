<template>
  <main ref="homePage" class="home-page">
    <section class="hero app-container">
      <div class="hero-ambient" aria-hidden="true" />
      <div class="hero-stage">
        <div class="hero-copy">
          <h1 class="hero-title" aria-label="探索技术，无限可能">
            <span class="hero-title__line">探索技术</span>
            <span class="hero-title__line hero-title__line--accent" aria-hidden="true">
              <span>无限</span>
              <span class="hero-title__portal">
                <img v-if="featured && mediaUrl(featured)" :src="mediaUrl(featured)" alt="" />
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
            v-if="mediaUrl(featured)"
            :src="mediaUrl(featured)"
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
          <div class="hero-feature__ambient" aria-hidden="true" />
          <div class="hero-feature__copy">
            <span>数字花园正在生长</span>
            <h2>第一篇值得反复阅读的内容，很快会出现在这里。</h2>
          </div>
        </div>
      </div>
    </section>

    <section id="garden-signal" class="signal-section app-container" aria-label="数字花园理念">
      <p class="signal-index">沿着问题继续</p>
      <h2 class="scrub-reveal">
        <span>技术不是孤立的答案，</span>
        <span>而是一条从问题、判断</span>
        <span>到持续构建的路径。</span>
      </h2>
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

const featured = computed(() => latest.value.find((item) => mediaUrl(item)) || latest.value[0])
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

function setupMotion() {
  motionContext?.revert()
  if (!homePage.value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  motionContext = gsap.context(() => {
    gsap.fromTo('.hero-title__line', { opacity: 0, yPercent: 110, rotateX: -16 }, { opacity: 1, yPercent: 0, rotateX: 0, duration: 1.1, stagger: .1, ease: 'power4.out' })
    gsap.fromTo('.hero-copy > p, .hero-actions', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .85, stagger: .08, delay: .28, ease: 'power3.out' })
    gsap.fromTo('.hero-feature', { opacity: 0, scale: 0.88 }, { opacity: 1, scale: 1, duration: 1.15, ease: 'power3.out', delay: 0.15 })
    gsap.fromTo('.hero-feature img', { scale: 1.16, opacity: .58 }, {
      scale: 1,
      opacity: 1,
      scrollTrigger: { trigger: '.hero-feature', start: 'top 90%', end: 'bottom 42%', scrub: true }
    })
    gsap.fromTo('.scrub-reveal span', { opacity: .12, y: 42 }, {
      opacity: 1,
      y: 0,
      stagger: .14,
      scrollTrigger: { trigger: '.scrub-reveal', start: 'top 84%', end: 'bottom 48%', scrub: true }
    })
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
onBeforeUnmount(() => motionContext?.revert())
</script>

<style scoped>
.home-page { width: 100%; max-width: 100%; overflow-x: hidden; background: #060b14; color: #edf3ff; font-family: Outfit, Geist, ui-sans-serif, system-ui, sans-serif; }
.hero { position: relative; display: grid; min-height: 780px; place-items: center; padding-block: 132px 116px; text-align: center; }
.hero-ambient { position: absolute; width: min(760px, 82vw); height: 480px; border-radius: 50%; background: #285fff; filter: blur(150px); opacity: .16; pointer-events: none; top: -340px; }
.hero-copy { position: relative; z-index: 2; width: 100%; perspective: 800px; }
.hero h1 { width: 100%; max-width: 1280px; margin: 0 auto 30px; font-size: clamp(3.4rem, 9vw, 8.6rem); letter-spacing: -.082em; line-height: .8; }
.hero-title__line { display: block; overflow: hidden; padding-inline: .06em; color: #edf3ff; transform-origin: 50% 100%; }
.hero-title__line--accent { margin-top: .12em; color: #789cff; text-shadow: 0 0 56px rgb(82 122 255 / 24%); }
.hero-copy > p { max-width: 650px; margin: 0 auto; color: #9aaac2; font-size: clamp(15px, 1.5vw, 18px); line-height: 1.7; }
.hero-actions { display: flex; justify-content: center; gap: 10px; margin-top: 30px; }
.primary-action, .secondary-action { display: inline-flex; min-height: 48px; align-items: center; justify-content: center; gap: 9px; padding: 0 20px; border-radius: 999px; font-size: 13px; font-weight: 750; transition: transform .25s ease, border-color .25s ease, background .25s ease; }
.primary-action { background: #edf3ff; color: #07101d; box-shadow: 0 14px 35px rgb(0 0 0 / 25%); }
.secondary-action { border: 1px solid #2b405f; color: #edf3ff; }
.primary-action:hover, .secondary-action:hover { transform: translateY(-2px); }
.secondary-action:hover { border-color: #6588ef; background: rgb(77 116 255 / 10%); }
.hero-feature { position: relative; display: block; width: min(1050px, 100%); height: 400px; margin-top: 70px; overflow: hidden; border: 1px solid #243652; border-radius: 28px; background: #0d1828; box-shadow: 0 42px 100px rgb(0 0 0 / 42%); text-align: left; }
.hero-feature img, .bento-card img, .story-card img { width: 100%; height: 100%; object-fit: cover; transition: transform .7s ease, opacity .4s ease; }
.group:hover img { transform: scale(1.05); }
.hero-feature__ambient, .bento-card__ambient, .story-card__fallback { position: absolute; inset: 0; background: radial-gradient(circle at 25% 20%, rgb(72 112 255 / 44%), transparent 45%), linear-gradient(145deg, #13243d, #07101c); }
.hero-feature__wash, .bento-card__wash { position: absolute; inset: 0; background: linear-gradient(100deg, #07101e 4%, rgb(7 16 30 / 36%) 72%), linear-gradient(to top, #07101e, transparent 58%); }
.hero-feature__copy { position: absolute; z-index: 2; right: 30px; bottom: 32px; left: 30px; max-width: 620px; }
.hero-feature__copy span, .bento-card__copy span, .story-card__body > span { color: #8baaff; font-size: 11px; font-weight: 700; letter-spacing: .08em; }
.hero-feature__copy h2 { margin: 10px 0 9px; font-size: clamp(30px, 4vw, 52px); letter-spacing: -.045em; line-height: 1; }
.hero-feature__copy p { margin: 0; color: #aebbd0; font-size: 13px; }
.signal-section { display: grid; min-height: 84vh; align-content: center; padding-block: 120px; }
.signal-index { margin: 0 0 28px; color: #60789e; font-size: 10px; font-weight: 750; letter-spacing: .19em; }
.scrub-reveal { max-width: 1180px; margin: 0; font-size: clamp(3rem, 7.2vw, 7.2rem); letter-spacing: -.075em; line-height: .9; }
.scrub-reveal span { display: block; color: #e8efff; will-change: transform, opacity; }
.scrub-reveal span:nth-child(2) { padding-left: clamp(0px, 8vw, 120px); color: #91aaff; }
.scrub-reveal span:nth-child(3) { padding-left: clamp(0px, 16vw, 240px); }
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
.story-intro { position: sticky; top: 130px; }
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
@keyframes marquee { to { transform: translateX(-50%); } }
@media (max-width: 900px) { .hero { min-height: auto; padding-block: 125px 90px; } .hero-feature { height: 360px; } .signal-section { min-height: 68vh; } .scrub-reveal span:nth-child(2), .scrub-reveal span:nth-child(3) { padding-left: 0; } .interest-section, .story-section, .topic-section { padding-block: 100px; } .chapter-heading { align-items: flex-start; flex-direction: column; } .bento-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); grid-template-rows: auto; } .bento-card--lead, .bento-card--topics, .bento-card--popular { grid-column: auto; grid-row: auto; min-height: 260px; } .bento-card--lead { grid-column: 1 / -1; min-height: 420px; } .story-section { grid-template-columns: 1fr; gap: 42px; } .story-intro { position: static; } .manifesto-section { grid-template-columns: 1fr; gap: 34px; padding-block: 100px; } .manifesto-heading { position: static; } }
@media (max-width: 640px) { .hero { padding-top: 105px; } .hero h1 { font-size: clamp(3.25rem, 16vw, 5rem); line-height: .84; } .hero-actions { align-items: stretch; flex-direction: column; } .hero-feature { height: 330px; margin-top: 48px; border-radius: 20px; } .hero-feature__copy { right: 20px; bottom: 22px; left: 20px; } .signal-section { min-height: 62vh; padding-block: 80px; } .scrub-reveal { font-size: clamp(2.65rem, 13vw, 4.5rem); } .interest-section, .story-section, .topic-section { padding-block: 78px; } .bento-grid { grid-template-columns: 1fr; } .bento-card--lead { grid-column: auto; min-height: 370px; } .story-card, .story-card:nth-child(2), .story-card:nth-child(3) { position: relative; top: auto; min-height: 0; } .topic-accordion { min-height: 0; flex-direction: column; } .topic-accordion a { min-height: 170px; } .topic-accordion p { opacity: 1; } .manifesto-section { padding-block: 80px; } .manifesto-carousel { min-height: 440px; } .final-cta { padding-block: 105px 90px; } }
@media (prefers-reduced-motion: reduce) { .tag-marquee > div { animation: none; } .story-card { position: relative; top: auto !important; opacity: 1 !important; transform: none !important; } .hero-title__line, .scrub-reveal span, .story-card__media { opacity: 1 !important; transform: none !important; } .manifesto-enter-active, .manifesto-leave-active { transition: none; } }
</style>
