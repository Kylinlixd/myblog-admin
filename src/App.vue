<template>
  <router-view v-slot="{ Component }">
    <transition name="page-fade" mode="out-in">
      <keep-alive :include="cachedViews">
        <component :is="Component" />
      </keep-alive>
    </transition>
  </router-view>

  <div v-if="appStore.isLoading" class="app-loading" role="status" aria-live="polite">
    <span class="app-loading__spinner" aria-hidden="true" />
    <span>{{ appStore.loadingText }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import { useAppStore } from '@/stores/app'

const router = useRouter()
const appStore = useAppStore()

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

.app-loading {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 2000;
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 12px 16px;
  color: var(--color-text);
  background: color-mix(in srgb, var(--color-surface) 92%, transparent);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  box-shadow: var(--shadow-float);
  backdrop-filter: blur(14px);
}

.app-loading__spinner {
  width: 18px;
  height: 18px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: app-spin 700ms linear infinite;
}

@keyframes app-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
