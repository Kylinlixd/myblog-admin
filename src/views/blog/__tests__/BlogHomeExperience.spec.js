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

  it('builds a two-line cinematic hero with scrubbed storytelling', () => {
    expect(source).toContain('hero-title__line')
    expect(source).toContain('>探索技术<')
    expect(source).toContain('>无限可能<')
    expect(source).toContain('scrub-reveal')
    expect(source).toContain("scrub: true")
  })

  it('includes a manual creation-principles carousel', () => {
    expect(source).toContain('manifesto-carousel')
    expect(source).toContain('currentManifesto')
    expect(source).toContain('previousManifesto')
    expect(source).toContain('nextManifesto')
    expect(source).toContain('aria-live="polite"')
  })
})
