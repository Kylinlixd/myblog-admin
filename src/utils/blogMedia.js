import { buildApiUrl } from './apiBaseUrl'

// 媒体 = 图片 / 音频 / 视频，正文里内联展示；其余类型一律按“附件”处理，
// 只在文章末尾提供下载。类型缺失或后端给了 other 时，按扩展名兜底。
export const INLINE_MEDIA_TYPES = ['image', 'video', 'audio']

const IMAGE_EXTENSION = /\.(avif|bmp|gif|jpe?g|png|svg|webp)(?:$|[?#])/i
const VIDEO_EXTENSION = /\.(m4v|mov|mp4|ogv|webm)(?:$|[?#])/i
const AUDIO_EXTENSION = /\.(aac|flac|m4a|mp3|oga|ogg|wav)(?:$|[?#])/i

export const guessMediaType = (url = '') => {
  const value = String(url)
  if (IMAGE_EXTENSION.test(value)) return 'image'
  if (VIDEO_EXTENSION.test(value)) return 'video'
  if (AUDIO_EXTENSION.test(value)) return 'audio'
  return ''
}

/**
 * 把接口返回的 mediaUrls / media_urls / files 统一成组件可直接消费的结构。
 * 同一地址只保留一次；name、size、posterUrl 缺失时给出安全的默认值。
 */
export const normalizeMediaItems = (dynamic) => {
  const media = dynamic?.mediaUrls ?? dynamic?.media_urls ?? dynamic?.files ?? []
  const items = Array.isArray(media) ? media : [media]
  const seen = new Set()

  return items
    .map((item) => {
      const rawUrl = typeof item === 'string' ? item : item?.url || item?.file_url || ''
      const url = buildApiUrl(rawUrl)
      if (!url || seen.has(url)) return null
      seen.add(url)

      const poster = typeof item === 'string' ? '' : item?.posterUrl || item?.poster_url || ''
      const declaredType = typeof item === 'object'
        ? item?.type || item?.file_type || ''
        : ''
      const fallbackType = dynamic?.type || ''
      const guessedType = guessMediaType(url)
      // 明确声明为 file/other 时不要被 dynamic 的全局 type 带偏；只有完全缺失才回退。
      const type = guessedType
        || (declaredType && declaredType !== 'other' ? declaredType : '')
        || (fallbackType && fallbackType !== 'other' ? fallbackType : 'other')

      return {
        url,
        type,
        name: typeof item === 'object' ? item?.name || '' : '',
        size: typeof item === 'object' ? Number(item?.size || item?.file_size || 0) : 0,
        posterUrl: poster ? buildApiUrl(poster) : ''
      }
    })
    .filter(Boolean)
}

export const isInlineMedia = (item) => INLINE_MEDIA_TYPES.includes(item?.type)

export const isImageMedia = (item) => item?.type === 'image'

/**
 * 列表卡片只给一张封面：优先图片，其次视频；音频和文件都不在列表里露出。
 */
export const previewMediaItem = (dynamic) => {
  const items = normalizeMediaItems(dynamic)
  return items.find(isImageMedia) || items.find((item) => item.type === 'video') || null
}

export const imageMediaItems = (dynamic) => normalizeMediaItems(dynamic).filter(isImageMedia)

export const attachmentMediaItems = (dynamic) => normalizeMediaItems(dynamic).filter((item) => !isInlineMedia(item))

const FILE_KIND_RULES = [
  { kind: 'pdf', pattern: /\.pdf(?:$|[?#])/i },
  { kind: 'word', pattern: /\.(docx?|rtf|odt)(?:$|[?#])/i },
  { kind: 'excel', pattern: /\.(xlsx?|csv|ods)(?:$|[?#])/i },
  { kind: 'slide', pattern: /\.(pptx?|odp|key)(?:$|[?#])/i },
  { kind: 'archive', pattern: /\.(7z|bz2|gz|rar|tar|tgz|zip)(?:$|[?#])/i },
  { kind: 'code', pattern: /\.(css|html?|js|json|md|py|sh|ts|txt|xml|ya?ml)(?:$|[?#])/i }
]

export const attachmentKind = (url = '') => (
  FILE_KIND_RULES.find((rule) => rule.pattern.test(String(url)))?.kind || 'file'
)

export const attachmentLabel = (item) => {
  if (item?.name) return item.name
  const clean = String(item?.url || '').split(/[?#]/)[0]
  const last = clean.split('/').filter(Boolean).pop()
  return last || '附件'
}
