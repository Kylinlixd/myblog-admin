<template>
  <div class="dynamics-test-page">
    <h1>动态API测试页面</h1>
    
    <el-card class="test-card">
      <template #header>
        <div class="card-header">
          <span>前台博客动态API测试</span>
          <el-button type="primary" @click="fetchBlogDynamics">获取博客动态</el-button>
        </div>
      </template>
      
      <div v-loading="blogLoading">
        <div class="api-info">
          <p><strong>API地址:</strong> {{ blogApiUrl }}</p>
          <p><strong>状态码:</strong> {{ blogResponse.status }}</p>
        </div>
        
        <div v-if="blogResponse.data && blogResponse.data.length > 0" class="dynamics-list">
          <h3>博客动态列表</h3>
          <el-table :data="blogResponse.data" border style="width: 100%">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="title" label="标题" width="200" />
            <el-table-column prop="content" label="内容" />
            <el-table-column label="创建时间" width="180">
              <template #default="scope">
                {{ formatDate(scope.row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
        
        <div v-else-if="blogResponse.status && !blogLoading" class="no-data">
          <el-empty description="暂无动态数据" />
        </div>
        
        <div class="response-json">
          <h3>完整响应数据</h3>
          <pre>{{ JSON.stringify(blogResponse, null, 2) }}</pre>
        </div>
      </div>
    </el-card>
    
    <el-card class="test-card">
      <template #header>
        <div class="card-header">
          <span>后台管理动态API测试</span>
          <el-button type="primary" @click="fetchAdminDynamics">获取管理动态</el-button>
        </div>
      </template>
      
      <div v-loading="adminLoading">
        <div class="api-info">
          <p><strong>API地址:</strong> {{ adminApiUrl }}</p>
          <p><strong>状态码:</strong> {{ adminResponse.status }}</p>
        </div>
        
        <div v-if="adminResponse.data && adminResponse.data.items" class="dynamics-list">
          <h3>管理动态列表</h3>
          <el-table :data="adminResponse.data.items" border style="width: 100%">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="title" label="标题" width="200" />
            <el-table-column prop="content" label="内容" />
            <el-table-column label="创建时间" width="180">
              <template #default="scope">
                {{ formatDate(scope.row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination-info">
            <p>总数: {{ adminResponse.data.total || 0 }}</p>
            <p>当前页: {{ adminResponse.data.page || 1 }}</p>
            <p>每页条数: {{ adminResponse.data.pageSize || 10 }}</p>
          </div>
        </div>
        
        <div v-else-if="adminResponse.status && !adminLoading" class="no-data">
          <el-empty description="暂无动态数据" />
        </div>
        
        <div class="response-json">
          <h3>完整响应数据</h3>
          <pre>{{ JSON.stringify(adminResponse, null, 2) }}</pre>
        </div>
      </div>
    </el-card>
    
    <el-card class="test-card">
      <template #header>
        <div class="card-header">
          <span>API URL分析</span>
        </div>
      </template>
      
      <div class="api-analysis">
        <h3>环境变量</h3>
        <p><strong>VITE_APP_API_BASE_URL:</strong> {{ apiBaseUrl || '未设置' }}</p>
        <p><strong>当前API前缀:</strong> {{ apiPrefix }}</p>
        
        <h3>请求配置</h3>
        <p>请检查以下文件中的配置：</p>
        <ul>
          <li><code>src/utils/request.js</code> - Axios实例配置</li>
          <li><code>src/utils/blogRequest.js</code> - 博客前台Axios实例配置</li>
          <li><code>src/api/dynamic.js</code> - 动态API调用</li>
          <li><code>src/api/blog.js</code> - 博客前台API调用</li>
          <li><code>.env.development</code> - 开发环境变量</li>
        </ul>
        
        <h3>修复前后对比</h3>
        <div class="comparison">
          <div class="before">
            <h4>修复前</h4>
            <ul>
              <li>blogRequest baseURL: <code>/blog</code></li>
              <li>API调用: <code>/dynamics</code></li>
              <li>实际请求URL: <code>/blog/dynamics</code></li>
              <li>当使用apiPrefix (<code>/api/</code>)时: <code>/api/blog/dynamics</code></li>
              <li>blogRequest发送请求: <code>/api/blog/blog/dynamics</code> (重复前缀)</li>
            </ul>
          </div>
          <div class="after">
            <h4>修复后</h4>
            <ul>
              <li>blogRequest baseURL: <code>''</code> (空字符串)</li>
              <li>API调用: <code>/blog/dynamics</code></li>
              <li>实际请求URL: <code>/blog/dynamics</code></li>
              <li>当使用apiPrefix (<code>/api/</code>)时: <code>/api/blog/dynamics</code></li>
              <li>blogRequest发送请求: <code>/api/blog/dynamics</code> (正确路径)</li>
            </ul>
          </div>
        </div>
        
        <h3>问题诊断</h3>
        <div v-if="hasUrlPrefixIssue" class="issue-detected">
          <el-alert
            title="检测到URL前缀重复问题"
            type="warning"
            description="API请求路径可能存在前缀重复问题（如/api/api/）。请检查API基础URL配置和请求URL拼接逻辑。"
            show-icon
            :closable="false"
          />
        </div>
        <div v-else class="issue-fixed">
          <el-alert
            title="URL路径配置正确"
            type="success"
            description="修复成功！API请求路径格式正确，避免了前缀重复问题。"
            show-icon
            :closable="false"
          />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

// 状态变量
const blogLoading = ref(false)
const adminLoading = ref(false)
const blogResponse = ref({})
const adminResponse = ref({})

// 环境变量
const apiBaseUrl = import.meta.env.VITE_APP_API_BASE_URL || ''
const apiPrefix = computed(() => {
  if (apiBaseUrl) {
    return apiBaseUrl.endsWith('/') ? apiBaseUrl : apiBaseUrl + '/'
  }
  return '/api/'
})

// API URL
const blogApiUrl = computed(() => `/blog/dynamics`)
const adminApiUrl = computed(() => `${apiPrefix.value}dynamics`)

// 判断是否存在URL前缀重复问题
const hasUrlPrefixIssue = computed(() => {
  return blogApiUrl.value.includes('/api/api/') || adminApiUrl.value.includes('/api/api/')
})

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString()
}

// 获取前台博客动态
const fetchBlogDynamics = async () => {
  blogLoading.value = true
  blogResponse.value = {}
  
  try {
    console.log('正在请求博客动态API:', blogApiUrl.value)
    const response = await axios.get(blogApiUrl.value)
    blogResponse.value = response.data
    console.log('博客动态API响应:', response)
  } catch (error) {
    console.error('获取博客动态失败:', error)
    blogResponse.value = {
      status: error.response?.status || 'error',
      message: error.message,
      error: error.response?.data || error.toString()
    }
    ElMessage.error(`获取博客动态失败: ${error.message}`)
  } finally {
    blogLoading.value = false
  }
}

// 获取后台管理动态
const fetchAdminDynamics = async () => {
  adminLoading.value = true
  adminResponse.value = {}
  
  try {
    // 获取token
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('未登录，请先登录后再测试后台API')
    }
    
    console.log('正在请求管理动态API:', adminApiUrl.value)
    const response = await axios.get(adminApiUrl.value, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    adminResponse.value = response.data
    console.log('管理动态API响应:', response)
  } catch (error) {
    console.error('获取管理动态失败:', error)
    adminResponse.value = {
      status: error.response?.status || 'error',
      message: error.message,
      error: error.response?.data || error.toString()
    }
    ElMessage.error(`获取管理动态失败: ${error.message}`)
  } finally {
    adminLoading.value = false
  }
}

// 组件加载时自动检测环境
onMounted(() => {
  console.log('动态测试页面加载完成')
  console.log('API基础URL:', apiBaseUrl)
  console.log('API前缀:', apiPrefix.value)
  console.log('博客动态API:', blogApiUrl.value)
  console.log('管理动态API:', adminApiUrl.value)
})
</script>

<style scoped>
.dynamics-test-page {
  padding: 20px;
}

h1 {
  margin-bottom: 20px;
  font-size: 24px;
}

.test-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.api-info {
  margin-bottom: 20px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.dynamics-list {
  margin-bottom: 20px;
}

.pagination-info {
  margin: 15px 0;
  display: flex;
  gap: 20px;
}

.no-data {
  margin: 30px 0;
}

.response-json {
  margin-top: 20px;
}

.response-json pre {
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  overflow: auto;
  max-height: 300px;
}

.api-analysis {
  padding: 15px;
}

.issue-detected {
  margin-top: 15px;
}

.comparison {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.before, .after {
  flex: 1;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.before h4, .after h4 {
  margin-bottom: 10px;
}

.before ul, .after ul {
  list-style-type: disc;
  padding-left: 20px;
}

.issue-fixed {
  margin-top: 15px;
}
</style> 