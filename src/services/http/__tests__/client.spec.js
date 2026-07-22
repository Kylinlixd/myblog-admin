import { createHttpClient } from '../client'
import { saveSession } from '../tokenStorage'

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
})
