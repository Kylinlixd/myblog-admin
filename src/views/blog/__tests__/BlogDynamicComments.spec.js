import fs from 'node:fs'
import path from 'node:path'

describe('blog dynamic list comments', () => {
  it('keeps the dynamic stream free of the article comments module', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/views/blog/BlogDynamic.vue'), 'utf8')

    expect(source).not.toContain('CommentComposer')
    expect(source).not.toContain('评论列表')
    expect(source).not.toContain('getDynamicComments')
    expect(source).not.toContain('commentDynamic')
  })
})
