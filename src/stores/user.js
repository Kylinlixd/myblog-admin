import { defineStore } from 'pinia'

import {
  changePassword as changePasswordRequest,
  getUserInfo as getUserInfoRequest,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  updateUserProfile
} from '@/api/auth'
import {
  clearSession,
  getAccessToken,
  getRefreshToken
} from '@/services/http/tokenStorage'

const USER_KEY = 'blog.user'

function readUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY))
  } catch {
    return null
  }
}

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: readUser(),
    accessToken: getAccessToken(),
    refreshToken: getRefreshToken(),
    initialized: false
  }),

  getters: {
    token: (state) => state.accessToken,
    isLoggedIn: (state) => Boolean(state.accessToken),
    username: (state) => state.userInfo?.username,
    avatar: (state) => state.userInfo?.avatar,
    nickname: (state) => state.userInfo?.nickname || state.userInfo?.username
  },

  actions: {
    syncSession() {
      this.accessToken = getAccessToken()
      this.refreshToken = getRefreshToken()
    },

    async initialize() {
      if (this.initialized) return this.userInfo
      this.syncSession()
      if (this.accessToken && !window.location.pathname.startsWith('/blog')) {
        try {
          await this.getUserInfo()
        } catch {
          this.clearUserData()
        }
      }
      this.initialized = true
      return this.userInfo
    },

    async login(username, password) {
      this.clearUserData()
      try {
        await loginRequest({ username, password })
        this.syncSession()
        await this.getUserInfo()
        this.initialized = true
        return true
      } catch {
        this.clearUserData()
        return false
      }
    },

    async register(userData) {
      try {
        await registerRequest(userData)
        this.syncSession()
        await this.getUserInfo()
        this.initialized = true
        return true
      } catch {
        this.clearUserData()
        return false
      }
    },

    async getUserInfo() {
      const response = await getUserInfoRequest()
      this.userInfo = response?.data || response
      localStorage.setItem(USER_KEY, JSON.stringify(this.userInfo))
      return this.userInfo
    },

    async logout() {
      try {
        await logoutRequest()
      } finally {
        this.clearUserData()
      }
    },

    clearUserData() {
      clearSession()
      localStorage.removeItem(USER_KEY)
      this.userInfo = null
      this.accessToken = ''
      this.refreshToken = ''
      this.initialized = false
    },

    async changePassword(oldPassword, newPassword) {
      await changePasswordRequest({ oldPassword, newPassword })
      return true
    },

    async updateProfile(profileData) {
      const response = await updateUserProfile(profileData)
      const updated = response?.data || response
      this.userInfo = { ...this.userInfo, ...updated }
      localStorage.setItem(USER_KEY, JSON.stringify(this.userInfo))
      return this.userInfo
    }
  }
})
