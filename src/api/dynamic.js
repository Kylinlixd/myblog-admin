import request from '@/utils/request'
import { normalizeCollectionResponse } from './collections'
import { unwrapApiResponse } from './response'
import { clearRequestCache } from '@/services/http/publicRequestCache'
import { t } from '@/i18n'

export function buildDynamicParams(params = {}) {
  const search = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    if (Array.isArray(value)) {
      value.forEach((item) => search.append(key, String(item)))
      return
    }
    search.set(key, String(value))
  })

  if (!search.has('sort')) search.set('sort', 'createdAt:desc')
  return search
}

export function normalizeDynamicPayload(data = {}) {
  const mediaUrls = data.mediaUrls ?? data.media_urls ?? []
  const payload = {
    title: data.title?.trim() || '',
    content: data.content?.trim() || '',
    type: data.type || 'text',
    status: data.status || 'draft',
    mediaUrls: Array.isArray(mediaUrls) ? mediaUrls : [mediaUrls],
    categoryId: data.categoryId ?? data.category ?? null,
    tags: Array.isArray(data.tags) ? data.tags : []
  }

  if (Array.isArray(data.fileIds)) payload.fileIds = data.fileIds
  return payload
}

function validateDynamicPayload(payload) {
  if (payload.type !== 'text' && payload.mediaUrls.length === 0) {
    throw new TypeError(t('dynamicMgr.mediaRequired', { type: payload.type }))
  }
}

// 公开页的「最新 / 热门」有 30s 缓存：写操作后清掉，避免管理端改完前台还是旧数据
function invalidatePublicCache() {
  clearRequestCache()
}

export const getDynamicList = async (params) => {
  const response = await request.get('/api/dynamics/', { params: buildDynamicParams(params) })
  return normalizeCollectionResponse(response)
}

export const getDynamicDetail = async (id) =>
  unwrapApiResponse(await request.get(`/api/dynamics/${id}/`), t('dynamicMgr.requestFailed'))

export const deleteDynamic = async (id) => {
  const result = await unwrapApiResponse(await request.delete(`/api/dynamics/${id}/`), t('dynamicMgr.deleteFailed'))
  invalidatePublicCache()
  return result
}

export async function createDynamic(data) {
  const payload = normalizeDynamicPayload(data)
  validateDynamicPayload(payload)
  const result = await unwrapApiResponse(await request.post('/api/dynamics/', payload), t('dynamicMgr.requestFailed'))
  invalidatePublicCache()
  return result
}

export async function updateDynamic(id, data) {
  const payload = normalizeDynamicPayload(data)
  validateDynamicPayload(payload)
  const result = await unwrapApiResponse(await request.put(`/api/dynamics/${id}/`, payload), t('dynamicMgr.requestFailed'))
  invalidatePublicCache()
  return result
}
