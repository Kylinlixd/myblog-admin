<template>
  <div class="dynamic-list admin-page">
    <PageHeader title="内容管理" subtitle="发布、筛选并维护数字花园中的文章。">
      <template #actions>
        <a-button type="primary" @click="navigateToCreate">
          <PlusOutlined /> 新建动态
        </a-button>
      </template>
    </PageHeader>
    
    <!-- 搜索表单 -->
    <a-form layout="inline" class="search-form admin-filter">
      <div class="search-form-left">
        <a-form-item label="标题">
          <a-input
            v-model:value="searchForm.title"
            placeholder="搜索标题"
            allowClear
          />
        </a-form-item>
        <a-form-item label="内容">
          <a-input
            v-model:value="searchForm.content"
            placeholder="搜索内容"
            allowClear
          />
        </a-form-item>
        <a-form-item label="分类">
          <a-select
            v-model:value="searchForm.categoryId"
            placeholder="选择分类"
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
            allowClear
          >
            <a-select-option v-for="tag in tags" :key="tag.id" :value="tag.id">
              {{ tag.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
      </div>
      <div class="search-form-right">
        <a-form-item label="状态">
          <a-select
            v-model:value="searchForm.status"
            placeholder="选择状态"
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
            allowClear
          >
            <a-select-option value="text">文本</a-select-option>
            <a-select-option value="image">图文</a-select-option>
            <a-select-option value="audio">音频</a-select-option>
            <a-select-option value="video">视频</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-space size="middle">
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
      <a-space size="middle">
        <a-button danger :disabled="!selectedRowKeys.length || deleting" :loading="deleting" @click="handleBatchDelete">
          <DeleteOutlined />
          批量删除
        </a-button>
      </a-space>
    </div>

    <a-card class="data-card admin-table-card">
      <div v-if="requestError" class="dynamic-error" role="alert">
        <strong>内容加载失败</strong>
        <span>请检查网络后重试。</span>
        <a-button type="primary" aria-label="重试" @click="fetchDynamics">
          <ReloadOutlined /> 重试
        </a-button>
      </div>
      <div v-else-if="!loading && !dynamicList.length" class="dynamic-empty">
        <strong>还没有内容</strong>
        <span>创建第一条动态，开始整理你的内容。</span>
        <a-button type="primary" aria-label="新建动态" @click="navigateToCreate">
          <PlusOutlined /> 新建动态
        </a-button>
      </div>
      <div class="content-table-scroll">
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
          <!-- 分类列 -->
          <template v-if="column.dataIndex === 'category'">
            <a-tag color="blue">
              {{ record.category?.name || '未分类' }}
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
          
          <!-- 点赞数列 -->
          <template v-if="column.dataIndex === 'like_count'">
            {{ record.like_count }}
          </template>
          
          <!-- 状态列 -->
          <template v-if="column.dataIndex === 'status'">
            <a-tag :color="record.status === 'published' ? 'success' : 'default'">
              {{ record.status === 'published' ? '已发布' : '草稿' }}
            </a-tag>
          </template>
          
          <!-- 创建时间列 -->
          <template v-else-if="column.dataIndex === 'created_at'">
            {{ formatDate(record.created_at) }}
          </template>
          
          <!-- 更新时间列 -->
          <template v-else-if="column.dataIndex === 'updated_at'">
            {{ formatDate(record.updated_at) }}
          </template>
          
          <!-- 操作列 -->
          <template v-if="column.dataIndex === 'action'">
            <a-space class="table-row-actions">
              <a-button type="text" size="small" class="row-action row-action--primary" @click="editDynamic(record)">
                <EditOutlined />
                编辑
              </a-button>
              <a-button type="text" size="small" class="row-action" @click="viewDetail(record)">
                <EyeOutlined />
                查看
              </a-button>
              <a-popconfirm
                title="确定要删除这条动态吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleDelete(record.id)"
              >
                <a-button type="text" danger size="small" class="row-action row-action--danger">
                  <DeleteOutlined />
                  删除
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
        </a-table>
      </div>
    </a-card>
    
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { 
  PlusOutlined, 
  EditOutlined, 
  EyeOutlined, 
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined
} from '@ant-design/icons-vue'
import { getDynamicList, deleteDynamic as deleteAdminDynamic } from '@/api/dynamic'
import { getCategoryList } from '@/api/category'
import { getTagList } from '@/api/tag'
import PageHeader from '@/components/common/PageHeader.vue'

const router = useRouter()
const loading = ref(false)
const dynamicList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const responsive = ref(false)
const deleting = ref(false)
const requestError = ref(false)

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
  title: '',
  categoryId: undefined,
  tagIds: [],
  status: undefined,
  type: undefined
})

