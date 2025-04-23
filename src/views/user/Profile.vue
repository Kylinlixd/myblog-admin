<template>
  <div class="profile-container">
    <div class="page-header">
      <h2 class="page-title">个人资料</h2>
    </div>
    
    <a-card class="profile-card">
      <template #header>
        <div class="card-header">
          <span>基本信息</span>
          <a-button 
            type="primary" 
            size="small" 
            @click="isEditingProfile = true" 
            v-if="!isEditingProfile"
          >
            编辑资料
          </a-button>
        </div>
      </template>
      
      <div class="profile-info" v-if="!isEditingProfile">
        <div class="avatar-container">
          <a-avatar :size="120" :src="userInfo.avatar || defaultAvatar">
            {{ userInfo.nickname?.charAt(0) || userInfo.username?.charAt(0) }}
          </a-avatar>
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
        <a-form
          ref="profileFormRef"
          :model="profileForm"
          :rules="profileRules"
          label-width="100px"
        >
          <a-form-item label="头像">
            <div class="avatar-upload">
              <a-avatar :size="100" :src="profileForm.avatar || defaultAvatar">
                {{ profileForm.nickname?.charAt(0) || userInfo.username?.charAt(0) }}
              </a-avatar>
              <a-upload
                class="upload-btn"
                action="/api/upload/avatar"
                :show-file-list="false"
                :on-success="handleAvatarSuccess"
                :before-upload="beforeAvatarUpload"
              >
                <a-button type="primary" size="small">更换头像</a-button>
              </a-upload>
            </div>
          </a-form-item>
          
          <a-form-item label="昵称" prop="nickname">
            <a-input v-model="profileForm.nickname" placeholder="请输入昵称" />
          </a-form-item>
          
          <a-form-item label="邮箱" prop="email">
            <a-input v-model="profileForm.email" placeholder="请输入邮箱" />
          </a-form-item>
          
          <a-form-item label="个人简介" prop="bio">
            <a-input
              v-model="profileForm.bio"
              type="textarea"
              :rows="4"
              placeholder="请输入个人简介"
            />
          </a-form-item>
          
          <a-form-item>
            <a-button type="primary" :loading="profileLoading" @click="handleProfileUpdate">
              保存资料
            </a-button>
            <a-button @click="cancelProfileEdit">取消</a-button>
          </a-form-item>
        </a-form>
      </div>
    </a-card>
    
    <a-card class="password-card">
      <template #header>
        <div class="card-header">
          <span>修改密码</span>
        </div>
      </template>
      
      <a-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="100px"
        @submit.prevent="handlePasswordChange"
      >
        <a-form-item label="原密码" prop="oldPassword">
          <a-input
            v-model="passwordForm.oldPassword"
            type="password"
            placeholder="请输入原密码"
            show-password
          />
        </a-form-item>
        
        <a-form-item label="新密码" prop="newPassword">
          <a-input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="请输入新密码"
            show-password
          />
        </a-form-item>
        
        <a-form-item label="确认密码" prop="confirmPassword">
          <a-input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </a-form-item>
        
        <a-form-item>
          <a-button type="primary" :loading="loading" @click="handlePasswordChange">
            保存修改
          </a-button>
          <a-button @click="resetForm">重置</a-button>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { message as AntMessage } from 'ant-design-vue'
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
    AntMessage.error('头像图片只能是 JPG 或 PNG 格式!')
    return false
  }
  if (!isLt2M) {
    AntMessage.error('头像图片大小不能超过 2MB!')
    return false
  }
  return true
}

// 头像上传成功的回调
const handleAvatarSuccess = (res) => {
  if (res.code === 200 && res.data) {
    profileForm.avatar = res.data.url
    AntMessage.success('头像上传成功')
  } else {
    AntMessage.error(res.message || '头像上传失败')
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
    
    AntMessage.success('个人资料更新成功')
    isEditingProfile.value = false
  } catch (error) {
    console.error('更新个人资料失败:', error)
    AntMessage.error(error.message || '更新个人资料失败')
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
    { required: true, message: '请输入原密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '新密码不能少于6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: (rule, value, callback) => {
      if (value !== passwordForm.newPassword) {
        callback(new Error('两次输入的密码不一致'))
      } else {
        callback()
      }
    }, trigger: 'blur' }
  ]
}

// 更新密码
const handlePasswordChange = async () => {
  if (!passwordFormRef.value) return
  
  try {
    await passwordFormRef.value.validate()
    
    loading.value = true
    
    // 调用修改密码的API
    await changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })
    
    AntMessage.success('密码修改成功')
    resetForm()
  } catch (error) {
    console.error('修改密码失败:', error)
    AntMessage.error(error.message || '修改密码失败')
  } finally {
    loading.value = false
  }
}

// 重置密码表单
const resetForm = () => {
  passwordFormRef.value.resetFields()
}

onMounted(() => {
  initProfileForm()
})
</script>

<style scoped>
.profile-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
}

.profile-card,
.password-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.avatar-container {
  text-align: center;
  margin-bottom: 20px;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  font-weight: bold;
}

.value {
  color: #666;
}

.profile-edit {
  margin-top: 20px;
}

.avatar-upload {
  display: flex;
  align-items: center;
  gap: 10px;
}

.upload-btn {
  margin-left: 10px;
}
</style> 