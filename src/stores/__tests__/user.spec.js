import { createPinia, setActivePinia } from 'pinia'

import { useUserStore } from '../user'

describe('user store session', () => {
  beforeEach(() => {
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
})