// 获取动态列表
const fetchDynamics = async () => {
  try {
    loading.value = true;
    requestError.value = false;
    
    // 构造搜索参数
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      type: searchForm.type,
      status: searchForm.status,
      content: searchForm.content?.trim(),
      title: searchForm.title?.trim(),  // 确保标题搜索参数正确传递
      categoryId: searchForm.categoryId,
      tagIds: searchForm.tagIds
    };

    // 移除空值参数
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === null || params[key] === '') {
        delete params[key];
      }
    });
    
    const { count = 0, results = [] } = (await getDynamicList(params)) || {}
    dynamicList.value = results.map(item => ({
      ...item,
      mediaUrls: item.mediaUrls || [],
      category: item.category || null,
      like_count: item.like_count ?? item.likes ?? 0,
      title: item.title || '无标题'
    }))
    total.value = count
  } catch (error) {
    console.error('获取动态列表失败:', error);
    dynamicList.value = [];
    total.value = 0;
    requestError.value = true;
    message.error('获取动态列表失败');
  } finally {
    loading.value = false;
  }
}

// 处理搜索
const handleSearch = () => {
  // 重置页码
  currentPage.value = 1;
  selectedRowKeys.value = []
  // 重新获取数据
  return fetchDynamics();
}

// 重置搜索
const resetSearch = () => {
  // 重置搜索表单
  searchForm.content = '';
  searchForm.title = '';
  searchForm.categoryId = undefined;
  searchForm.tagIds = [];
  searchForm.status = undefined;
  searchForm.type = undefined;
  // 重置页码
  currentPage.value = 1;
  selectedRowKeys.value = []
  // 重新获取数据
  return fetchDynamics();
}

// 处理批量删除
const handleBatchDelete = async () => {
  if (!selectedRowKeys.value.length) {
    message.warning('请选择要删除的动态')
    return
  }

  try {
    deleting.value = true
    await Promise.all(selectedRowKeys.value.map(id => deleteAdminDynamic(id)))
    message.success('批量删除成功')
    selectedRowKeys.value = []
    await fetchDynamics()
  } catch (error) {
    console.error('批量删除失败:', error)
    message.error('批量删除失败，请重试')
  } finally {
    deleting.value = false
  }
}

