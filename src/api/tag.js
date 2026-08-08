import request from '@/utils/request'

import { normalizeCollectionResponse } from './collections'
import { unwrapApiResponse } from './response'

export async function getTagList(params) {
  const response = await request.get('/api/tags/', { params })
  return normalizeCollectionResponse(response)
}

export const createTag = async (data) =>
  unwrapApiResponse(await request.post('/api/tags/', data), '标签创建失败')

export const updateTag = (id, data) =>
  request.put(`/api/tags/${id}/`, data)

export const deleteTag = (id) =>
  request.delete(`/api/tags/${id}/`)
