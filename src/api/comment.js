import request from '../utils/request'
import api from '../utils/api'

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
  
  return api.admin.get('/api/comments/', params)
    .then(response => {
      console.log('[评论API] 获取评论列表响应:', response);
      
      // 对响应进行更灵活的处理
      if (response) {
        // 检查是否有标准的code/data/message格式
        if (response.code === 200 && response.data) {
          console.log('[评论API] 标准格式响应，获取评论列表成功');
          return response.data;
        }
        
        // 检查直接返回数据的情况
        if (response.list !== undefined) {
          console.log('[评论API] 直接返回列表数据，获取评论列表成功');
          return response;
        }
        
        // 检查results字段
        if (response.results !== undefined) {
          console.log('[评论API] 包含results字段的响应');
          return {
            list: response.results,
            total: response.count || response.results.length
          };
        }
        
        // 尝试从其他格式中解析
        if (Array.isArray(response)) {
          console.log('[评论API] 响应为数组，转换为标准格式');
          return {
            list: response,
            total: response.length
          };
        }
        
        console.error('[评论API] 无法解析的响应格式:', response);
        return Promise.reject(new Error('获取评论列表失败: 响应格式异常'));
      }
      
      console.error('[评论API] 获取评论列表异常: 响应为空');
      return Promise.reject(new Error('获取评论列表失败: 响应为空'));
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
  return api.admin.put(`/api/comments/${id}/approve/`)
    .then(response => {
      console.log('[评论API] 通过评论响应:', response);
      // 处理不同的响应格式
      if (response && (response.code === 200 || response.status === 'success')) {
        return response.data || response;
      }
      return Promise.reject(new Error(response?.message || '操作失败'));
    })
    .catch(error => {
      console.error('[评论API] 通过评论失败:', error);
      return Promise.reject(error);
    });
}

/**
 * 拒绝评论
 * @param {number} id - 评论ID
 * @returns {Promise<void>}
 */
export function rejectComment(id) {
  return api.admin.put(`/api/comments/${id}/reject/`)
    .then(response => {
      console.log('[评论API] 拒绝评论响应:', response);
      // 处理不同的响应格式
      if (response && (response.code === 200 || response.status === 'success')) {
        return response.data || response;
      }
      return Promise.reject(new Error(response?.message || '操作失败'));
    })
    .catch(error => {
      console.error('[评论API] 拒绝评论失败:', error);
      return Promise.reject(error);
    });
}

/**
 * 删除评论
 * @param {number} id - 评论ID
 * @returns {Promise<void>}
 */
export function deleteComment(id) {
  return api.admin.delete(`/api/comments/${id}/`)
    .then(response => {
      console.log('[评论API] 删除评论响应:', response);
      // 处理不同的响应格式
      if (response && (response.code === 200 || response.status === 'success' || response.status === 204)) {
        return response.data || response;
      }
      return Promise.reject(new Error(response?.message || '删除失败'));
    })
    .catch(error => {
      console.error('[评论API] 删除评论失败:', error);
      return Promise.reject(error);
    });
} 