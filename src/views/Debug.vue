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
          <div :class="['info-value', mockMode ? 'warning' : 'success']">
            <span v-if="mockMode">
              <a-tag color="orange">模拟数据</a-tag> 使用前端模拟数据
            </span>
            <span v-else>
              <a-tag color="green">真实API</a-tag> 连接后端API
            </span>
          </div>
        </div>
      </div>
      
      <div class="mode-monitor">
        <a-alert v-if="mockMode" type="warning" show-icon>
          <template #message>
            <span>当前使用模拟数据模式</span>
          </template>
          <template #description>
            所有API请求都使用前端模拟数据，不会发送到后端。修改的数据仅保存在浏览器本地存储中。
          </template>
        </a-alert>
        <a-alert v-else type="info" show-icon>
          <template #message>
            <span>当前使用真实API模式</span>
          </template>
          <template #description>
            所有API请求都发送到后端服务。如果遇到认证问题，请检查令牌状态或切换到模拟数据模式。
          </template>
        </a-alert>
      </div>
    </div>
    
    <div class="debug-section">
      <h2>API代理对比测试</h2>
      <p class="section-desc">
        此工具可以对比直接请求后端和通过代理请求的结果差异，帮助排查代理配置问题。
      </p>
      
      <div class="form-row">
        <a-input v-model:value="compareTest.apiPath" placeholder="API路径 (例如: /api/stats/)" style="flex: 1" />
        <a-button type="primary" @click="runProxyTest" :loading="compareTest.loading">对比测试</a-button>
      </div>
      
      <div class="compare-results" v-if="compareTest.hasResults">
        <div class="compare-item">
          <h3>直接请求后端 <a-tag :color="compareTest.direct.success ? 'success' : 'error'">{{ compareTest.direct.status }}</a-tag></h3>
          <div class="compare-url">URL: {{ compareTest.direct.url }}</div>
          <pre class="result-data">{{ compareTest.direct.result }}</pre>
        </div>
        
        <div class="compare-item">
          <h3>通过代理请求 <a-tag :color="compareTest.proxy.success ? 'success' : 'error'">{{ compareTest.proxy.status }}</a-tag></h3>
          <div class="compare-url">URL: {{ compareTest.proxy.url }}</div>
          <pre class="result-data">{{ compareTest.proxy.result }}</pre>
        </div>
        
        <div class="compare-analysis" v-if="compareTest.analysis">
          <h3>分析结果</h3>
          <div :class="['diagnostic-item', compareTest.analysisType]">
            {{ compareTest.analysis }}
          </div>
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
    
    <!-- 添加HTTP状态检测工具 -->
    <div class="debug-section">
      <h2>HTTP状态码与响应内容检测</h2>
      <p class="section-desc">
        用于检测后端返回的HTTP状态码与响应内容是否一致，解决状态码为500但内容正常的问题。
      </p>
      
      <div class="form-row">
        <a-input v-model:value="httpTest.url" placeholder="API路径 (例如: /api/stats/)" style="flex: 1" />
        <a-button type="primary" @click="testHttpResponse" :loading="httpTest.loading">检测响应</a-button>
      </div>
      
      <div class="result-container" v-if="httpTest.hasResult">
        <h3>响应分析</h3>
        <div class="http-analysis">
          <div class="http-status">
            <span class="label">HTTP状态码:</span>
            <span :class="['value', httpTest.httpStatus < 400 ? 'success' : 'error']">
              {{ httpTest.httpStatus }} {{ httpTest.httpStatusText }}
            </span>
          </div>
          
          <div class="content-status" v-if="httpTest.contentStatus">
            <span class="label">响应内容状态:</span>
            <span :class="['value', httpTest.contentStatus === 200 ? 'success' : 'error']">
              {{ httpTest.contentStatus }} {{ httpTest.contentStatusText }}
            </span>
          </div>
          
          <div class="status-mismatch" v-if="httpTest.mismatch">
            <a-alert 
              type="warning" 
              message="状态码与内容不一致" 
              description="检测到HTTP状态码与响应内容中的code值不一致，这可能导致前端误判请求失败。"
              show-icon
            />
          </div>
          
          <div class="headers-analysis">
            <h4>请求头对比</h4>
            <div class="headers-section">
              <div class="headers-half">
                <h5>直接请求请求头</h5>
                <pre class="headers-data">{{ httpTest.directHeaders }}</pre>
              </div>
              <div class="headers-half">
                <h5>代理请求请求头</h5>
                <pre class="headers-data">{{ httpTest.proxyHeaders }}</pre>
              </div>
            </div>
            <div class="headers-diff" v-if="httpTest.headersDiff.length > 0">
              <h5>请求头差异</h5>
              <div v-for="(diff, index) in httpTest.headersDiff" :key="index"
                   class="diff-item">
                {{ diff }}
              </div>
            </div>
          </div>
          
          <h4>响应内容</h4>
          <pre class="result-data">{{ httpTest.responseData }}</pre>
          
          <div class="action-section" v-if="httpTest.mismatch || httpTest.headersDiff.length > 0">
            <h4>解决方案</h4>
            <div v-if="httpTest.headersDiff.length > 0">
              <p><strong>请求头问题：</strong>可能是由于请求头不一致导致的。后端可能需要处理以下请求头差异。</p>
              <ul>
                <li v-for="(diff, index) in httpTest.headersDiff" :key="`solution-${index}`">
                  {{ diff }}
                </li>
              </ul>
            </div>
            <p v-if="httpTest.mismatch">
              <strong>状态码问题：</strong>需要后端确保HTTP状态码与响应内容中的code一致。
            </p>
            <p>
              <strong>临时解决方案：</strong>已默认启用模拟数据模式，以便在后端问题解决前能够进行开发。
            </p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 添加令牌调试工具 -->
    <div class="debug-section">
      <h2>令牌调试</h2>
      <div class="token-container">
        <div class="token-status">
          <div class="status-item">
            <div class="status-label">认证令牌:</div>
            <div :class="['status-value', tokenStatus.hasToken ? 'success' : 'error']">
              {{ tokenStatus.hasToken ? '已存在' : '未找到' }}
            </div>
            <a-button size="small" @click="checkToken">
              检查令牌
            </a-button>
            <a-button size="small" type="primary" @click="showTokenModal" :disabled="!tokenStatus.hasToken">
              查看令牌
            </a-button>
          </div>
          
          <div class="status-item">
            <div class="status-label">刷新令牌:</div>
            <div :class="['status-value', tokenStatus.hasRefreshToken ? 'success' : 'error']">
              {{ tokenStatus.hasRefreshToken ? '已存在' : '未找到' }}
            </div>
          </div>
          
          <div class="status-item">
            <div class="status-label">令牌有效期:</div>
            <div :class="['status-value', tokenStatus.isExpired ? 'error' : (tokenStatus.hasToken ? 'success' : 'warning')]">
              {{ tokenStatus.expiryText }}
            </div>
          </div>
        </div>
        
        <div class="token-actions">
          <a-button type="primary" @click="refreshToken" :disabled="!tokenStatus.hasRefreshToken">
            刷新令牌
          </a-button>
          <a-button danger @click="clearTokens">
            清除所有令牌
          </a-button>
        </div>
      </div>
    </div>
    
    <!-- 令牌查看模态窗 -->
    <a-modal 
      v-model:open="tokenModal.visible" 
      title="令牌详情" 
      width="700px"
    >
      <div class="token-details">
        <h3>访问令牌</h3>
        <pre class="token-data">{{ tokenModal.accessToken }}</pre>
        
        <h3>解码令牌内容</h3>
        <pre class="token-data">{{ tokenModal.decodedToken }}</pre>
        
        <h3>刷新令牌</h3>
        <pre class="token-data">{{ tokenModal.refreshToken || '未找到刷新令牌' }}</pre>
      </div>
      
      <template #footer>
        <a-button @click="tokenModal.visible = false">关闭</a-button>
        <a-button type="primary" @click="copyToken">复制访问令牌</a-button>
      </template>
    </a-modal>
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

