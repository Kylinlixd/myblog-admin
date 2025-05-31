import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
// import Element Plus
// import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import '@/styles/tailwind.css'
import './styles/main.scss'
import { message } from 'ant-design-vue'
import { pinia, useUserStore } from './stores'

// 确定环境
const isProd = process.env.NODE_ENV === 'production'

// 创建应用实例
const app = createApp(App)

// 生产环境错误处理
if (isProd) {
  // 设置全局错误处理程序
  window.addEventListener('error', (event) => {
    console.error('全局错误:', event.error)
    
    // 可以添加错误上报逻辑
    // reportError({ 
    //   message: event.error?.message || '未知错误',
    //   stack: event.error?.stack,
    //   url: window.location.href
    // })
    
    // 防止错误显示在控制台
    event.preventDefault()
  })
  
  // 捕获未处理的Promise异常
  window.addEventListener('unhandledrejection', (event) => {
    console.error('未处理的Promise错误:', event.reason)
    
    // 可以添加错误上报逻辑
    // reportError({
    //   message: '未处理的Promise错误',
    //   detail: String(event.reason),
    //   url: window.location.href
    // })
    
    // 防止错误显示在控制台
    event.preventDefault()
  })
} else {
  // 开发环境下：添加API请求URL验证
  console.log('开发环境启用API请求URL验证')
  // 验证前端请求是否正确发送
  const originalFetch = window.fetch
  window.fetch = function(url, options) {
    if (typeof url === 'string' && (url.startsWith('/blog') || url.startsWith('/api'))) {
      console.log('[请求拦截] 通过fetch发送请求:', url)
      // 确保URL是相对路径，会通过开发服务器代理
      if (url.startsWith('http')) {
        console.warn('[请求拦截] 检测到绝对URL，这可能导致CORS问题或绕过代理:', url)
      }
    }
    return originalFetch.apply(this, arguments)
  }
}

// 初始化 Pinia
app.use(pinia)

// 初始化 Ant Design Vue
app.use(Antd)

// 初始化路由
app.use(router)

// 全局错误处理
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue 错误:', err)
  
  if (!isProd) {
    console.error('组件:', vm)
    console.error('错误信息:', info)
  }
  
  // 显示错误提示 - 在生产环境下使用更友好的提示
  if (isProd) {
    message.error('应用出现问题，请刷新页面')
  } else {
    message.error('操作失败，请稍后重试')
  }
  
  // 在生产环境中上报错误
  if (isProd) {
    // 可以添加错误上报逻辑
    // reportError({
    //   message: err.message,
    //   component: vm.$options.name || 'unknown',
    //   info: info,
    //   stack: err.stack,
    //   url: window.location.href
    // })
  }
}

// 挂载应用
app.mount('#app')

// 挂载后初始化用户状态
const userStore = useUserStore()
// 检查当前路径是否是博客前台页面，避免在博客页面发送不必要的API请求
const isBlogPage = window.location.pathname.startsWith('/blog')
if (!isBlogPage) {
  userStore.initialize().then(() => {
    if (!isProd) {
      console.log('用户状态初始化完成')
    }
  }).catch(error => {
    console.error('用户状态初始化失败:', error)
  })
} else {
  if (!isProd) {
    console.log('博客前台页面，跳过用户状态初始化')
  }
}

// 性能监控
if (isProd) {
  // 页面加载性能
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (window.performance) {
        const timing = window.performance.timing
        const loadTime = timing.loadEventEnd - timing.navigationStart
        console.log('页面加载时间:', loadTime)
        
        // 收集关键性能指标
        const performanceData = {
          loadTime: loadTime,
          domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
          tcpTime: timing.connectEnd - timing.connectStart,
          dns: timing.domainLookupEnd - timing.domainLookupStart,
          ttfb: timing.responseStart - timing.requestStart,
          pageUrl: window.location.href
        }
        
        // 可以添加性能上报逻辑
        // reportPerformance(performanceData)
      }
    }, 0)
  })
}

// 预加载常用组件
const preloadComponents = () => {
  // 获取主要路由组件并预加载
  const routes = router.getRoutes()
  const importantRoutes = routes.filter(route => 
    route.meta && (route.meta.preload || route.name === 'Dashboard' || route.name === 'BlogHome')
  )
  
  // 延迟预加载重要组件，让主应用先渲染完成
  setTimeout(() => {
    console.log('开始预加载重要组件')
    importantRoutes.forEach(route => {
      // 排除blog相关组件以避免不必要的API请求
      if (route.path.includes('/blog')) {
        return; // 跳过博客相关组件的预加载
      }
      
      if (route.components && route.components.default && typeof route.components.default === 'function') {
        // 异步预加载
        route.components.default().catch(err => {
          console.warn('预加载组件失败:', route.name, err)
        })
      }
    })
  }, 2000) // 延迟2秒，确保主应用已完成初始渲染
}

// 应用挂载后预加载组件
preloadComponents()
