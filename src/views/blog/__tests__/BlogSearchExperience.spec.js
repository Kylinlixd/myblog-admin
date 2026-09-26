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

describe('Blog search filter interaction', () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'src/views/blog/BlogSearch.vue'), 'utf8')

  it('does not fire a search when a filter control changes', () => {
    // 点一下内容类型就整页转圈，是这次要修掉的问题
    expect(source).not.toContain('@change="debouncedSearch"')
    expect(source).not.toMatch(/advancedOptions\.type"[\s\S]{0,80}@change/)
    expect(source).toContain('筛选条件已更新，点「搜索」应用')
  })

  it('submits only through the explicit search actions', () => {
    expect(source).toContain('@click="handleSearch"')
    expect(source).toContain('@search="handleSearch"')
    expect(source).toContain('@press-enter="handleSearch"')
  })

  it('marks the filter panel dirty until a search runs', () => {
    expect(source).toContain('const filtersDirty = ref(false)')
    expect(source).toMatch(/watch\(advancedOptions,[\s\S]*?filtersDirty\.value = true/)
    expect(source).toMatch(/loading\.value = false\s*\n\s*filtersDirty\.value = false/)
  })

  it('keeps the filter panel aligned in a two column grid', () => {
    expect(source).toContain('class="filter-grid"')
    expect(source).toContain('class="filter-footer"')
    expect(source).toMatch(/\.filter-field\s*\{[\s\S]*?grid-template-columns: 74px minmax\(0, 1fr\)/)
    expect(source).toMatch(/\.filter-grid\s*\{[\s\S]*?repeat\(2, minmax\(0, 1fr\)\)/)
  })

  it('keeps the view switch inside the result heading instead of floating', () => {
    expect(source).toContain('result-heading-meta')
    expect(source).not.toMatch(/\.view-mode-toggle\s*\{[\s\S]{0,80}text-align: center/)
  })
})
