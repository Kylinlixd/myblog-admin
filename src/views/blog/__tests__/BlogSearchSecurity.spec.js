import fs from 'node:fs'
import path from 'node:path'

describe('blog search result security', () => {
  it('escapes result text before injecting keyword highlights', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'src/views/blog/BlogSearch.vue'),
      'utf8'
    )

    expect(source).toContain("const escaped = value.replace(/[&<>\"']/g")
    expect(source).toContain('const escapedKeyword = keyword.value.trim().replace')
  })
})
