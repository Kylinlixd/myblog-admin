import { message } from 'ant-design-vue'

// 防抖函数
export function debounce(fn, delay = 300) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

// 统一错误提示
export function showError(error, defaultMsg = '操作失败，请稍后重试') {
  let msg = defaultMsg
  if (typeof error === 'string') {
    msg = error
  } else if (error?.response?.data?.message) {
    msg = error.response.data.message
  } else if (error?.message) {
    msg = error.message
  }
  message.error(msg)
} 