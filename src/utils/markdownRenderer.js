import MarkdownIt from 'markdown-it'

const firstInfoWord = (info = '') => info.trim().split(/\s+/)[0] || 'text'

const codeLineCount = (content = '') => Math.max(1, content.split('\n').length)

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
  return `<pre class="blog-code-window" data-blog-code-window="true" data-language="${escapedLanguage}"><div class="blog-code-header"><span class="blog-code-dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="blog-code-language">${escapedLanguage}</span><span class="blog-code-actions"><button type="button" class="blog-code-action blog-code-collapse" data-blog-code-action="collapse" aria-expanded="true" aria-label="${escapedCollapseLabel}" title="${escapedCollapseLabel}">⌄</button><button type="button" class="blog-code-action blog-code-copy" data-blog-code-action="copy" aria-label="${escapedCopyLabel}" title="${escapedCopyLabel}">复制</button></span></div><div class="blog-code-body"><span class="blog-code-lines" aria-hidden="true">${lines}</span><div class="blog-code-content"><code class="language-${escapedLanguage}">${codeHtml}</code></div></div></pre>`
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
