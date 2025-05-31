import { defineStore } from 'pinia'
import { login, register, getUserInfo, logout, changePassword, updateUserProfile } from '../api/auth'
import router from '../router'
import { safeStorage } from '../utils/security'


export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: null,
    accessToken: safeStorage.get('token', ''),
    refreshToken: safeStorage.get('refreshToken', ''),
    initialized: false
  }),
  
  getters: {
    isLoggedIn: (state) => !!state.accessToken,
    username: (state) => state.userInfo?.username,
    avatar: (state) => state.userInfo?.avatar,
    nickname: (state) => state.userInfo?.nickname || state.userInfo?.username
  },
  
  actions: {
    async initialize() {
      if (this.initialized) {
        return
      }
      
      // 检查是否在博客前台
      const isBlogPage = window.location.pathname.startsWith('/blog')
      if (isBlogPage) {
        console.log('博客前台页面，跳过用户信息初始化')
        this.initialized = true
        return null
      }
      
      if (this.accessToken) {
        try {
          await this.getUserInfo()
        } catch (error) {
          console.error('初始化用户信息失败:', error)
          this.clearUserData()
          // 重定向到登录页面
          router.push('/login')
        }
      }
      
      this.initialized = true
      return this.userInfo
    },
    
    async login(username, password) {
      try {
        // 清除可能存在的旧令牌
        this.clearUserData();
        
        // 发送登录请求
        const response = await login({ username, password });
        console.log('登录响应:', response);
        
        // 从响应中提取数据
        const responseData = response.data || response;
        
        // 检查响应格式
        if (!responseData) {
          console.error('登录响应为空');
          return false;
        }
        
        // 直接获取 access 和 refresh token
        const { access, refresh } = responseData;
        
        if (!access) {
          console.error('登录响应中缺少访问令牌');
          return false;
        }
        
        // 格式化并保存访问令牌
        const formattedToken = access.startsWith('Bearer ') ? access : `Bearer ${access}`;
        safeStorage.set('token', formattedToken);
        this.accessToken = formattedToken;
        
        // 保存刷新令牌
        if (refresh) {
          safeStorage.set('refreshToken', refresh);
          this.refreshToken = refresh;
        }
        
        // 获取用户信息
        try {
          await this.getUserInfo();
        } catch (error) {
          console.warn('获取用户信息失败:', error);
        }
        
        this.initialized = true;
        return true;
      } catch (error) {
        console.error('登录失败:', error);
        this.clearUserData();
        return false;
      }
    },
    
    async register(userData) {
      try {
        const response = await register(userData)
        console.log('注册响应:', response)
        
        // 从响应中提取数据
        const responseData = response.data || response
        console.log('处理注册数据:', JSON.stringify(responseData))
        
        // 首先检查是否有完整的令牌对象
        if (responseData.token && typeof responseData.token === 'object') {
          console.log('[user store] 检测到令牌是对象格式', responseData.token)
          const tokenObject = responseData.token
          
          // 从对象中提取访问令牌和刷新令牌
          let accessToken = tokenObject.access || tokenObject.access_token || ''
          let refreshToken = tokenObject.refresh || tokenObject.refresh_token || ''
          
          // 记录值和类型
          console.log('[user store] 从对象中提取的访问令牌:', 
            typeof accessToken, accessToken ? accessToken.substring(0, 20) + '...' : '无')
          console.log('[user store] 从对象中提取的刷新令牌:', 
            typeof refreshToken, refreshToken ? refreshToken.substring(0, 20) + '...' : '无')
          
          if (accessToken) {
            // 确保令牌是字符串
            accessToken = String(accessToken)
            // 添加Bearer前缀
            const token = accessToken.startsWith('Bearer ') ? accessToken : `Bearer ${accessToken}`
            
            // 保存令牌
            safeStorage.set('token', token)
            this.accessToken = token
            console.log('[user store] 保存访问令牌:', token.substring(0, 20) + '...')
            
            if (refreshToken) {
              refreshToken = String(refreshToken)
              safeStorage.set('refreshToken', refreshToken)
              this.refreshToken = refreshToken
              console.log('[user store] 保存刷新令牌:', refreshToken.substring(0, 10) + '...')
            }
            
            // 处理用户信息
            const userInfo = responseData.userInfo || responseData.user || {}
            if (userInfo && Object.keys(userInfo).length > 0) {
              safeStorage.set('userInfo', JSON.stringify(userInfo))
              this.userInfo = userInfo
              console.log('[user store] 保存用户信息')
            }
            
            this.initialized = true
            return true
          }
        }
        
        // 传统格式处理 - 分别提取token和refresh
        const accessToken = responseData.token || responseData.access || responseData.access_token || ''
        const refreshToken = responseData.refresh || responseData.refresh_token || ''
        
        // 确保令牌是字符串类型
        const accessTokenStr = typeof accessToken === 'string' ? accessToken : String(accessToken || '')
        const refreshTokenStr = typeof refreshToken === 'string' ? refreshToken : String(refreshToken || '')
        
        // 确保令牌格式正确，添加Bearer前缀
        const token = accessTokenStr && !accessTokenStr.startsWith('Bearer ') ? 
          `Bearer ${accessTokenStr}` : accessTokenStr
        
        if (!token) {
          console.error('注册失败: 响应中没有有效的访问令牌', responseData)
          return false
        }
        
        // 获取用户信息
        const userInfo = responseData.userInfo || responseData.user || {}
        
        // 注册成功后自动登录
        this.accessToken = token
        safeStorage.set('token', token)
        
        if (refreshTokenStr) {
          safeStorage.set('refreshToken', refreshTokenStr)
          this.refreshToken = refreshTokenStr
        }
        
        this.userInfo = userInfo
        // 保存用户信息
        if (userInfo && Object.keys(userInfo).length > 0) {
          safeStorage.set('userInfo', JSON.stringify(userInfo))
        }
        
        this.initialized = true
        return true
      } catch (error) {
        console.error('注册失败:', error)
        return false
      }
    },
    
    async getUserInfo() {
      try {
        const response = await getUserInfo();
        const userInfo = response.data || response;
        
        if (userInfo) {
          this.userInfo = userInfo;
          safeStorage.set('userInfo', userInfo);
        }
        
        return userInfo;
      } catch (error) {
        console.error('获取用户信息失败:', error);
        throw error;
      }
    },
    
    async logout() {
      try {
        await logout();
      } catch (error) {
        console.error('登出请求失败:', error);
      } finally {
        this.clearUserData();
        router.push('/login');
      }
    },
    
    clearUserData() {
      this.userInfo = null;
      this.accessToken = '';
      this.refreshToken = '';
      this.initialized = false;
      
      // 清除本地存储
      safeStorage.remove('token');
      safeStorage.remove('refreshToken');
      safeStorage.remove('userInfo');
    },
    
    async changePassword(oldPassword, newPassword) {
      try {
        await changePassword({ oldPassword, newPassword })
        return true
      } catch (error) {
        console.error('修改密码失败:', error)
        throw error
      }
    },
    
    async updateProfile(profileData) {
      try {
        // 调用更新用户资料API
        const response = await updateUserProfile(profileData)
        
        // 更新本地存储的用户信息
        this.userInfo = {
          ...this.userInfo,
          ...profileData
        }
        
        return true
      } catch (error) {
        console.error('更新用户资料失败:', error)
        throw error
      }
    }
  }
}) 