<template>
  <div class="profile-container">
    <div class="page-header">
      <div>
        <span class="eyebrow">ACCOUNT SETTINGS</span>
        <h2 class="page-title">个人资料</h2>
        <p class="page-subtitle">管理公开信息与登录安全设置</p>
      </div>
    </div>
    
    <a-card class="profile-card">
      <template #header>
        <div class="card-header">
          <div>
            <strong>基本信息</strong>
            <small class="card-hint">昵称和个人简介会展示在博客公开页面</small>
          </div>
          <span class="edit-state">可编辑</span>
        </div>
      </template>

      <div class="profile-edit">
        <a-form
          ref="profileFormRef"
          :model="profileForm"
          :rules="profileRules"
          class="profile-form-stackable"
          data-mobile-stack="true"
          :label-col="{ span: 4 }"
          :wrapper-col="{ span: 18 }"
        >
          <a-form-item label="用户名" prop="username">
            <a-input v-model:value="profileForm.username" placeholder="请输入用户名" />
          </a-form-item>

          <a-form-item label="头像">
            <div class="avatar-upload">
              <a-avatar :size="100" :src="profileForm.avatar || defaultAvatar">
                {{ profileForm.nickname?.charAt(0) || userInfo.username?.charAt(0) }}
              </a-avatar>
              <a-upload
                class="upload-btn"
                :custom-request="handleAvatarUpload"
                :show-file-list="false"
                :before-upload="beforeAvatarUpload"
              >
                <a-button type="primary" size="small">更换头像</a-button>
              </a-upload>
            </div>
          </a-form-item>
          
          <a-form-item label="昵称" prop="nickname">
            <a-input v-model:value="profileForm.nickname" placeholder="请输入昵称" />
          </a-form-item>
          
          <a-form-item label="邮箱" prop="email">
            <a-input v-model:value="profileForm.email" placeholder="请输入邮箱" />
          </a-form-item>
          
          <a-form-item label="个人简介" prop="bio">
            <a-textarea
              v-model:value="profileForm.bio"
              :rows="4"
              placeholder="请输入个人简介"
              show-count
              :maxlength="200"
            />
          </a-form-item>
          
          <div class="form-actions profile-actions">
            <a-button type="primary" :loading="profileLoading" @click="handleProfileUpdate">保存资料</a-button>
            <a-button @click="cancelProfileEdit">重置</a-button>
          </div>
          <p v-if="profileError" data-testid="profile-save-error" class="form-error" role="alert">{{ profileError }}</p>
        </a-form>
      </div>
    </a-card>
    
    <a-card class="password-card">
      <template #header>
        <div class="card-header">
          <div>
            <strong>修改密码</strong>
            <small class="card-hint">定期更新密码，保护管理账户安全</small>
          </div>
        </div>
      </template>
      
      <a-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        class="profile-form-stackable"
        data-mobile-stack="true"
        :label-col="{ span: 4 }"
        :wrapper-col="{ span: 18 }"
        @submit.prevent="handlePasswordChange"
      >
        <a-form-item label="原密码" prop="oldPassword">
          <a-input-password
            v-model:value="passwordForm.oldPassword"
            placeholder="请输入原密码"
          />
        </a-form-item>
        
          <a-form-item label="新密码" prop="newPassword">
            <a-input-password
              v-model:value="passwordForm.newPassword"
              placeholder="请输入新密码"
            />
            <template #extra>至少 8 位，需包含大小写字母和数字，可使用符号。</template>
        </a-form-item>
        
        <a-form-item label="确认密码" prop="confirmPassword">
          <a-input-password
            v-model:value="passwordForm.confirmPassword"
            placeholder="请再次输入新密码"
          />
        </a-form-item>
        
        <div class="form-actions password-actions">
          <a-button type="primary" :loading="loading" @click="handlePasswordChange">
            保存修改
          </a-button>
          <a-button @click="resetForm">重置</a-button>
        </div>
        <p v-if="passwordError" class="form-error" role="alert">{{ passwordError }}</p>
      </a-form>
    </a-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { message as AntMessage } from 'ant-design-vue'
