import { enhanceCodeBlocks } from '../blogCodeBlocks'

describe('enhanceCodeBlocks', () => {
  it('adds an independent macOS-style header, line numbers and collapse control', () => {
    document.body.innerHTML = '<div id="root"><pre><code class="language-json">{"ok": true}\n</code></pre><pre><code class="language-css">body { color: red; }</code></pre></div>'
    const blocks = enhanceCodeBlocks(document.querySelector('#root'))

    expect(blocks).toHaveLength(2)
    expect(document.querySelectorAll('.blog-code-header')).toHaveLength(2)
    expect(document.querySelector('.blog-code-language').textContent).toBe('json')
    expect(document.querySelector('.blog-code-lines').textContent).toBe('1\n2')

    const first = document.querySelector('pre')
    expect(first).toHaveClass('blog-code-window')
    document.querySelector('.blog-code-collapse').click()
    expect(first).toHaveClass('is-collapsed')
    expect(document.querySelector('.blog-code-collapse')).toHaveAttribute('aria-expanded', 'false')
    expect(document.querySelectorAll('pre.is-collapsed')).toHaveLength(1)
  })

  it('is idempotent and copies the code text without executing markup', async () => {
    document.body.innerHTML = '<div id="root"><pre><code class="language-js">&lt;script&gt;alert(1)&lt;/script&gt;</code></pre></div>'
    const root = document.querySelector('#root')
    const writeText = jest.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })

    enhanceCodeBlocks(root)
    enhanceCodeBlocks(root)
    expect(root.querySelectorAll('[data-blog-code-enhanced="true"]')).toHaveLength(1)
    await root.querySelector('.blog-code-copy').click()
    expect(writeText).toHaveBeenCalledWith('<script>alert(1)</script>')
    expect(root.querySelector('script')).toBeNull()
  })
})
