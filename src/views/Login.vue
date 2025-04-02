<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <div class="logo-container">
          <img src="../assets/logo.png" alt="Logo" class="logo" />
          <div class="logo-glow"></div>
        </div>
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
            <i class="icon-user"></i>
            <input
              v-model="loginData.username"
              type="text"
              placeholder="用户名"
              class="inspira-input"
              :class="{ 'is-error': errors.username }"
            />
          </div>
          <span class="error-message" v-if="errors.username">{{ errors.username }}</span>
        </div>
        
        <div class="form-item">
          <div class="input-wrapper">
            <i class="icon-lock"></i>
            <input
              v-model="loginData.password"
              type="password"
              placeholder="密码"
              class="inspira-input"
              :class="{ 'is-error': errors.password }"
            />
            <i 
              class="icon-eye" 
              :class="{ 'is-active': showPassword }"
              @click="togglePassword"
            ></i>
          </div>
          <span class="error-message" v-if="errors.password">{{ errors.password }}</span>
        </div>
        
        <div class="form-item">
          <button
            type="submit"
            class="inspira-button"
            :disabled="loading"
          >
            <span class="button-content">
              <i class="icon-arrow-right" v-if="!loading"></i>
              <span>{{ loading ? '登录中...' : '登录' }}</span>
            </span>
          </button>
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
import { ref, reactive, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useAppStore } from '../stores/app'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const appStore = useAppStore()
const loginForm = ref(null)
const loading = ref(false)
const showPassword = ref(false)

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

const togglePassword = () => {
  showPassword.value = !showPassword.value
  const passwordInput = document.querySelector('input[type="password"]')
  if (passwordInput) {
    passwordInput.type = showPassword.value ? 'text' : 'password'
  }
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
</script>

<style scoped lang="scss">
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
  
  &::before {
    content: '';
    position: absolute;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(0, 255, 255, 0.2) 0%, transparent 70%);
    animation: rotate 20s linear infinite;
    will-change: transform;
  }
  
  .login-box {
    width: 400px;
    padding: 40px;
    background: rgba(51, 102, 153, 0.2);
    backdrop-filter: blur(20px);
    border-radius: 24px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(0, 255, 255, 0.3);
    position: relative;
    z-index: 1;
    transform: translateY(0);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    will-change: transform;
    
    &:hover {
      transform: translateY(-10px);
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
    }
    
    .login-header {
      text-align: center;
      margin-bottom: 40px;
      
      .logo-container {
        position: relative;
        display: inline-block;
        margin-bottom: 20px;
        
        .logo {
          width: 80px;
          height: 80px;
          filter: drop-shadow(0 0 20px rgba(0, 255, 255, 0.5));
        }
      }
      
      h2 {
        margin: 0;
        font-size: 32px;
        color: #ffffff;
        margin-bottom: 12px;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        font-weight: 600;
      }
      
      .subtitle {
        margin: 0;
        font-size: 16px;
        color: rgba(204, 204, 204, 0.9);
        opacity: 0.9;
      }
    }
    
    .login-form {
      .form-item {
        margin-bottom: 20px;
        
        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          height: 44px;
          background: rgba(51, 102, 153, 0.2);
          border: 1px solid rgba(0, 255, 255, 0.3);
          border-radius: 22px;
          padding: 0 15px;
          transition: all 0.3s ease;
          
          &:hover, &:focus-within {
            background: rgba(51, 102, 153, 0.3);
            border-color: rgba(0, 255, 255, 0.6);
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.2);
            transform: translateY(-2px);
          }
          
          i {
            font-size: 18px;
            color: rgba(0, 255, 255, 0.8);
            margin-right: 10px;
          }
          
          .inspira-input {
            background: transparent;
            border: none;
            color: #ffffff;
            flex: 1;
            height: 100%;
            outline: none;
            font-size: 16px;
            
            &::placeholder {
              color: rgba(255, 255, 255, 0.6);
            }
          }
          
          .icon-eye {
            cursor: pointer;
            opacity: 0.7;
            transition: opacity 0.3s ease;
            
            &:hover {
              opacity: 1;
            }
            
            &.is-active {
              color: rgba(0, 255, 255, 1);
            }
          }
        }
        
        .error-message {
          display: block;
          color: #ff6b6b;
          font-size: 14px;
          margin-top: 8px;
          padding-left: 15px;
        }
      }
      
      .inspira-button {
        width: 100%;
        height: 44px;
        background: linear-gradient(45deg, #336699, #0099ff);
        border: none;
        border-radius: 22px;
        color: #ffffff;
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        }
        
        &:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        
        .button-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
      }
      
      .form-footer {
        text-align: center;
        margin-top: 20px;
        color: rgba(255, 255, 255, 0.7);
        font-size: 14px;
        
        .link {
          color: rgba(0, 255, 255, 0.8);
          text-decoration: none;
          font-weight: 500;
          margin-left: 5px;
          
          &:hover {
            text-decoration: underline;
          }
        }
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

@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style> 