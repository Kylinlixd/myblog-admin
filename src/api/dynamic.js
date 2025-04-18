import request from '../utils/request';

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
    const response = await request.get('/blog/dynamics', { params });
    if (response.code === 200) {
      return response.data;
    }
    throw new Error(response.message || '获取动态列表失败');
  } catch (error) {
    console.error('获取动态列表失败:', error);
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
    const response = await request.get(`/blog/dynamics/${id}`);
    if (response.code === 200) {
      return response.data;
    }
    throw new Error(response.message || '获取动态详情失败');
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
    const response = await request.post('/blog/dynamics', data);
    if (response.code === 200) {
      return response.data;
    }
    throw new Error(response.message || '创建动态失败');
  } catch (error) {
    console.error('创建动态失败:', error);
    throw error;
  }
}