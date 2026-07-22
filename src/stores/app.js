import { defineStore } from 'pinia'
import { ref } from 'vue'

const LOADING_TIMEOUT = 15_000

export const useAppStore = defineStore('app', () => {
  const isLoading = ref(false)
  const loadingText = ref('加载中...')
  const hasError = ref(false)
  const errorMessage = ref('')
  const sidebarCollapsed = ref(localStorage.getItem('sidebarCollapsed') === 'true')
  const isNavigating = ref(false)
  const lastNavigationTime = ref(0)
  let loadingTimer

  function clearLoadingTimer() {
    window.clearTimeout(loadingTimer)
    loadingTimer = undefined
  }

  function setLoading(status, text = '加载中...') {
    clearLoadingTimer()
    isLoading.value = status
    loadingText.value = text

    if (status) {
      hasError.value = false
      errorMessage.value = ''
      loadingTimer = window.setTimeout(() => {
        setLoadingError('加载超时，请刷新页面重试')
        isLoading.value = false
      }, LOADING_TIMEOUT)
    }
  }

  const startLoading = (text = '加载中...') => setLoading(true, text)
  const endLoading = () => setLoading(false)

  function setLoadingError(message) {
    hasError.value = true
    errorMessage.value = message
  }

  function retryLoading(text = '正在重试...') {
    setLoading(true, text)
  }

  function resetLoadingState() {
    clearLoadingTimer()
    isLoading.value = false
    loadingText.value = '加载中...'
    hasError.value = false
    errorMessage.value = ''
  }

  function setSidebarCollapsed(status) {
    sidebarCollapsed.value = status
    localStorage.setItem('sidebarCollapsed', String(status))
  }

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed.value)

  function startNavigation() {
    isNavigating.value = true
    lastNavigationTime.value = Date.now()
  }

  function endNavigation() {
    isNavigating.value = false
  }

  function canNavigate() {
    return !isNavigating.value || Date.now() - lastNavigationTime.value >= 300
  }

  return {
    isLoading,
    loadingText,
    hasError,
    errorMessage,
    sidebarCollapsed,
    isNavigating,
    lastNavigationTime,
    setLoading,
    startLoading,
    endLoading,
    setLoadingError,
    retryLoading,
    resetLoadingState,
    toggleSidebar,
    setSidebarCollapsed,
    startNavigation,
    endNavigation,
    canNavigate
  }
})
