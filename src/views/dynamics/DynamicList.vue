<template>
  <div class="dynamic-list">
    <a-page-header
      title="动态管理"
      subtitle="管理博客动态内容"
    >
      <template #extra>
        <a-button type="primary" @click="navigateToCreate">
          <PlusOutlined /> 新建动态
        </a-button>
      </template>
    </a-page-header>
    
    <!-- 搜索表单 -->
    <a-form layout="inline" class="search-form">
      <a-form-item label="内容">
        <a-input v-model:value="searchForm.content" placeholder="搜索内容" allowClear />
      </a-form-item>
      <a-form-item label="分类">
        <a-select
          v-model:value="searchForm.categoryId"
          placeholder="选择分类"
          style="min-width: 120px"
          allowClear
        >
          <a-select-option v-for="category in categories" :key="category.id" :value="category.id">
            {{ category.name }}
          </a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="标签">
        <a-select
          v-model:value="searchForm.tagIds"
          placeholder="选择标签"
          mode="multiple"
          style="min-width: 200px"
          allowClear
        >
          <a-select-option v-for="tag in tags" :key="tag.id" :value="tag.id">
            {{ tag.name }}
          </a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="状态">
        <a-select
          v-model:value="searchForm.status"
          placeholder="选择状态"
          style="min-width: 100px"
          allowClear
        >
          <a-select-option value="published">已发布</a-select-option>
          <a-select-option value="draft">草稿</a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="类型">
        <a-select
          v-model:value="searchForm.type"
          placeholder="选择类型"
          style="min-width: 100px"
          allowClear
        >
          <a-select-option value="text">文本</a-select-option>
          <a-select-option value="image">图文</a-select-option>
          <a-select-option value="audio">音频</a-select-option>
          <a-select-option value="video">视频</a-select-option>
        </a-select>
      </a-form-item>
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
    </a-form>

    <!-- 操作按钮 -->
    <div class="table-operations">
      <a-space>
        <a-button type="primary" @click="handleAdd">
          <PlusOutlined />
          新建动态
        </a-button>
        <a-button danger :disabled="!selectedRowKeys.length" @click="handleBatchDelete">
          <DeleteOutlined />
          批量删除
        </a-button>
      </a-space>
    </div>

    <a-card class="data-card">
      <a-table
        :loading="loading"
        :columns="responsive ? columnsForMobile : columns"
        :data-source="dynamicList"
        :pagination="paginationConfig"
        :scroll="{ x: 'max-content' }"
        row-key="id"
        bordered
        :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <!-- 内容列 -->
          <template v-if="column.dataIndex === 'content'">
            <div class="content-cell">
              <div class="content-text">{{ record.content }}</div>
              <div v-if="record.mediaUrls?.length" class="media-preview">
                <a-image-preview-group>
                  <a-image
                    v-for="(url, index) in record.mediaUrls"
                    :key="index"
                    :src="url"
                    :width="40"
                    :height="40"
                    :preview="{
                      src: url,
                      mask: false
                    }"
                  />
                </a-image-preview-group>
              </div>
            </div>
          </template>

          <!-- 媒体预览列 -->
          <template v-if="column.dataIndex === 'mediaUrls'">
            <template v-if="record.type === 'image' && record.mediaUrls && record.mediaUrls.length">
              <a-image
                :src="record.mediaUrls[0]"
                :width="60"
                :height="60"
                fit="cover"
                :preview="{
                  src: record.mediaUrls[0],
                  mask: '预览',
                }"
              />
              <a-badge v-if="record.mediaUrls.length > 1" :count="record.mediaUrls.length" />
            </template>
            
            <template v-else-if="record.type === 'audio' && record.mediaUrls && record.mediaUrls.length">
              <a-button type="link" size="small" @click="previewMedia('audio', record.mediaUrls[0])">
                <SoundOutlined /> 音频
              </a-button>
            </template>
            
            <template v-else-if="record.type === 'video' && record.mediaUrls && record.mediaUrls.length">
              <a-button type="link" size="small" @click="previewMedia('video', record.mediaUrls[0])">
                <VideoCameraOutlined /> 视频
              </a-button>
            </template>
            
            <template v-else>
              <span>无媒体文件</span>
            </template>
          </template>
          
          <!-- 分类列 -->
          <template v-if="column.dataIndex === 'categoryId'">
            <a-tag color="blue">
              {{ getCategoryName(record.categoryId) }}
            </a-tag>
          </template>
          
          <!-- 标签列 -->
          <template v-if="column.dataIndex === 'tags'">
            <template v-if="record.tags && record.tags.length">
              <a-space wrap :size="[4, 4]">
                <a-tag 
                  v-for="tag in record.tags" 
                  :key="tag.id" 
                  color="blue"
                >
                  {{ tag.name }}
                </a-tag>
              </a-space>
            </template>
            <template v-else>
              <span class="text-muted">无标签</span>
            </template>
          </template>
          
          <!-- 状态列 -->
          <template v-if="column.dataIndex === 'status'">
            <a-tag :color="record.status === 'published' ? 'success' : 'default'">
              {{ record.status === 'published' ? '已发布' : '草稿' }}
            </a-tag>
          </template>
          
          <!-- 创建时间列 -->
          <template v-if="column.dataIndex === 'createdAt'">
            {{ formatDate(record.createdAt) }}
          </template>
          
          <!-- 操作列 -->
          <template v-if="column.dataIndex === 'action'">
            <a-space>
              <a-button type="primary" size="small" @click="editDynamic(record)">
                <EditOutlined />
                编辑
              </a-button>
              <a-button type="primary" size="small" @click="viewDetail(record)">
                <EyeOutlined />
                查看
              </a-button>
              <a-popconfirm
                title="确定要删除这条动态吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleDelete(record.id)"
              >
                <a-button type="primary" danger size="small">
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
      v-model:visible="previewVisible"
      :title="previewTitle"
      :footer="null"
      width="800px"
    >
      <img v-if="previewType === 'image'" alt="预览" style="width: 100%" :src="previewUrl" />
      <audio v-if="previewType === 'audio'" controls style="width: 100%" :src="previewUrl"></audio>
      <video v-if="previewType === 'video'" controls style="width: 100%" :src="previewUrl"></video>
    </a-modal>

    <!-- 动态预览对话框 -->
    <a-modal
      v-model:visible="detailVisible"
      title="动态详情"
      :footer="null"
      width="800px"
    >
      <div v-if="currentDetail" class="dynamic-detail">
        <div class="detail-header">
          <div class="detail-title">
            <a-tag :color="currentDetail.type === 'text' ? 'blue' : 'green'">
              {{ currentDetail.type === 'text' ? '文本' : '图文' }}
            </a-tag>
            <a-tag :color="currentDetail.status === 'published' ? 'success' : 'default'">
              {{ currentDetail.status === 'published' ? '已发布' : '草稿' }}
            </a-tag>
            <span class="detail-time">{{ formatDate(currentDetail.createdAt) }}</span>
          </div>
        </div>
        
        <div class="detail-content">
          <div class="content-text">{{ currentDetail.content }}</div>
          
          <!-- 媒体内容 -->
          <div v-if="currentDetail.mediaUrls?.length" class="media-content">
            <template v-if="currentDetail.type === 'image'">
              <a-image-preview-group>
                <a-image
                  v-for="(url, index) in currentDetail.mediaUrls"
                  :key="index"
                  :src="url"
                  :width="200"
                  :height="200"
                  fit="cover"
                  :preview="{
                    src: url,
                    mask: false
                  }"
                />
              </a-image-preview-group>
            </template>
            
            <template v-else-if="currentDetail.type === 'audio'">
              <audio
                v-for="(url, index) in currentDetail.mediaUrls"
                :key="index"
                controls
                style="width: 100%"
                :src="url"
              ></audio>
            </template>
            
            <template v-else-if="currentDetail.type === 'video'">
              <video
                v-for="(url, index) in currentDetail.mediaUrls"
                :key="index"
                controls
                style="width: 100%"
                :src="url"
              ></video>
            </template>
          </div>
        </div>
        
        <div class="detail-footer">
          <div class="detail-meta">
            <div class="meta-item">
              <span class="meta-label">分类：</span>
              <a-tag color="blue">{{ getCategoryName(currentDetail.categoryId) }}</a-tag>
            </div>
            <div class="meta-item">
              <span class="meta-label">标签：</span>
              <a-space wrap :size="[4, 4]">
                <a-tag
                  v-for="tag in currentDetail.tags"
                  :key="tag.id"
                  color="blue"
                >
                  {{ tag.name }}
                </a-tag>
              </a-space>
            </div>
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, h, resolveComponent, reactive } from 'vue'
import { 
  message, 
  Button as AButton, 
  Space as ASpace, 
  Tag as ATag, 
  Image as AImage, 
  Badge as ABadge, 
  Popconfirm as APopconfirm, 
  Modal as AModal,
  Form as AForm,
  Input as AInput,
  Select as ASelect,
  Card as ACard,
  Table as ATable,
  PageHeader as APageHeader
} from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { 
  PlusOutlined, 
  EditOutlined, 
  EyeOutlined, 
  DeleteOutlined, 
  SoundOutlined,
  VideoCameraOutlined,
  SearchOutlined,
  ReloadOutlined
} from '@ant-design/icons-vue'
import { getDynamicList, deleteDynamic as deleteAdminDynamic } from '@/api/dynamic'
import { getCategoryList } from '@/api/category'
import { getTagList } from '@/api/tag'

