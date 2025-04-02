import request from '../utils/request'

/**
 * 获取博客首页文章列表
 * @param {Object} params - 查询参数
 * @param {number} [params.page=1] - 页码
 * @param {number} [params.pageSize=10] - 每页数量
 * @returns {Promise<{total: number, items: Array}>}
 */
export function getBlogPosts(params) {
  return request.get('/blog/posts', params)
    .then(response => {
      if (response.code === 200) {
        return response.data
      }
      return Promise.reject(new Error(response.message || '获取博客文章列表失败'))
    })
}

/**
 * 获取博客文章详情
 * @param {number} id - 文章ID
 * @returns {Promise<Object>}
 */
export function getBlogPostDetail(id) {
  return request.get(`/blog/posts/${id}`)
    .then(response => {
      if (response.code === 200) {
        return response.data
      }
      return Promise.reject(new Error(response.message || '获取文章详情失败'))
    })
}

/**
 * 获取相邻文章（上一篇和下一篇）
 * @param {number} id - 当前文章ID
 * @returns {Promise<{prev: Object|null, next: Object|null}>}
 */
export function getAdjacentPosts(id) {
  return request.get(`/blog/posts/${id}/adjacent`)
    .then(response => {
      if (response.code === 200) {
        return response.data
      }
      return Promise.reject(new Error(response.message || '获取相邻文章失败'))
    })
}

/**
 * 获取热门文章列表
 * @param {number} [limit=5] - 获取数量
 * @returns {Promise<Array>}
 */
export function getHotPosts(limit = 5) {
  return request.get('/blog/posts/hot', { limit })
    .then(response => {
      if (response.code === 200) {
        return response.data
      }
      return Promise.reject(new Error(response.message || '获取热门文章失败'))
    })
}

/**
 * 获取最新文章列表
 * @param {number} [limit=5] - 获取数量
 * @returns {Promise<Array>}
 */
export function getRecentPosts(limit = 5) {
  return request.get('/blog/posts/recent', { limit })
    .then(response => {
      if (response.code === 200) {
        return response.data
      }
      return Promise.reject(new Error(response.message || '获取最新文章失败'))
    })
}

/**
 * 获取分类下的文章
 * @param {number} categoryId - 分类ID
 * @param {Object} params - 查询参数
 * @param {number} [params.page=1] - 页码
 * @param {number} [params.pageSize=10] - 每页数量
 * @returns {Promise<{total: number, items: Array}>}
 */
export function getCategoryPosts(categoryId, params) {
  return request.get(`/blog/categories/${categoryId}/posts`, params)
    .then(response => {
      if (response.code === 200) {
        return response.data
      }
      return Promise.reject(new Error(response.message || '获取分类文章列表失败'))
    })
}

/**
 * 获取标签下的文章
 * @param {number} tagId - 标签ID
 * @param {Object} params - 查询参数
 * @param {number} [params.page=1] - 页码
 * @param {number} [params.pageSize=10] - 每页数量
 * @returns {Promise<{total: number, items: Array}>}
 */
export function getTagPosts(tagId, params) {
  return request.get(`/blog/tags/${tagId}/posts`, params)
    .then(response => {
      if (response.code === 200) {
        return response.data
      }
      return Promise.reject(new Error(response.message || '获取标签文章列表失败'))
    })
}

/**
 * 获取博客统计信息
 * @returns {Promise<Object>}
 */
export function getBlogStats() {
  return request.get('/blog/stats')
    .then(response => {
      if (response.code === 200) {
        return response.data
      }
      return Promise.reject(new Error(response.message || '获取博客统计信息失败'))
    })
}

/**
 * 获取关于我的信息
 * @returns {Promise<Object>}
 */
export function getAboutInfo() {
  return request.get('/api/about')
    .then(response => {
      if (response.code === 200) {
        return response.data
      }
      return Promise.reject(new Error(response.message || '获取关于我的信息失败'))
    })
}

/**
 * 增加文章浏览量
 * @param {number} id - 文章ID
 * @returns {Promise<void>}
 */
export function increasePostView(id) {
  return request.post(`/blog/posts/${id}/view`)
    .then(response => {
      if (response.code === 200) {
        return response.data
      }
      return Promise.reject(new Error(response.message || '增加浏览量失败'))
    })
} 