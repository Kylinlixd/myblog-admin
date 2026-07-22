import { createApp } from 'vue'
import { message } from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'

import App from './App.vue'
import router from './router'
import { pinia, useUserStore } from './stores'
import { registerAntComponents } from './config/antComponents'
import '@/styles/tailwind.css'
import './styles/main.scss'

const app = createApp(App)

app.config.errorHandler = (error) => {
  console.error('[Vue]', error)
  message.error('页面运行异常，请稍后重试')
}

app.use(pinia)
app.use(router)
registerAntComponents(app)
app.mount('#app')

window.addEventListener('auth:expired', () => {
  if (router.currentRoute.value.meta.requiresAuth) {
    router.replace({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } })
  }
})

if (!window.location.pathname.startsWith('/blog')) {
  useUserStore().initialize().catch((error) => {
    console.warn('[Auth] 用户会话初始化失败', error)
  })
}
