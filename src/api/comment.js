import request from '@/utils/request'

export const getCommentList = (params) =>
  request.get('/api/comments/', { params })

export const approveComment = (id) =>
  request.put(`/api/comments/${id}/approve/`)

export const rejectComment = (id) =>
  request.put(`/api/comments/${id}/reject/`)

export const deleteComment = (id) =>
  request.delete(`/api/comments/${id}/`)
