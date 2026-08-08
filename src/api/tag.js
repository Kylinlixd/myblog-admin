import request from '@/utils/request'

import { normalizeCollectionResponse } from './collections'
import { unwrapApiResponse } from './response'

export async function getTagList(params) {
  const response = await request.get('/api/tags/', { params })
  return normalizeCollectionResponse(response)
}

export const createTag = async (data) =>
  unwrapApiResponse(await request.post('/api/tags/', data), '标签创建失败')

export const updateTag = async (id, data) =>
  unwrapApiResponse(await request.put(`/api/tags/${id}/`, data), '标签更新失败')

export const deleteTag = async (id) =>
  unwrapApiResponse(await request.delete(`/api/tags/${id}/`), '标签删除失败')
