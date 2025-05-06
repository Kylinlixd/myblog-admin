import request from '../utils/request'
import api from '../utils/api'

/**
 * 获取标签列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页条数
 * @returns {Promise<Array>}
 */
export function getTagList(params) {
  return api.admin.get('/api/tags/', params)
    .then(response => {
      // 检查不同的响应格式
      if (response && response.data) {
        // 处理标准响应格式
        return {
          count: response.data.count || 0,
          results: response.data.results || []
        };
      } else if (response && response.results) {
        // 处理直接返回数据的格式
        return {
          count: response.count || response.results.length,
          results: response.results
        };
      } else if (Array.isArray(response)) {
        // 处理返回数组的情况
        return {
          count: response.length,
          results: response
        };
      } else {
        console.error('获取标签列表响应格式异常:', response);
        return {
          count: 0,
          results: []
        };
      }
    })
    .catch(error => {
      console.error('获取标签列表失败:', error);
      return Promise.reject(new Error('获取标签列表失败'));
    });
}

/**
 * 创建标签
 * @param {Object} data - 标签数据
 * @param {string} data.name - 标签名称
 * @returns {Promise<{id: number}>}
 */
export function createTag(data) {
  return api.admin.post('/api/tags/', data)
    .then(response => {
      if (response && (response.code === 200 || response.data)) {
        return response.data || response;
      }
      return Promise.reject(new Error(response?.message || '创建标签失败'));
    });
}

/**
 * 更新标签
 * @param {number} id - 标签ID
 * @param {Object} data - 标签数据
 * @param {string} data.name - 标签名称
 * @returns {Promise<void>}
 */
export function updateTag(id, data) {
  return api.admin.put(`/api/tags/${id}/`, data)
    .then(response => {
      if (response && (response.code === 200 || response.data)) {
        return response.data || response;
      }
      return Promise.reject(new Error(response?.message || '更新标签失败'));
    });
}

/**
 * 删除标签
 * @param {number} id - 标签ID
 * @returns {Promise<void>}
 */
export function deleteTag(id) {
  return api.admin.delete(`/api/tags/${id}/`)
    .then(response => {
      if (response && (response.code === 200 || response.status === 204 || response.data)) {
        return response.data || response;
      }
      return Promise.reject(new Error(response?.message || '删除标签失败'));
    });
}