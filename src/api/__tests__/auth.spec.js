import { persistAuthResponse, refreshToken, uploadAvatar } from '../auth'
import request from '@/services/http/client'
import { getAccessToken, getRefreshToken } from '@/services/http/tokenStorage'

describe('authentication API contract', () => {
  beforeEach(() => localStorage.clear())

  it('persists only the backend access token', () => {
    persistAuthResponse({
      code: 200,
      data: { access: 'access-value', refresh: 'refresh-value' },
      message: '登录成功'
    })

    expect(getAccessToken()).toBe('access-value')
    expect(getRefreshToken()).toBe('')
  })

  it('rejects a successful response without an access token', () => {
    expect(() => persistAuthResponse({ code: 200, data: {} })).toThrow(
      '登录响应缺少 access token'
    )
  })

  it('unwraps an envelope returned by the explicit refresh API', async () => {
    jest.spyOn(request, 'post').mockResolvedValueOnce({
      code: 200,
      message: 'success',
      data: { access: 'fresh-access' }
    })

    await refreshToken()

    expect(getAccessToken()).toBe('fresh-access')
    expect(getRefreshToken()).toBe('')
  })

  it.each([
    [{ url: '/media/top-level.png', width: 100 }, '/media/top-level.png'],
    [{ data: { url: '/media/wrapped.png', width: 200 } }, '/media/wrapped.png']
  ])('normalizes avatar upload responses to a canonical URL', async (response, url) => {
    jest.spyOn(request, 'post').mockResolvedValueOnce(response)
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })

    await expect(uploadAvatar(file)).resolves.toEqual(expect.objectContaining({ url }))
    expect(request.post).toHaveBeenCalledWith('/api/upload/avatar', expect.any(FormData))
  })

  it('rejects avatar uploads without a usable URL', async () => {
    jest.spyOn(request, 'post').mockResolvedValueOnce({ data: { message: '上传失败' } })
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })

    await expect(uploadAvatar(file)).rejects.toThrow('头像上传响应缺少可用 URL')
  })
})
