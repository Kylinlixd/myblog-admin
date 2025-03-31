// 环境变量工具
const env = {
  VITE_API_BASE_URL: '/api',
  NODE_ENV: process.env.NODE_ENV || 'development'
}

export function getEnvValue(key, defaultValue = '') {
  if (env.NODE_ENV === 'test') {
    return defaultValue
  }
  return env[key] || defaultValue
} 