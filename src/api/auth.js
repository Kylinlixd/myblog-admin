import api from '../utils/api'

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
    return Promise.resolve({
      code: 200,
      data: {
        token: 'dev-token-' + Date.now(),
        userInfo: {
          id: 1,
          username: 'admin',
          nickname: '管理员',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
          role: 'admin',
          permissions: ['*']
        }
      },
      message: '登录成功'
    })
  }
  
  // 使用 API 工具类发送登录请求
  return api.admin.post('/api/auth/login/', data)
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
  return api.admin.post('/api/auth/register', data)
}

/**
 * 获取用户信息
 * @returns {Promise<Object>} - 用户信息
 */
export function getUserInfo() {
  return api.admin.get('/api/auth/info/')
}

/**
 * 修改密码
 * @param {Object} data - 密码数据
 * @param {string} data.oldPassword - 旧密码
 * @param {string} data.newPassword - 新密码
 * @returns {Promise<void>}
 */
export function changePassword(data) {
  return api.admin.put('/api/auth/password/', data)
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
  return api.admin.put('/api/auth/profile/', data)
}

/**
 * 刷新token
 * @returns {Promise<{token: string}>}
 */
export function refreshToken() {
  return api.admin.post('/api/token/refresh/')
}

/**
 * 退出登录
 * @returns {Promise<void>}
 */
export function logout() {
  // 确保立即移除token
  localStorage.removeItem('token')
  
  // 返回成功
  return Promise.resolve({
    code: 200,
    message: 'success',
    data: null
  })
} 