import { useUserStore } from '../../stores/user'
import { changePassword, uploadAvatar } from '../../api/auth'

const defaultAvatar = '/default-avatar.png'

const userStore = useUserStore()
const passwordFormRef = ref(null)
const profileFormRef = ref(null)
const loading = ref(false)
const profileLoading = ref(false)
const profileError = ref('')
const passwordError = ref('')

const userInfo = computed(() => userStore.userInfo || {})

// 资料表单
const profileForm = reactive({
  username: '',
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
  profileForm.username = userInfo.value.username || ''
  profileForm.nickname = userInfo.value.nickname || ''
  profileForm.email = userInfo.value.email || ''
  profileForm.bio = userInfo.value.bio || ''
  profileForm.avatar = userInfo.value.avatar || ''
}

// 取消编辑个人资料
const cancelProfileEdit = () => {
  initProfileForm()
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
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
  const avatarUrl = res?.url
  if (avatarUrl) {
    profileForm.avatar = avatarUrl
    AntMessage.success('头像上传成功')
  } else {
    AntMessage.error(res?.message || '头像上传失败')
  }
}

const handleAvatarUpload = async ({ file, onSuccess, onError }) => {
  try {
    const result = await uploadAvatar(file)
    handleAvatarSuccess(result)
    onSuccess?.(result)
  } catch (error) {
    AntMessage.error(error.message || '头像上传失败')
    onError?.(error)
  }
}

// 更新个人资料
const handleProfileUpdate = async () => {
  if (!profileFormRef.value) return
  
  try {
    profileError.value = ''
    const values = await profileFormRef.value.validate()
    
    profileLoading.value = true
    
    // 调用更新用户资料的API
    await userStore.updateProfile({
      username: values.username,
      nickname: values.nickname,
      email: values.email,
      bio: values.bio,
      avatar: profileForm.avatar
    })
    await userStore.getUserInfo()
    
    AntMessage.success('个人资料更新成功')
    initProfileForm()
  } catch (error) {
    console.error('更新个人资料失败:', error)
    profileError.value = error.message || '更新个人资料失败'
    AntMessage.error(error.message || '更新个人资料失败')
  } finally {
    profileLoading.value = false
  }
}

// 资料表单验证规则
const profileRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 4, max: 20, message: '用户名长度为 4-20 个字符', trigger: 'blur' },
    { pattern: /^[\w.@+-]+$/, message: '用户名仅支持字母、数字及 . @ + - _', trigger: 'blur' }
  ],
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
    { required: true, message: '请输入原密码', trigger: 'submit' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'submit' },
    { min: 8, message: '新密码长度不能少于8个字符', trigger: 'submit' },
    { 
      validator: (rule, value, callback) => {
        if (!value) {
          callback()
        } else if (value.length < 8) {
          callback(new Error('密码长度不能少于8个字符'))
        } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value)) {
          callback(new Error('密码必须包含大小写字母和数字'))
        } else {
          callback()
        }
      }, 
      trigger: 'submit' 
    }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'submit' },
    { 
      validator: (rule, value, callback) => {
        if (!value) {
          callback()
        } else if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      }, 
      trigger: 'submit' 
    }
  ]
}

// 更新密码
const handlePasswordChange = async () => {
  if (!passwordFormRef.value) return
  
  try {
    passwordError.value = ''
    loading.value = true
    const values = await passwordFormRef.value.validate()
    await changePassword({
      oldPassword: values.oldPassword,
      newPassword: values.newPassword
    })
    AntMessage.success('密码修改成功')
    resetForm()
  } catch (error) {
    console.error('修改密码失败:', error)
    
    // 处理表单验证错误
    if (error.name === 'ValidationError') {
      return
    }
    
    passwordError.value = error.message || '修改密码失败，请稍后重试'
    AntMessage.error(passwordError.value)
  } finally {
    loading.value = false
  }
}

