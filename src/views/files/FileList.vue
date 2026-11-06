<template>
  <div class="file-list admin-page">
    <PageHeader compact :title="t('shell.menu.files')" :subtitle="t('fileMgr.subtitle')">
      <template #actions>
        <a-space>
          <a-button @click="openTutorial">
            <QuestionCircleOutlined /> {{ t('fileMgr.tutorial') }}
          </a-button>
          <a-upload
            :customRequest="handleCustomUpload"
            :showUploadList="false"
            :beforeUpload="beforeUpload"
          >
            <a-button type="primary">
              <UploadOutlined /> {{ t('fileMgr.uploadFile') }}
            </a-button>
          </a-upload>
        </a-space>
      </template>
    </PageHeader>

    <section class="storage-brief" :aria-label="t('fileMgr.storageAria')">
      <div class="storage-brief__copy">
        <span class="storage-eyebrow"><CloudServerOutlined /> {{ t('fileMgr.storageEyebrow') }}</span>
        <strong>{{ backendSummary.label }}</strong>
        <p>{{ backendSummary.description }}</p>
      </div>
      <dl class="storage-metrics">
        <div>
          <dt>{{ t('fileMgr.currentResult') }}</dt>
          <dd>{{ total }}</dd>
        </div>
        <div>
          <dt>{{ t('fileMgr.hosted') }}</dt>
          <dd>{{ formatFileSize(totalBytes) }}</dd>
        </div>
      </dl>
      <button
        v-if="tutorialHintVisible"
        type="button"
        class="tutorial-hint"
        @click="openTutorial"
      >
        {{ t('fileMgr.firstTimeHint') }}
      </button>
    </section>

    <section class="upload-zone" :aria-label="t('fileMgr.uploadFile')">
      <a-upload-dragger
        :customRequest="handleCustomUpload"
        :showUploadList="false"
        :beforeUpload="beforeUpload"
        :multiple="false"
      >
        <div class="upload-zone__inner">
          <span class="upload-zone__icon"><UploadOutlined /></span>
          <div>
            <strong>{{ t('fileMgr.dropHere') }}</strong>
            <p>{{ t('fileMgr.dropHint') }}</p>
          </div>
        </div>
      </a-upload-dragger>
      <div v-if="uploadStage !== 'idle'" class="upload-progress" :class="`upload-progress--${uploadStage}`" aria-live="polite">
        <div>
          <span>{{ uploadStageLabel }}</span>
          <strong :title="uploadStatusName">{{ uploadStatusName }}</strong>
        </div>
        <a-progress
          :percent="uploadProgress"
          :status="uploadStage === 'error' ? 'exception' : uploadStage === 'success' ? 'success' : 'active'"
          :show-info="uploadStage !== 'processing'"
          size="small"
        />
        <small v-if="uploadDetails.lengthComputable && uploadStage === 'uploading'">
          {{ t('fileMgr.sentProgress', { loaded: formatFileSize(uploadDetails.loaded), total: formatFileSize(uploadDetails.total) }) }}
        </small>
        <small v-else-if="uploadStage === 'processing'">{{ t('fileMgr.processingServer') }}</small>
        <small v-else-if="uploadStage === 'error'">{{ uploadErrorMessage }}</small>
        <a-button v-if="uploadRefreshFailed" type="link" size="small" @click="retryUploadRefresh">
          {{ t('fileMgr.refreshList') }}
        </a-button>
      </div>
    </section>

    <!-- 搜索表单 -->
    <a-form layout="inline" class="search-form admin-filter">
      <div class="search-form-left">
        <a-form-item :label="t('fileMgr.column.name')">
          <a-input v-model:value="searchForm.name" :placeholder="t('fileMgr.namePlaceholder')" allowClear />
        </a-form-item>
        <a-form-item :label="t('fileMgr.column.type')">
          <a-select
            v-model:value="searchForm.type"
            :placeholder="t('dynamicMgr.statusPlaceholder')"
            allowClear
          >
            <a-select-option value="image">{{ t('fileMgr.type.image') }}</a-select-option>
            <a-select-option value="audio">{{ t('fileMgr.type.audio') }}</a-select-option>
            <a-select-option value="video">{{ t('fileMgr.type.video') }}</a-select-option>
            <a-select-option value="document">{{ t('fileMgr.type.document') }}</a-select-option>
            <a-select-option value="other">{{ t('fileMgr.type.other') }}</a-select-option>
          </a-select>
        </a-form-item>
      </div>
      <div class="search-form-right">
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="handleSearch">
              <SearchOutlined />
              {{ t('component.search') }}
            </a-button>
            <a-button @click="resetSearch">
              <ReloadOutlined />
              {{ t('component.reset') }}
            </a-button>
          </a-space>
        </a-form-item>
      </div>
    </a-form>

    <!-- 操作按钮 -->
    <div v-if="selectedRowKeys.length" class="table-operations admin-toolbar">
      <a-space>
        <a-button
          danger
          :loading="batchDeleting"
          :disabled="!selectedRowKeys.length || batchDeleting"
          @click="handleBatchDelete"
        >
          <DeleteOutlined />
          {{ t('adminShared.batchDelete') }}
        </a-button>
      </a-space>
    </div>

    <AsyncState
      v-if="loading || (!fileList.length && (errorMessage || !loading))"
      data-testid="file-async-state"
      :loading="loading"
      :error="errorMessage"
      :empty="!loading && !errorMessage"
      :empty-title="t('fileMgr.name')"
      :empty-description="t('fileMgr.dropHere')"
      @retry="fetchFiles"
    />

    <div v-if="errorMessage && fileList.length" class="file-list-refresh-error" role="alert">
      <span>{{ errorMessage }}, {{ t('fileMgr.refreshFailed') }}</span>
      <a-button type="link" size="small" @click="fetchFiles">{{ t('fileMgr.refreshList') }}</a-button>
    </div>

    <a-card v-else class="data-card admin-table-card">
      <a-table
        :loading="loading"
        :columns="resizableColumns"
        :data-source="fileList"
        :pagination="paginationConfig"
        :scroll="{ x: 'max-content' }"
        row-key="id"
        bordered
        :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
        @resizeColumn="handleResizeColumn"
      >
        <template #bodyCell="{ column, record }">
          <!-- 预览列 -->
          <template v-if="column.dataIndex === 'preview'">
            <template v-if="record.type === 'image'">
              <!-- 加载失败过一次就不再挂 a-image：避免反复请求，也避免点开一个必然失败的预览弹窗 -->
              <div v-if="isImageUnavailable(record)" class="image-preview-container preview-frame--stable is-unavailable" :title="unavailableImageHint">
                <PictureOutlined />
                <span>{{ t('fileMgr.previewUnavailable') }}</span>
              </div>
              <div v-else class="image-preview-container preview-frame--stable">
                <a-image
                  :src="record.url"
                  :alt="t('fileMgr.previewAlt', { name: record.name })"
                  :width="60"
                  :height="60"
                  fit="cover"
                  :preview="{
                    src: record.url,
                    mask: true,
                    onError: (e) => handlePreviewError(e, record)
                  }"
                  @error="(e) => handleImageError(e, record)"
                >
                  <template #preview-mask>
                    <div class="preview-mask-text">{{ t('fileMgr.previewMask') }}</div>
                  </template>
                  <template #placeholder>
                    <div class="image-placeholder">
                      <LoadingOutlined />
                    </div>
                  </template>
                </a-image>
              </div>
            </template>
            <template v-else-if="record.type === 'audio'">
              <a-button type="link" size="small" @click="previewMedia('audio', record.url)">
                <SoundOutlined /> {{ t('fileMgr.type.audio') }}
              </a-button>
            </template>
            <template v-else-if="record.type === 'video'">
              <a-button type="link" size="small" @click="previewMedia('video', record.url)">
                <VideoCameraOutlined /> {{ t('fileMgr.type.video') }}
              </a-button>
            </template>
            <template v-else-if="isPdfFile(record)">
              <a-button type="link" size="small" @click="previewPdfFile(record)">
                <FileTextOutlined /> {{ t('fileMgr.previewMask') }}
              </a-button>
            </template>
            <template v-else>
              <a-button type="link" size="small" @click="handleDownload(record)">
                <DownloadOutlined /> {{ t('attachment.download') }}
              </a-button>
            </template>
          </template>

          <!-- 类型列 -->
          <template v-if="column.dataIndex === 'type'">
            <a-tag :color="getTypeColor(record.type)">
              {{ getTypeName(record.type) }}
            </a-tag>
          </template>

          <!-- 大小列 -->
          <template v-if="column.dataIndex === 'size'">
            {{ formatFileSize(record.size) }}
          </template>

          <!-- 上传时间列 -->
          <template v-if="column.dataIndex === 'createdAt'">
            {{ formatDate(record.createdAt) }}
          </template>

          <!-- 操作列 -->
          <template v-if="column.dataIndex === 'action'">
            <a-space class="table-row-actions">
              <a-button type="text" size="small" class="row-action row-action--primary" @click="handleDownload(record)">
                <DownloadOutlined />
                {{ t('adminShared.delete') }}
              </a-button>
              <a-button type="text" size="small" class="row-action" @click="copyFileUrl(record.url)">
                <CopyOutlined />
                {{ t('fileMgr.copyLink') }}
              </a-button>
              <a-popconfirm
                :title="t('fileMgr.deleteConfirm')"
                :ok-text="t('adminShared.confirm')"
                :cancel-text="t('adminShared.cancel')"
                @confirm="handleDelete(record.id)"
              >
                <a-button
                  type="text"
                  danger
                  size="small"
                  class="row-action row-action--danger"
                  :loading="isDeleting(record.id)"
                  :disabled="isDeleting(record.id)"
                >
                  <DeleteOutlined />
                  {{ t('adminShared.delete') }}
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <section v-if="fileList.length" class="file-mobile-grid" :aria-label="t('fileMgr.mobileList')">
      <article v-for="record in fileList" :key="record.id" class="file-mobile-row">
        <div class="file-mobile-row__identity">
          <span class="file-kind"><FileTextOutlined /></span>
          <div>
            <strong>{{ record.name }}</strong>
            <span>{{ getTypeName(record.type) }} · {{ formatFileSize(record.size) }}</span>
          </div>
        </div>
        <div class="file-mobile-row__actions">
          <a-button v-if="isPdfFile(record)" type="text" size="small" @click="previewPdfFile(record)">{{ t('fileMgr.previewMask') }}</a-button>
          <a-button type="text" size="small" @click="handleDownload(record)">{{ t('attachment.download') }}</a-button>
          <a-button type="text" size="small" @click="copyFileUrl(record.url)">{{ t('fileMgr.copyLink') }}</a-button>
          <a-popconfirm
            :title="t('fileMgr.deleteConfirm')"
            :ok-text="t('adminShared.confirm')"
            :cancel-text="t('adminShared.cancel')"
            @confirm="handleDelete(record.id)"
          >
            <a-button type="text" danger size="small">{{ t('adminShared.delete') }}</a-button>
          </a-popconfirm>
        </div>
      </article>

      <!-- 窄屏表格是隐藏的，分页器挂在表格上等于不存在：这里补一个，否则手机上只能看到第一页 -->
      <a-pagination
        class="file-mobile-pagination"
        :current="currentPage"
        :page-size="pageSize"
        :total="total"
        :show-size-changer="false"
        simple
        :show-total="(count) => t('adminShared.totalItems', { n: count })"
        @change="handleFileMobilePageChange"
      />
    </section>

    <!-- 媒体预览对话框 -->
    <a-modal
      v-model:open="previewVisible"
      :title="previewTitle"
      :footer="null"
      width="800px"
      @cancel="handlePreviewClose"
    >
      <div class="media-preview-container media-preview-container--stable">
        <audio
          v-if="previewType === 'audio'"
          :src="previewUrl"
          controls
          class="media-player media-player--audio"
          ref="audioPlayer"
          @error="handleMediaError"
        ></audio>
        <video
          v-if="previewType === 'video'"
          :src="previewUrl"
          controls
          class="media-player media-player--video"
          ref="videoPlayer"
          @error="handleMediaError"
        ></video>
      </div>
    </a-modal>

    <PdfPreviewModal
      v-model:open="pdfPreviewVisible"
      :file="pdfPreviewFile"
      @download="handleDownload"
    />

    <FileTutorialDrawer v-model:open="tutorialOpen" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'
