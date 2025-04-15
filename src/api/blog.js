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
export function getRecentPosts() {
  return request({
    url: '/posts/recent',
    method: 'get'
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
 * 获取关于我的信息
 * @returns {Promise<Object>}
 */
export function getAboutInfo() {
  return request.get('/about')
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

export function getCategoryList() {
  return request({
    url: '/categories',
    method: 'get'
  })
}

/**
 * 获取动态列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 * @param {string} params.type - 动态类型
 * @param {string} params.status - 状态
 * @returns {Promise<Object>} 动态列表数据
 */
export const getDynamicList = async (params) => {
  try {
    const response = await request.get('/blog/dynamics', { params })
    if (response.code === 200) {
      return response.data
    }
    throw new Error(response.message || '获取动态列表失败')
  } catch (error) {
    console.error('获取动态列表失败:', error)
    throw error
  }
}

/**
 * 获取动态详情
 * @param {string} id - 动态ID
 * @returns {Promise<Object>} 动态详情数据
 */
export const getDynamicDetail = async (id) => {
  try {
    const response = await request.get(`/blog/dynamics/${id}`)
    if (response.code === 200) {
      return response.data
    }
    throw new Error(response.message || '获取动态详情失败')
  } catch (error) {
    console.error('获取动态详情失败:', error)
    throw error
  }
}

/**
 * 创建动态
 * @param {Object} data - 动态数据
 * @returns {Promise<Object>} 创建结果
 */
export const createDynamic = async (data) => {
  try {
    const response = await request.post('/blog/dynamics', data)
    if (response.code === 200) {
      return response.data
    }
    throw new Error(response.message || '创建动态失败')
  } catch (error) {
    console.error('创建动态失败:', error)
    throw error
  }
}

/**
 * 更新动态
 * @param {string} id - 动态ID
 * @param {Object} data - 动态数据
 * @returns {Promise<Object>} 更新结果
 */
export const updateDynamic = async (id, data) => {
  try {
    const response = await request.put(`/blog/dynamics/${id}`, data)
    if (response.code === 200) {
      return response.data
    }
    throw new Error(response.message || '更新动态失败')
  } catch (error) {
    console.error('更新动态失败:', error)
    throw error
  }
}

/**
 * 删除动态
 * @param {string} id - 动态ID
 * @returns {Promise<Object>} 删除结果
 */
export const deleteDynamic = async (id) => {
  try {
    const response = await request.delete(`/blog/dynamics/${id}`)
    if (response.code === 200) {
      return response.data
    }
    throw new Error(response.message || '删除动态失败')
  } catch (error) {
    console.error('删除动态失败:', error)
    throw error
  }
}

/**
 * 点赞动态
 * @param {string} id - 动态ID
 * @returns {Promise<Object>} 点赞结果
 */
export const likeDynamic = async (id) => {
  try {
    const response = await request.post(`/blog/dynamics/${id}/like`)
    if (response.code === 200) {
      return response.data
    }
    throw new Error(response.message || '点赞失败')
  } catch (error) {
    console.error('点赞失败:', error)
    throw error
  }
}

/**
 * 评论动态
 * @param {string} id - 动态ID
 * @param {Object} data - 评论数据
 * @returns {Promise<Object>} 评论结果
 */
export const commentDynamic = async (id, data) => {
  try {
    const response = await request.post(`/blog/dynamics/${id}/comment`, data)
    if (response.code === 200) {
      return response.data
    }
    throw new Error(response.message || '评论失败')
  } catch (error) {
    console.error('评论失败:', error)
    throw error
  }
}

/**
 * 获取动态评论列表
 * @param {string} id - 动态ID
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>} 评论列表数据
 */
export const getDynamicComments = async (id, params) => {
  try {
    const response = await request.get(`/blog/dynamics/${id}/comments`, { params })
    if (response.code === 200) {
      return response.data
    }
    throw new Error(response.message || '获取评论列表失败')
  } catch (error) {
    console.error('获取评论列表失败:', error)
    throw error
  }
}

/**
 * 删除动态评论
 * @param {string} id - 动态ID
 * @param {string} commentId - 评论ID
 * @returns {Promise<Object>} 删除结果
 */
export const deleteDynamicComment = async (id, commentId) => {
  try {
    const response = await request.delete(`/blog/dynamics/${id}/comments/${commentId}`)
    if (response.code === 200) {
      return response.data
    }
    throw new Error(response.message || '删除评论失败')
  } catch (error) {
    console.error('删除评论失败:', error)
    throw error
  }
} 