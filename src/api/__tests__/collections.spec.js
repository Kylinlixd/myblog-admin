import { collectAllPages, normalizeCollectionResponse } from '../collections'

describe('collection response normalization', () => {
  it.each([
    [[{ id: 1 }], 1],
    [{ count: 4, results: [{ id: 1 }] }, 4],
    [{ data: { count: 5, results: [{ id: 1 }] } }, 5],
    [{ data: { list: [{ id: 1 }], total: 6 } }, 6],
    [{ data: { total: 8, items: [{ id: 1 }] } }, 8],
    [{ data: { count: 42, items: [{ id: 1 }] } }, 42]
  ])('normalizes supported backend shape', (response, count) => {
    expect(normalizeCollectionResponse(response)).toEqual({
      count,
      results: [{ id: 1 }]
    })
  })
})

describe('collectAllPages', () => {
  // 模拟 DRF PageNumberPagination：最后一页只返回剩余条目
  const pageOf = (page, total, size = 10) => ({
    count: total,
    results: Array.from({ length: Math.max(0, Math.min(size, total - (page - 1) * size)) }, (_, index) => ({
      id: (page - 1) * size + index + 1
    }))
  })

  it('walks every page until count is reached', async () => {
    const loadPage = jest.fn(async (page) => pageOf(page, 25))

    const { count, results } = await collectAllPages(loadPage)

    expect(count).toBe(25)
    expect(results).toHaveLength(25)
    expect(results[24]).toEqual({ id: 25 })
    expect(loadPage).toHaveBeenCalledTimes(3)
  })

  it('stops on an empty page when the reported count is too high', async () => {
    const loadPage = jest.fn(async (page) => (page === 1 ? pageOf(1, 99) : { count: 99, results: [] }))

    const { count, results } = await collectAllPages(loadPage)

    expect(count).toBe(10)
    expect(results).toHaveLength(10)
    expect(loadPage).toHaveBeenCalledTimes(2)
  })

  it('stops at the page cap for runaway collections', async () => {
    const loadPage = jest.fn(async (page) => pageOf(page, 100000))

    const { results } = await collectAllPages(loadPage, { maxPages: 3 })

    expect(loadPage).toHaveBeenCalledTimes(3)
    expect(results).toHaveLength(30)
  })

  it('stops when a repeated page stops making progress', async () => {
    const loadPage = jest.fn(async () => pageOf(1, 100))

    const { results } = await collectAllPages(loadPage)

    expect(loadPage).toHaveBeenCalledTimes(2)
    expect(results).toHaveLength(10)
  })

  it('drops duplicated records returned by a broken backend', async () => {
    const loadPage = jest.fn(async (page) => (page === 1
      ? { count: 12, results: [{ id: 1 }, { id: 2 }] }
      : { count: 12, results: [{ id: 2 }, { id: 3 }] }))

    const { count, results } = await collectAllPages(loadPage)

    expect(count).toBe(3)
    expect(results.map((item) => item.id)).toEqual([1, 2, 3])
  })

  it('tolerates a single unpaginated response', async () => {
    const loadPage = jest.fn(async () => ({ count: 2, results: [{ id: 1 }, { id: 2 }] }))

    const { results } = await collectAllPages(loadPage)

    expect(results).toEqual([{ id: 1 }, { id: 2 }])
    expect(loadPage).toHaveBeenCalledTimes(1)
  })
})
