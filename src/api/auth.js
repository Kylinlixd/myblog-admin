import api from '../utils/api'

/**
 * 判断是否在开发环境
 * @returns {boolean}
 */
const isDevelopment = () => {
  return process.env.NODE_ENV === 'development'
}

/**
 * 检查是否应该使用模拟数据
 * @returns {boolean}
 */
const shouldUseMockData = () => {
  const useMockData = localStorage.getItem('useMockData') === 'true'
  return isDevelopment() || useMockData
}

/**
 * 生成测试token
 * @returns {string}
 */
const generateTestToken = () => {
  return 'dev-token-' + Date.now()
}

/**
 * 模拟用户信息
 * @param {string} username - 用户名
 * @param {string} role - 角色
 * @returns {Object} - 模拟用户信息
 */
const getMockUserInfo = (username = 'admin', role = 'admin') => {
  const nicknames = {
    'admin': '管理员',
    'editor': '编辑',
    'user': '普通用户',
    'test': '测试用户'
  }

  return {
    id: role === 'admin' ? 1 : 2,
    username,
    nickname: nicknames[username] || nicknames[role] || username,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
    email: `${username}@example.com`,
    role,
    permissions: role === 'admin' ? ['*'] : ['read']
  }
}

/**
 * 用户登录
 * @param {Object} data - 登录参数
 * @param {string} data.username - 用户名
 * @param {string} data.password - 密码
 * @returns {Promise<{token: string, userInfo: Object}>}
 */
