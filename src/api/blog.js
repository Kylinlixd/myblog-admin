import request from '../utils/request'

/**
 * 获取分类列表
 * @returns {Promise<Object>} 分类列表数据
 */
export function getCategoryList() {
  try {
    return request.get('/blog/categories');
  } catch (error) {
    console.error('获取分类列表失败:', error);
    throw error;
  }
}

/**
 * 获取动态列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 * @param {string} params.keyword - 搜索关键词
 * @param {string} params.type - 动态类型
 * @returns {Promise<Object>} 动态列表数据
 */
export const getBlogDynamics = async (params) => {
  try {
    const response = await request.get('/blog/dynamics', { params });
    return response;
  } catch (error) {
    console.error('获取动态列表失败:', error);
    throw error;
  }
}

/**
 * 获取动态详情
 * @param {string} id - 动态ID
 * @returns {Promise<Object>} 动态详情数据
 */
export const getBlogDynamicDetail = async (id) => {
  try {
    const response = await request.get(`/blog/dynamics/${id}`);
    return response;
  } catch (error) {
    console.error('获取动态详情失败:', error);
    throw error;
  }
}

/**
 * 获取相邻动态
 * @param {string} id - 当前动态ID
 * @returns {Promise<Object>} 相邻动态数据
 */
export const getAdjacentDynamics = async (id) => {
  try {
    const response = await request.get(`/blog/dynamics/${id}/adjacent`);
    return response;
  } catch (error) {
    console.error('获取相邻动态失败:', error);
    throw error;
  }
}

/**
 * 获取热门动态
 * @param {Object} params - 查询参数
 * @param {number} params.limit - 获取数量
 * @returns {Promise<Object>} 热门动态数据
 */
export const getHotDynamics = async (params) => {
  try {
    const response = await request.get('/blog/dynamics/hot', { params });
    return response;
  } catch (error) {
    console.error('获取热门动态失败:', error);
    throw error;
  }
}

/**
 * 获取最新动态
 * @param {Object} params - 查询参数
 * @param {number} params.limit - 获取数量
 * @returns {Promise<Object>} 最新动态数据
 */
export const getRecentDynamics = async (params) => {
  try {
    const response = await request.get('/blog/dynamics/recent', { params });
    return response;
  } catch (error) {
    console.error('获取最新动态失败:', error);
    throw error;
  }
}

/**
 * 获取分类下的动态
 * @param {number} categoryId - 分类ID
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 * @returns {Promise<Object>} 动态列表数据
 */
export const getCategoryDynamics = async (categoryId, params) => {
  try {
    const response = await request.get(`/blog/categories/${categoryId}/dynamics`, { params });
    return response;
  } catch (error) {
    console.error('获取分类下的动态失败:', error);
    throw error;
  }
}

/**
 * 获取标签下的动态
 * @param {number} tagId - 标签ID
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 * @returns {Promise<Object>} 动态列表数据
 */
export const getTagDynamics = async (tagId, params) => {
  try {
    const response = await request.get(`/blog/tags/${tagId}/dynamics`, { params });
    return response;
  } catch (error) {
    console.error('获取标签下的动态失败:', error);
    throw error;
  }
}

/**
 * 增加动态浏览量
 * @param {string} id - 动态ID
 * @returns {Promise<Object>} 结果
 */
export const increaseDynamicView = async (id) => {
  try {
    const response = await request.post(`/blog/dynamics/${id}/view`);
    return response;
  } catch (error) {
    console.error('增加动态浏览量失败:', error);
    throw error;
  }
}

/**
 * 创建动态
 * @param {Object} data - 动态数据
 * @returns {Promise<Object>} 创建结果
 */
export const createDynamic = async (data) => {
  try {
    const response = await request.post('/blog/dynamics', data);
    return response;
  } catch (error) {
    console.error('创建动态失败:', error);
    throw error;
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

/**
 * 获取关于我的信息
 * @returns {Promise<Object>} 关于我的数据
 */
export const getAboutInfo = async () => {
  try {
    const response = await request.get('/blog/about');
    return response;
  } catch (error) {
    console.error('获取关于我的信息失败:', error);
    throw error;
  }
}

