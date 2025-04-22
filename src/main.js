import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import App from './App.vue'
import router from './router'
import '@/styles/tailwind.css'
import './styles/main.scss'
import { message } from 'ant-design-vue'
import { useThemeStore } from './stores/theme'
import { useUserStore } from './stores/user'

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
      if (route.components && route.components.default && typeof route.components.default === 'function') {
        // 异步预加载
        route.components.default().catch(err => {
          console.warn('预加载组件失败:', route.name, err)
        })
      }
    })
  }, 2000) // 延迟2秒，确保主应用已完成初始渲染
}

// 创建应用实例
const app = createApp(App)

// 添加API请求URL验证（开发环境）
if (process.env.NODE_ENV === 'development') {
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
const pinia = createPinia()
app.use(pinia)

// 初始化用户状态
const userStore = useUserStore()
userStore.initialize().then(() => {
  console.log('用户状态初始化完成')
}).catch(error => {
  console.error('用户状态初始化失败:', error)
})

// 使用 Ant Design Vue
app.use(Antd)

// 使用路由
app.use(router)

// 初始化主题
const themeStore = useThemeStore()
themeStore.initTheme()

// 全局错误处理
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue 错误:', err)
  console.error('组件:', vm)
  console.error('错误信息:', info)
  
  // 显示错误提示
  message.error('操作失败，请稍后重试')
  
  // 可以在这里添加错误上报逻辑
  if (process.env.NODE_ENV === 'production') {
    // reportError(err)
  }
}

// 性能监控
if (process.env.NODE_ENV === 'production') {
  // 页面加载性能
  window.addEventListener('load', () => {
    const timing = window.performance.timing
    const loadTime = timing.loadEventEnd - timing.navigationStart
    console.log('页面加载时间:', loadTime)
    // reportPerformance('load', loadTime)
  })
  
  // 资源加载性能
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach(entry => {
      if (entry.initiatorType === 'img') {
        console.log('图片加载时间:', entry.duration)
        // reportPerformance('image', entry.duration)
      }
    })
  })
  observer.observe({ entryTypes: ['resource'] })
}

// 预加载组件，在app挂载前进行
preloadComponents()

// 注册 Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful')
      })
      .catch(err => {
        console.log('ServiceWorker registration failed: ', err)
      })
  })
}

// 挂载应用
app.mount('#app')
