<template>
  <div class="file-list admin-page">
    <PageHeader title="文件管理" subtitle="上传、筛选并管理内容资源。">
      <template #actions>
        <a-upload
          :customRequest="handleCustomUpload"
          :showUploadList="false"
          :beforeUpload="beforeUpload"
        >
          <a-button type="primary">
            <UploadOutlined /> 上传文件
          </a-button>
        </a-upload>
      </template>
    </PageHeader>

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
          style="width: 100%"
          ref="audioPlayer"
          @error="handleMediaError"
        ></audio>
        <video
          v-if="previewType === 'video'"
          :src="previewUrl"
          controls
          style="width: 100%; max-height: 600px;"
          ref="videoPlayer"
          @error="handleMediaError"
        ></video>
      </div>
    </a-modal>
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
  LoadingOutlined
} from '@ant-design/icons-vue'
import { uploadFile, getFileList, searchFiles, deleteFile, downloadFile } from '@/api/file'
import { buildApiUrl } from '@/utils/apiBaseUrl'
import PageHeader from '@/components/common/PageHeader.vue'
import AsyncState from '@/components/common/AsyncState.vue'

const loading = ref(false)
const errorMessage = ref('')
const fileList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const selectedRowKeys = ref([])
const deletingIds = reactive(new Set())
const batchDeleting = ref(false)
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
    uploader: item.uploader
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

// 上传前检查
const beforeUpload = (file) => {
  // 检查文件大小（限制为100MB）
  const isLt100M = file.size / 1024 / 1024 < 100
  if (!isLt100M) {
    message.error('文件大小不能超过100MB!')
    return false
  }
  return true
}

// 处理自定义上传
const handleCustomUpload = async ({ file, onSuccess, onError }) => {
  try {
    const result = await uploadFile({
      file,
      file_type: file.type.startsWith('image/') ? 'image' : 
                 file.type.startsWith('audio/') ? 'audio' : 
                 file.type.startsWith('video/') ? 'video' : 'other'
    })
    
    if (result) {
      message.success('上传成功')
      onSuccess(result)
      fetchFiles() // 刷新列表
    } else {
      const error = new Error('上传失败')
      message.error(error.message)
      onError(error)
    }
  } catch (error) {
    console.error('上传失败:', error)
    message.error('上传失败')
    onError(error)
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
const copyFileUrl = (url) => {
  if (!url) {
    message.error('无效的文件链接');
    return;
  }
  
  navigator.clipboard.writeText(url).then(() => {
    message.success('链接已复制到剪贴板');
  }).catch(() => {
    message.error('复制失败，请手动复制');
  });
}

// 获取类型名称
const getTypeName = (type) => {
  const typeMap = {
    image: '图片',
    audio: '音频',
    video: '视频'
  }
  return typeMap[type] || type
}

// 获取类型颜色
const getTypeColor = (type) => {
  const colorMap = {
    image: 'blue',
    audio: 'green',
    video: 'purple'
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
  fetchFiles()
})
</script>

<style scoped lang="scss">
.media-preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  background: #f5f5f5;
  border-radius: 4px;
  padding: 16px;
}

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
</style>
