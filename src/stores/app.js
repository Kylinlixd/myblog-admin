import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const isLoading = ref(false)
  const loadingText = ref('加载中...')
  const hasError = ref(false)
  const errorMessage = ref('')
  const errorTimeout = ref(null)
  const loadingTimeout = ref(null) // 加载超时计时器
  
  // 设置加载状态
  function setLoading(status, text = '加载中...') {
    console.log(`[AppStore] setLoading: ${status}, text: ${text}`)
    
    // 清除可能存在的超时计时器
    if (loadingTimeout.value) {
      console.log('[AppStore] 清除已有的加载超时计时器')
      clearTimeout(loadingTimeout.value)
      loadingTimeout.value = null
    }
    
    isLoading.value = status
    if (text) {
      loadingText.value = text
    }
    
    // 如果启动加载，设置超时自动关闭（15秒）
    if (status) {
      console.log('[AppStore] 设置加载超时保护（15秒）')
      loadingTimeout.value = setTimeout(() => {
        console.log('[AppStore] 加载超时，自动关闭')
        endLoading()
        setLoadingError('加载超时，请刷新页面重试')
        loadingTimeout.value = null
      }, 15000)
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
    
    // 添加调试信息 - 跟踪加载调用栈
    if (process.env.NODE_ENV === 'development') {
      console.trace('[AppStore] 加载状态开始调用栈')
    }
  }
  
  // 结束加载
  function endLoading() {
    console.log('[AppStore] endLoading')
    
    // 添加调试信息 - 跟踪结束调用栈
    if (process.env.NODE_ENV === 'development') {
      console.trace('[AppStore] 加载状态结束调用栈')
    }
    
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
  
  // 强制重置所有状态 (用于调试或紧急情况)
  function resetLoadingState() {
    console.log('[AppStore] 强制重置所有加载状态')
    
    // 清除所有计时器
    if (errorTimeout.value) {
      clearTimeout(errorTimeout.value)
      errorTimeout.value = null
    }
    
    if (loadingTimeout.value) {
      clearTimeout(loadingTimeout.value)
      loadingTimeout.value = null
    }
    
    // 重置所有状态
    isLoading.value = false
    loadingText.value = '加载中...'
    hasError.value = false
    errorMessage.value = ''
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
    retryLoading,
    resetLoadingState
  }
})