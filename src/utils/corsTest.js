/**
 * CORS 测试工具
 * 用于测试和调试 CORS 问题
 */

import axios from 'axios'
import { message } from 'ant-design-vue'

// 创建不携带凭证的 axios 实例，模拟跨域请求
const corsAxios = axios.create({
  timeout: 10000,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
})

// 创建携带凭证的 axios 实例
const corsAxiosWithCredentials = axios.create({
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
})

/**
 * 测试跨域请求
 * @param {string} url - 要测试的 URL
 * @param {boolean} withCredentials - 是否携带凭证
 * @returns {Promise} - 请求结果
 */
export function testCORS(url, withCredentials = false) {
  console.log(`[CORS测试] 开始测试: ${url}, withCredentials: ${withCredentials}`)
  
  const instance = withCredentials ? corsAxiosWithCredentials : corsAxios
  
  return instance.get(url)
    .then(response => {
      console.log('[CORS测试] 成功:', response)
      message.success('CORS 测试成功')
      return response.data
    })
    .catch(error => {
      console.error('[CORS测试] 失败:', error)
      let errorMsg = '未知错误'
      
      if (error.response) {
        errorMsg = `状态码: ${error.response.status}, 消息: ${error.response.statusText}`
      } else if (error.request) {
        errorMsg = '没有收到响应，可能是 CORS 问题或网络错误'
      } else {
        errorMsg = error.message
      }
      
      message.error(`CORS 测试失败: ${errorMsg}`)
      throw error
    })
}

/**
 * 测试预检请求
 * @param {string} url - 要测试的 URL
 * @returns {Promise} - 请求结果
 */
export function testPreflightRequest(url) {
  console.log(`[CORS预检测试] 开始测试: ${url}`)
  
  const instance = axios.create({
    timeout: 10000,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'X-Custom-Header'
    }
  })
  
  return instance.options(url)
    .then(response => {
      console.log('[CORS预检测试] 成功:', response)
      message.success('CORS 预检测试成功')
      
      // 检查响应头中是否包含必要的 CORS 头
      const headers = response.headers
      const corsHeaders = {
        'access-control-allow-origin': headers['access-control-allow-origin'],
        'access-control-allow-methods': headers['access-control-allow-methods'],
        'access-control-allow-headers': headers['access-control-allow-headers'],
        'access-control-allow-credentials': headers['access-control-allow-credentials'],
        'access-control-max-age': headers['access-control-max-age']
      }
      
      console.log('[CORS预检测试] CORS 响应头:', corsHeaders)
      return { 
        success: true, 
        headers: corsHeaders 
      }
    })
    .catch(error => {
      console.error('[CORS预检测试] 失败:', error)
      message.error('CORS 预检测试失败')
      throw error
    })
}

/**
 * 测试服务器状态和CORS配置
 * @returns {Promise} 测试结果
 */
export function testServerStatus() {
  console.log('[服务器测试] 开始测试后端服务器状态')
  
  const endpoints = [
    { url: '/api/health', name: 'API 健康检查' },
    { url: '/api/auth/login', name: '用户登录', method: 'options' }
  ]
  
  const promises = endpoints.map(endpoint => {
    const method = endpoint.method || 'get'
    return axios({
      method,
      url: endpoint.url,
      timeout: 5000,
      validateStatus: status => true // 接受任何状态码
    })
      .then(response => ({
        endpoint: endpoint.name,
        url: endpoint.url,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        success: response.status >= 200 && response.status < 400
      }))
      .catch(error => ({
        endpoint: endpoint.name,
        url: endpoint.url,
        error: error.message,
        success: false
      }))
  })
  
  return Promise.all(promises)
    .then(results => {
      console.log('[服务器测试] 结果:', results)
      const allSuccess = results.every(r => r.success)
      
      if (allSuccess) {
        message.success('所有端点测试成功')
      } else {
        message.warning('部分或全部端点测试失败')
      }
      
      return {
        success: allSuccess,
        results
      }
    })
}

export default {
  testCORS,
  testPreflightRequest,
  testServerStatus
} 