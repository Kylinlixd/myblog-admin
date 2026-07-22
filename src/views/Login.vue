<template>
  <main class="login-page">
    <section class="login-intro" aria-label="产品介绍">
      <router-link class="login-brand" to="/blog"><span>L</span><strong>LiXD Studio</strong></router-link>
      <div>
        <span class="login-kicker">CONTENT WORKSPACE</span>
        <h1>让创作保持专注，<br />让管理回归简单。</h1>
        <p>在一个清晰、可靠的工作台中管理文章、分类、标签与读者评论。</p>
      </div>
      <small>© {{ year }} LiXD · Personal Blog</small>
    </section>

    <section class="login-panel">
      <div class="login-card">
        <header><span class="login-kicker">WELCOME BACK</span><h2>登录管理后台</h2><p>使用你的管理员账号继续创作。</p></header>

        <a-alert v-if="loginError" :message="loginError" type="error" show-icon class="login-alert" />

        <a-form :model="form" layout="vertical" @finish="handleLogin">
          <a-form-item label="用户名" name="username" :rules="[{ required: true, message: '请输入用户名' }]">
            <a-input v-model:value="form.username" size="large" autocomplete="username" placeholder="请输入用户名">
              <template #prefix><user-outlined /></template>
            </a-input>
          </a-form-item>
          <a-form-item label="密码" name="password" :rules="[{ required: true, message: '请输入密码' }]">
            <a-input-password v-model:value="form.password" size="large" autocomplete="current-password" placeholder="请输入密码">
              <template #prefix><lock-outlined /></template>
            </a-input-password>
          </a-form-item>
          <a-button type="primary" html-type="submit" size="large" block :loading="loading">登录</a-button>
        </a-form>

        <footer>还没有账号？<router-link to="/register">创建账号</router-link><router-link to="/blog">返回博客</router-link></footer>
      </div>
    </section>
  </main>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LockOutlined, UserOutlined } from '@ant-design/icons-vue'

import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const form = reactive({ username: '', password: '' })
const loading = ref(false)
const loginError = ref('')
const year = new Date().getFullYear()

async function handleLogin() {
  loading.value = true
  loginError.value = ''
  try {
    const success = await userStore.login(form.username, form.password)
    if (!success) {
      loginError.value = '用户名或密码错误'
      return
    }

    const requested = typeof route.query.redirect === 'string' ? route.query.redirect : ''
    await router.replace(requested.startsWith('/') ? requested : '/dashboard')
  } catch (error) {
    loginError.value = error?.message || '登录失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-page { display: grid; min-height: 100vh; grid-template-columns: minmax(420px, .9fr) minmax(480px, 1.1fr); background: var(--color-page); }
.login-intro { position: relative; display: flex; overflow: hidden; padding: 46px 56px; flex-direction: column; justify-content: space-between; background: #10182b; color: white; }
.login-intro::before { position: absolute; width: 520px; height: 520px; border: 1px solid rgb(255 255 255 / 8%); border-radius: 50%; background: radial-gradient(circle, rgb(49 91 234 / 28%), transparent 68%); content: ''; right: -160px; top: 12%; }
.login-intro > * { position: relative; z-index: 1; }
.login-brand { display: flex; align-items: center; gap: 12px; color: white; font-size: 18px; }
.login-brand span { display: grid; width: 40px; height: 40px; place-items: center; border-radius: 12px; background: var(--color-primary); font-weight: 800; }
.login-kicker { color: #7694ff; font-size: 10px; font-weight: 800; letter-spacing: .18em; }
.login-intro h1 { max-width: 640px; margin: 18px 0; font-size: clamp(38px, 5vw, 68px); line-height: 1.12; letter-spacing: -.045em; }
.login-intro p { max-width: 560px; color: #aeb9ce; font-size: 17px; line-height: 1.8; }
.login-intro small { color: #8290ab; }
.login-panel { display: grid; padding: 32px; place-items: center; }
.login-card { width: min(100%, 430px); padding: 42px; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: white; box-shadow: var(--shadow-float); }
.login-card header { margin-bottom: 30px; }
.login-card h2 { margin: 8px 0 5px; color: var(--color-text); font-size: 30px; letter-spacing: -.03em; }
.login-card header p, .login-card footer { color: var(--color-text-secondary); }
.login-alert { margin-bottom: 20px; }
.login-card :deep(.ant-form-item-label > label) { color: var(--color-text); font-weight: 650; }
.login-card :deep(.ant-input-affix-wrapper) { border-radius: 10px; }
.login-card :deep(.ant-btn) { height: 46px; margin-top: 4px; border-radius: 10px; font-weight: 700; }
.login-card footer { display: flex; margin-top: 24px; gap: 6px; font-size: 12px; }
.login-card footer a:last-child { margin-left: auto; }
.login-card a { color: var(--color-primary); font-weight: 650; }
@media (max-width: 860px) { .login-page { grid-template-columns: 1fr; } .login-intro { min-height: 250px; padding: 30px; } .login-intro h1 { margin-block: 12px; font-size: 38px; } .login-intro p { margin: 0; font-size: 14px; } .login-intro small { display: none; } .login-panel { padding: 24px 16px; } }
@media (max-width: 480px) { .login-card { padding: 28px 22px; } .login-intro { min-height: 220px; padding: 24px 20px; } .login-intro h1 { font-size: 31px; } }
</style>
