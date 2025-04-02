import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'
import { useAppStore } from '../stores/app'

// 创建 axios 实例
const service = axios.create({
  baseURL: '/api', // 使用/api前缀，与后端接口对应
  timeout: 15000, // 15秒超时
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求计数器和请求超时控制
const pendingRequests = {
  count: 0,
  timeoutId: null
}

// 增加请求计数
const increasePendingCount = () => {
  pendingRequests.count++
  console.log(`[Request] 增加请求计数: ${pendingRequests.count}`)
  
  // 设置全局超时
  if (pendingRequests.count === 1) {
    // 第一个请求开始时设置超时
    pendingRequests.timeoutId = setTimeout(() => {
      if (pendingRequests.count > 0) {
        console.log('[Request] 全局请求超时')
        ElMessage.error('请求超时，请检查网络连接')
        const appStore = useAppStore()
        appStore.setLoadingError('请求超时，请检查网络连接')
      }
    }, 20000) // 20秒全局超时
  }
}

// 减少请求计数
const decreasePendingCount = () => {
  pendingRequests.count = Math.max(0, pendingRequests.count - 1)
  console.log(`[Request] 减少请求计数: ${pendingRequests.count}`)
  
  // 所有请求完成时清除超时
  if (pendingRequests.count === 0 && pendingRequests.timeoutId) {
    clearTimeout(pendingRequests.timeoutId)
    pendingRequests.timeoutId = null
  }
}

// 重试配置
const retryConfig = {
  retryTimes: 3,
  retryDelay: 1000
}

// 请求重试函数
const retryRequest = async (fn, times = retryConfig.retryTimes) => {
  try {
    return await fn()
  } catch (error) {
    if (times > 0 && error.response?.status >= 500) {
      await new Promise(resolve => setTimeout(resolve, retryConfig.retryDelay))
      return retryRequest(fn, times - 1)
    }
    throw error
  }
}

// 请求拦截器
service.interceptors.request.use(
  config => {
    increasePendingCount()
    
    // 从 localStorage 获取 token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => {
    decreasePendingCount()
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    decreasePendingCount()
    const res = response.data
    
    // 如果响应成功
    if (res.code === 200) {
      return res
    }
    
    // 处理业务错误
    ElMessage.error(res.message || '操作失败')
    
    // 将错误信息传递给应用状态
    const appStore = useAppStore()
    appStore.setLoadingError(res.message || '操作失败')
    
    return Promise.reject(new Error(res.message || '操作失败'))
  },
  error => {
    decreasePendingCount()
    console.error('响应错误:', error)
    
    // 超时错误特别处理
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      ElMessage.error('请求超时，请检查网络连接')
      const appStore = useAppStore()
      appStore.setLoadingError('请求超时，请检查网络连接')
      return Promise.reject(error)
    }
    
    // 处理 HTTP 错误
    if (error.response) {
      const appStore = useAppStore()
      switch (error.response.status) {
        case 401:
          // 未授权，清除 token 并跳转到登录页
          localStorage.removeItem('token')
          appStore.setLoadingError('登录已过期，请重新登录')
          router.push('/login')
          ElMessage.error('登录已过期，请重新登录')
          break
        case 403:
          appStore.setLoadingError('没有权限访问')
          ElMessage.error('没有权限访问')
          break
        case 404:
          appStore.setLoadingError('请求的资源不存在')
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          appStore.setLoadingError('服务器错误')
          ElMessage.error('服务器错误')
          break
        default:
          appStore.setLoadingError(error.response.data?.message || '请求失败')
          ElMessage.error(error.response.data?.message || '请求失败')
      }
    } else if (error.request) {
      const appStore = useAppStore()
      appStore.setLoadingError('网络错误，请检查网络连接')
      ElMessage.error('网络错误，请检查网络连接')
    } else {
      const appStore = useAppStore()
      appStore.setLoadingError('请求配置错误')
      ElMessage.error('请求配置错误')
    }
    
    return Promise.reject(error)
  }
)

// 请求方法封装
const request = {
  async get(url, params) {
    console.log(`[Request] GET ${url}`, params)
    try {
      return await service.get(url, { params })
    } catch (error) {
      console.error(`请求失败: ${url}`, error)
      throw error
    }
  },
  
  async post(url, data) {
    console.log(`[Request] POST ${url}`, data)
    try {
      return await service.post(url, data)
    } catch (error) {
      console.error(`请求失败: ${url}`, error)
      throw error
    }
  },
  
  async put(url, data) {
    console.log(`[Request] PUT ${url}`, data)
    try {
      return await service.put(url, data)
    } catch (error) {
      console.error(`请求失败: ${url}`, error)
      throw error
    }
  },
  
  async delete(url, params) {
    console.log(`[Request] DELETE ${url}`, params)
    try {
      return await service.delete(url, { params })
    } catch (error) {
      console.error(`请求失败: ${url}`, error)
      throw error
    }
  }
}

export default request