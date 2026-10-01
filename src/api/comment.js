import request from '@/utils/request'
import { normalizeCollectionResponse } from './collections'
import { unwrapApiResponse } from './response'

export async function getCommentList(params) {
  const response = await request.get('/api/comments/', { params })
  return normalizeCollectionResponse(response)
}

// 审核与删除的响应体走统一信封：code !== 200 时在这里抛出，调用方按失败处理
export const approveComment = (id) =>
  unwrapApiResponse(request.put(`/api/comments/${id}/approve/`))

export const rejectComment = (id) =>
  unwrapApiResponse(request.put(`/api/comments/${id}/reject/`))

export const deleteComment = (id) =>
  unwrapApiResponse(request.delete(`/api/comments/${id}/`))
