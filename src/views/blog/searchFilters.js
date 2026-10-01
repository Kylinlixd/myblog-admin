/**
 * 搜索页的本地筛选 / 排序 / 分页。
 *
 * 后端 `/api/blog/search` 只认 `keyword`、`sortBy`、`includeTags`、`includeCategories`，
 * `category`、`tag`、`time`、`hasMedia` 都不参与查询。所以关键词命中后的
 * 分类 / 标签 / 时间范围 / 多媒体筛选，由前端在结果集上完成。
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

const matchesCategory = (item, categoryId) => {
  if (!categoryId) return true
  // 选了分类就只保留该分类下的文章，tag/category 类型的结果条目一并排除
  return item?.type === 'dynamic' && String(item?.category?.id) === String(categoryId)
}

const matchesTag = (item, tagId) => {
  if (!tagId) return true
  // 选了标签就只保留带该标签的文章，tag/category 类型的结果条目一并排除
  return item?.type === 'dynamic' && (item?.tags || []).some((tag) => String(tag?.id) === String(tagId))
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
export function refineItems(items, { time, hasMedia, category, tag, sortBy } = {}) {
  const filtered = (items || []).filter(
    (item) =>
      matchesTimeRange(item, time) &&
      matchesMedia(item, hasMedia) &&
      matchesCategory(item, category) &&
      matchesTag(item, tag)
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
