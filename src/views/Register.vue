<template>
  <main class="register-page">
    <section class="register-intro" aria-label="账号介绍">
      <router-link class="register-brand" to="/blog"><span>L</span><strong>LiXD Studio</strong></router-link>
      <div>
        <span class="register-kicker">JOIN WORKSPACE</span>
        <h1>创建账号后，<br />进入内容工作台。</h1>
        <p>统一管理文章、归档、评论和文件资源，让博客维护变得更轻一些。</p>
      </div>
      <small>已有账号可以直接返回登录页。</small>
    </section>

    <section class="register-panel">
      <div class="register-card">
        <header>
          <span class="register-kicker">CREATE ACCOUNT</span>
          <h2>注册管理账号</h2>
          <p>填写基础信息，系统会在注册成功后进入后台。</p>
        </header>

        <a-alert v-if="registerError" :message="registerError" type="error" show-icon class="register-alert" />

        <a-form :model="form" layout="vertical" @finish="handleRegister">
          <a-form-item label="用户名" name="username" :rules="usernameRules">
            <a-input v-model:value="form.username" size="large" autocomplete="username" placeholder="3 到 20 个字符">
              <template #prefix><user-outlined /></template>
            </a-input>
          </a-form-item>

          <a-form-item label="昵称" name="nickname" :rules="nicknameRules">
            <a-input v-model:value="form.nickname" size="large" autocomplete="name" placeholder="用于后台展示">
              <template #prefix><idcard-outlined /></template>
            </a-input>
          </a-form-item>

          <a-form-item label="邮箱" name="email" :rules="emailRules">
            <a-input v-model:value="form.email" size="large" autocomplete="email" placeholder="name@example.com">
              <template #prefix><mail-outlined /></template>
            </a-input>
          </a-form-item>

          <a-form-item label="密码" name="password" :rules="passwordRules">
            <a-input-password v-model:value="form.password" size="large" autocomplete="new-password" placeholder="6 到 20 个字符">
              <template #prefix><lock-outlined /></template>
            </a-input-password>
          </a-form-item>

          <a-form-item label="确认密码" name="confirmPassword" :rules="confirmPasswordRules">
            <a-input-password v-model:value="form.confirmPassword" size="large" autocomplete="new-password" placeholder="再次输入密码">
              <template #prefix><lock-outlined /></template>
            </a-input-password>
          </a-form-item>

          <a-button type="primary" html-type="submit" size="large" block :loading="loading">创建账号</a-button>
        </a-form>

        <footer><span>已有账号？</span><router-link to="/login">立即登录</router-link><router-link to="/blog">返回博客</router-link></footer>
      </div>
    </section>
  </main>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { IdcardOutlined, LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons-vue'

import { useUserStore } from '@/stores/user'
import { validatePasswordConfirmation } from '@/views/register/validation'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const registerError = ref('')

const form = reactive({
  username: '',
  nickname: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const usernameRules = [
  { required: true, message: '请输入用户名' },
  { min: 3, max: 20, message: '长度在 3 到 20 个字符' }
]
const nicknameRules = [
  { required: true, message: '请输入昵称' },
  { min: 2, max: 20, message: '长度在 2 到 20 个字符' }
]
const emailRules = [
  { required: true, message: '请输入邮箱' },
  { type: 'email', message: '请输入有效的邮箱地址' }
]
const passwordRules = [
  { required: true, message: '请输入密码' },
  { min: 6, max: 20, message: '长度在 6 到 20 个字符' }
]
const confirmPasswordRules = [
  { validator: () => validatePasswordConfirmation(form.password, form.confirmPassword), trigger: 'change' }
]

const handleRegister = async () => {
  loading.value = true
  registerError.value = ''
  try {
    await userStore.register({
      username: form.username,
      nickname: form.nickname,
      email: form.email,
      password: form.password,
      confirm_password: form.confirmPassword
    })
    message.success('注册成功')
    await router.push('/dashboard')
  } catch (error) {
    registerError.value = error?.message || '注册失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.register-page { display: grid; min-height: 100vh; grid-template-columns: minmax(420px, .92fr) minmax(500px, 1.08fr); background: var(--color-page); }
.register-intro { position: relative; display: flex; overflow: hidden; padding: 46px 56px; flex-direction: column; justify-content: space-between; background: #10182b; color: white; }
.register-intro::before { position: absolute; inset: auto -120px 8% auto; width: 420px; height: 420px; border: 1px solid rgb(255 255 255 / 8%); border-radius: 50%; background: radial-gradient(circle, rgb(22 163 106 / 24%), transparent 70%); content: ''; }
.register-intro > * { position: relative; z-index: 1; }
.register-brand { display: flex; align-items: center; gap: 12px; color: white; font-size: 18px; }
.register-brand span { display: grid; width: 40px; height: 40px; place-items: center; border-radius: 10px; background: var(--color-primary); font-weight: 800; }
.register-kicker { color: #8fb0ff; font-size: 10px; font-weight: 800; letter-spacing: .18em; }
.register-intro h1 { max-width: 620px; margin: 18px 0; font-size: clamp(34px, 4.2vw, 56px); line-height: 1.14; }
.register-intro p { max-width: 560px; color: #aeb9ce; font-size: 17px; line-height: 1.8; }
.register-intro small { color: #8290ab; }
.register-panel { display: grid; padding: 32px; place-items: center; }
.register-card { width: min(100%, 460px); padding: 38px; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: white; box-shadow: var(--shadow-float); }
.register-card header { margin-bottom: 24px; }
.register-card h2 { margin: 8px 0 5px; color: var(--color-text); font-size: 28px; }
.register-card header p, .register-card footer { color: var(--color-text-secondary); }
.register-alert { margin-bottom: 18px; }
.register-card :deep(.ant-form-item) { margin-bottom: 16px; }
.register-card :deep(.ant-form-item-label > label) { color: var(--color-text); font-weight: 650; }
.register-card :deep(.ant-input-affix-wrapper) { border-radius: 10px; }
.register-card :deep(.ant-btn) { height: 46px; margin-top: 4px; border-radius: 10px; font-weight: 700; }
.register-card footer { display: flex; margin-top: 22px; gap: 6px; font-size: 12px; }
.register-card footer a:last-child { margin-left: auto; }
.register-card a { color: var(--color-primary); font-weight: 650; }
@media (max-width: 900px) { .register-page { grid-template-columns: 1fr; } .register-intro { min-height: 230px; padding: 30px; } .register-intro h1 { margin-block: 12px; font-size: 36px; } .register-intro p { margin: 0; font-size: 14px; } .register-intro small { display: none; } .register-panel { padding: 24px 16px; } }
@media (max-width: 480px) { .register-card { padding: 28px 22px; } .register-intro { min-height: 210px; padding: 24px 20px; } .register-intro h1 { font-size: 30px; } .register-card footer { flex-wrap: wrap; } .register-card footer a:last-child { margin-left: 0; } }
</style> 
