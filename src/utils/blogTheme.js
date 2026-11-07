// 博客暗色模式：入口处尽早应用，避免首帧闪白
const THEME_KEY = 'blog-theme'

function systemPrefersDark() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
}

export function savedTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'dark' || saved === 'light') return saved
  } catch (error) {
    /* 隐私模式读不到就跟随系统 */
  }
  return null
}

// 在任何样式渲染前调用：main.js 模块初始化时执行
export function applyInitialTheme() {
  document.documentElement.dataset.theme = savedTheme() ?? (systemPrefersDark() ? 'dark' : 'light')
}

export function currentTheme() {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

export function toggleTheme() {
  const next = currentTheme() === 'dark' ? 'light' : 'dark'
  document.documentElement.dataset.theme = next
  try {
    localStorage.setItem(THEME_KEY, next)
  } catch (error) {
    /* 写不进就只在本页生效 */
  }
  return next
}

// 跟随系统变化（仅当用户未手动选择时）
export function watchSystemTheme() {
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
    if (!savedTheme()) applyInitialTheme()
  })
}
