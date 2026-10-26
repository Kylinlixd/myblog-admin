import { t, setLocale, currentLocale, LOCALES } from '../index'

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

  it('switches locale, persists choice and updates <html lang>', () => {
    setLocale('en')
    expect(currentLocale.value).toBe('en')
    expect(t('nav.light')).toBe('Archive')
    expect(t('search.total', { n: 3 })).toBe('3 results')
    expect(window.localStorage.getItem('blog-locale')).toBe('en')
    expect(document.documentElement.lang).toBe('en')
  })

  it('ignores unknown locale codes', () => {
    setLocale('xx')
    expect(currentLocale.value).toBe('zh')
  })

  it('exposes six locales with unique htmlLang values', () => {
    expect(LOCALES).toHaveLength(6)
    expect(new Set(LOCALES.map((item) => item.htmlLang)).size).toBe(6)
  })
})
