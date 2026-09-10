import { onBeforeUnmount, onMounted, ref } from 'vue'
import { getSystemHealth } from '@/api/system'

export function useServiceHealth({ interval = 60000, timeout = 5000 } = {}) {
  const state = ref('checking')
  const checkedAt = ref(null)
  const latency = ref(null)
  const error = ref('')
  let timer = null
  let controller = null
  let inFlight = false

  const check = async () => {
    if (inFlight || document.hidden) return
    inFlight = true
    controller?.abort()
    controller = new AbortController()
    const started = performance.now()
    const timeoutId = window.setTimeout(() => controller.abort(), timeout)
    state.value = 'checking'
    try {
      const payload = await getSystemHealth({ signal: controller.signal })
      const data = payload?.data || payload
      state.value = data?.status === 'ok' ? 'ok' : 'error'
      error.value = state.value === 'ok' ? '' : '后台 API 返回异常'
      checkedAt.value = data?.checked_at || new Date().toISOString()
      latency.value = Math.round(performance.now() - started)
    } catch (reason) {
      const status = reason?.status ?? reason?.response?.status
      state.value = status === 401 ? 'expired' : status === 403 ? 'forbidden' : 'error'
      error.value = status === 401 ? '登录会话已过期' : status === 403 ? '当前账号无权检测' : '无法连接后台 API'
      checkedAt.value = new Date().toISOString()
      latency.value = null
    } finally {
      window.clearTimeout(timeoutId)
      inFlight = false
      controller = null
    }
  }

  const handleVisibility = () => { if (!document.hidden) check() }
  onMounted(() => {
    check()
    if (!(typeof process !== 'undefined' && process.env.NODE_ENV === 'test')) {
      timer = window.setInterval(check, interval)
    }
    document.addEventListener('visibilitychange', handleVisibility)
  })
  onBeforeUnmount(() => {
    window.clearInterval(timer)
    document.removeEventListener('visibilitychange', handleVisibility)
    controller?.abort()
  })
  return { state, checkedAt, latency, error, check }
}
