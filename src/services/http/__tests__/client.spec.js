import axios from 'axios'

import { createHttpClient } from '../client'
import { getAccessToken, getRefreshToken, saveSession } from '../tokenStorage'

jest.mock('@/utils/apiBaseUrl', () => ({
  getApiBaseUrl: () => 'https://api.example.test'
}))

describe('HTTP client', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => jest.restoreAllMocks())

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

  it.each(['get', 'head', 'options'])('does not add a request ID to %s requests', async (method) => {
    const adapter = jest.fn(async (config) => ({
      config,
      status: 200,
      statusText: 'OK',
      headers: {},
      data: { code: 200, data: [], message: 'success' }
    }))
    const client = createHttpClient({ adapter })

    await client[method]('/api/example/')

    expect(adapter.mock.calls[0][0].headers['X-Request-ID']).toBeUndefined()
  })

  it.each(['post', 'put', 'patch', 'delete'])('adds a request ID to %s requests', async (method) => {
    const adapter = jest.fn(async (config) => ({
      config,
      status: 200,
      statusText: 'OK',
      headers: {},
      data: { code: 200, data: {}, message: 'success' }
    }))
    const client = createHttpClient({ adapter })

    await client[method]('/api/example/', {})

    expect(adapter.mock.calls[0][0].headers['X-Request-ID']).toEqual(expect.any(String))
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
      null,
      { withCredentials: true }
    )
    expect(getAccessToken()).toBe('fresh-access')
    expect(getRefreshToken()).toBe('')
  })

  it('shares one refresh request between simultaneous unauthorized requests', async () => {
    saveSession({ access: 'expired-access', refresh: 'refresh-value' })
    let releaseRefresh
    const refreshResponse = new Promise((resolve) => {
      releaseRefresh = resolve
    })
    const refreshPost = jest.spyOn(axios, 'post').mockReturnValue(refreshResponse)
    const adapter = jest.fn(async (config) => {
      if (!config._retry) {
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
        data: { code: 200, data: { ok: true }, message: 'success' }
      }
    })
    const client = createHttpClient({ adapter })
    const requests = [client.get('/api/one/'), client.get('/api/two/')]

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(refreshPost).toHaveBeenCalledTimes(1)

    releaseRefresh({
      data: {
        code: 200,
        message: 'success',
        data: { access: 'fresh-access', refresh: 'fresh-refresh' }
      }
    })

    await expect(Promise.all(requests)).resolves.toEqual([
      { code: 200, data: { ok: true }, message: 'success' },
      { code: 200, data: { ok: true }, message: 'success' }
    ])
  })
})
