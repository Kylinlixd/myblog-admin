<script setup>
import { onMounted, onBeforeMount, nextTick } from 'vue'
import { useThemeStore } from './stores/theme'
import { useAppStore } from './stores/app'
import { useRouter } from 'vue-router'
import PageLoading from './components/PageLoading.vue'

// 初始化主题和应用状态
const themeStore = useThemeStore()
const appStore = useAppStore()
const router = useRouter()

onBeforeMount(() => {
  // 初始页面加载时显示加载状态
  appStore.startLoading('正在初始化应用...')
  
  // 监听路由变化，强制每次路由切换都显示加载状态
  router.beforeEach((to, from, next) => {
    console.log('App路由切换:', from.path, '->', to.path)
    
    // 重置错误状态
    appStore.hasError = false
    appStore.startLoading(to.meta.loadingText || '页面加载中...')
    next()
  })
})

onMounted(() => {
  // 初始化主题
  themeStore.initTheme()
  
  // 应用加载完成后，延迟关闭加载状态
  setTimeout(() => {
    appStore.endLoading()
  }, 800) // 延长初始加载时间，确保用户能看到加载状态
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
</script>

<template>
  <!-- 全局页面加载组件 -->
  <PageLoading 
    :show="appStore.isLoading" 
    :text="appStore.loadingText"
    :has-error="appStore.hasError"
    :can-retry="true"
    @hide="appStore.endLoading()" 
    @retry="handleRetry"
  />

  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
</template>

<style lang="scss">
/* 全局过渡动画样式 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
