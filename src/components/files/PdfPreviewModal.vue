<template>
  <a-modal
    :open="open"
    :title="file?.name || 'PDF 预览'"
    :footer="null"
    class="pdf-preview-modal"
    :width="'min(1120px, calc(100vw - 32px))'"
    @cancel="close"
  >
    <div class="pdf-preview">
      <div class="pdf-preview__toolbar" role="toolbar" aria-label="PDF 阅读工具">
        <a-space>
          <a-button size="small" :disabled="loading || pageNumber <= 1" @click="goToPage(pageNumber - 1)">上一页</a-button>
          <label class="pdf-preview__page-control">
            <span>第</span>
            <input v-model.number="pageInput" type="number" min="1" :max="pageCount" aria-label="页码" @change="commitPage" />
            <span>/ {{ pageCount || '-' }} 页</span>
          </label>
          <a-button size="small" :disabled="loading || pageNumber >= pageCount" @click="goToPage(pageNumber + 1)">下一页</a-button>
          <a-button size="small" :disabled="loading" @click="changeScale(-0.1)">缩小</a-button>
          <span class="pdf-preview__scale">{{ Math.round(scale * 100) }}%</span>
          <a-button size="small" :disabled="loading" @click="changeScale(0.1)">放大</a-button>
          <a-button size="small" :disabled="loading" @click="fitWidth">适应宽度</a-button>
        </a-space>
        <a-space>
          <a-button size="small" @click="$emit('download', file)">下载</a-button>
          <a-button size="small" @click="close">关闭</a-button>
        </a-space>
      </div>

      <div v-if="loading" class="pdf-preview__state" aria-live="polite">
        <span>{{ loadingLabel }}</span>
        <a-progress v-if="downloadProgress !== null" :percent="downloadProgress" size="small" />
        <a-progress v-else :percent="60" :show-info="false" size="small" status="active" />
      </div>
      <div v-else-if="errorMessage" class="pdf-preview__state pdf-preview__state--error" role="alert">
        {{ errorMessage }}
      </div>
      <div v-else class="pdf-preview__stage" ref="stageRef">
        <div class="pdf-preview__page" :style="pageStyle">
          <canvas ref="canvasRef" aria-label="PDF 页面"></canvas>
          <div class="pdf-preview__text-layer" aria-label="PDF 文本层">
            <span
              v-for="(item, index) in textItems"
              :key="index"
              class="pdf-preview__text-item"
              :style="item.style"
            >{{ item.text }}</span>
          </div>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup>
import { computed, markRaw, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { previewPdf } from '@/api/file'

const props = defineProps({
  open: { type: Boolean, default: false },
  file: { type: Object, default: null }
})

const emit = defineEmits(['update:open', 'download'])

const canvasRef = ref(null)
const stageRef = ref(null)
const pdfDocument = ref(null)
const pageNumber = ref(1)
const pageInput = ref(1)
const pageCount = ref(0)
const scale = ref(1)
const pageSize = ref({ width: 0, height: 0 })
const textItems = ref([])
const loading = ref(false)
const loadingLabel = ref('正在读取 PDF')
const errorMessage = ref('')
const downloadProgress = ref(null)
let abortController
let renderTask
let pdfjsLib
let requestId = 0

const pageStyle = computed(() => ({
  width: `${pageSize.value.width}px`,
  height: `${pageSize.value.height}px`
}))

const close = () => {
  abortController?.abort()
  abortController = undefined
  emit('update:open', false)
}

const clearDocument = async () => {
  renderTask?.cancel()
  renderTask = undefined
  if (pdfDocument.value) {
    await pdfDocument.value.destroy()
    pdfDocument.value = null
  }
  textItems.value = []
  pageCount.value = 0
  pageNumber.value = 1
  pageInput.value = 1
  pageSize.value = { width: 0, height: 0 }
}

const loadPdfEngine = async () => {
  if (pdfjsLib) return pdfjsLib
  pdfjsLib = await import('pdfjs-dist/build/pdf.mjs')
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/assets/pdf.worker.mjs'
  return pdfjsLib
}

const renderPage = async () => {
  if (!pdfDocument.value || !canvasRef.value) return
  renderTask?.cancel()
  const page = await pdfDocument.value.getPage(pageNumber.value)
  const viewport = page.getViewport({ scale: scale.value })
  const ratio = Math.min(window.devicePixelRatio || 1, 1.5)
  const canvas = canvasRef.value
  canvas.width = Math.ceil(viewport.width * ratio)
  canvas.height = Math.ceil(viewport.height * ratio)
  canvas.style.width = `${viewport.width}px`
  canvas.style.height = `${viewport.height}px`
  pageSize.value = { width: viewport.width, height: viewport.height }
  renderTask = page.render({
    canvasContext: canvas.getContext('2d'),
    viewport,
    transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0]
  })
  await renderTask.promise

  const content = await page.getTextContent()
  textItems.value = content.items.map((item) => {
    const transform = pdfjsLib.Util.transform(viewport.transform, item.transform)
    const fontSize = Math.max(8, Math.abs(transform[3]))
    return {
      text: item.str,
      style: {
        left: `${transform[4]}px`,
        top: `${transform[5] - fontSize}px`,
        fontSize: `${fontSize}px`,
        transform: `scaleX(${Math.max(.4, Math.abs(transform[0]) / fontSize)})`
      }
    }
  })
}

