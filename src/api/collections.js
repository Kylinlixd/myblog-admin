export function normalizeCollectionResponse(response) {
  if (Array.isArray(response)) return { count: response.length, results: response }
  if (Array.isArray(response?.results)) {
    return { count: response.count ?? response.results.length, results: response.results }
  }

  const data = response?.data
  if (Array.isArray(data)) return { count: data.length, results: data }
  if (Array.isArray(data?.results)) {
    return { count: data.count ?? data.results.length, results: data.results }
  }
  if (Array.isArray(data?.items)) {
    return { count: data.total ?? data.items.length, results: data.items }
  }
  return { count: 0, results: [] }
}
