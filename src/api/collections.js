import request from '@/utils/request'
import { clearRequestCache } from '@/services/http/publicRequestCache'
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
  // 分类/标签动态流把列表放在 dynamics 里，漏了它就会静默变成空列表
  if (Array.isArray(payload?.dynamics)) {
    return { count: payload.count ?? payload.total ?? payload.dynamics.length, results: payload.dynamics }
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

/* ---------- 后台合集管理：读接口 + 写接口 ---------- */

export async function getAdminCollectionList(params) {
  const response = await request.get('/api/collections/', { params })
  return normalizeCollectionResponse(response)
}

export async function getAdminCollectionDetail(id) {
  return unwrapApiResponse(await request.get(`/api/collections/${id}/`), '合集加载失败')
}

export async function getCollectionOptions() {
  return unwrapApiResponse(await request.get('/api/collections/options/'), '合集选项加载失败')
}

export async function createCollection(data) {
  const result = await unwrapApiResponse(await request.post('/api/collections/', data), '合集创建失败')
  clearRequestCache()
  return result
}

export async function updateCollection(id, data) {
  const result = await unwrapApiResponse(await request.put(`/api/collections/${id}/`, data), '合集更新失败')
  clearRequestCache()
  return result
}

export async function deleteCollection(id) {
  const result = await unwrapApiResponse(await request.delete(`/api/collections/${id}/`), '合集删除失败')
  clearRequestCache()
  return result
}

export async function getCollectionItems(id) {
  return unwrapApiResponse(await request.get(`/api/collections/${id}/items/`), '合集文章加载失败')
}

export async function saveCollectionItems(id, items) {
  const result = await unwrapApiResponse(
    await request.put(`/api/collections/${id}/items/`, { items }),
    '章节顺序保存失败'
  )
  clearRequestCache()
  return result
}
