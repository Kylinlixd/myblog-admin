import { unwrapApiResponse } from './response'

export function normalizeCollectionResponse(response) {
  const payload = unwrapApiResponse(response)

  if (Array.isArray(payload)) return { count: payload.length, results: payload }
  if (Array.isArray(payload?.results)) {
    return { count: payload.count ?? payload.results.length, results: payload.results }
  }

  if (Array.isArray(payload?.list)) {
    return { count: payload.total ?? payload.list.length, results: payload.list }
  }
  if (Array.isArray(payload?.items)) {
    return { count: payload.total ?? payload.items.length, results: payload.items }
  }

  return { count: 0, results: [] }
}
