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
        // 清除可能存在的旧令牌
        this.clearUserData();
        
        // 发送登录请求
        const response = await login({ username, password });
        console.log('登录原始响应:', response);
        
        // 从响应中提取数据 (考虑不同的响应结构)
        const responseData = response.data || response;
        console.log('响应数据结构:', typeof responseData, Object.keys(responseData).join(','));
        
        // 直接获取令牌字符串，而不是对象引用
        let extractedToken = null;
        let refreshToken = null;
        
        // 处理令牌对象格式
        if (responseData.token && typeof responseData.token === 'object') {
          console.log('处理令牌对象格式');
          
          if (responseData.token.access) {
            extractedToken = String(responseData.token.access);
            console.log('提取令牌字符串:', extractedToken.substring(0, 10) + '...');
          } else if (responseData.token.access_token) {
            extractedToken = String(responseData.token.access_token);
            console.log('提取access_token字符串:', extractedToken.substring(0, 10) + '...');
          }
          
          if (responseData.token.refresh) {
            refreshToken = String(responseData.token.refresh);
            console.log('提取刷新令牌字符串:', refreshToken.substring(0, 10) + '...');
          } else if (responseData.token.refresh_token) {
            refreshToken = String(responseData.token.refresh_token);
            console.log('提取refresh_token字符串:', refreshToken.substring(0, 10) + '...');
          }
        }
        // 处理直接令牌字段
        else if (responseData.access) {
          extractedToken = String(responseData.access);
          console.log('提取access字段:', extractedToken.substring(0, 10) + '...');
          
          if (responseData.refresh) {
            refreshToken = String(responseData.refresh);
            console.log('提取refresh字段:', refreshToken.substring(0, 10) + '...');
          }
        } else if (responseData.token && typeof responseData.token === 'string') {
          extractedToken = String(responseData.token);
          console.log('提取token字符串字段:', extractedToken.substring(0, 10) + '...');
          
          if (responseData.refresh_token) {
            refreshToken = String(responseData.refresh_token);
            console.log('提取refresh_token字段:', refreshToken.substring(0, 10) + '...');
          }
        }
        
        // 检查是否成功提取令牌
        if (!extractedToken) {
          console.error('无法从响应中提取访问令牌，登录失败');
          return false;
        }
        
        // 格式化令牌并保存
        const formattedToken = extractedToken.startsWith('Bearer ') 
          ? extractedToken 
          : `Bearer ${extractedToken}`;
        
        // 保存令牌到本地存储和状态
        localStorage.setItem('token', formattedToken);
        this.token = formattedToken;
        console.log('保存到localStorage的token:', formattedToken.substring(0, 20) + '...');
        
        // 保存刷新令牌
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
          this.refreshToken = refreshToken;
          console.log('保存刷新令牌:', refreshToken.substring(0, 10) + '...');
        }
        
        // 提取用户信息
        const userInfo = responseData.user || responseData.userInfo || {};
        
        // 保存用户信息 - 确保没有循环引用
        if (Object.keys(userInfo).length > 0) {
          this.userInfo = userInfo;
          try {
            const userInfoCleaned = JSON.parse(JSON.stringify(userInfo));
            localStorage.setItem('userInfo', JSON.stringify(userInfoCleaned));
            console.log('保存用户信息成功');
          } catch (e) {
            console.error('保存用户信息失败:', e);
          }
        }
        
        this.initialized = true;
        
        // 验证令牌是否保存成功
        const savedToken = localStorage.getItem('token');
        console.log('最终保存的令牌:', savedToken ? savedToken.substring(0, 20) + '...' : '无');
        
        // 如果没有用户信息，尝试获取
        if (Object.keys(userInfo).length === 0) {
          try {
            console.log('尝试获取额外的用户信息');
            await this.getUserInfo();
          } catch (error) {
            console.warn('获取额外用户信息失败:', error.message);
          }
        }
        
        return true;
      } catch (error) {
        console.error('登录过程发生错误:', error);
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
            localStorage.setItem('token', token)
            this.token = token
            console.log('[user store] 保存访问令牌:', token.substring(0, 20) + '...')
            
            if (refreshToken) {
              refreshToken = String(refreshToken)
              localStorage.setItem('refreshToken', refreshToken)
              this.refreshToken = refreshToken
              console.log('[user store] 保存刷新令牌:', refreshToken.substring(0, 10) + '...')
            }
            
            // 处理用户信息
            const userInfo = responseData.userInfo || responseData.user || {}
            if (userInfo && Object.keys(userInfo).length > 0) {
              localStorage.setItem('userInfo', JSON.stringify(userInfo))
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
        this.token = token
        localStorage.setItem('token', token)
        
        if (refreshTokenStr) {
          localStorage.setItem('refreshToken', refreshTokenStr)
          this.refreshToken = refreshTokenStr
        }
        
        this.userInfo = userInfo
        // 保存用户信息
        if (userInfo && Object.keys(userInfo).length > 0) {
          localStorage.setItem('userInfo', JSON.stringify(userInfo))
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