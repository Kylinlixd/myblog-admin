import request from '../utils/request'
import api from '../utils/api'

/**
 * 获取分类列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页条数
 * @returns {Promise<Array>}
 */
export function getCategoryList(params) {
  return api.admin.get('/api/categories/', params)
    .then(response => {
      console.log('分类列表原始响应:', response);
      
      // 检查不同的响应格式
      if (response && response.data) {
        // 处理标准响应格式
        const data = response.data;
        // 如果 data 是数组，直接使用
        if (Array.isArray(data)) {
          return {
            count: data.length,
            results: data
          };
        }
        // 如果 data 包含 results，使用它
        if (data.results) {
          return {
            count: data.count || data.results.length,
            results: data.results
          };
        }
        // 其他情况，将 data 作为单个结果
        return {
          count: 1,
          results: [data]
        };
      } else if (response && response.results) {
        // 处理直接返回results的格式
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
        console.error('获取分类列表响应格式异常:', response);
        return {
          count: 0,
          results: []
        };
      }
    })
    .catch(error => {
      console.error('获取分类列表失败:', error);
      return Promise.reject(new Error('获取分类列表失败'));
    });
}

/**
 * 创建分类
 * @param {Object} data - 分类数据
 * @param {string} data.name - 分类名称
 * @param {string} data.description - 分类描述
 * @returns {Promise<{id: number}>}
 */
export function createCategory(data) {
  return api.admin.post('/api/categories/', data)
    .then(response => {
      if (response && (response.code === 200 || response.data)) {
        return response.data || response;
      }
      return Promise.reject(new Error(response?.message || '创建分类失败'));
    });
}

/**
 * 更新分类
 * @param {number} id - 分类ID
 * @param {Object} data - 分类数据
 * @param {string} data.name - 分类名称
 * @param {string} data.description - 分类描述
 * @returns {Promise<void>}
 */
export function updateCategory(id, data) {
  return api.admin.put(`/api/categories/${id}/`, data)
    .then(response => {
      if (response && (response.code === 200 || response.data)) {
        return response.data || response;
      }
      return Promise.reject(new Error(response?.message || '更新分类失败'));
    });
}

/**
 * 删除分类
 * @param {number} id - 分类ID
 * @returns {Promise<void>}
 */
export function deleteCategory(id) {
  return api.admin.delete(`/api/categories/${id}/`)
    .then(response => {
      if (response && (response.code === 200 || response.status === 204 || response.data)) {
        return response.data || response;
      }
      return Promise.reject(new Error(response?.message || '删除分类失败'));
    });
} 