import { createPinia, setActivePinia } from 'pinia'

import request from '@/services/http/client'
import { useCommentNotificationsStore } from '../commentNotifications'

jest.mock('@/services/http/client', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() }
}))

describe('comment notification store', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setActivePinia(createPinia())
  })

  it('does not let an older summary response restore a count after mark-read', async () => {
    let resolveSummary
    request.get.mockReturnValueOnce(new Promise((resolve) => { resolveSummary = resolve }))
    request.post.mockResolvedValueOnce({ data: { unread_count: 0 } })

    const store = useCommentNotificationsStore()
    const summaryPromise = store.refresh()
    await store.markRead([12])
    resolveSummary({ data: { unread_count: 3 } })
    await summaryPromise

    expect(store.unreadCount).toBe(0)
  })

  it('normalizes the summary envelope and exposes the unread state', async () => {
    request.get.mockResolvedValueOnce({ data: { unread_count: 2 } })
    const store = useCommentNotificationsStore()

    await store.refresh()

    expect(store.unreadCount).toBe(2)
    expect(store.hasUnread).toBe(true)
  })
})
