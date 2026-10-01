import request from '@/utils/request'

import { normalizeCollectionResponse } from './collections'
import { unwrapApiResponse } from './response'
import { clearRequestCache } from '@/services/http/publicRequestCache'

export async function getCategoryList(params) {
  const response = await request.get('/api/categories/', { params })
  return normalizeCollectionResponse(response)
}

// 分类名出现在公开页首页 / 归档页：写操作后清掉公开页 30s 缓存
export const createCategory = async (data) => {
  const result = await unwrapApiResponse(await request.post('/api/categories/', data), '分类创建失败')
  clearRequestCache()
  return result
}

export const updateCategory = async (id, data) => {
  const result = await unwrapApiResponse(await request.put(`/api/categories/${id}/`, data), '分类更新失败')
  clearRequestCache()
  return result
}

export const deleteCategory = async (id) => {
  const result = await unwrapApiResponse(await request.delete(`/api/categories/${id}/`), '分类删除失败')
  clearRequestCache()
  return result
}
