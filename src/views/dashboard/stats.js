const EMPTY_STATS = { dynamics: 0, categories: 0, tags: 0, comments: 0 }

export function mapDashboardStats(response) {
  const total = response?.data?.total || response?.total
  if (!total) return { ...EMPTY_STATS }
  return {
    dynamics: Number(total.dynamics) || 0,
    categories: Number(total.categories) || 0,
    tags: Number(total.tags) || 0,
    comments: Number(total.comments) || 0
  }
}

function mapSeries(items, limit = 7) {
  if (!Array.isArray(items)) return []
  return items.slice(0, limit).map((item) => ({
    name: String(item?.name || item?.day || ''),
    count: Number(item?.dynamic_count ?? item?.count) || 0
  }))
}

export function mapDashboardData(response) {
  const payload = response?.data || response || {}
  return {
    total: mapDashboardStats(payload),
    daily: Array.isArray(payload.daily)
      ? payload.daily.slice(0, 7).map((item) => ({
        day: String(item?.day || ''),
        count: Number(item?.count) || 0
      }))
      : [],
    categories: mapSeries(payload.categories, 5),
    tags: mapSeries(payload.tags, 5)
  }
}
