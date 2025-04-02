import { defineStore } from 'pinia'
import { login, register, getUserInfo, logout, changePassword, updateUserProfile } from '../api/auth'

// 模拟用户数据
const mockUser = {
  id: 1,
  username: 'admin',
  nickname: '管理员',
  avatar: 'https://placeholder.com/32'
}

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: null,
    token: localStorage.getItem('token') || ''
  }),
  
  getters: {
    isLoggedIn: (state) => !!state.token,
    username: (state) => state.userInfo?.username,
    avatar: (state) => state.userInfo?.avatar,
    nickname: (state) => state.userInfo?.nickname || state.userInfo?.username
  },
  
  actions: {
    async login(username, password) {
      try {
        const response = await login({ username, password })
        
        // 设置用户信息和token
        this.token = response.token
        this.userInfo = response.userInfo
        localStorage.setItem('token', response.token)
        
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
        
        // 注册成功后自动登录
        this.token = response.token
        this.userInfo = response.userInfo
        localStorage.setItem('token', response.token)
        
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
        
        const userInfo = await getUserInfo()
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
        await logout()
      } catch (error) {
        console.error('退出登录失败:', error)
      } finally {
        this.clearUserData()
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