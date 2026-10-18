<template>
  <Teleport to="body">
    <div
      v-if="open && images.length"
      ref="rootRef"
      class="image-lightbox"
      :class="{ 'is-dragging': dragging, 'is-zoomed': scale > 1 }"
      role="dialog"
      aria-modal="true"
      aria-label="图片预览"
      @keydown="handleKeydown"
    >
      <div
        ref="stageRef"
        class="image-lightbox__stage"
        @click.self="requestClose"
        @dblclick="handleDoubleClick"
        @pointerdown="handlePointerDown"
        @pointermove="handlePointerMove"
        @pointerup="handlePointerUp"
        @pointercancel="handlePointerUp"
        @wheel.prevent="handleWheel"
        @gesturestart.prevent="handleGestureStart"
        @gesturechange.prevent="handleGestureChange"
        @gestureend.prevent="handleGestureEnd"
      >
        <img
          ref="imageRef"
          class="image-lightbox__image"
          :src="current.src"
          :alt="current.alt || `图 ${index + 1}`"
          :style="imageStyle"
          draggable="false"
          decoding="async"
          @load="handleImageLoad"
          @error="handleImageError"
        />
        <div v-if="loading && !failed" class="image-lightbox__status" role="status">加载中…</div>
        <div v-else-if="failed" class="image-lightbox__status" role="status">
          <p>图片加载失败</p>
          <button type="button" class="image-lightbox__retry" @click.stop="retry">重试</button>
        </div>
      </div>

      <div class="image-lightbox__topbar">
        <span v-if="images.length > 1" class="image-lightbox__counter" aria-live="polite">{{ index + 1 }} / {{ images.length }}</span>
        <button ref="closeRef" type="button" class="image-lightbox__circle" aria-label="关闭图片预览" @click="requestClose">×</button>
      </div>

      <div class="image-lightbox__footer">
        <p v-if="caption" class="image-lightbox__caption">{{ caption }}</p>
        <div class="image-lightbox__toolbar" role="toolbar" aria-label="图片操作">
          <button
            v-if="images.length > 1"
            type="button"
            class="image-lightbox__circle"
            aria-label="上一张"
            :disabled="index === 0"
            @click="go(-1)"
          >‹</button>
          <button type="button" class="image-lightbox__circle" aria-label="缩小" :disabled="scale <= 1" @click="zoomBy(1 / 1.35)">−</button>
          <button type="button" class="image-lightbox__circle" aria-label="放大" :disabled="scale >= 4" @click="zoomBy(1.35)">+</button>
          <button type="button" class="image-lightbox__pill" @click="resetView">适应</button>
          <button
            v-if="images.length > 1"
            type="button"
            class="image-lightbox__circle"
            aria-label="下一张"
            :disabled="index === images.length - 1"
            @click="go(1)"
          >›</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { clamp, clampOffset, clampScale, MAX_SCALE, MIN_SCALE, resolveSwipeAction, zoomAtPoint } from '@/utils/imageZoom'

const props = defineProps({
  open: { type: Boolean, default: false },
  images: { type: Array, default: () => [] },
  startIndex: { type: Number, default: 0 }
})
const emit = defineEmits(['close'])

const rootRef = ref(null)
const stageRef = ref(null)
const imageRef = ref(null)
const closeRef = ref(null)

const index = ref(0)
const scale = ref(MIN_SCALE)
const offset = reactive({ x: 0, y: 0 })
const loading = ref(true)
const failed = ref(false)
const dragging = ref(false)

