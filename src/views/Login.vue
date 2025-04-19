<template>
  <div class="login-container">
    <!-- 添加漂浮的多边形碎片，但让它们不影响登录框 -->
    <div class="floating-shape" v-for="n in 21" :key="n" :style="shapeStyles[n-1]"></div>
    
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

// 预生成所有浮动形状的样式，避免在重新渲染时重新生成
const shapeStyles = Array(21).fill(null).map(() => generateRandomStyle())

// 生成随机样式函数
function generateRandomStyle() {
  // 随机位置
  const top = Math.random() * 100 + '%'
  const left = Math.random() * 100 + '%'
  
  // 随机大小
  const width = 30 + Math.random() * 120 + 'px'
  const height = 30 + Math.random() * 120 + 'px'
  
  // 随机旋转角度
  const rotate = Math.random() * 360 + 'deg'
  const skewX = -20 + Math.random() * 40 + 'deg'
  const skewY = -20 + Math.random() * 40 + 'deg'
  
  // 随机动画参数
  const duration = 15 + Math.random() * 15 + 's'
  const moveX = -100 + Math.random() * 200 + 'px'
  const moveY = -100 + Math.random() * 200 + 'px'
  
  // 随机倾斜和3D旋转
  const transform = `rotate(${rotate}) skewX(${skewX}) skewY(${skewY})`
  
  // 随机透明度
  const opacity = 0.1 + Math.random() * 0.5
  
  // 随机z-index，保证层叠效果
  const zIndex = Math.floor(Math.random() * 10)

  return {
    top,
    left,
    width,
    height,
    transform,
    opacity,
    '--duration': duration,
    '--move-x': moveX,
    '--move-y': moveY,
    '--rotate': rotate,
    'z-index': zIndex
  }
}

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

<style lang="scss" scoped>
.login-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(-45deg, #1a4a8d, #2989d8, #207cca, #26a0da);
  background-size: 400% 400%;
  animation: gradient 12s ease infinite;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0) 50%),
      radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0) 50%);
    pointer-events: none;
  }

  /* 添加漂浮的多边形 */
  .floating-shape {
    position: absolute;
    background: linear-gradient(135deg, 
                rgba(255, 255, 255, 0.15) 0%, 
                rgba(255, 255, 255, 0.05) 50%, 
                rgba(255, 255, 255, 0.02) 100%);
    border: 1px solid rgba(255, 255, 255, 0.4);
    box-shadow: 
      0 4px 15px rgba(0, 0, 0, 0.2),
      0 0 0 1px rgba(255, 255, 255, 0.1) inset,
      0 0 30px rgba(255, 255, 255, 0.05),
      0 0 8px rgba(255, 255, 255, 0.3) inset;
    backdrop-filter: blur(2px);
    animation: float-move var(--duration) ease-in-out infinite alternate,
               float-rotate calc(var(--duration) * 1.5) linear infinite;
    filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.3));
    transform-style: preserve-3d;
    perspective: 500px;
    clip-path: polygon(
      var(--clip1, 0%) var(--clip2, 0%), 
      var(--clip3, 100%) var(--clip4, 0%), 
      var(--clip5, 100%) var(--clip6, 100%), 
      var(--clip7, 0%) var(--clip8, 100%)
    );
    will-change: transform;
    z-index: -5;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(45deg, 
                  rgba(255, 255, 255, 0.3) 0%, 
                  rgba(255, 255, 255, 0) 60%);
      opacity: 0.7;
    }
  }

  // 手动设置每个多边形的clip-path值，形成不规则形状
  .floating-shape:nth-child(1) { --clip1: 5%; --clip2: 8%; --clip3: 95%; --clip4: 10%; --clip5: 85%; --clip6: 90%; --clip7: 15%; --clip8: 88%; }
  .floating-shape:nth-child(2) { --clip1: 12%; --clip2: 3%; --clip3: 85%; --clip4: 18%; --clip5: 92%; --clip6: 85%; --clip7: 8%; --clip8: 95%; }
  .floating-shape:nth-child(3) { --clip1: 8%; --clip2: 15%; --clip3: 90%; --clip4: 5%; --clip5: 80%; --clip6: 90%; --clip7: 25%; --clip8: 75%; }
  .floating-shape:nth-child(4) { --clip1: 18%; --clip2: 12%; --clip3: 88%; --clip4: 22%; --clip5: 95%; --clip6: 78%; --clip7: 5%; --clip8: 95%; }
  .floating-shape:nth-child(5) { --clip1: 2%; --clip2: 8%; --clip3: 98%; --clip4: 15%; --clip5: 85%; --clip6: 92%; --clip7: 18%; --clip8: 82%; }
  .floating-shape:nth-child(6) { --clip1: 15%; --clip2: 5%; --clip3: 90%; --clip4: 25%; --clip5: 95%; --clip6: 80%; --clip7: 10%; --clip8: 90%; }
  .floating-shape:nth-child(7) { --clip1: 10%; --clip2: 18%; --clip3: 95%; --clip4: 8%; --clip5: 88%; --clip6: 95%; --clip7: 12%; --clip8: 85%; }
  .floating-shape:nth-child(8) { --clip1: 5%; --clip2: 12%; --clip3: 85%; --clip4: 15%; --clip5: 92%; --clip6: 85%; --clip7: 20%; --clip8: 95%; }
  .floating-shape:nth-child(9) { --clip1: 15%; --clip2: 5%; --clip3: 92%; --clip4: 18%; --clip5: 85%; --clip6: 90%; --clip7: 8%; --clip8: 85%; }
  .floating-shape:nth-child(10) { --clip1: 8%; --clip2: 15%; --clip3: 88%; --clip4: 5%; --clip5: 95%; --clip6: 88%; --clip7: 15%; --clip8: 92%; }
  .floating-shape:nth-child(11) { --clip1: 12%; --clip2: 8%; --clip3: 95%; --clip4: 12%; --clip5: 82%; --clip6: 95%; --clip7: 5%; --clip8: 88%; }
  .floating-shape:nth-child(12) { --clip1: 5%; --clip2: 18%; --clip3: 85%; --clip4: 8%; --clip5: 90%; --clip6: 85%; --clip7: 18%; --clip8: 80%; }
  .floating-shape:nth-child(13) { --clip1: 18%; --clip2: 5%; --clip3: 92%; --clip4: 15%; --clip5: 88%; --clip6: 90%; --clip7: 12%; --clip8: 92%; }
  .floating-shape:nth-child(14) { --clip1: 8%; --clip2: 12%; --clip3: 88%; --clip4: 22%; --clip5: 95%; --clip6: 82%; --clip7: 5%; --clip8: 85%; }
  .floating-shape:nth-child(15) { --clip1: 15%; --clip2: 8%; --clip3: 95%; --clip4: 5%; --clip5: 85%; --clip6: 95%; --clip7: 18%; --clip8: 90%; }
  .floating-shape:nth-child(16) { --clip1: 10%; --clip2: 15%; --clip3: 90%; --clip4: 18%; --clip5: 92%; --clip6: 80%; --clip7: 8%; --clip8: 95%; }
  .floating-shape:nth-child(17) { --clip1: 5%; --clip2: 18%; --clip3: 85%; --clip4: 12%; --clip5: 80%; --clip6: 88%; --clip7: 15%; --clip8: 75%; }
  .floating-shape:nth-child(18) { --clip1: 18%; --clip2: 5%; --clip3: 92%; --clip4: 15%; --clip5: 88%; --clip6: 92%; --clip7: 10%; --clip8: 95%; }
  .floating-shape:nth-child(19) { --clip1: 8%; --clip2: 12%; --clip3: 88%; --clip4: 8%; --clip5: 95%; --clip6: 85%; --clip7: 18%; --clip8: 90%; }
  .floating-shape:nth-child(20) { --clip1: 12%; --clip2: 18%; --clip3: 95%; --clip4: 22%; --clip5: 82%; --clip6: 95%; --clip7: 5%; --clip8: 82%; }
  .floating-shape:nth-child(21) { --clip1: 15%; --clip2: 5%; --clip3: 90%; --clip4: 15%; --clip5: 85%; --clip6: 88%; --clip7: 12%; --clip8: 95%; }
}