const router = useRouter()
const loading = ref(false)
const dynamicList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const responsive = ref(false)

// 添加表格选择相关变量
const selectedRowKeys = ref([])
const onSelectChange = (keys) => {
  selectedRowKeys.value = keys
}

// 添加排序相关变量
const sortField = ref('')
const sortOrder = ref('')

// 添加搜索表单
const searchForm = reactive({
  content: '',
  categoryId: undefined,
  tagIds: [],
  status: undefined,
  type: undefined
})

// 获取动态列表
const fetchDynamics = async () => {
  try {
    loading.value = true;
    
    // 构造搜索参数
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      type: searchForm.type,
      status: searchForm.status,
      content: searchForm.content?.trim(),  // 去除空格
      categoryId: searchForm.categoryId,
      tagIds: searchForm.tagIds
    };

    // 移除空值参数
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === null || params[key] === '') {
        delete params[key];
      }
    });
    
    console.log('获取动态列表参数:', params);
    const response = await getDynamicList(params);
    console.log('获取动态列表响应:', response);
    
    if (response && response.code === 200 && response.data) {
      // 确保dynamicList是数组
      const items = Array.isArray(response.data.items) ? response.data.items : [];
      // 过滤掉无效的数据
      dynamicList.value = items.filter(item => item && item.id);
      total.value = response.data.total || dynamicList.value.length;
      console.log('更新后的列表数据:', dynamicList.value);
    } else if (response && Array.isArray(response)) {
      // 直接返回数组的情况
      dynamicList.value = response.filter(item => item && item.id);
      total.value = dynamicList.value.length;
      console.log('更新后的列表数据(数组格式):', dynamicList.value);
    } else if (response && response.items) {
      // {items: [], total: 0} 格式
      dynamicList.value = Array.isArray(response.items) ? response.items.filter(item => item && item.id) : [];
      total.value = response.total || dynamicList.value.length;
      console.log('更新后的列表数据(items格式):', dynamicList.value);
    } else {
      console.error('无法识别的响应格式:', response);
      dynamicList.value = [];
      total.value = 0;
      message.error('获取动态列表失败: 响应格式异常');
    }
  } catch (error) {
    console.error('获取动态列表失败:', error);
    dynamicList.value = [];
    total.value = 0;
    message.error('获取动态列表失败');
  } finally {
    loading.value = false;
  }
}

