// 环境变量工具
const env = {
  // 后台管理API路径前缀
  VITE_API_BASE_URL: '/api',
  // 前台博客API路径前缀 - 明确分开，避免冲突
  VITE_BLOG_API_BASE_URL: '/blog',
  NODE_ENV: process.env.NODE_ENV || 'development'
}

export function getEnvValue(key, defaultValue = '') {
  if (env.NODE_ENV === 'test') {
    return defaultValue
  }
  
  // 检查环境变量是否存在，优先使用import.meta中的值
  if (import.meta && import.meta.env && import.meta.env[key] !== undefined) {
    return import.meta.env[key]
  }
  
  return env[key] || defaultValue
} 