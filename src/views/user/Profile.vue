<template>
  <div class="profile-container">
    <div class="page-header">
      <h2 class="page-title">个人资料</h2>
    </div>
    
    <el-card class="profile-card">
      <template #header>
        <div class="card-header">
          <span>基本信息</span>
        </div>
      </template>
      
      <div class="profile-info">
        <div class="avatar-container">
          <el-avatar :size="120" :src="userInfo.avatar || defaultAvatar">
            {{ userInfo.nickname?.charAt(0) || userInfo.username?.charAt(0) }}
          </el-avatar>
        </div>
        
        <div class="info-list">
          <div class="info-item">
            <span class="label">用户名：</span>
            <span class="value">{{ userInfo.username }}</span>
          </div>
          <div class="info-item">
            <span class="label">昵称：</span>
            <span class="value">{{ userInfo.nickname }}</span>
          </div>
        </div>
      </div>
    </el-card>
    
    <el-card class="password-card">
      <template #header>
        <div class="card-header">
          <span>修改密码</span>
        </div>
      </template>
      
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="100px"
        @submit.prevent="handlePasswordChange"
      >
        <el-form-item label="原密码" prop="oldPassword">
          <el-input
            v-model="passwordForm.oldPassword"
            type="password"
            placeholder="请输入原密码"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="请输入新密码"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handlePasswordChange">
            保存修改
          </el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../../stores/user'
import { changePassword } from '../../api/auth'
import defaultAvatar from '../../assets/default-avatar.png'

const userStore = useUserStore()
const passwordFormRef = ref(null)
const loading = ref(false)

const userInfo = computed(() => userStore.userInfo || {})

// 密码表单
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 密码表单验证规则
const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6个字符', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 重置表单
const resetForm = () => {
  if (passwordFormRef.value) {
    passwordFormRef.value.resetFields()
  }
}

// 修改密码
const handlePasswordChange = async () => {
  if (!passwordFormRef.value) return
  
  try {
    await passwordFormRef.value.validate()
    
    loading.value = true
    
    await changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })
    
    ElMessage.success('密码修改成功')
    resetForm()
  } catch (error) {
    console.error('密码修改失败:', error)
    if (error.message) {
      ElMessage.error(error.message)
    } else {
      ElMessage.error('密码修改失败，请重试')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.profile-container {
  padding: 24px;
  
  .page-header {
    margin-bottom: 24px;
    
    .page-title {
      margin: 0;
      font-size: 24px;
      color: #303133;
    }
  }
  
  .profile-card, .password-card {
    margin-bottom: 24px;
    
    .card-header {
      font-weight: 500;
      color: #606266;
    }
  }
  
  .profile-info {
    display: flex;
    align-items: center;
    
    .avatar-container {
      margin-right: 40px;
    }
    
    .info-list {
      .info-item {
        margin-bottom: 16px;
        
        .label {
          font-weight: 500;
          color: #606266;
          margin-right: 8px;
        }
        
        .value {
          color: #303133;
        }
      }
    }
  }
}
</style> 