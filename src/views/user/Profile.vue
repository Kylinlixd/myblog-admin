<template>
  <div class="profile-container">
    <div class="page-header">
      <div>
        <span class="eyebrow">ACCOUNT SETTINGS</span>
        <h2 class="page-title">{{ t('profile.title') }}</h2>
        <p class="page-subtitle">{{ t('profile.subtitle') }}</p>
      </div>
    </div>
    
    <div class="settings-grid">
    <a-card class="profile-card">
      <template #title>
        <div class="card-header">
          <div>
            <strong>{{ t('profile.basicInfo') }}</strong>
            <small class="card-hint">{{ t('profile.basicHint') }}</small>
          </div>
          <span class="edit-state" :class="{ 'edit-state--dirty': profileDirty }">{{ profileDirty ? t('profile.dirty') : t('profile.saved') }}</span>
        </div>
      </template>

      <div class="profile-layout">
        <aside class="profile-identity" :aria-label="t('profile.aria.identity')">
          <div class="identity-avatar-wrap">
            <UserAvatar class="identity-avatar" :size="80" :src="profileForm.avatar" :nickname="profileForm.nickname" :username="profileForm.username" tone="cool" />
            <a-upload
              class="upload-btn"
              :custom-request="handleAvatarUpload"
              :show-upload-list="false"
              :before-upload="beforeAvatarUpload"
            >
              <a-button type="default" size="small">{{ t('profile.changeAvatar') }}</a-button>
            </a-upload>
          </div>
          <div class="identity-copy">
            <strong>{{ profileForm.nickname || t('profile.noNickname') }}</strong>
            <span>@{{ profileForm.username || t('profile.noUsername') }}</span>
            <small>{{ roleLabel }}</small>
          </div>
          <p class="identity-hint">{{ t('profile.identityHint') }}<br />{{ t('profile.avatarEffective') }}</p>
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
          <a-form-item class="profile-field profile-field--full" :label="t('profile.username')" name="username">
            <a-input v-model:value="profileForm.username" :placeholder="t('profile.usernameRequired')" />
            <template #extra>{{ t('profile.usernameExtra') }}</template>
          </a-form-item>

          <div class="profile-field-pair">
          <a-form-item class="profile-field" :label="t('profile.nickname')" name="nickname">
            <a-input v-model:value="profileForm.nickname" :placeholder="t('profile.nicknamePlaceholder')" />
          </a-form-item>
          
          <a-form-item class="profile-field" :label="t('profile.email')" name="email">
            <a-input v-model:value="profileForm.email" :placeholder="t('profile.emailPlaceholder')" />
          </a-form-item>
          </div>
          
          <a-form-item class="profile-field profile-field--full" :label="t('profile.bio')" name="bio">
            <a-textarea
              v-model:value="profileForm.bio"
              :rows="4"
              :placeholder="t('profile.bioPlaceholder')"
              show-count
              :maxlength="200"
            />
          </a-form-item>
          
          <div class="form-actions profile-actions">
            <a-button @click="cancelProfileEdit">{{ t('profile.revertChanges') }}</a-button>
            <a-button data-testid="save-profile" type="primary" :disabled="!profileDirty" :loading="profileLoading" @click="handleProfileUpdate">{{ t('profile.saveProfile') }}</a-button>
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
            <strong>{{ t('profile.securitySection') }}</strong>
            <small class="card-hint">{{ t('profile.passwordHint') }}</small>
          </div>
        </div>
      </template>
      
      <div class="password-layout">
        <a-form
          ref="passwordFormRef"
          :model="passwordForm"
          :rules="passwordRules"
          class="profile-form-stackable password-fields"
          layout="vertical"
          data-mobile-stack="true"
          @submit.prevent="handlePasswordChange"
        >
        <div class="password-group password-group--current">
          <a-form-item class="profile-field" :label="t('profile.oldPassword')" name="oldPassword">
            <a-input-password
              v-model:value="passwordForm.oldPassword"
              autocomplete="current-password"
              :placeholder="t('profile.oldPasswordPlaceholder')"
            />
          </a-form-item>
        </div>

        <div class="password-group password-group--new">
          <a-form-item class="profile-field" :label="t('profile.newPassword')" name="newPassword">
              <a-input-password
                v-model:value="passwordForm.newPassword"
                autocomplete="new-password"
                :placeholder="t('profile.newPasswordPlaceholder')"
              />
              <template #extra>{{ t('profile.newPasswordExtra') }}</template>
          </a-form-item>

          <a-form-item class="profile-field" :label="t('profile.confirmPassword')" name="confirmPassword">
            <a-input-password
              v-model:value="passwordForm.confirmPassword"
              autocomplete="new-password"
              :placeholder="t('profile.confirmPlaceholder')"
            />
          </a-form-item>
        </div>
        
        <div class="form-actions password-actions">
          <a-button class="password-reset-button" @click="resetForm">{{ t('profile.clearInputs') }}</a-button>
          <a-button type="primary" :loading="loading" @click="handlePasswordChange">{{ t('profile.updatePassword') }}</a-button>
        </div>
        <p v-if="passwordError" class="form-error" role="alert">{{ passwordError }}</p>
        </a-form>
      </div>
    </a-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { message as AntMessage } from 'ant-design-vue'
