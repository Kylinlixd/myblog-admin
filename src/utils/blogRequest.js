import axios from 'axios'
import { message } from 'ant-design-vue'
import router from '../router'
import { useAppStore } from '../stores/app'

// 创建专用于博客前台的 axios 实例，baseURL 为空或 /blog
const service = axios.create({
  // 明确指定baseURL，覆盖全局环境变量设置
  baseURL: '', // 设置为空字符串，由API调用处提供完整路径
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
  console.log(`[BlogRequest] 增加请求计数: ${pendingRequests.count}`)
  
  // 设置全局超时
  if (pendingRequests.count === 1) {
    // 第一个请求开始时设置超时
    pendingRequests.timeoutId = setTimeout(() => {
      if (pendingRequests.count > 0) {
        console.log('[BlogRequest] 全局请求超时')
        message.error('请求超时，请检查网络连接')
        const appStore = useAppStore()
        appStore.setLoadingError('请求超时，请检查网络连接')
      }
    }, 20000) // 20秒全局超时
  }
}

// 减少请求计数
const decreasePendingCount = () => {
  pendingRequests.count = Math.max(0, pendingRequests.count - 1)
  console.log(`[BlogRequest] 减少请求计数: ${pendingRequests.count}`)
  
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
const blogRequest = {
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
    
    // 确保baseURL不会被环境变量覆盖
    if (config.baseURL === undefined || config.baseURL === null) {
      config.baseURL = '';
    }
    
    // 添加调试日志
    console.log(`[BlogRequest] 发送请求:`, {
      方法: config.method.toUpperCase(),
      baseURL: config.baseURL,
      url: config.url,
      完整URL: (config.baseURL || '') + config.url,
      参数: config.params || {}
    });
    
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
        // 博客前台不需要处理401，只显示错误信息
        message.error('请登录后执行此操作')
      } else if (status === 403) {
        message.error('您没有权限进行此操作')
      } else if (status === 404) {
        message.error('请求的资源不存在')
      } else if (status >= 500) {
        message.error('服务器错误，请稍后重试')
      } else {
        message.error(error.response.data?.message || '请求失败')
      }
    } else if (error.request) {
      message.error('无法连接到服务器，请检查网络连接')
    } else {
      message.error('请求发送失败')
    }
    
    return Promise.reject(error)
  }
)

export default blogRequest 