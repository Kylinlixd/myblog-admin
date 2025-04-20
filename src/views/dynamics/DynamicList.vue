<template>
  <div class="dynamic-list">
    <div class="header-actions">
      <a-button type="primary" @click="handleCreate">
        <template #icon><plus-outlined /></template>新建动态
      </a-button>
    </div>
    
    <div class="search-area">
      <a-form layout="inline" :model="searchForm" @finish="handleSearch">
        <a-form-item label="内容">
          <a-input
            v-model:value="searchForm.keyword"
            placeholder="请输入关键词"
            allow-clear
          />
        </a-form-item>
        
        <a-form-item label="类型">
          <a-select v-model:value="searchForm.type" placeholder="请选择类型" allow-clear style="width: 120px">
            <a-select-option value="text">文本</a-select-option>
            <a-select-option value="image">图片</a-select-option>
            <a-select-option value="audio">音频</a-select-option>
            <a-select-option value="video">视频</a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="状态">
          <a-select v-model:value="searchForm.status" placeholder="请选择状态" allow-clear style="width: 120px">
            <a-select-option value="draft">草稿</a-select-option>
            <a-select-option value="published">已发布</a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item>
          <a-button type="primary" html-type="submit">
            <template #icon><search-outlined /></template>
            搜索
          </a-button>
          <a-button style="margin-left: 8px" @click="handleReset">
            <template #icon><reload-outlined /></template>
            重置
          </a-button>
        </a-form-item>
      </a-form>
    </div>
    
    <a-table
      :columns="columns"
      :data-source="dynamicList"
      :loading="loading"
      :pagination="false"
      row-key="id"
      class="dynamic-table"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'content'">
          <div class="content-cell">
            <template v-if="record.type === 'text'">
              <div class="text-content">{{ record.content }}</div>
            </template>
            <template v-else-if="record.type === 'image'">
              <a-image 
                v-for="(url, index) in record.mediaUrls" 
                :key="index"
                :src="url" 
                class="preview-image"
                :width="100" 
              />
            </template>
            <template v-else-if="record.type === 'audio'">
              <audio controls class="preview-audio" :src="record.mediaUrls[0]"></audio>
            </template>
            <template v-else-if="record.type === 'video'">
              <video controls class="preview-video" :src="record.mediaUrls[0]"></video>
            </template>
          </div>
        </template>
        
        <template v-else-if="column.key === 'type'">
          <a-tag :color="getTypeColor(record.type)">{{ getTypeText(record.type) }}</a-tag>
        </template>
        
        <template v-else-if="column.key === 'status'">
          <a-tag :color="record.status === 'published' ? 'success' : 'default'">
            {{ record.status === 'published' ? '已发布' : '草稿' }}
          </a-tag>
        </template>
        
        <template v-else-if="column.key === 'action'">
          <a-space>
            <a-button type="primary" @click="handleEdit(record)">
              <template #icon><edit-outlined /></template>
              编辑
            </a-button>
            <a-button type="primary" @click="handlePreview(record)">
              <template #icon><eye-outlined /></template>
              预览
            </a-button>
            <a-button type="primary" danger @click="handleDelete(record)">
              <template #icon><delete-outlined /></template>
              删除
            </a-button>
          </a-space>
        </template>
      </template>
    </a-table>
    
    <div class="pagination-container">
      <a-pagination
        v-model:current="currentPage"
        v-model:pageSize="pageSize"
        :total="total"
        :showSizeChanger="true"
        @change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import { 
  PlusOutlined, 
  EditOutlined, 
  EyeOutlined, 
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined
} from '@ant-design/icons-vue'
import { getDynamicList, deleteDynamic } from '../../api/dynamic'

const router = useRouter()
const loading = ref(false)
const dynamicList = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 表格列配置
const columns = [
  {
    title: '内容',
    dataIndex: 'content',
    key: 'content',
    width: '300px'
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    width: '100px'
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: '100px'
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: '180px'
  },
  {
    title: '操作',
    key: 'action',
    fixed: 'right',
    width: '220px'
  }
]

