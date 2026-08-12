import {
  cachedRequest,
  clearRequestCache
} from '../publicRequestCache'

describe('public request cache', () => {
  beforeEach(() => {
    clearRequestCache()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('shares an in-flight public request', async () => {
    const loader = jest.fn().mockResolvedValue({ results: ['first'] })

    const first = cachedRequest('recent', loader)
    const second = cachedRequest('recent', loader)

    await expect(Promise.all([first, second])).resolves.toEqual([
      { results: ['first'] },
      { results: ['first'] }
    ])
    expect(loader).toHaveBeenCalledTimes(1)
  })

  it('expires cached data and retries after the ttl', async () => {
    const loader = jest
      .fn()
      .mockResolvedValueOnce({ version: 1 })
      .mockResolvedValueOnce({ version: 2 })

    await expect(cachedRequest('recent', loader, 1000)).resolves.toEqual({ version: 1 })
    jest.advanceTimersByTime(1001)
    await expect(cachedRequest('recent', loader, 1000)).resolves.toEqual({ version: 2 })
    expect(loader).toHaveBeenCalledTimes(2)
  })

  it('does not keep rejected requests in the cache', async () => {
    const loader = jest
      .fn()
      .mockRejectedValueOnce(new Error('network failure'))
      .mockResolvedValueOnce({ ok: true })

    await expect(cachedRequest('recent', loader)).rejects.toThrow('network failure')
    await expect(cachedRequest('recent', loader)).resolves.toEqual({ ok: true })
    expect(loader).toHaveBeenCalledTimes(2)
  })
})
