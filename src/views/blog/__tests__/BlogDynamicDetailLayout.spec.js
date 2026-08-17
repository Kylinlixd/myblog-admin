import fs from 'node:fs'
import path from 'node:path'

const source = fs.readFileSync(
  path.join(process.cwd(), 'src/views/blog/BlogDynamicDetail.vue'),
  'utf8'
)

test('文章详情包含编辑型头部元信息与阅读结构', () => {
  expect(source).toContain('article-reading-shell')
  expect(source).toContain('reading-progress')
  expect(source).toContain('阅读时长')
})

test('文章详情包含目录与移动端折叠入口', () => {
  expect(source).toContain('article-toc')
  expect(source).toContain('目录')
  expect(source).toContain('tocOpen')
  expect(source).toContain("v-if=\"tocItems.length\"")
  expect(source).toContain('article-layout--without-toc')
})

test('文章详情包含移动端和 reduced motion 规则', () => {
  expect(source).toContain('@media (max-width: 768px)')
  expect(source).toContain('prefers-reduced-motion: reduce')
})

test('文章详情按媒体项渲染可播放媒体源', () => {
  expect(source).toContain("import { buildApiUrl } from '@/utils/apiBaseUrl'")
  expect(source).toContain("item.type === 'video'")
  expect(source).toContain('<video')
  expect(source).toContain('controls')
  expect(source).toContain('dynamicMediaUrls')
  expect(source).toContain('dynamicMediaItems')
  expect(source).toContain(':poster="item.posterUrl || undefined"')
  expect(source).toContain('playsinline')
})

test('动态详情按媒体项类型渲染并隔离加载失败', () => {
  expect(source).toContain("item.type === 'image'")
  expect(source).toContain("item.type === 'audio'")
  expect(source).toContain("item.type === 'video'")
  expect(source).toContain('markMediaUnavailable')
  expect(source).toContain('该媒体已不可用')
})

test('动态详情区分失效文章与可重试的加载失败', () => {
  expect(source).toContain('detailErrorKind')
  expect(source).toContain("文章加载失败，请稍后重试")
  expect(source).toContain('重试')
  expect(source).toContain('Number(status) === 404')
})

test('动态详情在路由 ID 变化时重新加载，并隔离附加请求', () => {
  expect(source).toContain("watch(() => route.params.id")
  expect(source).toContain('void Promise.allSettled')
  expect(source).toContain('dynamic.value = response.data')
})
