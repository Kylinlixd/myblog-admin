import fs from 'node:fs'
import path from 'node:path'

const read = (file) => {
  const target = path.join(process.cwd(), file)
  return fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : ''
}

describe('cinematic blog theme', () => {
  const main = read('src/styles/main.scss')
  const layout = read('src/layouts/BlogLayout.vue')

  it('loads one shared public theme and renders a decorative atmosphere', () => {
    const styles = read('src/styles/blog-cinematic.scss')

    expect(main).toContain("@use './blog-cinematic'")
    expect(layout).toContain('class="blog-atmosphere"')
    expect(layout).toContain('aria-hidden="true"')
    expect(styles).toContain('.cinematic-page')
    expect(styles).toContain('.cinematic-hero')
    expect(styles).toContain('.cinematic-card')
  })

  it('keeps decorative motion optional', () => {
    const styles = read('src/styles/blog-cinematic.scss')

    expect(styles).toContain('prefers-reduced-motion: reduce')
    expect(styles).toContain('.blog-atmosphere__orb')
    expect(styles).toContain('animation: none')
  })
})
