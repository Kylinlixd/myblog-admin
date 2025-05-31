import DOMPurify from 'dompurify'

// XSS 防护
export const sanitizeHTML = (content: string): string => {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'code', 'pre', 'blockquote', 'img', 'br', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target']
  })
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
      const serializedValue = JSON.stringify(value)
      localStorage.setItem(key, serializedValue)
    } catch (error) {
      console.error('存储数据失败:', error)
    }
  },
  
  get: <T>(key: string, fallback: T): T => {
    try {
      const serializedValue = localStorage.getItem(key)
      return serializedValue ? JSON.parse(serializedValue) as T : fallback
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