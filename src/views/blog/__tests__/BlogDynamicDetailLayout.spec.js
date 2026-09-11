import fs from 'node:fs'
import path from 'node:path'

const source = fs.readFileSync(
  path.join(process.cwd(), 'src/views/blog/BlogDynamicDetail.vue'),
  'utf8'
)
const listSource = fs.readFileSync(
  path.join(process.cwd(), 'src/views/blog/BlogDynamic.vue'),
  'utf8'
)
const previewSource = fs.readFileSync(
  path.join(process.cwd(), 'src/views/dynamics/DynamicPreview.vue'),
  'utf8'
)
const codeWindowStyles = fs.readFileSync(
  path.join(process.cwd(), 'src/styles/blog-code-window.scss'),
  'utf8'
)

test('文章详情包含编辑型头部元信息与阅读结构', () => {
  expect(source).toContain('article-reading-shell')
  expect(source).toContain('reading-progress')
  expect(source).toContain('阅读时长')
})

test('文章详情不展示文章类型字段', () => {
  expect(source).not.toContain('{{ dynamic.type ||')
  expect(source).not.toContain('class="article-kicker"')
  expect(listSource).not.toContain('class="dynamic-type"')
})

test('文章详情包含目录与移动端折叠入口', () => {
  expect(source).toContain('article-toc')
  expect(source).toContain('article-toc__cursor')
  expect(source).toContain('目录')
  expect(source).toContain('tocOpen')
  expect(source).toContain("v-if=\"tocItems.length\"")
  expect(source).toContain('article-layout--without-toc')
})

test('文章详情代码块与 Mac 窗口增强器保持一致', () => {
  expect(codeWindowStyles).toContain('.blog-code-window')
  expect(source).toContain('createMarkdownRenderer')
  expect(source).toContain('bindCodeBlockInteractions')
  expect(source).toContain('onUpdated')
  expect(source).not.toContain('enhanceCodeBlocks(articleBodyRef.value)')
  expect(source).toContain(':deep(.markdown-body pre:not(.blog-code-window))')
  expect(source).toContain(':deep(.markdown-body pre:not(.blog-code-window) code)')
  expect(source).toContain(':deep(.markdown-body .blog-code-window .blog-code-content code)')
  expect(source).toContain('padding: 28px 24px;')
  expect(source).toContain(':deep(.markdown-body .blog-code-window .blog-code-lines)')
  expect(source).toContain('font: 15.3px/1.75 ui-monospace, SFMono-Regular, Menlo, monospace;')
  expect(listSource).toContain('createMarkdownRenderer')
  expect(listSource).toContain('bindCodeBlockInteractions')
  expect(previewSource).toContain('createMarkdownRenderer')
  expect(previewSource).toContain('bindCodeBlockInteractions')
  expect(previewSource).toContain(':deep(.blog-code-window .blog-code-content code)')
  expect(previewSource).toContain('padding: 28px 24px;')
  expect(previewSource).toContain(':deep(.blog-code-window .blog-code-lines)')
  expect(previewSource).toContain('font: 15.3px/1.75 ui-monospace, SFMono-Regular, Menlo, monospace;')
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

test('文章详情提供上一篇与下一篇导航', () => {
  expect(source).toContain('getAdjacentDynamics')
  expect(source).toContain('class="article-adjacent"')
  expect(source).toContain('上一篇')
  expect(source).toContain('下一篇')
})

test('正文已嵌入的封面图片不会在附件区重复展示', () => {
  expect(source).toContain('visibleDynamicMediaItems')
  expect(source).toContain('contentContainsMedia')
})

test('压缩包等文件附件放在正文后的下载区', () => {
  expect(source).toContain('class="dynamic-attachments"')
  expect(source).toContain('attachmentItems')
  expect(source).toContain('formatFileSize')
  expect(source).not.toContain('v-else class="dynamic-media__file"')
})
