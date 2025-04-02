import request from '../utils/request'

/**
 * 用户登录
 * @param {Object} data - 登录参数
 * @param {string} data.username - 用户名
 * @param {string} data.password - 密码
 * @returns {Promise<{token: string, userInfo: Object}>}
 */
export function login(data) {
  return request.post('/auth/login', data)
    .then(response => {
      if (response.code === 200) {
        return response.data
      }
      return Promise.reject(new Error(response.message || '登录失败'))
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
  return request.post('/auth/register', data)
    .then(response => {
      if (response.code === 200) {
        return response.data
      }
      return Promise.reject(new Error(response.message || '注册失败'))
    })
}

/**
 * 获取用户信息
 * @returns {Promise<Object>} - 用户信息
 */
export function getUserInfo() {
  return request.get('/auth/info')
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
  return request.put('/auth/password', data)
    .then(response => {
      if (response.code === 200) {
        return response.data
      }
      return Promise.reject(new Error(response.message || '修改密码失败'))
    })
}

/**
 * 刷新token
 * @returns {Promise<{token: string}>}
 */
export function refreshToken() {
  return request.post('/token/refresh')
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
  localStorage.removeItem('token')
  return Promise.resolve()
} 