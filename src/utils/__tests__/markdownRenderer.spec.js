import { createMarkdownRenderer } from '../markdownRenderer'

describe('createMarkdownRenderer', () => {
  it('renders fenced code as a Mac window with language, line numbers and controls', () => {
    const md = createMarkdownRenderer({ highlight: (code) => `<span>${code}</span>` })
    const html = md.render('```json\n{"ok": true}\n```')

    expect(html).toContain('class="blog-code-window"')
    expect(html).toContain('data-blog-code-window="true"')
    expect(html).toContain('class="blog-code-language">json</span>')
    expect(html).toContain('class="blog-code-lines"')
    expect(html).toContain('1\n2')
    expect(html).toContain('data-blog-code-action="collapse"')
    expect(html).toContain('data-blog-code-action="copy"')
    expect(html).toContain('title="折叠json代码"')
    expect(html).toContain('title="复制json代码"')
    expect(html).toContain('class="blog-code-copy-icon"')
    expect(html).not.toContain('>复制</button>')
    expect(html).toContain('<pre class="blog-code-window"')
    expect(html).toContain('<div class="blog-code-header">')
    expect(html).not.toContain('<pre class="blog-code-window" data-blog-code-window="true" data-language="json">\n')
  })

  it('escapes unknown-language code and attributes without executing markup', () => {
    const md = createMarkdownRenderer()
    const html = md.render('```unknown\n<script>alert(1)</script>\n```')

    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('data-language="unknown"')
  })

  it('renders empty fences and language aliases without throwing', () => {
    const md = createMarkdownRenderer()
    expect(() => md.render('```\n```')).not.toThrow()
    expect(md.render('```js\nconst answer = 42\n```')).toContain('data-language="js"')
  })
})
