import axios from 'axios'

import { getApiBaseUrl } from '@/utils/apiBaseUrl'
import { normalizeApiError } from './errors'
import {
  clearSession,
  getAccessToken,
  saveSession
} from './tokenStorage'

export function createHttpClient(options = {}) {
  const client = axios.create({
    baseURL: getApiBaseUrl(),
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
    const method = (config.method || 'get').toLowerCase()
    if (!['get', 'head', 'options'].includes(method)) {
      config.headers['X-Request-ID'] = crypto.randomUUID()
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    return config
  })

  client.interceptors.response.use(
    (response) => response.data,
    async (error) => {
      const original = error.config
      const requestUrl = String(original?.url || '')
      const canRefresh = error.response?.status === 401 && !original?._retry && !requestUrl.includes('/auth/login')

      if (canRefresh) {
        original._retry = true
        const apiBaseUrl = String(client.defaults.baseURL || '').replace(/\/$/, '')
        refreshPromise ||= axios
          .post(`${apiBaseUrl}/api/token/refresh/`, null, { withCredentials: true })
          .then(({ data }) => {
            const session = data?.data || data
            saveSession({
              access: session.access
            })
            return session.access
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
