import fs from 'node:fs'
import path from 'node:path'

describe('Dashboard operations workspace', () => {
  const readDashboard = () =>
    fs.readFileSync(path.join(process.cwd(), 'src/views/Dashboard.vue'), 'utf8')

  it('uses an asymmetric wide-screen structure instead of four equal cards', () => {
    const source = readDashboard()

    expect(source).toContain('metric-rail')
    expect(source).toContain('operations-grid')
    expect(source).toContain('grid-template-columns: minmax(0, 1.5fr) minmax(360px, 1fr)')
    expect(source).not.toContain('stats-grid')
  })

  it('keeps the real seven-day trend as an accessible line chart', () => {
    const source = readDashboard()

    expect(source).toContain('content-pulse')
    expect(source).toContain('trend-line-chart')
    expect(source).toContain('<DashboardChart')
    expect(source).toContain('publishingOption(daily)')
    expect(source).toContain('insights-grid')
    expect(source).not.toContain('trend-bar')
    expect(source).toContain('totalDaily')
    expect(source).toContain('averageDaily')
    expect(source).toContain('maxDaily')
  })

  it('uses real category and tag activity without invented growth data', () => {
    const source = readDashboard()

    expect(source).toContain('taxonomy-list')
    expect(source).toContain('dashboardData.categories')
    expect(source).toContain('dashboardData.tags')
    expect(source).toContain('mapDashboardData')
    expect(source).not.toContain('同比')
    expect(source).not.toContain('growthRate')
    expect(source).not.toContain("color: '#d97706'")
    expect(source).not.toContain("color: '#7c3aed'")
  })

  it('keeps the dashboard first view focused on actions and vertical metrics', () => {
    const source = readDashboard()

    expect(source).toContain('class="intro-actions"')
    expect(source).toContain('class="metric-label"')
    expect(source).toContain('class="metric-value"')
    expect(source).not.toContain('totalEntities')
    expect(source).not.toContain('metric-index')
    expect(source).not.toContain('metric-arrow')
    expect(source).toContain('grid-template-columns: repeat(4, minmax(0, 1fr))')
    expect(source).toContain('grid-template-rows: auto auto auto')
  })

  it('shows a visible unread marker on the comments metric', () => {
    const source = readDashboard()

    expect(source).toContain('class="metric-unread-dot"')
    expect(source).toContain('aria-label="有新评论"')
    expect(source).not.toContain('新评论 {{ commentNotifications.unreadCount }}')
  })
})
