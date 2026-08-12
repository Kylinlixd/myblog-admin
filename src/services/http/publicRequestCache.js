const entries = new Map()

export function cachedRequest(key, loader, ttl = 30_000) {
  const now = Date.now()
  const current = entries.get(key)
  if (current && current.expiresAt > now) return current.promise

  // 只缓存公开 GET 请求，写操作不应复用旧数据。
  const promise = Promise.resolve().then(loader).catch((error) => {
    // 网络失败不留在缓存里，用户重试时应重新发起请求。
    entries.delete(key)
    throw error
  })
  entries.set(key, { expiresAt: now + ttl, promise })
  return promise
}

export function clearRequestCache(prefix = '') {
  for (const key of entries.keys()) {
    if (!prefix || key.startsWith(prefix)) entries.delete(key)
  }
}
