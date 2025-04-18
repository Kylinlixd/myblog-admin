<template>
  <div class="dynamic-list">
    <PageHeader title="动态管理" icon="Promotion">
      <template #actions>
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>新建动态
        </el-button>
      </template>
    </PageHeader>

    <!-- 搜索表单 -->
    <SearchForm :form="searchForm" @search="handleSearch" @reset="handleReset">
      <el-form-item label="内容">
        <el-input
          v-model="searchForm.keyword"
          placeholder="请输入内容关键词"
          clearable
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item label="类型">
        <el-select v-model="searchForm.type" placeholder="请选择类型" clearable>
          <el-option label="文本" value="text" />
          <el-option label="图片" value="image" />
          <el-option label="音频" value="audio" />
          <el-option label="视频" value="video" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
          <el-option label="草稿" value="draft" />
          <el-option label="已发布" value="published" />
        </el-select>
      </el-form-item>
    </SearchForm>

    <!-- 动态列表 -->
    <DataTable
      :data="dynamicList"
      :columns="columns"
      :loading="loading"
      row-key="id"
    >
      <template #content="{ row }">
        <div class="content-cell">
          <template v-if="row.type === 'text'">
            <div class="text-content">{{ row.content }}</div>
          </template>
          <template v-else-if="row.type === 'image'">
            <el-image
              v-for="(img, index) in row.images"
              :key="index"
              :src="img.url"
              :preview-src-list="row.images.map(i => i.url)"
              fit="cover"
              lazy
              class="preview-image"
            />
          </template>
          <template v-else-if="row.type === 'audio'">
            <audio
              v-if="row.audio"
              :src="row.audio.url"
              controls
              class="preview-audio"
            />
          </template>
          <template v-else-if="row.type === 'video'">
            <video
              v-if="row.video"
              :src="row.video.url"
              :poster="row.video.cover"
              controls
              class="preview-video"
            />
          </template>
        </div>
      </template>

      <template #type="{ row }">
        <el-tag :type="getTypeTag(row.type)">{{ getTypeText(row.type) }}</el-tag>
      </template>

      <template #status="{ row }">
        <el-tag :type="row.status === 'published' ? 'success' : 'info'">
          {{ row.status === 'published' ? '已发布' : '草稿' }}
        </el-tag>
      </template>

      <template #actions="{ row }">
        <el-button-group>
          <el-button type="primary" link @click="handleEdit(row)">
            <el-icon><Edit /></el-icon>编辑
          </el-button>
          <el-button type="primary" link @click="handlePreview(row)">
            <el-icon><View /></el-icon>预览
          </el-button>
          <el-button type="danger" link @click="handleDelete(row)">
            <el-icon><Delete /></el-icon>删除
          </el-button>
        </el-button-group>
      </template>
    </DataTable>

    <!-- 分页 -->
    <Pagination
      :total="total"
      :current-page="currentPage"
      :page-size="pageSize"
      @current-change="handleCurrentChange"
      @size-change="handleSizeChange"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, View, Delete, Promotion } from '@element-plus/icons-vue'
import { getDynamicList, deleteDynamic } from '../../api/dynamic'

// 导入通用组件
import DataTable from '../../components/common/DataTable.vue'
import Pagination from '../../components/common/Pagination.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import SearchForm from '../../components/common/SearchForm.vue'

const router = useRouter()
const loading = ref(false)
const dynamicList = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 表格列配置
const columns = [
  { label: '内容', prop: 'content', slot: 'content', width: '300px' },
  { label: '类型', prop: 'type', slot: 'type', width: '100px' },
  { label: '状态', prop: 'status', slot: 'status', width: '100px' },
  { label: '创建时间', prop: 'createdAt', width: '180px' },
  { label: '操作', slot: 'actions', width: '200px', fixed: 'right' }
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
    const response = await getDynamicList({
      page: currentPage.value,
      pageSize: pageSize.value,
      ...searchForm
    })
    if (response.code === 200) {
      dynamicList.value = response.data.list || []
      total.value = response.data.total || 0
    } else {
      ElMessage.error(response.message || '获取动态列表失败')
    }
  } catch (error) {
    console.error('获取动态列表失败:', error)
    ElMessage.error('获取动态列表失败')
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
  // 搜索表单组件会自动重置表单
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
  ElMessageBox.confirm(
    '确定要删除这条动态吗？',
    '提示',
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
      console.error('删除动态失败:', error)
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
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

// 获取类型标签
const getTypeTag = (type) => {
  const tags = {
    text: '',
    image: 'success',
    audio: 'warning',
    video: 'danger'
  }
  return tags[type] || ''
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

onMounted(() => {
  fetchDynamicList()
})
</script>

<style lang="scss" scoped>
.dynamic-list {
  padding: 20px;
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
  width: 100px;
  height: 100px;
  margin-right: 10px;
  object-fit: cover;
}

.preview-audio,
.preview-video {
  width: 100%;
  max-width: 300px;
}
</style>