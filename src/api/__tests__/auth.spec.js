import { persistAuthResponse } from '../auth'
import { getAccessToken, getRefreshToken } from '@/services/http/tokenStorage'

describe('authentication API contract', () => {
  beforeEach(() => localStorage.clear())

  it('persists the backend access and refresh pair', () => {
    persistAuthResponse({
      code: 200,
      data: { access: 'access-value', refresh: 'refresh-value' },
      message: '登录成功'
    })

    expect(getAccessToken()).toBe('access-value')
    expect(getRefreshToken()).toBe('refresh-value')
  })

  it('rejects a successful response without an access token', () => {
    expect(() => persistAuthResponse({ code: 200, data: {} })).toThrow(
      '登录响应缺少 access token'
    )
  })
})