// 重置密码表单
const resetForm = () => {
  if (passwordFormRef.value) {
    passwordFormRef.value.resetFields()
  }
  // 手动清空表单数据
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
}

onMounted(() => {
  initProfileForm()
})
</script>

<style scoped>
.profile-container { max-width: 920px; margin: 0 auto; padding: 12px 20px 40px; }
.page-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 22px; }
.eyebrow { display: block; margin-bottom: 8px; color: var(--color-primary); font-size: 11px; font-weight: 800; letter-spacing: .14em; }
.page-title { margin: 0; color: var(--color-text); font-size: 30px; font-weight: 780; letter-spacing: -.03em; }
.page-subtitle { margin: 7px 0 0; color: var(--color-text-secondary); font-size: 13px; }
.profile-card, .password-card { margin-bottom: 20px; border: 1px solid var(--color-border); border-radius: 16px; box-shadow: var(--shadow-card); }
.card-header { display: flex; align-items: center; justify-content: space-between; }
.card-header strong { display: block; color: var(--color-text); font-size: 15px; }
.card-hint { display: block; margin-top: 4px; color: var(--color-text-muted); font-size: 12px; font-weight: 400; }
.edit-state { padding: 5px 10px; border-radius: 999px; color: var(--color-primary); background: var(--color-primary-soft); font-size: 12px; font-weight: 700; }
.profile-info { display: grid; grid-template-columns: 160px 1fr; align-items: start; gap: 28px; }
.profile-info .avatar-container { display: grid; min-height: 160px; margin: 0; place-items: center; border-radius: 14px; background: linear-gradient(145deg, #eef3ff, #f8faff); }
.info-list { display: grid; gap: 0; padding-top: 4px; }
.info-item { display: grid; grid-template-columns: 92px 1fr; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--color-border); }
.label { color: var(--color-text-secondary); font-weight: 650; }
.value { min-width: 0; overflow-wrap: anywhere; color: var(--color-text); }
.profile-edit { margin-top: 4px; max-width: 760px; }
.profile-edit :deep(.ant-form-item), .password-card :deep(.ant-form-item) { margin-bottom: 18px; }
.form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; padding-top: 16px; border-top: 1px solid var(--color-border); }
.form-error { margin: 12px 0 0; color: var(--color-danger); font-size: 13px; white-space: pre-wrap; }
.profile-edit :deep(.ant-form-item-label > label), .password-card :deep(.ant-form-item-label > label) { color: var(--color-text-secondary); font-weight: 650; }
.profile-edit :deep(.ant-input), .profile-edit :deep(.ant-input-affix-wrapper), .password-card :deep(.ant-input-affix-wrapper) { border-radius: 9px; }
.password-card :deep(.ant-form) { max-width: 760px; padding: 4px 8px 0; }
.password-card :deep(.ant-form-item-extra) { color: var(--color-text-muted); font-size: 12px; }
.avatar-upload { display: flex; align-items: center; gap: 10px; }
.upload-btn { margin-left: 10px; }
@media (max-width: 640px) {
  .profile-container { padding: 8px 14px 28px; }
  .page-header { align-items: flex-start; }
  .page-title { font-size: 26px; }
  .profile-info { grid-template-columns: 1fr; }
  .profile-info .avatar-container { min-height: 132px; }
  .profile-edit :deep(.ant-form), .password-card :deep(.ant-form) { padding-inline: 0; }
  .profile-edit :deep(.ant-form-item-label), .password-card :deep(.ant-form-item-label) { padding-bottom: 5px; text-align: left; }
  .profile-form-stackable :deep(.ant-form-item) { display: block; }
  .profile-form-stackable :deep(.ant-form-item-label), .profile-form-stackable :deep(.ant-form-item-control) { width: 100%; max-width: none; text-align: left; }
  .form-actions { justify-content: stretch; }
  .form-actions .ant-btn { flex: 1; }
}
</style>
