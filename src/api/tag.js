import request from '@/utils/request'

import { normalizeCollectionResponse } from './collections'
import { unwrapApiResponse } from './response'
import { clearRequestCache } from '@/services/http/publicRequestCache'

export async function getTagList(params) {
  const response = await request.get('/api/tags/', { params })
  return normalizeCollectionResponse(response)
}

// 标签名会出现在公开页的搜索下拉与文章标签流：写操作后清掉公开页 30s 缓存
export const createTag = async (data) => {
  const result = await unwrapApiResponse(await request.post('/api/tags/', data), '标签创建失败')
  clearRequestCache()
  return result
}

export const updateTag = async (id, data) => {
  const result = await unwrapApiResponse(await request.put(`/api/tags/${id}/`, data), '标签更新失败')
  clearRequestCache()
  return result
}

export const deleteTag = async (id) => {
  const result = await unwrapApiResponse(await request.delete(`/api/tags/${id}/`), '标签删除失败')
  clearRequestCache()
  return result
}
