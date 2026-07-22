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
