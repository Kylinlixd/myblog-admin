<template>
  <div class="not-found">
    <div class="error-code">404</div>
    <h1 class="error-title">页面未找到</h1>
    <p class="error-message">抱歉，您访问的页面不存在或已被移动</p>
    <div class="actions">
      <a-button type="primary" @click="goHome">返回首页</a-button>
      <a-button @click="goBack">返回上一页</a-button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/dashboard')
}

const goBack = () => {
  router.go(-1)
}
</script>

<style scoped>
.not-found {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: var(--background-color);
  text-align: center;
}

.error-code {
  font-size: 150px;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 16px;
  line-height: 1;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.error-title {
  font-size: 32px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px 0;
}

.error-message {
  font-size: 18px;
  color: var(--text-secondary);
  margin-bottom: 40px;
}

.actions {
  display: flex;
  gap: 16px;
}
</style> 