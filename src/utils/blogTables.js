/**
 * Wrap rendered Markdown tables in a horizontal scroll container. Safe to
 * repeat: enhanced tables carry a data marker and are skipped on later calls,
 * which keeps Vue re-renders and keep-alive restores from stacking wrappers.
 *
 * 宽表格放进内层 .blog-table-scroll 横向滚动，不再溢出文章卡片；
 * 复制表格入口已下线，只保留滚动容器。
 */
export function enhanceBlogTables(root) {
  if (!root?.querySelectorAll) return []

  return [...root.querySelectorAll('.markdown-body table')].map((table) => {
    if (table.dataset.blogTableEnhanced === 'true') return table

    const wrapper = document.createElement('div')
    wrapper.className = 'blog-table-wrap'
    table.parentNode.insertBefore(wrapper, table)

    const scroller = document.createElement('div')
    scroller.className = 'blog-table-scroll'
    wrapper.appendChild(scroller)
    scroller.appendChild(table)

    table.dataset.blogTableEnhanced = 'true'
    return table
  })
}
