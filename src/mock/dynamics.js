// 动态管理模拟数据
import { format } from 'date-fns'

// 生成模拟数据
const generateMockDynamics = (count = 20) => {
  const dynamics = []
  const types = ['text', 'image', 'audio', 'video']
  const status = ['published', 'draft']
  
  for (let i = 1; i <= count; i++) {
    const type = types[Math.floor(Math.random() * types.length)]
    const createdAt = format(new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd HH:mm:ss')
    
    const dynamic = {
      id: `dyn-${i}`,
      content: `这是一条${type}类型的动态内容，编号: ${i}`,
      type,
      status: status[Math.floor(Math.random() * status.length)],
      createdAt,
      updatedAt: createdAt
    }
    
    // 根据类型添加对应资源
    if (type === 'image') {
      dynamic.images = [
        { url: 'https://via.placeholder.com/800x400', width: 800, height: 400 },
        { url: 'https://via.placeholder.com/400x400', width: 400, height: 400 }
      ]
    } else if (type === 'audio') {
      dynamic.audio = {
        url: 'https://example.com/audio/sample.mp3',
        duration: 180
      }
    } else if (type === 'video') {
      dynamic.video = {
        url: 'https://example.com/video/sample.mp4',
        cover: 'https://via.placeholder.com/800x450',
        duration: 120
      }
    }
    
    dynamics.push(dynamic)
  }
  
  return dynamics
}

// 模拟的动态列表
const mockDynamics = generateMockDynamics()

// 模拟API响应 - 后台管理
const adminDynamicListResponse = () => {
  return {
    code: 200,
    message: 'success',
    data: {
      list: mockDynamics,
      total: mockDynamics.length
    }
  }
}

// 模拟API响应 - 前台展示 (只返回已发布的动态)
const frontDynamicListResponse = () => {
  const publishedDynamics = mockDynamics.filter(item => item.status === 'published')
  return {
    code: 200,
    message: 'success',
    data: {
      list: publishedDynamics,
      total: publishedDynamics.length
    }
  }
}

// 模拟动态详情API响应 - 后台管理
const adminDynamicDetailResponse = (id) => {
  const dynamic = mockDynamics.find(item => item.id === id) || mockDynamics[0]
  
  return {
    code: 200,
    message: 'success',
    data: dynamic
  }
}

// 模拟动态详情API响应 - 前台展示 (只返回已发布的动态)
const frontDynamicDetailResponse = (id) => {
  const dynamic = mockDynamics.find(item => item.id === id && item.status === 'published')
  
  if (!dynamic) {
    return {
      code: 404,
      message: '动态不存在或未发布',
      data: null
    }
  }
  
  return {
    code: 200,
    message: 'success',
    data: dynamic
  }
}

// 模拟创建动态API响应
const createDynamicResponse = () => {
  return {
    code: 200,
    message: 'success',
    data: {
      id: `dyn-${mockDynamics.length + 1}`
    }
  }
}

// 模拟删除动态API响应
const deleteDynamicResponse = () => {
  return {
    code: 200,
    message: 'success',
    data: null
  }
}

// 模拟更新动态API响应
const updateDynamicResponse = () => {
  return {
    code: 200,
    message: 'success',
    data: null
  }
}

// 导出API路由映射
export default {
  // 后台管理API
  '/dynamics': adminDynamicListResponse,
  '/dynamics/:id': adminDynamicDetailResponse,
  
  // 前台博客API
  '/blog/dynamics': frontDynamicListResponse,
  '/blog/dynamics/:id': frontDynamicDetailResponse,
  
  // 其他API
  '/dynamics/create': createDynamicResponse,
  '/dynamics/update/:id': updateDynamicResponse,
  '/dynamics/delete/:id': deleteDynamicResponse
} 