import fs from 'node:fs'
import path from 'node:path'

const source = fs.readFileSync(
  path.join(process.cwd(), 'src/views/blog/BlogDynamic.vue'),
  'utf8'
)

test('点赞失败兜底识别后端重复点赞状态并给出已点赞反馈', () => {
  expect(source).toContain('already_liked')
  expect(source).toContain('你已点赞，无需重复操作')
})
