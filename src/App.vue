<template>
  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in" :duration="200">
      <keep-alive :include="cachedViews">
        <component :is="Component" />
      </keep-alive>
    </transition>
  </router-view>
  
  <!-- 加载状态显示，不阻断主组件渲染 -->
  <div v-if="appStore.isLoading" class="loading-overlay">
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <div class="loading-text">{{ appStore.loadingText }}</div>
    </div>
  </div>
  
  <!-- 开发环境下的路由调试信息 -->
  <div v-if="isDev" class="route-debug">
    <div class="debug-header">路由调试信息</div>
    <div>当前路径: {{ route.path }}</div>
    <div>完整路径: {{ route.fullPath }}</div>
    <div>路由名称: {{ route.name }}</div>
    <div>匹配到的路由: {{ JSON.stringify(route.matched.map(r => r.path)) }}</div>
    <div>参数: {{ JSON.stringify(route.params) }}</div>
    <div>查询参数: {{ JSON.stringify(route.query) }}</div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeMount, nextTick, computed, ref } from 'vue'
import { useThemeStore } from './stores/theme'
import { useAppStore } from './stores/app'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'

// 初始化主题和应用状态
const themeStore = useThemeStore()
const appStore = useAppStore()
const router = useRouter()
const route = useRoute()
const isDev = process.env.NODE_ENV === 'development'

// 跟踪需要缓存的视图
const cachedViews = computed(() => {
  return router.getRoutes()
    .filter(route => route.meta && route.meta.keepAlive)
    .map(route => route.name)
})

onBeforeMount(() => {
  // 初始页面加载时显示加载状态
  appStore.startLoading('正在初始化应用...')
  
  // 临时解决方案：由于后端接口返回500错误，默认启用模拟数据模式
  localStorage.setItem('useMockData', 'true')
  console.log('[App] 临时解决方案：由于后端接口问题，已默认启用模拟数据模式')
  
  // 不在这里注册路由守卫，避免和router/index.js中的守卫重复
  
  // 添加ESC键强制重置加载状态
  window.addEventListener('keydown', (event) => {
    // 按下ESC键重置加载状态
    if (event.key === 'Escape' && appStore.isLoading) {
      console.log('[App] 用户按下ESC键，强制重置加载状态')
      appStore.resetLoadingState()
      message.info('已强制重置加载状态')
    }
    
    // 按下Ctrl+Alt+R强制刷新当前页面
    if (event.ctrlKey && event.altKey && event.key === 'r') {
      console.log('[App] 用户按下Ctrl+Alt+R，强制刷新页面')
      appStore.resetLoadingState()
      const currentPath = router.currentRoute.value.fullPath
      router.push('/loading-redirect')
      setTimeout(() => {
        router.push(currentPath)
      }, 100)
      message.info('正在强制刷新页面...')
    }
  })
})

onMounted(async () => {
  // 并行初始化主题和结束加载状态
  await Promise.all([
    themeStore.initTheme(),
    new Promise(resolve => {
      // 确保至少显示加载状态500ms以避免闪烁
      setTimeout(() => {
        appStore.endLoading()
        // 监控LCP性能指标
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'largest-contentful-paint') {
              console.log('LCP:', entry.startTime)
              if (entry.startTime > 2500) {
                console.warn('LCP时间过长，请优化页面加载性能')
              }
            }
          }
        })
        observer.observe({type: 'largest-contentful-paint', buffered: true})
        resolve()
      }, 500)
    })
  ])
})

// 处理重试操作
const handleRetry = () => {
  // 重新加载当前页面
  const currentPath = router.currentRoute.value.fullPath
  appStore.retryLoading('正在重试...')
  
  // 先跳转到一个临时页面，然后再回到当前页面，强制重新加载
  router.push('/loading-redirect')
  setTimeout(() => {
    router.push(currentPath)
  }, 100)
}

const preloadComponents = () => {
  // 只预加载关键路由
  const importantRoutes = ['/dashboard', '/dynamics']
  importantRoutes.forEach(route => {
    router.resolve(route).matched.forEach(match => {
      if (match.components) {
        Object.values(match.components).forEach(component => {
          if (typeof component === 'function') {
            component()
          }
        })
      }
    })
  })
}

// 延迟预加载，避免阻塞初始渲染
setTimeout(preloadComponents, 2000)
</script>

<style lang="scss">
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.dark .loading-overlay {
  background-color: rgba(0, 0, 0, 0.7);
}

.loading-container {
  background-color: var(--background-color);
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.loading-spinner {
  margin-bottom: 10px;
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-radius: 50%;
  border-top-color: var(--primary-color);
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 14px;
  color: var(--text-color-secondary);
  margin-top: 10px;
}

// 确保内容区域有最小高度，防止闪烁
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

// 预加载关键字体
@font-face {
  font-family: 'Your-Primary-Font';
  font-display: swap; // 使用swap策略改善渲染
  src: local('系统字体'); // 使用系统字体作为后备
}

// 路由调试信息样式
.route-debug {
  position: fixed;
  bottom: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 10px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 9999;
  max-width: 400px;
  overflow: auto;
  max-height: 200px;
  font-family: monospace;
}

.debug-header {
  font-weight: bold;
  margin-bottom: 5px;
  color: #ff9800;
}
</style>