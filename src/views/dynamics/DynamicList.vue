<template>
  <div class="dynamic-list">
    <a-page-header
      title="动态管理"
      subtitle="管理博客动态内容"
    >
      <template #extra>
        <a-button type="primary" @click="navigateToCreate">
          <plus-outlined /> 新建动态
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
      <a-form-item>
        <a-space>
          <a-button type="primary" @click="handleSearch">
            <template #icon><SearchOutlined /></template>
            搜索
          </a-button>
          <a-button @click="resetSearch">
            <template #icon><ReloadOutlined /></template>
            重置
          </a-button>
        </a-space>
      </a-form-item>
    </a-form>

    <!-- 操作按钮 -->
    <div class="table-operations">
      <a-space>
        <a-button type="primary" @click="handleAdd">
          <template #icon><PlusOutlined /></template>
          新建动态
        </a-button>
        <a-button danger :disabled="!selectedRowKeys.length" @click="handleBatchDelete">
          <template #icon><DeleteOutlined /></template>
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
        :scroll="responsive ? { x: 800 } : {}"
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
                <sound-outlined /> 音频
              </a-button>
            </template>
            
            <template v-else-if="record.type === 'video' && record.mediaUrls && record.mediaUrls.length">
              <a-button type="link" size="small" @click="previewMedia('video', record.mediaUrls[0])">
                <video-camera-outlined /> 视频
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
              <a-button type="link" size="small" @click="editDynamic(record)">
                <template #icon><edit-outlined /></template>编辑
              </a-button>
              <a-button type="primary" size="small" @click="viewDetail(record)">
                <template #icon><eye-outlined /></template>查看
              </a-button>
              <a-popconfirm
                title="确定要删除这条动态吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleDelete(record.id)"
              >
                <a-button type="primary" danger size="small">
                  <template #icon><delete-outlined /></template>删除
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, h, resolveComponent, reactive } from 'vue'
import { message } from 'ant-design-vue'
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
  status: undefined
})

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchDynamics()
}

// 重置搜索
const resetSearch = () => {
  searchForm.content = ''
  searchForm.categoryId = undefined
  searchForm.tagIds = []
  searchForm.status = undefined
  currentPage.value = 1
  fetchDynamics()
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
    onFilter: (value, record) => record.type === value,
    customRender: ({ text }) => {
      const typeMap = {
        text: { text: '文本', color: '' },
        image: { text: '图文', color: 'blue' },
        audio: { text: '音频', color: 'purple' },
        video: { text: '视频', color: 'magenta' }
      }
      const type = typeMap[text] || { text, color: '' }
      return h(resolveComponent('a-tag'), { color: type.color }, () => type.text);
    }
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
  return date.toLocaleString()
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
    const data = await getCategoryList()
    categories.value = data || []
  } catch (error) {
    console.error('获取分类列表失败:', error)
    message.error('获取分类列表失败')
  }
}

// 获取标签列表
const fetchTags = async () => {
  try {
    const data = await getTagList()
    tags.value = data || []
  } catch (error) {
    console.error('获取标签列表失败:', error)
    message.error('获取标签列表失败')
  }
}

// 表格变化处理
const handleTableChange = (pagination, filters, sorter) => {
  console.log('表格变化:', { pagination, filters, sorter })
  // 更新分页信息
  if (pagination) {
    currentPage.value = pagination.current
    pageSize.value = pagination.pageSize
  }
  
  // 更新排序信息
  if (sorter) {
    sortField.value = sorter.field
    sortOrder.value = sorter.order
  }
  
  // 重新获取数据
  fetchDynamics()
}

// 获取动态列表
const fetchDynamics = async () => {
  loading.value = true;
  console.log('开始获取动态列表, 页码:', currentPage.value, '每页数量:', pageSize.value);
  
  try {
    const res = await getDynamicList({
      page: currentPage.value,
      pageSize: pageSize.value
    });
    
    console.log('动态API响应:', res);
    
    // 确保 dynamicList 始终是数组
    dynamicList.value = [];
    
    if (res && res.code === 200) {
      if (res.data && typeof res.data === 'object') {
        let items = [];
        
        if (res.data.items !== undefined) {
          items = Array.isArray(res.data.items) ? res.data.items : [];
          total.value = res.data.total || items.length;
        } else if (Array.isArray(res.data)) {
          items = res.data;
          total.value = items.length;
        } else {
          const possibleItems = res.data.list || res.data.data || res.data.records || [];
          items = Array.isArray(possibleItems) ? possibleItems : [];
          total.value = res.data.total || res.data.totalCount || res.data.count || items.length;
        }
        
        // 确保每个项目都是有效的对象
        dynamicList.value = items.filter(item => item && typeof item === 'object');
        console.log('已获取动态列表, 总数:', total.value, '有效项目数:', dynamicList.value.length);
      } else {
        console.warn('API返回数据格式异常:', res);
        total.value = 0;
      }
    } else {
      console.warn('API响应不成功:', res);
      total.value = 0;
    }
  } catch (error) {
    console.error('获取动态列表失败:', error);
    message.error('获取动态列表失败');
    console.warn('检查后端服务是否开启');
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

// 跳转到创建动态页面
const navigateToCreate = () => {
  console.log('尝试跳转到创建动态页面')
  try {
    // 使用命名路由方式跳转
    router.push({
      name: 'CreateDynamic'
    }).then(() => {
      console.log('跳转成功: name=CreateDynamic')
    }).catch(err => {
      console.error('命名路由跳转失败:', err)
      
      // 尝试使用路径跳转
      router.push('/dashboard/dynamics/create').then(() => {
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
  // 这里可以打开一个对话框显示详情，或者跳转到详情页
  router.push(`/dashboard/dynamics/preview/${record.id}`)
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
    }
  }

  :deep(.ant-table-thead > tr > th) {
    white-space: nowrap;
  }

  :deep(.ant-table-tbody > tr > td) {
    padding: 16px 8px;
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
</style>