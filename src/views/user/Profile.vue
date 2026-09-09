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
      <template #title>
        <div class="card-header">
          <div>
            <strong>基本信息</strong>
            <small class="card-hint">昵称和个人简介会展示在博客公开页面</small>
          </div>
          <span class="edit-state" :class="{ 'edit-state--dirty': profileDirty }">{{ profileDirty ? '有未保存修改' : '已保存' }}</span>
        </div>
      </template>

      <div class="profile-layout">
        <aside class="profile-identity" aria-label="身份信息">
          <div class="identity-avatar-wrap">
            <a-avatar class="identity-avatar" :size="80" :src="profileForm.avatar || undefined">
              {{ profileInitial }}
            </a-avatar>
            <a-upload
              class="upload-btn"
              :custom-request="handleAvatarUpload"
              :show-file-list="false"
              :before-upload="beforeAvatarUpload"
            >
              <a-button type="default" size="small">更换头像</a-button>
            </a-upload>
          </div>
          <div class="identity-copy">
            <strong>{{ profileForm.nickname || '未设置昵称' }}</strong>
            <span>@{{ profileForm.username || '未设置用户名' }}</span>
            <small>{{ roleLabel }}</small>
          </div>
          <p class="identity-hint">JPG / PNG，小于 2MB<br />上传成功后立即生效</p>
        </aside>

        <div class="profile-fields">
        <a-form
          ref="profileFormRef"
          :model="profileForm"
          :rules="profileRules"
          class="profile-form-stackable"
          layout="vertical"
          data-mobile-stack="true"
        >
          <a-form-item class="profile-field profile-field--full" label="用户名" name="username">
            <a-input v-model:value="profileForm.username" placeholder="请输入用户名" />
            <template #extra>修改后请使用新用户名登录。</template>
          </a-form-item>

          <div class="profile-field-pair">
          <a-form-item class="profile-field" label="昵称" name="nickname">
            <a-input v-model:value="profileForm.nickname" placeholder="请输入昵称" />
          </a-form-item>
          
          <a-form-item class="profile-field" label="邮箱" name="email">
            <a-input v-model:value="profileForm.email" placeholder="请输入邮箱" />
          </a-form-item>
          </div>
          
          <a-form-item class="profile-field profile-field--full" label="个人简介" name="bio">
            <a-textarea
              v-model:value="profileForm.bio"
              :rows="4"
              placeholder="请输入个人简介"
              show-count
              :maxlength="200"
            />
          </a-form-item>
          
          <div class="form-actions profile-actions">
            <a-button data-testid="save-profile" type="primary" :disabled="!profileDirty" :loading="profileLoading" @click="handleProfileUpdate">保存资料</a-button>
            <a-button @click="cancelProfileEdit">撤销修改</a-button>
          </div>
          <p v-if="profileError" data-testid="profile-save-error" class="form-error" role="alert">{{ profileError }}</p>
        </a-form>
        </div>
      </div>
    </a-card>
    
    <a-card class="password-card">
      <template #title>
        <div class="card-header">
          <div>
            <strong>修改密码</strong>
            <small class="card-hint">定期更新密码，保护管理账户安全</small>
          </div>
        </div>
      </template>
      
      <div class="password-layout">
        <aside class="password-identity">
          <strong>登录安全</strong>
          <span>定期更新密码，保护管理账户安全。</span>
        </aside>
        <a-form
          ref="passwordFormRef"
          :model="passwordForm"
          :rules="passwordRules"
          class="profile-form-stackable password-fields"
          layout="vertical"
          data-mobile-stack="true"
          @submit.prevent="handlePasswordChange"
        >
        <a-form-item class="profile-field" label="原密码" name="oldPassword">
          <a-input-password
            v-model:value="passwordForm.oldPassword"
            autocomplete="current-password"
            placeholder="请输入原密码"
          />
        </a-form-item>
        
          <a-form-item class="profile-field" label="新密码" name="newPassword">
            <a-input-password
              v-model:value="passwordForm.newPassword"
              autocomplete="new-password"
              placeholder="请输入新密码"
            />
            <template #extra>至少 8 位，需包含大小写字母和数字，可使用符号。</template>
        </a-form-item>
        
        <a-form-item class="profile-field" label="确认密码" name="confirmPassword">
          <a-input-password
            v-model:value="passwordForm.confirmPassword"
            autocomplete="new-password"
            placeholder="请再次输入新密码"
          />
        </a-form-item>
        
        <div class="form-actions password-actions">
          <a-button type="primary" :loading="loading" @click="handlePasswordChange">
            更新密码
          </a-button>
          <a-button @click="resetForm">清空输入</a-button>
        </div>
        <p v-if="passwordError" class="form-error" role="alert">{{ passwordError }}</p>
        </a-form>
      </div>
    </a-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { message as AntMessage } from 'ant-design-vue'