// 代理对比测试
const compareTest = reactive({
  apiPath: '/api/stats/',
  loading: false,
  hasResults: false,
  direct: {
    url: '',
    result: '',
    status: '',
    success: false
  },
  proxy: {
    url: '',
    result: '',
    status: '',
    success: false
  },
  analysis: '',
  analysisType: 'info'
})

// 诊断结果
const diagnosticResults = ref([])
const diagnosticRunning = ref(false)

// HTTP状态检测
const httpTest = reactive({
  url: '',
  loading: false,
  hasResult: false,
  httpStatus: 0,
  httpStatusText: '',
  contentStatus: 0,
  contentStatusText: '',
  responseData: '',
  mismatch: false,
  directHeaders: '',
  proxyHeaders: '',
  headersDiff: []
})

// 令牌状态
const tokenStatus = reactive({
  hasToken: false,
  hasRefreshToken: false,
  isExpired: false,
  expiryText: '未到期'
})

// 令牌查看模态窗
const tokenModal = reactive({
  visible: false,
  accessToken: '',
  decodedToken: '',
  refreshToken: ''
})

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
    
    // 确保localStorage设置正确
    localStorage.setItem('useMockData', enabled ? 'true' : 'false')
    
    // 更新状态
    mockMode.value = enabled
    
    // 需要重新加载页面以应用更改
    message.info('正在重新加载页面以应用更改...')
    setTimeout(() => {
      window.location.reload()
    }, 1000)
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

