import fs from 'node:fs'
import path from 'node:path'

describe('Dashboard seven day trend card', () => {
  const readDashboard = () =>
    fs.readFileSync(path.join(process.cwd(), 'src/views/Dashboard.vue'), 'utf8')

  it('uses a polished chart layout with summary metrics and peak markers', () => {
    const source = readDashboard()

    expect(source).toContain('trend-summary')
    expect(source).toContain('trend-chart')
    expect(source).toContain('trend-column')
    expect(source).toContain('trend-peak')
    expect(source).toContain('totalDaily')
    expect(source).toContain('averageDaily')
  })

  it('builds a real-data spotlight and content composition panel', () => {
    const source = readDashboard()

    expect(source).toContain('dashboard-spotlight')
    expect(source).toContain('currentDate')
    expect(source).toContain('totalEntities')
    expect(source).toContain('contentBreakdown')
    expect(source).toContain('composition-panel')
    expect(source).toContain('metric-progress')
  })

  it('derives percentages from existing stats without invented growth data', () => {
    const source = readDashboard()

    expect(source).toContain('Math.round((Number(item.value || 0) / totalEntities.value) * 100)')
    expect(source).not.toContain('同比')
    expect(source).not.toContain('growthRate')
  })
})