import {
  UploadOutlined,
  SearchOutlined,
  ReloadOutlined,
  DeleteOutlined,
  SoundOutlined,
  VideoCameraOutlined,
  CopyOutlined,
  DownloadOutlined,
  LoadingOutlined,
  QuestionCircleOutlined,
  CloudServerOutlined,
  FileTextOutlined,
  PictureOutlined
} from '@ant-design/icons-vue'
import { uploadFile, getFileList, getFileSummary, searchFiles, deleteFile, downloadFile } from '@/api/file'
import { buildApiUrl } from '@/utils/apiBaseUrl'
import PageHeader from '@/components/common/PageHeader.vue'
import AsyncState from '@/components/common/AsyncState.vue'
import FileTutorialDrawer from './FileTutorialDrawer.vue'
import PdfPreviewModal from '@/components/files/PdfPreviewModal.vue'
import { useResizableColumns } from '@/composables/useResizableColumns'
import { t, currentLocale } from '@/i18n'

const loading = ref(false)
const errorMessage = ref('')
const fileList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const selectedRowKeys = ref([])
const deletingIds = reactive(new Set())
const batchDeleting = ref(false)
const uploadProgress = ref(0)
const uploadingName = ref('')
const uploadStatusName = ref('')
const uploadStage = ref('idle')
const uploadDetails = ref({ loaded: 0, total: null, lengthComputable: false })
const uploadErrorMessage = ref('')
const uploadRefreshFailed = ref(false)
let uploadStatusTimer
const tutorialOpen = ref(false)
const tutorialHintVisible = ref(false)
let requestGeneration = 0

