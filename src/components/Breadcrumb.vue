<template>
  <div class="breadcrumb">
    <div class="breadcrumb-item" v-for="(item, index) in breadcrumbs" :key="index">
      <span v-if="index === breadcrumbs.length - 1" class="current">{{ item.title }}</span>
      <router-link v-else :to="item.path">{{ item.title }}</router-link>
      <span v-if="index < breadcrumbs.length - 1" class="separator">/</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// 根据当前路由计算面包屑
const breadcrumbs = computed(() => {
  const items = []
  const matched = route.matched.filter(item => item.meta && item.meta.title)
  
  // 添加首页
  items.push({
    path: '/dashboard',
    title: '首页'
  })
  
  // 添加当前路由的匹配项
  matched.forEach(item => {
    if (item.path === '/dashboard') return
    
    const path = item.path
    const title = item.meta.title
    
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
      color: var(--text-secondary);
      text-decoration: none;
      transition: color 0.2s;
      
      &:hover {
        color: var(--primary-color);
      }
    }
    
    .current {
      color: var(--text-primary);
      font-weight: 500;
    }
    
    .separator {
      margin: 0 8px;
      color: var(--text-tertiary);
    }
  }
}
</style> 