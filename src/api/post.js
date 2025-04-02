import request from '../utils/request'

/**
 * 获取文章列表
 * @param {Object} params - 查询参数
 * @param {number} [params.page=1] - 页码
 * @param {number} [params.pageSize=10] - 每页数量
 * @param {string} [params.keyword] - 搜索关键词
 * @param {number} [params.categoryId] - 分类ID
 * @param {number} [params.tagId] - 标签ID
 * @param {string} [params.status] - 状态：draft/published
 * @returns {Promise<{total: number, items: Array}>}
 */
export function getPostList(params) {
  return request({
    url: '/posts',
    method: 'get',
    params
  }).then(response => {
    if (response.code === 200) {
      return response.data
    }
    return Promise.reject(new Error(response.message || '获取文章列表失败'))
  })
}

/**
 * 获取文章详情
 * @param {number} id - 文章ID
 * @returns {Promise<Object>}
 */
export function getPostDetail(id) {
  return request({
    url: `/posts/${id}`,
    method: 'get'
  }).then(response => {
    if (response.code === 200) {
      return response.data
    }
    return Promise.reject(new Error(response.message || '获取文章详情失败'))
  })
}

/**
 * 创建文章
 * @param {Object} data - 文章数据
 * @param {string} data.title - 文章标题
 * @param {string} data.content - 文章内容
 * @param {string} data.summary - 文章摘要
 * @param {number} data.categoryId - 分类ID
 * @param {Array<number>} data.tagIds - 标签ID列表
 * @param {string} data.status - 状态：draft/published
 * @returns {Promise<{id: number}>}
 */
export function createPost(data) {
  return request({
    url: '/posts',
    method: 'post',
    data
  }).then(response => {
    if (response.code === 200) {
      return response.data
    }
    return Promise.reject(new Error(response.message || '创建文章失败'))
  })
}

/**
 * 更新文章
 * @param {number} id - 文章ID
 * @param {Object} data - 文章数据
 * @param {string} data.title - 文章标题
 * @param {string} data.content - 文章内容
 * @param {string} data.summary - 文章摘要
 * @param {number} data.categoryId - 分类ID
 * @param {Array<number>} data.tagIds - 标签ID列表
 * @param {string} data.status - 状态：draft/published
 * @returns {Promise<void>}
 */
export function updatePost(id, data) {
  return request({
    url: `/posts/${id}`,
    method: 'put',
    data
  }).then(response => {
    if (response.code === 200) {
      return response.data
    }
    return Promise.reject(new Error(response.message || '更新文章失败'))
  })
}

/**
 * 删除文章
 * @param {number} id - 文章ID
 * @returns {Promise<void>}
 */
export function deletePost(id) {
  return request({
    url: `/posts/${id}`,
    method: 'delete'
  }).then(response => {
    if (response.code === 200) {
      return response.data
    }
    return Promise.reject(new Error(response.message || '删除文章失败'))
  })
} 