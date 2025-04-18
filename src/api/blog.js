import request from '../utils/request'


/**
 * 获取分类列表
 * @returns {Promise<Object>} 分类列表数据
 */
export function getCategoryList() {
  return request({
    url: '/categories',
    method: 'get'
  })
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

/**
 * 获取博客动态列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 * @param {string} params.type - 动态类型
 * @returns {Promise<Object>} 动态列表数据
 */
export const getBlogDynamics = async (params) => {
  try {
    const response = await request.get('/blog/dynamics', { params });
    return response;
  } catch (error) {
    console.error('获取博客动态列表失败:', error);
    throw error;
  }
}

/**
 * 获取博客动态详情
 * @param {string} id - 动态ID
 * @returns {Promise<Object>} 动态详情数据
 */
export const getBlogDynamicDetail = async (id) => {
  try {
    const response = await request.get(`/blog/dynamics/${id}`);
    return response;
  } catch (error) {
    console.error('获取博客动态详情失败:', error);
    throw error;
  }
}

/**
 * 获取博客统计信息
 * @returns {Promise<Object>} 博客统计数据
 */
export const getBlogStats = async () => {
  try {
    const response = await request.get('/blog/stats');
    return response;
  } catch (error) {
    console.error('获取博客统计信息失败:', error);
    throw error;
  }
}