// 运行代理对比测试
const runProxyTest = async () => {
  compareTest.loading = true;
  compareTest.hasResults = false;
  compareTest.analysis = '';
  
  try {
    // 设置请求路径
    const apiPath = compareTest.apiPath.trim();
    if (!apiPath) {
      message.error('请输入API路径');
      compareTest.loading = false;
      return;
    }
    
    // 确保路径正确
    const directPath = apiPath.startsWith('/api/') 
      ? apiPath.substring(4) // 移除/api前缀以便直接请求后端
      : apiPath;
    
    // 构建URL
    const directUrl = `http://127.0.0.1:8000/api${directPath.startsWith('/') ? directPath : '/' + directPath}`;
    const proxyUrl = apiPath.startsWith('/') ? apiPath : '/' + apiPath;
    
    compareTest.direct.url = directUrl;
    compareTest.proxy.url = proxyUrl;
    
    // 并行请求两个端点
    const [directResponse, proxyResponse] = await Promise.allSettled([
      axios.get(directUrl, { timeout: 5000 }),
      axios.get(proxyUrl, { timeout: 5000 })
    ]);
    
    // 处理直接请求结果
    if (directResponse.status === 'fulfilled') {
      compareTest.direct.success = true;
      compareTest.direct.status = `${directResponse.value.status} OK`;
      compareTest.direct.result = JSON.stringify(directResponse.value.data, null, 2);
    } else {
      compareTest.direct.success = false;
      compareTest.direct.status = directResponse.reason.response 
        ? `${directResponse.reason.response.status} ${directResponse.reason.response.statusText}`
        : '请求失败';
      compareTest.direct.result = directResponse.reason.response 
        ? JSON.stringify(directResponse.reason.response.data, null, 2)
        : directResponse.reason.message;
    }
    
    // 处理代理请求结果
    if (proxyResponse.status === 'fulfilled') {
      compareTest.proxy.success = true;
      compareTest.proxy.status = `${proxyResponse.value.status} OK`;
      compareTest.proxy.result = JSON.stringify(proxyResponse.value.data, null, 2);
    } else {
      compareTest.proxy.success = false;
      compareTest.proxy.status = proxyResponse.reason.response 
        ? `${proxyResponse.reason.response.status} ${proxyResponse.reason.response.statusText}`
        : '请求失败';
      compareTest.proxy.result = proxyResponse.reason.response 
        ? JSON.stringify(proxyResponse.reason.response.data, null, 2)
        : proxyResponse.reason.message;
    }
    
    // 分析结果
    analyzeResults();
    
  } catch (error) {
    console.error('执行代理对比测试时出错:', error);
    message.error('测试执行失败');
  } finally {
    compareTest.loading = false;
    compareTest.hasResults = true;
  }
};

// 分析代理测试结果
const analyzeResults = () => {
  if (compareTest.direct.success && compareTest.proxy.success) {
    compareTest.analysis = '两种方式请求都成功，代理配置正常。';
    compareTest.analysisType = 'success';
  } else if (compareTest.direct.success && !compareTest.proxy.success) {
    compareTest.analysis = '直接请求成功但代理请求失败，这表明代理配置有问题。检查vite.config.js中的代理设置。';
    compareTest.analysisType = 'error';
  } else if (!compareTest.direct.success && compareTest.proxy.success) {
    compareTest.analysis = '奇怪的情况：代理请求成功但直接请求失败。这可能是CORS问题或直接请求URL构建不正确。';
    compareTest.analysisType = 'warning';
  } else {
    compareTest.analysis = '两种方式请求都失败。请确认后端服务正在运行，并检查API路径是否正确。';
    compareTest.analysisType = 'error';
  }
};

