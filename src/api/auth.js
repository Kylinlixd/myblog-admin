import request from '@/services/http/client'
import {
  clearSession,
  getRefreshToken,
  saveSession
} from '@/services/http/tokenStorage'

export function persistAuthResponse(response) {
  const session = response?.data || response
  if (!session?.access) {
    throw new TypeError('登录响应缺少 access token')
  }
  saveSession({ access: session.access, refresh: session.refresh })
  return response
}

export async function login(data) {
  const response = await request.post('/api/auth/login/', data)
  return persistAuthResponse(response)
}

export async function register(data) {
  const response = await request.post('/api/auth/register/', data)
  return persistAuthResponse(response)
}

export const getUserInfo = () => request.get('/api/auth/info/')

export const changePassword = ({ oldPassword, newPassword }) =>
  request.put('/api/auth/password/', {
    old_password: oldPassword,
    new_password: newPassword
  })

export const updateUserProfile = (data) => request.put('/api/auth/profile/', data)

export async function refreshToken() {
  const refresh = getRefreshToken()
  if (!refresh) throw new TypeError('缺少 refresh token')

  const response = await request.post('/api/token/refresh/', { refresh })
  const session = response?.data || response
  saveSession({ access: session.access, refresh: session.refresh || refresh })
  return response
}

export async function logout() {
  try {
    return await request.post('/api/auth/logout/')
  } finally {
    clearSession()
  }
}

export function toggleMockDataMode(enabled) {
  localStorage.setItem('useMockData', enabled ? 'true' : 'false')
  return enabled
}
