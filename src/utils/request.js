import axios from 'axios'
import { message } from 'ant-design-vue'
import router from '../router'
import { useAppStore } from '../stores/app'

// 区分环境配置
const isProd = process.env.NODE_ENV === 'production'
const baseURL = isProd ? '' : '';
const requestTimeout = isProd ? 10000 : 15000 // 生产环境缩短超时时间提高用户体验

// 创建 axios 实例
const service = axios.create({
  baseURL,
  timeout: requestTimeout,
  headers: {
    'Content-Type': 'application/json'
  },
  // 禁止自动重定向
  maxRedirects: 0,
  // 确保请求方法在重定向时保持不变
  validateStatus: function (status) {
    return status >= 200 && status < 300; // 只接受 2xx 状态码
  },
  // 添加以下配置
  maxContentLength: 2000,
  maxBodyLength: 2000,
  // 禁止自动重定向
  maxRedirects: 0,
  // 确保请求方法在重定向时保持不变
  validateStatus: function (status) {
    return status >= 200 && status < 300; // 只接受 2xx 状态码
  },
  // 添加请求拦截器
  transformRequest: [(data) => {
    // 确保请求体是 JSON 格式
    if (data) {
      return JSON.stringify(data);
    }
    return data;
  }]
})

// 请求计数器和请求超时控制
const pendingRequests = {
  count: 0,
  timeoutId: null
}

// 增加请求计数
const increasePendingCount = () => {
  pendingRequests.count++
  
  // 非生产环境才打印日志
  if (!isProd) {
    // console.log(`[Request] 增加请求计数: ${pendingRequests.count}`)
  }
  
  // 设置全局超时
  if (pendingRequests.count === 1) {
    // 第一个请求开始时设置超时
    pendingRequests.timeoutId = setTimeout(() => {
      if (pendingRequests.count > 0) {
        if (!isProd) {
          // console.log('[Request] 全局请求超时')
        }
        // 避免在登录页显示错误
        if (!window.location.pathname.includes('/login')) {
          message.error('请求超时，请检查网络连接')
          const appStore = useAppStore()
          appStore.setLoadingError('请求超时，请检查网络连接')
        }
      }
    }, requestTimeout + 5000) // 比单个请求超时多5秒
  }
}

// 减少请求计数
const decreasePendingCount = () => {
  pendingRequests.count = Math.max(0, pendingRequests.count - 1)
  
  // 非生产环境才打印日志
  if (!isProd) {
    // console.log(`[Request] 减少请求计数: ${pendingRequests.count}`)
  }
  
  // 所有请求完成时清除超时
  if (pendingRequests.count === 0 && pendingRequests.timeoutId) {
    clearTimeout(pendingRequests.timeoutId)
    pendingRequests.timeoutId = null
  }
}

// 重试配置
const retryConfig = {
  retryTimes: isProd ? 3 : 2, // 增加重试次数
  retryDelay: 2000, // 增加重试延迟
  retryStatusCodes: [500, 502, 503, 504, 404] // 需要重试的状态码
}

// 请求重试函数
const retryRequest = async (fn, times = retryConfig.retryTimes) => {
  try {
    return await fn()
  } catch (error) {
    if (times > 0 && retryConfig.retryStatusCodes.includes(error.response?.status)) {
      console.log(`请求失败，第 ${retryConfig.retryTimes - times + 1} 次重试...`)
      await new Promise(resolve => setTimeout(resolve, retryConfig.retryDelay))
      return retryRequest(fn, times - 1)
    }
    throw error
  }
}

// 请求方法封装
const request = {
  get(url, params, config = {}) {
    // if (!isProd) {
    //   console.log(`[Request] GET 请求 URL: ${url}`);
    // }
    return retryRequest(() => service.get(url, { params, ...config }))
  },
  
  post(url, data, config = {}) {
    // if (!isProd) {
    //   console.log(`[Request] POST 请求 URL: ${url}`);
    // }
    return retryRequest(() => service.post(url, data, config))
  },
  
  put(url, data, config = {}) {
    // if (!isProd) {
    //   console.log(`[Request] PUT 请求 URL: ${url}`);
    // }
    return retryRequest(() => service.put(url, data, config))
  },
  
  delete(url, config = {}) {
    // if (!isProd) {
    //   console.log(`[Request] DELETE 请求 URL: ${url}`);
    // }
    return retryRequest(() => service.delete(url, config))
  }
}

// 判断是否在登录相关页面
const isAuthPage = () => {
  const path = window.location.pathname
  return path.includes('/login') || path.includes('/register')
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
    
    // 记录请求信息
    if (!isProd) {
      console.log(`[Request] ${config.method.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data,
        headers: config.headers
      })
    }
    
    return config
  },
  error => {
    decreasePendingCount()
    console.error('请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    decreasePendingCount()
    
    // 记录响应信息
    if (!isProd) {
      console.log(`[Response] ${response.config.method.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data
      })
    }
    
    return response.data
  },
  error => {
    decreasePendingCount()
    
    // 记录错误信息
    console.error('请求错误:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    })
    
    // 处理错误
    if (error.response) {
      const status = error.response.status
      
      if (status === 401) {
        const isVisitingBlog = window.location.pathname.startsWith('/blog')
        if (!isVisitingBlog && !isAuthPage()) {
          message.error('登录已过期，请重新登录')
          localStorage.removeItem('token')
          router.push('/login')
        }
      } else if (status === 403) {
        if (!isAuthPage()) {
          message.error('您没有权限进行此操作')
        }
      } else if (status === 404) {
        if (!isAuthPage()) {
          message.error('请求的资源不存在')
        }
      } else if (status >= 500) {
        if (!isAuthPage()) {
          message.error('服务器错误，请稍后重试')
        }
      } else {
        if (!isAuthPage()) {
          message.error(error.response.data?.message || '请求失败')
        }
      }
    } else if (error.request) {
      if (!isAuthPage()) {
        message.error('无法连接到服务器，请检查网络连接')
      }
    } else {
      if (!isAuthPage()) {
        message.error('请求发送失败')
      }
    }
    
    return Promise.reject(error)
  }
)

export default request