// 处理搜索
const handleSearch = () => {
  console.log('搜索表单数据:', searchForm);
  // 重置页码
  currentPage.value = 1;
  // 重新获取数据
  fetchDynamics();
}

// 重置搜索
const resetSearch = () => {
  // 重置搜索表单
  searchForm.content = '';
  searchForm.categoryId = undefined;
  searchForm.tagIds = [];
  searchForm.status = undefined;
  searchForm.type = undefined;
  // 重置页码
  currentPage.value = 1;
  // 重新获取数据
  fetchDynamics();
}

// 处理批量删除
const handleBatchDelete = async () => {
  if (!selectedRowKeys.value.length) {
    message.warning('请选择要删除的动态')
    return
  }

  try {
    loading.value = true
    await Promise.all(selectedRowKeys.value.map(id => deleteAdminDynamic(id)))
    message.success('批量删除成功')
    selectedRowKeys.value = []
    fetchDynamics()
  } catch (error) {
    console.error('批量删除失败:', error)
    message.error('批量删除失败，请重试')
  } finally {
    loading.value = false
  }
}

// 处理新建动态
const handleAdd = () => {
  navigateToCreate()
}

// 媒体预览相关
const previewVisible = ref(false)
const previewUrl = ref('')
const previewTitle = ref('')
const previewType = ref('image')

