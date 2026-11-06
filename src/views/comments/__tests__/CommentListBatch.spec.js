import fs from 'node:fs'
import path from 'node:path'

describe('CommentList batch management', () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), 'src/views/comments/CommentList.vue'),
    'utf8'
  )

  it('loads every status by default and after reset', () => {
    expect(source).toContain("status: ''")
    expect(source).toContain(':default-values="{ status: \'\' }"')
    expect(source).not.toContain("status: 'approved'")
  })

  it('offers guarded batch deletion and retains failed selections', () => {
    expect(source).toContain("t('adminShared.batchDelete')")
    expect(source).toContain('selectedCommentIds')
    expect(source).toContain('Promise.allSettled')
    expect(source).toContain('failedIds')
  })

  it('offers guarded batch approval for pending comments', () => {
    expect(source).toContain("t('adminShared.batchApprove')")
    expect(source).toContain('batchApproving')
    expect(source).toContain('approveComment')
  })
})