const current = computed(() => props.images[index.value] || { src: '', alt: '' })
const caption = computed(() => String(current.value.alt || '').trim())
const imageStyle = computed(() => ({
  transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale.value})`
}))

let pointers = new Map()
let gesture = null
let lastTap = { at: 0, x: 0, y: 0 }
let restoreFocus = null
let scrollTop = 0
let locked = false

const geometry = () => ({
  baseWidth: imageRef.value?.clientWidth || 0,
  baseHeight: imageRef.value?.clientHeight || 0,
  viewportWidth: stageRef.value?.clientWidth || window.innerWidth,
  viewportHeight: stageRef.value?.clientHeight || window.innerHeight
})

const applyZoom = (result) => {
  scale.value = result.scale
  offset.x = result.offset.x
  offset.y = result.offset.y
}

const resetView = () => {
  scale.value = MIN_SCALE
  offset.x = 0
  offset.y = 0
}

const zoomBy = (factor, point = { x: 0, y: 0 }) => {
  applyZoom(zoomAtPoint({ scale: scale.value, offset: { ...offset } }, factor, point, geometry()))
}

const pointFromEvent = (event) => {
  const rect = stageRef.value?.getBoundingClientRect() || { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight }
  return {
    x: event.clientX - rect.left - rect.width / 2,
    y: event.clientY - rect.top - rect.height / 2
  }
}

const handleWheel = (event) => {
  const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1
  // 触控板双指捏合带 ctrlKey，单次 delta 很小，灵敏度要比鼠标滚轮高一个量级
  const rate = event.ctrlKey ? 0.012 : 0.0016
  const factor = clamp(Math.exp(-event.deltaY * unit * rate), 0.8, 1.25)
  zoomBy(factor, pointFromEvent(event))
}

let gestureBase = null

// Safari 的触控板捏合走 gesture 事件（Chrome 走 ctrlKey + wheel），两条路径都要接管
const handleGestureStart = (event) => {
  gestureBase = { scale: scale.value, offset: { ...offset }, x: event.clientX, y: event.clientY }
}

const handleGestureChange = (event) => {
  if (!gestureBase) return
  const nextScale = clampScale(gestureBase.scale * (event.scale || 1))
  if (nextScale === gestureBase.scale) return
  const ratio = nextScale / gestureBase.scale
  const point = pointFromEvent(event)
  const nextOffset = {
    x: point.x - (point.x - gestureBase.offset.x) * ratio,
    y: point.y - (point.y - gestureBase.offset.y) * ratio
  }
  scale.value = nextScale
  const clamped = clampOffset(nextOffset, { ...geometry(), scale: nextScale })
  offset.x = clamped.x
  offset.y = clamped.y
}

const handleGestureEnd = () => { gestureBase = null }

const handleDoubleClick = (event) => {
  if (scale.value > 1.05) {
    resetView()
  } else {
    zoomBy(2.2, pointFromEvent(event))
  }
}

const go = (delta) => {
  const next = index.value + delta
  if (next < 0 || next >= props.images.length) return
  index.value = next
}

const requestClose = () => emit('close')

const handleImageLoad = () => {
  loading.value = false
  failed.value = false
  const clamped = clampOffset(offset, { ...geometry(), scale: scale.value })
  offset.x = clamped.x
  offset.y = clamped.y
}

const handleImageError = () => {
  loading.value = false
  failed.value = true
}

const retry = () => {
  failed.value = false
  loading.value = true
  nextTick(() => {
    if (imageRef.value) imageRef.value.src = current.value.src
  })
}

const handlePointerDown = (event) => {
  if (event.pointerType === 'mouse' && event.button !== 0) return
  stageRef.value?.setPointerCapture?.(event.pointerId)
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })

  if (pointers.size === 1) {
    gesture = {
      mode: 'drag',
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
      startedAt: Date.now(),
      moved: false
    }
    dragging.value = scale.value > 1
  } else if (pointers.size === 2) {
    const [a, b] = [...pointers.values()]
    gesture = {
      mode: 'pinch',
      distance: Math.hypot(a.x - b.x, a.y - b.y) || 1,
      scale: scale.value,
      originX: offset.x,
      originY: offset.y
    }
    dragging.value = true
  }
}

const handlePointerMove = (event) => {
  if (!pointers.has(event.pointerId) || !gesture) return
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })

  if (gesture.mode === 'pinch' && pointers.size >= 2) {
    const [a, b] = [...pointers.values()]
    const distance = Math.hypot(a.x - b.x, a.y - b.y) || 1
    const midpoint = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
    const nextScale = clamp(gesture.scale * (distance / gesture.distance), MIN_SCALE, MAX_SCALE)
    const ratio = nextScale / gesture.scale
    const stageRect = stageRef.value?.getBoundingClientRect() || { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight }
    const point = {
      x: midpoint.x - stageRect.left - stageRect.width / 2,
      y: midpoint.y - stageRect.top - stageRect.height / 2
    }
    scale.value = nextScale
    const clamped = clampOffset(
      { x: point.x - (point.x - gesture.originX) * ratio, y: point.y - (point.y - gesture.originY) * ratio },
      { ...geometry(), scale: nextScale }
    )
    offset.x = clamped.x
    offset.y = clamped.y
    return
  }

  if (gesture.mode !== 'drag') return
  const dx = event.clientX - gesture.startX
  const dy = event.clientY - gesture.startY
  if (Math.abs(dx) + Math.abs(dy) > 6) gesture.moved = true

  if (scale.value <= 1.01) {
    // 1× 时拖拽是“关闭 / 切换”的手势预览，只做轻微位移反馈。
    offset.x = dx * 0.3
    offset.y = Math.max(0, dy) * 0.85
  } else {
    const clamped = clampOffset(
      { x: gesture.originX + dx, y: gesture.originY + dy },
      { ...geometry(), scale: scale.value }
    )
    offset.x = clamped.x
    offset.y = clamped.y
  }
}

const handlePointerUp = (event) => {
  const active = gesture
  pointers.delete(event.pointerId)
  if (!active) return

  if (active.mode === 'pinch') {
    if (pointers.size < 2) {
      gesture = pointers.size === 1
        ? { ...gesture, mode: 'drag', startX: event.clientX, startY: event.clientY, originX: offset.x, originY: offset.y, startedAt: Date.now(), moved: true }
        : null
    }
    dragging.value = pointers.size > 0
    if (!gesture) {
      const clamped = clampOffset(offset, { ...geometry(), scale: scale.value })
      offset.x = clamped.x
      offset.y = clamped.y
    }
    return
  }

  if (active.mode === 'drag') {
    const dx = event.clientX - active.startX
    const dy = event.clientY - active.startY
    const elapsed = Date.now() - active.startedAt

    if (!active.moved && elapsed < 320) {
      const now = Date.now()
      const isDoubleTap = now - lastTap.at < 320 && Math.hypot(event.clientX - lastTap.x, event.clientY - lastTap.y) < 44
      if (isDoubleTap) {
        lastTap = { at: 0, x: 0, y: 0 }
        if (scale.value > 1.05) resetView()
        else zoomBy(2.2, pointFromEvent(event))
      } else {
        lastTap = { at: now, x: event.clientX, y: event.clientY }
      }
    } else if (scale.value <= 1.01) {
      const action = resolveSwipeAction({ dx, dy, scale: scale.value })
      if (action === 'close') {
        emit('close')
        return
      }
      if (action === 'prev') go(-1)
      if (action === 'next') go(1)
    }

    dragging.value = false
    gesture = null
    if (scale.value <= 1.01) resetView()
    else {
      const clamped = clampOffset(offset, { ...geometry(), scale: scale.value })
      offset.x = clamped.x
      offset.y = clamped.y
    }
  }
}

const handleKeydown = (event) => {
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('close')
    return
  }
  if (event.key === 'ArrowLeft' && props.images.length > 1) {
    event.preventDefault()
    go(-1)
    return
  }
  if (event.key === 'ArrowRight' && props.images.length > 1) {
    event.preventDefault()
    go(1)
    return
  }
  if (event.key === '+' || event.key === '=') {
    event.preventDefault()
    zoomBy(1.35)
    return
  }
  if (event.key === '-') {
    event.preventDefault()
    zoomBy(1 / 1.35)
    return
  }
  if (event.key === '0') {
    event.preventDefault()
    resetView()
    return
  }
  if (event.key !== 'Tab') return
  const buttons = [...(rootRef.value?.querySelectorAll('button:not([disabled])') || [])]
  if (!buttons.length) return
  const first = buttons[0]
  const last = buttons[buttons.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

const lockPage = () => {
  if (locked) return
  locked = true
  scrollTop = window.scrollY
  restoreFocus = document.activeElement
  document.body.style.position = 'fixed'
  document.body.style.top = `-${scrollTop}px`
  document.body.style.left = '0'
  document.body.style.right = '0'
  document.body.style.width = '100%'
}

const unlockPage = () => {
  if (!locked) return
  locked = false
  document.body.style.position = ''
  document.body.style.top = ''
  document.body.style.left = ''
  document.body.style.right = ''
  document.body.style.width = ''
  window.scrollTo(0, scrollTop)
  if (restoreFocus instanceof HTMLElement) restoreFocus.focus?.({ preventScroll: true })
  restoreFocus = null
}

const preloadNeighbors = () => {
  ;[index.value - 1, index.value + 1].forEach((position) => {
    const image = props.images[position]
    if (image?.src) {
      const preload = new Image()
      preload.src = image.src
    }
  })
}

const syncOpen = async (open) => {
  pointers = new Map()
  gesture = null
  dragging.value = false
  if (open) {
    index.value = clamp(Number(props.startIndex) || 0, 0, Math.max(0, props.images.length - 1))
    resetView()
    loading.value = true
    failed.value = false
    lockPage()
    await nextTick()
    closeRef.value?.focus({ preventScroll: true })
    if (imageRef.value?.complete && imageRef.value.naturalWidth) handleImageLoad()
    preloadNeighbors()
  } else {
    unlockPage()
  }
}

watch(() => props.open, syncOpen, { immediate: true })

watch(index, async () => {
  resetView()
  failed.value = false
  loading.value = true
  await nextTick()
  preloadNeighbors()
  if (imageRef.value?.complete && imageRef.value.naturalWidth) handleImageLoad()
})

const handleResize = () => {
  if (scale.value <= 1.01) return
  const clamped = clampOffset(offset, { ...geometry(), scale: scale.value })
  offset.x = clamped.x
  offset.y = clamped.y
}
window.addEventListener('resize', handleResize)

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (props.open) unlockPage()
})
</script>

<style scoped>
.image-lightbox {
  position: fixed;
  inset: 0;
  z-index: var(--z-overlay, 1000);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: rgb(28 23 18 / 52%);
  backdrop-filter: blur(7px) saturate(0.92);
  overscroll-behavior: contain;
  animation: lightbox-fade 0.18s ease both;
}

.image-lightbox__stage {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  touch-action: none;
  user-select: none;
}

.image-lightbox.is-zoomed .image-lightbox__stage { cursor: grab; }
.image-lightbox.is-dragging .image-lightbox__stage { cursor: grabbing; }

.image-lightbox__image {
  max-width: min(1120px, calc(100vw - 128px));
  max-height: calc(100dvh - 210px);
  width: auto;
  height: auto;
  border-radius: 10px;
  box-shadow: 0 30px 90px rgb(0 0 0 / 48%), 0 0 0 1px rgb(255 250 242 / 12%);
  /* 不要加 fill-mode: both，动画结束后会一直锁死 transform，缩放就“点了没反应” */
  animation: lightbox-pop 0.22s cubic-bezier(0.22, 0.7, 0.25, 1);
  transform-origin: center center;
  transition: transform 0.16s ease-out;
  -webkit-user-drag: none;
  will-change: transform;
}

.image-lightbox.is-dragging .image-lightbox__image { transition: none; }

.image-lightbox__status {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: rgb(255 250 242 / 78%);
  font-size: 13px;
  letter-spacing: 0.04em;
  pointer-events: none;
}

.image-lightbox__status p { margin: 0; }

.image-lightbox__retry {
  pointer-events: auto;
  padding: 7px 16px;
  border: 1px solid rgb(255 250 242 / 32%);
  border-radius: 999px;
  background: rgb(255 250 242 / 12%);
  color: #fffaf2;
  font: inherit;
  cursor: pointer;
}

.image-lightbox__topbar {
  position: absolute;
  inset: 18px 20px auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  pointer-events: none;
}

.image-lightbox__counter {
  padding: 7px 14px;
  border-radius: 999px;
  background: rgb(20 17 14 / 55%);
  border: 1px solid rgb(255 250 242 / 16%);
  color: rgb(255 250 242 / 88%);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.08em;
}

.image-lightbox__topbar > * { pointer-events: auto; }

.image-lightbox__topbar .image-lightbox__circle {
  background: rgb(20 17 14 / 55%);
  border-color: rgb(255 250 242 / 18%);
  font-size: 20px;
}

.image-lightbox__footer {
  position: absolute;
  left: 50%;
  bottom: 20px;
  display: flex;
  width: max-content;
  max-width: calc(100vw - 40px);
  transform: translateX(-50%);
  flex-direction: column;
  align-items: center;
  gap: 7px;
  padding: 10px 12px;
  border: 1px solid rgb(255 250 242 / 14%);
  border-radius: 18px;
  background: rgb(24 20 16 / 66%);
  backdrop-filter: blur(14px);
  pointer-events: none;
}

.image-lightbox__footer > * { pointer-events: auto; }

.image-lightbox__caption {
  max-width: min(760px, calc(100vw - 48px));
  margin: 0;
  overflow: hidden;
  color: rgb(255 250 242 / 86%);
  font-size: 12.5px;
  line-height: 1.5;
  text-align: center;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.image-lightbox__toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: 0;
  background: transparent;
}

.image-lightbox__circle,
.image-lightbox__pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 38px;
  min-width: 38px;
  padding: 0 12px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  color: rgb(255 250 242 / 86%);
  font: inherit;
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
  transition: background-color 0.18s ease, color 0.18s ease, opacity 0.18s ease;
}

.image-lightbox__pill { font-size: 12px; letter-spacing: 0.04em; }

.image-lightbox__circle:hover:not(:disabled),
.image-lightbox__pill:hover,
.image-lightbox__circle:focus-visible,
.image-lightbox__pill:focus-visible {
  background: rgb(255 250 242 / 14%);
  color: #fffaf2;
  outline: none;
}

.image-lightbox__circle:disabled {
  opacity: 0.28;
  cursor: default;
}

.image-lightbox__circle:focus-visible,
.image-lightbox__pill:focus-visible {
  border-color: rgb(255 250 242 / 55%);
}

@keyframes lightbox-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes lightbox-pop {
  from { opacity: 0; transform: scale(0.965); }
  to { opacity: 1; transform: scale(1); }
}

@media (max-width: 620px) {
  .image-lightbox__image {
    max-width: calc(100vw - 24px);
    max-height: calc(100dvh - 196px);
  }

  .image-lightbox__topbar { inset: 12px 12px auto; }
  .image-lightbox__footer { bottom: 12px; max-width: calc(100vw - 24px); gap: 7px; padding: 9px 10px; }
  .image-lightbox__toolbar { gap: 4px; padding: 5px; }
  .image-lightbox__circle { height: 36px; min-width: 36px; padding: 0 10px; }
}

@media (prefers-reduced-motion: reduce) {
  .image-lightbox { animation: none; }
  .image-lightbox__image { animation: none; transition: none; }
}
</style>
