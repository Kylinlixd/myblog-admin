import request from '../utils/request';

/**
 * 获取动态列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.limit - 每页数量
 * @param {string} params.type - 动态类型
 * @param {string} params.status - 状态
 * @returns {Promise<Object>} 动态列表数据
 */
export const getDynamicList = async (params) => {
  try {
    console.log('获取动态列表参数:', params);
    
    // 获取token
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    console.log('认证头:', headers);
    
    // 确保使用的是完整路径 - 修改为后台API的直接路径（不要加/api前缀，因为request.js已经有了）
    const response = await request.get('/dynamics', { 
      params,
      headers
    });
    
    console.log('动态列表API响应:', response);
    
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
    
    // 获取token
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    const response = await request.put(`/dynamics/${id}`, data, { headers });
    return { 
      code: 200, 
      data: response, 
      message: 'success'
    };
  } catch (error) {
    console.error('更新动态失败:', error);
    throw error;
  }
}

/**
 * 删除动态
 * @param {string} id - 动态ID
 * @returns {Promise<Object>} 删除结果
 */
export const deleteDynamic = async (id) => {
  try {
    // 获取token
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    const response = await request.delete(`/dynamics/${id}`, { headers });
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
    // 获取token
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    const response = await request.get(`/dynamics/${id}`, { headers });
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
    
    // 获取token
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    const response = await request.post('/dynamics', data, { headers });
    return { 
      code: 200, 
      data: response, 
      message: 'success'
    };
  } catch (error) {
    console.error('创建动态失败:', error);
    throw error;
  }
}