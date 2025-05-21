import request from '../utils/request'
import api from '../utils/api'

/**
 * 获取评论列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 * @param {string} [params.nickname] - 评论者昵称
 * @param {string} [params.status] - 评论状态
 * @returns {Promise<{code: number, data: {list: Array, total: number}}>}
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
      
      // 确保返回标准格式
      if (response && response.code === 200 && response.data) {
        return response;
      }
      
      // 如果响应不是标准格式，转换为标准格式
      if (response && (response.list || Array.isArray(response))) {
        return {
          code: 200,
          data: {
            list: response.list || response,
            total: response.total || (Array.isArray(response) ? response.length : 0)
          }
        };
      }
      
      return Promise.reject(new Error('响应格式不正确'));
    })
    .catch(error => {
      console.error('[评论API] 获取评论列表失败:', error);
      return Promise.reject(error);
    });
}

/**
 * 通过评论
 * @param {number} id - 评论ID
 * @returns {Promise<{code: number, message: string}>}
 */
export function approveComment(id) {
  return api.admin.put(`/api/comments/${id}/approve/`)
    .then(response => {
      console.log('[评论API] 通过评论响应:', response);
      // 确保返回标准格式
      if (response && response.code === 200) {
        return response;
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
 * @returns {Promise<{code: number, message: string}>}
 */
export function rejectComment(id) {
  return api.admin.put(`/api/comments/${id}/reject/`)
    .then(response => {
      console.log('[评论API] 拒绝评论响应:', response);
      // 确保返回标准格式
      if (response && response.code === 200) {
        return response;
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
 * @returns {Promise<{code: number, message: string}>}
 */
export function deleteComment(id) {
  return api.admin.delete(`/api/comments/${id}/`)
    .then(response => {
      console.log('[评论API] 删除评论响应:', response);
      // 确保返回标准格式
      if (response && response.code === 200) {
        return response;
      }
      return Promise.reject(new Error(response?.message || '删除失败'));
    })
    .catch(error => {
      console.error('[评论API] 删除评论失败:', error);
      return Promise.reject(error);
    });
} 