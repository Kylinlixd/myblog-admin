import request from '../utils/request';
import api from '../utils/api';

/**
 * 获取动态列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 * @param {string} params.type - 动态类型 (text/image/audio/video)
 * @param {string} params.status - 状态 (draft/published)
 * @param {string} params.content - 内容搜索
 * @param {string} params.categoryId - 分类ID
 * @param {Array} params.tagIds - 标签ID数组
 * @returns {Promise<Object>} 动态列表数据
 */
export const getDynamicList = async (params) => {
  try {
    const apiUrl = '/api/dynamics/';
    
    // 转换参数名称，确保与后端一致
    const apiParams = {
      page: params.page || 1,
      pageSize: params.pageSize || 10,
      type: params.type,
      status: params.status,
      content: params.content,
      categoryId: params.categoryId,
      tagIds: params.tagIds
    };
    
    // 移除空值参数
    Object.keys(apiParams).forEach(key => {
      if (apiParams[key] === undefined || apiParams[key] === null || apiParams[key] === '') {
        delete apiParams[key];
      }
    });
    
    // 处理标签ID数组
    if (apiParams.tagIds && Array.isArray(apiParams.tagIds) && apiParams.tagIds.length > 0) {
      apiParams.tagIds = apiParams.tagIds.join(',');
    } else {
      delete apiParams.tagIds;
    }
    
    // 添加排序参数
    apiParams.sort = 'createdAt:desc';  // 默认按创建时间降序
    
    // 使用API工具类发送请求
    const response = await api.admin.get(apiUrl, apiParams);
    
    // 处理不同的响应格式
    let items = [];
    let total = 0;
    
    if (response && response.code === 200 && response.data) {
      // 标准格式: {code: 200, data: {items: [], total: 0}}
      if (response.data.items !== undefined) {
        items = Array.isArray(response.data.items) ? response.data.items : [];
        total = response.data.total || items.length;
      } else if (Array.isArray(response.data)) {
        // 直接返回数组
        items = response.data;
        total = items.length;
      } else {
        // 其他可能的格式
        const possibleItems = response.data.list || response.data.data || response.data.records || [];
        items = Array.isArray(possibleItems) ? possibleItems : [];
        total = response.data.total || response.data.totalCount || response.data.count || items.length;
      }
    } else if (Array.isArray(response)) {
      // 直接返回数组
      items = response;
      total = response.length;
    } else if (response && response.items) {
      // {items: [], total: 0} 格式
      items = Array.isArray(response.items) ? response.items : [];
      total = response.total || items.length;
    }
    
    // 确保每个项目都有必要的字段，并处理媒体文件信息
    items = items.map(item => {
      // 处理媒体文件信息
      let mediaUrls = [];
      if (item.mediaUrls && Array.isArray(item.mediaUrls)) {
        mediaUrls = item.mediaUrls.map(media => {
          if (typeof media === 'string') {
            // 如果是字符串，转换为对象格式
            return {
              id: media.split('/').pop(), // 从URL中提取ID
              name: media.split('/').pop(), // 从URL中提取文件名
              file_type: item.type,
              file_url: `http://localhost:8000${media}`,
              url: `http://localhost:8000${media}` // 兼容性字段
            };
          }
          return {
            ...media,
            file_url: media.file_url ? `http://localhost:8000${media.file_url}` : media.file_url,
            url: media.url ? `http://localhost:8000${media.url}` : media.url // 确保有url字段
          };
        });
      }
      
      return {
        ...item,  // 保留所有原始字段
        mediaUrls, // 使用处理后的媒体文件信息
        category: item.category || null,  // 确保保留 category 字段
        tags: Array.isArray(item.tags) ? item.tags : []
      };
    });
    
    // 构造标准响应
    return { 
      code: 200, 
      data: {
        items,
        total
      }, 
      message: 'success'
    };
  } catch (error) {
    console.error('获取动态列表失败:', error);
    throw error;
  }
}

