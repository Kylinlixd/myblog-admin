import { createApp } from 'vue'
import { message } from 'ant-design-vue'
import NProgress from 'nprogress'
import 'ant-design-vue/dist/reset.css'

import App from './App.vue'
import router from './router'
import { pinia, useUserStore } from './stores'
import { t, applyInitialLocale } from './i18n'
import './styles/main.scss'

const app = createApp(App)

router.beforeEach(() => {
  NProgress.start()
})

router.afterEach(() => {
  NProgress.done()
})

router.onError(() => {
  NProgress.done()
})

app.config.errorHandler = (error) => {
  console.error('[Vue]', error)
  message.error(t('common.pageError'))
}

app.use(pinia)
app.use(router)

// 挂载前确保初始语言包就绪：非默认语言的访客首帧即目标语言，不出现中文闪变。
// zh 为同步内联（no-op）；其他语言是一次性 ~15KB 同源加载，之后走内存 + HTTP 缓存。
// 语言包加载失败不阻塞启动：t() 会回退默认语言文案。
void (async () => {
  try {
    await applyInitialLocale()
  } catch (error) {
    console.warn('[i18n] 初始语言包加载失败，使用默认语言启动', error)
  }
  app.mount('#app')
  document.documentElement.dataset.appReady = 'true'
})()

function clearLegacyServiceWorkers() {
  if (!('serviceWorker' in navigator)) return

  navigator.serviceWorker.getRegistrations()
    .then((registrations) => {
      registrations.forEach((registration) => registration.unregister())
    })
    .catch((error) => {
      console.warn('[ServiceWorker] 清理旧缓存代理失败', error)
    })
}

clearLegacyServiceWorkers()

window.addEventListener('auth:expired', () => {
  useUserStore().clearUserData()
  if (router.currentRoute.value.meta.requiresAuth) {
    router.replace({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } })
  }
})

if (!window.location.pathname.startsWith('/blog')) {
  useUserStore().initialize().catch((error) => {
    console.warn('[Auth] 用户会话初始化失败', error)
  })
}
