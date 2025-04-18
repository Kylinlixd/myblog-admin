// 模拟数据入口文件
import dynamicsMock from './dynamics'
import axios from 'axios'

// 模拟的API路由映射
const apiMocks = {
  ...dynamicsMock
}

// 模拟数据拦截器
export const setupMock = () => {
  // 拦截所有fetch API请求
  window.fetch = new Proxy(window.fetch, {
    apply: function(target, thisArg, argumentsList) {
      const url = argumentsList[0]
      
      if (typeof url === 'string' && (url.includes('/api/') || url.includes('/blog/'))) {
        // 提取API路径
        const urlObj = new URL(url, window.location.origin)
        let path = urlObj.pathname
        
        // 检查是否有匹配的模拟数据
        if (apiMocks[path]) {
          console.log('[Mock] Fetch:', path)
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(apiMocks[path]())
          })
        }
      }
      
      // 没有匹配的模拟数据，继续使用原始fetch
      return target.apply(thisArg, argumentsList)
    }
  })
  
  // 拦截axios请求
  const originalAxiosAdapter = axios.defaults.adapter
  axios.defaults.adapter = async (config) => {
    const url = config.url
    // 检查请求路径中是否包含 /api/ 或 /blog/
    if (url && (url.includes('/api/') || url.includes('/blog/'))) {
      // 从路径中提取关键部分
      const path = url.startsWith('/') ? url : `/${url}`
      // 检查是否有匹配的模拟数据
      if (apiMocks[path]) {
        console.log('[Mock] Axios:', path)
        return {
          data: apiMocks[path](),
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
          request: {}
        }
      }
    }
    
    // 继续使用原始适配器
    return originalAxiosAdapter(config)
  }
  
  console.log('模拟数据已启用，拦截器已设置')
}

export default setupMock 