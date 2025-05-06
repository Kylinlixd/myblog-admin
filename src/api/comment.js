import request from '../utils/request'

/**
 * 获取评论列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 * @param {string} [params.author] - 评论者
 * @param {string} [params.status] - 评论状态
 * @returns {Promise<{list: Array, total: number}>}
 */
export function getCommentList(params) {
  // 检查令牌状态
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('[评论API] 获取评论列表失败: 未找到访问令牌');
    return Promise.reject(new Error('登录已过期，请重新登录'));
  }
  
  console.log('[评论API] 开始获取评论列表，当前令牌状态:', token ? '有效' : '无效');
  
  // 检查模拟数据模式
  const useMockData = localStorage.getItem('useMockData') === 'true';
  if (useMockData) {
    console.log('[评论API] 使用模拟数据返回评论列表');
    // 生成模拟数据
    const mockData = {
      list: Array(10).fill().map((_, i) => ({
        id: i + 1,
        author: `测试用户${i+1}`,
        content: `这是一条测试评论内容 ${i+1}`,
        email: `user${i+1}@example.com`,
        status: ['pending', 'approved', 'rejected'][Math.floor(Math.random() * 3)],
        createTime: new Date().toISOString().split('T')[0]
      })),
      total: 100
    };
    
    // 模拟延迟
    return new Promise(resolve => {
      setTimeout(() => {
        console.log('[评论API] 返回模拟评论数据');
        resolve(mockData);
      }, 300);
    });
  }
  
  return request.get('/api/comments/', params)
    .then(response => {
      if (response.code === 200) {
        console.log('[评论API] 获取评论列表成功');
        return response.data
      }
      console.error('[评论API] 获取评论列表异常:', response.message);
      return Promise.reject(new Error(response.message || '获取评论列表失败'))
    })
    .catch(error => {
      console.error('[评论API] 获取评论列表错误:', error);
      // 检查是否是认证错误
      if (error.message && error.message.includes('登录已过期')) {
        console.warn('[评论API] 认证失败，请重新登录');
      }
      return Promise.reject(error);
    });
}

/**
 * 通过评论
 * @param {number} id - 评论ID
 * @returns {Promise<void>}
 */
export function approveComment(id) {
  return request.put(`/api/comments/${id}/approve/`)
    .then(response => {
      if (response.code === 200) {
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
  return request.put(`/api/comments/${id}/reject/`)
    .then(response => {
      if (response.code === 200) {
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
  return request.delete(`/api/comments/${id}/`)
    .then(response => {
      if (response.code === 200) {
        return response.data
      }
      return Promise.reject(new Error(response.message || '删除失败'))
    })
} 