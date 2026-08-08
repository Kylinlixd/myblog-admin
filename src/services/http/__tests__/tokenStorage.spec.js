import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  saveSession
} from '../tokenStorage'

describe('tokenStorage', () => {
  beforeEach(() => localStorage.clear())

  it('stores raw access and refresh tokens', () => {
    saveSession({ access: 'access-value', refresh: 'refresh-value' })

    expect(getAccessToken()).toBe('access-value')
    expect(getRefreshToken()).toBe('refresh-value')
    expect(localStorage.getItem('blog.accessToken')).toBe('access-value')
  })

  it('requires an access token', () => {
    expect(() => saveSession({ refresh: 'refresh-value' })).toThrow(
      'access token is required'
    )
  })

  it('clears the complete session', () => {
    saveSession({ access: 'a', refresh: 'r' })
    clearSession()

    expect(getAccessToken()).toBe('')
    expect(getRefreshToken()).toBe('')
  })
})
