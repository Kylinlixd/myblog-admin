<template>
  <div class="dynamic-list">
    <div class="page-header">
      <h2>动态管理</h2>
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>新建动态
      </el-button>
    </div>
    
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm" class="filter-form" @submit.prevent="handleSearch">
        <el-form-item label="内容">
          <el-input
            v-model="filterForm.keyword"
            placeholder="请输入内容关键词"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="类型">
          <el-select v-model="filterForm.type" placeholder="请选择类型" clearable>
            <el-option label="图文" value="image" />
            <el-option label="视频" value="video" />
            <el-option label="音频" value="audio" />
            <el-option label="纯文本" value="text" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="请选择状态" clearable>
            <el-option label="已发布" value="published" />
            <el-option label="草稿" value="draft" />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <el-card class="table-card">
      <div class="table-wrapper">
        <el-table
          v-loading="loading"
          :data="dynamicList"
          style="width: 100%"
          border
        >
          <el-table-column prop="content" label="内容" min-width="200" show-overflow-tooltip />
          
          <el-table-column label="类型" width="120">
            <template #default="scope">
              <el-tag :type="getTypeTagType(scope.row.type)">
                {{ getTypeText(scope.row.type) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="媒体" width="180">
            <template #default="scope">
              <div v-if="scope.row.images && scope.row.images.length" class="media-preview">
                <el-image
                  v-for="(img, index) in scope.row.images.slice(0, 3)"
                  :key="index"
                  :src="img.url"
                  :preview-src-list="scope.row.images.map(i => i.url)"
                  fit="cover"
                  class="preview-image"
                />
                <span v-if="scope.row.images.length > 3" class="more-count">
                  +{{ scope.row.images.length - 3 }}
                </span>
              </div>
              <div v-else-if="scope.row.video" class="media-preview">
                <el-image
                  :src="scope.row.video.cover"
                  fit="cover"
                  class="preview-image"
                />
              </div>
              <div v-else-if="scope.row.audio" class="media-preview">
                <el-icon><i-ep-headset /></el-icon>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="状态" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.status === 'published' ? 'success' : 'info'">
                {{ scope.row.status === 'published' ? '已发布' : '草稿' }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="createTime" label="创建时间" width="180">
            <template #default="scope">
              {{ formatTime(scope.row.createTime) }}
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button-group>
                <el-button
                  type="primary"
                  size="small"
                  @click="handleEdit(row)"
                >
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
                <el-button
                  type="danger"
                  size="small"
                  @click="handleDelete(row)"
                >
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
                <el-button
                  type="info"
                  size="small"
                  @click="handlePreview(row)"
                >
                  <el-icon><View /></el-icon>
                  预览
                </el-button>
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          prev-text="上一页"
          next-text="下一页"
          size="small"
          background
        />
      </div>
    </el-card>
    
    <!-- 预览对话框 -->
    <el-dialog
      v-model="previewVisible"
      title="动态预览"
      width="70%"
      destroy-on-close
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="preview-wrapper">
        <div class="preview-content">
          <!-- Markdown内容 -->
          <div v-if="previewDynamic.content" class="markdown-content" v-html="renderMarkdown(previewDynamic.content)"></div>
          
          <!-- 图片展示 -->
          <div v-if="previewDynamic.images && previewDynamic.images.length" class="image-gallery">
            <el-image
              v-for="(img, index) in previewDynamic.images"
              :key="index"
              :src="img.url"
              :preview-src-list="previewDynamic.images.map(i => i.url)"
              fit="cover"
              class="gallery-image"
            />
          </div>
          
          <!-- 音频播放器 -->
          <div v-if="previewDynamic.audio" class="audio-player">
            <audio controls :src="previewDynamic.audio.url" class="audio-element">
              您的浏览器不支持音频播放
            </audio>
          </div>
          
          <!-- 视频播放器 -->
          <div v-if="previewDynamic.video" class="video-player">
            <video
              controls
              :src="previewDynamic.video.url"
              :poster="previewDynamic.video.cover"
              class="video-element"
            >
              您的浏览器不支持视频播放
            </video>
          </div>
        </div>
        <div class="preview-meta">
          <span class="preview-time">{{ formatTime(previewDynamic.createTime) }}</span>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="previewVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Plus, Search, Refresh, Edit, View, Delete 
} from '@element-plus/icons-vue'
import { getDynamicList, deleteDynamic } from '../../api/blog'
import { useAppStore } from '@/stores/app'
import MarkdownIt from 'markdown-it'
import dayjs from 'dayjs'

const router = useRouter()
const appStore = useAppStore()

// 创建Markdown渲染器
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})