// 添加详情预览相关变量
const detailVisible = ref(false)
const currentDetail = ref(null)

// 表格列定义
const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 80
  },
  {
    title: '内容',
    dataIndex: 'content',
    key: 'content',
    ellipsis: true,
    width: 200
  },
  {
    title: '媒体文件',
    dataIndex: 'mediaUrls',
    key: 'mediaUrls',
    width: 100
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    width: 80,
    filters: [
      { text: '文本', value: 'text' },
      { text: '图文', value: 'image' },
      { text: '音频', value: 'audio' },
      { text: '视频', value: 'video' }
    ],
    onFilter: (value, record) => record.type === value
  },
  {
    title: '分类',
    dataIndex: 'categoryId',
    key: 'categoryId',
    width: 120
  },
  {
    title: '标签',
    dataIndex: 'tags',
    key: 'tags',
    width: 180
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 80,
    filters: [
      { text: '草稿', value: 'draft' },
      { text: '已发布', value: 'published' }
    ],
    onFilter: (value, record) => record.status === value
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 160,
    sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  },
  {
    title: '操作',
    dataIndex: 'action',
    key: 'action',
    width: 180,
    fixed: 'right'
  }
]

// 移动端优化的列定义
const columnsForMobile = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 60
  },
  {
    title: '内容',
    dataIndex: 'content',
    key: 'content',
    ellipsis: true
  },
  {
    title: '操作',
    dataIndex: 'action',
    key: 'action',
    fixed: 'right',
    width: 120
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
    fetchDynamics()
  },
  onShowSizeChange: (current, size) => {
    pageSize.value = size
    currentPage.value = 1
    fetchDynamics()
  }
}))

// 添加分类和标签数据
const categories = ref([])
const tags = ref([])

// 获取分类名称
const getCategoryName = (categoryId) => {
  const category = categories.value.find(c => c.id === categoryId)
  return category ? category.name : '未知分类'
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

// 媒体预览
const previewMedia = (type, url) => {
  previewType.value = type
  previewUrl.value = url
  previewTitle.value = type === 'audio' ? '音频预览' : '视频预览'
  previewVisible.value = true
}

// 获取分类列表
const fetchCategories = async () => {
  try {
    const response = await getCategoryList()
    console.log('分类列表响应:', response)
    
    if (response && response.results) {
      categories.value = response.results
    } else if (Array.isArray(response)) {
      categories.value = response
    } else if (response && response.data) {
      categories.value = Array.isArray(response.data) ? response.data : [response.data]
    } else {
      console.error('获取分类列表响应格式异常:', response)
      categories.value = []
    }
  } catch (error) {
    console.error('获取分类列表失败:', error)
    message.error('获取分类列表失败')
    categories.value = []
  }
}

// 获取标签列表
const fetchTags = async () => {
  try {
    const response = await getTagList()
    console.log('标签列表响应:', response)
    
    if (response && response.results) {
      tags.value = response.results
    } else if (Array.isArray(response)) {
      tags.value = response
    } else if (response && response.data) {
      tags.value = Array.isArray(response.data) ? response.data : [response.data]
    } else {
      console.error('获取标签列表响应格式异常:', response)
      tags.value = []
    }
  } catch (error) {
    console.error('获取标签列表失败:', error)
    message.error('获取标签列表失败')
    tags.value = []
  }
}

// 表格变化处理
const handleTableChange = (pagination, filters, sorter) => {
  console.log('表格变化:', { pagination, filters, sorter });
  // 更新分页信息
  if (pagination) {
    currentPage.value = pagination.current;
    pageSize.value = pagination.pageSize;
  }
  
  // 更新排序信息
  if (sorter) {
    sortField.value = sorter.field;
    sortOrder.value = sorter.order;
  }
  
  // 重新获取数据
  fetchDynamics();
}

// 跳转到创建动态页面
const navigateToCreate = () => {
  console.log('尝试跳转到创建动态页面')
  try {
    // 获取访问 token
    const accessToken = localStorage.getItem('accessToken')
    if (!accessToken) {
      message.error('登录已过期，请重新登录')
      router.push('/login')
      return
    }

    // 使用命名路由方式跳转，并携带访问 token
    router.push({
      name: 'CreateDynamic',
      query: { token: accessToken }
    }).then(() => {
      console.log('跳转成功: name=CreateDynamic')
    }).catch(err => {
      console.error('命名路由跳转失败:', err)
      
      // 尝试使用路径跳转
      router.push({
        path: '/dashboard/dynamics/create',
        query: { token: accessToken }
      }).then(() => {
        console.log('路径跳转成功')
      }).catch(err => {
        console.error('路径跳转也失败:', err)
        message.error('页面跳转失败，请检查路由配置')
      })
    })
  } catch (error) {
    console.error('路由跳转异常:', error)
    message.error('页面跳转失败，请稍后重试')
  }
}

// 查看动态详情
const viewDetail = (record) => {
  currentDetail.value = record
  detailVisible.value = true
}

// 编辑动态
const editDynamic = (record) => {
  router.push(`/dashboard/dynamics/edit/${record.id}`)
}

// 删除动态
const handleDelete = async (id) => {
  try {
    loading.value = true
    await deleteAdminDynamic(id)
    message.success('删除成功')
    fetchDynamics() // 重新加载列表
  } catch (error) {
    console.error('删除动态失败:', error)
    message.error('删除失败，请重试')
  } finally {
    loading.value = false
  }
}

// 检测设备尺寸
const checkResponsive = () => {
  responsive.value = window.innerWidth < 768
}

// 在组件挂载时获取数据
onMounted(() => {
  fetchDynamics()
  fetchCategories()
  fetchTags()
  
  // 检测响应式
  checkResponsive()
  window.addEventListener('resize', checkResponsive)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkResponsive)
})
</script>

