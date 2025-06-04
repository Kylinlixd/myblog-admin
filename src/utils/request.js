import axios from 'axios'
import { message } from 'ant-design-vue'
import router from '../router'
import { useAppStore } from '../stores/app'
import { useUserStore } from '../stores/user'
import { safeStorage } from './security'
import { generateRequestId } from './uuid'

// 区分环境配置
const isProd = process.env.NODE_ENV === 'production'
// 使用相对路径，让代理处理跨域
const baseURL = isProd ? '' : ''
const requestTimeout = isProd ? 10000 : 15000 // 生产环境缩短超时时间提高用户体验

// 创建一个 Set 来存储正在进行的请求 ID
const pendingRequests = new Set()

// 创建 axios 实例
const service = axios.create({
  baseURL,
  timeout: requestTimeout,
  headers: {
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'Content-Type': 'application/json'
  },
  // 允许携带cookies
  withCredentials: true,
  // 禁止自动重定向
  maxRedirects: 0,
  // 确保请求方法在重定向时保持不变
  validateStatus: function (status) {
    return status >= 200 && status < 300; // 只接受 2xx 状态码
  },
  // 增加请求体大小限制
  maxContentLength: 10 * 1024 * 1024, // 10MB
  maxBodyLength: 10 * 1024 * 1024, // 10MB
  // 添加请求拦截器
  transformRequest: [(data, headers) => {
    // 如果是FormData，不进行转换
    if (data instanceof FormData) {
      return data;
    }
    // 如果没有设置Content-Type，默认使用application/json
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    // 确保请求体是 JSON 格式
    if (data) {
      return JSON.stringify(data);
    }
    return data;
  }]
})

// 请求计数器和请求超时控制
const pendingRequestsCount = {
  count: 0,
  timeoutId: null
}

