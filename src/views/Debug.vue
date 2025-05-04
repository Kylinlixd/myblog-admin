<template>
  <div class="debug-page">
    <h1>API 连接调试工具</h1>
    
    <div class="debug-section">
      <h2>连接状态</h2>
      <div class="status-container">
        <div class="status-item">
          <div class="status-label">后端API服务:</div>
          <div :class="['status-value', apiStatus.success ? 'success' : 'error']">
            {{ apiStatus.message }}
          </div>
          <a-button size="small" @click="testApiConnection" :loading="apiStatus.loading">
            测试连接
          </a-button>
        </div>
        
        <div class="status-item">
          <div class="status-label">API根路径:</div>
          <div :class="['status-value', apiRootStatus.success ? 'success' : 'error']">
            {{ apiRootStatus.message }}
          </div>
          <a-button size="small" @click="checkApiRoot" :loading="apiRootStatus.loading">
            检查API根
          </a-button>
        </div>
        
        <div class="status-item">
          <div class="status-label">模拟数据模式:</div>
          <div :class="['status-value', mockMode ? 'warning' : 'success']">
            {{ mockMode ? '已启用' : '已禁用' }}
          </div>
          <a-switch v-model:checked="mockMode" @change="toggleMockMode" />
        </div>
        
        <div class="notice" v-if="!apiStatus.success">
          <a-alert 
            type="warning" 
            message="后端服务无法访问"
            description="如果后端服务未启动或无法访问，您可以临时启用模拟数据模式进行开发。请注意，模拟数据模式下的数据不会保存到后端。"
            show-icon
          />
        </div>
        
        <div class="notice" v-if="mockMode">
          <a-alert
            type="info"
            message="已启用模拟数据模式"
            description="当前使用的是前端模拟数据，而不是真实后端API。对数据的操作仅保存在浏览器本地存储中，刷新页面后可能丢失。"
            show-icon
          />
        </div>
      </div>
    </div>
    
    <div class="debug-section">
      <h2>环境信息</h2>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Node环境:</div>
          <div class="info-value">{{ envInfo.nodeEnv }}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Base URL:</div>
          <div class="info-value">{{ envInfo.baseUrl }}</div>
        </div>
        <div class="info-item">
          <div class="info-label">API前缀:</div>
          <div class="info-value">{{ envInfo.apiPrefix }}</div>
        </div>
        <div class="info-item">
          <div class="info-label">博客API前缀:</div>
          <div class="info-value">{{ envInfo.blogApiPrefix }}</div>
        </div>
        <div class="info-item">
          <div class="info-label">数据模式:</div>
          <div class="info-value">{{ mockMode ? '使用模拟数据' : '使用真实API' }}</div>
        </div>
      </div>
    </div>
    
    <div class="debug-section">
      <h2>API请求测试</h2>
      
      <div class="api-test-form">
        <div class="form-row">
          <a-select v-model:value="testRequest.method" style="width: 100px">
            <a-select-option value="GET">GET</a-select-option>
            <a-select-option value="POST">POST</a-select-option>
            <a-select-option value="PUT">PUT</a-select-option>
            <a-select-option value="DELETE">DELETE</a-select-option>
          </a-select>
          
          <a-input v-model:value="testRequest.url" placeholder="输入API路径 (例如: /api/auth/info/)" style="flex: 1" />
          
          <a-button type="primary" @click="sendTestRequest" :loading="testRequest.loading">
            发送请求
          </a-button>
        </div>
        
        <div class="form-row" v-if="testRequest.method !== 'GET' && testRequest.method !== 'DELETE'">
          <a-textarea 
            v-model:value="testRequest.data" 
            placeholder="请求体 (JSON格式)" 
            :rows="4" 
          />
        </div>
      </div>
      
      <div class="result-container" v-if="testRequest.result">
        <h3>响应结果</h3>
        <div class="result-status">
          状态: <span :class="testRequest.success ? 'success' : 'error'">
            {{ testRequest.status }}
          </span>
        </div>
        <pre class="result-data">{{ testRequest.result }}</pre>
      </div>
    </div>
    
    <div class="debug-section">
      <h2>网络诊断</h2>
      
      <div class="network-status">
        <div class="status-item">
          <div class="status-label">网络连接:</div>
          <div :class="['status-value', navigator.onLine ? 'success' : 'error']">
            {{ navigator.onLine ? '在线' : '离线' }}
          </div>
        </div>
        
        <div class="status-item">
          <div class="status-label">DNS解析:</div>
          <div :class="['status-value', dnsStatus.success ? 'success' : 'error']">
            {{ dnsStatus.message }}
          </div>
          <a-button size="small" @click="checkDns" :loading="dnsStatus.loading">
            检查
          </a-button>
        </div>
      </div>
      
      <a-button type="primary" @click="runFullDiagnostic" :loading="diagnosticRunning">
        运行完整诊断
      </a-button>
      
      <div class="diagnostic-results" v-if="diagnosticResults.length > 0">
        <h3>诊断结果</h3>
        <div v-for="(result, index) in diagnosticResults" :key="index" 
             :class="['diagnostic-item', result.success ? 'success' : (result.warning ? 'warning' : 'error')]">
          {{ result.message }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import axios from 'axios'
import { message } from 'ant-design-vue'
import { getEnvValue } from '../utils/env'
import { toggleMockDataMode } from '../api/auth'

// 环境信息
const envInfo = reactive({
  nodeEnv: process.env.NODE_ENV || 'development',
  baseUrl: window.location.origin,
  apiPrefix: getEnvValue('VITE_API_BASE_URL', '/api'),
  blogApiPrefix: getEnvValue('VITE_BLOG_API_BASE_URL', '/blog')
})

// API状态
const apiStatus = reactive({
  success: false,
  message: '未测试',
  loading: false
})

// 模拟数据模式
const mockMode = ref(localStorage.getItem('useMockData') === 'true')

// DNS状态
const dnsStatus = reactive({
  success: false,
  message: '未测试',
  loading: false
})

// API根路径状态
const apiRootStatus = reactive({
  success: false,
  message: '未测试',
  loading: false
})

// 测试请求
const testRequest = reactive({
  method: 'GET',
  url: '/api/auth/info/',
  data: '{}',
  result: '',
  status: '',
  success: false,
  loading: false
})

// 诊断结果
const diagnosticResults = ref([])
const diagnosticRunning = ref(false)

// 测试与后端API的连接
const testApiConnection = async () => {
  apiStatus.loading = true
  apiStatus.message = '测试中...'
  
  try {
    // 使用简单的OPTIONS请求检查API是否可用
    const response = await axios({
      method: 'OPTIONS',
      url: '/api/auth/login/',
      timeout: 5000
    })
    
    apiStatus.success = true
    apiStatus.message = `可用 (状态码: ${response.status})`
  } catch (error) {
    apiStatus.success = false
    
    if (error.response) {
      // 有响应但状态码不是2xx
      apiStatus.message = `错误 (状态码: ${error.response.status})`
    } else if (error.request) {
      // 发送了请求但没有收到响应
      apiStatus.message = '无响应，后端服务可能未运行'
    } else {
      // 请求设置时出错
      apiStatus.message = '请求错误: ' + error.message
    }
  } finally {
    apiStatus.loading = false
  }
}

// 切换模拟数据模式
const toggleMockMode = async (enabled) => {
  try {
    await toggleMockDataMode(enabled)
    message.success(`已${enabled ? '启用模拟数据模式' : '切换为真实API模式'}`)
    console.log(`[数据模式] ${enabled ? '已启用模拟数据' : '已切换为真实API'}`)
  } catch (error) {
    console.error('切换模拟数据模式失败:', error)
    message.error('切换数据模式失败')
    mockMode.value = !enabled // 恢复原状态
  }
}

// 检查DNS解析
const checkDns = async () => {
  dnsStatus.loading = true
  dnsStatus.message = '检查中...'
  
  // 简单的DNS检查 - 通过发送请求到当前域名来判断
  try {
    await axios.get(`${window.location.origin}/favicon.ico?t=${Date.now()}`, {
      timeout: 3000
    })
    dnsStatus.success = true
    dnsStatus.message = '正常'
  } catch (error) {
    dnsStatus.success = false
    dnsStatus.message = 'DNS解析可能有问题'
    console.error('DNS检查错误:', error)
  } finally {
    dnsStatus.loading = false
  }
}

// 检查API根路径
const checkApiRoot = async () => {
  apiRootStatus.loading = true
  apiRootStatus.message = '检查中...'
  
  try {
    // 使用GET请求API根路径
    const response = await axios.get('/api/', { 
      timeout: 5000,
      params: { format: 'json' } 
    })
    
    // 检查响应是否包含预期的API端点
    const hasEndpoints = response.data && 
      (response.data.dynamics || response.data.users);
    
    if (hasEndpoints) {
      apiRootStatus.success = true;
      apiRootStatus.message = `可用 (${Object.keys(response.data).length}个端点)`;
      console.log('[API根] 可用的端点:', response.data);
    } else {
      apiRootStatus.success = false;
      apiRootStatus.message = '结构异常';
      console.error('[API根] 响应结构不符合预期:', response.data);
    }
  } catch (error) {
    apiRootStatus.success = false;
    
    if (error.response) {
      apiRootStatus.message = `错误 (${error.response.status})`;
      console.error('[API根] 请求错误:', error.response.data);
    } else if (error.request) {
      apiRootStatus.message = '无响应';
      console.error('[API根] 无响应:', error.message);
    } else {
      apiRootStatus.message = '请求失败';
      console.error('[API根] 请求失败:', error.message);
    }
  } finally {
    apiRootStatus.loading = false
  }
}

// 发送测试请求
const sendTestRequest = async () => {
  testRequest.loading = true
  testRequest.result = ''
  testRequest.status = ''
  testRequest.success = false
  
  try {
    let data = {}
    if (testRequest.data) {
      try {
        data = JSON.parse(testRequest.data)
      } catch (e) {
        message.error('请求体JSON格式错误')
        testRequest.loading = false
        return
      }
    }
    
    const config = {
      method: testRequest.method,
      url: testRequest.url,
      timeout: 10000
    }
    
    if (testRequest.method !== 'GET' && testRequest.method !== 'DELETE') {
      config.data = data
    }
    
    const response = await axios(config)
    
    testRequest.status = `${response.status} ${response.statusText}`
    testRequest.result = JSON.stringify(response.data, null, 2)
    testRequest.success = true
  } catch (error) {
    testRequest.success = false
    
    if (error.response) {
      testRequest.status = `${error.response.status} ${error.response.statusText}`
      testRequest.result = JSON.stringify(error.response.data, null, 2)
    } else if (error.request) {
      testRequest.status = '无响应'
      testRequest.result = '请求已发送，但未收到响应'
    } else {
      testRequest.status = '请求错误'
      testRequest.result = error.message
    }
  } finally {
    testRequest.loading = false
  }
}

// 运行完整诊断
const runFullDiagnostic = async () => {
  diagnosticRunning.value = true
  diagnosticResults.value = []
  
  // 检查网络连接
  if (navigator.onLine) {
    diagnosticResults.value.push({ success: true, message: '网络连接: 在线' })
  } else {
    diagnosticResults.value.push({ success: false, message: '网络连接: 离线' })
    diagnosticRunning.value = false
    return
  }
  
  // 检查DNS
  try {
    await axios.get(`${window.location.origin}/favicon.ico?t=${Date.now()}`, { timeout: 3000 })
    diagnosticResults.value.push({ success: true, message: 'DNS解析: 正常' })
  } catch (error) {
    diagnosticResults.value.push({ success: false, message: 'DNS解析: 失败' })
  }
  
  // 检查代理设置
  try {
    await axios.head('/api', { timeout: 3000 })
    diagnosticResults.value.push({ success: true, message: 'API代理: 正常' })
  } catch (error) {
    if (error.response) {
      // 收到响应，但不是200，这正常，因为/api可能不处理HEAD请求
      diagnosticResults.value.push({ success: true, message: 'API代理: 正常' })
    } else {
      diagnosticResults.value.push({ success: false, message: 'API代理: 异常' })
    }
  }
  
  // 检查后端API
  try {
    const response = await axios({
      method: 'OPTIONS',
      url: '/api/auth/login/',
      timeout: 5000
    })
    diagnosticResults.value.push({ success: true, message: `后端API: 可用 (${response.status})` })
  } catch (error) {
    if (error.response) {
      // 有响应但状态码非2xx
      diagnosticResults.value.push({ 
        warning: true, 
        message: `后端API: 响应异常 (${error.response.status})` 
      })
    } else {
      diagnosticResults.value.push({ 
        success: false, 
        message: '后端API: 无响应' 
      })
    }
  }
  
  // 检查是否在模拟数据模式
  if (mockMode.value) {
    diagnosticResults.value.push({ 
      warning: true, 
      message: '模拟数据模式: 已启用 (将使用模拟数据而非真实API)' 
    })
  } else {
    diagnosticResults.value.push({ 
      success: true, 
      message: '模拟数据模式: 已禁用' 
    })
  }
  
  // 检查浏览器存储
  try {
    localStorage.setItem('debug_test', 'test')
    localStorage.removeItem('debug_test')
    diagnosticResults.value.push({ success: true, message: 'localStorage: 正常' })
  } catch (error) {
    diagnosticResults.value.push({ success: false, message: 'localStorage: 异常 (可能被禁用)' })
  }
  
  diagnosticRunning.value = false
}

// 组件挂载时运行基本检查
onMounted(() => {
  testApiConnection()
  checkDns()
  checkApiRoot()
})
</script>

<style scoped>
.debug-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  text-align: center;
  margin-bottom: 30px;
}

