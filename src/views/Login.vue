<template>
  <div class="login-container">
    <!-- 添加漂浮的多边形碎片，但让它们不影响登录框 -->
    <div class="floating-shape" v-for="n in 10" :key="n" :style="shapeStyles[n-1]"></div>
    
    <div class="login-box">
      <div class="login-header">
        <h2>博客管理系统</h2>
        <p class="subtitle">欢迎回来，请登录您的账号</p>
      </div>
      
      <a-form
        class="login-form"
        :model="loginData"
        @finish="handleLogin"
      >
        <div v-if="loginError" class="error-message">
          <a-alert :message="loginError" type="error" show-icon />
        </div>
        
        <div class="form-item">
          <div class="input-wrapper">
            <a-form-item
              name="username"
              :rules="[{ required: true, message: '请输入用户名' }]"
            >
              <a-input
                v-model:value="loginData.username"
                placeholder="用户名"
                size="large"
              >
                <template #prefix>
                  <UserOutlined />
                </template>
              </a-input>
            </a-form-item>
          </div>
        </div>
        
        <div class="form-item">
          <div class="input-wrapper">
            <a-form-item
              name="password"
              :rules="[{ required: true, message: '请输入密码' }]"
            >
              <a-input-password
                v-model:value="loginData.password"
                placeholder="密码"
                size="large"
              >
                <template #prefix>
                  <LockOutlined />
                </template>
              </a-input-password>
            </a-form-item>
          </div>
        </div>
        
        <div class="form-item">
          <a-button
            type="primary"
            html-type="submit"
            :loading="loading"
            class="login-button"
            size="large"
            block
          >
            {{ loading ? '登录中...' : '登录' }}
          </a-button>
        </div>
        
        <div class="form-footer">
          <span>还没有账号？</span>
          <router-link to="/register" class="link">立即注册</router-link>
        </div>
      </a-form>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useAppStore } from '../stores/app'
import { message } from 'ant-design-vue'
// 分别导入图标组件
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue'

export default {
  name: 'LoginView',
  components: {
    UserOutlined,
    LockOutlined
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const userStore = useUserStore()
    const appStore = useAppStore()
    const loading = ref(false)
    const loginError = ref('')

    const loginData = reactive({
      username: '',
      password: ''
    })

    // 优化预生成样式逻辑，减少形状数量提高性能
    const shapeStyles = computed(() => {
      const styles = []
      for (let i = 0; i < 10; i++) {
        styles.push(generateRandomStyle())
      }
      return styles
    })

    // 生成随机样式函数
    function generateRandomStyle() {
      // 随机位置
      const top = Math.random() * 100 + '%'
      const left = Math.random() * 100 + '%'
      
      // 随机大小 - 减小形状以减轻渲染负担
      const width = 30 + Math.random() * 80 + 'px'
      const height = 30 + Math.random() * 80 + 'px'
      
      // 随机旋转角度
      const rotate = Math.random() * 360 + 'deg'
      const skewX = -10 + Math.random() * 20 + 'deg'
      const skewY = -10 + Math.random() * 20 + 'deg'
      
      // 随机动画参数 - 增加持续时间减少CPU使用
      const duration = 20 + Math.random() * 20 + 's'
      const moveX = -50 + Math.random() * 100 + 'px'
      const moveY = -50 + Math.random() * 100 + 'px'
      
      // 随机倾斜和3D旋转
      const transform = `rotate(${rotate}) skewX(${skewX}) skewY(${skewY})`
      
      // 随机透明度
      const opacity = 0.05 + Math.random() * 0.2
      
      // 随机z-index，保证层叠效果
      const zIndex = Math.floor(Math.random() * 5)

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

    const handleLogin = async () => {
      loading.value = true
      loginError.value = ''
      
      try {
        const success = await userStore.login(loginData.username, loginData.password)
        
        if (success) {
          message.success('登录成功')
          // 获取重定向地址，如果没有则跳转到仪表盘
          const redirect = route.query.redirect || '/dashboard'
          
          // 设置全局加载状态
          appStore.startLoading('正在准备您的工作台...')
          
          // 显示加载状态足够长的时间，确保用户能看到
          setTimeout(() => {
            router.push(redirect)
          }, 1000)
        } else {
          loginError.value = '用户名或密码错误'
        }
      } catch (error) {
        console.error('登录失败:', error)
        loginError.value = '登录失败，请稍后重试'
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      // 检查是否已经登录
      if (userStore.isLoggedIn) {
        router.push('/dashboard')
      }
      
      // 设置初始值
      if (process.env.NODE_ENV === 'development') {
        loginData.username = 'admin'
        loginData.password = 'admin'
      }
    })

    return {
      loginData,
      loading,
      loginError,
      handleLogin,
      shapeStyles
    }
  }
}
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
      0 0 0 1px rgba(255, 255, 255, 0.1) inset;
    backdrop-filter: blur(2px);
    animation: float-move var(--duration) ease-in-out infinite alternate;
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
}

.error-message {
  margin-bottom: 16px;
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
      color: #1890ff; // Ant Design 主颜色
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
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@keyframes float-move {
  0% {
    transform: translate3d(0, 0, 0) rotate(0deg);
  }
  100% {
    transform: translate3d(var(--move-x), var(--move-y), 0) rotate(var(--rotate));
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