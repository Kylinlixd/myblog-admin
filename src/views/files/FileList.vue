<template>
  <div class="file-list admin-page">
    <PageHeader title="文件管理" subtitle="上传、筛选并管理内容资源。">
      <template #actions>
        <a-space>
          <a-button @click="openTutorial">
            <QuestionCircleOutlined /> 使用教程
          </a-button>
          <a-upload
            :customRequest="handleCustomUpload"
            :showUploadList="false"
            :beforeUpload="beforeUpload"
          >
            <a-button type="primary">
              <UploadOutlined /> 上传文件
            </a-button>
          </a-upload>
        </a-space>
      </template>
    </PageHeader>

    <section class="storage-brief" aria-label="文件存储概况">
      <div class="storage-brief__copy">
        <span class="storage-eyebrow"><CloudServerOutlined /> 资源存储</span>
        <strong>{{ backendSummary.label }}</strong>
        <p>{{ backendSummary.description }}</p>
      </div>
      <dl class="storage-metrics">
        <div>
          <dt>当前结果</dt>
          <dd>{{ total }}</dd>
        </div>
        <div>
          <dt>可见容量</dt>
          <dd>{{ formatFileSize(visibleBytes) }}</dd>
        </div>
      </dl>
      <button
        v-if="tutorialHintVisible"
        type="button"
        class="tutorial-hint"
        @click="openTutorial"
      >
        第一次使用？查看 5 步教程
      </button>
    </section>

    <section class="upload-zone" aria-label="上传文件">
      <a-upload-dragger
        :customRequest="handleCustomUpload"
        :showUploadList="false"
        :beforeUpload="beforeUpload"
        :multiple="false"
      >
        <div class="upload-zone__inner">
          <span class="upload-zone__icon"><UploadOutlined /></span>
          <div>
            <strong>拖拽文件到这里，或点击选择</strong>
            <p>自动识别图片、PDF、Word、Excel、音视频；单个文件不超过 50 MB。</p>
          </div>
        </div>
      </a-upload-dragger>
      <div v-if="uploadingName" class="upload-progress" aria-live="polite">
        <div>
          <span>正在上传</span>
          <strong>{{ uploadingName }}</strong>
        </div>
        <a-progress :percent="uploadProgress" :show-info="true" size="small" />
      </div>
    </section>

    <!-- 搜索表单 -->
    <a-form layout="inline" class="search-form admin-filter">
      <div class="search-form-left">
        <a-form-item label="文件名">
          <a-input v-model:value="searchForm.name" placeholder="搜索文件名" allowClear />
        </a-form-item>
        <a-form-item label="类型">
          <a-select
            v-model:value="searchForm.type"
            placeholder="选择类型"
            allowClear
          >
            <a-select-option value="image">图片</a-select-option>
            <a-select-option value="audio">音频</a-select-option>
            <a-select-option value="video">视频</a-select-option>
            <a-select-option value="document">文档</a-select-option>
            <a-select-option value="other">其他</a-select-option>
          </a-select>
        </a-form-item>
      </div>
      <div class="search-form-right">
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="handleSearch">
              <SearchOutlined />
              搜索
            </a-button>
            <a-button @click="resetSearch">
              <ReloadOutlined />
              重置
            </a-button>
          </a-space>
        </a-form-item>
      </div>
    </a-form>

    <!-- 操作按钮 -->
    <div class="table-operations admin-toolbar">
      <a-space>
        <a-button
          danger
          :loading="batchDeleting"
          :disabled="!selectedRowKeys.length || batchDeleting"
          @click="handleBatchDelete"
        >
          <DeleteOutlined />
          批量删除
        </a-button>
      </a-space>
    </div>

    <AsyncState
      v-if="loading || errorMessage || !fileList.length"
      data-testid="file-async-state"
      :loading="loading"
      :error="errorMessage"
      :empty="!loading && !errorMessage"
      empty-title="暂无文件"
      empty-description="上传一个文件来开始管理资源。"
      @retry="fetchFiles"
    />

    <a-card v-else class="data-card admin-table-card">
      <a-table
        :loading="loading"
        :columns="columns"
        :data-source="fileList"
        :pagination="paginationConfig"
        :scroll="{ x: 'max-content' }"
        row-key="id"
        bordered
        :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
      >
        <template #bodyCell="{ column, record }">
          <!-- 预览列 -->
          <template v-if="column.dataIndex === 'preview'">
            <template v-if="record.type === 'image'">
              <div class="image-preview-container preview-frame--stable">
                <a-image
                  :src="record.url"
                  :alt="`预览：${record.name}`"
                  :width="60"
                  :height="60"
                  fit="cover"
                  :preview="{
                    src: record.url,
                    mask: true,
                    onError: (e) => handlePreviewError(e, record)
                  }"
                  @error="handleImageError"
                >
                  <template #preview-mask>
                    <div class="preview-mask-text">预览</div>
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
                <SoundOutlined /> 音频
              </a-button>
            </template>
            <template v-else-if="record.type === 'video'">
              <a-button type="link" size="small" @click="previewMedia('video', record.url)">
                <VideoCameraOutlined /> 视频
              </a-button>
            </template>
            <template v-else>
              <a-button type="link" size="small" @click="handleDownload(record)">
                <DownloadOutlined /> 下载
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
                下载
              </a-button>
              <a-button type="text" size="small" class="row-action" @click="copyFileUrl(record.url)">
                <CopyOutlined />
                复制链接
              </a-button>
              <a-popconfirm
                title="确定要删除这个文件吗？"
                ok-text="确定"
                cancel-text="取消"
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
                  删除
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <section v-if="fileList.length" class="file-mobile-grid" aria-label="移动端文件列表">
      <article v-for="record in fileList" :key="record.id" class="file-mobile-row">
        <div class="file-mobile-row__identity">
          <span class="file-kind"><FileTextOutlined /></span>
          <div>
            <strong>{{ record.name }}</strong>
            <span>{{ getTypeName(record.type) }} · {{ formatFileSize(record.size) }}</span>
          </div>
        </div>
        <div class="file-mobile-row__actions">
          <a-button type="text" size="small" @click="handleDownload(record)">下载</a-button>
          <a-button type="text" size="small" @click="copyFileUrl(record.url)">复制链接</a-button>
          <a-popconfirm
            title="确定要删除这个文件吗？"
            ok-text="确定"
            cancel-text="取消"
            @confirm="handleDelete(record.id)"
          >
            <a-button type="text" danger size="small">删除</a-button>
          </a-popconfirm>
        </div>
      </article>
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

    <FileTutorialDrawer v-model:open="tutorialOpen" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
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
  FileTextOutlined
} from '@ant-design/icons-vue'
import { uploadFile, getFileList, searchFiles, deleteFile, downloadFile } from '@/api/file'
import { buildApiUrl } from '@/utils/apiBaseUrl'
import PageHeader from '@/components/common/PageHeader.vue'
import AsyncState from '@/components/common/AsyncState.vue'
import FileTutorialDrawer from './FileTutorialDrawer.vue'

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

