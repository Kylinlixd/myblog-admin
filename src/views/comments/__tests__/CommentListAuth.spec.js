import fs from 'node:fs'
import path from 'node:path'

describe('CommentList authentication', () => {
  it('uses the shared HTTP auth flow instead of the legacy token key', () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), 'src/views/comments/CommentList.vue'),
      'utf8'
    )

    expect(source).not.toContain("localStorage.getItem('token')")
    expect(source).not.toContain('useRouter')
    expect(source).toContain('getCommentList')
  })
})
