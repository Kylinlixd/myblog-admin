import request from '@/utils/request'

import { normalizeCollectionResponse } from './collections'
import { unwrapApiResponse } from './response'

function normalizeFileItem(item) {
  return {
    ...item,
    type: item.type ?? item.file_type,
    size: item.size ?? item.file_size,
    url: item.url ?? item.file_url ?? null
  }
}

function normalizeFileResponse(response) {
  const { count, results } = normalizeCollectionResponse(response)
  return {
    count,
    results: results.map(normalizeFileItem)
  }
}

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

function normalizeUploadResponse(response) {
  const item = unwrapApiResponse(response, '上传失败')
  return item && typeof item === 'object' && !Array.isArray(item)
    ? normalizeFileItem(item)
    : item
}

export const uploadFile = async (params) =>
  normalizeUploadResponse(await request.post('/api/upload/upload/', buildUploadData(params)))

export async function getFileList(params = {}) {
  const response = await request.get('/api/upload/files/', {
    params: {
      page: params.page || 1,
      pageSize: params.pageSize || 10,
      keyword: params.keyword || undefined,
      file_type: params.type || undefined
    }
  })
  return normalizeFileResponse(response)
}

export async function searchFiles(params) {
  const response = await request.get('/api/upload/files/search/', {
    params: {
      q: params.q,
      type: params.type,
      category: params.category,
      tags: params.tags?.length ? JSON.stringify(params.tags) : undefined,
      page: params.page || 1,
      pageSize: params.pageSize || 10
    }
  })
  return normalizeFileResponse(response)
}

export const downloadFile = (fileId) =>
  request.post(`/api/upload/files/${fileId}/download/`, null, { responseType: 'blob' })

export const deleteFile = (fileId) =>
  request.delete(`/api/upload/files/${fileId}/`)

export const getFileDetail = (id) =>
  request.get(`/api/upload/files/${id}/`)
