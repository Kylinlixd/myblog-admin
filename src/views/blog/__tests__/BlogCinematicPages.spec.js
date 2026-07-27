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

  it('does not expose development fixtures on the public dynamic stream', () => {
    const dynamic = readPage('BlogDynamic.vue')

    expect(dynamic).not.toContain('使用测试数据')
    expect(dynamic).not.toContain('@click="useMockData"')
    expect(dynamic).not.toContain('function useMockData')
    expect(dynamic).not.toContain('getMockDynamics')
  })
})
