import { computed, getCurrentInstance, onBeforeUnmount, onMounted, ref } from 'vue'
import { defineStore } from 'pinia'
import request from '@/services/http/client'

export const useCommentNotificationsStore = defineStore('commentNotifications', () => {
  const unreadCount = ref(null)
  const loading = ref(false)
  const error = ref('')
  let timer = null
  let requestVersion = 0

  const hasUnread = computed(() => Number(unreadCount.value) > 0)

  async function refresh() {
    const version = ++requestVersion
    loading.value = true
    try {
      const response = await request.get('/api/comments/unread-summary/')
      if (version !== requestVersion) return
      unreadCount.value = Number(response?.data?.unread_count) || 0
      error.value = ''
    } catch (reason) {
      if (version === requestVersion) error.value = reason?.message || '未读评论加载失败'
    } finally {
      if (version === requestVersion) loading.value = false
    }
  }

  async function markRead(ids) {
    if (!ids?.length) return
    const version = ++requestVersion
    const response = await request.post('/api/comments/mark-read/', { ids })
    if (version !== requestVersion) return
    unreadCount.value = Number(response?.data?.unread_count) || 0
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

  return { unreadCount, loading, error, hasUnread, refresh, markRead, startPolling, stopPolling }
})
