import fs from 'node:fs'
import path from 'node:path'

const source = fs.readFileSync(path.join(process.cwd(), 'src/views/blog/BlogHome.vue'), 'utf8')
const layoutSource = fs.readFileSync(path.join(process.cwd(), 'src/layouts/BlogLayout.vue'), 'utf8')
const indexSource = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8')

describe('focused warm technology blog homepage', () => {
  it('keeps only the hero, latest articles, topics, and shared footer structure', () => {
    expect(source).toContain('class="home-hero"')
    expect(source).toContain('id="latest-posts"')
    expect(source).toContain('id="topics"')
    expect(layoutSource).toContain('<footer class="site-footer">')
    expect(source).not.toContain('visual-ribbon')
    expect(source).not.toContain('manifesto-carousel')
    expect(source).not.toContain('tag-marquee')
    expect(source).not.toContain('final-cta')
    expect(source).not.toContain('bento-grid')
  })

  it('uses a text-first hero and article list without homepage images', () => {
    expect(source).toContain('aria-label="探索技术，无限可能"')
    expect(source).toContain('class="article-list"')
    expect(source).toContain('v-for="item in latest"')
    expect(source).not.toContain('<img')
    expect(source).not.toContain('getHotDynamics')
    expect(source).not.toContain('getBlogTagList')
    expect(source).not.toContain('class="eyebrow"')
    expect(source).not.toContain('class="hero-description"')
    expect(source).not.toContain('class="hero-actions')
  })

  it('provides a first-screen hero with a static title and scroll guidance', () => {
    expect(source).toContain('aria-label="滚动到最新文章"')
    expect(source).toContain('href="#latest-posts"')
    expect(source).toContain('id="latest-posts"')
    expect(source).toContain('min-height: calc(100dvh - var(--header-height))')
    expect(source).toContain('white-space: nowrap')
    expect(source).toContain('class="hero-inner app-container"')
    expect(source).toContain('background: #f5efe5;')
    expect(source).toContain('.home-hero { position: relative; display: flex; width: 100%;')
    expect(source).toContain('justify-content: center')
    expect(layoutSource).toContain('.blog-shell--home .site-header')
    expect(layoutSource).toContain('.blog-shell--home .site-main')
    expect(layoutSource).toContain('position: fixed')
    expect(source).not.toContain('hero-particle-canvas')
    expect(source).not.toContain('hero-atmosphere')
    expect(source).not.toContain('hero-light-sheet')
    expect(source).not.toContain('hero-trace')
    expect(source).not.toContain('startParticleTitle')
    expect(source).not.toContain('titleReady')
  })

  it('provides a cursor reactive light trail without turning the hero into a permanent particle field', () => {
    expect(source).toContain('class="hero-effect-canvas"')
    expect(source).toContain('class="hero-light-field"')
    expect(source).toContain('@pointermove="handleHeroPointer"')
    expect(source).toContain('@pointerleave="resetHeroPointer"')
    expect(source).toContain('requestAnimationFrame')
    expect(source).toContain('heroTrail')
    expect(source).toContain('drawHeroStar')
    expect(source).toContain("pointerType === 'touch'")
    expect(source).toContain('prefers-reduced-motion')
    expect(source).toContain('maxTrailPoints')
    expect(source).toContain('pointerFresh')
  })

  it('defers topic data and below-fold rendering until it is near the viewport', () => {
    expect(source).toContain('content-visibility: auto')
    expect(source).toContain('contain-intrinsic-size: 720px')
    expect(source).toContain('IntersectionObserver')
    expect(source).toContain("rootMargin: '240px 0px'")
    expect(source).toContain('loadCategories()')
  })

  it('keeps the warm visual language restrained on the homepage', () => {
    expect(source).toContain('--home-accent: #b85e2d')
    expect(source).toContain('border-radius: 999px')
    expect(source).toContain('prefers-reduced-motion: reduce')
    expect(layoutSource).toContain("v-if=\"route.name !== 'BlogHome'\"")
  })

  it('uses a dedicated readable favicon instead of shrinking the detailed brand mark', () => {
    expect(indexSource).toContain('favicon-coffee-v2.svg')
    expect(indexSource).toContain('type="image/svg+xml"')
    expect(indexSource).not.toContain('logo-coffee-code.png" />')
  })
})