// 表格列定义
const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 60,
    align: 'center'
  },
  {
    title: '标题',
    dataIndex: 'title',
    key: 'title',
    width: 200,
    ellipsis: true,
    customRender: ({ text }) => text || '无标题'
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    width: 100,
    align: 'center',
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
    dataIndex: 'category',
    key: 'category',
    width: 120,
    align: 'center'
  },
  {
    title: '标签',
    dataIndex: 'tags',
    key: 'tags',
    width: 200
  },
  {
    title: '点赞数',
    dataIndex: 'like_count',
    key: 'like_count',
    width: 100,
    align: 'center',
    sorter: (a, b) => a.like_count - b.like_count
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    align: 'center',
    filters: [
      { text: '草稿', value: 'draft' },
      { text: '已发布', value: 'published' }
    ],
    onFilter: (value, record) => record.status === value
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 160,
    align: 'center',
    sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at)
  },
  {
    title: '更新时间',
    dataIndex: 'updated_at',
    key: 'updated_at',
    width: 160,
    align: 'center',
    sorter: (a, b) => new Date(a.updated_at) - new Date(b.updated_at)
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

// 移动端优化的列定义
const columnsForMobile = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 60,
    align: 'center'
  },
  {
    title: '标题',
    dataIndex: 'title',
    key: 'title',
    width: 180,
    ellipsis: true,
    customRender: ({ text }) => text || '无标题'
  },
  {
    title: '分类',
    dataIndex: 'category',
    key: 'category',
    width: 110,
    align: 'center'
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 95,
    align: 'center'
  },
  {
    title: '操作',
    dataIndex: 'action',
    key: 'action',
    fixed: 'right',
    width: 120,
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
  buildOptionText: ({ value }) => `${value}/页`,
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

// 获取分类列表
const fetchCategories = async () => {
  try {
    const { results = [] } = (await getCategoryList()) || {}
    categories.value = results
  } catch (error) {
    console.error('获取分类列表失败:', error)
    message.error('获取分类列表失败')
    categories.value = []
  }
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

// 获取标签列表
const fetchTags = async () => {
  try {
    const { results = [] } = (await getTagList()) || {}
    tags.value = results
  } catch (error) {
    console.error('获取标签列表失败:', error)
    message.error('获取标签列表失败')
    tags.value = []
  }
}

// 表格变化处理
const handleTableChange = (pagination, filters, sorter) => {
  // 更新分页信息
  if (pagination) {
    currentPage.value = pagination.current;
    pageSize.value = pagination.pageSize;
    selectedRowKeys.value = []
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
  router.push({ name: 'CreateDynamic' }).catch(() => {
    message.error('页面跳转失败，请稍后重试')
  })
}

// 查看动态详情
const viewDetail = (record) => {
  router.push({
    name: 'PreviewDynamic',
    params: { id: record.id }
  })
}

// 编辑动态
const editDynamic = (record) => {
  router.push(`/dashboard/dynamics/edit/${record.id}`)
}

// 删除动态
const handleDelete = async (id) => {
  if (deleting.value) return
  try {
    deleting.value = true
    await deleteAdminDynamic(id)
    message.success('删除成功')
    await fetchDynamics()
  } catch (error) {
    console.error('删除动态失败:', error)
    message.error('删除失败，请重试')
  } finally {
    deleting.value = false
  }
}

// 检测设备尺寸
const checkResponsive = () => {
  responsive.value = window.innerWidth < 768
}

// 在组件挂载时获取数据
onMounted(async () => {
  // 先获取分类数据
  await fetchCategories();
  // 然后获取动态列表
  await fetchDynamics();
  // 最后获取标签数据
  await fetchTags();
  
  // 检测响应式
  checkResponsive()
  window.addEventListener('resize', checkResponsive)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkResponsive)
})
</script>

<style scoped lang="scss">
.content-table-scroll {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  contain: inline-size;
  box-sizing: border-box;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}

.dynamic-empty {
  display: grid;
  min-height: 220px;
  place-content: center;
  justify-items: center;
  gap: 8px;
  color: var(--color-text-muted);
  text-align: center;
}

.dynamic-empty strong { color: var(--color-text); }
.dynamic-empty .ant-btn { margin-top: 8px; }

:deep(.content-table-scroll .ant-table-tbody > tr > td) { vertical-align: middle; }

:deep(.content-table-scroll .ant-table) {
  min-width: 1120px;
}

:deep(.content-table-scroll .ant-table-container),
:deep(.content-table-scroll .ant-table-content) {
  overflow-x: visible !important;
}

// 添加代码高亮样式
:deep(.hljs) {
  display: block;
  overflow-x: auto;
  padding: 0.5em;
  background: #1e1e1e;
  color: #d4d4d4;
}

:deep(.hljs-keyword),
:deep(.hljs-selector-tag),
:deep(.hljs-literal),
:deep(.hljs-name),
:deep(.hljs-strong) {
  color: #569cd6;
}

:deep(.hljs-code) {
  color: #d4d4d4;
}

:deep(.hljs-class .hljs-title) {
  color: #4ec9b0;
}

:deep(.hljs-attribute),
:deep(.hljs-symbol),
:deep(.hljs-regexp),
:deep(.hljs-link) {
  color: #d16969;
}

:deep(.hljs-string),
:deep(.hljs-bullet),
:deep(.hljs-subst),
:deep(.hljs-title),
:deep(.hljs-section),
:deep(.hljs-emphasis),
:deep(.hljs-type),
:deep(.hljs-built_in),
:deep(.hljs-builtin-name),
:deep(.hljs-selector-attr),
:deep(.hljs-selector-pseudo),
:deep(.hljs-addition),
:deep(.hljs-variable),
:deep(.hljs-template-variable) {
  color: #ce9178;
}

:deep(.hljs-comment),
:deep(.hljs-quote),
:deep(.hljs-deletion) {
  color: #6a9955;
}

:deep(.hljs-keyword),
:deep(.hljs-selector-tag),
:deep(.hljs-literal),
:deep(.hljs-doctag),
:deep(.hljs-title),
:deep(.hljs-section),
:deep(.hljs-type),
:deep(.hljs-selector-id) {
  font-weight: bold;
}

:deep(.hljs-emphasis) {
  font-style: italic;
}

:deep(.hljs-attribute),
:deep(.hljs-symbol),
:deep(.hljs-regexp),
:deep(.hljs-link) {
  color: #d16969;
}

:deep(.hljs-number),
:deep(.hljs-literal) {
  color: #b5cea8;
}

:deep(.hljs-tag),
:deep(.hljs-name),
:deep(.hljs-selector-tag) {
  color: #569cd6;
}

:deep(.hljs-attr) {
  color: #9cdcfe;
}

@media (max-width: 992px) {
  .dynamic-list .admin-filter {
    gap: 10px;
    padding: 12px;
  }

  .dynamic-list .admin-filter .search-form-left,
  .dynamic-list .admin-filter .search-form-right {
    display: grid;
    flex: 0 0 auto;
    width: 100%;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .dynamic-list .admin-filter .ant-form-item {
    display: flex;
    width: 100%;
    margin: 0;
    align-items: stretch;
    flex-direction: column;
  }

  .dynamic-list .admin-filter .search-form-right .ant-form-item:last-child {
    grid-column: 1 / -1;
  }

  .dynamic-list .admin-filter :deep(.ant-form-item-label) {
    padding: 0 0 4px;
    text-align: left;
  }

  .dynamic-list .admin-filter :deep(.ant-input),
  .dynamic-list .admin-filter :deep(.ant-input-affix-wrapper),
  .dynamic-list .admin-filter :deep(.ant-select),
  .dynamic-list .admin-filter :deep(.ant-select-selector) {
    width: 100% !important;
    min-width: 0 !important;
  }
}
</style>
