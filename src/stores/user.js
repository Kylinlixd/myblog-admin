import { defineStore } from 'pinia'
import { login, register, getUserInfo, logout, changePassword, updateUserProfile } from '../api/auth'
import router from '../router'


export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: null,
    token: localStorage.getItem('token') || '',
    refreshToken: localStorage.getItem('refreshToken') || '',
    initialized: false
  }),
  
  getters: {
    isLoggedIn: (state) => !!state.token,
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
      
      if (this.token) {
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
        const response = await login({ username, password })
        console.log('登录响应:', response)
        
        // 检查响应结构
        if (response.code !== 200) {
          console.error('登录失败: 响应状态码不是200', response)
          return false
        }
        
        // 从正确的位置提取数据
        // 响应格式可能是 { code: 200, data: { token, userInfo }, message: 'xxx' }
        // 或者 { code: 200, data: { access, refresh, userInfo }, message: 'xxx' }
        const responseData = response.data || {}
        
        // 处理不同的令牌格式
        let token = responseData.token || responseData.access || ''
        let refreshToken = responseData.refresh_token || responseData.refresh || ''
        
        // 确保令牌格式正确，添加Bearer前缀
        if (token && !token.startsWith('Bearer ')) {
          token = `Bearer ${token}`
        }
        
        // 检查是否有令牌
        if (!token) {
          console.error('登录失败: 响应中没有有效的访问令牌', responseData)
          return false
        }
        
        // 获取用户信息
        const userInfo = responseData.userInfo || responseData.user || {}
        
        if (Object.keys(userInfo).length === 0) {
          console.warn('警告: 登录响应中没有用户信息，将尝试获取')
        }
        
        // 设置状态
        this.token = token
        if (refreshToken) {
          this.refreshToken = refreshToken
          localStorage.setItem('refreshToken', refreshToken)
        }
        
        this.userInfo = userInfo
        localStorage.setItem('token', token)
        this.initialized = true
        
        // 如果没有用户信息，尝试获取
        if (Object.keys(userInfo).length === 0) {
          try {
            await this.getUserInfo()
          } catch (error) {
            console.error('登录后获取用户信息失败:', error)
            // 这里不需要清除用户数据，因为令牌可能有效
          }
        }
        
        return true
      } catch (error) {
        console.error('登录失败:', error)
        this.clearUserData()
        return false
      }
    },
    
    async register(userData) {
      try {
        const response = await register(userData)
        
        // 从正确的位置提取 token 和 userInfo
        const responseData = response.data || {}
        
        // 处理不同的令牌格式
        let token = responseData.token || responseData.access || ''
        let refreshToken = responseData.refresh_token || responseData.refresh || ''
        
        // 确保令牌格式正确，添加Bearer前缀
        if (token && !token.startsWith('Bearer ')) {
          token = `Bearer ${token}`
        }
        
        if (!token) {
          console.error('注册失败: 响应中没有有效的访问令牌', responseData)
          return false
        }
        
        // 获取用户信息
        const userInfo = responseData.userInfo || responseData.user || {}
        
        // 注册成功后自动登录
        this.token = token
        if (refreshToken) {
          this.refreshToken = refreshToken
          localStorage.setItem('refreshToken', refreshToken)
        }
        
        this.userInfo = userInfo
        localStorage.setItem('token', token)
        
        return true
      } catch (error) {
        console.error('注册失败:', error)
        return false
      }
    },
    
    async getUserInfo() {
      try {
        if (!this.token) {
          return null
        }
        
        const response = await getUserInfo()
        
        // 从正确的位置提取 userInfo
        const userInfo = response.data || response
        
        if (!userInfo) {
          console.error('获取用户信息失败: 响应中没有用户信息', response)
          return null
        }
        
        this.userInfo = userInfo
        return userInfo
      } catch (error) {
        console.error('获取用户信息失败:', error)
        this.clearUserData()
        return null
      }
    },
    
    async logout() {
      try {
        // 尝试调用退出API
        await logout()
      } catch (error) {
        console.error('退出登录失败:', error)
      } finally {
        // 清除状态，无论API调用是否成功
        this.clearUserData()
        this.initialized = false
      }
    },
    
    clearUserData() {
      this.token = ''
      this.refreshToken = ''
      this.userInfo = null
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('userInfo')
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