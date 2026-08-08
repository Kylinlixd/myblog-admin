import { ApiError, normalizeApiError } from '../errors'

describe('normalizeApiError', () => {
  it('normalizes a DRF response and preserves its request ID', () => {
    const error = normalizeApiError({
      response: {
        status: 400,
        data: {
          code: 400,
          message: '输入有误',
          data: { title: ['标题不能为空'] },
          requestId: 'request-123'
        }
      }
    })

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(400)
    expect(error.message).toBe('输入有误')
    expect(error.fieldErrors).toEqual({ title: ['标题不能为空'] })
    expect(error.requestId).toBe('request-123')
  })

  it('uses a useful message for network failures', () => {
    const error = normalizeApiError({ request: {} })

    expect(error.status).toBe(0)
    expect(error.message).toBe('网络连接失败，请稍后重试')
  })
})
