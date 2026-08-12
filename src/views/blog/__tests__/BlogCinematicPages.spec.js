import fs from 'node:fs'
import path from 'node:path'

const readPage = (file) => fs.readFileSync(
  path.join(process.cwd(), 'src/views/blog', file),
  'utf8'
)

describe('cinematic public blog pages', () => {
  const pageNames = [
    'BlogDynamic.vue',
    'BlogCategories.vue',
    'BlogCategoryDetail.vue',
    'BlogTagDetail.vue',
    'BlogSearch.vue',
    'BlogAbout.vue',
    'BlogDynamicDetail.vue'
  ]

  it('uses the shared page and card language across every public route', () => {
    pageNames.forEach((name) => {
      const source = readPage(name)
      expect(source).toContain('cinematic-page')
      expect(source).toContain('cinematic-card')
    })
  })

  it('uses chapter-style headers on public collection pages', () => {
    ;['BlogDynamic.vue', 'BlogCategories.vue', 'BlogCategoryDetail.vue', 'BlogTagDetail.vue', 'BlogSearch.vue']
      .forEach((name) => expect(readPage(name)).toContain('cinematic-hero'))
  })

  it('keeps the category archive title readable instead of forming a text block', () => {
    const categories = readPage('BlogCategories.vue')

    expect(categories).toContain('max-width: 920px')
    expect(categories).toContain('font-size: clamp(40px, 5vw, 64px)')
    expect(categories).toContain('line-height: 1.08')
    expect(categories).toContain('margin: 18px 0 0')
  })

  it('does not expose development fixtures on the public dynamic stream', () => {
    const dynamic = readPage('BlogDynamic.vue')

    expect(dynamic).not.toContain('使用测试数据')
    expect(dynamic).not.toContain('@click="useMockData"')
    expect(dynamic).not.toContain('function useMockData')
    expect(dynamic).not.toContain('getMockDynamics')
  })

  it('separates readable article and comment colors from muted metadata', () => {
    const theme = fs.readFileSync(path.join(process.cwd(), 'src/styles/blog-cinematic.scss'), 'utf8')
    const globalStyles = fs.readFileSync(path.join(process.cwd(), 'src/styles/global.scss'), 'utf8')

    expect(theme).toContain('--blog-reading-text')
    expect(theme).toContain('--blog-comment-text')
    expect(theme).toContain('--blog-bg: #f4efe5')
    expect(theme).toContain('--blog-reading-text: #243041')
    expect(theme).toContain('--blog-comment-text: #2f3947')
    expect(theme).toContain('.cinematic-page .comment-content')
    expect(theme).toContain('.cinematic-page .ant-form-item-label > label')
    expect(theme).toContain('.cinematic-page .ant-input::placeholder')
    expect(theme).toContain('.cinematic-page .ant-input-textarea-show-count::after')
    expect(theme).toContain('.dynamic-detail-container .dynamic-header .dynamic-title')
    expect(theme).toContain('.cinematic-page .dynamic-title::after')
    expect(globalStyles).toContain('Geist, "Segoe UI", "PingFang SC", "Microsoft YaHei"')
  })
})
