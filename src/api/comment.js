import request from '@/utils/request'

import { normalizeCollectionResponse } from './collections'

export async function getCommentList(params) {
  const response = await request.get('/api/comments/', { params })
  return normalizeCollectionResponse(response)
}

export const approveComment = (id) =>
  request.put(`/api/comments/${id}/approve/`)

export const rejectComment = (id) =>
  request.put(`/api/comments/${id}/reject/`)

export const deleteComment = (id) =>
  request.delete(`/api/comments/${id}/`)
