// XSS 防护
export const sanitizeHtml = (html) => {
  if (!html) return ''
  
  return html.replace(/[&<>"']/g, (match) => {
    const escape = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }
    return escape[match]
  })
}

// CSRF Token 管理
export const getCsrfToken = () => {
  return document.querySelector('meta[name="csrf-token"]')?.content
}

export const setCsrfToken = (token) => {
  let meta = document.querySelector('meta[name="csrf-token"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'csrf-token'
    document.head.appendChild(meta)
  }
  meta.content = token
}

// 密码强度检查
export const checkPasswordStrength = (password) => {
  if (!password) return 0
  
  let strength = 0
  // 长度检查
  if (password.length >= 8) strength++
  // 包含数字
  if (/\d/.test(password)) strength++
  // 包含小写字母
  if (/[a-z]/.test(password)) strength++
  // 包含大写字母
  if (/[A-Z]/.test(password)) strength++
  // 包含特殊字符
  if (/[^A-Za-z0-9]/.test(password)) strength++
  
  return strength
}

// 敏感数据过滤
export const filterSensitiveData = (data) => {
  if (!data) return data
  
  const sensitiveFields = ['password', 'token', 'secret', 'key']
  const filtered = { ...data }
  
  Object.keys(filtered).forEach(key => {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      filtered[key] = '******'
    }
  })
  
  return filtered
}

// 输入验证
export const validateInput = {
  // 用户名验证
  username: (value) => {
    if (!value) return '用户名不能为空'
    if (value.length < 3 || value.length > 20) return '用户名长度必须在3-20个字符之间'
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) return '用户名只能包含字母、数字、下划线和连字符'
    return ''
  },
  
  // 邮箱验证
  email: (value) => {
    if (!value) return '邮箱不能为空'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return '请输入有效的邮箱地址'
    return ''
  },
  
  // URL验证
  url: (value) => {
    if (!value) return 'URL不能为空'
    try {
      new URL(value)
      return ''
    } catch {
      return '请输入有效的URL'
    }
  }
} 