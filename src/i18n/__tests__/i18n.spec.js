import { t, setLocale, currentLocale, LOCALES, ensureLocaleLoaded, applyInitialLocale } from '../index'

const STORAGE_KEY = 'blog-locale'

describe('i18n locale system', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setLocale('zh')
  })

  it('falls back to Chinese by default and to the key itself when missing', () => {
    expect(currentLocale.value).toBe('zh')
    expect(t('nav.light')).toBe('拾光')
    expect(t('no.such.key')).toBe('no.such.key')
  })

  it('interpolates named params', () => {
    expect(t('search.total', { n: 12 })).toBe('共 12 条')
  })

  it('switches locale synchronously and fills translations once the chunk lands', async () => {
    setLocale('en')
    expect(currentLocale.value).toBe('en')
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('en')
    expect(document.documentElement.lang).toBe('en')
    // 语言包按需加载：落地前回退中文，落地后切换为英文
    expect(t('nav.light')).toBe('拾光')
    await ensureLocaleLoaded('en')
    expect(t('nav.light')).toBe('Archive')
    expect(t('search.total', { n: 3 })).toBe('3 results')
  })

  it('falls back to Chinese while a locale chunk is still loading', async () => {
    setLocale('ja')
    expect(t('nav.light')).toBe('拾光')
    await ensureLocaleLoaded('ja')
    expect(t('nav.light')).toBe('アーカイブ')
  })

  it('caches the loader promise so concurrent calls share one request', async () => {
    const first = ensureLocaleLoaded('ko')
    const second = ensureLocaleLoaded('ko')
    expect(second).toBe(first)
    await first
    // 已加载后重复调用返回的是已就绪字典的普通 Promise，同样幂等
    await ensureLocaleLoaded('ko')
    setLocale('ko')
    expect(t('nav.light')).toBe('아카이브')
  })

  it('selects plural variants via Intl.PluralRules for locales that define them', async () => {
    await ensureLocaleLoaded('en')
    setLocale('en')
    expect(t('search.total', { n: 1 })).toBe('1 result')
    expect(t('search.total', { n: 3 })).toBe('3 results')
    expect(t('common.articleCount', { n: 1 })).toBe('1 article')
    expect(t('common.articleCount', { n: 5 })).toBe('5 articles')
  })

  it('keeps single-form counting for the default language', () => {
    setLocale('zh')
    expect(t('search.total', { n: 1 })).toBe('共 1 条')
    expect(t('common.articleCount', { n: 3 })).toBe('3 篇')
  })

  it('ignores unknown locale codes', () => {
    setLocale('xx')
    expect(currentLocale.value).toBe('zh')
  })

  describe('applyInitialLocale', () => {
    // jsdom 的 language / languages 是彼此独立的 own 属性：检测优先读 languages[0]，
    // 两个都要桩掉才能确定性地控制检测输入
    const stubNavigatorLanguages = (tag) => {
      Object.defineProperty(navigator, 'language', { value: tag, configurable: true })
      Object.defineProperty(navigator, 'languages', { value: [tag], configurable: true })
    }

    afterEach(() => {
      // 删除实例上的语言桩，恢复 jsdom 原型链/初始值，避免泄漏到其他用例
      delete navigator.language
      delete navigator.languages
    })

    it('prefers an explicitly saved locale over browser detection', async () => {
      window.localStorage.setItem(STORAGE_KEY, 'fr')
      await applyInitialLocale()
      expect(currentLocale.value).toBe('fr')
      expect(t('nav.light')).toBe('Archives')
    })

    it('detects the browser language on first visit without persisting it', async () => {
      // beforeEach 的 setLocale('zh') 会持久化选择，先清掉才走「无保存」的检测分支
      window.localStorage.removeItem(STORAGE_KEY)
      stubNavigatorLanguages('en-US')
      await applyInitialLocale()
      expect(currentLocale.value).toBe('en')
      expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull()
    })

    it('stays on the default language when the browser language is unsupported', async () => {
      window.localStorage.removeItem(STORAGE_KEY)
      stubNavigatorLanguages('xx-XX')
      await applyInitialLocale()
      expect(currentLocale.value).toBe('zh')
    })
  })

  it('exposes six locales with unique htmlLang values', () => {
    expect(LOCALES).toHaveLength(6)
    expect(new Set(LOCALES.map((item) => item.htmlLang)).size).toBe(6)
  })
})