/**
 * 更新动态
 * @param {string} id - 动态ID
 * @param {Object} data - 要更新的动态数据
 * @returns {Promise<Object>} 更新结果
 */
export const updateDynamic = async (id, data) => {
  try {
    // 数据格式化，确保数据完整性
    const formattedData = {
      type: data.type || 'text',
      content: data.content || '',
      status: data.status || 'draft',
      mediaUrls: Array.isArray(data.mediaUrls) ? data.mediaUrls : [],
      // 添加分类和标签
      categoryId: data.categoryId || null,
      tags: Array.isArray(data.tags) ? data.tags : []
    };
    
    // 根据类型进行数据验证
    if (formattedData.type !== 'text' && (!formattedData.mediaUrls || formattedData.mediaUrls.length === 0)) {
      throw new Error(`${formattedData.type}类型的动态必须包含媒体文件`);
    }
    
    // 使用API工具类发送请求
    const response = await api.admin.put(`/api/dynamics/${id}/`, formattedData);
    return { 
      code: 200, 
      data: response, 
      message: 'success'
    };
  } catch (error) {
    console.error('更新动态失败:', error);
    // 添加更详细的错误信息
    return {
      code: error.response?.status || 500,
      message: error.message || '更新动态失败',
      error: error.response?.data || error.message
    };
  }
}

/**
 * 删除动态
 * @param {string} id - 动态ID
 * @returns {Promise<Object>} 删除结果
 */
export const deleteDynamic = async (id) => {
  try {
    // 使用API工具类发送请求
    const response = await api.admin.delete(`/api/dynamics/${id}/`);
    return { 
      code: 200, 
      data: response, 
      message: 'success'
    };
  } catch (error) {
    console.error('删除动态失败:', error);
    throw error;
  }
}

/**
 * 获取动态详情
 * @param {string} id - 动态ID
 * @returns {Promise<Object>} 动态详情数据
 */
export const getDynamicDetail = async (id) => {
  try {
    // 使用API工具类发送请求
    const response = await api.admin.get(`/api/dynamics/${id}/`);
    return { 
      code: 200, 
      data: response, 
      message: 'success'
    };
  } catch (error) {
    console.error('获取动态详情失败:', error);
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
    // 数据格式化，确保数据完整性
    const formattedData = {
      type: data.type || 'text',
      content: data.content || '',
      status: data.status || 'draft',
      mediaUrls: Array.isArray(data.mediaUrls) ? data.mediaUrls : [],
      // 添加分类和标签
      categoryId: data.categoryId || null,
      tags: Array.isArray(data.tags) ? data.tags : [],
      // 添加其他必要字段
      author: data.author || undefined,
      createdAt: data.createdAt || new Date().toISOString()
    };
    
    // 根据类型进行数据验证
    if (formattedData.type === 'image' && (!formattedData.mediaUrls || formattedData.mediaUrls.length === 0)) {
      throw new Error('图片类型的动态必须包含至少一张图片');
    }
    
    if (formattedData.type === 'audio' && (!formattedData.mediaUrls || formattedData.mediaUrls.length === 0)) {
      throw new Error('音频类型的动态必须包含至少一个音频文件');
    }
    
    if (formattedData.type === 'video' && (!formattedData.mediaUrls || formattedData.mediaUrls.length === 0)) {
      throw new Error('视频类型的动态必须包含至少一个视频文件');
    }
    
    // 使用API工具类发送请求
    const response = await api.admin.post('/api/dynamics/', formattedData);
    return { 
      code: 200, 
      data: response, 
      message: 'success'
    };
  } catch (error) {
    console.error('创建动态失败:', error);
    // 添加更详细的错误信息
    return {
      code: error.response?.status || 500,
      message: error.message || '创建动态失败，请检查数据完整性',
      error: error.response?.data || error.message
    };
  }
}