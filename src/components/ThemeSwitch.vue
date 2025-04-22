<template>
  <div class="theme-switch">
    <a-dropdown @select="handleThemeChange">
      <a class="theme-switch-trigger">
        <i class="icon-theme"></i>
        {{ currentThemeLabel }}
      </a>
      <template #overlay>
        <a-menu>
          <a-menu-item key="light">
            <i class="icon-sun"></i>
            {{ t('theme.light') }}
          </a-menu-item>
          <a-menu-item key="dark">
            <i class="icon-moon"></i>
            {{ t('theme.dark') }}
          </a-menu-item>
          <a-menu-item key="high-contrast">
            <i class="icon-contrast"></i>
            {{ t('theme.highContrast') }}
          </a-menu-item>
        </a-menu>
      </template>
    </a-dropdown>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// 主题配置
const themes = {
  light: {
    label: '浅色主题',
    icon: 'icon-sun'
  },
  dark: {
    label: '深色主题',
    icon: 'icon-moon'
  },
  'high-contrast': {
    label: '高对比度',
    icon: 'icon-contrast'
  }
}

// 当前主题
const currentTheme = ref(localStorage.getItem('theme') || 'light')

// 当前主题标签
const currentThemeLabel = computed(() => {
  return themes[currentTheme.value].label
})

// 切换主题
const handleThemeChange = (theme) => {
  currentTheme.value = theme
  localStorage.setItem('theme', theme)
  document.documentElement.setAttribute('data-theme', theme)
  
  // 触发主题变更事件
  window.dispatchEvent(new CustomEvent('theme-change', { detail: { theme } }))
}

// 初始化主题
const initTheme = () => {
  document.documentElement.setAttribute('data-theme', currentTheme.value)
}

// 监听系统主题变化
const watchSystemTheme = () => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  
  const handleChange = (e) => {
    if (!localStorage.getItem('theme')) {
      currentTheme.value = e.matches ? 'dark' : 'light'
      document.documentElement.setAttribute('data-theme', currentTheme.value)
    }
  }
  
  mediaQuery.addEventListener('change', handleChange)
  
  return () => {
    mediaQuery.removeEventListener('change', handleChange)
  }
}

// 组件挂载时初始化
onMounted(() => {
  initTheme()
  const cleanup = watchSystemTheme()
  
  onUnmounted(() => {
    cleanup()
  })
})
</script>

<style lang="scss" scoped>
.theme-switch {
  .theme-switch-trigger {
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 8px 12px;
    border-radius: 4px;
    transition: background-color var(--transition-duration) var(--transition-timing);
    
    &:hover {
      background-color: var(--background-light);
    }
    
    i {
      margin-right: 8px;
      font-size: 16px;
      color: var(--text-regular);
    }
  }
}

:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  
  i {
    margin-right: 8px;
    font-size: 16px;
  }
}
</style> 