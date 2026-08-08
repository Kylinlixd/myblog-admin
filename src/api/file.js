import request from '@/utils/request'

export function buildUploadData(params) {
  const formData = new FormData()
  formData.append('file', params.file)
  formData.append('file_type', params.file_type)

  for (const key of ['dynamic_id', 'category_id', 'description', 'is_public']) {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      formData.append(key, String(params[key]))
    }
  }
  if (params.tag_ids?.length) formData.append('tag_ids', JSON.stringify(params.tag_ids))
  return formData
}

export const uploadFile = (params) =>
  request.post('/api/upload/upload/', buildUploadData(params))

export async function getFileList(params = {}) {
  const response = await request.get('/api/upload/files/', {
    params: {
      page: params.page || 1,
      pageSize: params.pageSize || 10,
      keyword: params.keyword || undefined,
      file_type: params.type || undefined
    }
  })
  const items = response?.results || response?.data?.items || []
  const normalizedItems = items.map((item) => ({
    ...item,
    type: item.file_type || item.type,
    size: item.file_size || item.size,
    url: item.file_url || item.url || null
  }))

  return {
    code: 200,
    data: {
      items: normalizedItems,
      total: response?.count ?? response?.data?.total ?? normalizedItems.length
    },
    message: 'success'
  }
}

export const searchFiles = (params) =>
  request.get('/api/upload/files/search/', {
    params: {
      q: params.q,
      type: params.type,
      category: params.category,
      tags: params.tags?.length ? JSON.stringify(params.tags) : undefined,
      page: params.page || 1,
      pageSize: params.pageSize || 10
    }
  })

export const downloadFile = (fileId) =>
  request.post(`/api/upload/files/${fileId}/download/`, null, { responseType: 'blob' })

export const deleteFile = (fileId) =>
  request.delete(`/api/upload/files/${fileId}/`)

export const getFileDetail = (id) =>
  request.get(`/api/upload/files/${id}/`)
