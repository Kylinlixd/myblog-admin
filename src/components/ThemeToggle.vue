<template>
  <div class="theme-toggle" @click="handleToggle">
    <BulbOutlined v-if="currentTheme === 'light'" />
    <BulbFilled v-else />
  </div>
</template>

<script setup>
import { BulbOutlined, BulbFilled } from '@ant-design/icons-vue'
import { useThemeStore } from '../stores/theme'
import { storeToRefs } from 'pinia'

const themeStore = useThemeStore()
const { currentTheme } = storeToRefs(themeStore)

const handleToggle = () => {
  themeStore.toggleTheme()
}
</script>

<style scoped lang="scss">
.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all var(--transition-duration) ease;
  
  &:hover {
    background: var(--background-light);
    color: var(--primary-color);
  }
  
  &:active {
    transform: scale(0.95);
  }
}
</style> 