// 搜索表单
const searchForm = ref({
  name: '',
  type: undefined
})

// 预览相关
const previewVisible = ref(false)
const previewUrl = ref('')
const previewTitle = ref('')
const previewType = ref('')

// 图片预览失败的文件：多为文件服务/存储接口异常，记下来避免反复请求与误导性提示
const unavailableImageIds = ref(new Set())
const unavailableImageHint = t('fileMgr.unavailableHint')

const isImageUnavailable = (record) => record?.id != null && unavailableImageIds.value.has(record.id)

const markImageUnavailable = (record) => {
  const id = record?.id
  if (id == null || unavailableImageIds.value.has(id)) return
  const next = new Set(unavailableImageIds.value)
  next.add(id)
  unavailableImageIds.value = next
}
const pdfPreviewVisible = ref(false)
const pdfPreviewFile = ref(null)

// 容量类指标必须来自后端聚合：对当页数据求和只能得到「本页大小」。
const totalBytes = ref(0)
const backendSummary = computed(() => {
  const xionCount = fileList.value.filter((file) => file.storageBackend === 'xion').length
  if (xionCount > 0) {
    return {
      label: t('fileMgr.xionHosting'),
      description: t('fileMgr.xionDesc', { n: xionCount })
    }
  }
  return {
    label: t('fileMgr.localCompat'),
    description: t('fileMgr.localCompatDesc'),
  }
})

