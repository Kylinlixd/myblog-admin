export function getApiBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
}

export function buildApiUrl(url) {
  if (!url || url.startsWith('http')) return url
  const normalizedUrl = url.startsWith('/') ? url : `/${url}`
  return `${getApiBaseUrl()}${normalizedUrl}`
}

export function stripApiBaseUrl(url) {
  const baseUrl = getApiBaseUrl()
  if (!url || !baseUrl || !url.startsWith(baseUrl)) return url
  return url.slice(baseUrl.length) || '/'
}
