import {
  matchesMedia,
  matchesTimeRange,
  normalizeSearchItem,
  paginate,
  refineItems,
  sortItems
} from '../searchFilters'

const DAY = 24 * 60 * 60 * 1000
const now = Date.now()  // 跟随真实当前时间，避免用例随时间过期

const makeItem = (overrides = {}) => ({
  id: 1,
  title: '内容',
  createdAt: new Date(now - 2 * DAY).toISOString(),
  views: 1,
  likes: 0,
  comments: 0,
  mediaUrls: [],
  ...overrides
})

describe('blog search local filters', () => {
  it('keeps items inside the requested time range', () => {
    const recent = makeItem({ id: 1, createdAt: new Date(now - 3 * DAY).toISOString() })
    const old = makeItem({ id: 2, createdAt: new Date(now - 200 * DAY).toISOString() })

    expect(matchesTimeRange(recent, 'week', now)).toBe(true)
    expect(matchesTimeRange(old, 'week', now)).toBe(false)
    expect(matchesTimeRange(old, 'year', now)).toBe(true)
    // 没选时间范围时全部保留
    expect(matchesTimeRange(old, undefined, now)).toBe(true)
    // 缺时间字段不参与过滤，避免直接把内容筛没
    expect(matchesTimeRange({ id: 3 }, 'week', now)).toBe(true)
  })

  it('filters media only when requested', () => {
    const withMedia = makeItem({ id: 1, mediaUrls: [{ url: '/a.png' }] })
    const withoutMedia = makeItem({ id: 2, mediaUrls: [] })

    expect(matchesMedia(withoutMedia, false)).toBe(true)
    expect(matchesMedia(withoutMedia, true)).toBe(false)
    expect(matchesMedia(withMedia, true)).toBe(true)
  })

  it('sorts by time, likes, comments and views', () => {
    const older = makeItem({ id: 1, createdAt: new Date(now - 10 * DAY).toISOString(), likes: 1, comments: 5, views: 10 })
    const newer = makeItem({ id: 2, createdAt: new Date(now - 1 * DAY).toISOString(), likes: 9, comments: 1, views: 30 })

    expect(sortItems([older, newer], 'time_desc').map((item) => item.id)).toEqual([2, 1])
    expect(sortItems([older, newer], 'time_asc').map((item) => item.id)).toEqual([1, 2])
    expect(sortItems([older, newer], 'likes_desc').map((item) => item.id)).toEqual([2, 1])
    expect(sortItems([older, newer], 'comments_desc').map((item) => item.id)).toEqual([1, 2])
    expect(sortItems([older, newer], 'views_desc').map((item) => item.id)).toEqual([2, 1])
    // 未知排序保持原顺序
    expect(sortItems([older, newer], 'relevance').map((item) => item.id)).toEqual([1, 2])
  })

  it('combines filters and sorting', () => {
    const items = [
      makeItem({ id: 1, createdAt: new Date(now - 100 * DAY).toISOString(), mediaUrls: ['/a.png'] }),
      makeItem({ id: 2, createdAt: new Date(now - 2 * DAY).toISOString(), mediaUrls: [] }),
      makeItem({ id: 3, createdAt: new Date(now - 1 * DAY).toISOString(), mediaUrls: ['/b.png'] })
    ]

    expect(refineItems(items, { time: 'week', hasMedia: true }).map((item) => item.id)).toEqual([3])
    expect(refineItems(items, { sortBy: 'time_asc' }).map((item) => item.id)).toEqual([1, 2, 3])
    expect(refineItems(items, {}).map((item) => item.id)).toEqual([1, 2, 3])
  })

  it('narrows keyword results to the selected category', () => {
    const articleInCategory = makeItem({ id: 1, type: 'dynamic', category: { id: 4, name: '前端' } })
    const articleInOtherCategory = makeItem({ id: 2, type: 'dynamic', category: { id: 5, name: '后端' } })
    const articleWithoutCategory = makeItem({ id: 3, type: 'dynamic' })
    const tagEntry = makeItem({ id: 4, type: 'tag', name: 'Vue' })
    const categoryEntry = makeItem({ id: 5, type: 'category', name: '前端' })

    const items = [articleInCategory, articleInOtherCategory, articleWithoutCategory, tagEntry, categoryEntry]
    expect(refineItems(items, { category: 4 }).map((item) => item.id)).toEqual([1])
    // 字符串 / 数字 id 两种口径都能匹配上
    expect(refineItems(items, { category: '4' }).map((item) => item.id)).toEqual([1])
    // 未选分类时伪条目照常保留
    expect(refineItems(items, {})).toHaveLength(5)
  })

  it('narrows keyword results to items carrying the selected tag', () => {
    const tagged = makeItem({ id: 1, type: 'dynamic', tags: [{ id: 9, name: 'Git' }] })
    const untagged = makeItem({ id: 2, type: 'dynamic', tags: [{ id: 10, name: 'Vue' }] })
    const tagEntry = makeItem({ id: 3, type: 'tag', name: 'Git' })

    expect(refineItems([tagged, untagged, tagEntry], { tag: 9 }).map((item) => item.id)).toEqual([1])
    expect(refineItems([tagged, untagged, tagEntry], { tag: '10' }).map((item) => item.id)).toEqual([2])
    expect(refineItems([tagged, untagged, tagEntry], { tag: undefined })).toHaveLength(3)
  })

  it('paginates the refined list and clamps the page', () => {
    const items = Array.from({ length: 25 }, (_, index) => makeItem({ id: index + 1 }))

    const first = paginate(items, 1, 10)
    expect(first.items).toHaveLength(10)
    expect(first.total).toBe(25)
    expect(first.totalPages).toBe(3)

    const last = paginate(items, 3, 10)
    expect(last.items).toHaveLength(5)

    // 越界页码回落到最后一页，避免筛选后停在空白页
    expect(paginate(items, 99, 10).page).toBe(3)
    expect(paginate([], 2, 10)).toMatchObject({ items: [], total: 0, page: 1, totalPages: 1 })
  })

  it('normalizes feed items written in snake_case', () => {
    const normalized = normalizeSearchItem({ id: 7, created_at: '2026-09-01T00:00:00Z', views: '12' })

    expect(normalized.createdAt).toBe('2026-09-01T00:00:00Z')
    expect(normalized.views).toBe(12)
    expect(normalized.likes).toBe(0)
  })
})
