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
      <div class="search-form-left">
        <a-form-item label="标题">
          <a-input v-model:value="searchForm.title" placeholder="搜索标题" allowClear />
        </a-form-item>
        <a-form-item label="内容">
          <a-input v-model:value="searchForm.content" placeholder="搜索内容" allowClear />
        </a-form-item>
        <a-form-item label="分类">
          <a-select
            v-model:value="searchForm.categoryId"
            placeholder="选择分类"
            style="width: 120px"
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
            style="width: 200px"
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
            style="width: 100px"
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
            style="width: 100px"
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
    <div class="table-operations">
      <a-space size="middle">
        <a-button type="primary" @click="navigateToCreate">
          <PlusOutlined /> 新建动态
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
      v-model:open="previewVisible"
      :title="previewTitle"
      :footer="null"
      width="800px"
      @cancel="previewVisible = false"
    >
      <div class="media-preview-container">
        <img
          v-if="previewType === 'image'"
          :src="previewUrl"
          alt="预览"
          style="width: 100%; max-height: 600px; object-fit: contain;"
        />
        <audio
          v-if="previewType === 'audio'"
          :src="previewUrl"
          controls
          style="width: 100%"
        ></audio>
        <video
          v-if="previewType === 'video'"
          :src="previewUrl"
          controls
          style="width: 100%; max-height: 600px;"
        ></video>
      </div>
    </a-modal>

    <!-- 动态预览对话框 -->
    <a-modal
      v-model:open="detailVisible"
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
              <a-tag color="blue">{{ getCategoryName(currentDetail.category) }}</a-tag>
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
    
    console.log('获取动态列表参数:', params);
    const response = await getDynamicList(params);
    console.log('获取动态列表响应:', response);
    
    if (response && response.code === 200 && response.data) {
      dynamicList.value = response.data.items.map(item => ({
        ...item,
        mediaUrls: item.mediaUrls || [],
        category: item.category || null,
        like_count: item.likes || 0,
        title: item.title || '无标题'
      }));
      total.value = response.data.total || 0;
      console.log('处理后的动态列表:', dynamicList.value);
    } else {
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
  // 重置页码
  currentPage.value = 1;
  // 重新获取数据
  fetchDynamics();
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
    title: '内容',
    dataIndex: 'content',
    key: 'content',
    ellipsis: true,
    width: 300
  },
  {
    title: '媒体文件',
    dataIndex: 'mediaUrls',
    key: 'mediaUrls',
    width: 120,
    align: 'center',
    customRender: ({ record }) => {
      if (!record.mediaUrls || record.mediaUrls.length === 0) {
        return '-';
      }

      const media = record.mediaUrls[0]; // 获取第一个媒体文件
      const type = record.type;

      if (type === 'image') {
        return h('div', { class: 'media-preview' }, [
          h('img', {
            src: media.url || media.file_url,
            alt: media.name,
            style: {
              width: '50px',
              height: '50px',
              objectFit: 'cover',
              cursor: 'pointer'
            },
            onClick: () => previewMedia('image', media.url || media.file_url)
          })
        ]);
      }

      if (type === 'audio') {
        return h('div', { class: 'media-preview' }, [
          h(SoundOutlined, {
            style: {
              fontSize: '24px',
              color: '#1890ff',
              cursor: 'pointer'
            },
            onClick: () => previewMedia('audio', media.url || media.file_url)
          })
        ]);
      }

      if (type === 'video') {
        return h('div', { class: 'media-preview' }, [
          h(VideoCameraOutlined, {
            style: {
              fontSize: '24px',
              color: '#1890ff',
              cursor: 'pointer'
            },
            onClick: () => previewMedia('video', media.url || media.file_url)
          })
        ]);
      }

      return '-';
    }
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
    const response = await getCategoryList()
    
    if (response && response.results) {
      // 处理 {count: number, results: Array} 格式
      categories.value = response.results
    } else if (response && response.code === 200 && response.data) {
      categories.value = response.data.items || []
    } else if (Array.isArray(response)) {
      categories.value = response
    } else if (response && response.data) {
      categories.value = Array.isArray(response.data) ? response.data : [response.data]
    } else {
      categories.value = []
    }
  } catch (error) {
    console.error('获取分类列表失败:', error)
    message.error('获取分类列表失败')
    categories.value = []
  }
}

// 获取分类名称
const getCategoryName = (category) => {
  if (!category) return '未分类';
  return category.name || '未分类';
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
  previewType.value = type;
  previewUrl.value = url;
  previewTitle.value = type === 'image' ? '图片预览' : type === 'audio' ? '音频预览' : '视频预览';
  previewVisible.value = true;
}

