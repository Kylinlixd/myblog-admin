import request from '@/services/http/client'
import {
  clearSession,
  saveSession
} from '@/services/http/tokenStorage'

import { unwrapApiResponse } from './response'
import { t } from '@/i18n'

export function persistAuthResponse(response) {
  const session = response?.data?.data || response?.data || response
  if (!session?.access) {
    throw new TypeError(t('login.noToken'))
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
  if (!file) throw new TypeError(t('login.missingAvatarFile'))

  const formData = new FormData()
  formData.append('file', file)
  const payload = unwrapApiResponse(
    await request.post('/api/upload/avatar/', formData),
    t('profile.avatarFailed')
  )

  if (typeof payload === 'string') {
    if (!payload) throw new TypeError(t('profile.avatarInvalidResponse'))
    return { url: payload }
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new TypeError(t('profile.avatarInvalidResponse'))
  }

  const result = {
    ...payload,
    url: payload.url ?? payload.avatar_url ?? payload.avatar ?? null
  }
  if (!result.url) throw new TypeError(t('profile.avatarInvalidResponse'))
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
