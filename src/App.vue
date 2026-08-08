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
        <span class="loading-toast__copy"><strong>正在处理</strong><span>{{ appStore.loadingText }}</span></span>
      </div>
    </transition>
  </a-config-provider>
</template>

<script setup>
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import { useAppStore } from '@/stores/app'

const router = useRouter()
const appStore = useAppStore()

const antLocale = {
  ...zhCN,
  Pagination: {
    ...zhCN.Pagination,
    items_per_page: '/页'
  }
}

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
  z-index: 2000;
  display: grid;
  width: min(320px, calc(100vw - 32px));
  min-height: 68px;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  overflow: hidden;
  padding: 12px 16px;
  border: 1px solid #243c63;
  border-radius: 14px;
  background: #0b192e;
  color: #edf3ff;
  box-shadow: 0 18px 44px rgb(4 11 23 / 30%);
}

.loading-toast::before {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 3px;
  background: #789cff;
  content: '';
}

.loading-toast__status {
  position: relative;
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border: 1px solid rgb(120 156 255 / 30%);
  border-radius: 50%;
  background: rgb(120 156 255 / 10%);
}

.loading-toast__status::before {
  position: absolute;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #8ca9ff;
  box-shadow: 0 0 12px rgb(120 156 255 / 80%);
  content: '';
}

.loading-toast__status i {
  position: absolute;
  inset: -1px;
  border: 1px solid transparent;
  border-top-color: #9ab3ff;
  border-radius: 50%;
  animation: loading-orbit 900ms linear infinite;
}

.loading-toast__copy {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.loading-toast__copy strong { color: #edf3ff; font-size: 12px; letter-spacing: .03em; }
.loading-toast__copy > span { overflow: hidden; color: #9eafca; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
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
  .loading-toast__status i { animation: none; border-color: rgb(154 179 255 / 45%); }
}
</style>
