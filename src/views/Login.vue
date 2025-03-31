<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <img src="../assets/logo.png" alt="Logo" class="logo" />
        <h2>博客管理系统</h2>
        <p class="subtitle">欢迎回来，请登录您的账号</p>
      </div>
      
      <el-form
        ref="loginForm"
        :model="loginData"
        :rules="rules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginData.username"
            placeholder="用户名"
            :prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginData.password"
            type="password"
            placeholder="密码"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            class="login-button"
            :loading="loading"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const loginForm = ref(null)
const loading = ref(false)

const loginData = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginForm.value) return
  
  try {
    await loginForm.value.validate()
    loading.value = true
    
    // TODO: 实现实际的登录逻辑
    setTimeout(() => {
      ElMessage.success('登录成功')
      router.push('/')
    }, 1000)
  } catch (error) {
    console.error('表单验证失败:', error)
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
  background: linear-gradient(135deg, var(--primary-light) 0%, var(--bg-color) 100%);
  
  .login-box {
    width: 400px;
    padding: 40px;
    background-color: var(--bg-light);
    border-radius: var(--border-radius);
    box-shadow: var(--box-shadow);
    
    .login-header {
      text-align: center;
      margin-bottom: 40px;
      
      .logo {
        width: 64px;
        height: 64px;
        margin-bottom: 16px;
      }
      
      h2 {
        margin: 0;
        font-size: 24px;
        color: var(--text-primary);
        margin-bottom: 8px;
      }
      
      .subtitle {
        margin: 0;
        font-size: 14px;
        color: var(--text-secondary);
      }
    }
    
    .login-form {
      .el-input {
        --el-input-border-color: var(--border-color);
        --el-input-hover-border-color: var(--primary-color);
        --el-input-focus-border-color: var(--primary-color);
      }
      
      .login-button {
        width: 100%;
        height: 40px;
        font-size: 16px;
        background-color: var(--primary-color);
        border-color: var(--primary-color);
        
        &:hover {
          background-color: var(--primary-dark);
          border-color: var(--primary-dark);
        }
      }
    }
  }
}
</style> 