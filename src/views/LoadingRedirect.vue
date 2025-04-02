<template>
  <div class="loading-redirect">
    <div class="loader"></div>
    <p class="text">正在重新加载页面...</p>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  // 组件渲染后，默认返回首页
  // 实际跳转逻辑由App.vue中的handleRetry处理
  setTimeout(() => {
    // 默认回退逻辑，通常不会执行到这里
    const backPath = sessionStorage.getItem('lastVisitedPath') || '/dashboard'
    router.replace(backPath)
  }, 1000)
})
</script>

<style scoped>
.loading-redirect {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: var(--background-color);
}

.loader {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: var(--primary-color);
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

.text {
  font-size: 18px;
  color: var(--text-primary);
  margin: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style> 