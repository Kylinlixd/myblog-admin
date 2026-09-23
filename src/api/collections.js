import { unwrapApiResponse } from './response'

export function normalizeCollectionResponse(response) {
  const payload = unwrapApiResponse(response)

  if (Array.isArray(payload)) return { count: payload.length, results: payload }
  if (Array.isArray(payload?.results)) {
    return { count: payload.count ?? payload.results.length, results: payload.results }
  }

  if (Array.isArray(payload?.list)) {
    return { count: payload.count ?? payload.total ?? payload.list.length, results: payload.list }
  }
  if (Array.isArray(payload?.items)) {
    return { count: payload.count ?? payload.total ?? payload.items.length, results: payload.items }
  }

  return { count: 0, results: [] }
}

/**
 * 逐页取完整集合。
 *
 * 后端是 DRF PageNumberPagination（PAGE_SIZE=10，且没有开放 page_size 查询参数），
 * 不传 page 时只会返回第一页：分类 14 个、标签 71 个的时候，下拉框就只会有 10 个选项。
 * 这里按页累加，直到取满 count、返回空页或到达 maxPages 上限。
 *
 * @param {(page: number) => Promise<{count?: number, results?: unknown[]}>} loadPage
 */
export async function collectAllPages(loadPage, { maxPages = 25 } = {}) {
  const results = []
  const seenIds = new Set()
  let expectedCount = 0

  for (let page = 1; page <= maxPages; page += 1) {
    const { count, results: batch } = (await loadPage(page)) || {}
    const items = Array.isArray(batch) ? batch : []

    if (typeof count === 'number' && count >= 0) expectedCount = count

    const before = results.length
    for (const item of items) {
      // 同一条记录被重复返回时只保留一次，避免下拉框出现重复选项
      const id = item && typeof item === 'object' && item.id != null ? String(item.id) : null
      if (id !== null) {
        if (seenIds.has(id)) continue
        seenIds.add(id)
      }
      results.push(item)
    }

    // 空页、翻页没有带来任何新条目、或已经取满 count 都停下来
    if (!items.length || results.length === before || results.length >= expectedCount) break
  }

  return { count: results.length, results }
}