const uploadStageLabel = computed(() => {
  if (uploadStage.value === 'processing') return t('fileMgr.stage.processing')
  if (uploadStage.value === 'success') return t('adminShared.uploadSuccess')
  if (uploadStage.value === 'error') return t('adminShared.uploadFailed')
  return t('fileMgr.stage.uploading')
})

// 表格列定义
const columns = [
  {
    title: t('fileMgr.column.preview'),
    dataIndex: 'preview',
    key: 'preview',
    width: 100,
    align: 'center'
  },
  {
    title: t('fileMgr.column.name'),
    dataIndex: 'name',
    key: 'name',
    width: 200
  },
  {
    title: t('fileMgr.column.type'),
    dataIndex: 'type',
    key: 'type',
    width: 100,
    align: 'center',
    filters: [
      { text: t('fileMgr.type.image'), value: 'image' },
      { text: t('fileMgr.type.audio'), value: 'audio' },
      { text: t('fileMgr.type.video'), value: 'video' },
      { text: t('fileMgr.type.document'), value: 'document' },
      { text: t('fileMgr.type.other'), value: 'other' }
    ],
    onFilter: (value, record) => record.type === value
  },
  {
    title: t('fileMgr.column.size'),
    dataIndex: 'size',
    key: 'size',
    width: 100,
    align: 'center',
    sorter: (a, b) => a.size - b.size
  },
  {
    title: t('fileMgr.column.uploader'),
    dataIndex: 'uploader',
    key: 'uploader',
    width: 120,
    align: 'center',
    customRender: ({ text }) => text?.nickname || text?.username || '-'
  },
  {
    title: t('fileMgr.column.downloads'),
    dataIndex: 'downloadCount',
    key: 'downloadCount',
    width: 100,
    align: 'center',
    sorter: (a, b) => a.downloadCount - b.downloadCount
  },
  {
    title: t('fileMgr.column.uploadedAt'),
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 160,
    align: 'center',
    sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  },
  {
    title: t('adminShared.actions'),
    dataIndex: 'action',
    key: 'action',
    width: 200,
    fixed: 'right',
    align: 'center'
  }
]

const { columns: resizableColumns, handleResizeColumn } = useResizableColumns('files', columns)

// 分页配置
const paginationConfig = computed(() => ({
  current: currentPage.value,
  pageSize: pageSize.value,
  total: total.value,
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '50', '100'],
  showQuickJumper: true,
  showTotal: (total) => t('adminShared.totalItems', { n: total }),
  onChange: (page, size) => {
    currentPage.value = page
    if (size) pageSize.value = size
    fetchFiles()
  },
  onShowSizeChange: (_current, size) => {
    pageSize.value = size
    currentPage.value = 1
  }
}))

