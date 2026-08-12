import fs from 'node:fs'
import path from 'node:path'

describe('dynamic preview content security', () => {
  it('sanitizes rendered markdown before using v-html', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'src/views/dynamics/DynamicPreview.vue'),
      'utf8'
    )

    expect(source).toContain("import DOMPurify from 'dompurify'")
    expect(source).toContain('DOMPurify.sanitize(md.render(content || \'\'))')
  })
})
