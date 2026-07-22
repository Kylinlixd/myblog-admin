import { mapDashboardStats } from '../stats'

describe('mapDashboardStats', () => {
  it('maps the backend totals with safe defaults', () => {
    expect(mapDashboardStats({
      code: 200,
      data: { total: { dynamics: 12, categories: 4, tags: 9, comments: 3 } }
    })).toEqual({ dynamics: 12, categories: 4, tags: 9, comments: 3 })

    expect(mapDashboardStats(null)).toEqual({ dynamics: 0, categories: 0, tags: 0, comments: 0 })
  })
})