import { useUserStore } from '../../stores/user'
import { changePassword, uploadAvatar } from '../../api/auth'

const userStore = useUserStore()
const passwordFormRef = ref(null)
const profileFormRef = ref(null)
const loading = ref(false)
const profileLoading = ref(false)
const profileError = ref('')
const passwordError = ref('')
const savedProfile = ref({ username: '', nickname: '', email: '', bio: '', avatar: '' })

const userInfo = computed(() => userStore.userInfo || {})
const profileInitial = computed(() => (profileForm.nickname || profileForm.username || '用').trim().slice(0, 1).toUpperCase())
const roleLabel = computed(() => ({ admin: '站点管理员', editor: '内容编辑', author: '内容作者' }[userInfo.value.role] || '内容管理成员'))

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
  savedProfile.value = { ...profileForm }
}

const profileDirty = computed(() =>
  ['username', 'nickname', 'email', 'bio', 'avatar'].some((field) => profileForm[field] !== savedProfile.value[field])
)

// 取消编辑个人资料
const cancelProfileEdit = () => {
  Object.assign(profileForm, savedProfile.value)
  profileError.value = ''
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
    savedProfile.value.avatar = avatarUrl
    AntMessage.success('头像上传成功')
    return true
  } else {
    AntMessage.error(res?.message || '头像上传失败')
    return false
  }
}

