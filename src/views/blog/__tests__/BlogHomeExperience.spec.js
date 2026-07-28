import fs from 'node:fs'
import path from 'node:path'

const source = fs.readFileSync(path.join(process.cwd(), 'src/views/blog/BlogHome.vue'), 'utf8')

describe('warm technology blog homepage', () => {
  it('keeps the hero wide and the bento grid dense', () => {
    expect(source).toContain('hero-feature')
    expect(source).toContain('grid-auto-flow: dense')
    expect(source).toContain('grid-template-columns: repeat(12')
  })

  it('scopes motion and honors reduced motion', () => {
    expect(source).toContain("from 'gsap'")
    expect(source).toContain("from 'gsap/ScrollTrigger'")
    expect(source).toContain('prefers-reduced-motion: reduce')
  })

  it('builds an asymmetric two-line hero with inline media', () => {
    expect(source).toContain('class="hero-stage"')
    expect(source).toContain('hero-title__portal')
    expect(source).toContain('hero-scroll-cue')
    expect(source).toContain('aria-label="探索技术，无限可能"')
    expect(source).not.toContain('SCROLL TO EXPLORE · 01')
    expect(source).not.toContain('CREATION PRINCIPLES · 03')
  })

  it('includes a manual creation-principles carousel', () => {
    expect(source).toContain('manifesto-carousel')
    expect(source).toContain('currentManifesto')
    expect(source).toContain('previousManifesto')
    expect(source).toContain('nextManifesto')
    expect(source).toContain('aria-live="polite"')
  })

  it('adds responsive depth without bypassing reduced motion', () => {
    expect(source).toContain('--hero-pointer-x')
    expect(source).toContain('gsap.quickTo')
    expect(source).toContain("pin: '.story-intro'")
    expect(source).toContain("window.matchMedia('(prefers-reduced-motion: reduce)')")
    expect(source).toContain('@media (hover: none)')
  })

  it('keeps the next chapter in reach on tall screens', () => {
    expect(source).toContain('min-height: clamp(760px, 86dvh, 980px)')
    expect(source).not.toContain('min-height: calc(100dvh - 62px)')
  })

  it('turns the second screen into a three-line path manifesto', () => {
    expect(source).toContain('signal-path__progress')
    expect(source).toContain('<span>问题</span>')
    expect(source).toContain('<span>判断</span>')
    expect(source).toContain('<span>构建</span>')
    expect(source).toContain('技术不是孤立的答案，')
    expect(source).toContain('而是一条从问题、判断')
    expect(source).toContain('到持续构建的路径。')
    expect(source).toContain('white-space: nowrap')
    expect(source).toContain("gsap.fromTo('.signal-path__progress'")
    expect(source).toContain('scaleX: 0')
  })

  it('uses bundled imagery and scroll-linked editorial reveals', () => {
    expect(source).toContain('/warm-garden-visual.svg')
    expect(source).toContain('visual-ribbon')
    expect(source).toContain('image-reveal')
    expect(source).toContain("gsap.to('.visual-ribbon__track'")
    expect(source).toContain('clipPath')
  })
})