// 获取标签列表
const fetchTags = async () => {
  try {
    const response = await getTagList()
    
    if (response && response.results) {
      tags.value = response.results
    } else if (Array.isArray(response)) {
      tags.value = response
    } else if (response && response.data) {
      tags.value = Array.isArray(response.data) ? response.data : [response.data]
    } else {
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
    }).catch(err => {
      // 尝试使用路径跳转
      router.push({
        path: '/dashboard/dynamics/create',
        query: { token: accessToken }
      }).catch(err => {
        message.error('页面跳转失败，请检查路由配置')
      })
    })
  } catch (error) {
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
.dynamic-list {
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
    padding: 16px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
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

  .content-cell {
    max-width: 300px;
    
    .content-text {
      margin-bottom: 8px;
      word-break: break-word;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .media-preview {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }
  }

  .search-form {
    margin-bottom: 24px;
    padding: 24px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    
    .search-form-left {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 16px;
      
      .ant-form-item {
        margin-bottom: 0;
        margin-right: 0;
      }
    }
    
    .search-form-right {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: flex-start;
      
      .ant-form-item {
        margin-bottom: 0;
        margin-right: 0;
      }
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

.dynamic-detail {
  .detail-header {
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid #f0f0f0;
    
    .detail-title {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      
      .detail-time {
        color: #8c8c8c;
        font-size: 14px;
      }
    }
  }
  
  .detail-content {
    margin-bottom: 24px;
    
    .content-text {
      font-size: 15px;
      line-height: 1.6;
      margin-bottom: 16px;
      white-space: pre-wrap;
      word-break: break-word;
      color: #262626;
      background-color: #f8f9fa;
      padding: 16px;
      border-radius: 4px;
      border: 1px solid #e9ecef;

      :deep(pre) {
        background-color: #1a1a1a !important;
        padding: 16px;
        border-radius: 4px;
        overflow-x: auto;
        margin: 16px 0;
        border: 1px solid #333;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

        code {
          color: #ffffff !important;
          font-family: 'Consolas', 'Monaco', monospace;
          font-size: 14px;
          line-height: 1.6;
          text-shadow: none;
        }
      }

      :deep(.hljs) {
        background: #1a1a1a !important;
        color: #ffffff !important;
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
        color: #ffeb3b !important;
        font-weight: 700 !important;
        text-shadow: 0 0 1px rgba(255, 235, 59, 0.5);
      }

      :deep(.language-json) {
        .hljs-string {
          color: #ffeb3b !important;
          font-weight: 700 !important;
          text-shadow: 0 0 1px rgba(255, 235, 59, 0.5);
        }

        .hljs-property {
          color: #64b5f6 !important;
          font-weight: 700 !important;
        }

        .hljs-number {
          color: #ffb74d !important;
          font-weight: 700 !important;
        }

        .hljs-literal {
          color: #f48fb1 !important;
          font-weight: 700 !important;
        }
      }
    }
    
    .media-content {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
      
      .ant-image {
        border-radius: 4px;
        overflow: hidden;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        
        img {
          width: 100%;
          height: 200px;
          object-fit: cover;
        }
      }

      audio, video {
        width: 100%;
        border-radius: 4px;
      }
    }
  }
  
  .detail-footer {
    border-top: 1px solid #f0f0f0;
    padding-top: 16px;
    
    .detail-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      
      .meta-item {
        display: flex;
        align-items: center;
        gap: 8px;
        
        .meta-label {
          color: #8c8c8c;
          font-size: 14px;
        }
      }
    }
  }
}

:global(.ant-modal-content) {
  .ant-modal-body {
    padding: 24px;
    max-height: 80vh;
    overflow-y: auto;
    background-color: #ffffff;

    pre {
      background-color: #1a1a1a !important;
      padding: 16px;
      border-radius: 4px;
      overflow-x: auto;
      margin: 16px 0;
      border: 1px solid #333;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

      code {
        color: #ffffff !important;
        font-family: 'Consolas', 'Monaco', monospace;
        font-size: 14px;
        line-height: 1.6;
      }
    }

    .hljs {
      background: #1a1a1a !important;
      color: #ffffff !important;
    }

    .hljs-string,
    .hljs-bullet,
    .hljs-subst,
    .hljs-title,
    .hljs-section,
    .hljs-emphasis,
    .hljs-type,
    .hljs-built_in,
    .hljs-builtin-name,
    .hljs-selector-attr,
    .hljs-selector-pseudo,
    .hljs-addition,
    .hljs-variable,
    .hljs-template-variable {
      color: #ffeb3b !important;
      font-weight: 700 !important;
      text-shadow: 0 0 1px rgba(255, 235, 59, 0.5);
    }

    .language-json {
      .hljs-string {
        color: #ffeb3b !important;
        font-weight: 700 !important;
        text-shadow: 0 0 1px rgba(255, 235, 59, 0.5);
      }

      .hljs-property {
        color: #64b5f6 !important;
        font-weight: 700 !important;
      }

      .hljs-number {
        color: #ffb74d !important;
        font-weight: 700 !important;
      }

      .hljs-literal {
        color: #f48fb1 !important;
        font-weight: 700 !important;
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

.media-preview {
  display: flex;
  justify-content: center;
  align-items: center;
  
  img {
    border-radius: 4px;
    transition: transform 0.3s;
    
    &:hover {
      transform: scale(1.05);
    }
  }
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
</style>