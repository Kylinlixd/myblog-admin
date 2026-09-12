import fs from 'node:fs'
import path from 'node:path'

describe('blog dynamic list comments', () => {
  it('keeps the comment toggle and read-only comment list without an editor', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/views/blog/BlogDynamic.vue'), 'utf8')

    expect(source).not.toContain('CommentComposer')
    expect(source).toContain('@click="handleComment(item)"')
    expect(source).toContain('getDynamicComments')
    expect(source).toContain('item.commentList')
    expect(source).toContain('class="comment-section cinematic-card"')
    expect(source).not.toContain('commentDynamic')
  })
})
