import { computed, reactive, ref } from 'vue'

import zh from './locales/zh.js'

export const LOCALES = [
  { code: 'zh', label: '简体中文', htmlLang: 'zh-CN' },
  { code: 'en', label: 'English', htmlLang: 'en' },
  { code: 'ja', label: '日本語', htmlLang: 'ja' },
  { code: 'ko', label: '한국어', htmlLang: 'ko' },
  { code: 'es', label: 'Español', htmlLang: 'es' },
  { code: 'fr', label: 'Français', htmlLang: 'fr' },
]

/**
 * 加载策略（性能核心）：
 * - zh 为默认语言，静态 import 内联进首屏 chunk，t() 同步可用、零等待零闪烁；
 * - 其余语言各自打成独立 JSON chunk，首次使用时按需加载（~15KB 同源请求，
 *   一次性开销），加载结果缓存于响应式 dicts + Promise 表，会话内绝不二次请求；
 * - 文件名带 hash，配合服务端 immutable 缓存头，跨会话也走浏览器缓存。
 * 新增语言 = 放一个 locales/<code>.json + 在 LOADERS 里加一行 + 跑 `npm run check:i18n`。
 */
const LOADERS = {
  en: () => import('./locales/en.json'),
  ja: () => import('./locales/ja.json'),
  ko: () => import('./locales/ko.json'),
  es: () => import('./locales/es.json'),
  fr: () => import('./locales/fr.json'),
}

const DEFAULT_LOCALE = 'zh'
const AVAILABLE = new Set(LOCALES.map((item) => item.code))
const HTML_LANG = Object.fromEntries(LOCALES.map((item) => [item.code, item.htmlLang]))
const STORAGE_KEY = 'blog-locale'

/** @typedef {keyof typeof zh} MessageKey */

// 响应式字典表：t() 读取时按 key 收集依赖，语言包异步落地（dicts[code] 赋值）
// 会自动触发所有依赖它的渲染更新——调用方无感知，t() 全程保持同步签名。
const dicts = reactive({ zh })

// 模块加载期只认显式保存的选择：浏览器自动检测由 applyInitialLocale 在挂载前执行，
// 保证「默认 zh」语义对模块级调用方（单测等）稳定。
function initialLocale() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && AVAILABLE.has(saved)) return saved
  } catch (error) {
    /* 隐私模式下读不到 localStorage，落回默认中文 */
  }
  return DEFAULT_LOCALE
}

const locale = ref(initialLocale())

function applyDocumentLang(code) {
  if (typeof document !== 'undefined') document.documentElement.lang = HTML_LANG[code] || 'zh-CN'
}

applyDocumentLang(locale.value)

export const currentLocale = computed(() => locale.value)

/* ----------------------------- 语言包加载 ----------------------------- */

const loadingPromises = new Map()

/**
 * 确保某语言包已就绪。幂等：并发/重复调用共享同一个 Promise；
 * 失败时清掉缓存条目以便重试。zh 直接同步返回。
 * @param {string} code
 * @returns {Promise<Record<string, string> | null>}
 */
export function ensureLocaleLoaded(code) {
  if (dicts[code]) return Promise.resolve(dicts[code])
  const loader = LOADERS[code]
  if (!loader) return Promise.resolve(null)
  if (!loadingPromises.has(code)) {
    loadingPromises.set(
      code,
      loader()
        .then((module) => {
          dicts[code] = module.default
          return dicts[code]
        })
        .catch((error) => {
          loadingPromises.delete(code)
          console.error(`[i18n] 语言包 ${code} 加载失败`, error)
          throw error
        })
    )
  }
  return loadingPromises.get(code)
}

/** 意图预取：语言菜单 hover 时调用，点击切换时语言包通常已就绪（失败静默）。 */
export function prefetchLocale(code) {
  if (!LOADERS[code] || dicts[code]) return
  void ensureLocaleLoaded(code).catch(() => {})
}

