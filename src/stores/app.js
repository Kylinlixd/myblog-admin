import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const isLoading = ref(false)
  const loadingText = ref('加载中...')
  const hasError = ref(false)
  const errorMessage = ref('')
  const errorTimeout = ref(null)
  
  // 设置加载状态
  function setLoading(status, text = '加载中...') {
    console.log(`[AppStore] setLoading: ${status}, text: ${text}`)
    isLoading.value = status
    if (text) {
      loadingText.value = text
    }
    
    // 重置错误状态
    if (status) {
      hasError.value = false
      errorMessage.value = ''
    }
  }
  
  // 开始加载
  function startLoading(text) {
    console.log(`[AppStore] startLoading: ${text}`)
    setLoading(true, text)
  }
  
  // 结束加载
  function endLoading() {
    console.log('[AppStore] endLoading')
    setLoading(false)
  }
  
  // 设置加载错误
  function setLoadingError(message) {
    console.log(`[AppStore] setLoadingError: ${message}`)
    hasError.value = true
    errorMessage.value = message
    
    // 如果正在加载，则显示错误状态
    if (isLoading.value) {
      loadingText.value = `错误: ${message}`
      
      // 3秒后自动关闭加载状态
      if (errorTimeout.value) {
        clearTimeout(errorTimeout.value)
      }
      
      errorTimeout.value = setTimeout(() => {
        endLoading()
        errorTimeout.value = null
      }, 3000)
    }
  }
  
  // 重试加载
  function retryLoading(text = '正在重试...') {
    console.log(`[AppStore] retryLoading: ${text}`)
    hasError.value = false
    errorMessage.value = ''
    startLoading(text)
  }
  
  return {
    isLoading,
    loadingText,
    hasError,
    errorMessage,
    setLoading,
    startLoading,
    endLoading,
    setLoadingError,
    retryLoading
  }
}) 