// 移动端分页：只改页码再重新取数（每页条数沿用桌面端设置）
const handleFileMobilePageChange = (page) => {
  currentPage.value = page
  fetchFiles()
}

const normalizeFileForView = (item) => {
  const url = buildApiUrl(item.url)

  return {
    ...item,
    id: item.id,
    name: item.name,
    type: item.type,
    size: item.size,
    url,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    downloadCount: item.download_count,
    isPublic: item.is_public,
    description: item.description,
    category: item.category,
    tags: item.tags,
    uploader: item.uploader,
    storageBackend: item.storage_backend || 'local',
    checksum: item.checksum,
    contentType: item.content_type
  }
}

// 获取文件列表
const fetchFiles = async (allowPageReset = true) => {
  const generation = ++requestGeneration
  try {
    loading.value = true
    errorMessage.value = ''
    const hasFilters = Boolean(searchForm.value.name || searchForm.value.type)
    const response = hasFilters
      ? await searchFiles({
          q: searchForm.value.name,
          type: searchForm.value.type,
          page: currentPage.value,
          pageSize: pageSize.value
        })
      : await getFileList({
          page: currentPage.value,
          pageSize: pageSize.value
        })
    if (generation !== requestGeneration) return
    if (allowPageReset && currentPage.value > 1 && response.results.length === 0) {
      currentPage.value = 1
      return fetchFiles(false)
    }
    fileList.value = response.results.map(normalizeFileForView)
    total.value = response.count

    // 汇总只影响概况区的数字，失败时不能影响列表本身。
    try {
      const summary = await getFileSummary({
        q: hasFilters ? searchForm.value.name : '',
        type: searchForm.value.type
      })
      if (generation !== requestGeneration) return
      total.value = summary.total
      totalBytes.value = summary.totalBytes
    } catch (summaryError) {
      if (generation !== requestGeneration) return
      console.warn('获取文件汇总异常:', summaryError)
      totalBytes.value = 0
    }
  } catch (error) {
    if (generation !== requestGeneration) return
    console.error('获取文件列表异常:', error)
    errorMessage.value = error.message || t('fileMgr.loadFailed')
    if (!fileList.value.length) {
      fileList.value = []
      total.value = 0
    }
    message.error(error.message || t('fileMgr.loadFailed'))
    return false
  } finally {
    if (generation === requestGeneration) loading.value = false
  }
  return true
}

// 处理搜索
const handleSearch = async () => {
  currentPage.value = 1
  return fetchFiles()
}

// 重置搜索
const resetSearch = () => {
  searchForm.value = {
    name: '',
    type: undefined
  }
  currentPage.value = 1
  fetchFiles()
}

// 选择变化
const onSelectChange = (keys) => {
  selectedRowKeys.value = keys
}

// 处理批量删除
const handleBatchDelete = async () => {
  if (batchDeleting.value || !selectedRowKeys.value.length) {
    if (batchDeleting.value) return
    message.warning(t('adminShared.selectToDelete', { item: t('fileMgr.name') }))
    return
  }

  batchDeleting.value = true
  const selectedIds = [...selectedRowKeys.value]
  const ids = selectedIds.filter((id) => !deletingIds.has(id))
  if (!ids.length) {
    batchDeleting.value = false
    return
  }
  ids.forEach((id) => deletingIds.add(id))
  try {
    const results = await Promise.allSettled(ids.map((id) => deleteFile(id)))
    const failedIds = results.reduce((failed, result, index) => {
      if (result.status === 'rejected') failed.push(ids[index])
      return failed
    }, [])
    const skippedIds = selectedIds.filter((id) => !ids.includes(id))
    selectedRowKeys.value = [...skippedIds, ...failedIds]
    if (failedIds.length) message.warning(t('adminShared.batchPartialFailed', { n: failedIds.length, item: t('fileMgr.name') }))
    else message.success(t('adminShared.batchDeleteSuccess'))
    await fetchFiles()
  } catch (error) {
    console.error('批量删除失败:', error)
    message.error(t('adminShared.batchDeleteFailed'))
  } finally {
    ids.forEach((id) => deletingIds.delete(id))
    batchDeleting.value = false
  }
}

