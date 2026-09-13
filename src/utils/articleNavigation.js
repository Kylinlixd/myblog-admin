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
    heading.tabIndex = -1
    return { id, level: Number(heading.tagName.slice(1)), text, element: heading }
  })
}

export function getActiveHeadingId(headings, offset = 120) {
  const visible = headings.filter(({ element }) => element?.getBoundingClientRect?.().top <= offset)
  return visible.at(-1)?.id || headings[0]?.id || ''
}

/**
 * Observe headings near the reading line. IntersectionObserver avoids reading
 * every heading's layout on every scroll event; the caller receives only the
 * active id. A no-op cleanup is returned when the API is unavailable so the
 * page can fall back to its regular progress listener.
 */
export function observeArticleHeadings(headings, { offset = 120, onChange } = {}) {
  if (!headings?.length || typeof IntersectionObserver === 'undefined') return () => {}
  const notify = typeof onChange === 'function' ? onChange : () => {}
  const observer = new IntersectionObserver(() => {
    notify(getActiveHeadingId(headings, offset))
  }, {
    root: null,
    rootMargin: `-${Math.max(0, offset)}px 0px -68% 0px`,
    threshold: [0, 1]
  })
  headings.forEach(({ element }) => observer.observe(element))
  notify(getActiveHeadingId(headings, offset))
  return () => observer.disconnect()
}