const visibleBytes = computed(() => fileList.value.reduce((sum, file) => sum + (Number(file.size) || 0), 0))
const backendSummary = computed(() => {
  const xionCount = fileList.value.filter((file) => file.storageBackend === 'xion').length
  if (xionCount > 0) {
    return {
      label: 'AstraStoreXion 正在托管新资源',
      description: `当前页面有 ${xionCount} 个 Xion 文件；历史本地文件继续兼容。`
    }
  }
  return {
    label: '本地媒体兼容模式',
    description: '现有文件保持可用，新上传会按服务器配置选择存储后端。'
  }
})

// 表格列定义
const columns = [
  {
    title: '预览',
    dataIndex: 'preview',
    key: 'preview',
    width: 100,
    align: 'center'
  },
  {
    title: '文件名',
    dataIndex: 'name',
    key: 'name',
    width: 200
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    width: 100,
    align: 'center',
    filters: [
      { text: '图片', value: 'image' },
      { text: '音频', value: 'audio' },
      { text: '视频', value: 'video' },
      { text: '文档', value: 'document' },
      { text: '其他', value: 'other' }
    ],
    onFilter: (value, record) => record.type === value
  },
  {
    title: '大小',
    dataIndex: 'size',
    key: 'size',
    width: 100,
    align: 'center',
    sorter: (a, b) => a.size - b.size
  },
  {
    title: '上传者',
    dataIndex: 'uploader',
    key: 'uploader',
    width: 120,
    align: 'center',
    customRender: ({ text }) => text?.nickname || text?.username || '-'
  },
  {
    title: '下载次数',
    dataIndex: 'downloadCount',
    key: 'downloadCount',
    width: 100,
    align: 'center',
    sorter: (a, b) => a.downloadCount - b.downloadCount
  },
  {
    title: '上传时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 160,
    align: 'center',
    sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  },
  {
    title: '操作',
    dataIndex: 'action',
    key: 'action',
    width: 200,
    fixed: 'right',
    align: 'center'
  }
]

