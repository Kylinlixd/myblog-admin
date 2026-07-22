export class ApiError extends Error {
  constructor({ status = 0, code = status, message, fieldErrors = null, requestId = null }) {
    super(message)
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
      message: '网络连接失败，请稍后重试'
    })
  }

  const payload = response.data || {}
  return new ApiError({
    status: response.status,
    code: payload.code ?? response.status,
    message: typeof payload.message === 'string' ? payload.message : '请求处理失败',
    fieldErrors: payload.data && typeof payload.data === 'object' ? payload.data : null,
    requestId: payload.requestId || response.headers?.['x-request-id'] || null
  })
}
