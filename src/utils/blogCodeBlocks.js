const getLanguage = (pre, code) => {
  const language = pre.dataset.language || [...(code?.classList || [])]
    .find((name) => name.startsWith('language-'))
    ?.slice('language-'.length)
  return language || 'text'
}

const setCopyState = (button, text) => {
  button.textContent = text
  if (text === '已复制') {
    window.setTimeout(() => { button.textContent = '复制' }, 1400)
  }
}

const copyCode = async (rawCode) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(rawCode)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = rawCode
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  if (typeof document.execCommand === 'function') document.execCommand('copy')
  textarea.remove()
}

/**
 * Bind controls emitted by the Markdown Mac-window renderer. The data marker
 * makes the operation safe to repeat after Vue updates or keep-alive restores.
 */
export function bindCodeBlockInteractions(root) {
  if (!root?.querySelectorAll) return []

  return [...root.querySelectorAll('pre[data-blog-code-window="true"]')].map((pre) => {
    if (pre.dataset.blogCodeBound === 'true') return pre

    const code = pre.querySelector('code')
    const language = getLanguage(pre, code)
    const rawCode = code?.textContent || ''
    const collapseButton = pre.querySelector('[data-blog-code-action="collapse"]') || pre.querySelector('.blog-code-collapse')
    const copyButton = pre.querySelector('[data-blog-code-action="copy"]') || pre.querySelector('.blog-code-copy')

    collapseButton?.addEventListener('click', () => {
      const collapsed = pre.classList.toggle('is-collapsed')
      collapseButton.setAttribute('aria-expanded', String(!collapsed))
      collapseButton.setAttribute('aria-label', `${collapsed ? '展开' : '折叠'}${language}代码`)
      collapseButton.textContent = collapsed ? '›' : '⌄'
    })

    copyButton?.addEventListener('click', async () => {
      try {
        await copyCode(rawCode)
        setCopyState(copyButton, '已复制')
      } catch {
        setCopyState(copyButton, '复制失败')
      }
    })

    pre.dataset.blogCodeBound = 'true'
    return pre
  })
}

const wrapLegacyCodeBlock = (pre) => {
  const code = pre.querySelector('code')
  if (!code) return pre

  pre.classList.add('blog-code-window')
  const language = getLanguage(pre, code)
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
  collapseButton.setAttribute('data-blog-code-action', 'collapse')
  collapseButton.setAttribute('aria-expanded', 'true')
  collapseButton.setAttribute('aria-label', `折叠${language}代码`)
  collapseButton.setAttribute('title', `折叠${language}代码`)
  collapseButton.textContent = '⌄'

  const copyButton = document.createElement('button')
  copyButton.type = 'button'
  copyButton.className = 'blog-code-action blog-code-copy'
  copyButton.setAttribute('data-blog-code-action', 'copy')
  copyButton.setAttribute('aria-label', `复制${language}代码`)
  copyButton.setAttribute('title', `复制${language}代码`)
  copyButton.textContent = '复制'

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
  pre.dataset.blogCodeWindow = 'true'
  pre.dataset.blogCodeEnhanced = 'true'
  pre.dataset.language = language
  return pre
}

/**
 * Compatibility wrapper for already-rendered plain Markdown code blocks.
 * New renders should use the Markdown-it plugin and call the binder directly.
 */
export function enhanceCodeBlocks(root) {
  if (!root?.querySelectorAll) return []

  const blocks = [...root.querySelectorAll('pre')].map((pre) => {
    if (pre.dataset.blogCodeWindow !== 'true' && pre.dataset.blogCodeEnhanced !== 'true') {
      wrapLegacyCodeBlock(pre)
    }
    return pre
  })

  bindCodeBlockInteractions(root)
  return blocks
}
