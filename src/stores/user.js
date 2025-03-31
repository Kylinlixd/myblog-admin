import { defineStore } from 'pinia'
import request from '../utils/request'

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
        const { token, userInfo } = await request.post('/auth/login', {
          username,
          password
        })
        
        this.token = token
        this.userInfo = userInfo
        localStorage.setItem('token', token)
        
        return true
      } catch (error) {
        return false
      }
    },
    
    async getUserInfo() {
      try {
        const userInfo = await request.get('/auth/info')
        this.userInfo = userInfo
        return userInfo
      } catch (error) {
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
        await request.put('/auth/password', {
          oldPassword,
          newPassword
        })
        return true
      } catch (error) {
        return false
      }
    }
  }
}) 