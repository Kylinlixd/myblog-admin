import MarkdownIt from 'markdown-it'

const firstInfoWord = (info = '') => info.trim().split(/\s+/)[0] || 'text'

const codeLineCount = (content = '') => {
  // markdown-it appends one terminal newline to fenced code tokens. It is not
  // rendered as a visible line by the browser, so exclude it from numbering.
  const visibleContent = content.endsWith('\n') ? content.slice(0, -1) : content
  return Math.max(1, visibleContent.split('\n').length)
}

const copyIconMarkup = '<svg class="blog-code-copy-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="8" y="8" width="11" height="11" rx="2"></rect><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"></path></svg>'
const collapseIconMarkup = '<svg class="blog-code-collapse-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6"></path></svg>'

const renderCode = (md, token, options) => {
  const rawCode = token.content || ''
  const language = firstInfoWord(token.info)
  const escapedLanguage = md.utils.escapeHtml(language)
  const highlighted = typeof options.highlight === 'function'
    ? options.highlight(rawCode, language)
    : ''
  const codeHtml = highlighted || md.utils.escapeHtml(rawCode)
  const lines = Array.from({ length: codeLineCount(rawCode) }, (_, index) => index + 1).join('\n')
  const escapedCollapseLabel = md.utils.escapeHtml(`折叠${language}代码`)
  const escapedCopyLabel = md.utils.escapeHtml(`复制${language}代码`)

  // Keep the wrapper's structural nodes adjacent. Whitespace text nodes inside
  // a <pre> are rendered as blank code lines and push the Mac header away from
  // the top edge of the window.
  return `<pre class="blog-code-window" data-blog-code-window="true" data-language="${escapedLanguage}"><div class="blog-code-header"><span class="blog-code-dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="blog-code-language">${escapedLanguage}</span><span class="blog-code-actions"><button type="button" class="blog-code-action blog-code-collapse" data-blog-code-action="collapse" aria-expanded="true" aria-label="${escapedCollapseLabel}" title="${escapedCollapseLabel}">${collapseIconMarkup}</button><button type="button" class="blog-code-action blog-code-copy" data-blog-code-action="copy" aria-label="${escapedCopyLabel}" title="${escapedCopyLabel}">${copyIconMarkup}</button><span class="blog-code-copy-feedback" role="status" aria-live="polite">已复制</span></span></div><div class="blog-code-body"><span class="blog-code-lines" aria-hidden="true">${lines}</span><div class="blog-code-content"><code class="language-${escapedLanguage}">${codeHtml}</code></div></div></pre>`
}

export function macCodeWindowPlugin(md, options = {}) {
  md.renderer.rules.fence = (tokens, index) => renderCode(md, tokens[index], options)
}

export function createMarkdownRenderer(options = {}) {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true
  })

  macCodeWindowPlugin(md, options)
  return md
}
