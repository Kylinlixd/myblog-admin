import fs from 'node:fs'
import path from 'node:path'

describe('Dashboard operations workspace', () => {
  const readDashboard = () =>
    fs.readFileSync(path.join(process.cwd(), 'src/views/Dashboard.vue'), 'utf8')

  it('uses an asymmetric wide-screen structure instead of four equal cards', () => {
    const source = readDashboard()

    expect(source).toContain('metric-rail')
    expect(source).toContain('operations-grid')
    expect(source).toContain('grid-template-columns: minmax(0, 9fr) minmax(300px, 3fr)')
    expect(source).not.toContain('stats-grid')
  })

  it('keeps the real seven-day trend as an accessible line chart', () => {
    const source = readDashboard()

    expect(source).toContain('content-pulse')
    expect(source).toContain('trend-line-chart')
    expect(source).toContain('<svg')
    expect(source).toContain('trendLinePoints')
    expect(source).toContain('trendAreaPoints')
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
})
