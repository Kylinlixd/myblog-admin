import api from '../utils/api'

/**
 * 上传文件
 * @param {Object} params - 上传参数
 * @param {File} params.file - 文件对象
 * @param {string} params.file_type - 文件类型
 * @param {string} [params.dynamic_id] - 动态ID
 * @param {string} [params.category_id] - 分类ID
 * @param {string[]} [params.tag_ids] - 标签ID数组
 * @param {string} [params.description] - 文件描述
 * @param {boolean} [params.is_public] - 是否公开
 * @returns {Promise<Object>} 上传结果
 */
export const uploadFile = async (params) => {
  try {
    const formData = new FormData()
    formData.append('file', params.file)
    formData.append('file_type', params.file_type)
    
    if (params.dynamic_id) formData.append('dynamic_id', params.dynamic_id)
    if (params.category_id) formData.append('category_id', params.category_id)
    if (params.tag_ids) formData.append('tag_ids', JSON.stringify(params.tag_ids))
    if (params.description) formData.append('description', params.description)
    if (params.is_public !== undefined) formData.append('is_public', params.is_public)
    
    const response = await api.admin.post('/api/upload/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    return response
  } catch (error) {
    console.error('上传文件失败:', error)
    throw error
  }
}

/**
 * 获取文件列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 * @returns {Promise<Object>} 文件列表数据
 */
export const getFileList = async (params) => {
  try {
    console.log('获取文件列表参数:', params)
    const response = await api.admin.get('/api/upload/files/', {
      params: {
        page: params.page || 1,
        pageSize: params.pageSize || 10
      }
    })
    
    console.log('获取文件列表响应:', response)
    
    if (!response) {
      console.error('获取文件列表失败: 响应为空')
      return {
        code: 500,
        data: {
          items: [],
          total: 0
        },
        message: '获取文件列表失败: 响应为空'
      }
    }

    // 处理响应数据
    let items = []
    let total = 0

    if (response.results) {
      items = response.results
      total = response.count || items.length
    } else if (Array.isArray(response)) {
      items = response
      total = response.length
    } else if (response.data) {
      if (Array.isArray(response.data)) {
        items = response.data
        total = response.data.length
      } else if (response.data.items) {
        items = response.data.items
        total = response.data.total || items.length
      } else {
        items = [response.data]
        total = 1
      }
    }

    // 处理文件URL，添加前缀
    items = items.map(item => ({
      ...item,
      file_url: item.file_url ? `http://localhost:8000${item.file_url}` : item.file_url,
      url: item.url ? `http://localhost:8000${item.url}` : item.url
    }))

    return {
      code: 200,
      data: {
        items,
        total
      },
      message: 'success'
    }
  } catch (error) {
    console.error('获取文件列表失败:', error)
    return {
      code: 500,
      data: {
        items: [],
        total: 0
      },
      message: error.message || '获取文件列表失败'
    }
  }
}

/**
 * 搜索文件
 * @param {Object} params - 搜索参数
 * @param {string} [params.q] - 搜索关键词
 * @param {string} [params.type] - 文件类型
 * @param {string} [params.category] - 分类ID
 * @param {string[]} [params.tags] - 标签ID数组
 * @param {number} [params.page] - 页码
 * @param {number} [params.pageSize] - 每页数量
 * @returns {Promise<Object>} 搜索结果
 */
export const searchFiles = async (params) => {
  try {
    const response = await api.admin.get('/api/upload/files/search/', {
      params: {
        q: params.q,
        type: params.type,
        category: params.category,
        tags: params.tags ? JSON.stringify(params.tags) : undefined,
        page: params.page || 1,
        pageSize: params.pageSize || 10
      }
    })
    
    return response
  } catch (error) {
    console.error('搜索文件失败:', error)
    throw error
  }
}

/**
 * 下载文件
 * @param {string} fileId - 文件ID
 * @returns {Promise<Blob>} 文件流
 */
export const downloadFile = async (fileId) => {
  try {
    const response = await api.admin.post(`/api/upload/files/${fileId}/download/`, null, {
      responseType: 'blob'
    })
    
    return response
  } catch (error) {
    console.error('下载文件失败:', error)
    throw error
  }
}

/**
 * 删除文件
 * @param {string} fileId - 文件ID
 * @returns {Promise<Object>} 删除结果
 */
export const deleteFile = async (fileId) => {
  try {
    const response = await api.admin.delete(`/api/upload/files/${fileId}/`)
    return response
  } catch (error) {
    console.error('删除文件失败:', error)
    throw error
  }
}

/**
 * 获取文件详情
 * @param {string} id - 文件ID
 * @returns {Promise<Object>} 文件详情数据
 */
export const getFileDetail = async (id) => {
  try {
    const response = await api.admin.get(`/api/files/${id}/`)
    return {
      code: 200,
      data: response,
      message: 'success'
    }
  } catch (error) {
    console.error('获取文件详情失败:', error)
    throw error
  }
} 