import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'
import { useAppStore } from '../stores/app'

// 创建 axios 实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '', // 使用环境变量中的API前缀，默认为空
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

// 请求方法封装
const request = {
  get(url, params, config = {}) {
    return service.get(url, { params, ...config })
  },
  
  post(url, data, config = {}) {
    return service.post(url, data, config)
  },
  
  put(url, data, config = {}) {
    return service.put(url, data, config)
  },
  
  delete(url, config = {}) {
    return service.delete(url, config)
  }
}

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 统计请求次数
    increasePendingCount()
    
    // 获取token并添加到请求头
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 添加调试日志
    console.log(`[Request] ${config.method.toUpperCase()} ${config.baseURL}${config.url}`, config.params || {});
    
    return config
  },
  error => {
    decreasePendingCount()
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    decreasePendingCount()
    return response.data
  },
  error => {
    decreasePendingCount()
    
    // 处理错误
    if (error.response) {
      const status = error.response.status
      
      if (status === 401) {
        // 未授权，可能是token过期或无效
        // 如果是访问博客前台，不需要登录，就不要强制跳转到登录页面
        const isVisitingBlog = window.location.pathname.startsWith('/blog')
        if (!isVisitingBlog) {
          ElMessage.error('登录已过期，请重新登录')
          // 清除token
          localStorage.removeItem('token')
          // 跳转到登录页
          router.push('/login')
        }
      } else if (status === 403) {
        ElMessage.error('您没有权限进行此操作')
      } else if (status === 404) {
        ElMessage.error('请求的资源不存在')
      } else if (status >= 500) {
        ElMessage.error('服务器错误，请稍后重试')
      } else {
        ElMessage.error(error.response.data?.message || '请求失败')
      }
    } else if (error.request) {
      ElMessage.error('无法连接到服务器，请检查网络连接')
    } else {
      ElMessage.error('请求发送失败')
    }
    
    return Promise.reject(error)
  }
)

export default request