import fs from 'node:fs'
import path from 'node:path'

const source = fs.readFileSync(
  path.join(process.cwd(), 'src/views/blog/BlogTagDetail.vue'),
  'utf8'
)

test('标签页仅使用图片附件作为封面，并为失效资源显示占位', () => {
  expect(source).toContain('mediaItems.find')
  expect(source).toContain("return type === 'image'")
  expect(source).toContain('buildApiUrl')
  expect(source).toContain('markMediaUnavailable')
  expect(source).toContain('dynamic-image-placeholder')
})
