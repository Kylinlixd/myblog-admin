import DOMPurify from 'dompurify'
import CryptoJS from 'crypto-js'

// XSS 防护
export const sanitizeHTML = (content: string): string => {
  return DOMPurify.sanitize(content)
}

// 输入验证
export const validateInput = (input: string, type: 'text' | 'email' | 'url'): boolean => {
  const patterns = {
    text: /^[\u4e00-\u9fa5a-zA-Z0-9\s\-_.,!?()]{1,500}$/,
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    url: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/
  }
  return patterns[type].test(input)
}

// 数据加密
export const encrypt = (data: string, key: string): string => {
  return CryptoJS.AES.encrypt(data, key).toString()
}

// 数据解密
export const decrypt = (encryptedData: string, key: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, key)
  return bytes.toString(CryptoJS.enc.Utf8)
}

// 防止 CSRF 攻击
export const getCSRFToken = (): string => {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
}

// 安全的 JSON 解析
export const safeJSONParse = <T>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json) as T
  } catch (error) {
    console.error('JSON 解析错误:', error)
    return fallback
  }
}

// 安全的本地存储
export const safeStorage = {
  set: (key: string, value: any): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('存储数据失败:', error)
    }
  },
  
  get: <T>(key: string, fallback: T): T => {
    try {
      const value = localStorage.getItem(key)
      return value ? JSON.parse(value) as T : fallback
    } catch (error) {
      console.error('读取数据失败:', error)
      return fallback
    }
  },
  
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('删除数据失败:', error)
    }
  }
}

// 安全的 URL 处理
export const safeURL = {
  encode: (url: string): string => {
    try {
      return encodeURIComponent(url)
    } catch (error) {
      console.error('URL 编码失败:', error)
      return ''
    }
  },
  
  decode: (url: string): string => {
    try {
      return decodeURIComponent(url)
    } catch (error) {
      console.error('URL 解码失败:', error)
      return ''
    }
  }
}

// 密码强度检查
export const checkPasswordStrength = (password: string): {
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = []
  let score = 0

  if (password.length < 8) {
    feedback.push('密码长度至少需要8个字符')
  } else {
    score += 1
  }

  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push('建议包含大写字母')
  }

  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    feedback.push('建议包含小写字母')
  }

  if (/[0-9]/.test(password)) {
    score += 1
  } else {
    feedback.push('建议包含数字')
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1
  } else {
    feedback.push('建议包含特殊字符')
  }

  return { score, feedback }
} 