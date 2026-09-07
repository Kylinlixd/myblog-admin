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
  return items.map((item) => ({
    name: String(item?.name || item?.day || ''),
    count: Number(item?.dynamic_count ?? item?.count) || 0,
    views: Number(item?.views) || 0
  })).sort((a, b) => b.views - a.views).slice(0, limit)
}

export function mapDashboardData(response) {
  const payload = response?.data || response || {}
  return {
    total: mapDashboardStats(payload),
    daily: Array.isArray(payload.daily)
      ? payload.daily.slice(0, 7).map((item) => ({
        day: String(item?.day || ''),
        count: Number(item?.count) || 0,
        pv: Number(item?.pv) || 0
      }))
      : [],
    categories: mapSeries(payload.categories, 5),
    tags: mapSeries(payload.tags, 5),
    visits: {
      pv: Number(payload.visits?.pv) || 0,
      uv: Number(payload.visits?.uv) || 0,
      average: Number(payload.visits?.average) || 0,
      bounceRate: payload.visits?.bounce_rate == null ? null : Number(payload.visits.bounce_rate),
    },
    hotArticles: Array.isArray(payload.hot_articles) ? payload.hot_articles.slice(0, 5) : [],
    security: {
      uniqueIps: Number(payload.security?.unique_ips) || 0,
      medium: Number(payload.security?.medium) || 0,
      high: Number(payload.security?.high) || 0,
      critical: Number(payload.security?.critical) || 0,
      topIps: Array.isArray(payload.security?.top_ips) ? payload.security.top_ips.slice(0, 3) : [],
    },
    access: { requests: Number(payload.access?.requests) || 0, uniqueIps: Number(payload.access?.unique_ips ?? payload.access?.uniqueIps) || 0 }
  }
}
