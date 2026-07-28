import { mapDashboardData, mapDashboardStats } from '../stats'

describe('mapDashboardStats', () => {
  it('maps the backend totals with safe defaults', () => {
    expect(mapDashboardStats({
      code: 200,
      data: { total: { dynamics: 12, categories: 4, tags: 9, comments: 3 } }
    })).toEqual({ dynamics: 12, categories: 4, tags: 9, comments: 3 })

    expect(mapDashboardStats(null)).toEqual({ dynamics: 0, categories: 0, tags: 0, comments: 0 })
  })

  it('normalizes trend, category, and tag series from the existing endpoint', () => {
    expect(mapDashboardData({
      data: {
        total: { dynamics: '12', categories: 4, tags: 9, comments: null },
        daily: [{ day: '07-28', count: '3' }],
        categories: Array.from({ length: 6 }, (_, index) => ({
          name: `分类${index + 1}`,
          dynamic_count: String(6 - index)
        })),
        tags: [{ name: 'Vue', dynamic_count: '7' }]
      }
    })).toEqual({
      total: { dynamics: 12, categories: 4, tags: 9, comments: 0 },
      daily: [{ day: '07-28', count: 3 }],
      categories: [
        { name: '分类1', count: 6 },
        { name: '分类2', count: 5 },
        { name: '分类3', count: 4 },
        { name: '分类4', count: 3 },
        { name: '分类5', count: 2 }
      ],
      tags: [{ name: 'Vue', count: 7 }]
    })

    expect(mapDashboardData(null)).toEqual({
      total: { dynamics: 0, categories: 0, tags: 0, comments: 0 },
      daily: [],
      categories: [],
      tags: []
    })
  })
})