/**
 * 应用启动引导：确定初始语言（显式保存 > 浏览器语言 > 默认 zh）并确保
 * 其语言包在挂载前就绪——英文访客首帧即英文，不会先看到中文再闪变。
 * 浏览器检测结果不写入 localStorage：显式选择才粘滞，未选择则每次访问按浏览器重新判断。
 */
export async function applyInitialLocale() {
  let target = null
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && AVAILABLE.has(saved)) target = saved
  } catch (error) {
    /* 读不到就不看保存值 */
  }
  if (!target) {
    try {
      const preferred = String(navigator.languages?.[0] || navigator.language || '')
      const base = preferred.split('-')[0].toLowerCase()
      if (AVAILABLE.has(base)) target = base
    } catch (error) {
      /* 无 navigator（非浏览器环境）就保持默认 */
    }
  }
  if (target && target !== locale.value) {
    locale.value = target
    applyDocumentLang(target)
  }
  // 无论是默认 zh（no-op）还是检测/保存出的其他语言，都保证字典就绪后再挂载
  await ensureLocaleLoaded(locale.value).catch(() => {})
}

/**
 * 切换语言：同步生效（ref + html lang），语言包后台加载；
 * 显式选择写入 localStorage 粘滞。签名与旧版一致，调用点零改动。
 */
export function setLocale(code) {
  if (!AVAILABLE.has(code)) return
  locale.value = code
  try {
    localStorage.setItem(STORAGE_KEY, code)
  } catch (error) {
    /* 写不进就只在本页生效 */
  }
  applyDocumentLang(code)
  if (LOADERS[code]) void ensureLocaleLoaded(code)
}

/* ------------------------------- 消息层 ------------------------------- */

const PLURAL_RULES_CACHE = new Map()
const PLURAL_FALLBACK = 'other'

function pluralCategory(code, count) {
  let rules = PLURAL_RULES_CACHE.get(code)
  if (!rules) {
    try {
      rules = new Intl.PluralRules(code)
    } catch (error) {
      return PLURAL_FALLBACK
    }
    PLURAL_RULES_CACHE.set(code, rules)
  }
  return rules.select(Number(count))
}

function resolve(dict, code, key, params) {
  const exact = dict[key]
  if (exact != null) return exact
  // 复数分支：基础 key 缺失且携带数值 n 时，按 ICU 复数类别查 key_one/key_other 变体
  const count = params?.n
  if (count != null && count !== '') {
    const suffix = pluralCategory(code, count)
    return dict[`${key}_${suffix}`] ?? dict[`${key}_${PLURAL_FALLBACK}`] ?? null
  }
  return null
}

/**
 * 翻译：先查当前语言（含复数变体），缺失回退默认语言，最终回退 key 本身。
 * 加载中的语言会临时显示中文回退，语言包落地后由响应式字典驱动自动刷新。
 * @param {MessageKey} key
 * @param {{ [name: string]: string | number }} [params]
 * @returns {string}
 */
export function t(key, params) {
  const code = locale.value
  const dict = dicts[code] || zh
  let text = resolve(dict, code, key, params)
  if (text == null && code !== DEFAULT_LOCALE) text = resolve(zh, DEFAULT_LOCALE, key, params)
  if (text == null) return key
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replaceAll(`{${name}}`, String(value))
    }
  }
  return text
}

/* ----------------------------- 格式化层 ----------------------------- */
/* 统一走浏览器内置 ICU：格式随 currentLocale 派生，杜绝手写格式的语言硬编码。 */

export function formatDate(value, options) {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  try {
    return new Intl.DateTimeFormat(currentLocale.value, options || { dateStyle: 'medium' }).format(date)
  } catch (error) {
    return ''
  }
}

export function formatNumber(value, options) {
  const count = Number(value)
  if (!Number.isFinite(count)) return ''
  try {
    return new Intl.NumberFormat(currentLocale.value, options).format(count)
  } catch (error) {
    return ''
  }
}
