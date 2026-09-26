/**
 * 搜索页的本地筛选 / 排序 / 分页。
 *
 * 后端 `/api/blog/search` 只认 `keyword` 与 `sortBy`（`category`、`tag`、`time`、`hasMedia` 都不参与查询），
 * 公共动态流也只提供「全部 / 分类 / 标签」三种入口。所以「不带关键词、只按条件筛」这一档，
 * 由前端在取回的结果集上完成时间范围、多媒体、排序与分页。
 */

export const TIME_RANGE_DAYS = {
  week: 7,
  month: 30,
  quarter: 90,
  year: 365
}

const DAY_MS = 24 * 60 * 60 * 1000

export const itemCreatedAt = (item) => {
  const raw = item?.createdAt || item?.created_at || item?.createTime
  const time = raw ? new Date(raw).getTime() : Number.NaN
  return Number.isNaN(time) ? 0 : time
}

export const itemHasMedia = (item) => {
  const media = item?.mediaUrls || item?.media_urls || item?.files
  return Array.isArray(media) ? media.length > 0 : Boolean(media)
}

export const matchesTimeRange = (item, range, now = Date.now()) => {
  const days = TIME_RANGE_DAYS[range]
  if (!days) return true

  const created = itemCreatedAt(item)
  if (!created) return true
  return now - created <= days * DAY_MS
}

export const matchesMedia = (item, hasMedia) => !hasMedia || itemHasMedia(item)

const SORTERS = {
  time_desc: (left, right) => itemCreatedAt(right) - itemCreatedAt(left),
  time_asc: (left, right) => itemCreatedAt(left) - itemCreatedAt(right),
  likes_desc: (left, right) => (Number(right?.likes) || 0) - (Number(left?.likes) || 0),
  comments_desc: (left, right) => (Number(right?.comments) || 0) - (Number(left?.comments) || 0),
  views_desc: (left, right) => (Number(right?.views) || 0) - (Number(left?.views) || 0)
}

export function sortItems(items, sortBy) {
  const sorter = SORTERS[sortBy]
  if (!sorter) return [...(items || [])]
  return [...items].sort(sorter)
}

/** 按条件过滤 + 排序：关键词模式与条件模式共用同一套口径 */
export function refineItems(items, { time, hasMedia, sortBy } = {}) {
  const filtered = (items || []).filter(
    (item) => matchesTimeRange(item, time) && matchesMedia(item, hasMedia)
  )
  return sortItems(filtered, sortBy)
}

export function paginate(items, page = 1, pageSize = 10) {
  const list = items || []
  const size = Math.max(1, Number(pageSize) || 10)
  const totalPages = Math.max(1, Math.ceil(list.length / size))
  const current = Math.min(Math.max(1, Number(page) || 1), totalPages)
  const start = (current - 1) * size

  return {
    items: list.slice(start, start + size),
    total: list.length,
    page: current,
    pageSize: size,
    totalPages
  }
}

/**
 * 结果归一化：搜索接口返回 `createdAt`/`views` 等驼峰字段，
 * 公共动态流返回 `created_at`/`createdAt` 混合，这里统一成渲染需要的形状。
 */
export function normalizeSearchItem(item) {
  if (!item || typeof item !== 'object') return item
  return {
    ...item,
    createdAt: item.createdAt || item.created_at || item.createTime,
    views: Number(item.views) || 0,
    likes: Number(item.likes) || 0,
    comments: Number(item.comments) || 0
  }
}
