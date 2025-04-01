import { defineStore } from 'pinia'
import request from '../utils/request'

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
    username: (state) => state.userInfo?.username
  },
  
  actions: {
    async login(username, password) {
      try {
        // 模拟登录验证
        if (username === 'admin' && password === '123456') {
          // 模拟token
          const token = 'mock_token_' + Date.now()
          
          // 直接设置用户信息和token
          this.token = token
          this.userInfo = mockUser
          localStorage.setItem('token', token)
          
          return true
        }
        return false
      } catch (error) {
        console.error('登录失败:', error)
        this.logout()
        return false
      }
    },
    
    async getUserInfo() {
      try {
        // 模拟获取用户信息
        this.userInfo = mockUser
        return mockUser
      } catch (error) {
        console.error('获取用户信息失败:', error)
        this.logout()
        return null
      }
    },
    
    logout() {
      this.token = ''
      this.userInfo = null
      localStorage.removeItem('token')
    },
    
    async updatePassword(oldPassword, newPassword) {
      try {
        // 模拟修改密码
        if (oldPassword === '123456') {
          return true
        }
        return false
      } catch (error) {
        return false
      }
    }
  }
}) 