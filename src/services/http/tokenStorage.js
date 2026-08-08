const ACCESS_KEY = 'blog.accessToken'
const REFRESH_KEY = 'blog.refreshToken'

export const getAccessToken = () => localStorage.getItem(ACCESS_KEY) || ''

export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY) || ''

export function saveSession({ access, refresh }) {
  if (!access) {
    throw new TypeError('access token is required')
  }

  localStorage.setItem(ACCESS_KEY, String(access))
  if (refresh) {
    localStorage.setItem(REFRESH_KEY, String(refresh))
  }
}

export function clearSession() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}
