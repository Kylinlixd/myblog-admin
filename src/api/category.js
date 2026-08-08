import request from '@/utils/request'

import { normalizeCollectionResponse } from './collections'
import { unwrapApiResponse } from './response'

export async function getCategoryList(params) {
  const response = await request.get('/api/categories/', { params })
  return normalizeCollectionResponse(response)
}

export const createCategory = async (data) =>
  unwrapApiResponse(await request.post('/api/categories/', data), '分类创建失败')

export const updateCategory = (id, data) =>
  request.put(`/api/categories/${id}/`, data)

export const deleteCategory = (id) =>
  request.delete(`/api/categories/${id}/`)