// 搜索表单
const searchForm = reactive({
  keyword: '',
  type: '',
  status: ''
})

// 获取动态列表
const fetchDynamicList = async () => {
  try {
    loading.value = true
    
    // 检查用户是否已登录
    const token = localStorage.getItem('token')
    if (!token) {
      message.error('请先登录')
      router.push('/login')
      return
    }
    
    // 构建请求参数，避免嵌套的params结构
    const requestParams = {
      page: currentPage.value,
      limit: pageSize.value,
      keyword: searchForm.keyword,
      type: searchForm.type,
      status: searchForm.status
    }
    
    const response = await getDynamicList(requestParams)
    if (response.code === 200) {
      dynamicList.value = response.data.list || []
      total.value = response.data.total || 0
    } else {
      message.error(response.message || '获取动态列表失败')
    }
  } catch (error) {
    console.error('获取动态列表失败:', error)
    message.error('获取动态列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchDynamicList()
}

// 重置
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.type = ''
  searchForm.status = ''
  handleSearch()
}

// 新建
const handleCreate = () => {
  router.push('/dashboard/dynamics/create')
}

// 编辑
const handleEdit = (row) => {
  router.push(`/dashboard/dynamics/edit/${row.id}`)
}

// 预览
const handlePreview = (row) => {
  router.push(`/dashboard/dynamics/preview/${row.id}`)
}

// 删除
const handleDelete = (row) => {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这条动态吗？',
    okText: '确定',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      try {
        const response = await deleteDynamic(row.id)
        if (response.code === 200) {
          message.success('删除成功')
          fetchDynamicList()
        } else {
          message.error(response.message || '删除失败')
        }
      } catch (error) {
        console.error('删除动态失败:', error)
        message.error('删除失败')
      }
    }
  })
}

// 页码改变
const handlePageChange = (page, pageSize) => {
  currentPage.value = page
  fetchDynamicList()
}

// 获取类型颜色
const getTypeColor = (type) => {
  const colors = {
    text: 'blue',
    image: 'green',
    audio: 'orange',
    video: 'red'
  }
  return colors[type] || 'default'
}

// 获取类型文本
const getTypeText = (type) => {
  const texts = {
    text: '文本',
    image: '图片',
    audio: '音频',
    video: '视频'
  }
  return texts[type] || type
}

onMounted(async () => {
  // 检查用户是否已登录
  const token = localStorage.getItem('token')
  if (!token) {
    message.error('请先登录')
    router.push('/login')
    return
  }
  
  console.log('组件已挂载，当前令牌:', token.substring(0, 10) + '...')
  
  // 直接测试API连接
  try {
    const testResponse = await fetch('/api/dynamics', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('直接fetch测试响应状态:', testResponse.status)
    if (testResponse.ok) {
      const data = await testResponse.json()
      console.log('直接fetch测试响应数据:', data)
    } else {
      console.error('直接fetch测试失败:', await testResponse.text())
    }
  } catch (fetchError) {
    console.error('直接fetch测试异常:', fetchError)
  }
  
  // 使用正常方式获取数据
  fetchDynamicList()
})
</script>

<style lang="scss" scoped>
.dynamic-list {
  padding: 20px;
}

.header-actions {
  margin-bottom: 20px;
}

.search-area {
  margin-bottom: 20px;
  padding: 24px;
  background: #fff;
  border-radius: 4px;
}

.content-cell {
  max-height: 200px;
  overflow: hidden;
}

.text-content {
  white-space: pre-wrap;
  word-break: break-all;
}

.preview-image {
  margin-right: 10px;
  object-fit: cover;
}

.preview-audio,
.preview-video {
  width: 100%;
  max-width: 300px;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}

:global([data-theme='dark']) {
  .search-area {
    background: #1f1f1f;
  }
}
</style>