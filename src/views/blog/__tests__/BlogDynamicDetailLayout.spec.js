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

test('视频文章详情渲染可播放媒体源', () => {
  expect(source).toContain("import { buildApiUrl } from '@/utils/apiBaseUrl'")
  expect(source).toContain("dynamic.type === 'video'")
  expect(source).toContain('<video')
  expect(source).toContain('controls')
  expect(source).toContain('dynamicMediaUrls')
  expect(source).toContain('dynamicMediaItems')
  expect(source).toContain(':poster="item.posterUrl || undefined"')
  expect(source).toContain('playsinline')
})
