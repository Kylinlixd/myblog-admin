import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const currentTheme = ref(localStorage.getItem('theme') || 'light')
  
  // 是否为暗色主题
  const isDark = computed(() => currentTheme.value === 'dark')
  
  // 切换主题
  const toggleTheme = () => {
    currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
    localStorage.setItem('theme', currentTheme.value)
    applyTheme(currentTheme.value)
  }
  
  // 应用主题
  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme)
    // 更新 Element Plus 主题
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `//unpkg.com/element-plus/dist/index.css`
    document.head.appendChild(link)
  }
  
  // 初始化主题
  const initTheme = () => {
    applyTheme(currentTheme.value)
  }
  
  return {
    currentTheme,
    isDark,
    toggleTheme,
    initTheme
  }
}) 