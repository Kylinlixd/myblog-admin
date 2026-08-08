import request from '@/utils/request'

import { normalizeCollectionResponse } from './collections'

export async function getCategoryList(params) {
  const response = await request.get('/api/categories/', { params })
  return normalizeCollectionResponse(response)
}

export const createCategory = (data) =>
  request.post('/api/categories/', data)

export const updateCategory = (id, data) =>
  request.put(`/api/categories/${id}/`, data)

export const deleteCategory = (id) =>
  request.delete(`/api/categories/${id}/`)
