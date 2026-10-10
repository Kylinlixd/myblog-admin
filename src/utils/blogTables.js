const COPY_ICON_MARKUP = '<svg class="blog-table-copy-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="8" y="8" width="11" height="11" rx="2"></rect><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"></path></svg>'

const toTsvCell = (text) => String(text || '')
  .replace(/\s+/g, ' ')
  .trim()

// TSV keeps the table paste-ready for Excel / 飞书 / 语雀; cell text is
// flattened because embedded tabs or newlines would corrupt the columns.
export const tableToTsv = (table) => [...table.rows]
  .map((row) => [...row.cells].map((cell) => toTsvCell(cell.textContent)).join('\t'))
  .join('\n')

const copyText = async (rawText) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(rawText)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = rawText
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  if (typeof document.execCommand === 'function') document.execCommand('copy')
  textarea.remove()
}

const COPY_FEEDBACK_MS = 2500

const setCopyState = (button, text) => {
  const wrapper = button.closest('.blog-table-wrap')
  const feedback = wrapper?.querySelector('.blog-table-copy-feedback')
  const copied = text === '已复制'
  button.classList.toggle('is-copied', copied)
  // 标记打在 wrapper 上：复制成功期间按钮无条件隐藏（含 hover/focus），只留反馈胶囊
  wrapper?.classList.toggle('is-copied', copied)
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
      wrapper?.classList.remove('is-copied')
      button.setAttribute('aria-label', '复制表格')
      button.setAttribute('title', '复制表格')
    }, COPY_FEEDBACK_MS)
  }
}

/**
 * Wrap rendered Markdown tables with a hover copy control. Safe to repeat:
 * enhanced tables carry a data marker and are skipped on later calls, which
 * keeps Vue re-renders and keep-alive restores from stacking wrappers.
 */
export function enhanceBlogTables(root) {
  if (!root?.querySelectorAll) return []

  return [...root.querySelectorAll('.markdown-body table')].map((table) => {
    if (table.dataset.blogTableEnhanced === 'true') return table

    const wrapper = document.createElement('div')
    wrapper.className = 'blog-table-wrap'
    table.parentNode.insertBefore(wrapper, table)
    wrapper.appendChild(table)

    const copyButton = document.createElement('button')
    copyButton.type = 'button'
    copyButton.className = 'blog-table-copy'
    copyButton.setAttribute('data-blog-table-copy', '')
    copyButton.setAttribute('aria-label', '复制表格')
    copyButton.setAttribute('title', '复制表格')
    copyButton.innerHTML = `${COPY_ICON_MARKUP}<span>复制表格</span>`

    const copyFeedback = document.createElement('span')
    copyFeedback.className = 'blog-table-copy-feedback'
    copyFeedback.setAttribute('role', 'status')
    copyFeedback.setAttribute('aria-live', 'polite')
    copyFeedback.textContent = '已复制'

    copyButton.addEventListener('click', async () => {
      try {
        await copyText(tableToTsv(table))
        setCopyState(copyButton, '已复制')
      } catch {
        setCopyState(copyButton, '复制失败')
      }
    })

    wrapper.append(copyButton, copyFeedback)
    table.dataset.blogTableEnhanced = 'true'
    return table
  })
}