// 检测HTTP状态码与响应内容
const testHttpResponse = async () => {
  httpTest.loading = true
  httpTest.hasResult = false
  httpTest.mismatch = false
  httpTest.headersDiff = []
  
  try {
    // 构建请求URL
    let testUrl = httpTest.url.trim();
    // 确保以/开头
    if (!testUrl.startsWith('/')) {
      testUrl = '/' + testUrl;
    }
    
    // 准备两种请求方式
    const directUrl = `http://127.0.0.1:8000${testUrl}`;
    const proxyUrl = testUrl;
    
    // 构建请求选项
    const token = localStorage.getItem('token');
    const directOptions = { 
      timeout: 5000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };
    
    const proxyOptions = { 
      timeout: 5000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };
    
    // 添加授权令牌
    if (token) {
      directOptions.headers.Authorization = `Bearer ${token}`;
      proxyOptions.headers.Authorization = `Bearer ${token}`;
    }
    
    // 进行请求
    let directResponse, proxyResponse;
    try {
      directResponse = await axios.get(directUrl, directOptions);
      httpTest.directHeaders = JSON.stringify(directOptions.headers, null, 2);
    } catch (error) {
      httpTest.directHeaders = JSON.stringify(error.config?.headers || directOptions.headers, null, 2);
    }
    
    try {
      proxyResponse = await axios.get(proxyUrl, proxyOptions);
      httpTest.proxyHeaders = JSON.stringify(proxyOptions.headers, null, 2);
    } catch (error) {
      // 记录请求头信息
      httpTest.proxyHeaders = JSON.stringify(error.config?.headers || proxyOptions.headers, null, 2);
      
      // 处理正常响应
      if (error.response) {
        proxyResponse = error.response;
      }
    }
    
    // 分析请求头差异
    const directHeadersObj = directOptions.headers;
    const proxyHeadersObj = proxyOptions.headers;
    const allHeaderKeys = [...new Set([...Object.keys(directHeadersObj), ...Object.keys(proxyHeadersObj)])];
    
    allHeaderKeys.forEach(key => {
      const directValue = directHeadersObj[key];
      const proxyValue = proxyHeadersObj[key];
      
      if (directValue !== proxyValue) {
        if (!directValue) {
          httpTest.headersDiff.push(`${key}: 在直接请求中不存在，代理请求值为 "${proxyValue}"`);
        } else if (!proxyValue) {
          httpTest.headersDiff.push(`${key}: 在代理请求中不存在，直接请求值为 "${directValue}"`);
        } else {
          httpTest.headersDiff.push(`${key}: 直接请求值为 "${directValue}"，代理请求值为 "${proxyValue}"`);
        }
      }
    });
    
    // 如果有代理响应，分析状态码和内容
    if (proxyResponse) {
      httpTest.httpStatus = proxyResponse.status;
      httpTest.httpStatusText = proxyResponse.statusText;
      
      if (proxyResponse.data && typeof proxyResponse.data === 'object' && proxyResponse.data.code !== undefined) {
        httpTest.contentStatus = proxyResponse.data.code;
        httpTest.contentStatusText = proxyResponse.data.message || '';
        
        if (httpTest.httpStatus !== httpTest.contentStatus) {
          httpTest.mismatch = true;
        }
      }
      
      httpTest.responseData = JSON.stringify(proxyResponse.data, null, 2);
    }
    
    httpTest.hasResult = true;
  } catch (error) {
    message.error('测试过程中出错: ' + (error.message || '未知错误'));
    httpTest.hasResult = false;
    httpTest.httpStatus = 0;
    httpTest.httpStatusText = '';
    httpTest.contentStatus = 0;
    httpTest.contentStatusText = '';
    httpTest.responseData = '';
    httpTest.mismatch = false;
    httpTest.directHeaders = '';
    httpTest.proxyHeaders = '';
    httpTest.headersDiff = [];
  } finally {
    httpTest.loading = false;
  }
}

// 检查令牌
const checkToken = async () => {
  tokenStatus.hasToken = !!localStorage.getItem('token');
  tokenStatus.hasRefreshToken = !!localStorage.getItem('refreshToken');
  
  // 检查令牌有效期
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const payload = decodeJwt(token);
      if (payload && payload.exp) {
        const expiry = new Date(payload.exp * 1000);
        const now = new Date();
        const diff = expiry - now;
        
        // 检查是否过期
        tokenStatus.isExpired = diff <= 0;
        
        if (tokenStatus.isExpired) {
          tokenStatus.expiryText = '已过期';
        } else {
          // 计算剩余时间
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          
          if (days > 0) {
            tokenStatus.expiryText = `${days}天${hours}小时后过期`;
          } else if (hours > 0) {
            tokenStatus.expiryText = `${hours}小时${minutes}分钟后过期`;
          } else {
            tokenStatus.expiryText = `${minutes}分钟后过期`;
          }
        }
      } else {
        tokenStatus.expiryText = '无法解析过期时间';
      }
    } catch (e) {
      console.error('令牌解析错误:', e);
      tokenStatus.expiryText = '令牌格式错误';
    }
  } else {
    tokenStatus.expiryText = '无令牌';
  }
}

