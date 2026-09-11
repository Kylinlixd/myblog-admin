const getLanguage = (pre, code) => {
  const language = pre.dataset.language || [...(code?.classList || [])]
    .find((name) => name.startsWith('language-'))
    ?.slice('language-'.length)
  return language || 'text'
}

const collapseIconMarkup = '<svg class="blog-code-collapse-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6"></path></svg>'
const runIconMarkup = '<svg class="blog-code-run-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m8 5 11 7-11 7z"></path></svg>'

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

const createJavascriptSrcdoc = (rawCode, messageId) => {
  const source = JSON.stringify(rawCode).replace(/</g, '\\u003c')
  const id = JSON.stringify(messageId)
  return `<!doctype html><meta charset="utf-8"><script>\nconst source=${source};\nconst id=${id};\nconst send=(type,args)=>parent.postMessage({source:'blog-code-runner',id,type,args},'*');\nconst stringify=(value)=>{try{return typeof value==='string'?value:JSON.stringify(value)}catch{return String(value)}};\nconsole.log=(...args)=>send('log',args.map(stringify));\nconsole.warn=(...args)=>send('warn',args.map(stringify));\nconsole.error=(...args)=>send('error',args.map(stringify));\nwindow.onerror=(message)=>send('error',[String(message)]);\ntry{new Function(source)()}catch(error){send('error',[error?.stack||String(error)])}\n<\/script>`
}

const runJavascript = (pre, rawCode) => {
  const panel = pre.querySelector('[data-blog-code-run-output]')
  const output = panel?.querySelector('.blog-code-run-output')
  if (!panel || !output) return

  pre._blogCodeRunCleanup?.()
  panel.hidden = false
  output.textContent = ''
  const frame = document.createElement('iframe')
  const messageId = `blog-code-${Date.now()}-${Math.random().toString(36).slice(2)}`
  frame.className = 'blog-code-runner-frame'
  frame.setAttribute('sandbox', 'allow-scripts')
  frame.setAttribute('aria-hidden', 'true')
  frame.srcdoc = createJavascriptSrcdoc(rawCode, messageId)

  const onMessage = (event) => {
    // Sandboxed srcdoc documents may expose an opaque WindowProxy in some
    // browsers, so authenticate by the private message id as well as the
    // runner marker instead of relying on strict source identity.
    if (event.data?.source !== 'blog-code-runner' || event.data.id !== messageId) return
    const line = document.createElement('div')
    line.className = `blog-code-run-line is-${event.data.type || 'log'}`
    line.textContent = (event.data.args || []).join(' ')
    output.appendChild(line)
  }
  window.addEventListener('message', onMessage)
  pre._blogCodeRunCleanup = () => {
    window.removeEventListener('message', onMessage)
    frame.remove()
  }
  pre.appendChild(frame)
}

const runHtml = (pre, rawCode) => {
  const panel = pre.querySelector('[data-blog-code-run-preview]')
  const target = panel?.querySelector('.blog-code-run-preview-target')
  if (!panel || !target) return
  target.replaceChildren()
  const frame = document.createElement('iframe')
  frame.className = 'blog-code-run-preview-frame blog-code-run-preview-frame--expanded'
  frame.setAttribute('sandbox', 'allow-scripts')
  frame.setAttribute('title', 'HTML 试运行预览')
  frame.srcdoc = rawCode
  target.appendChild(frame)
  panel.hidden = false
}

const runCodeBlock = (pre, language, rawCode) => {
  if (language === 'js') runJavascript(pre, rawCode)
  if (language === 'html') runHtml(pre, rawCode)
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
      collapseButton.querySelector('.blog-code-collapse-icon')?.classList.toggle('is-collapsed', collapsed)
    })

    copyButton?.addEventListener('click', async () => {
      try {
        await copyCode(rawCode)
        setCopyState(copyButton, '已复制')
      } catch {
        setCopyState(copyButton, '复制失败')
      }
    })

    const runButton = pre.querySelector('[data-blog-code-action="run"]')
    runButton?.addEventListener('click', () => runCodeBlock(pre, language, rawCode))

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
  collapseButton.innerHTML = collapseIconMarkup

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
  const visibleCode = rawCode.endsWith('\n') ? rawCode.slice(0, -1) : rawCode
  lines.textContent = Array.from({ length: Math.max(1, visibleCode.split('\n').length) }, (_, index) => index + 1).join('\n')

  const codeContent = document.createElement('div')
  codeContent.className = 'blog-code-content'
  code.parentNode.replaceChild(codeContent, code)
  codeContent.appendChild(code)
  body.append(lines, codeContent)
  pre.prepend(header)
  pre.appendChild(body)
  if (language === 'js' || language === 'html') {
    const footer = document.createElement('div')
    footer.className = 'blog-code-run-footer'
    const runButton = document.createElement('button')
    runButton.type = 'button'
    runButton.className = 'blog-code-action blog-code-run'
    runButton.setAttribute('data-blog-code-action', 'run')
    runButton.setAttribute('data-blog-code-run-kind', language)
    runButton.setAttribute('aria-label', `试运行${language}代码`)
    runButton.setAttribute('title', '试运行')
    runButton.innerHTML = `${runIconMarkup}<span>试运行</span>`
    footer.appendChild(runButton)
    const panel = document.createElement('div')
    panel.className = language === 'js'
      ? 'blog-code-run-panel blog-code-run-output-panel'
      : 'blog-code-run-panel blog-code-run-preview-panel'
    panel.setAttribute(language === 'js' ? 'data-blog-code-run-output' : 'data-blog-code-run-preview', '')
    panel.hidden = true
    panel.innerHTML = language === 'js'
      ? '<div class="blog-code-run-panel-title">运行输出</div><div class="blog-code-run-output" role="log" aria-live="polite"></div>'
      : '<div class="blog-code-run-panel-title">预览</div><div class="blog-code-run-preview-target"></div>'
    footer.appendChild(panel)
    pre.appendChild(footer)
  }
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
