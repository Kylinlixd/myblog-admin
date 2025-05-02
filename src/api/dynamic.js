import request from '../utils/request';
import api from '../utils/api';

/**
 * 获取动态列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 * @param {string} params.type - 动态类型
 * @param {string} params.status - 状态
 * @returns {Promise<Object>} 动态列表数据
 */
export const getDynamicList = async (params) => {
  try {
    const apiUrl = '/api/dynamics/';
    console.log('获取动态列表参数:', params);
    
    // 转换参数名称，确保与后端一致
    const apiParams = {
      ...params,
      // 如果后端期望的参数名是limit而不是pageSize，做转换
      limit: params.pageSize,
      // 其他可能需要的转换
    };
    
    console.log('转换后的API参数:', apiParams);
    
    // 使用API工具类发送请求
    const response = await api.admin.get(apiUrl, apiParams);
    console.log('动态列表API响应原始数据:', response);
    
    // 构造标准响应
    return { 
      code: 200, 
      data: response, 
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
    console.log(`更新动态 ID:${id}, 数据:`, data);
    
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
    console.log('创建动态数据:', data);
    
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
    
    console.log('格式化后的动态数据:', formattedData);
    
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