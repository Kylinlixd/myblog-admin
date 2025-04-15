<template>
  <div class="dynamic-list">
    <div class="list-header">
      <h2>动态管理</h2>
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>新建动态
      </el-button>
    </div>

    <!-- 搜索表单 -->
    <el-card class="filter-card">
      <el-form :model="filterForm" inline>
        <el-form-item label="内容">
          <el-input
            v-model="filterForm.content"
            placeholder="请输入内容关键词"
            clearable
          />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="filterForm.type" placeholder="请选择类型" clearable>
            <el-option label="纯文本" value="text" />
            <el-option label="图文" value="image" />
            <el-option label="音频" value="audio" />
            <el-option label="视频" value="video" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="请选择状态" clearable>
            <el-option label="草稿" value="draft" />
            <el-option label="已发布" value="published" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 动态列表 -->
    <el-card class="list-card">
      <el-table
        :data="dynamicList"
        v-loading="loading"
        style="width: 100%"
      >
        <el-table-column prop="content" label="内容" min-width="300">
          <template #default="{ row }">
            <div class="content-cell">
              <div class="content-text" v-if="row.type === 'text'">
                {{ row.content }}
              </div>
              <div v-else-if="row.type === 'image'" class="content-images">
                <el-image
                  v-for="(img, index) in row.images"
                  :key="index"
                  :src="img.url"
                  :preview-src-list="row.images.map(i => i.url)"
                  fit="cover"
                  class="content-image"
                />
              </div>
              <div v-else-if="row.type === 'audio'" class="content-audio">
                <audio controls :src="row.audio.url" class="audio-element">
                  您的浏览器不支持音频播放
                </audio>
              </div>
              <div v-else-if="row.type === 'video'" class="content-video">
                <video
                  controls
                  :src="row.video.url"
                  :poster="row.video.cover"
                  class="video-element"
                >
                  您的浏览器不支持视频播放
                </video>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)">
              {{ getTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'published' ? 'success' : 'info'">
              {{ row.status === 'published' ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button-group>
              <el-button
                type="primary"
                size="small"
                @click="handleEdit(row)"
              >
                编辑
              </el-button>
              <el-button
                type="success"
                size="small"
                @click="handlePreview(row)"
              >
                预览
              </el-button>
              <el-button
                type="danger"
                size="small"
                @click="handleDelete(row)"
              >
                删除
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getDynamicList, deleteDynamic } from '../../api/blog'
import dayjs from 'dayjs'

const router = useRouter()

// 搜索表单
const filterForm = ref({
  content: '',
  type: '',
  status: ''
})

// 列表数据
const dynamicList = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

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

// 格式化时间
const formatTime = (time) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

// 获取动态列表
const fetchDynamicList = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      ...filterForm.value
    }
    const response = await getDynamicList(params)
    dynamicList.value = response.items
    total.value = response.total
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
  filterForm.value = {
    content: '',
    type: '',
    status: ''
  }
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
    '确定要删除这条动态吗？删除后无法恢复。',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await deleteDynamic(row.id)
      ElMessage.success('删除成功')
      fetchDynamicList()
    } catch (error) {
      ElMessage.error('删除失败')
      console.error('删除失败:', error)
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

// 初始化
onMounted(() => {
  fetchDynamicList()
})
</script>

<style scoped>
.dynamic-list {
  padding: 20px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.list-card {
  margin-bottom: 20px;
}

.content-cell {
  padding: 10px 0;
}

.content-text {
  white-space: pre-wrap;
  word-break: break-all;
}

.content-images {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.content-image {
  width: 100px;
  height: 100px;
  border-radius: 4px;
  cursor: pointer;
}

.content-audio,
.content-video {
  width: 100%;
}

.audio-element,
.video-element {
  width: 100%;
  border-radius: 4px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style> 