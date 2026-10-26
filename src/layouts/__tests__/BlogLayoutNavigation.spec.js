import fs from 'node:fs'
import path from 'node:path'

describe('BlogLayout navigation active state', () => {
  const readLayout = () =>
    fs.readFileSync(path.join(process.cwd(), 'src/layouts/BlogLayout.vue'), 'utf8')

  it('marks the section that owns the current route', () => {
    const source = readLayout()

    expect(source).toContain('resolveBlogNav')
    expect(source).toContain('activeNav')
    expect(source).toContain('isNavigationActive(item)')
    expect(source).toContain(":aria-current=\"isNavigationActive(item) ? 'page' : undefined\"")
    expect(source).not.toContain('a.router-link-active')
  })

  it('shows the search page through the search box instead of a section tab', () => {
    const source = readLayout()

    expect(source).toContain("'quick-search--active': isSearchPage")
    expect(source).toContain('route.query.keyword')
    expect(source).toContain('.quick-search:focus-within, .quick-search--active')
  })

  it('keeps 拾光 as the reading context for articles opened from it', () => {
    const detail = fs.readFileSync(path.join(process.cwd(), 'src/views/blog/BlogDynamicDetail.vue'), 'utf8')
    const collection = fs.readFileSync(path.join(process.cwd(), 'src/views/blog/BlogCollectionDetail.vue'), 'utf8')
    const category = fs.readFileSync(path.join(process.cwd(), 'src/views/blog/BlogCategoryDetail.vue'), 'utf8')
    const tag = fs.readFileSync(path.join(process.cwd(), 'src/views/blog/BlogTagDetail.vue'), 'utf8')

    expect(detail).toContain("route.query.from === 'light'")
    expect(detail).toContain('query: contextQuery')
    expect(detail).toContain('← 返回拾光')
    expect(collection).toContain("query: { from: 'light' }")
    expect(category).toContain("query: { from: 'light' }")
    expect(tag).toContain('route.query.from === \'light\'')
  })

  it('keeps search and admin access available on mobile', () => {
    const source = readLayout()

    expect(source).toContain('mobile-admin-link')
    expect(source).toContain('quick-search-button')
    expect(source).toContain("t('nav.admin')")
    expect(source).not.toContain('.quick-search input { width: 0; }')
    expect(source).toContain('.quick-search input { width: 100%; min-width: 0;')
  })

  it('uses a balanced floating navigation with accessible mobile state', () => {
    const source = readLayout()

    expect(source).toContain('class="site-header-panel')
    expect(source).toContain(':aria-expanded="mobileOpen"')
    expect(source).toContain('aria-controls="mobile-navigation"')
    expect(source).toContain('id="mobile-navigation"')
    expect(source).toContain('@keydown.esc="mobileOpen = false"')
  })

  it('uses a warm underline transition for active and hovered navigation links', () => {
    const source = readLayout()

    expect(source).toContain('.desktop-nav a.nav-link--active::after')
    expect(source).toContain('.desktop-nav a:not(.nav-link--active)::after')
    expect(source).toContain('transform: translateX(-50%) scaleX(0)')
    expect(source).toContain('transform: translateX(-50%) scaleX(1)')
    expect(source).toContain('transition: color .28s ease, background-color .28s ease')
    expect(source).toContain('.desktop-nav a.nav-link--active, .mobile-nav a.nav-link--active { background: transparent;')
    expect(source).not.toContain('.desktop-nav a:not(.nav-link--active):hover::after')
    expect(source).toContain('.quick-search:hover')
    expect(source).toContain('.admin-link:hover')
  })
})

describe('悬浮导航的阅读线与遮罩带', () => {
  const readLayout = () =>
    fs.readFileSync(path.join(process.cwd(), 'src/layouts/BlogLayout.vue'), 'utf8')
  const readFile = (rel) => fs.readFileSync(path.join(process.cwd(), rel), 'utf8')

  it('defines one reading line on the shell and derives it from the header height', () => {
    const source = readLayout()

    expect(source).toContain('--reading-offset: calc(var(--header-height) + 20px);')
    // 导航几何必须同源，否则阅读线会跟着漂
    expect(source).toContain('--header-top: 14px; --header-height: 76px;')
  })

  it('keeps a veil band above the content so scrolled text cannot show through the glass nav', () => {
    const source = readLayout()

    expect(source).toContain('.site-header::before')
    expect(source).toContain('z-index: var(--z-header)')
    expect(source).toContain('z-index: var(--z-content)')
    // 药丸不再是 82% 的玻璃：那正是正文"透"出来的原因
    expect(source).not.toContain('background: rgb(255 250 242 / 82%)')
  })

  it('pins every sticky column below the reading line instead of a small hand-written top', () => {
    const timeline = readFile('src/views/blog/BlogDynamic.vue')
    const detail = readFile('src/views/blog/BlogDynamicDetail.vue')

    // 书遇的时间轴曾经写 top: 28px，滚动后被导航与遮罩带压住
    expect(timeline).toContain('top: var(--reading-offset, 96px);')
    expect(timeline).not.toContain('top: 28px;')
    expect(detail).toContain('top: var(--reading-offset, 96px);')
    expect(detail).toContain('scroll-margin-top: var(--reading-offset, 96px);')
  })
})
