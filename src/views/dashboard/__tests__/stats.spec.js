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
      daily: [{ day: '07-28', count: 3, pv: 0 }],
      range: { start: '', end: '', timezone: '' },
      categories: [
        { name: '分类1', count: 6, views: 0 },
        { name: '分类2', count: 5, views: 0 },
        { name: '分类3', count: 4, views: 0 },
        { name: '分类4', count: 3, views: 0 },
        { name: '分类5', count: 2, views: 0 }
      ],
      tags: [{ name: 'Vue', count: 7, views: 0 }],
      visits: { pv: 0, uv: 0, average: 0, bounceRate: null },
      hotArticles: [],
      security: { uniqueIps: 0, medium: 0, high: 0, critical: 0, topIps: [] },
      access: { requests: 0, uniqueIps: 0 }
    })

    expect(mapDashboardData(null)).toEqual({
      total: { dynamics: 0, categories: 0, tags: 0, comments: 0 },
      daily: [],
      range: { start: '', end: '', timezone: '' },
      categories: [],
      tags: [],
      visits: { pv: 0, uv: 0, average: 0, bounceRate: null },
      hotArticles: [],
      security: { uniqueIps: 0, medium: 0, high: 0, critical: 0, topIps: [] },
      access: { requests: 0, uniqueIps: 0 }
    })
  })

  it('normalizes access overview without inventing values', () => {
    expect(mapDashboardData({ data: { access: { requests: 12, unique_ips: 4 } } }).access).toEqual({ requests: 12, uniqueIps: 4 })
  })

  it('keeps the server reporting range and timezone visible to the dashboard', () => {
    expect(mapDashboardData({ data: {
      range: { start: '2026-09-03', end: '2026-09-09', timezone: 'Asia/Shanghai' }
    } }).range).toEqual({ start: '2026-09-03', end: '2026-09-09', timezone: 'Asia/Shanghai' })
  })
})
