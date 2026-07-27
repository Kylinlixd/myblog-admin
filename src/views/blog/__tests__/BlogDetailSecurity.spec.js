import fs from 'node:fs'
import path from 'node:path'

describe('blog detail sanitization', () => {
  it('sanitizes rendered markdown and comment input without the unused crypto helper bundle', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/views/blog/BlogDynamicDetail.vue'), 'utf8')

    expect(source).toContain("import DOMPurify from 'dompurify'")
    expect(source).toContain('DOMPurify.sanitize(md.render(content))')
    expect(source).not.toContain("from '@/utils/security'")
  })
})
