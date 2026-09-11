const slugifyHeading = (text) => String(text || '')
  .trim()
  .toLocaleLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, '-')
  .replace(/^-+|-+$/g, '')

export function collectArticleHeadings(root) {
  if (!root?.querySelectorAll) return []
  const seen = new Map()
  return [...root.querySelectorAll('h2, h3, h4')].map((heading, index) => {
    const text = heading.textContent?.trim() || `章节 ${index + 1}`
    const base = slugifyHeading(text) || `section-${index + 1}`
    const count = (seen.get(base) || 0) + 1
    seen.set(base, count)
    const id = `article-heading-${base}${count > 1 ? `-${count}` : ''}`
    heading.id = id
    return { id, level: Number(heading.tagName.slice(1)), text, element: heading }
  })
}

export function getActiveHeadingId(headings, offset = 120) {
  const visible = headings.filter(({ element }) => element?.getBoundingClientRect?.().top <= offset)
  return visible.at(-1)?.id || headings[0]?.id || ''
}
