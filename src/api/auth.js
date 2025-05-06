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
  // 强制确保localStorage中的值是正确的布尔字符串
  const currentSetting = localStorage.getItem('useMockData')
  const useMock = currentSetting === 'true'
  
  // 如果设置有问题，重置为false
  if (currentSetting !== 'true' && currentSetting !== 'false') {
    console.warn('[模拟数据] 检测到不正确的模拟数据设置，已重置为使用真实API')
    localStorage.setItem('useMockData', 'false')
    return false
  }
  
  if (process.env.NODE_ENV === 'development') {
    // 记录当前模式用于调试
    if (useMock) {
      console.log('[模拟数据] 已启用模拟数据模式')
    } else {
      console.log('[模拟数据] 使用真实API模式')
      
      // 检查令牌状态并给出提示，但不修改用户设置
      const hasValidToken = localStorage.getItem('token') != null
      if (!hasValidToken) {
        console.warn('[认证] 未检测到有效令牌，使用真实API可能会遇到认证问题')
      }
    }
    
    return useMock
  }
  
  // 生产环境始终使用真实数据
  return false
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
    console.log('[模拟数据] 使用模拟登录数据')
    
    // admin/admin 或 test/test 均可登录成功
    if ((data.username === 'admin' && data.password === 'admin') || 
        (data.username === 'test' && data.password === 'test')) {
      
      const role = data.username === 'admin' ? 'admin' : 'user'
      const userInfo = getMockUserInfo(data.username, role)
      const token = `Bearer ${generateTestToken()}`
      
      // 保存到localStorage以模拟会话
      localStorage.setItem('token', token)
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
      
      console.log('[模拟数据] 生成了模拟令牌:', token);
      
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
    .then(response => {
      if (response?.data) {
        const userData = response.data;
        
        // 保存令牌，确保使用访问令牌而非刷新令牌
        if (userData.access) {
          const token = `Bearer ${userData.access}`;
          localStorage.setItem('token', token);
          console.log('[登录] 成功保存访问令牌:', token.substring(0, 15) + '...');
        } else if (userData.token) {
          const token = userData.token.startsWith('Bearer ') ? userData.token : `Bearer ${userData.token}`;
          localStorage.setItem('token', token);
          console.log('[登录] 成功保存令牌:', token.substring(0, 15) + '...');
        }
        
        // 保存刷新令牌（如果存在）
        if (userData.refresh) {
          localStorage.setItem('refreshToken', userData.refresh);
          console.log('[登录] 成功保存刷新令牌');
        } else if (userData.refresh_token) {
          localStorage.setItem('refreshToken', userData.refresh_token);
          console.log('[登录] 成功保存刷新令牌');
        }
        
        // 保存用户信息
        if (userData.userInfo) {
          localStorage.setItem('userInfo', JSON.stringify(userData.userInfo));
        }
        
        console.log('[登录] 成功登录，已保存用户凭据');
        
        // 检查令牌是否正确保存
        const savedToken = localStorage.getItem('token');
        if (!savedToken) {
          console.error('[登录] 警告：令牌未能正确保存到localStorage！');
        } else {
          console.log('[登录] 确认令牌已保存到localStorage:', savedToken.substring(0, 15) + '...');
        }
      }
      return response;
    })
    .catch(error => {
      // 不自动回退到模拟数据，直接抛出错误
      console.error('[API错误] 登录请求失败:', error)
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
    console.log('[模拟数据] 使用模拟注册数据')
    
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
      // 不自动回退到模拟数据，直接抛出错误
      console.error('[API错误] 注册请求失败:', error)
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
    console.log('[模拟数据] 使用本地存储的用户信息')
    
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
      // 不自动回退到模拟数据，直接抛出错误
      console.error('[API错误] 获取用户信息失败:', error)
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
    console.log('[模拟数据] 模拟密码修改')
    
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
    console.log('[模拟数据] 模拟更新用户资料')
    
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
    console.log('[模拟数据] 模拟刷新token')
    
    const token = generateTestToken()
    localStorage.setItem('token', token)
    
    return Promise.resolve({
      code: 200,
      data: { token },
      message: 'token刷新成功'
    })
  }
  
  // 获取刷新令牌
  const refreshTokenValue = localStorage.getItem('refreshToken')
  if (!refreshTokenValue) {
    console.error('[认证] 无刷新令牌，无法刷新')
    return Promise.reject(new Error('无刷新令牌'))
  }
  
  return api.admin.post('/api/token/refresh/', { refresh: refreshTokenValue })
    .then(response => {
      if (response.data && response.data.access) {
        // 更新访问令牌
        localStorage.setItem('token', `Bearer ${response.data.access}`)
        console.log('[认证] 令牌刷新成功')
        
        return {
          code: 200,
          data: { token: response.data.access },
          message: 'token刷新成功'
        }
      } else {
        throw new Error('令牌刷新响应格式异常')
      }
    })
    .catch(error => {
      console.error('[认证] 刷新令牌失败:', error)
      // 清除令牌
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      
      throw error
    })
}

/**
 * 退出登录
 * @returns {Promise<void>}
 */
export function logout() {
  // 确保立即移除token和用户信息
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('userInfo')
  
  // 如果是模拟数据模式，直接返回成功
  if (shouldUseMockData()) {
    console.log('[模拟数据] 模拟退出登录')
    
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
  // 保存模式设置
  localStorage.setItem('useMockData', enabled ? 'true' : 'false')
  console.log(`[数据模式] ${enabled ? '启用' : '禁用'}模拟数据模式`)
  
  // 处理模拟数据的登录状态
  if (!enabled) {
    // 如果禁用模拟数据，清除所有模拟登录状态
    const token = localStorage.getItem('token')
    // 如果token是开发环境生成的，则清除
    if (token && token.startsWith('dev-token-')) {
      console.log('[数据模式] 清除模拟登录状态')
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('userInfo')
    }
  }
  
  return Promise.resolve({
    code: 200,
    message: `模拟数据模式已${enabled ? '启用' : '禁用'}`,
    data: { enabled }
  })
} 