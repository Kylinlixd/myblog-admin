<template>
  <div class="file-list">
    <a-page-header
      title="文件管理"
      subtitle="管理上传的文件资源"
    >
      <template #extra>
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
    </a-page-header>

    <!-- 搜索表单 -->
    <a-form layout="inline" class="search-form">
      <div class="search-form-left">
        <a-form-item label="文件名">
          <a-input v-model:value="searchForm.name" placeholder="搜索文件名" allowClear />
        </a-form-item>
        <a-form-item label="类型">
          <a-select
            v-model:value="searchForm.type"
            placeholder="选择类型"
            style="width: 120px"
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
    <div class="table-operations">
      <a-space>
        <a-button danger :disabled="!selectedRowKeys.length" @click="handleBatchDelete">
          <DeleteOutlined />
          批量删除
        </a-button>
      </a-space>
    </div>

    <a-card class="data-card">
      <a-table
        :loading="loading"
        :columns="columns"
        :data-source="fileList"
        :pagination="paginationConfig"
        :scroll="{ x: 'max-content' }"
        row-key="id"
        bordered
        :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <!-- 预览列 -->
          <template v-if="column.dataIndex === 'preview'">
            <template v-if="record.type === 'image'">
              <div class="image-preview-container">
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
            <a-space>
              <a-button type="link" size="small" @click="handleDownload(record)">
                <DownloadOutlined />
                下载
              </a-button>
              <a-button type="link" size="small" @click="copyFileUrl(record.url)">
                <CopyOutlined />
                复制链接
              </a-button>
              <a-popconfirm
                title="确定要删除这个文件吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleDelete(record.id)"
              >
                <a-button type="link" danger size="small">
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
      <div class="media-preview-container">
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
import { ref, computed, onMounted } from 'vue'
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

const loading = ref(false)
const fileList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const selectedRowKeys = ref([])

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
  onChange: (page, pageSize) => {
    currentPage.value = page
    fetchFiles()
  },
  onShowSizeChange: (current, size) => {
    pageSize.value = size
    currentPage.value = 1
    fetchFiles()
  }
}))

// 获取文件列表
const fetchFiles = async () => {
  try {
    loading.value = true
    console.log('开始获取文件列表...')
    const response = await getFileList({
      page: currentPage.value,
      pageSize: pageSize.value
    })
    
    console.log('获取文件列表响应:', response)
    
    if (response && response.code === 200 && response.data) {
      // 确保数据格式正确
      fileList.value = response.data.items.map(item => {
        // 确保baseUrl不为空
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const url = item.file_url ? `${baseUrl}${item.file_url}` : item.file_url;
        console.log('处理文件URL:', {
          file_url: item.file_url,
          baseUrl: baseUrl,
          finalUrl: url,
          file_type: item.file_type
        });
        
        // 验证图片URL
        if (item.file_type === 'image' && url) {
          fetch(url)
            .then(response => {
              console.log('图片URL验证:', {
                url: url,
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries())
              });
            })
            .catch(error => {
              console.error('图片URL验证失败:', {
                url: url,
                error: error
              });
            });
        }
        
        return {
          ...item,
          id: item.id,
          name: item.name,
          type: item.file_type,
          size: item.file_size,
          url: url,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          downloadCount: item.download_count,
          isPublic: item.is_public,
          description: item.description,
          category: item.category,
          tags: item.tags,
          uploader: item.uploader
        }
      })
      total.value = response.data.total
      console.log('文件列表数据:', fileList.value)
    } else {
      fileList.value = []
      total.value = 0
      const errorMsg = response?.message || '获取文件列表失败'
      console.error('获取文件列表失败:', errorMsg)
      message.error(errorMsg)
    }
  } catch (error) {
    console.error('获取文件列表异常:', error)
    fileList.value = []
    total.value = 0
    message.error(error.message || '获取文件列表失败')
  } finally {
    loading.value = false
  }
}

// 处理搜索
const handleSearch = async () => {
  try {
    loading.value = true
    console.log('开始搜索文件...')
    const response = await searchFiles({
      q: searchForm.value.name,
      type: searchForm.value.type,
      page: currentPage.value,
      pageSize: pageSize.value
    })
    
    console.log('搜索文件响应:', response)
    
    if (response && response.code === 200 && response.data) {
      // 确保数据格式正确
      fileList.value = response.data.items.map(item => {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        return {
          ...item,
          id: item.id,
          name: item.name,
          type: item.file_type,
          size: item.file_size,
          url: item.file_url ? `${baseUrl}${item.file_url}` : item.file_url,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          downloadCount: item.download_count,
          isPublic: item.is_public,
          description: item.description,
          category: item.category,
          tags: item.tags,
          uploader: item.uploader
        }
      })
      total.value = response.data.total
      console.log('搜索结果数据:', fileList.value)
    } else {
      fileList.value = []
      total.value = 0
      const errorMsg = response?.message || '搜索文件失败'
      console.error('搜索文件失败:', errorMsg)
      message.error(errorMsg)
    }
  } catch (error) {
    console.error('搜索文件异常:', error)
    fileList.value = []
    total.value = 0
    message.error(error.message || '搜索文件失败')
  } finally {
    loading.value = false
  }
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

// 处理表格变化
const handleTableChange = (pagination, filters, sorter) => {
  if (pagination) {
    currentPage.value = pagination.current
    pageSize.value = pagination.pageSize
  }
  fetchFiles()
}

// 选择变化
const onSelectChange = (keys) => {
  selectedRowKeys.value = keys
}

// 处理批量删除
const handleBatchDelete = async () => {
  if (!selectedRowKeys.value.length) {
    message.warning('请选择要删除的文件')
    return
  }

  try {
    loading.value = true
    await Promise.all(selectedRowKeys.value.map(id => deleteFile(id)))
    message.success('批量删除成功')
    selectedRowKeys.value = []
    fetchFiles()
  } catch (error) {
    console.error('批量删除失败:', error)
    message.error('批量删除失败')
  } finally {
    loading.value = false
  }
}

// 处理单个删除
const handleDelete = async (id) => {
  try {
    loading.value = true
    await deleteFile(id)
    message.success('删除成功')
    fetchFiles()
  } catch (error) {
    console.error('删除文件失败:', error)
    message.error('删除失败')
  } finally {
    loading.value = false
  }
}

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
    
    if (result && result.code === 200) {
      message.success('上传成功')
      onSuccess(result)
      fetchFiles() // 刷新列表
    } else {
      message.error(result?.message || '上传失败')
      onError(new Error(result?.message || '上传失败'))
    }
  } catch (error) {
    console.error('上传失败:', error)
    message.error('上传失败')
    onError(error)
  }
}

