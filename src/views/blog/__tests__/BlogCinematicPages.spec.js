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
      if (name !== 'BlogAbout.vue') expect(source).toContain('cinematic-card')
    })
  })

  it('uses chapter-style headers on public collection pages', () => {
    ;['BlogDynamic.vue', 'BlogCategories.vue', 'BlogCategoryDetail.vue', 'BlogTagDetail.vue', 'BlogSearch.vue']
      .forEach((name) => expect(readPage(name)).toContain('cinematic-hero'))
  })

  it('keeps the category archive hero readable instead of one squeezed row', () => {
    const categories = readPage('BlogCategories.vue')

    // 标题独占左列、说明与徽标在右列；列宽要放得下小半句，避免碎成四行
    expect(categories).toContain('class="page-header cinematic-hero archive-hero"')
    expect(categories).toMatch(/\.page-header\.cinematic-hero\.archive-hero\s*\{[\s\S]*?grid-template-columns: minmax\(0, 1\.32fr\) minmax\(300px, \.78fr\)/)
    // 装饰线也是栅格项，必须显式占位，否则会多出一行把内容挤下去
    expect(categories).toMatch(/grid-template-areas:\s*\n\s*'rule rule'/)
    expect(categories).toMatch(/\.archive-hero::before\s*\{[\s\S]*?grid-area: rule;/)
    expect(categories).toMatch(/\.page-title\s*\{[\s\S]*?font-size: clamp\(34px, 4\.3vw, 58px\)/)
    expect(categories).toContain('line-height: 1.08')
    expect(categories).toContain('text-wrap: balance')

    // 说明与徽标是右侧一整列，整体与标题末行对齐
    expect(categories).toContain('class="archive-aside"')
    expect(categories).toMatch(/\.archive-aside\s*\{[\s\S]*?grid-area: aside;[\s\S]*?align-self: end;/)

    // 徽标不能再被挤成一字一行
    expect(categories).toMatch(/\.archive-meta span\s*\{[\s\S]*?white-space: nowrap/)

    // 窄屏落回单列，标题同步收小
    expect(categories).toMatch(/@media \(max-width: 980px\)[\s\S]*?\.archive-hero\s*\{[\s\S]*?grid-template-columns: minmax\(0, 1fr\)/)
    expect(categories).toMatch(/@media \(max-width: 620px\)[\s\S]*?font-size: clamp\(30px, 8\.6vw, 42px\)/)
  })

  it('does not expose development fixtures on the public dynamic stream', () => {
    const dynamic = readPage('BlogDynamic.vue')

    expect(dynamic).not.toContain('使用测试数据')
    expect(dynamic).not.toContain('@click="useMockData"')
    expect(dynamic).not.toContain('function useMockData')
    expect(dynamic).not.toContain('getMockDynamics')
  })

  it('keeps a time navigation rail beside the dynamic stream', () => {
    const dynamic = readPage('BlogDynamic.vue')

    expect(dynamic).toContain('class="dynamic-timeline"')
    expect(dynamic).toContain('getBlogDynamicTimeline')
    expect(dynamic).toContain('selectTimelinePeriod')
  })

  it('keeps the dynamic stream close to its compact page header', () => {
    const dynamic = readPage('BlogDynamic.vue')

    expect(dynamic).toContain('.blog-dynamic-container.cinematic-page')
    expect(dynamic).toContain('padding-block: clamp(28px, 4vw, 48px)')
    expect(dynamic).toContain('grid-template-columns: 44px minmax(0, 1fr)')
    expect(dynamic).toContain('grid-row: 1 / span 2')
    expect(dynamic).toContain('border: 1px solid rgb(200 111 55 / 38%)')
  })

  it('gives reply cancellation a quiet themed control instead of browser defaults', () => {
    const detail = readPage('BlogDynamicDetail.vue')

    expect(detail).toContain('class="reply-editor__cancel"')
    expect(detail).toContain('background: #fffaf3')
    expect(detail).toContain('border: 1px solid #e4cdb8')
    expect(detail).toContain('.reply-editor__cancel:hover')
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
