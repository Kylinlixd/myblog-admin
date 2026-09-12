import fs from 'node:fs'
import path from 'node:path'

describe('blog detail sanitization', () => {
  it('sanitizes rendered markdown and comment input without the unused crypto helper bundle', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/views/blog/BlogDynamicDetail.vue'), 'utf8')

    expect(source).toContain("import DOMPurify from 'dompurify'")
    expect(source).toContain('DOMPurify.sanitize(md.render(content))')
    expect(source).not.toContain("from '@/utils/security'")
  })

  it('uses a focused long-form reading frame and readable discussion colors', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/views/blog/BlogDynamicDetail.vue'), 'utf8')

    expect(source).toContain('class="dynamic-body markdown-body reading-frame"')
    expect(source).toContain('font-size: 18px')
    expect(source).toContain('line-height: 1.9')
    expect(source).toContain('color: var(--blog-reading-text)')
    expect(source).toContain('color: var(--blog-comment-text)')
    expect(source).toContain('background: var(--blog-paper)')
    expect(source).toMatch(/:deep\(\.markdown-body\)\s*\{[\s\S]*?width: min\(100%, var\(--reading-width\)\)/)
    expect(source.match(/if \(!content\) return ''/g)).toHaveLength(1)
  })

  it('shows the fetched comment total instead of a stale article counter', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/views/blog/BlogDynamicDetail.vue'), 'utf8')

    expect(source).toContain('评论 ({{ commentTotal }})')
    expect(source).not.toContain('评论 ({{ dynamic.comments || 0 }})')
  })

  it('renders dynamic dates from the immutable created_at field', () => {
    const detail = fs.readFileSync(path.join(process.cwd(), 'src/views/blog/BlogDynamicDetail.vue'), 'utf8')
    const category = fs.readFileSync(path.join(process.cwd(), 'src/views/blog/BlogCategoryDetail.vue'), 'utf8')
    const tag = fs.readFileSync(path.join(process.cwd(), 'src/views/blog/BlogTagDetail.vue'), 'utf8')

    expect(detail).toContain('formatDate(dynamic.created_at)')
    expect(category).toContain('formatDate(dynamic.created_at)')
    expect(tag).toContain('formatDate(dynamic.created_at)')
    expect(detail).not.toContain('formatDate(dynamic.createdAt)')
    expect(category).not.toContain('formatDate(dynamic.createdAt)')
  })

  it('distinguishes approved, pending-review, and rejected comment feedback', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/views/blog/BlogDynamicDetail.vue'), 'utf8')

    expect(source).toContain("result.data?.status === 'pending'")
    expect(source).toContain('需人工审核后展示')
    expect(source).toContain('error.message ||')
  })
})
