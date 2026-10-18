export const MIN_SCALE = 1
export const MAX_SCALE = 4

export const clamp = (value, min, max) => {
  const result = Math.min(max, Math.max(min, value))
  return result === 0 ? 0 : result
}

export const clampScale = (scale) => clamp(Number(scale) || MIN_SCALE, MIN_SCALE, MAX_SCALE)

/**
 * 放大后的图片不能露出底色：按图片在视口中的实际尺寸把位移夹在 ±可滑动距离内。
 * 坐标原点在视口中心，与 CSS translate 的中心原点一致。
 */
export const clampOffset = (
  offset = { x: 0, y: 0 },
  { baseWidth = 0, baseHeight = 0, scale = MIN_SCALE, viewportWidth = 0, viewportHeight = 0 } = {}
) => {
  const maxX = Math.max(0, (baseWidth * scale - viewportWidth) / 2)
  const maxY = Math.max(0, (baseHeight * scale - viewportHeight) / 2)
  return {
    x: clamp(offset.x, -maxX, maxX),
    y: clamp(offset.y, -maxY, maxY)
  }
}

/**
 * 以视口内某个点为锚点缩放：锚点下的像素在缩放前后保持不动。
 * point 是相对视口中心的坐标。
 */
export const zoomAtPoint = (
  { scale = MIN_SCALE, offset = { x: 0, y: 0 } } = {},
  factor = 1,
  point = { x: 0, y: 0 },
  geometry = {}
) => {
  const nextScale = clampScale(scale * factor)
  if (nextScale === scale) {
    return { scale, offset: clampOffset(offset, { ...geometry, scale }) }
  }
  const ratio = nextScale / scale
  const nextOffset = {
    x: point.x - (point.x - offset.x) * ratio,
    y: point.y - (point.y - offset.y) * ratio
  }
  return {
    scale: nextScale,
    offset: clampOffset(nextOffset, { ...geometry, scale: nextScale })
  }
}

/**
 * 关闭手势判定：缩放到 1× 时下拉关闭，否则左右滑动切换。
 */
export const resolveSwipeAction = ({ dx = 0, dy = 0, scale = MIN_SCALE } = {}) => {
  if (scale > MIN_SCALE + 0.01) return ''
  if (dy > 110 && Math.abs(dy) > Math.abs(dx) * 1.2) return 'close'
  if (Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.2) return dx > 0 ? 'prev' : 'next'
  return ''
}