// 处理单个删除
const handleDelete = async (id) => {
  if (deletingIds.has(id)) return
  deletingIds.add(id)
  try {
    await deleteFile(id)
    message.success(t('adminShared.deleteSuccess'))
    await fetchFiles()
  } catch (error) {
    console.error('删除文件失败:', error)
    message.error(error.message || t('adminShared.deleteFailed'))
  } finally {
    deletingIds.delete(id)
  }
}

const isDeleting = (id) => deletingIds.has(id)

const MAX_UPLOAD_BYTES = 1024 * 1024 * 1024
const documentExtensions = new Set(['pdf', 'doc', 'docx', 'xls', 'xlsx'])

const inferFileType = (file) => {
  const mimeType = String(file?.type || '').toLowerCase()
  const extension = String(file?.name || '').split('.').pop()?.toLowerCase()
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType === 'application/pdf' || documentExtensions.has(extension)) return 'document'
  return 'other'
}

// 上传前检查
const beforeUpload = (file) => {
  if (file.size > MAX_UPLOAD_BYTES) {
    message.error(t('fileMgr.tooLarge1GB'))
    return false
  }
  return true
}

// 处理自定义上传
const handleCustomUpload = async ({ file, onSuccess, onError }) => {
  if (uploadStage.value === 'uploading' || uploadStage.value === 'processing') {
    const error = new Error(t('fileMgr.uploadInProgress'))
    onError?.(error)
    return
  }
  clearUploadStatusTimer()
  uploadingName.value = file.name
  uploadStatusName.value = file.name
  uploadStage.value = 'uploading'
  uploadErrorMessage.value = ''
  uploadRefreshFailed.value = false
  uploadProgress.value = 0
  uploadDetails.value = { loaded: 0, total: null, lengthComputable: false }
  try {
    const result = await uploadFile({
      file,
      file_type: inferFileType(file),
      onProgress: (percent) => {
        uploadProgress.value = Number.isFinite(percent) ? Math.min(99, percent) : 0
        uploadStage.value = 'uploading'
      },
      onProgressDetails: (details = {}) => {
        uploadDetails.value = details
        if (details.lengthComputable && details.loaded >= details.total) {
          uploadProgress.value = 100
          uploadStage.value = 'processing'
        }
      }
    })
    
    if (result && typeof result === 'object') {
      uploadProgress.value = 100
      uploadStage.value = 'success'
      message.success(t('adminShared.uploadSuccess'))
      onSuccess?.(result)
      currentPage.value = 1
      const refreshed = await fetchFiles()
      uploadRefreshFailed.value = refreshed === false
      if (uploadRefreshFailed.value) message.warning(t('fileMgr.refreshFailed'))
    } else {
      const error = new Error(t('adminShared.uploadFailed'))
      uploadStage.value = 'error'
      uploadErrorMessage.value = error.message
      message.error(error.message)
      onError?.(error)
    }
  } catch (error) {
    console.error('上传失败:', error)
    uploadStage.value = 'error'
    uploadErrorMessage.value = error.message || t('adminShared.uploadFailed')
    message.error(error.message || t('adminShared.uploadFailed'))
    onError?.(error)
  } finally {
    uploadingName.value = ''
    if (uploadStage.value === 'success') {
      uploadStatusTimer = window.setTimeout(() => {
        uploadStage.value = 'idle'
        uploadStatusName.value = ''
        uploadRefreshFailed.value = false
      }, 3000)
    }
  }
}

const retryUploadRefresh = async () => {
  uploadRefreshFailed.value = false
  const refreshed = await fetchFiles()
  uploadRefreshFailed.value = refreshed === false
}

function clearUploadStatusTimer() {
  if (uploadStatusTimer) {
    window.clearTimeout(uploadStatusTimer)
    uploadStatusTimer = undefined
  }
}

const openTutorial = () => {
  tutorialOpen.value = true
  tutorialHintVisible.value = false
  try {
    window.localStorage.setItem('file-tutorial-seen', 'true')
  } catch {
    // Storage access can be disabled without blocking the tutorial.
  }
}

// 处理预览错误
const handlePreviewError = (e, record) => {
  console.error('预览加载失败:', e, record.id)
  markImageUnavailable(record)
  message.error(unavailableImageHint)
}

// 处理媒体文件错误
const handleMediaError = (e) => {
  console.error('媒体文件加载失败:', e)
  message.error(t('fileMgr.mediaLoadFailed'));
}

