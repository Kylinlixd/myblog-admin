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
  // 使用 API 工具类发送登录请求
  return api.admin.post('/api/auth/login/', data)
    .then(response => {
      console.log('[登录] 登录响应:', response);
      
      if (response?.data) {
        const userData = response.data;
        
        // 保存令牌，确保使用访问令牌而非刷新令牌
        if (userData.access) {
          const token = `Bearer ${userData.access}`;
          localStorage.setItem('token', token);
          console.log('[登录] 成功保存访问令牌:', token.substring(0, 15) + '...');
        } else if (userData.token) {
          // 确保token是字符串
          const tokenStr = String(userData.token);
          const token = tokenStr.startsWith('Bearer ') ? tokenStr : `Bearer ${tokenStr}`;
          localStorage.setItem('token', token);
          console.log('[登录] 成功保存令牌:', token.substring(0, 15) + '...');
        } else {
          console.warn('[登录] 警告: 响应中没有token或access字段');
        }
        
        // 保存刷新令牌（如果存在）
        if (userData.refresh) {
          localStorage.setItem('refreshToken', String(userData.refresh));
          console.log('[登录] 成功保存刷新令牌');
        } else if (userData.refresh_token) {
          localStorage.setItem('refreshToken', String(userData.refresh_token));
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
  console.log('[认证] 开始刷新令牌');
  
  // 开发环境下，模拟刷新token
  if (shouldUseMockData()) {
    console.log('[模拟数据] 模拟刷新token');
    
    const token = generateTestToken();
    const formattedToken = `Bearer ${token}`;
    localStorage.setItem('token', formattedToken);
    
    return Promise.resolve({
      code: 200,
      data: { token, access: token },
      message: 'token刷新成功'
    });
  }
  
  // 获取刷新令牌
  const refreshTokenValue = localStorage.getItem('refreshToken');
  if (!refreshTokenValue) {
    console.error('[认证] 无刷新令牌，无法刷新');
    return Promise.reject(new Error('无刷新令牌'));
  }
  
  console.log('[认证] 使用刷新令牌刷新访问令牌，刷新令牌长度:', refreshTokenValue.length);
  
  // 准备刷新令牌的请求体
  const refreshData = { refresh: refreshTokenValue };
  
  // 发送刷新请求
  return api.admin.post('/api/token/refresh/', refreshData)
    .then(response => {
      console.log('[认证] 收到刷新令牌响应:', response);
      
      // 提取访问令牌
      let accessToken = null;
      
      // 检查不同响应格式
      if (response.access) {
        // 直接返回格式: { access: "token值" }
        accessToken = String(response.access);
        console.log('[认证] 从response.access提取令牌');
      } else if (response.data && response.data.access) {
        // 嵌套格式: { data: { access: "token值" } }
        accessToken = String(response.data.access);
        console.log('[认证] 从response.data.access提取令牌');
      } else if (response.data && response.data.token) {
        // 嵌套token对象: { data: { token: { access: "token值" } } }
        if (typeof response.data.token === 'object' && response.data.token.access) {
          accessToken = String(response.data.token.access);
          console.log('[认证] 从response.data.token.access提取令牌');
        } else if (typeof response.data.token === 'string') {
          // token是字符串: { data: { token: "token值" } }
          accessToken = String(response.data.token);
          console.log('[认证] 从response.data.token(字符串)提取令牌');
        }
      }
      
      // 如果未能提取到令牌，返回错误
      if (!accessToken) {
        console.error('[认证] 刷新令牌响应格式异常，无法提取访问令牌:', response);
        return Promise.reject(new Error('刷新令牌响应格式异常，无法提取访问令牌'));
      }
      
      // 格式化并保存访问令牌
      const formattedToken = accessToken.startsWith('Bearer ') 
        ? accessToken 
        : `Bearer ${accessToken}`;
      
      localStorage.setItem('token', formattedToken);
      console.log('[认证] 成功保存新的访问令牌:', formattedToken.substring(0, 20) + '...');
      
      // 提取并保存新的刷新令牌（如果存在）
      if (response.data && response.data.refresh) {
        localStorage.setItem('refreshToken', String(response.data.refresh));
        console.log('[认证] 已更新刷新令牌');
      } else if (response.refresh) {
        localStorage.setItem('refreshToken', String(response.refresh));
        console.log('[认证] 已更新刷新令牌');
      }
      
      return { token: accessToken };
    })
    .catch(error => {
      console.error('[认证] 刷新令牌请求失败:', error);
      
      // 记录具体错误细节
      if (error.response) {
        console.error('[认证] 刷新令牌错误状态码:', error.response.status);
        console.error('[认证] 刷新令牌错误响应:', error.response.data);
      }
      
      // 清除令牌并返回登录页
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      
      // 删除用户信息，强制重新登录
      localStorage.removeItem('userInfo');
      
      // 返回特定的错误消息
      throw new Error('令牌已过期，请重新登录');
    });
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