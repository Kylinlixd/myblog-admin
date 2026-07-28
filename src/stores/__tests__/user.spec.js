import { createPinia, setActivePinia } from 'pinia'

import { useUserStore } from '../user'
import { getUserInfo as getUserInfoRequest, register as registerRequest } from '@/api/auth'

jest.mock('@/api/auth', () => ({
  changePassword: jest.fn(),
  getUserInfo: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  updateUserProfile: jest.fn()
}))

describe('user store session', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('initializes from the canonical access token', () => {
    localStorage.setItem('blog.accessToken', 'access-value')

    const store = useUserStore()

    expect(store.accessToken).toBe('access-value')
    expect(store.token).toBe('access-value')
    expect(store.isLoggedIn).toBe(true)
  })

  it('clears the canonical session', () => {
    localStorage.setItem('blog.accessToken', 'access-value')
    localStorage.setItem('blog.refreshToken', 'refresh-value')
    const store = useUserStore()

    store.clearUserData()

    expect(localStorage.getItem('blog.accessToken')).toBeNull()
    expect(localStorage.getItem('blog.refreshToken')).toBeNull()
  })

  it('keeps register backend errors available to the register page', async () => {
    registerRequest.mockRejectedValueOnce(new Error('邮箱已存在'))
    const store = useUserStore()

    await expect(store.register({ username: 'kylin' })).rejects.toThrow('邮箱已存在')
    expect(store.isLoggedIn).toBe(false)
  })

  it('keeps the cached session when initialization fails temporarily', async () => {
    localStorage.setItem('blog.accessToken', 'access-value')
    getUserInfoRequest.mockRejectedValueOnce({ status: 500 })
    const store = useUserStore()

    await store.initialize()

    expect(store.isLoggedIn).toBe(true)
    expect(localStorage.getItem('blog.accessToken')).toBe('access-value')
    expect(store.initialized).toBe(true)
  })

  it('clears the cached session when initialization confirms a 401', async () => {
    localStorage.setItem('blog.accessToken', 'access-value')
    localStorage.setItem('blog.refreshToken', 'refresh-value')
    getUserInfoRequest.mockRejectedValueOnce({ status: 401 })
    const store = useUserStore()

    await store.initialize()

    expect(store.isLoggedIn).toBe(false)
    expect(localStorage.getItem('blog.accessToken')).toBeNull()
  })
})