// 修改预览媒体文件函数
const previewMedia = (type, url) => {
  const fullUrl = buildApiUrl(url)
  
  // 验证URL
  if (!fullUrl) {
    message.error(t('fileMgr.invalidUrl'));
    return;
  }
  
  previewType.value = type;
  previewUrl.value = fullUrl;
  previewTitle.value = type === 'audio' ? t('fileMgr.audioPreview') : t('fileMgr.videoPreview');
  previewVisible.value = true;
}

const isPdfFile = (file) => {
  const contentType = String(file?.contentType || '').toLowerCase().split(';', 1)[0]
  return contentType === 'application/pdf' || (file?.type === 'document' && /\.pdf$/i.test(file?.name || ''))
}

const previewPdfFile = async (file) => {
  pdfPreviewFile.value = file
  pdfPreviewVisible.value = true
}

// 复制文件链接
const copyFileUrl = async (url) => {
  if (!url) {
    message.error(t('fileMgr.invalidLink'));
    return;
  }

  const clipboard = typeof navigator !== 'undefined' ? navigator.clipboard : undefined
  if (!clipboard || typeof clipboard.writeText !== 'function') {
    message.error(t('fileMgr.copyFailed'))
    return
  }

  try {
    const resolvedUrl = buildApiUrl(url)
    const publicUrl = typeof window !== 'undefined' && resolvedUrl && !/^https?:\/\//i.test(resolvedUrl)
      ? new URL(resolvedUrl, window.location.origin).toString()
      : resolvedUrl
    await clipboard.writeText(publicUrl)
    message.success(t('fileMgr.copySuccess'));
  } catch {
    message.error(t('fileMgr.copyFailed'));
  }
}

// 获取类型名称
const getTypeName = (type) => {
  const typeMap = {
    image: t('fileMgr.type.image'),
    audio: t('fileMgr.type.audio'),
    video: t('fileMgr.type.video'),
    document: t('fileMgr.type.document'),
    other: t('fileMgr.type.other')
  }
  return typeMap[type] || type
}

// 获取类型颜色
const getTypeColor = (type) => {
  const colorMap = {
    image: 'geekblue',
    audio: 'geekblue',
    video: 'geekblue',
    document: 'geekblue'
  }
  return colorMap[type] || 'default'
}

// 格式化文件大小
const formatFileSize = (size) => {
  if (!size) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let index = 0
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024
    index++
  }
  return `${size.toFixed(2)} ${units[index]}`
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

// 处理文件{{ t('adminShared.delete') }}
const handleDownload = async (file) => {
  try {
    loading.value = true
    const blob = await downloadFile(file.id)
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    message.success(t('fileMgr.downloadSuccess'))
  } catch (error) {
    console.error('下载文件失败:', error)
    message.error(t('fileMgr.downloadFailed'))
  } finally {
    loading.value = false
  }
}

// 在 script setup 部分添加
const audioPlayer = ref(null)
const videoPlayer = ref(null)

// 处理预览窗口关闭
const handlePreviewClose = () => {
  // 暂停视频播放
  if (videoPlayer.value) {
    videoPlayer.value.pause()
  }
  // 暂停音频播放
  if (audioPlayer.value) {
    audioPlayer.value.pause()
  }
  previewVisible.value = false
}

onUnmounted(() => clearUploadStatusTimer())

// 处理图片加载错误
const handleImageError = (e, record) => {
  // 记录失败，下一次渲染直接换成占位状态，避免无谓的重复加载
  markImageUnavailable(record)
  // 当前这张图仍然给一个中性占位，避免出现浏览器裂图
  if (e?.target) {
    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNFNUU1RTUiLz48dGV4dCB4PSIzMCIgeT0iMzAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlPC90ZXh0Pjwvc3ZnPg==';
  }
}

onMounted(() => {
  try {
    tutorialHintVisible.value = window.localStorage.getItem('file-tutorial-seen') !== 'true'
  } catch {
    tutorialHintVisible.value = true
  }
  fetchFiles()
})
</script>

<style scoped lang="scss">
.file-list-refresh-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border: 1px solid #f3c7c4;
  border-radius: var(--radius-sm);
  background: #fff8f7;
  color: #b42318;
  font-size: 13px;
}

.storage-brief {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) auto;
  gap: 18px 32px;
  align-items: center;
  padding: 22px 24px 24px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}

.storage-brief__copy {
  display: grid;
  gap: 5px;

  strong {
    color: var(--color-text);
    font-size: 18px;
    font-weight: 720;
    letter-spacing: -.015em;
  }

  p {
    max-width: 64ch;
    margin: 0;
    color: var(--color-text-secondary);
    line-height: 1.65;
  }
}

.storage-eyebrow {
  display: inline-flex;
  gap: 7px;
  align-items: center;
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 720;
  letter-spacing: .06em;
}

