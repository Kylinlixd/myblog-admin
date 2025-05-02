/**
 * API 工具类
 * 提供统一的 API 调用方法和错误处理
 */

import request from './request'
import { message } from 'ant-design-vue'

// API 前缀配置
const apiPrefix = {
  admin: '/api',
  blog: '/blog'
}

// 调试日志
const logApiCall = (module, method, url, params) => {
  console.log(`[API 调用] ${module}.${method} ${url}`, params || '')
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
    
    // 处理后端返回的错误信息
    if (data && data.message) {
      message.error(data.message)
    } else {
      // 根据 HTTP 状态码显示通用错误提示
      switch (status) {
        case 400:
          message.error('请求参数错误')
          break
        case 401:
          message.error('未授权，请重新登录')
          break
        case 403:
          message.error('无权限执行此操作')
          break
        case 404:
          message.error('请求的资源不存在')
          break
        case 500:
          message.error('服务器内部错误')
          break
        default:
          message.error(`请求失败: ${status}`)
      }
    }
  } else if (error.request) {
    message.error('网络错误，无法连接到服务器')
  } else {
    message.error(error.message || '未知错误')
  }
  
  return Promise.reject(error)
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
      
      return request.get(fullUrl, params, config)
        .catch(error => handleApiError(error, showError))
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
      
      return request.post(fullUrl, data, config)
        .catch(error => handleApiError(error, showError))
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
      
      return request.put(fullUrl, data, config)
        .catch(error => handleApiError(error, showError))
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
      
      return request.delete(fullUrl, config)
        .catch(error => handleApiError(error, showError))
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