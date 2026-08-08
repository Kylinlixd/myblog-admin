import axios from 'axios'

import { createHttpClient } from '../client'
import { getAccessToken, getRefreshToken, saveSession } from '../tokenStorage'

jest.mock('@/utils/apiBaseUrl', () => ({
  getApiBaseUrl: () => 'https://api.example.test'
}))

describe('HTTP client', () => {
  beforeEach(() => localStorage.clear())

  it('adds the bearer token and returns the API envelope', async () => {
    saveSession({ access: 'access-value', refresh: 'refresh-value' })
    const adapter = jest.fn(async (config) => ({
      config,
      status: 200,
      statusText: 'OK',
      headers: {},
      data: { code: 200, data: { id: 7 }, message: 'success' }
    }))
    const client = createHttpClient({ adapter })

    const response = await client.get('/api/example/')

    expect(adapter.mock.calls[0][0].headers.Authorization).toBe('Bearer access-value')
    expect(response).toEqual({ code: 200, data: { id: 7 }, message: 'success' })
  })

  it('does not add a request ID to read-only requests', async () => {
    const adapter = jest.fn(async (config) => ({
      config,
      status: 200,
      statusText: 'OK',
      headers: {},
      data: { code: 200, data: [], message: 'success' }
    }))
    const client = createHttpClient({ adapter })

    await client.get('/api/example/')

    expect(adapter.mock.calls[0][0].headers['X-Request-ID']).toBeUndefined()
  })

  it('refreshes through the configured API root and unwraps the refresh envelope', async () => {
    saveSession({ access: 'expired-access', refresh: 'refresh-value' })
    const refreshPost = jest.spyOn(axios, 'post').mockResolvedValue({
      data: {
        code: 200,
        message: 'success',
        data: { access: 'fresh-access', refresh: 'fresh-refresh' }
      }
    })
    const adapter = jest.fn(async (config) => {
      if (adapter.mock.calls.length === 1) {
        return Promise.reject({
          config,
          response: { status: 401, data: { code: 401, message: '登录已过期' } }
        })
      }

      return {
        config,
        status: 200,
        statusText: 'OK',
        headers: {},
        data: { code: 200, data: { id: 7 }, message: 'success' }
      }
    })
    const client = createHttpClient({ adapter })

    await expect(client.get('/api/example/')).resolves.toEqual({
      code: 200,
      data: { id: 7 },
      message: 'success'
    })

    expect(refreshPost).toHaveBeenCalledWith(
      'https://api.example.test/api/token/refresh/',
      { refresh: 'refresh-value' },
      { withCredentials: true }
    )
    expect(getAccessToken()).toBe('fresh-access')
    expect(getRefreshToken()).toBe('fresh-refresh')
  })
})
