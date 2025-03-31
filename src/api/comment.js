import request from '../utils/request'

/**
 * 获取评论列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 * @param {string} [params.postTitle] - 文章标题
 * @param {string} [params.author] - 评论者
 * @param {string} [params.status] - 评论状态
 * @returns {Promise<{list: Array, total: number}>}
 */
export function getCommentList(params) {
  return request({
    url: '/comments',
    method: 'get',
    params
  }).then(response => {
    if (response.code === 0) {
      return response.data
    }
    return Promise.reject(new Error(response.message || '获取评论列表失败'))
  })
}

/**
 * 通过评论
 * @param {number} id - 评论ID
 * @returns {Promise<void>}
 */
export function approveComment(id) {
  return request({
    url: `/comments/${id}/approve`,
    method: 'put'
  }).then(response => {
    if (response.code === 0) {
      return response.data
    }
    return Promise.reject(new Error(response.message || '操作失败'))
  })
}

/**
 * 拒绝评论
 * @param {number} id - 评论ID
 * @returns {Promise<void>}
 */
export function rejectComment(id) {
  return request({
    url: `/comments/${id}/reject`,
    method: 'put'
  }).then(response => {
    if (response.code === 0) {
      return response.data
    }
    return Promise.reject(new Error(response.message || '操作失败'))
  })
}

/**
 * 删除评论
 * @param {number} id - 评论ID
 * @returns {Promise<void>}
 */
export function deleteComment(id) {
  return request({
    url: `/comments/${id}`,
    method: 'delete'
  }).then(response => {
    if (response.code === 0) {
      return response.data
    }
    return Promise.reject(new Error(response.message || '删除失败'))
  })
} 