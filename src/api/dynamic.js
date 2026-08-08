import request from '@/utils/request'

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

export const getDynamicList = (params) =>
  request.get('/api/dynamics/', { params: buildDynamicParams(params) })

export const getDynamicDetail = (id) =>
  request.get(`/api/dynamics/${id}/`)

export const deleteDynamic = (id) =>
  request.delete(`/api/dynamics/${id}/`)

export function createDynamic(data) {
  const payload = normalizeDynamicPayload(data)
  validateDynamicPayload(payload)
  return request.post('/api/dynamics/', payload)
}

export function updateDynamic(id, data) {
  const payload = normalizeDynamicPayload(data)
  validateDynamicPayload(payload)
  return request.put(`/api/dynamics/${id}/`, payload)
}