import { useUserStore } from '../../stores/user'
import { changePassword, uploadAvatar } from '../../api/auth'
import UserAvatar from '../../components/common/UserAvatar.vue'
import { t, currentLocale } from '@/i18n'

const userStore = useUserStore()
const passwordFormRef = ref(null)
const profileFormRef = ref(null)
const loading = ref(false)
const profileLoading = ref(false)
const profileError = ref('')
const passwordError = ref('')
const savedProfile = ref({ username: '', nickname: '', email: '', bio: '', avatar: '' })

const userInfo = computed(() => userStore.userInfo || {})
const roleLabel = computed(() => t(`shell.role.${userInfo.value.role || 'default'}`))

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
  if (!dateString) return t('profile.unknown')
  const date = new Date(dateString)
  return date.toLocaleString(currentLocale.value, {
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
    AntMessage.error(t('profile.avatarOnlyImage'))
    return false
  }
  if (!isLt2M) {
    AntMessage.error(t('profile.avatarTooLarge'))
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
    AntMessage.success(t('profile.avatarSuccess'))
    return true
  } else {
    AntMessage.error(res?.message || t('profile.avatarFailed'))
    return false
  }
}

const handleAvatarUpload = async ({ file, onSuccess, onError }) => {
  try {
    const result = await uploadAvatar(file)
    if (!handleAvatarSuccess(result)) {
      onError?.(new TypeError(t('profile.avatarInvalidResponse')))
      return
    }
    userStore.syncAvatar?.(profileForm.avatar)
    onSuccess?.(result)
  } catch (error) {
    AntMessage.error(error.message || t('profile.avatarFailed'))
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
    const profileData = {
      username: values.username,
      nickname: values.nickname,
      email: values.email,
      bio: values.bio
    }
    if (profileForm.avatar !== savedProfile.value.avatar) {
      profileData.avatar = profileForm.avatar
    }
    await userStore.updateProfile(profileData)
    await userStore.getUserInfo()
    
    AntMessage.success(t('profile.updateSuccess'))
    initProfileForm()
  } catch (error) {
    console.error('更新个人资料失败:', error)
    profileError.value = error.message || t('profile.updateFailed')
    AntMessage.error(error.message || t('profile.updateFailed'))
  } finally {
    profileLoading.value = false
  }
}

// 资料表单验证规则
const profileRules = {
  username: [
    { required: true, message: t('profile.usernameRequired'), trigger: 'blur' },
    { min: 4, max: 20, message: t('profile.usernameLength'), trigger: 'blur' },
    { pattern: /^[\w.@+-]+$/, message: t('profile.usernamePattern'), trigger: 'blur' }
  ],
  nickname: [
    { max: 20, message: t('profile.nicknameMax'), trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: t('profile.emailInvalid'), trigger: 'blur' }
  ],
  bio: [
    { max: 200, message: t('profile.bioMax'), trigger: 'blur' }
  ]
}