// 分页配置
const paginationConfig = computed(() => ({
  current: currentPage.value,
  pageSize: pageSize.value,
  total: total.value,
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '50', '100'],
  showQuickJumper: true,
  showTotal: (total) => `共 ${total} 条`,
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
  } catch (error) {
    if (generation !== requestGeneration) return
    console.error('获取文件列表异常:', error)
    errorMessage.value = error.message || '获取文件列表失败'
    fileList.value = []
    total.value = 0
    message.error(error.message || '获取文件列表失败')
  } finally {
    if (generation === requestGeneration) loading.value = false
  }
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
    message.warning('请选择要删除的文件')
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
    if (failedIds.length) message.warning(`${failedIds.length} 个文件删除失败并保持选中`)
    else message.success('批量删除成功')
    await fetchFiles()
  } catch (error) {
    console.error('批量删除失败:', error)
    message.error('批量删除失败')
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
    message.success('删除成功')
    await fetchFiles()
  } catch (error) {
    console.error('删除文件失败:', error)
    message.error(error.message || '删除失败')
  } finally {
    deletingIds.delete(id)
  }
}

const isDeleting = (id) => deletingIds.has(id)

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024
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
    message.error('文件大小不能超过 50 MB')
    return false
  }
  return true
}

// 处理自定义上传
const handleCustomUpload = async ({ file, onSuccess, onError }) => {
  uploadingName.value = file.name
  uploadProgress.value = 0
  try {
    const result = await uploadFile({
      file,
      file_type: inferFileType(file),
      onProgress: (percent) => {
        uploadProgress.value = percent
      }
    })
    
    if (result) {
      uploadProgress.value = 100
      message.success('上传成功')
      onSuccess(result)
      await fetchFiles()
    } else {
      const error = new Error('上传失败')
      message.error(error.message)
      onError(error)
    }
  } catch (error) {
    console.error('上传失败:', error)
    message.error(error.message || '上传失败')
    onError(error)
  } finally {
    uploadingName.value = ''
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
  message.error('预览加载失败，请检查文件是否存在');
}

// 处理媒体文件错误
const handleMediaError = (e) => {
  console.error('媒体文件加载失败:', e)
  message.error('媒体文件加载失败，请检查文件是否存在');
}

// 修改预览媒体文件函数
const previewMedia = (type, url) => {
  const fullUrl = buildApiUrl(url)
  
  // 验证URL
  if (!fullUrl) {
    message.error('无效的文件URL');
    return;
  }
  
  previewType.value = type;
  previewUrl.value = fullUrl;
  previewTitle.value = type === 'audio' ? '音频预览' : '视频预览';
  previewVisible.value = true;
}

// 复制文件链接
const copyFileUrl = async (url) => {
  if (!url) {
    message.error('无效的文件链接');
    return;
  }

  const clipboard = typeof navigator !== 'undefined' ? navigator.clipboard : undefined
  if (!clipboard || typeof clipboard.writeText !== 'function') {
    message.error('复制失败，请手动复制')
    return
  }

  try {
    const resolvedUrl = buildApiUrl(url)
    const publicUrl = typeof window !== 'undefined' && resolvedUrl && !/^https?:\/\//i.test(resolvedUrl)
      ? new URL(resolvedUrl, window.location.origin).toString()
      : resolvedUrl
    await clipboard.writeText(publicUrl)
    message.success('链接已复制到剪贴板');
  } catch {
    message.error('复制失败，请手动复制');
  }
}

// 获取类型名称
const getTypeName = (type) => {
  const typeMap = {
    image: '图片',
    audio: '音频',
    video: '视频',
    document: '文档',
    other: '其他'
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

// 处理文件下载
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
    
    message.success('下载成功')
  } catch (error) {
    console.error('下载文件失败:', error)
    message.error('下载失败')
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

// 处理图片加载错误
const handleImageError = (e) => {
  // 设置默认图片
  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNFNUU1RTUiLz48dGV4dCB4PSIzMCIgeT0iMzAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlPC90ZXh0Pjwvc3ZnPg==';
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
