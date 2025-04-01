<template>
  <div class="not-found">
    <div class="content">
      <h1>404</h1>
      <h2>页面未找到</h2>
      <p>抱歉，您访问的页面不存在</p>
      <router-link to="/" class="back-home">
        返回首页
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  // 3秒后自动返回首页
  setTimeout(() => {
    router.push('/')
  }, 3000)
})
</script>

<style scoped lang="scss">
.not-found {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(-45deg, #336699, #003366, #0066cc, #0099ff);
  background-size: 400% 400%;
  animation: gradient 15s ease infinite;
  
  .content {
    text-align: center;
    color: white;
    padding: 2rem;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 1rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    
    h1 {
      font-size: 8rem;
      margin: 0;
      line-height: 1;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
    }
    
    h2 {
      font-size: 2rem;
      margin: 1rem 0;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
    }
    
    p {
      font-size: 1.2rem;
      margin-bottom: 2rem;
      opacity: 0.9;
    }
    
    .back-home {
      display: inline-block;
      padding: 0.8rem 2rem;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 2rem;
      color: white;
      text-decoration: none;
      transition: all 0.3s ease;
      
      &:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateY(-2px);
      }
    }
  }
}

@keyframes gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
</style> 