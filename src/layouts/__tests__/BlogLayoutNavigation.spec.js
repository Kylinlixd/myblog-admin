import fs from 'node:fs'
import path from 'node:path'

describe('BlogLayout navigation active state', () => {
  const readLayout = () =>
    fs.readFileSync(path.join(process.cwd(), 'src/layouts/BlogLayout.vue'), 'utf8')

  it('does not let the home link stay active on every blog route', () => {
    const source = readLayout()

    expect(source).toContain('isNavigationActive(item)')
    expect(source).toContain("item.to === '/blog'")
    expect(source).toContain("currentPath === '/blog' || currentPath === '/blog/'")
    expect(source).not.toContain('a.router-link-active')
  })
})
