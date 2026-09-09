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

  it('keeps search and admin access available on mobile', () => {
    const source = readLayout()

    expect(source).toContain('mobile-admin-link')
    expect(source).toContain('quick-search-button')
    expect(source).toContain('管理后台')
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