.debug-section {
  background-color: #f8f8f8;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.notice {
  margin-top: 16px;
  width: 100%;
}

h2 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 18px;
  color: #333;
}

.status-container, .network-status {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-label, .info-label {
  font-weight: bold;
  min-width: 120px;
}

.status-value {
  min-width: 200px;
}

.status-value.success {
  color: #52c41a;
}

.status-value.warning {
  color: #faad14;
}

.status-value.error {
  color: #f5222d;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.api-test-form {
  margin-bottom: 20px;
}

.form-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.result-container {
  background-color: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 16px;
}

.result-status {
  margin-bottom: 8px;
  font-weight: bold;
}

.result-data {
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  overflow: auto;
  max-height: 300px;
  font-family: monospace;
  white-space: pre-wrap;
}

.diagnostic-results {
  margin-top: 20px;
}

.diagnostic-item {
  padding: 8px 12px;
  margin-bottom: 4px;
  border-radius: 4px;
}

.diagnostic-item.success {
  background-color: #f6ffed;
  border: 1px solid #b7eb8f;
}

.diagnostic-item.warning {
  background-color: #fffbe6;
  border: 1px solid #ffe58f;
}

.diagnostic-item.error {
  background-color: #fff2f0;
  border: 1px solid #ffccc7;
}
</style> 