// 处理预览错误
const handlePreviewError = (e, record) => {
  console.error('预览加载失败:', {
    error: e,
    record: record,
    url: record.url,
    errorType: e.type,
    errorTarget: e.target,
    errorTimeStamp: e.timeStamp,
    errorIsTrusted: e.isTrusted
  });
  
  // 尝试直接访问URL
  fetch(record.url)
    .then(response => {
      console.log('文件访问响应:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
    })
    .catch(error => {
      console.error('文件访问失败:', error);
    });
    
  message.error('预览加载失败，请检查文件是否存在');
}

// 处理媒体文件错误
const handleMediaError = (e) => {
  console.error('媒体文件加载失败:', {
    error: e,
    url: previewUrl.value,
    errorType: e.type,
    errorTarget: e.target,
    errorTimeStamp: e.timeStamp,
    errorIsTrusted: e.isTrusted
  });
  
  // 尝试直接访问URL
  fetch(previewUrl.value)
    .then(response => {
      console.log('媒体文件访问响应:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
    })
    .catch(error => {
      console.error('媒体文件访问失败:', error);
    });
    
  message.error('媒体文件加载失败，请检查文件是否存在');
}

// 修改预览媒体文件函数
const previewMedia = (type, url) => {
  // 确保baseUrl不为空
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
  
  console.log('预览媒体文件:', {
    type: type,
    url: fullUrl,
    baseUrl: baseUrl
  });
  
  // 验证URL
  if (!fullUrl) {
    message.error('无效的文件URL');
    return;
  }
  
  // 尝试预加载文件
  fetch(fullUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      console.log('文件预加载成功:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      previewType.value = type;
      previewUrl.value = fullUrl;
      previewTitle.value = type === 'audio' ? '音频预览' : '视频预览';
      previewVisible.value = true;
    })
    .catch(error => {
      console.error('文件预加载失败:', error);
      message.error('文件加载失败，请检查文件是否存在');
    });
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
  console.error('图片加载失败:', {
    error: e,
    target: e.target,
    src: e.target.src,
    type: e.type,
    timeStamp: e.timeStamp
  });
  
  // 尝试直接访问图片URL
  const imgUrl = e.target.src;
  fetch(imgUrl)
    .then(response => {
      console.log('图片访问响应:', {
        url: imgUrl,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
    })
    .catch(error => {
      console.error('图片访问失败:', {
        url: imgUrl,
        error: error
      });
    });
    
  // 设置默认图片
  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNFNUU1RTUiLz48dGV4dCB4PSIzMCIgeT0iMzAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlPC90ZXh0Pjwvc3ZnPg==';
}

onMounted(() => {
  fetchFiles()
})
</script>

<style scoped lang="scss">
.file-list {
  padding: 24px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

  .data-card {
    :deep(.ant-card-body) {
      padding: 0;
    }
  }

  .table-operations {
    margin-bottom: 16px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }

  :deep(.ant-table-wrapper) {
    .ant-table {
      .ant-table-thead > tr > th {
        background: #fafafa;
        font-weight: 500;
        padding: 12px 8px;
        white-space: nowrap;
      }

      .ant-table-tbody > tr > td {
        padding: 12px 8px;
        vertical-align: middle;
      }

      .ant-table-row:hover {
        .ant-table-cell {
          background-color: #f5f5f5;
        }
      }
    }
  }

  .search-form {
    margin-bottom: 24px;
    padding: 16px;
    background: #fafafa;
    border-radius: 4px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;

    .search-form-left {
      flex: 1;
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }

    .search-form-right {
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }

    :deep(.ant-form-item) {
      margin-bottom: 0;
      margin-right: 0;
    }

    :deep(.ant-form-item-label) {
      padding-right: 8px;
    }

    :deep(.ant-form-item-control-input) {
      width: 100%;
    }

    :deep(.ant-select) {
      width: 100%;
    }
  }

  @media (max-width: 768px) {
    .search-form {
      flex-direction: column;
      gap: 16px;

      .search-form-left,
      .search-form-right {
        width: 100%;
        flex-direction: column;
      }

      :deep(.ant-form-item) {
        width: 100%;
      }

      :deep(.ant-form-item-control-input) {
        width: 100%;
      }

      :deep(.ant-select) {
        width: 100%;
      }
    }
  }
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
</style> 