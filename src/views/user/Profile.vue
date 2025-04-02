<template>
  <div class="profile-container">
    <div class="page-header">
      <h2 class="page-title">个人资料</h2>
    </div>
    
    <el-card class="profile-card">
      <template #header>
        <div class="card-header">
          <span>基本信息</span>
          <el-button 
            type="primary" 
            size="small" 
            @click="isEditingProfile = true" 
            v-if="!isEditingProfile"
          >
            编辑资料
          </el-button>
        </div>
      </template>
      
      <div class="profile-info" v-if="!isEditingProfile">
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
            <span class="value">{{ userInfo.nickname || '未设置' }}</span>
          </div>
          <div class="info-item">
            <span class="label">邮箱：</span>
            <span class="value">{{ userInfo.email || '未设置' }}</span>
          </div>
          <div class="info-item">
            <span class="label">个人简介：</span>
            <span class="value">{{ userInfo.bio || '未设置' }}</span>
          </div>
          <div class="info-item">
            <span class="label">注册时间：</span>
            <span class="value">{{ formatDate(userInfo.createdAt) }}</span>
          </div>
          <div class="info-item">
            <span class="label">最后更新：</span>
            <span class="value">{{ formatDate(userInfo.updatedAt) }}</span>
          </div>
        </div>
      </div>
      
      <div class="profile-edit" v-else>
        <el-form
          ref="profileFormRef"
          :model="profileForm"
          :rules="profileRules"
          label-width="100px"
        >
          <el-form-item label="头像">
            <div class="avatar-upload">
              <el-avatar :size="100" :src="profileForm.avatar || defaultAvatar">
                {{ profileForm.nickname?.charAt(0) || userInfo.username?.charAt(0) }}
              </el-avatar>
              <el-upload
                class="upload-btn"
                action="/api/upload/avatar"
                :show-file-list="false"
                :on-success="handleAvatarSuccess"
                :before-upload="beforeAvatarUpload"
              >
                <el-button type="primary" size="small">更换头像</el-button>
              </el-upload>
            </div>
          </el-form-item>
          
          <el-form-item label="昵称" prop="nickname">
            <el-input v-model="profileForm.nickname" placeholder="请输入昵称" />
          </el-form-item>
          
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="profileForm.email" placeholder="请输入邮箱" />
          </el-form-item>
          
          <el-form-item label="个人简介" prop="bio">
            <el-input
              v-model="profileForm.bio"
              type="textarea"
              :rows="4"
              placeholder="请输入个人简介"
            />
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" :loading="profileLoading" @click="handleProfileUpdate">
              保存资料
            </el-button>
            <el-button @click="cancelProfileEdit">取消</el-button>
          </el-form-item>
        </el-form>
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
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../../stores/user'
import { changePassword } from '../../api/auth'
import defaultAvatar from '../../assets/default-avatar.png'

const userStore = useUserStore()
const passwordFormRef = ref(null)
const profileFormRef = ref(null)
const loading = ref(false)
const profileLoading = ref(false)
const isEditingProfile = ref(false)

const userInfo = computed(() => userStore.userInfo || {})

// 资料表单
const profileForm = reactive({
  nickname: '',
  email: '',
  bio: '',
  avatar: ''
})

// 密码表单
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 初始化个人资料表单
const initProfileForm = () => {
  profileForm.nickname = userInfo.value.nickname || ''
  profileForm.email = userInfo.value.email || ''
  profileForm.bio = userInfo.value.bio || ''
  profileForm.avatar = userInfo.value.avatar || ''
}

// 取消编辑个人资料
const cancelProfileEdit = () => {
  isEditingProfile.value = false
  initProfileForm()
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知'
  const date = new Date(dateString)
  return date.toLocaleString()
}

// 头像上传前的验证
const beforeAvatarUpload = (file) => {
  const isJPG = file.type === 'image/jpeg'
  const isPNG = file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPG && !isPNG) {
    ElMessage.error('头像图片只能是 JPG 或 PNG 格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('头像图片大小不能超过 2MB!')
    return false
  }
  return true
}

// 头像上传成功的回调
const handleAvatarSuccess = (res) => {
  if (res.code === 200 && res.data) {
    profileForm.avatar = res.data.url
    ElMessage.success('头像上传成功')
  } else {
    ElMessage.error(res.message || '头像上传失败')
  }
}

// 更新个人资料
const handleProfileUpdate = async () => {
  if (!profileFormRef.value) return
  
  try {
    await profileFormRef.value.validate()
    
    profileLoading.value = true
    
    // 调用更新用户资料的API
    await userStore.updateProfile({
      nickname: profileForm.nickname,
      email: profileForm.email,
      bio: profileForm.bio,
      avatar: profileForm.avatar
    })
    
    ElMessage.success('个人资料更新成功')
    isEditingProfile.value = false
  } catch (error) {
    console.error('更新个人资料失败:', error)
    ElMessage.error(error.message || '更新个人资料失败')
  } finally {
    profileLoading.value = false
  }
}

// 资料表单验证规则
const profileRules = {
  nickname: [
    { max: 20, message: '昵称不能超过20个字符', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  bio: [
    { max: 200, message: '个人简介不能超过200个字符', trigger: 'blur' }
  ]
}

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

// 页面加载时初始化表单
onMounted(() => {
  initProfileForm()
})
</script>

<style scoped lang="scss">
.profile-container {
  padding: 24px;
  
  .page-header {
    margin-bottom: 24px;
    
    .page-title {
      margin: 0;
      font-size: 24px;
      color: var(--text-primary);
    }
  }
  
  .profile-card, .password-card {
    margin-bottom: 24px;
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 500;
      color: var(--text-secondary);
    }
  }
  
  .profile-info {
    display: flex;
    
    .avatar-container {
      margin-right: 40px;
    }
    
    .info-list {
      flex: 1;
      
      .info-item {
        margin-bottom: 16px;
        display: flex;
        
        .label {
          font-weight: 500;
          color: var(--text-secondary);
          margin-right: 8px;
          width: 100px;
        }
        
        .value {
          color: var(--text-primary);
          flex: 1;
        }
      }
    }
  }
  
  .avatar-upload {
    display: flex;
    align-items: center;
    
    .upload-btn {
      margin-left: 20px;
    }
  }
  
  @media (max-width: 768px) {
    .profile-info {
      flex-direction: column;
      
      .avatar-container {
        margin-right: 0;
        margin-bottom: 20px;
        display: flex;
        justify-content: center;
      }
    }
  }
}
</style> 