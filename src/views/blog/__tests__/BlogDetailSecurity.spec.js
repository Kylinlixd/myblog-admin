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
    expect(source).toMatch(/:deep\(\.markdown-body\)\s*\{[\s\S]*?width: min\(100%, var\(--reading-width\)\)/)
    expect(source.match(/if \(!content\) return ''/g)).toHaveLength(1)
  })

  it('shows the fetched comment total instead of a stale article counter', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/views/blog/BlogDynamicDetail.vue'), 'utf8')

    expect(source).toContain('评论 ({{ commentTotal }})')
    expect(source).not.toContain('评论 ({{ dynamic.comments || 0 }})')
  })
})
