import { computed, getCurrentInstance, onBeforeUnmount, onMounted, ref } from 'vue'
import { defineStore } from 'pinia'
import request from '@/services/http/client'

export const useCommentNotificationsStore = defineStore('commentNotifications', () => {
  const unreadCount = ref(null)
  const latestCommentId = ref(0)
  const initialized = ref(false)
  const loading = ref(false)
  const error = ref('')
  let timer = null
  let requestVersion = 0

  const hasUnread = computed(() => Number(unreadCount.value) > 0)

  const readNotificationData = (response) => response?.data?.data ?? response?.data ?? response ?? {}

  const readUnreadCount = (response) => Number(
    response?.data?.unread_count
      ?? response?.data?.data?.unread_count
      ?? response?.unread_count
      ?? 0
  ) || 0

  async function refresh() {
    const version = ++requestVersion
    loading.value = true
    try {
      const response = await request.get('/api/comments/unread-summary/')
      if (version !== requestVersion) return
      const data = readNotificationData(response)
      unreadCount.value = readUnreadCount(response)
      latestCommentId.value = Number(data.latest_comment_id || 0) || 0
      initialized.value = Boolean(data.initialized)
      error.value = ''
    } catch (reason) {
      if (version === requestVersion) error.value = reason?.message || '未读评论加载失败'
    } finally {
      if (version === requestVersion) loading.value = false
    }
  }

  async function markRead(input) {
    const latest = Array.isArray(input)
      ? Math.max(...input.map((id) => Number(id) || 0), 0)
      : Number(input?.latestCommentId ?? input?.latest_comment_id ?? latestCommentId.value) || 0
    if (!latest) return
    const version = ++requestVersion
    const response = await request.post('/api/comments/mark-read/', {
      latest_comment_id: latest,
      ...(Array.isArray(input) ? { ids: input } : {})
    })
    if (version !== requestVersion) return
    const data = readNotificationData(response)
    unreadCount.value = readUnreadCount(response)
    latestCommentId.value = Number(data.latest_comment_id || latest) || latest
    initialized.value = Boolean(data.initialized ?? true)
  }

  function startPolling() {
    if (timer) return
    refresh()
    timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') refresh()
    }, 60000)
  }

  function stopPolling() {
    if (timer) window.clearInterval(timer)
    timer = null
    requestVersion += 1
  }

  function handleVisibility() {
    if (document.visibilityState === 'visible') refresh()
  }

  if (getCurrentInstance()) {
    onMounted(() => {
      document.addEventListener('visibilitychange', handleVisibility)
      startPolling()
    })
    onBeforeUnmount(() => {
      document.removeEventListener('visibilitychange', handleVisibility)
      stopPolling()
    })
  }

  return { unreadCount, latestCommentId, initialized, loading, error, hasUnread, refresh, markRead, startPolling, stopPolling }
})
