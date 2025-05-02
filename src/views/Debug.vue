<template>
  <div class="debug-container">
    <h1>调试页面</h1>
    
    <div class="debug-section">
      <h2>用户状态</h2>
      <div class="debug-info">
        <div class="debug-row">
          <strong>登录状态:</strong> {{ userStore.isLoggedIn ? '已登录' : '未登录' }}
        </div>
        <div class="debug-row">
          <strong>令牌:</strong> {{ maskToken(userStore.token) }}
        </div>
        <div class="debug-row">
          <strong>初始化状态:</strong> {{ userStore.initialized ? '已初始化' : '未初始化' }}
        </div>
      </div>
    </div>
    
    <div class="debug-section" v-if="userStore.userInfo">
      <h2>用户信息</h2>
      <pre>{{ JSON.stringify(userStore.userInfo, null, 2) }}</pre>
    </div>
    
    <div class="debug-section">
      <h2>路由信息</h2>
      <div class="debug-info">
        <div class="debug-row">
          <strong>当前路径:</strong> {{ route.path }}
        </div>
        <div class="debug-row">
          <strong>完整路径:</strong> {{ route.fullPath }}
        </div>
        <div class="debug-row">
          <strong>查询参数:</strong> {{ JSON.stringify(route.query) }}
        </div>
        <div class="debug-row">
          <strong>路由名称:</strong> {{ route.name }}
        </div>
      </div>
    </div>
    
    <div class="debug-section">
      <h2>操作</h2>
      <div class="actions">
        <a-button @click="refreshUserInfo" type="primary">刷新用户信息</a-button>
        <a-button @click="goToDashboard" type="primary">前往仪表盘</a-button>
        <a-button @click="logout" danger>退出登录</a-button>
      </div>
    </div>
    
    <div class="debug-section">
      <h2>本地存储</h2>
      <div class="debug-info">
        <div class="debug-row">
          <strong>localStorage.token:</strong> {{ maskToken(localStorage.getItem('token')) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useUserStore } from '../stores/user'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'

export default {
  name: 'DebugView',
  setup() {
    const userStore = useUserStore()
    const route = useRoute()
    const router = useRouter()
    
    const maskToken = (token) => {
      if (!token) return 'null'
      if (token.length <= 10) return token
      return token.substring(0, 5) + '...' + token.substring(token.length - 5)
    }
    
    const refreshUserInfo = async () => {
      try {
        await userStore.getUserInfo()
        message.success('用户信息已刷新')
      } catch (error) {
        message.error('刷新失败: ' + error.message)
      }
    }
    
    const goToDashboard = () => {
      router.push('/dashboard')
    }
    
    const logout = async () => {
      await userStore.logout()
      message.success('已退出登录')
      router.push('/login')
    }
    
    return {
      userStore,
      route,
      maskToken,
      refreshUserInfo,
      goToDashboard,
      logout
    }
  }
}
</script>

<style scoped>
.debug-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.debug-section {
  background: #f8f8f8;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

h1 {
  margin-bottom: 24px;
  color: #1890ff;
}

h2 {
  color: #444;
  margin-bottom: 12px;
}

.debug-info {
  font-size: 16px;
}

.debug-row {
  padding: 8px 0;
  border-bottom: 1px dashed #ddd;
}

.debug-row:last-child {
  border-bottom: none;
}

pre {
  background: #f0f0f0;
  padding: 12px;
  border-radius: 6px;
  overflow: auto;
  max-height: 300px;
}

.actions {
  display: flex;
  gap: 12px;
}
</style> 