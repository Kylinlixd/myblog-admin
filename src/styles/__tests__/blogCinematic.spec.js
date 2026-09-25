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

  it('keeps the admin page-header layout out of the public hero', () => {
    const styles = read('src/styles/blog-cinematic.scss')
    const admin = read('src/styles/admin-workspace.scss')

    // admin 侧确实是全局的 .page-header 横排规则
    expect(admin).toMatch(/\.page-header\s*\{[\s\S]*?justify-content: space-between/)

    // 博客 hero 明确改回自己的纵向栅格
    expect(styles).toMatch(
      /\.cinematic-page \.page-header\.cinematic-hero\s*\{[\s\S]*?display: grid;/
    )
    expect(styles).toMatch(
      /\.cinematic-page \.page-header\.cinematic-hero\s*\{[\s\S]*?justify-content: initial;/
    )
  })

  it('keeps decorative motion optional', () => {
    const styles = read('src/styles/blog-cinematic.scss')

    expect(styles).toContain('prefers-reduced-motion: reduce')
    expect(styles).toContain('.blog-atmosphere__orb')
    expect(styles).toContain('animation: none')
  })
})
