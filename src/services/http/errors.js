import { t } from '@/i18n'

export class ApiError extends Error {
  constructor({ status = 0, code = status, message, fieldErrors = null, requestId = null }) {
    super(typeof message === 'string' ? message : t('common.requestFailed'))
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
    this.requestId = requestId
  }
}

export function normalizeApiError(error) {
  if (error instanceof ApiError) return error

  const response = error?.response
  if (!response) {
    return new ApiError({
      status: 0,
      code: 'NETWORK_ERROR',
      message: t('common.networkError')
    })
  }

  const payload = response.data || {}
  return new ApiError({
    status: response.status,
    code: payload.code ?? response.status,
    message: typeof payload.message === 'string' ? payload.message : t('common.requestFailed'),
    fieldErrors: payload.data && typeof payload.data === 'object' ? payload.data : null,
    requestId: payload.requestId || response.headers?.['x-request-id'] || null
  })
}
