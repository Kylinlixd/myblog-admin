import { resolveBlogNav, NAV_FROM_LIGHT } from '../blogNav'

const route = (name, query = {}) => ({ name, query })

describe('resolveBlogNav', () => {
  it('maps every section list page to its navigation key', () => {
    expect(resolveBlogNav(route('BlogHome'))).toBe('home')
    expect(resolveBlogNav(route('BlogDynamic'))).toBe('book')
    expect(resolveBlogNav(route('BlogCategories'))).toBe('light')
    expect(resolveBlogNav(route('BlogAbout'))).toBe('about')
  })

  it('treats collection and category detail as part of 拾光', () => {
    expect(resolveBlogNav(route('BlogCollectionDetail'))).toBe('light')
    expect(resolveBlogNav(route('BlogCategoryDetail'))).toBe('light')
  })

  it('falls back to 书遇 for articles and tags without a source', () => {
    expect(resolveBlogNav(route('BlogDynamicDetail'))).toBe('book')
    expect(resolveBlogNav(route('BlogTagDetail'))).toBe('book')
  })

  it('keeps 拾光 active through articles and tags opened from it', () => {
    expect(resolveBlogNav(route('BlogDynamicDetail', { from: NAV_FROM_LIGHT }))).toBe('light')
    expect(resolveBlogNav(route('BlogTagDetail', { from: NAV_FROM_LIGHT }))).toBe('light')
  })

  it('ignores the source parameter outside article and tag pages', () => {
    expect(resolveBlogNav(route('BlogHome', { from: 'light' }))).toBe('home')
    expect(resolveBlogNav(route('BlogSearch', { from: 'light' }))).toBeNull()
  })

  it('leaves search and unknown routes without a navigation owner', () => {
    expect(resolveBlogNav(route('BlogSearch'))).toBeNull()
    expect(resolveBlogNav(route('Settings'))).toBeNull()
    expect(resolveBlogNav(undefined)).toBeNull()
  })

  it('accepts repeated query parameters and unknown sources', () => {
    expect(resolveBlogNav(route('BlogDynamicDetail', { from: ['light', 'book'] }))).toBe('light')
    expect(resolveBlogNav(route('BlogDynamicDetail', { from: 'home' }))).toBe('book')
  })
})
