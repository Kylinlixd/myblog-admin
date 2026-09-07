import { mapDashboardData } from '../stats'
import { publishingOption, visitsOption } from '../charts'

it('maps readership separately from API requests and sorts topics by reads', () => {
  const stats = mapDashboardData({ data: {
    daily: [{ day: '2026-09-07', count: '2', pv: '30' }],
    categories: [{ name: '多文章', dynamic_count: 10, views: 5 }, { name: '高阅读', dynamic_count: 1, views: 300 }],
    visits: { pv: 30, uv: 8, average: 4.3, bounce_rate: 25 },
    security: { unique_ips: 10, medium: 2, high: 1, critical: 0, top_ips: [] },
    hot_articles: [{ id: 3, title: '热文', view_count: 50, comment_count: 2 }]
  } })
  expect(stats.daily[0].pv).toBe(30)
  expect(stats.categories[0].name).toBe('高阅读')
  expect(stats.visits.pv).toBe(30)
  expect(stats.hotArticles[0].id).toBe(3)
  expect(stats.security.medium).toBe(2)
  expect(mapDashboardData().visits.bounceRate).toBeNull()
})

it('keeps article counts and PV on separate axes with hover values in both charts', () => {
  const daily = [{ day: '2026-09-07', count: 2, pv: 1300 }]
  const option = publishingOption(daily)
  expect(option.yAxis).toHaveLength(2)
  expect(option.series[0].data).toEqual([2])
  expect(option.series[1].data).toEqual([1300])
  expect(option.series[1].yAxisIndex).toBe(1)
  expect(option.tooltip.trigger).toBe('axis')
  expect(visitsOption(daily).tooltip.trigger).toBe('axis')
})
