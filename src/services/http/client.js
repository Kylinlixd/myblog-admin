import axios from 'axios'

import { getApiBaseUrl } from '@/utils/apiBaseUrl'
import { normalizeApiError } from './errors'
import {
  clearSession,
  getAccessToken,
  saveSession
} from './tokenStorage'

const RETRYABLE_METHODS = new Set(['get', 'head', 'options'])
const RETRYABLE_STATUSES = new Set([408, 425, 429, 502, 503, 504])
const DEFAULT_RETRY_COUNT = 2
const DEFAULT_RETRY_DELAY_MS = 250

const wait = (milliseconds) => milliseconds > 0
  ? new Promise((resolve) => setTimeout(resolve, milliseconds))
  : Promise.resolve()

// 只重试幂等请求，避免点赞、评论等写操作因为网络抖动被重复提交。
const shouldRetryRequest = (error) => {
  const config = error?.config
  const method = String(config?.method || 'get').toLowerCase()
  const status = error?.response?.status

  return Boolean(config)
    && RETRYABLE_METHODS.has(method)
    && (!error.response || RETRYABLE_STATUSES.has(status))
}

export function createHttpClient(options = {}) {
  const {
    maxRetries = DEFAULT_RETRY_COUNT,
    retryDelayMs = DEFAULT_RETRY_DELAY_MS,
    ...axiosOptions
  } = options
  const client = axios.create({
    baseURL: getApiBaseUrl(),
    timeout: 15000,
    withCredentials: true,
    ...axiosOptions
  })
  const retryLimit = Math.max(0, Number(maxRetries) || 0)
  const retryDelay = Math.max(0, Number(retryDelayMs) || 0)
  let refreshPromise = null

  client.interceptors.request.use((config) => {
    const token = getAccessToken()
    const requestUrl = String(config.url || '')
    const isPublicBlogRequest = requestUrl.includes('/api/blog/') || requestUrl.endsWith('/api/blog')
    if (token && !isPublicBlogRequest) {
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
      const isPublicBlogRequest = requestUrl.includes('/api/blog/') || requestUrl.endsWith('/api/blog')
      const retryCount = Number(original?.__retryCount || 0)

      // 公开博客页面依赖 GET 请求，偶发断连不应直接让整页进入错误状态。
      if (shouldRetryRequest(error) && retryCount < retryLimit) {
        original.__retryCount = retryCount + 1
        await wait(retryDelay * original.__retryCount)
        return client(original)
      }

      const canRefresh = error.response?.status === 401 && !original?._retry && !requestUrl.includes('/auth/login') && !isPublicBlogRequest

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
