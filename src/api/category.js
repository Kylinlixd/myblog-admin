import request from '@/utils/request'

import { normalizeCollectionResponse } from './collections'
import { unwrapApiResponse } from './response'

export async function getCategoryList(params) {
  const response = await request.get('/api/categories/', { params })
  return normalizeCollectionResponse(response)
}

export const createCategory = async (data) =>
  unwrapApiResponse(await request.post('/api/categories/', data), '分类创建失败')

export const updateCategory = async (id, data) =>
  unwrapApiResponse(await request.put(`/api/categories/${id}/`, data), '分类更新失败')

export const deleteCategory = async (id) =>
  unwrapApiResponse(await request.delete(`/api/categories/${id}/`), '分类删除失败')
