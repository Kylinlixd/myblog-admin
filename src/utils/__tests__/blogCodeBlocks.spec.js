import { createMarkdownRenderer } from '../markdownRenderer'
import { bindCodeBlockInteractions, enhanceCodeBlocks } from '../blogCodeBlocks'

describe('enhanceCodeBlocks', () => {
  it('adds an independent macOS-style header, line numbers and collapse control', () => {
    document.body.innerHTML = '<div id="root"><pre><code class="language-json">{"ok": true}\n</code></pre><pre><code class="language-css">body { color: red; }</code></pre></div>'
    const blocks = enhanceCodeBlocks(document.querySelector('#root'))

    expect(blocks).toHaveLength(2)
    expect(document.querySelectorAll('.blog-code-header')).toHaveLength(2)
    expect(document.querySelector('.blog-code-language').textContent).toBe('json')
    expect(document.querySelector('.blog-code-lines').textContent).toBe('1')
    expect(document.querySelector('.blog-code-collapse-icon')).toBeTruthy()

    const first = document.querySelector('pre')
    expect(first).toHaveClass('blog-code-window')
    document.querySelector('.blog-code-collapse').click()
    expect(first).toHaveClass('is-collapsed')
    expect(document.querySelector('.blog-code-collapse')).toHaveAttribute('aria-expanded', 'false')
    expect(document.querySelector('.blog-code-collapse-icon')).toHaveClass('is-collapsed')
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

  it('binds plugin output once and collapses only the clicked window', () => {
    const root = document.createElement('div')
    root.innerHTML = createMarkdownRenderer().render('```js\nconst answer = 42\n```\n\n```json\n{"ok":true}\n```')

    bindCodeBlockInteractions(root)
    bindCodeBlockInteractions(root)
    const windows = root.querySelectorAll('pre[data-blog-code-window="true"]')
    windows[0].querySelector('[data-blog-code-action="collapse"]').click()

    expect(windows[0]).toHaveClass('is-collapsed')
    expect(windows[1]).not.toHaveClass('is-collapsed')
    expect(windows[0].querySelector('[data-blog-code-action="collapse"]')).toHaveAttribute('aria-expanded', 'false')
    expect(root.querySelectorAll('[data-blog-code-bound="true"]')).toHaveLength(2)
  })

  it('uses the textarea fallback when Clipboard API is unavailable', async () => {
    const root = document.createElement('div')
    root.innerHTML = createMarkdownRenderer().render('```text\ncopy me\n```')
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
    const execCommand = jest.fn(() => true)
    document.execCommand = execCommand

    bindCodeBlockInteractions(root)
    await root.querySelector('[data-blog-code-action="copy"]').click()

    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(document.body.querySelector('textarea')).toBeNull()
  })

  it('keeps the copy control icon-only and shows explicit copied feedback', async () => {
    const root = document.createElement('div')
    root.innerHTML = createMarkdownRenderer().render('```json\n{"ok":true}\n```')
    const writeText = jest.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })

    bindCodeBlockInteractions(root)
    const copyButton = root.querySelector('[data-blog-code-action="copy"]')
    expect(copyButton.textContent).toBe('')
    await copyButton.click()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(copyButton).toHaveAttribute('aria-label', '已复制')
    expect(root.querySelector('.blog-code-copy-feedback')).toHaveTextContent('已复制')
    expect(root.querySelector('.blog-code-copy-feedback')).toHaveClass('is-visible')
  })
})
