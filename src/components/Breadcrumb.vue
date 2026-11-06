<template>
  <nav class="breadcrumb" :aria-label="t('shell.adminNavAria')">
    <div class="breadcrumb-item" v-for="(item, index) in breadcrumbs" :key="index">
      <span v-if="index === breadcrumbs.length - 1" class="current">{{ item.title }}</span>
      <router-link v-else :to="item.path">{{ item.title }}</router-link>
      <span v-if="index < breadcrumbs.length - 1" class="separator">/</span>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { t } from '@/i18n'

const route = useRoute()

const breadcrumbs = computed(() => {
  const items = []
  const matched = (route.matched || []).filter(item => item.meta && item.meta.title)
  
  items.push({
    path: '/dashboard',
    title: t('shell.home')
  })
  
  matched.forEach(item => {
    if (item.path === '/dashboard') return
    
    const path = item.path
    // meta.title 已全部 i18n key 化：面包屑在此解析，随语言切换更新
    const title = t(item.meta.title)
    
    items.push({
      path,
      title
    })
  })
  
  return items
})
</script>

<style scoped lang="scss">
.breadcrumb {
  display: flex;
  align-items: center;
  
  .breadcrumb-item {
    display: flex;
    align-items: center;
    
    a {
      color: var(--color-text-muted);
      text-decoration: none;
      transition: color 0.2s;
      
      &:hover {
        color: var(--color-primary);
      }
    }
    
    .current {
      color: var(--color-text-secondary);
      font-weight: 500;
    }
    
    .separator {
      margin: 0 8px;
      color: var(--color-border-strong, #c7d0df);
    }
  }
}
</style>