const handleAvatarUpload = async ({ file, onSuccess, onError }) => {
  try {
    const result = await uploadAvatar(file)
    if (!handleAvatarSuccess(result)) {
      onError?.(new TypeError('头像上传响应缺少可用 URL'))
      return
    }
    userStore.syncAvatar?.(profileForm.avatar)
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
.profile-container { width: min(100%, 960px); margin: 0 auto; padding: 12px 20px 40px; }
.page-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 24px; }
.eyebrow { display: block; margin-bottom: 8px; color: var(--color-primary); font-size: 11px; font-weight: 800; letter-spacing: .14em; }
.page-title { margin: 0; color: var(--color-text); font-size: 28px; font-weight: 780; letter-spacing: -.03em; }
.page-subtitle { margin: 7px 0 0; color: var(--color-text-secondary); font-size: 14px; }
.profile-card, .password-card { margin-bottom: 20px; border: 1px solid var(--color-border); border-radius: 16px; box-shadow: var(--shadow-card); }
.profile-card :deep(.ant-card-head), .password-card :deep(.ant-card-head) { min-height: 68px; padding-inline: 24px; border-bottom-color: var(--color-border); }
.profile-card :deep(.ant-card-body), .password-card :deep(.ant-card-body) { padding: 24px; }
.card-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.card-header strong { display: block; color: var(--color-text); font-size: 16px; font-weight: 700; }
.card-hint { display: block; margin-top: 4px; color: var(--color-text-muted); font-size: 12px; font-weight: 400; }
.edit-state { padding: 5px 10px; border-radius: 999px; color: var(--color-primary); background: var(--color-primary-soft); font-size: 12px; font-weight: 700; white-space: nowrap; }
.edit-state--dirty { color: #a16207; background: #fff7df; }
.profile-layout, .password-layout { display: grid; grid-template-columns: 200px minmax(0, 560px); align-items: start; gap: 28px; }
.profile-identity, .password-identity { min-width: 0; padding-top: 4px; }
.identity-avatar-wrap { display: flex; align-items: flex-start; flex-direction: column; gap: 12px; }
.identity-avatar { display: grid; place-items: center; color: #315bea; background: #e9efff; font-size: 32px; font-weight: 700; }
.upload-btn { margin: 0; }
.identity-copy { display: grid; gap: 4px; margin-top: 16px; }
.identity-copy strong { color: var(--color-text); font-size: 17px; font-weight: 750; overflow-wrap: anywhere; }
.identity-copy span { color: var(--color-text-secondary); font-size: 13px; overflow-wrap: anywhere; }
.identity-copy small { color: var(--color-primary); font-size: 12px; font-weight: 650; }
.identity-hint { margin: 16px 0 0; color: var(--color-text-muted); font-size: 12px; line-height: 1.75; }
.profile-fields, .password-fields { width: 100%; min-width: 0; max-width: 560px; }
.profile-fields :deep(.ant-form), .password-fields :deep(.ant-form) { width: 100%; }
.profile-field-pair { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
.profile-field :deep(.ant-form-item-label), .password-fields :deep(.ant-form-item-label) { padding: 0 0 8px; }
.profile-field :deep(.ant-form-item-label > label), .password-fields :deep(.ant-form-item-label > label) { color: var(--color-text-secondary); font-size: 13px; font-weight: 650; }
.profile-field :deep(.ant-form-item), .password-fields :deep(.ant-form-item) { margin-bottom: 20px; }
.profile-field :deep(.ant-input), .profile-field :deep(.ant-input-affix-wrapper), .profile-field :deep(.ant-input-textarea), .password-fields :deep(.ant-input-affix-wrapper) { border-radius: 8px; }
.profile-field :deep(.ant-form-item-extra), .password-fields :deep(.ant-form-item-extra) { margin-top: 6px; color: var(--color-text-muted); font-size: 12px; line-height: 1.6; }
.form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 4px; padding-top: 20px; border-top: 1px solid var(--color-border); }
.form-error { margin: 12px 0 0; color: var(--color-danger); font-size: 13px; line-height: 1.6; white-space: pre-wrap; }
.password-identity { display: grid; gap: 7px; }
.password-identity strong { color: var(--color-text); font-size: 15px; }
.password-identity span { color: var(--color-text-muted); font-size: 12px; line-height: 1.7; }
@media (max-width: 760px) {
  .profile-container { width: auto; padding: 8px 14px 28px; }
  .page-header { align-items: flex-start; margin-bottom: 18px; }
  .page-title { font-size: 26px; }
  .profile-card :deep(.ant-card-head), .password-card :deep(.ant-card-head), .profile-card :deep(.ant-card-body), .password-card :deep(.ant-card-body) { padding-inline: 16px; }
  .profile-layout, .password-layout { grid-template-columns: 1fr; gap: 20px; }
  .profile-fields, .password-fields { max-width: none; }
  .profile-identity { display: grid; grid-template-columns: auto minmax(0, 1fr); column-gap: 16px; align-items: center; }
  .identity-avatar-wrap { grid-row: span 2; }
  .identity-copy { margin-top: 0; }
  .identity-hint { grid-column: 2; margin: 0; }
  .password-identity { padding-bottom: 0; }
  .profile-field-pair { grid-template-columns: 1fr; gap: 0; }
  .form-actions { justify-content: stretch; }
  .form-actions .ant-btn { flex: 1; }
}
@media (max-width: 520px) {
  .card-header { align-items: flex-start; flex-direction: column; gap: 8px; }
  .identity-avatar-wrap { align-items: flex-start; }
}
</style>