// 增加请求计数
const increasePendingCount = () => {
  pendingRequestsCount.count++
  
  // 非生产环境才打印日志
  if (!isProd) {
    // console.log(`[Request] 增加请求计数: ${pendingRequestsCount.count}`)
  }
  
  // 设置全局超时
  if (pendingRequestsCount.count === 1) {
    // 第一个请求开始时设置超时
    pendingRequestsCount.timeoutId = setTimeout(() => {
      if (pendingRequestsCount.count > 0) {
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
  pendingRequestsCount.count = Math.max(0, pendingRequestsCount.count - 1)
  
  // 非生产环境才打印日志
  if (!isProd) {
    // console.log(`[Request] 减少请求计数: ${pendingRequestsCount.count}`)
  }
  
  // 所有请求完成时清除超时
  if (pendingRequestsCount.count === 0 && pendingRequestsCount.timeoutId) {
    clearTimeout(pendingRequestsCount.timeoutId)
    pendingRequestsCount.timeoutId = null
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

// 获取API后端目标URL（开发工具用）
const getAPITargetURL = (url) => {
  // 获取URL路径部分
  const path = url.split('?')[0];
  // 根据前缀确定目标后端
  if (path.startsWith('/api/')) {
    return `http://127.0.0.1:8000${path}`;
  } else if (path.startsWith('/blog/')) {
    return `http://127.0.0.1:8000${path}`;
  } else {
    return `${window.location.origin}${path}`;
  }
}

// 预请求检测处理
const handlePreflightCheck = () => {
  // 添加一个空的OPTIONS请求监听器，让开发者工具不显示OPTIONS请求
  const origOpen = XMLHttpRequest.prototype.open
  XMLHttpRequest.prototype.open = function(method, url) {
    this._method = method
    this._url = url
    return origOpen.apply(this, arguments)
  }
}

// 在开发环境中处理预检请求
if (!isProd) {
  handlePreflightCheck()
}

// 请求拦截器
service.interceptors.request.use(
  config => {
    const userStore = useUserStore()
    
    // 添加 token
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }

    // 为非 GET 请求生成并添加请求 ID
    if (config.method !== 'get') {
      const requestId = generateRequestId()
      config.headers['X-Request-ID'] = requestId
      
      // 检查是否存在重复请求
      if (pendingRequests.has(requestId)) {
        // 如果存在重复请求，取消当前请求
        return Promise.reject(new Error('重复请求已被取消'))
      }
      
      // 将请求 ID 添加到进行中的请求集合
      pendingRequests.add(requestId)
      
      // 请求完成后从集合中移除
      config.metadata = { requestId }
    }

    // 统计请求次数
    increasePendingCount()
    
    // 获取访问令牌
    const token = safeStorage.get('token', '')
    const isAuthPath = config.url.includes('/auth/')
    
    // 设置请求头
    if (token) {
      // 确保 token 格式正确
      const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`
      config.headers.Authorization = authToken
      console.log('[令牌] 请求已携带令牌:', config.url)
    } else {
      console.log('[令牌] 请求未携带令牌:', config.url)
      
      // 如果不是认证相关路径，但需要认证，可能需要提示用户登录
      if (!isAuthPath && !config.url.startsWith('/blog/') && !config.skipAuthCheck) {
        console.error('[令牌] 错误: 访问需要认证的API但未找到令牌:', config.url)
      }
    }
    
    // 如果是FormData，确保Content-Type不被覆盖
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    
    // 记录请求信息
    if (!isProd) {
      console.log(`[Request] ${config.method.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data,
        headers: {
          ...config.headers,
          Authorization: config.headers.Authorization ? 
            config.headers.Authorization.substring(0, 20) + '...' : 
            undefined
        }
      })
      
      // 记录本地URL和后端目标URL
      const baseOrigin = window.location.origin; // 当前站点的源
      const localFullUrl = config.url.startsWith('http') 
        ? config.url 
        : `${baseOrigin}${config.url}`;
      const backendURL = getAPITargetURL(config.url);
      
      console.log(`[Request] 本地URL: ${localFullUrl}`);
      console.log(`[Request] 目标后端: ${backendURL}`);
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
    
    // 处理不同响应格式
    const responseData = response.data
    
    // 空响应处理
    if (!responseData) {
      console.warn('[响应处理] 响应数据为空');
      return null;
    }
    
    // 判断是否是标准格式响应
    if (typeof responseData === 'object') {
      // 标准API响应格式: { code, data, message }
      if (responseData.code !== undefined) {
        if (responseData.code !== 200) {
          // 增加错误日志
          console.error(`[API错误] 错误码: ${responseData.code}, 消息: ${responseData.message || '未知错误'}`)
          if (!isAuthPage()) {
            message.error(responseData.message || '请求失败')
          }
          return Promise.reject(new Error(responseData.message || '请求失败'))
        }
        return responseData
      }
      
      // 检查其他常见格式，如果有明确错误信息
      if (responseData.success === false || responseData.status === 'error') {
        const errorMsg = responseData.message || responseData.error || responseData.msg || '请求失败';
        console.error(`[API错误] 响应表明失败: ${errorMsg}`);
        if (!isAuthPage()) {
          message.error(errorMsg);
        }
        return Promise.reject(new Error(errorMsg));
      }
      
      // 非标准但有数据的情况，直接返回
      return responseData
    }
    
    // 其他情况，返回原始响应
    return responseData
  },
  error => {
    decreasePendingCount()
    
    // 详细记录错误信息
    console.error('请求错误详情:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      headers: error.config?.headers,
      data: error.response?.data,
      message: error.message
    })
    
    // 打印请求和响应的完整信息，帮助调试
    if (error.config) {
      console.log('[错误请求详情] 请求配置:', {
        url: error.config.url,
        method: error.config.method,
        baseURL: error.config.baseURL,
        headers: error.config.headers,
        timeout: error.config.timeout,
        withCredentials: error.config.withCredentials
      })
    }
    
    if (error.response) {
      console.log('[错误请求详情] 服务器响应:', {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: error.response.data
      })
      
      // 尝试解析错误响应中的数据
      const responseData = error.response.data;
      
      // 特殊情况：后端返回HTTP 500但实际内容是正常的数据
      if (error.response.status === 500 && responseData && typeof responseData === 'object') {
        if (responseData.code === 200) {
          console.log('[响应修正] 检测到HTTP 500但内容正常，进行修正');
          return Promise.resolve(responseData);
        }
      }
      
      // 检查JSON格式是否只有数组
      if (Array.isArray(responseData)) {
        console.log('[响应修正] 收到数组响应，尝试处理');
        return Promise.resolve(responseData);
      }
    }
    
    // 处理错误
    if (error.response) {
      const status = error.response.status
      
      if (status === 401) {
        // 避免在非受保护页面显示过期提示
        const isVisitingBlog = window.location.pathname.startsWith('/blog')
        const isAlreadyOnAuthPage = isAuthPage()
        
        if (!isVisitingBlog && !isAlreadyOnAuthPage) {
          console.log('[认证] 检测到401未授权错误，尝试刷新令牌');
          
          // 检查是否已经尝试过刷新令牌
          const hasRefreshAttempted = error.config && error.config._refreshAttempted
          const hasRefreshToken = localStorage.getItem('refreshToken')
          
          // 如果有刷新令牌且没有尝试过刷新，则尝试刷新令牌
          if (hasRefreshToken && !hasRefreshAttempted) {
            console.log('[认证] 尝试使用刷新令牌获取新的访问令牌');
            
            try {
              // 导入auth模块，避免循环引用
              const { refreshToken } = require('../api/auth');
              
              // 尝试刷新令牌
              return refreshToken()
                .then(result => {
                  console.log('[认证] 令牌刷新成功，重试原始请求');
                  
                  // 使用新令牌重试原始请求
                  const originalConfig = error.config;
                  originalConfig._refreshAttempted = true; // 标记已尝试刷新
                  
                  // 获取新令牌
                  const newToken = localStorage.getItem('accessToken');
                  if (newToken) {
                    // 更新请求头
                    originalConfig.headers.Authorization = `Bearer ${newToken}`;
                    console.log('[认证] 更新请求头使用新的令牌');
                    
                    // 重试原始请求
                    return request(originalConfig);
                  } else {
                    throw new Error('刷新令牌后未能获取新的访问令牌');
                  }
                })
                .catch(refreshError => {
                  console.error('[认证] 令牌刷新失败，重定向到登录页:', refreshError);
                  
                  // 清除认证状态
                  const userStore = useUserStore();
                  userStore.clearUserData();
                  
                  // 显示错误消息
                  message.error('登录已过期，请重新登录');
                  
                  // 获取当前页面路径，用于重定向
                  const currentPath = router.currentRoute.value.fullPath;
                  router.push({
                    path: '/login',
                    query: { redirect: currentPath }
                  });
                  
                  return Promise.reject(new Error('认证失败，请重新登录'));
                });
            } catch (importError) {
              console.error('[认证] 导入refreshToken函数失败:', importError);
            }
          }
          
          // 如果没有刷新令牌或已经尝试过刷新，直接跳转到登录页
          message.error('登录已过期，请重新登录');
          
          // 清除用户数据
          const userStore = useUserStore();
          userStore.clearUserData();
          
          // 获取当前页面路径，用于重定向
          const currentPath = router.currentRoute.value.fullPath;
          console.log('[认证] 重定向到登录页，当前路径:', currentPath);
          
          // 使用router.push而不是replace，确保用户可以返回
          router.push({
            path: '/login',
            query: { redirect: currentPath }
          });
        }
        
        // 返回特定错误
        return Promise.reject(new Error('登录已过期，请重新登录'));
      } else if (status === 500) {
        // 增加500错误的特殊处理
        console.error('服务器内部错误 (500):', error.response.data)
        
        // 尝试从500错误中解析有效数据
        const responseData = error.response.data;
        if (responseData && typeof responseData === 'object' && responseData.code !== undefined) {
          if (responseData.code === 200) {
            console.log('[响应修正] 状态码为500但响应内容正常，返回内容');
            return Promise.resolve(responseData);
          } else {
            message.error(responseData.message || '服务器内部错误');
          }
        } else {
          message.error('服务器内部错误，请联系管理员')
        }
      } else {
        // 其他HTTP错误
        let errorMessage = '请求失败'
        
        // 尝试从响应中解析错误消息
        if (error.response.data) {
          if (typeof error.response.data === 'string') {
            errorMessage = error.response.data
          } else if (error.response.data.message) {
            errorMessage = error.response.data.message
          } else if (error.response.data.error) {
            errorMessage = error.response.data.error
          }
        }
        
        // 避免在登录页显示错误
        if (!isAuthPage()) {
          message.error(errorMessage)
        }
      }
    } else if (error.request) {
      // 请求已经发出，但没有收到响应
      console.error('网络错误 - 请求已发出但无响应:', error.request)
      
      // 提供更详细的错误日志，帮助开发者排查
      console.error('[错误详情]', {
        url: error.config?.url,
        method: error.config?.method,
        timeout: error.config?.timeout,
        headers: error.config?.headers
      })
      
      console.log('[提示] 请检查：')
      console.log('1. 后端服务是否在 http://127.0.0.1:8000 上运行')
      console.log('2. 网络连接是否正常')
      
      // 避免在登录页显示错误
      if (!isAuthPage()) {
        message.error('网络错误，无法连接到服务器')
      }
      
      // 设置全局错误状态
      const appStore = useAppStore()
      appStore.setLoadingError('网络错误，无法连接到服务器, 请检查您的网络连接或服务器状态')
    } else {
      // 请求设置时出错
      console.error('请求配置错误:', error.message)
      
      // 避免在登录页显示错误
      if (!isAuthPage()) {
        message.error(error.message || '请求发送失败')
      }
    }
    
    // 如果是非 GET 请求，从进行中的请求集合中移除
    if (error.config?.method !== 'get' && error.config?.metadata?.requestId) {
      pendingRequests.delete(error.config.metadata.requestId)
    }
    
    return Promise.reject(error)
  }
)

export default request