import fs from 'node:fs'
import path from 'node:path'

const source = fs.readFileSync(path.join(process.cwd(), 'src/views/blog/BlogHome.vue'), 'utf8')

describe('night-blue blog homepage', () => {
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
})
