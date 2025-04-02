import request from '../utils/request'

/**
 * 获取标签列表
 * @returns {Promise<Array>}
 */
export function getTagList() {
  return request.get('/tags')
    .then(response => {
      if (response.code === 200) {
        return response.data
      }
      return Promise.reject(new Error(response.message || '获取标签列表失败'))
    })
}

/**
 * 创建标签
 * @param {Object} data - 标签数据
 * @param {string} data.name - 标签名称
 * @returns {Promise<{id: number}>}
 */
export function createTag(data) {
  return request.post('/tags', data)
    .then(response => {
      if (response.code === 200) {
        return response.data
      }
      return Promise.reject(new Error(response.message || '创建标签失败'))
    })
}

/**
 * 更新标签
 * @param {number} id - 标签ID
 * @param {Object} data - 标签数据
 * @param {string} data.name - 标签名称
 * @returns {Promise<void>}
 */
export function updateTag(id, data) {
  return request.put(`/tags/${id}`, data)
    .then(response => {
      if (response.code === 200) {
        return response.data
      }
      return Promise.reject(new Error(response.message || '更新标签失败'))
    })
}

/**
 * 删除标签
 * @param {number} id - 标签ID
 * @returns {Promise<void>}
 */
export function deleteTag(id) {
  return request.delete(`/tags/${id}`)
    .then(response => {
      if (response.code === 200) {
        return response.data
      }
      return Promise.reject(new Error(response.message || '删除标签失败'))
    })
} 