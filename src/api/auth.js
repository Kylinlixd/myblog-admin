import axios from 'axios'
import request from '../utils/request'

// 创建独立的 axios 实例用于登录
const loginInstance = axios.create({
  baseURL: process.env.NODE_ENV === 'production' ? '' : '',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

/**
 * 用户登录
 * @param {Object} data - 登录参数
 * @param {string} data.username - 用户名
 * @param {string} data.password - 密码
 * @returns {Promise<{token: string, userInfo: Object}>}
 */
export function login(data) {
  // 开发环境下，如果是admin账户可以直接登录成功
  if (process.env.NODE_ENV === 'development' && data.username === 'admin' && data.password === 'admin') {
    // console.log('开发环境使用模拟登录')
    return Promise.resolve({
      token: 'dev-token-' + Date.now(),
      userInfo: {
        id: 1,
        username: 'admin',
        nickname: '管理员',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
        role: 'admin',
        permissions: ['*']
      }
    })
  }
  
  // 使用独立的 axios 实例发送登录请求
  return loginInstance.post('/api/auth/login/', data)
    .then(response => {
      if (response.data.code === 200) {
        return response.data.data
      }
      return Promise.reject(new Error(response.data.message || '登录失败'))
    })
    .catch(error => {
      // console.error('登录失败:', error)
      throw error
    })
}

/**
 * 用户注册
 * @param {Object} data - 注册参数
 * @param {string} data.username - 用户名
 * @param {string} data.password - 密码
 * @param {string} data.nickname - 昵称
 * @returns {Promise<{token: string, userInfo: Object}>}
 */
export function register(data) {
  // 确保路径以斜杠结尾，避免重定向
  return request.post('/api/auth/register/', data)
    .then(response => {
      if (response.code === 200) {
        return response.data
      }
      return Promise.reject(new Error(response.message || '注册失败'))
    })
    .catch(error => {
      // 添加详细的错误日志
      // console.error('注册失败:', {
      //   error: error.message,
      //   status: error.response?.status,
      //   data: error.response?.data,
      //   requestData: data
      // })
      throw error
    })
}
/**
 * 获取用户信息
 * @returns {Promise<Object>} - 用户信息
 */
export function getUserInfo() {
  return request.get('/api/auth/info/')
    .then(response => {
      if (response.code === 200) {
        return response.data
      }
      return Promise.reject(new Error(response.message || '获取用户信息失败'))
    })
}

/**
 * 修改密码
 * @param {Object} data - 密码数据
 * @param {string} data.oldPassword - 旧密码
 * @param {string} data.newPassword - 新密码
 * @returns {Promise<void>}
 */
export function changePassword(data) {
  return request.put('/api/auth/password/', data)
    .then(response => {
      if (response.code === 200) {
        return response.data
      }
      return Promise.reject(new Error(response.message || '修改密码失败'))
    })
}

/**
 * 更新用户资料
 * @param {Object} data - 用户资料
 * @param {string} [data.nickname] - 昵称
 * @param {string} [data.email] - 邮箱
 * @param {string} [data.bio] - 个人简介
 * @param {string} [data.avatar] - 头像URL
 * @returns {Promise<Object>} - 更新后的用户信息
 */
export function updateUserProfile(data) {
  return request.put('/api/auth/profile/', data)
    .then(response => {
      if (response.code === 200) {
        return response.data
      }
      return Promise.reject(new Error(response.message || '更新个人资料失败'))
    })
}

/**
 * 刷新token
 * @returns {Promise<{token: string}>}
 */
export function refreshToken() {
  return request.post('/api/token/refresh/')
    .then(response => {
      if (response.code === 200) {
        return response.data
      }
      return Promise.reject(new Error(response.message || '刷新Token失败'))
    })
}

/**
 * 退出登录
 * @returns {Promise<void>}
 */
export function logout() {
  // 确保立即移除token
  localStorage.removeItem('token')
  
  // 正常情况下会有一个实际的API调用
  // 这里简化为直接返回成功
  return Promise.resolve({
    code: 200,
    message: 'success',
    data: null
  })
} 