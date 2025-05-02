import { defineStore } from 'pinia'
import { login, register, getUserInfo, logout, changePassword, updateUserProfile } from '../api/auth'


export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: null,
    token: localStorage.getItem('token') || '',
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
        
        // 从正确的位置提取 token 和 userInfo
        // 响应格式应该是 { code: 200, data: { token, userInfo }, message: 'xxx' }
        const { token, userInfo } = response.data || {}
        
        if (!token || !userInfo) {
          console.error('登录失败: 响应中没有token或userInfo', response)
          return false
        }
        
        // 设置用户信息和token
        this.token = token
        this.userInfo = userInfo
        localStorage.setItem('token', token)
        this.initialized = true
        
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
        const { token, userInfo } = response.data || {}
        
        if (!token || !userInfo) {
          console.error('注册失败: 响应中没有token或userInfo', response)
          return false
        }
        
        // 注册成功后自动登录
        this.token = token
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
      this.userInfo = null
      localStorage.removeItem('token')
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