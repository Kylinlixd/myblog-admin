<template>
  <a-config-provider :locale="antLocale">
    <router-view v-slot="{ Component }">
      <transition name="page-fade" mode="out-in">
        <keep-alive :include="cachedViews">
          <component :is="Component" />
        </keep-alive>
      </transition>
    </router-view>

    <transition name="loading-toast">
      <div v-if="appStore.isLoading" class="loading-toast" role="status" aria-live="polite">
        <span class="loading-toast__status" aria-hidden="true"><i /></span>
        <span class="loading-toast__copy"><strong>{{ t('common.processing') }}</strong><span>{{ appStore.loadingText }}</span></span>
      </div>
    </transition>
  </a-config-provider>
</template>

<script setup>
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { useAppStore } from '@/stores/app'
import { currentLocale, t } from '@/i18n'

const router = useRouter()
const appStore = useAppStore()

// antd 组件语言跟随应用语言：zh 内联（默认零开销），其余语言包按需加载并缓存，
// 与 i18n 词典同一套加载策略——主包不因多语言而增重。
const ANTD_LOCALES = {
  en: () => import('ant-design-vue/es/locale/en_US'),
  ja: () => import('ant-design-vue/es/locale/ja_JP'),
  ko: () => import('ant-design-vue/es/locale/ko_KR'),
  es: () => import('ant-design-vue/es/locale/es_ES'),
  fr: () => import('ant-design-vue/es/locale/fr_FR')
}
const antLocale = ref(zhCN)
const antLocaleCache = new Map([['zh', zhCN]])

watch(currentLocale, async (code) => {
  const cached = antLocaleCache.get(code)
  if (cached) {
    antLocale.value = cached
    return
  }
  const loader = ANTD_LOCALES[code]
  if (!loader) return
  try {
    const module = await loader()
    antLocaleCache.set(code, module.default)
    // 异步落地期间用户可能已切走，回填前校验仍是当前语言
    if (currentLocale.value === code) antLocale.value = module.default
  } catch (error) {
    console.warn(`[i18n] antd 语言包 ${code} 加载失败，继续使用当前语言`, error)
  }
}, { immediate: true })

const cachedViews = computed(() =>
  router
    .getRoutes()
    .filter((route) => route.meta?.keepAlive && route.name)
    .map((route) => route.name)
)
</script>

<style lang="scss">
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 160ms ease;
}

.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}

.loading-toast {
  position: fixed;
  right: 24px;
  bottom: max(24px, env(safe-area-inset-bottom));
  z-index: var(--z-overlay, 1000);
  display: grid;
  width: min(320px, calc(100vw - 32px));
  min-height: 68px;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  overflow: hidden;
  padding: 12px 16px;
  border: 1px solid var(--blog-line, rgb(78 62 45 / 16%));
  border-radius: 18px;
  background: rgb(255 253 248 / 94%);
  color: var(--blog-text, #172436);
  box-shadow: 0 16px 34px rgb(88 65 37 / 12%);
  backdrop-filter: blur(16px);
}

.loading-toast::before {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 3px;
  background: #2a7180;
  opacity: .75;
  content: '';
}

.loading-toast__status {
  position: relative;
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border: 1px solid rgb(42 113 128 / 42%);
  border-radius: 50%;
  background: rgb(42 113 128 / 8%);
}

.loading-toast__status::before {
  position: absolute;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #2a7180;
  box-shadow: 0 0 12px rgb(42 113 128 / 35%);
  content: '';
}

.loading-toast__status i {
  position: absolute;
  inset: -1px;
  border: 1px solid transparent;
  border-top-color: #2a7180;
  border-radius: 50%;
  animation: loading-orbit 900ms linear infinite;
}

.loading-toast__copy {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.loading-toast__copy strong { color: var(--blog-text, #172436); font-size: 12px; letter-spacing: .03em; }
.loading-toast__copy > span { overflow: hidden; color: var(--blog-text-muted, #7a746a); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.loading-toast-enter-active, .loading-toast-leave-active { transition: opacity 180ms ease, transform 180ms ease; }
.loading-toast-enter-from, .loading-toast-leave-to { opacity: 0; transform: translate3d(0, 8px, 0); }

@keyframes loading-orbit {
  to { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .loading-toast { right: 14px; bottom: max(14px, env(safe-area-inset-bottom)); width: calc(100vw - 28px); }
}

@media (prefers-reduced-motion: reduce) {
  .loading-toast-enter-active, .loading-toast-leave-active { transition: opacity 100ms linear; }
  .loading-toast-enter-from, .loading-toast-leave-to { transform: none; }
  .loading-toast__status i { animation: none; border-color: rgb(42 113 128 / 42%); }
}
</style>
