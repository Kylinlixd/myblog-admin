import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import './assets/tailwind.css'
import './styles/main.scss'
import { ElMessage } from 'element-plus'
import { useThemeStore } from './stores/theme'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 初始化主题
const themeStore = useThemeStore()
themeStore.initTheme()

// 全局错误处理
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue 错误:', err)
  console.error('组件:', vm)
  console.error('错误信息:', info)
  
  // 显示错误提示
  ElMessage.error('操作失败，请稍后重试')
  
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

app.use(router)
app.use(ElementPlus)
app.mount('#app')
