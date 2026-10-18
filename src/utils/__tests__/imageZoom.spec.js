import { describe, expect, it } from '@jest/globals'
import { MAX_SCALE, MIN_SCALE, clampOffset, clampScale, resolveSwipeAction, zoomAtPoint } from '../imageZoom'

const geometry = { baseWidth: 1000, baseHeight: 600, viewportWidth: 1000, viewportHeight: 600 }

describe('imageZoom', () => {
  it('缩放限制在 1× 到 4× 之间', () => {
    expect(clampScale(0.3)).toBe(MIN_SCALE)
    expect(clampScale(9)).toBe(MAX_SCALE)
    expect(clampScale('abc')).toBe(MIN_SCALE)
  })

  it('图片小于视口时不产生位移', () => {
    expect(clampOffset({ x: 300, y: -300 }, { ...geometry, scale: 1 })).toEqual({ x: 0, y: 0 })
  })

  it('放大后位移不超过可滑动范围', () => {
    const offset = clampOffset({ x: 900, y: -900 }, { ...geometry, scale: 2 })
    expect(offset).toEqual({ x: 500, y: -300 })
  })

  it('以指针为锚点缩放，锚点下的像素保持不动', () => {
    const result = zoomAtPoint({ scale: 1, offset: { x: 0, y: 0 } }, 2, { x: 100, y: 50 }, geometry)
    expect(result.scale).toBe(2)
    expect(result.offset).toEqual({ x: -100, y: -50 })
  })

  it('已达到上限时只夹紧位移，不再放大', () => {
    const result = zoomAtPoint({ scale: MAX_SCALE, offset: { x: 0, y: 0 } }, 2, { x: 0, y: 0 }, geometry)
    expect(result.scale).toBe(MAX_SCALE)
  })

  it('缩放到 1× 时下拉关闭，放大后左右滑动切图', () => {
    expect(resolveSwipeAction({ dx: 10, dy: 160 })).toBe('close')
    expect(resolveSwipeAction({ dx: 120, dy: 8 })).toBe('prev')
    expect(resolveSwipeAction({ dx: -120, dy: 8 })).toBe('next')
    expect(resolveSwipeAction({ dx: -120, dy: 8, scale: 2 })).toBe('')
    expect(resolveSwipeAction({ dx: 10, dy: 20 })).toBe('')
  })
})
