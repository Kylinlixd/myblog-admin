import { h } from 'vue'
import { notification, Button } from 'ant-design-vue'
import { t } from '@/i18n'

// 构建版本由 vite define 注入；缺省（本地脚本环境等）时跳过检测
const APP_BUILD_ID = typeof __APP_BUILD_ID__ !== 'undefined' ? __APP_BUILD_ID__ : null

const CHECK_INTERVAL_MS = 5 * 60 * 1000
// 同一次过期只提示一次：刷新后新应用的 buildId 与服务器一致，不会再弹
const NOTIFICATION_KEY = 'app-version-update'
// 旧页面引用的 chunk 被新部署删除后，动态 import 会失败；自动刷新一次自救
const PRELOAD_RELOAD_FLAG = 'app-version:preload-reloaded'

let timer = null

async function fetchServerBuildId() {
  try {
    // t= 时间戳 + no-store 双保险：即便中间层缓存了 version.json 也能拿最新
    const response = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })
    if (!response.ok) return null
    const data = await response.json()
    return typeof data?.buildId === 'string' ? data.buildId : null
  } catch (error) {
    // 离线/网络失败时静默跳过，不打扰用户
    return null
  }
}

function promptRefresh() {
  notification.info({
    key: NOTIFICATION_KEY,
    message: t('update.title'),
    description: t('update.desc'),
    btn: () => h(Button, {
      type: 'primary',
      size: 'small',
      onClick: () => {
        notification.destroy(NOTIFICATION_KEY)
        window.location.reload()
      }
    }, () => t('update.action')),
    duration: null
  })
}

async function checkOnce() {
  if (!APP_BUILD_ID) return
  const serverBuildId = await fetchServerBuildId()
  // 服务器版本更新 → 当前页面是旧构建，提示刷新
  if (serverBuildId && serverBuildId !== APP_BUILD_ID) promptRefresh()
}

function handlePreloadError() {
  // 部署删除了旧 hash chunk，旧页面动态 import 必然失败；
  // 自动刷新一次（sessionStorage 防循环：刷新后仍失败则不再自动刷新）
  if (sessionStorage.getItem(PRELOAD_RELOAD_FLAG)) return
  sessionStorage.setItem(PRELOAD_RELOAD_FLAG, '1')
  window.location.reload()
}

export function startAppVersionCheck() {
  if (!APP_BUILD_ID) return
  // 页面重新可见时立即核对：用户隔天回来是最典型的过期场景
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void checkOnce()
  })
  window.addEventListener('vite:preloadError', handlePreloadError)
  timer = window.setInterval(() => void checkOnce(), CHECK_INTERVAL_MS)
  void checkOnce()
}

export function stopAppVersionCheck() {
  if (timer) {
    window.clearInterval(timer)
    timer = null
  }
  document.removeEventListener('visibilitychange', checkOnce)
  window.removeEventListener('vite:preloadError', handlePreloadError)
}
