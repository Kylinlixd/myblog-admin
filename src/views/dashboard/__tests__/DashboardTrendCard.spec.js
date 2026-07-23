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
})
