import axios from 'axios'

import { generateRequestId } from '@/utils/uuid'

import { normalizeApiError } from './errors'
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  saveSession
} from './tokenStorage'

export function createHttpClient(options = {}) {
  const client = axios.create({
    baseURL: '',
    timeout: 15000,
    withCredentials: true,
    ...options
  })
  let refreshPromise = null

  client.interceptors.request.use((config) => {
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    config.headers['X-Request-ID'] = generateRequestId()

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    return config
  })

  client.interceptors.response.use(
    (response) => response.data,
    async (error) => {
      const original = error.config
      const refresh = getRefreshToken()
      const canRefresh = error.response?.status === 401 && refresh && !original?._retry

      if (canRefresh) {
        original._retry = true
        refreshPromise ||= axios
          .post('/api/token/refresh/', { refresh }, { withCredentials: true })
          .then(({ data }) => {
            saveSession({ access: data.access, refresh: data.refresh || refresh })
            return data.access
          })
          .finally(() => {
            refreshPromise = null
          })

        try {
          const access = await refreshPromise
          original.headers.Authorization = `Bearer ${access}`
          return client(original)
        } catch (refreshError) {
          clearSession()
          window.dispatchEvent(new CustomEvent('auth:expired'))
          throw normalizeApiError(refreshError)
        }
      }

      throw normalizeApiError(error)
    }
  )

  return client
}

export default createHttpClient()
