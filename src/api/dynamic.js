import request from '@/utils/request'
import { normalizeCollectionResponse } from './collections'
import { unwrapApiResponse } from './response'

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
    throw new TypeError(`${payload.type} 类型的内容必须包含媒体文件`)
  }
}

export const getDynamicList = async (params) => {
  const response = await request.get('/api/dynamics/', { params: buildDynamicParams(params) })
  return normalizeCollectionResponse(response)
}

export const getDynamicDetail = async (id) =>
  unwrapApiResponse(await request.get(`/api/dynamics/${id}/`), '动态请求失败')

export const deleteDynamic = (id) =>
  request.delete(`/api/dynamics/${id}/`)

export async function createDynamic(data) {
  const payload = normalizeDynamicPayload(data)
  validateDynamicPayload(payload)
  return unwrapApiResponse(await request.post('/api/dynamics/', payload), '动态请求失败')
}

export async function updateDynamic(id, data) {
  const payload = normalizeDynamicPayload(data)
  validateDynamicPayload(payload)
  return unwrapApiResponse(await request.put(`/api/dynamics/${id}/`, payload), '动态请求失败')
}
