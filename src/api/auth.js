import request from '@/services/http/client'
import {
  clearSession,
  saveSession
} from '@/services/http/tokenStorage'

import { unwrapApiResponse } from './response'

export function persistAuthResponse(response) {
  const session = response?.data?.data || response?.data || response
  if (!session?.access) {
    throw new TypeError('登录响应缺少 access token')
  }
  saveSession({ access: session.access })
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

export async function uploadAvatar(file) {
  if (!file) throw new TypeError('缺少头像文件')

  const formData = new FormData()
  formData.append('file', file)
  const payload = unwrapApiResponse(
    await request.post('/api/upload/avatar', formData),
    '头像上传失败'
  )

  if (typeof payload === 'string') {
    if (!payload) throw new TypeError('头像上传响应缺少可用 URL')
    return { url: payload }
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new TypeError('头像上传响应缺少可用 URL')
  }

  const result = {
    ...payload,
    url: payload.url ?? payload.avatar_url ?? payload.avatar ?? null
  }
  if (!result.url) throw new TypeError('头像上传响应缺少可用 URL')
  return result
}

export async function refreshToken() {
  const response = await request.post('/api/token/refresh/', null)
  const session = response?.data?.data || response?.data || response
  saveSession({ access: session.access })
  return response
}

export async function logout() {
  try {
    return await request.post('/api/auth/logout/')
  } finally {
    clearSession()
  }
}
