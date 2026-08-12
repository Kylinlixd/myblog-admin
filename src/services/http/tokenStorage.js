const ACCESS_KEY = 'blog.accessToken'

export const getAccessToken = () => localStorage.getItem(ACCESS_KEY) || ''

// refresh token 只由后端通过 HttpOnly Cookie 管理，前端永远不能读取或持久化它。
export const getRefreshToken = () => ''

export function saveSession({ access, refresh }) {
  if (!access) {
    throw new TypeError('access token is required')
  }

  localStorage.setItem(ACCESS_KEY, String(access))
  localStorage.removeItem('blog.refreshToken')
}

export function clearSession() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem('blog.refreshToken')
}
