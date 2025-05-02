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
    
    <a-card class="data-card">
      <a-table
        :loading="loading"
        :columns="responsive ? columnsForMobile : columns"
        :data-source="dynamicList"
        :pagination="paginationConfig"
        :scroll="responsive ? { x: 800 } : {}"
        row-key="id"
        bordered
      >
        <template #bodyCell="{ column, record }">
          <!-- 内容列 -->
          <template v-if="column.dataIndex === 'content'">
            <div class="content-cell">{{ record.content }}</div>
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
            <template v-if="record.categoryId">
              <a-tag color="cyan">
                {{ getCategoryName(record.categoryId) }}
              </a-tag>
            </template>
            <template v-else>
              <span class="text-muted">未分类</span>
            </template>
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
            <a-tag :color="record.status === 'published' ? 'green' : 'orange'">
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
import { ref, computed, onMounted, onUnmounted, h, resolveComponent } from 'vue'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { 
  PlusOutlined, 
  EditOutlined, 
  EyeOutlined, 
  DeleteOutlined, 
  SoundOutlined,
  VideoCameraOutlined
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
    
    if (res && res.code === 200) {
      // 检查响应数据结构
      // 新的API响应结构是 {code:200, message:'success', data:{total:0, items:[]}}
      if (res.data && typeof res.data === 'object') {
        if (res.data.items !== undefined) {
          // 标准返回格式
          dynamicList.value = res.data.items || [];
          total.value = res.data.total || 0;
          console.log('已获取动态列表, 总数:', total.value);
        } else if (Array.isArray(res.data)) {
          // 数组格式返回
          dynamicList.value = res.data || [];
          total.value = res.data.length || 0;
          console.log('已获取动态列表(数组格式), 总数:', total.value);
        } else {
          // 其他可能的格式
          const possibleItems = res.data.list || res.data.data || res.data.records || [];
          dynamicList.value = possibleItems;
          total.value = res.data.total || res.data.totalCount || res.data.count || possibleItems.length || 0;
          console.log('已获取动态列表(其他格式), 总数:', total.value);
        }
      } else {
        console.warn('API返回数据格式异常:', res);
        dynamicList.value = [];
        total.value = 0;
      }
    } else {
      console.warn('API响应不成功:', res);
      dynamicList.value = [];
      total.value = 0;
    }
  } catch (error) {
    console.error('获取动态列表失败:', error);
    message.error('获取动态列表失败');
    console.warn('检查后端服务是否开启');
    dynamicList.value = [];
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

<style scoped>
.dynamic-list {
  padding: 20px;
}

.data-card {
  margin-top: 16px;
}

.content-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.text-muted {
  color: #999;
}

/* 移动端样式 */
@media screen and (max-width: 768px) {
  .dynamic-list {
    padding: 12px;
  }
}
</style>