export function login(data) {
  // 开发环境下，模拟登录响应
  if (shouldUseMockData()) {
    console.log('[开发环境] 使用模拟登录数据')
    
    // admin/admin 或 test/test 均可登录成功
    if ((data.username === 'admin' && data.password === 'admin') || 
        (data.username === 'test' && data.password === 'test')) {
      
      const role = data.username === 'admin' ? 'admin' : 'user'
      const userInfo = getMockUserInfo(data.username, role)
      const token = generateTestToken()
      
      // 保存到localStorage以模拟会话
      localStorage.setItem('token', token)
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
      
      return Promise.resolve({
        code: 200,
        data: {
          token,
          userInfo
        },
        message: '登录成功'
      })
    } else {
      // 模拟登录失败
      return Promise.reject({
        response: {
          status: 400,
          data: {
            code: 400,
            message: '用户名或密码错误',
            data: null
          }
        }
      })
    }
  }
  
  // 使用 API 工具类发送登录请求
  return api.admin.post('/api/auth/login/', data)
    .catch(error => {
      // 如果API请求失败，检查是否应该回退到模拟数据
      if (isDevelopment() && error.message && error.message.includes('网络错误')) {
        console.warn('[API错误] 登录请求失败，回退到模拟数据模式')
        // 自动开启模拟数据模式
        localStorage.setItem('useMockData', 'true')
        // 重新调用自身，这次会使用模拟数据
        return login(data)
      }
      
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
  // 开发环境下，模拟注册
  if (shouldUseMockData()) {
    console.log('[开发环境] 使用模拟注册数据')
    
    const userInfo = {
      id: 100,
      username: data.username,
      nickname: data.nickname || data.username,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username}`,
      role: 'user',
      permissions: ['read']
    }
    
    const token = generateTestToken()
    
    return Promise.resolve({
      code: 200,
      data: {
        token,
        userInfo
      },
      message: '注册成功'
    })
  }
  
  return api.admin.post('/api/auth/register', data)
    .catch(error => {
      // 如果API请求失败，检查是否应该回退到模拟数据
      if (isDevelopment() && error.message && error.message.includes('网络错误')) {
        console.warn('[API错误] 注册请求失败，回退到模拟数据模式')
        // 自动开启模拟数据模式
        localStorage.setItem('useMockData', 'true')
        // 重新调用自身，这次会使用模拟数据
        return register(data)
      }
      
      throw error
    })
}

/**
 * 获取用户信息
 * @returns {Promise<Object>} - 用户信息
 */
export function getUserInfo() {
  // 开发环境下，使用本地存储的用户信息
  if (shouldUseMockData()) {
    console.log('[开发环境] 使用本地存储的用户信息')
    
    // 从localStorage获取用户信息
    const userInfoStr = localStorage.getItem('userInfo')
    if (userInfoStr) {
      try {
        const userInfo = JSON.parse(userInfoStr)
        return Promise.resolve({
          code: 200,
          data: userInfo,
          message: 'success'
        })
      } catch (error) {
        console.error('解析本地用户信息失败:', error)
      }
    }
    
    // 如果没有存储用户信息，但有token，则返回默认管理员信息
    if (localStorage.getItem('token')) {
      const userInfo = getMockUserInfo()
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
      
      return Promise.resolve({
        code: 200,
        data: userInfo,
        message: 'success'
      })
    }
    
    // 无token，返回错误
    return Promise.reject({
      response: {
        status: 401,
        data: {
          code: 401,
          message: '未登录或会话已过期',
          data: null
        }
      }
    })
  }
  
  return api.admin.get('/api/auth/info/')
    .catch(error => {
      // 如果API请求失败，检查是否应该回退到模拟数据
      if (isDevelopment() && error.message && error.message.includes('网络错误')) {
        console.warn('[API错误] 获取用户信息失败，回退到模拟数据模式')
        // 自动开启模拟数据模式
        localStorage.setItem('useMockData', 'true')
        // 重新调用自身，这次会使用模拟数据
        return getUserInfo()
      }
      
      throw error
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
  // 开发环境下，模拟密码修改
  if (shouldUseMockData()) {
    console.log('[开发环境] 模拟密码修改')
    
    // 简单验证
    if (!data.oldPassword || !data.newPassword) {
      return Promise.reject({
        response: {
          status: 400,
          data: {
            code: 400,
            message: '请填写完整的密码信息',
            data: null
          }
        }
      })
    }
    
    // 模拟成功
    return Promise.resolve({
      code: 200,
      message: '密码修改成功',
      data: null
    })
  }
  
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
  // 开发环境下，模拟更新资料
  if (shouldUseMockData()) {
    console.log('[开发环境] 模拟更新用户资料')
    
    // 从localStorage获取用户信息
    const userInfoStr = localStorage.getItem('userInfo')
    let userInfo = {}
    
    if (userInfoStr) {
      try {
        userInfo = JSON.parse(userInfoStr)
      } catch (error) {
        console.error('解析本地用户信息失败:', error)
      }
    }
    
    // 更新资料
    const updatedUserInfo = {
      ...userInfo,
      ...data
    }
    
    // 保存回localStorage
    localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo))
    
    return Promise.resolve({
      code: 200,
      data: updatedUserInfo,
      message: '资料更新成功'
    })
  }
  
  return api.admin.put('/api/auth/profile/', data)
}

/**
 * 刷新token
 * @returns {Promise<{token: string}>}
 */
export function refreshToken() {
  // 开发环境下，模拟刷新token
  if (shouldUseMockData()) {
    console.log('[开发环境] 模拟刷新token')
    
    const token = generateTestToken()
    localStorage.setItem('token', token)
    
    return Promise.resolve({
      code: 200,
      data: { token },
      message: 'token刷新成功'
    })
  }
  
  return api.admin.post('/api/token/refresh/')
}

/**
 * 退出登录
 * @returns {Promise<void>}
 */
export function logout() {
  // 确保立即移除token和用户信息
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
  
  // 如果是模拟数据模式，直接返回成功
  if (shouldUseMockData()) {
    console.log('[开发环境] 模拟退出登录')
    
    return Promise.resolve({
      code: 200,
      message: '退出成功',
      data: null
    })
  }
  
  // 仍然尝试调用API，但不关心结果
  return api.admin.post('/api/auth/logout/')
    .catch(error => {
      // 即使API调用失败也算成功
      console.warn('退出登录API调用失败，但本地会话已清除', error)
      return {
        code: 200,
        message: '退出成功',
        data: null
      }
    })
}

/**
 * 切换模拟数据模式
 * @param {boolean} enabled - 是否启用模拟数据
 */
export function toggleMockDataMode(enabled) {
  localStorage.setItem('useMockData', enabled ? 'true' : 'false')
  console.log(`[开发模式] ${enabled ? '启用' : '禁用'}模拟数据模式`)
  
  // 如果禁用模拟数据且没有真实登录，清空登录状态
  if (!enabled && isDevelopment()) {
    const token = localStorage.getItem('token')
    // 如果token是开发环境生成的，则清除
    if (token && token.startsWith('dev-token-')) {
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
    }
  }
  
  return Promise.resolve({
    code: 200,
    message: `模拟数据模式已${enabled ? '启用' : '禁用'}`,
    data: { enabled }
  })
} 