import request from '../utils/request'

/**
 * 获取分类列表
 * @returns {Promise<Array>}
 */
export function getCategoryList() {
  return request.get('/categories')
    .then(response => {
      if (response.code === 200) {
        return response.data
      }
      return Promise.reject(new Error(response.message || '获取分类列表失败'))
    })
}

/**
 * 创建分类
 * @param {Object} data - 分类数据
 * @param {string} data.name - 分类名称
 * @param {string} data.description - 分类描述
 * @returns {Promise<{id: number}>}
 */
export function createCategory(data) {
  return request.post('/categories', data)
    .then(response => {
      if (response.code === 200) {
        return response.data
      }
      return Promise.reject(new Error(response.message || '创建分类失败'))
    })
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
  return request.put(`/categories/${id}`, data)
    .then(response => {
      if (response.code === 200) {
        return response.data
      }
      return Promise.reject(new Error(response.message || '更新分类失败'))
    })
}

/**
 * 删除分类
 * @param {number} id - 分类ID
 * @returns {Promise<void>}
 */
export function deleteCategory(id) {
  return request.delete(`/categories/${id}`)
    .then(response => {
      if (response.code === 200) {
        return response.data
      }
      return Promise.reject(new Error(response.message || '删除分类失败'))
    })
} 