.storage-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(92px, 1fr));
  gap: 10px;
  margin: 0;

  div {
    min-width: 108px;
    padding: 11px 14px;
    border-left: 2px solid color-mix(in srgb, var(--color-primary) 45%, white);
    background: color-mix(in srgb, var(--color-page) 72%, white);
  }

  dt {
    color: var(--color-text-secondary);
    font-size: 11px;
  }

  dd {
    margin: 3px 0 0;
    color: var(--color-text);
    font-size: 17px;
    font-variant-numeric: tabular-nums;
    font-weight: 720;
  }
}

.tutorial-hint {
  grid-column: 1 / -1;
  justify-self: start;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-primary);
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 650;
  transition: transform .2s ease, color .2s ease;

  &:hover { transform: translateX(3px); }
  &:active { transform: translateX(3px) scale(.98); }
  &:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 4px; }
}

.upload-zone {
  display: grid;
  gap: 12px;
}

.upload-zone :deep(.ant-upload-wrapper),
.upload-zone :deep(.ant-upload-drag) {
  width: 100%;
}

.upload-zone :deep(.ant-upload-drag) {
  border-color: color-mix(in srgb, var(--color-primary) 28%, var(--color-border));
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-page) 70%, white);
  transition: border-color .22s ease, background .22s ease, transform .22s ease;
}

.upload-zone :deep(.ant-upload-drag:hover) {
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 4%, white);
  transform: translateY(-1px);
}

.upload-zone__inner {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 12px 20px;
  text-align: left;

  strong {
    display: block;
    color: var(--color-text);
    font-size: 15px;
    font-weight: 680;
  }

  p {
    margin: 4px 0 0;
    color: var(--color-text-secondary);
    line-height: 1.55;
  }
}

.upload-zone__icon {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--color-primary) 10%, white);
  color: var(--color-primary);
  font-size: 19px;
}

.upload-progress {
  display: grid;
  grid-template-columns: minmax(180px, .7fr) minmax(240px, 1.3fr);
  gap: 20px;
  align-items: center;
  padding: 14px 18px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);

  div:first-child {
    display: grid;
    min-width: 0;
  }

  span {
    color: var(--color-text-secondary);
    font-size: 11px;
  }

  strong {
    overflow: hidden;
    color: var(--color-text);
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.file-mobile-grid { display: none; }

.file-mobile-pagination {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.media-preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  background: #f5f5f5;
  border-radius: 4px;
  padding: 16px;
}

.media-player { width: 100%; }
.media-player--video { max-height: 600px; }

.media-preview-container--stable {
  aspect-ratio: 16 / 9;
  width: min(100%, 720px);
  margin: 0 auto;
}

.media-preview-container--stable audio,
.media-preview-container--stable video {
  max-width: 100%;
  max-height: 100%;
}

.image-preview-container {
  position: relative;
  width: 60px;
  height: 60px;
  
  .image-placeholder {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background: #f5f5f5;
    color: #999;
  }
}

.preview-frame--stable { aspect-ratio: 1; }

.image-preview-container.is-unavailable {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
  justify-content: center;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  background: #fafafa;
  color: #8c8c8c;
  font-size: 10px;
  line-height: 1.2;
  text-align: center;
  cursor: help;

  .anticon {
    font-size: 15px;
  }
}

@media (max-width: 768px) {
  .storage-brief {
    grid-template-columns: 1fr;
    padding: 18px;
  }

  .storage-metrics {
    width: 100%;
  }

  .upload-zone__inner {
    align-items: flex-start;
    padding: 8px 10px;
  }

  .upload-progress {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .admin-table-card { display: none; }

  .file-mobile-grid {
    display: grid;
    gap: 10px;
  }

  .file-mobile-row {
    display: grid;
    gap: 14px;
    padding: 16px;
    border: 1px solid var(--color-border);
    border-radius: 12px;
    background: var(--color-surface);
  }

  .file-mobile-row__identity {
    display: grid;
    grid-template-columns: 38px minmax(0, 1fr);
    gap: 12px;
    align-items: center;

    strong,
    span {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    strong { color: var(--color-text); font-weight: 680; }
    span { margin-top: 3px; color: var(--color-text-secondary); font-size: 12px; }
  }

  .file-kind {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: color-mix(in srgb, var(--color-primary) 9%, white);
    color: var(--color-primary);
  }

  .file-mobile-row__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding-top: 10px;
    border-top: 1px solid var(--color-border);
  }
}
</style>
