import request from '@/utils/request'

import { normalizeCollectionResponse } from './collections'

export async function getTagList(params) {
  const response = await request.get('/api/tags/', { params })
  return normalizeCollectionResponse(response)
}

export const createTag = (data) =>
  request.post('/api/tags/', data)

export const updateTag = (id, data) =>
  request.put(`/api/tags/${id}/`, data)

export const deleteTag = (id) =>
  request.delete(`/api/tags/${id}/`)