// 显示令牌模态窗
const showTokenModal = () => {
  tokenModal.visible = true;
  const token = localStorage.getItem('token') || '';
  tokenModal.accessToken = token;
  
  try {
    // 解码JWT
    const payload = decodeJwt(token);
    tokenModal.decodedToken = JSON.stringify(payload, null, 2);
  } catch (e) {
    console.error('令牌解析错误:', e);
    tokenModal.decodedToken = '无法解析令牌：格式错误';
  }
  
  tokenModal.refreshToken = localStorage.getItem('refreshToken') || '';
}

// 解析JWT令牌
const decodeJwt = (token) => {
  if (!token) return null;
  
  // 移除可能的Bearer前缀
  if (token.startsWith('Bearer ')) {
    token = token.substring(7);
  }
  
  // 拆分JWT的三个部分
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('无效的JWT格式');
  }
  
  // 解码有效载荷部分
  try {
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (e) {
    console.error('JWT解码错误:', e);
    throw new Error('JWT解码失败');
  }
}

// 复制令牌
const copyToken = () => {
  try {
    const el = document.createElement('textarea');
    el.value = tokenModal.accessToken;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    message.success('令牌已复制到剪贴板');
  } catch (e) {
    console.error('复制失败:', e);
    message.error('复制失败');
  }
}

// 刷新令牌
const refreshToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    message.error('没有刷新令牌');
    return;
  }
  
  message.loading('正在刷新令牌...', 0);
  
  try {
    const response = await axios.post('/api/token/refresh/', { refresh: refreshToken }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (response.data && response.data.access) {
      // 保存新的访问令牌
      localStorage.setItem('token', response.data.access);
      message.success('令牌刷新成功');
      
      // 更新令牌状态
      checkToken();
    } else {
      message.error('刷新响应格式异常');
    }
  } catch (error) {
    console.error('刷新令牌失败:', error);
    message.error('刷新令牌失败: ' + (error.response?.data?.detail || error.message));
    
    // 如果刷新失败，可能需要清除令牌
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      checkToken();
    }
  } finally {
    message.destroy();
  }
}

// 清除所有令牌
const clearTokens = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  tokenStatus.hasToken = false;
  tokenStatus.hasRefreshToken = false;
  tokenStatus.isExpired = false;
  tokenStatus.expiryText = '未到期';
  message.success('所有令牌已清除');
}

// 组件挂载时运行基本检查
onMounted(() => {
  testApiConnection()
  checkDns()
  checkApiRoot()
  checkToken()
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

.section-desc {
  color: #666;
  margin-bottom: 16px;
  font-size: 14px;
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

h3 {
  margin-top: 16px;
  margin-bottom: 8px;
  font-size: 16px;
  color: #444;
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

.diagnostic-item.info {
  background-color: #e6f7ff;
  border: 1px solid #91d5ff;
}

.compare-results {
  margin-top: 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.compare-item {
  background-color: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 16px;
}

.compare-url {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  word-break: break-all;
}

.compare-analysis {
  grid-column: span 2;
  margin-top: 8px;
}

.http-analysis {
  margin-top: 20px;
}

.http-status {
  margin-bottom: 8px;
}

.label {
  font-weight: bold;
}

.value {
  margin-left: 8px;
}

.value.success {
  color: #52c41a;
}

.value.error {
  color: #f5222d;
}

.status-mismatch {
  margin-top: 8px;
  margin-bottom: 16px;
}

.action-section {
  margin-top: 16px;
}

.headers-analysis {
  margin-top: 20px;
}

.headers-section {
  display: flex;
  gap: 16px;
}

.headers-half {
  flex: 1;
}

.headers-data {
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  overflow: auto;
  max-height: 300px;
  font-family: monospace;
  white-space: pre-wrap;
}

.headers-diff {
  margin-top: 8px;
}

.diff-item {
  padding: 8px 12px;
  margin-bottom: 4px;
  border-radius: 4px;
  background-color: #fffbe6;
  border: 1px solid #ffe58f;
}

.token-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.token-status {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.token-actions {
  display: flex;
  gap: 12px;
}

.token-details {
  padding: 16px;
}

.token-data {
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  overflow: auto;
  max-height: 300px;
  font-family: monospace;
  white-space: pre-wrap;
}

.mode-monitor {
  margin-top: 16px;
}
</style> 