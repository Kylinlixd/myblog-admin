const getLanguage = (pre, code) => {
  const language = pre.dataset.language || [...(code?.classList || [])]
    .find((name) => name.startsWith('language-'))
    ?.slice('language-'.length)
  return language || 'text'
}

const setCopyState = (button, text) => {
  const feedback = button.parentElement?.querySelector('.blog-code-copy-feedback')
  const copied = text === '已复制'
  button.classList.toggle('is-copied', copied)
  button.setAttribute('aria-label', text)
  button.setAttribute('title', text)
  if (feedback) {
    feedback.textContent = text
    feedback.classList.toggle('is-visible', copied)
  }
  if (copied) {
    window.setTimeout(() => {
      feedback?.classList.remove('is-visible')
      button.classList.remove('is-copied')
      const defaultLabel = button.dataset.copyLabel || '复制代码'
      button.setAttribute('aria-label', defaultLabel)
      button.setAttribute('title', defaultLabel)
    }, 1400)
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
    if (copyButton && !copyButton.dataset.copyLabel) {
      copyButton.dataset.copyLabel = copyButton.getAttribute('aria-label') || '复制代码'
    }

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
  copyButton.innerHTML = '<svg class="blog-code-copy-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="8" y="8" width="11" height="11" rx="2"></rect><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"></path></svg>'

  const copyFeedback = document.createElement('span')
  copyFeedback.className = 'blog-code-copy-feedback'
  copyFeedback.setAttribute('role', 'status')
  copyFeedback.setAttribute('aria-live', 'polite')
  copyFeedback.textContent = '已复制'

  actions.append(collapseButton, copyButton, copyFeedback)
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
