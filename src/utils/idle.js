export function scheduleIdle(callback) {
  if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(callback)
    return () => window.cancelIdleCallback?.(id)
  }

  const id = window.setTimeout(callback, 250)
  return () => window.clearTimeout(id)
}