.login-box {
  width: 400px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border-radius: 12px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.3) inset;
  border: 1px solid rgba(255, 255, 255, 0.3);
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
  z-index: 20;
  
  &::before {
    content: '';
    position: absolute;
    top: -10px;
    left: -10px;
    right: -10px;
    bottom: -10px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);
    z-index: -1;
  }
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 
      0 15px 40px rgba(0, 0, 0, 0.3),
      0 0 0 1px rgba(255, 255, 255, 0.4) inset;
  }
}

.login-header {
  text-align: center;
  margin-bottom: 40px;

  h2 {
    margin: 0;
    font-size: 24px;
    color: #333;
    margin-bottom: 8px;
  }
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
    color: var(--el-color-danger);
    font-size: 12px;
  }
  
  .login-button {
    width: 100%;
    height: 40px;
    font-size: 16px;
  }
  
  .form-footer {
    text-align: center;
    margin-top: 20px;
    color: #666;
    
    .link {
      color: var(--el-color-primary);
      text-decoration: none;
      margin-left: 8px;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
}

@keyframes gradient {
  0% {
    background-position: 0% 50%;
  }
  25% {
    background-position: 50% 100%;
  }
  50% {
    background-position: 100% 50%;
  }
  75% {
    background-position: 50% 0%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@keyframes float-move {
  0% {
    transform: translate3d(0, 0, 0) rotateX(5deg) rotateY(5deg);
  }
  25% {
    transform: translate3d(calc(var(--move-x) * 0.3), calc(var(--move-y) * 0.7), 20px) rotateX(-10deg) rotateY(8deg);
  }
  50% {
    transform: translate3d(calc(var(--move-x) * 0.7), calc(var(--move-y) * 0.3), 10px) rotateX(12deg) rotateY(-5deg);
  }
  75% {
    transform: translate3d(calc(var(--move-x) * 0.5), calc(var(--move-y) * 0.9), 30px) rotateX(-8deg) rotateY(12deg);
  }
  100% {
    transform: translate3d(var(--move-x), var(--move-y), 15px) rotateX(10deg) rotateY(-10deg);
  }
}

@keyframes float-rotate {
  from {
    transform: rotate(0deg) rotateZ(0deg);
  }
  to {
    transform: rotate(var(--rotate)) rotateZ(45deg);
  }
}

@keyframes float {
  from {
    transform: translateY(0) rotate(var(--rotate, 0deg));
  }
  to {
    transform: translateY(20px) rotate(var(--rotate, 0deg));
  }
}

:global([data-theme='dark']) {
  .login-box {
    background: rgba(0, 0, 0, 0.8);
  }
  
  .login-header h2 {
    color: #fff;
  }
  
  .subtitle {
    color: #999;
  }
  
  .form-footer {
    color: #999;
  }
}
</style> 