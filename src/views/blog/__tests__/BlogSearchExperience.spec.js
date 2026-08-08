import fs from 'node:fs'
import path from 'node:path'

describe('Blog search editorial layout', () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'src/views/blog/BlogSearch.vue'), 'utf8')

  it('exposes a result summary and intentional empty state', () => {
    expect(source).toContain('search-result-heading')
    expect(source).toContain('result-count')
    expect(source).toContain('no-results__title')
  })

  it('keeps the search surface responsive and warm themed', () => {
    expect(source).toContain('.search-box')
    expect(source).toContain('.search-result-heading')
    expect(source).toContain('prefers-reduced-motion')
  })
})
