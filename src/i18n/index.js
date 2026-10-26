import { computed, ref } from 'vue'

import zh from './locales/zh'
import en from './locales/en'
import ja from './locales/ja'
import ko from './locales/ko'
import es from './locales/es'
import fr from './locales/fr'

export const LOCALES = [
  { code: 'zh', label: '简体中文', htmlLang: 'zh-CN' },
  { code: 'en', label: 'English', htmlLang: 'en' },
  { code: 'ja', label: '日本語', htmlLang: 'ja' },
  { code: 'ko', label: '한국어', htmlLang: 'ko' },
  { code: 'es', label: 'Español', htmlLang: 'es' },
  { code: 'fr', label: 'Français', htmlLang: 'fr' },
]

const DICTIONARIES = { zh, en, ja, ko, es, fr }
const HTML_LANG = Object.fromEntries(LOCALES.map((item) => [item.code, item.htmlLang]))
const STORAGE_KEY = 'blog-locale'

function initialLocale() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && DICTIONARIES[saved]) return saved
  } catch (error) {
    /* 隐私模式下读不到 localStorage，落回默认中文 */
  }
  return 'zh'
}

const locale = ref(initialLocale())

function applyDocumentLang(code) {
  if (typeof document !== 'undefined') document.documentElement.lang = HTML_LANG[code] || 'zh-CN'
}

applyDocumentLang(locale.value)

export const currentLocale = computed(() => locale.value)

export function t(key, params) {
  const dict = DICTIONARIES[locale.value] || zh
  let text = dict[key] ?? zh[key] ?? key
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replaceAll(`{${name}}`, String(value))
    }
  }
  return text
}

export function setLocale(code) {
  if (!DICTIONARIES[code]) return
  locale.value = code
  try {
    localStorage.setItem(STORAGE_KEY, code)
  } catch (error) {
    /* 写不进就只在本页生效 */
  }
  applyDocumentLang(code)
}