<style scoped lang="scss">
.dynamic-list {
  padding: 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow-x: auto;

  .search-form {
    margin-bottom: 24px;
    padding: 24px;
    background: #fafafa;
    border-radius: 8px;

    :deep(.ant-form-item) {
      margin-bottom: 16px;
      margin-right: 16px;

      @media (max-width: 768px) {
        margin-right: 0;
        width: 100%;
      }
    }

    :deep(.ant-form-item-control-input) {
      min-width: 200px;
    }
  }

  .table-operations {
    margin-bottom: 16px;
    display: flex;
    justify-content: flex-end;
  }

  .content-cell {
    max-width: 400px;
    
    .content-text {
      margin-bottom: 8px;
      word-break: break-all;
    }

    .media-preview {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
  }

  :deep(.ant-table) {
    .ant-table-cell {
      vertical-align: top;
      white-space: nowrap;
    }

    .ant-table-thead > tr > th {
      white-space: nowrap;
      background: #fafafa;
      font-weight: 500;
    }

    .ant-table-tbody > tr > td {
      padding: 16px 8px;
    }
  }

  :deep(.ant-space) {
    flex-wrap: wrap;
  }
}

// 响应式布局
@media (max-width: 768px) {
  .dynamic-list {
    padding: 16px;

    .search-form {
      padding: 16px;
    }

    .table-operations {
      flex-direction: column;
      gap: 8px;

      .ant-space {
        width: 100%;
        justify-content: flex-start;
      }
    }

    .content-cell {
      max-width: 100%;
    }
  }
}

.dynamic-detail {
  .detail-header {
    margin-bottom: 24px;
    
    .detail-title {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .detail-time {
        color: #999;
        font-size: 14px;
      }
    }
  }
  
  .detail-content {
    margin-bottom: 24px;
    
    .content-text {
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 16px;
      white-space: pre-wrap;
      word-break: break-all;
    }
    
    .media-content {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      
      .ant-image {
        border-radius: 4px;
        overflow: hidden;
      }
    }
  }
  
  .detail-footer {
    border-top: 1px solid #f0f0f0;
    padding-top: 16px;
    
    .detail-meta {
      .meta-item {
        margin-bottom: 8px;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        .meta-label {
          color: #666;
          margin-right: 8px;
        }
      }
    }
  }
}
</style>