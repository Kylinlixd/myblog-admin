<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h2>博客管理系统</h2>
        <p class="subtitle">欢迎回来，请登录您的账号</p>
      </div>
      
      <form
        ref="loginForm"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <div class="form-item">
          <div class="input-wrapper">
            <el-input
              v-model="loginData.username"
              placeholder="用户名"
              :class="{ 'is-error': errors.username }"
            >
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
          </div>
          <span class="error-message" v-if="errors.username">{{ errors.username }}</span>
        </div>
        
        <div class="form-item">
          <div class="input-wrapper">
            <el-input
              v-model="loginData.password"
              type="password"
              placeholder="密码"
              :class="{ 'is-error': errors.password }"
              show-password
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </div>
          <span class="error-message" v-if="errors.password">{{ errors.password }}</span>
        </div>
        
        <div class="form-item">
          <el-button
            type="primary"
            native-type="submit"
            :loading="loading"
            class="login-button"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </div>
        
        <div class="form-footer">
          <span>还没有账号？</span>
          <router-link to="/register" class="link">立即注册</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useAppStore } from '../stores/app'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const appStore = useAppStore()
const loginForm = ref(null)
const loading = ref(false)

const loginData = reactive({
  username: '',
  password: ''
})

const errors = reactive({
  username: '',
  password: ''
})

const validateForm = () => {
  let isValid = true
  errors.username = ''
  errors.password = ''
  
  if (!loginData.username) {
    errors.username = '请输入用户名'
    isValid = false
  } else if (loginData.username.length < 3 || loginData.username.length > 20) {
    errors.username = '长度在 3 到 20 个字符'
    isValid = false
  }
  
  if (!loginData.password) {
    errors.password = '请输入密码'
    isValid = false
  } else if (loginData.password.length < 6 || loginData.password.length > 20) {
    errors.password = '长度在 6 到 20 个字符'
    isValid = false
  }
  
  return isValid
}

const handleLogin = async () => {
  if (!validateForm()) return
  
  loading.value = true
  try {
    const success = await userStore.login(loginData.username, loginData.password)
    
    if (success) {
      ElMessage.success('登录成功')
      // 获取重定向地址，如果没有则跳转到仪表盘
      const redirect = route.query.redirect || '/dashboard'
      
      // 设置全局加载状态
      appStore.startLoading('正在准备您的工作台...')
      
      // 显示加载状态足够长的时间，确保用户能看到
      setTimeout(() => {
        router.push(redirect)
      }, 1000)
    } else {
      errors.password = '用户名或密码错误'
    }
  } catch (error) {
    console.error('登录失败:', error)
    errors.password = '登录失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // 检查是否已经登录
  if (userStore.isLoggedIn) {
    router.push('/dashboard')
  }
})
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(-45deg, #336699, #003366, #0066cc, #0099ff);
  background-size: 400% 400%;
  animation: gradient 15s ease infinite;
  position: relative;
  overflow: hidden;
}

.login-box {
  width: 400px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.login-header h2 {
  margin: 0;
  font-size: 24px;
  color: #333;
  margin-bottom: 8px;
}

.subtitle {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.login-form {
  .form-item {
    margin-bottom: 20px;
  }
  
  .input-wrapper {
    margin-bottom: 8px;
  }
  
  .error-message {
    color: #f56c6c;
    font-size: 12px;
    margin-top: 4px;
  }
  
  .login-button {
    width: 100%;
    height: 40px;
  }
}

.form-footer {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #666;
  
  .link {
    color: #409eff;
    text-decoration: none;
    margin-left: 4px;
    
    &:hover {
      text-decoration: underline;
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