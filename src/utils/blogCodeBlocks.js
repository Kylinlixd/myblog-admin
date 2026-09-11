/**
 * Enhance already-sanitised Markdown code blocks without re-rendering the
 * article HTML. The DOM-only enhancement keeps copy/collapse state local to
 * each code block.
 */
export function enhanceCodeBlocks(root) {
  if (!root?.querySelectorAll) return []

  return [...root.querySelectorAll('pre')].map((pre) => {
    if (pre.dataset.blogCodeEnhanced === 'true') return pre

    const code = pre.querySelector('code')
    if (!code) return pre

    pre.classList.add('blog-code-window')

    const languageClass = [...code.classList].find((name) => name.startsWith('language-'))
    const language = languageClass ? languageClass.slice('language-'.length) : 'text'
    const rawCode = code.textContent || ''
    const header = document.createElement('div')
    header.className = 'blog-code-header'

    const dots = document.createElement('span')
    dots.className = 'blog-code-dots'
    dots.setAttribute('aria-hidden', 'true')
    dots.innerHTML = '<i></i><i></i><i></i>'

    const label = document.createElement('span')
    label.className = 'blog-code-language'
    label.textContent = language

    const actions = document.createElement('span')
    actions.className = 'blog-code-actions'

    const collapseButton = document.createElement('button')
    collapseButton.type = 'button'
    collapseButton.className = 'blog-code-action blog-code-collapse'
    collapseButton.setAttribute('aria-expanded', 'true')
    collapseButton.setAttribute('aria-label', `折叠${language}代码`)
    collapseButton.textContent = '⌄'

    const copyButton = document.createElement('button')
    copyButton.type = 'button'
    copyButton.className = 'blog-code-action blog-code-copy'
    copyButton.setAttribute('aria-label', `复制${language}代码`)
    copyButton.textContent = '复制'

    collapseButton.addEventListener('click', () => {
      const collapsed = pre.classList.toggle('is-collapsed')
      collapseButton.setAttribute('aria-expanded', String(!collapsed))
      collapseButton.setAttribute('aria-label', `${collapsed ? '展开' : '折叠'}${language}代码`)
      collapseButton.textContent = collapsed ? '›' : '⌄'
    })

    copyButton.addEventListener('click', async () => {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(rawCode)
        } else {
          const textarea = document.createElement('textarea')
          textarea.value = rawCode
          textarea.setAttribute('readonly', '')
          textarea.style.position = 'fixed'
          textarea.style.opacity = '0'
          document.body.appendChild(textarea)
          textarea.select()
          document.execCommand('copy')
          textarea.remove()
        }
        copyButton.textContent = '已复制'
        window.setTimeout(() => { copyButton.textContent = '复制' }, 1400)
      } catch {
        copyButton.textContent = '复制失败'
      }
    })

    actions.append(collapseButton, copyButton)
    header.append(dots, label, actions)

    const body = document.createElement('div')
    body.className = 'blog-code-body'
    const lines = document.createElement('span')
    lines.className = 'blog-code-lines'
    lines.setAttribute('aria-hidden', 'true')
    lines.textContent = Array.from({ length: Math.max(1, rawCode.split('\n').length) }, (_, index) => index + 1).join('\n')

    const codeContent = document.createElement('div')
    codeContent.className = 'blog-code-content'
    code.parentNode.replaceChild(codeContent, code)
    codeContent.appendChild(code)
    body.append(lines, codeContent)
    pre.prepend(header)
    pre.appendChild(body)
    pre.dataset.blogCodeEnhanced = 'true'
    pre.dataset.blogCode = language
    return pre
  })
}
