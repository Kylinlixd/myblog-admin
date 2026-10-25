// 客户端 SEO 元信息：本站是无 SSR 的 SPA，Google 等会执行 JS 的爬虫
// 依赖这里写入的 per-page meta / canonical / JSON-LD；不执行 JS 的
// 社交爬虫只能读到 index.html 里的站点级静态标签。
const SITE_NAME = '时不语之间'
const DEFAULT_OG_IMAGE = '/apple-touch-icon.png'

function upsertMeta(attrName, attrKey, content) {
  if (!content) return
  let tag = document.head.querySelector(`meta[${attrName}="${attrKey}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attrName, attrKey)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

function upsertCanonical(href) {
  if (!href) return
  let link = document.head.querySelector('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', href)
}

let jsonLdNode = null
function upsertJsonLd(data) {
  if (!data) return
  if (!jsonLdNode) {
    jsonLdNode = document.createElement('script')
    jsonLdNode.setAttribute('type', 'application/ld+json')
    jsonLdNode.setAttribute('data-dynamic-seo', 'true')
    document.head.appendChild(jsonLdNode)
  }
  jsonLdNode.textContent = JSON.stringify(data)
}

// 从 markdown 正文提取纯文本摘要：先去掉代码块/图片/链接语法，
// 再清掉行内记号，避免把 **、` 等符号带进 meta description
export function excerptFromMarkdown(markdown, maxLength = 120) {
  const plain = String(markdown || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*`~_[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!plain) return ''
  return plain.length > maxLength ? `${plain.slice(0, maxLength)}…` : plain
}

export function applyArticleSeoMeta({ title, description, path, publishedAt, image }) {
  const origin = window.location.origin
  const fullTitle = title ? `${title}｜${SITE_NAME}` : document.title
  const desc = description || '个人博客文章'
  const url = `${origin}${path}`
  const ogImage = image || `${origin}${DEFAULT_OG_IMAGE}`

  document.title = fullTitle
  upsertMeta('name', 'description', desc)
  upsertMeta('property', 'og:title', fullTitle)
  upsertMeta('property', 'og:description', desc)
  upsertMeta('property', 'og:type', 'article')
  upsertMeta('property', 'og:url', url)
  upsertMeta('property', 'og:image', ogImage)
  upsertMeta('property', 'og:site_name', SITE_NAME)
  upsertMeta('name', 'twitter:card', 'summary')
  upsertCanonical(url)
  upsertJsonLd({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description: desc,
    url,
    image: ogImage,
    ...(publishedAt ? { datePublished: publishedAt } : {})
  })
}