// 数据加载状态
const loading = ref(false)

// 数据列表
const dynamicList = ref([])

// 分页相关
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 筛选表单
const filterForm = reactive({
  keyword: '',
  type: '',
  status: ''
})

// 预览相关
const previewVisible = ref(false)
const previewDynamic = ref({})

// 格式化时间
const formatTime = (time) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

// 获取类型标签样式
const getTypeTagType = (type) => {
  const types = {
    image: 'success',
    video: 'warning',
    audio: 'info',
    text: ''
  }
  return types[type] || ''
}

// 获取类型文本
const getTypeText = (type) => {
  const types = {
    image: '图文',
    video: '视频',
    audio: '音频',
    text: '纯文本'
  }
  return types[type] || type
}

// 渲染Markdown内容
const renderMarkdown = (content) => {
  return md.render(content || '')
}

// 获取动态列表
const fetchDynamicList = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: filterForm.keyword || undefined,
      type: filterForm.type || undefined,
      status: filterForm.status || undefined
    }
    const response = await getDynamicList(params)
    if (response.code === 200) {
      dynamicList.value = response.data.items
      total.value = response.data.total
    } else {
      ElMessage.error(response.message || '获取动态列表失败')
    }
  } catch (error) {
    ElMessage.error('获取动态列表失败')
    console.error('获取动态列表失败:', error)
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
  filterForm.keyword = ''
  filterForm.type = ''
  filterForm.status = ''
  handleSearch()
}

// 创建
const handleCreate = () => {
  router.push('/dashboard/dynamics/create')
}

// 编辑
const handleEdit = (row) => {
  router.push(`/dashboard/dynamics/edit/${row.id}`)
}

// 删除
const handleDelete = (row) => {
  ElMessageBox.confirm(
    '确定要删除这条动态吗？',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const response = await deleteDynamic(row.id)
      if (response.code === 200) {
        ElMessage.success('删除成功')
        fetchDynamicList()
      } else {
        ElMessage.error(response.message || '删除失败')
      }
    } catch (error) {
      ElMessage.error('删除失败')
      console.error('删除动态失败:', error)
    }
  }).catch(() => {})
}

// 预览
const handlePreview = (row) => {
  previewDynamic.value = row
  previewVisible.value = true
}

// 分页大小改变
const handleSizeChange = (val) => {
  pageSize.value = val
  fetchDynamicList()
}

// 页码改变
const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchDynamicList()
}

// 初始化
onMounted(() => {
  fetchDynamicList()
})
</script>

<style scoped>
.dynamic-list {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.table-card {
  margin-bottom: 20px;
}

.table-wrapper {
  margin-bottom: 20px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
}

.media-preview {
  display: flex;
  align-items: center;
  gap: 5px;
}

.preview-image {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  cursor: pointer;
}

.more-count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.preview-wrapper {
  padding: 20px;
}

.preview-content {
  margin-bottom: 20px;
}

.markdown-content {
  margin-bottom: 15px;
}

.image-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
  margin: 15px 0;
}

.gallery-image {
  width: 100%;
  height: 200px;
  border-radius: 4px;
  cursor: pointer;
}

.audio-player,
.video-player {
  margin: 15px 0;
}

.audio-element,
.video-element {
  width: 100%;
  border-radius: 4px;
}

.preview-meta {
  display: flex;
  justify-content: flex-end;
  color: var(--el-text-color-secondary);
  font-size: 0.9em;
}
</style>