// 密码表单验证规则
const passwordRules = {
  oldPassword: [
    { required: true, message: t('profile.oldPasswordRequired'), trigger: 'submit' }
  ],
  newPassword: [
    { required: true, message: t('profile.newPasswordRequired'), trigger: 'submit' },
    { min: 8, message: t('profile.newPasswordMin'), trigger: 'submit' },
    { 
      validator: (rule, value, callback) => {
        if (!value) {
          callback()
        } else if (value.length < 8) {
          callback(new Error(t('profile.newPasswordMin')))
        } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value)) {
          callback(new Error(t('profile.passwordWeak')))
        } else {
          callback()
        }
      }, 
      trigger: 'submit' 
    }
  ],
  confirmPassword: [
    { required: true, message: t('profile.confirmRequired'), trigger: 'submit' },
    { 
      validator: (rule, value, callback) => {
        if (!value) {
          callback()
        } else if (value !== passwordForm.newPassword) {
          callback(new Error(t('profile.passwordMismatch')))
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
    AntMessage.success(t('profile.passwordChanged'))
    resetForm()
  } catch (error) {
    console.error('修改密码失败:', error)
    
    // 处理表单验证错误
    if (error.name === 'ValidationError') {
      return
    }
    
    passwordError.value = error.message || t('profile.passwordChangeFailed')
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

onMounted(async () => {
  // Refresh the profile on entry so an avatar uploaded in another tab/session
  // is rendered from the server value instead of stale local storage.
  try {
    await userStore.getUserInfo?.()
  } catch {
    // Keep the locally cached profile usable when the refresh is unavailable.
  }
  initProfileForm()
})
</script>

<style scoped>
.profile-container { width: min(100%, 960px); margin: 0 auto; padding: 8px 20px 24px; }
.page-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 16px; }
.eyebrow { display: block; margin-bottom: 4px; color: var(--color-primary); font-size: 11px; font-weight: 800; letter-spacing: .14em; }
.page-title { margin: 0; color: var(--color-text); font-size: 26px; font-weight: 780; letter-spacing: -.03em; }
.page-subtitle { margin: 4px 0 0; color: var(--color-text-secondary); font-size: 13px; }
.settings-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: stretch; gap: 14px; }
.profile-card, .password-card { display: flex; height: 100%; flex-direction: column; margin-bottom: 0; border: 1px solid var(--color-border); border-radius: 16px; box-shadow: var(--shadow-card); }
.profile-card :deep(.ant-card-head), .password-card :deep(.ant-card-head) { min-height: 56px; padding-inline: 20px; border-bottom-color: var(--color-border); }
.profile-card :deep(.ant-card-body), .password-card :deep(.ant-card-body) { display: flex; flex: 1; flex-direction: column; }
.profile-card :deep(.ant-card-body) { padding: 18px 20px; }
.password-card :deep(.ant-card-body) { padding: 18px 20px; }
.card-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.card-header strong { display: block; color: var(--color-text); font-size: 16px; font-weight: 700; }
.card-hint { display: block; margin-top: 4px; color: var(--color-text-muted); font-size: 12px; font-weight: 400; }
.edit-state { padding: 5px 10px; border-radius: 999px; color: var(--color-primary); background: var(--color-primary-soft); font-size: 12px; font-weight: 700; white-space: nowrap; }
.edit-state--dirty { color: #a16207; background: #fff7df; }
.profile-layout { display: grid; min-height: 100%; grid-template-columns: 120px minmax(0, 360px); align-items: start; gap: 18px; }
.password-layout { display: flex; min-height: 100%; justify-content: center; }
.profile-identity { min-width: 0; padding-top: 4px; text-align: center; }
.identity-avatar-wrap { display: flex; align-items: flex-start; flex-direction: column; gap: 8px; }
.profile-identity .identity-avatar-wrap { align-items: center; }
.identity-avatar { display: grid; place-items: center; color: #315bea; background: #e9efff; font-size: 32px; font-weight: 700; }
.upload-btn { margin: 0; }
.identity-copy { display: grid; gap: 3px; margin-top: 10px; }
.identity-copy strong { color: var(--color-text); font-size: 17px; font-weight: 750; overflow-wrap: anywhere; }
.identity-copy span { color: var(--color-text-secondary); font-size: 13px; overflow-wrap: anywhere; }
.identity-copy small { color: var(--color-primary); font-size: 12px; font-weight: 650; }
.identity-hint { margin: 10px 0 0; color: var(--color-text-muted); font-size: 12px; line-height: 1.55; }
.profile-fields, .password-fields { width: 100%; min-width: 0; max-width: 360px; }
.profile-fields :deep(.ant-form), .password-fields :deep(.ant-form) { width: 100%; }
.password-fields { display: grid; grid-template-columns: 1fr; align-content: space-between; padding-top: 16px; }
.password-group { display: contents; }
.password-fields .profile-field { min-height: 86px; }
.profile-field-pair { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.profile-field :deep(.ant-form-item-label), .password-fields :deep(.ant-form-item-label) { padding: 0 0 4px; }
.profile-field :deep(.ant-form-item-label > label), .password-fields :deep(.ant-form-item-label > label) { color: var(--color-text-secondary); font-size: 13px; font-weight: 650; }
.profile-fields :deep(.ant-form-item-required::before), .password-fields :deep(.ant-form-item-required::before) { color: #f28b82 !important; }
.profile-field :deep(.ant-form-item), .password-fields :deep(.ant-form-item) { margin-bottom: 12px; }
.profile-field :deep(.ant-input), .profile-field :deep(.ant-input-affix-wrapper), .profile-field :deep(.ant-input-textarea), .password-fields :deep(.ant-input-affix-wrapper) { border: 1px solid #d8e0eb; border-radius: 8px; transition: border-color .2s ease, box-shadow .2s ease; }
.profile-field :deep(.ant-input:hover), .profile-field :deep(.ant-input-affix-wrapper:hover), .password-fields :deep(.ant-input-affix-wrapper:hover) { border-color: #91adf7; }
.profile-field :deep(.ant-input:focus), .profile-field :deep(.ant-input-affix-wrapper-focused), .password-fields :deep(.ant-input-affix-wrapper-focused) { border-color: var(--color-primary); box-shadow: 0 0 0 2px rgba(49, 91, 234, .12); }
.password-fields :deep(.ant-input-affix-wrapper .ant-input), .password-fields :deep(.ant-input-affix-wrapper .ant-input:focus) { border: 0 !important; box-shadow: none !important; border-radius: 0; }
.password-fields :deep(.ant-input-password-icon) { color: #94a3b8; font-size: 14px; transition: color .2s ease; }
.password-fields :deep(.ant-input-password-icon:hover) { color: var(--color-primary); }
.profile-field :deep(.ant-form-item-extra), .password-fields :deep(.ant-form-item-extra) { margin-top: 4px; color: #9aa8bd; font-size: 11px; line-height: 1.5; }
.password-fields .profile-field :deep(.ant-form-item-extra) { min-height: 18px; }
.password-group + .password-group { margin-top: 0; }
.password-fields .profile-field { margin-bottom: 0; }
.form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 0; padding-top: 12px; border-top: 1px solid var(--color-border); }
.form-error { margin: 12px 0 0; color: var(--color-danger); font-size: 13px; line-height: 1.6; white-space: pre-wrap; }
.password-actions { justify-content: flex-end; gap: 12px; margin-top: 0; }
.profile-actions .ant-btn:not(.ant-btn-primary), .password-reset-button { border: 1px solid #d8e0eb; color: #526175; background: #f5f7fa; box-shadow: none; }
.profile-actions .ant-btn:not(.ant-btn-primary):hover, .password-reset-button:hover { border-color: #b8caff; color: var(--color-primary); background: var(--color-primary-soft); }
.form-actions .ant-btn { border-radius: 8px; transition: color .2s ease, background-color .2s ease, border-color .2s ease, box-shadow .2s ease; }
@media (max-width: 760px) {
  .settings-grid { grid-template-columns: 1fr; gap: 14px; }
  .profile-card, .password-card { display: block; height: auto; }
  .profile-card :deep(.ant-card-body), .password-card :deep(.ant-card-body) { display: block; }
  .profile-container { width: auto; padding: 8px 14px 28px; }
  .page-header { align-items: flex-start; margin-bottom: 18px; }
  .page-title { font-size: 26px; }
  .profile-card :deep(.ant-card-head), .password-card :deep(.ant-card-head) { min-height: 60px; padding-inline: 16px; }
  .profile-card :deep(.ant-card-body), .password-card :deep(.ant-card-body) { padding: 16px; }
  .profile-layout { grid-template-columns: 1fr; gap: 20px; }
  .password-layout { display: block; }
  .profile-fields, .password-fields { max-width: none; }
  .password-fields { display: block; padding-top: 0; }
  .password-fields .profile-field { min-height: 0; }
  .password-fields .profile-field :deep(.ant-form-item-extra) { min-height: 0; }
  .profile-identity { display: grid; grid-template-columns: auto minmax(0, 1fr); column-gap: 16px; align-items: center; text-align: left; }
  .profile-identity .identity-avatar-wrap { align-items: flex-start; grid-row: span 2; }
  .identity-copy { margin-top: 0; }
  .identity-hint { grid-column: 2; margin: 0; }
  .profile-field-pair { grid-template-columns: 1fr; gap: 0; }
  .form-actions { justify-content: stretch; }
  .form-actions .ant-btn { flex: 1; }
}
@media (max-width: 520px) {
  .card-header { align-items: flex-start; flex-direction: column; gap: 8px; }
  .identity-avatar-wrap { align-items: flex-start; }
}
</style>
