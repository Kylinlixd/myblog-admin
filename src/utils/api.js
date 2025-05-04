/**
 * API 工具类
 * 提供统一的 API 调用方法和错误处理
 */

import request from './request'
import { message } from 'ant-design-vue'

// API 前缀配置
const apiPrefix = {
  admin: '', // 移除前缀，由代理处理
  blog: '/blog'
}

// 调试日志
const logApiCall = (module, method, url, params) => {
  // 根据前缀确定目标后端
  let backendUrl = '';
  if (url.startsWith('/api/') || url.startsWith('/blog/')) {
    backendUrl = `http://127.0.0.1:8000${url}`;
  }
  
  // 显示API调用信息
  console.log(`[API 调用] ${module}.${method} ${url}`, params || '')
  
  // 显示目标后端URL
  if (backendUrl) {
    console.log(`[API 目标] ${backendUrl}`)
  }
}

// 错误处理
const handleApiError = (error, showError = true) => {
  console.error('[API 错误]', error)
  
  // 如果不显示错误提示，直接返回错误
  if (!showError) {
    return Promise.reject(error)
  }
  
  // 显示错误提示
  if (error.response) {
    const status = error.response.status
    const data = error.response.data
    
    // 尝试提取错误消息
    let errorMessage = '请求失败'
    
    // 处理后端返回的错误信息
    if (data) {
      if (typeof data === 'string') {
        errorMessage = data
      } else if (data.message) {
        errorMessage = typeof data.message === 'string' 
          ? data.message 
          : JSON.stringify(data.message)
      } else if (data.error) {
        errorMessage = data.error
      } else if (data.detail) {
        errorMessage = data.detail
      }
    }
    
    // 显示错误提示
    message.error(errorMessage)
    
    // 控制台记录详细的错误信息
    console.error(`HTTP错误 [${status}]:`, {
      url: error.config?.url,
      status,
      data,
      message: errorMessage
    })
  } else if (error.request) {
    message.error('网络错误，无法连接到服务器')
    console.error('[网络错误] 请求已发送但没有收到响应:', {
      url: error.config?.url,
      method: error.config?.method,
      message: '后端服务可能未运行或网络连接问题',
      detail: error.message
    })
    
    // 在控制台中显示更多调试信息
    console.log('[调试] 如果您正在开发环境，请确保后端服务正在运行')
    console.log('[调试] 后端服务端口: 8000，前端代理配置在 vite.config.js 中')
    console.log('[调试] 如需临时使用模拟数据，可在调试工具中启用模拟数据模式')
  } else {
    message.error(error.message || '未知错误')
    console.error('[请求错误]:', {
      message: error.message,
      config: error.config
    })
  }
  
  return Promise.reject(error)
}

// 最大重试次数
const MAX_RETRY_ATTEMPTS = 2
// 重试延迟（毫秒）
const RETRY_DELAY = 1000

/**
 * 带重试机制的请求包装器
 * @param {Function} requestFn - 原始请求函数
 * @param {Object} options - 请求配置
 * @returns {Promise} - 请求结果
 */
const withRetry = async (requestFn, options = {}) => {
  const { retryAttempts = MAX_RETRY_ATTEMPTS, showError = true } = options
  let attempts = 0
  
  while (attempts <= retryAttempts) {
    try {
      const result = await requestFn()
      return result
    } catch (error) {
      attempts++
      
      // 如果状态码为5xx或网络错误，尝试重试
      const shouldRetry = (
        (error.response && error.response.status >= 500 && error.response.status < 600) ||
        !error.response
      )
      
      if (shouldRetry && attempts <= retryAttempts) {
        console.log(`请求失败，将在${RETRY_DELAY}ms后第${attempts}次重试...`)
        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
        continue
      }
      
      // 已达到最大重试次数或不需要重试，处理错误
      return handleApiError(error, showError)
    }
  }
}

/**
 * 创建 API 模块
 * @param {string} moduleName - 模块名称
 * @param {string} prefix - API 前缀
 * @returns {Object} - API 模块对象
 */
const createApiModule = (moduleName, prefix = apiPrefix.admin) => {
  return {
    /**
     * GET 请求
     * @param {string} url - API 路径
     * @param {Object} params - 查询参数
     * @param {Object} config - 请求配置
     * @param {boolean} showError - 是否显示错误提示
     * @returns {Promise} - 请求结果
     */
    get: (url, params, config = {}, showError = true) => {
      const fullUrl = `${prefix}${url}`
      logApiCall(moduleName, 'GET', fullUrl, params)
      
      return withRetry(
        () => request.get(fullUrl, params, config),
        { showError }
      )
    },
    
    /**
     * POST 请求
     * @param {string} url - API 路径
     * @param {Object} data - 请求数据
     * @param {Object} config - 请求配置
     * @param {boolean} showError - 是否显示错误提示
     * @returns {Promise} - 请求结果
     */
    post: (url, data, config = {}, showError = true) => {
      const fullUrl = `${prefix}${url}`
      logApiCall(moduleName, 'POST', fullUrl, data)
      
      return withRetry(
        () => request.post(fullUrl, data, config),
        { showError }
      )
    },
    
    /**
     * PUT 请求
     * @param {string} url - API 路径
     * @param {Object} data - 请求数据
     * @param {Object} config - 请求配置
     * @param {boolean} showError - 是否显示错误提示
     * @returns {Promise} - 请求结果
     */
    put: (url, data, config = {}, showError = true) => {
      const fullUrl = `${prefix}${url}`
      logApiCall(moduleName, 'PUT', fullUrl, data)
      
      return withRetry(
        () => request.put(fullUrl, data, config),
        { showError }
      )
    },
    
    /**
     * DELETE 请求
     * @param {string} url - API 路径
     * @param {Object} config - 请求配置
     * @param {boolean} showError - 是否显示错误提示
     * @returns {Promise} - 请求结果
     */
    delete: (url, config = {}, showError = true) => {
      const fullUrl = `${prefix}${url}`
      logApiCall(moduleName, 'DELETE', fullUrl)
      
      return withRetry(
        () => request.delete(fullUrl, config),
        { showError }
      )
    }
  }
}

// 创建预定义的 API 模块
const api = {
  // 后台管理 API
  admin: createApiModule('admin', apiPrefix.admin),
  
  // 博客前台 API
  blog: createApiModule('blog', apiPrefix.blog),
  
  // 创建自定义 API 模块
  create: createApiModule
}

export default api 