const renderWhenReady = async (attempt = 0) => {
  await nextTick()
  if (!canvasRef.value && attempt < 6) {
    await new Promise((resolve) => window.setTimeout(resolve, 30))
    return renderWhenReady(attempt + 1)
  }
  await renderPage()
}

const loadPdf = async () => {
  if (!props.open || !props.file?.id) return
  const currentRequest = ++requestId
  abortController?.abort()
  abortController = new AbortController()
  loading.value = true
  loadingLabel.value = '正在读取 PDF'
  errorMessage.value = ''
  downloadProgress.value = null
  await clearDocument()
  try {
    const data = await previewPdf(props.file.id, {
      signal: abortController.signal,
      onDownloadProgress: ({ loaded, total }) => {
        if (total) downloadProgress.value = Math.min(100, Math.round((loaded / total) * 100))
      }
    })
    if (currentRequest !== requestId || !props.open) return
    loadingLabel.value = '正在解析 PDF'
    const engine = await loadPdfEngine()
    pdfDocument.value = markRaw(await engine.getDocument({
      data: new Uint8Array(data),
      isEvalSupported: false,
      disableAutoFetch: true
    }).promise)
    pageCount.value = pdfDocument.value.numPages
    pageNumber.value = 1
    pageInput.value = 1
    loading.value = false
    await renderWhenReady()
  } catch (error) {
    if (error?.name === 'AbortError' || error?.code === 'ERR_CANCELED' || currentRequest !== requestId) return
    errorMessage.value = error?.message || 'PDF 预览失败，请下载后查看'
  } finally {
    if (currentRequest === requestId) loading.value = false
  }
}

const goToPage = async (nextPage) => {
  const target = Math.max(1, Math.min(pageCount.value, Number(nextPage) || 1))
  pageNumber.value = target
  pageInput.value = target
  await nextTick()
  await renderPage()
}

const commitPage = () => goToPage(pageInput.value)

const changeScale = async (delta) => {
  scale.value = Math.max(.5, Math.min(2, Number((scale.value + delta).toFixed(2))))
  await nextTick()
  await renderPage()
}

const fitWidth = async () => {
  if (!stageRef.value || !pdfDocument.value) return
  const page = await pdfDocument.value.getPage(pageNumber.value)
  const viewport = page.getViewport({ scale: 1 })
  const available = Math.max(240, stageRef.value.clientWidth - 32)
  scale.value = Math.min(2, Math.max(.5, available / viewport.width))
  await nextTick()
  await renderPage()
}

watch(() => [props.open, props.file?.id], loadPdf, { immediate: true })

onBeforeUnmount(async () => {
  requestId += 1
  abortController?.abort()
  await clearDocument()
})
</script>

<style scoped>
.pdf-preview { display: grid; gap: 12px; }
.pdf-preview__toolbar { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding-bottom: 10px; border-bottom: 1px solid var(--color-border, #e5e7eb); }
.pdf-preview__page-control { display: inline-flex; align-items: center; gap: 4px; color: var(--color-text-secondary, #64748b); font-size: 12px; }
.pdf-preview__page-control input { width: 44px; padding: 3px 5px; border: 1px solid var(--color-border, #d9e1ed); border-radius: 6px; text-align: center; }
.pdf-preview__scale { min-width: 42px; color: var(--color-text-secondary, #64748b); text-align: center; font-size: 12px; }
.pdf-preview__state { display: grid; gap: 12px; place-items: center; min-height: 280px; color: var(--color-text-secondary, #64748b); }
.pdf-preview__state--error { color: #dc2626; }
.pdf-preview__stage { overflow: auto; max-height: calc(85vh - 120px); padding: 16px; background: #eef2f7; text-align: center; }
.pdf-preview__page { position: relative; display: inline-block; background: white; box-shadow: 0 8px 24px rgb(15 23 42 / 10%); text-align: left; }
.pdf-preview__page canvas { display: block; }
.pdf-preview__text-layer { position: absolute; inset: 0; overflow: hidden; color: transparent; user-select: text; }
.pdf-preview__text-item { position: absolute; display: block; width: max-content; line-height: 1; white-space: pre; transform-origin: left top; }
@media (max-width: 640px) {
  .pdf-preview__toolbar { width: 100%; align-items: flex-start; overflow: hidden; }
  .pdf-preview__toolbar > :first-child { flex: 1 1 100%; min-width: 0; }
  .pdf-preview__toolbar > :first-child :deep(.ant-space) { display: flex; flex-wrap: wrap; min-width: 0; }
  .pdf-preview__toolbar > :last-child { width: 100%; justify-content: flex-end; }
  .pdf-preview__stage { max-width: 100%; max-height: calc(100vh - 180px); margin: 0; padding: 10px; }
}
</style>
