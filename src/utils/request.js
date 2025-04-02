import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'
import { useAppStore } from '../stores/app'

// 判断是否使用模拟数据
const useMockData = () => {
  return import.meta.env.VITE_USE_MOCK === 'true' || process.env.NODE_ENV === 'development'
}

// 创建 axios 实例
const service = axios.create({
  baseURL: '/api', // 使用/api前缀，与后端接口对应
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

// 请求拦截器
service.interceptors.request.use(
  config => {
    increasePendingCount()
    
    // 从 localStorage 获取 token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => {
    decreasePendingCount()
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    decreasePendingCount()
    const res = response.data
    
    // 如果响应成功
    if (res.code === 200) {
      return res
    }
    
    // 处理业务错误
    ElMessage.error(res.message || '操作失败')
    
    // 将错误信息传递给应用状态
    const appStore = useAppStore()
    appStore.setLoadingError(res.message || '操作失败')
    
    return Promise.reject(new Error(res.message || '操作失败'))
  },
  error => {
    decreasePendingCount()
    console.error('响应错误:', error)
    
    // 超时错误特别处理
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      ElMessage.error('请求超时，请检查网络连接')
      const appStore = useAppStore()
      appStore.setLoadingError('请求超时，请检查网络连接')
      return Promise.reject(error)
    }
    
    // 处理 HTTP 错误
    if (error.response) {
      const appStore = useAppStore()
      switch (error.response.status) {
        case 401:
          // 未授权，清除 token 并跳转到登录页
          localStorage.removeItem('token')
          appStore.setLoadingError('登录已过期，请重新登录')
          router.push('/login')
          ElMessage.error('登录已过期，请重新登录')
          break
        case 403:
          appStore.setLoadingError('没有权限访问')
          ElMessage.error('没有权限访问')
          break
        case 404:
          appStore.setLoadingError('请求的资源不存在')
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          appStore.setLoadingError('服务器错误')
          ElMessage.error('服务器错误')
          break
        default:
          appStore.setLoadingError(error.response.data?.message || '请求失败')
          ElMessage.error(error.response.data?.message || '请求失败')
      }
    } else if (error.request) {
      const appStore = useAppStore()
      appStore.setLoadingError('网络错误，请检查网络连接')
      ElMessage.error('网络错误，请检查网络连接')
    } else {
      const appStore = useAppStore()
      appStore.setLoadingError('请求配置错误')
      ElMessage.error('请求配置错误')
    }
    
    return Promise.reject(error)
  }
)

// 模拟数据映射
const MOCK_API_MAP = {
  // 仪表盘统计
  '/stats': {
    code: 200,
    message: '获取统计数据成功',
    data: {
      postCount: 24,
      categoryCount: 6,
      tagCount: 18,
      totalViews: 4328
    }
  },
  // 文章列表
  '/posts': {
    code: 200,
    message: '获取文章列表成功',
    data: {
      total: 24,
      items: Array(10).fill(0).map((_, i) => ({
        id: i + 1,
        title: `文章标题 ${i + 1}`,
        summary: `这是文章 ${i + 1} 的摘要...`,
        categoryId: i % 3 + 1,
        categoryName: `分类${i % 3 + 1}`,
        tags: [
          { id: i % 5 + 1, name: `标签${i % 5 + 1}` },
          { id: (i + 2) % 5 + 1, name: `标签${(i + 2) % 5 + 1}` }
        ],
        status: i % 2 === 0 ? 'published' : 'draft',
        views: 100 + Math.floor(Math.random() * 500),
        createTime: new Date(Date.now() - i * 86400000).toISOString().replace('T', ' ').slice(0, 19),
        updateTime: new Date(Date.now() - i * 43200000).toISOString().replace('T', ' ').slice(0, 19)
      }))
    }
  },
  // 登录
  '/auth/login': {
    code: 200,
    message: '登录成功',
    data: {
      token: 'mock_token_12345',
      userInfo: {
        id: 1,
        username: 'admin',
        nickname: '管理员',
        avatar: 'https://avatars.githubusercontent.com/u/12345678'
      }
    }
  },
  // 注册
  '/auth/register': {
    code: 200,
    message: '注册成功',
    data: {
      token: 'mock_token_12345',
      userInfo: {
        id: 1,
        username: 'newuser',
        nickname: '新用户',
        avatar: 'https://avatars.githubusercontent.com/u/12345678'
      }
    }
  },
  // 用户信息
  '/auth/info': {
    code: 200,
    message: '获取用户信息成功',
    data: {
      id: 1,
      username: 'admin',
      nickname: '管理员',
      avatar: 'https://avatars.githubusercontent.com/u/12345678'
    }
  },
  // 分类列表
  '/categories': {
    code: 200,
    message: '获取分类列表成功',
    data: [
      {
        id: 1,
        name: '前端开发',
        description: '前端技术相关的文章',
        createTime: '2023-01-15 10:30:00',
        updateTime: '2023-01-15 10:30:00'
      },
      {
        id: 2,
        name: '后端技术',
        description: '后端开发相关的文章',
        createTime: '2023-01-15 10:35:00',
        updateTime: '2023-01-15 10:35:00'
      },
      {
        id: 3,
        name: '数据库',
        description: '数据库相关的文章',
        createTime: '2023-01-15 10:40:00',
        updateTime: '2023-01-15 10:40:00'
      },
      {
        id: 4,
        name: '算法',
        description: '算法相关的文章',
        createTime: '2023-01-15 10:45:00',
        updateTime: '2023-01-15 10:45:00'
      },
      {
        id: 5,
        name: '开发工具',
        description: '开发工具相关的文章',
        createTime: '2023-01-15 10:50:00',
        updateTime: '2023-01-15 10:50:00'
      },
      {
        id: 6,
        name: '职场成长',
        description: '职场相关的文章',
        createTime: '2023-01-15 10:55:00',
        updateTime: '2023-01-15 10:55:00'
      }
    ]
  },
  // 标签列表
  '/tags': {
    code: 200,
    message: '获取标签列表成功',
    data: [
      { id: 1, name: 'JavaScript', createTime: '2023-01-15 11:00:00', updateTime: '2023-01-15 11:00:00' },
      { id: 2, name: 'Vue', createTime: '2023-01-15 11:05:00', updateTime: '2023-01-15 11:05:00' },
      { id: 3, name: 'React', createTime: '2023-01-15 11:10:00', updateTime: '2023-01-15 11:10:00' },
      { id: 4, name: 'Node.js', createTime: '2023-01-15 11:15:00', updateTime: '2023-01-15 11:15:00' },
      { id: 5, name: 'TypeScript', createTime: '2023-01-15 11:20:00', updateTime: '2023-01-15 11:20:00' },
      { id: 6, name: 'CSS', createTime: '2023-01-15 11:25:00', updateTime: '2023-01-15 11:25:00' },
      { id: 7, name: 'HTML', createTime: '2023-01-15 11:30:00', updateTime: '2023-01-15 11:30:00' },
      { id: 8, name: 'MySQL', createTime: '2023-01-15 11:35:00', updateTime: '2023-01-15 11:35:00' },
      { id: 9, name: 'MongoDB', createTime: '2023-01-15 11:40:00', updateTime: '2023-01-15 11:40:00' },
      { id: 10, name: 'Redis', createTime: '2023-01-15 11:45:00', updateTime: '2023-01-15 11:45:00' }
    ]
  },
  // Token刷新
  '/token/refresh': {
    code: 200,
    message: '刷新Token成功',
    data: {
      token: 'mock_refreshed_token_12345'
    }
  }
}

// 简单版本的模拟API响应
const mockApiResponse = (url, params) => {
  return new Promise((resolve, reject) => {
    // 模拟网络延迟
    const delay = 500 + Math.random() * 500 // 500-1000ms延迟
    
    setTimeout(() => {
      // 查找匹配的模拟数据
      const mockData = MOCK_API_MAP[url]
      if (mockData) {
        // 处理最近文章数量限制
        if (url === '/posts/recent' && params?.limit) {
          const limit = parseInt(params.limit)
          const clonedData = JSON.parse(JSON.stringify(mockData))
          clonedData.data = clonedData.data.slice(0, limit)
          resolve(clonedData)
        } else {
          resolve(JSON.parse(JSON.stringify(mockData)))
        }
      } else {
        reject(new Error(`未找到模拟数据: ${url}`))
      }
    }, delay)
  })
}

// 请求方法封装
const request = {
  async get(url, params) {
    console.log(`[Request] GET ${url}`, params)
    
    // 使用模拟数据
    if (useMockData() && MOCK_API_MAP[url]) {
      try {
        return await mockApiResponse(url, params)
      } catch (error) {
        console.warn('使用模拟数据失败，尝试真实请求', error)
      }
    }
    
    // 真实请求
    try {
      return await service.get(url, { params })
    } catch (error) {
      console.error(`请求失败: ${url}`, error)
      throw error
    }
  },
  
  async post(url, data) {
    console.log(`[Request] POST ${url}`, data)
    try {
      return await service.post(url, data)
    } catch (error) {
      console.error(`请求失败: ${url}`, error)
      throw error
    }
  },
  
  async put(url, data) {
    console.log(`[Request] PUT ${url}`, data)
    try {
      return await service.put(url, data)
    } catch (error) {
      console.error(`请求失败: ${url}`, error)
      throw error
    }
  },
  
  async delete(url, params) {
    console.log(`[Request] DELETE ${url}`, params)
    try {
      return await service.delete(url, { params })
    } catch (error) {
      console.error(`请求失败: ${url}`, error)
      throw error
    }
  }
}

export default request