<template>
  <div class="post-list">
    <div class="page-header">
      <h2>文章管理</h2>
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>新建文章
      </el-button>
    </div>
    
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm" class="filter-form" @submit.prevent="handleSearch">
        <el-form-item label="标题">
          <el-input
            v-model="filterForm.keyword"
            placeholder="请输入标题"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="分类">
          <el-select v-model="filterForm.categoryId" placeholder="请选择分类" clearable>
            <el-option
              v-for="item in categories"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="标签">
          <el-select v-model="filterForm.tagId" placeholder="请选择标签" clearable>
            <el-option
              v-for="item in tags"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
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
          :data="postList"
          style="width: 100%"
          border
        >
          <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
          
          <el-table-column prop="categoryName" label="分类" width="120" />
          
          <el-table-column label="标签" width="180">
            <template #default="scope">
              <el-tag
                v-for="tag in scope.row.tags"
                :key="tag.id"
                size="small"
                class="tag-item"
              >
                {{ tag.name }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="状态" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.status === 'published' ? 'success' : 'info'">
                {{ scope.row.status === 'published' ? '已发布' : '草稿' }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="createTime" label="创建时间" width="180" />
          
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="scope">
              <el-button 
                size="small" 
                @click="handleEdit(scope.row)"
                type="primary" 
                plain
              >
                <el-icon><Edit /></el-icon>编辑
              </el-button>
              <el-button 
                size="small" 
                @click="handlePreview(scope.row)"
                type="info" 
                plain
              >
                <el-icon><View /></el-icon>预览
              </el-button>
              <el-button 
                size="small" 
                @click="handleDelete(scope.row)"
                type="danger" 
                plain
              >
                <el-icon><Delete /></el-icon>删除
              </el-button>
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
        />
      </div>
    </el-card>
    
    <!-- 预览对话框 -->
    <el-dialog
      v-model="previewVisible"
      title="文章预览"
      width="70%"
      destroy-on-close
    >
      <div class="preview-wrapper">
        <h2 class="preview-title">{{ previewPost.title }}</h2>
        <div class="preview-meta">
          <span class="preview-category">
            <el-tag type="info">{{ previewPost.categoryName }}</el-tag>
          </span>
          <span class="preview-tags">
            <el-tag
              v-for="tag in previewPost.tags"
              :key="tag.id"
              size="small"
              class="tag-item"
            >
              {{ tag.name }}
            </el-tag>
          </span>
          <span class="preview-time">{{ previewPost.createTime }}</span>
        </div>
        <div class="preview-content">{{ previewPost.content }}</div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Plus, Search, Refresh, Edit, View, Delete 
} from '@element-plus/icons-vue'
import { getPostList, deletePost } from '../../api/post'
import { getCategoryList } from '../../api/category'
import { getTagList } from '../../api/tag'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const appStore = useAppStore()

// 数据加载状态
const loading = ref(false)

// 数据列表
const postList = ref([])
const categories = ref([])
const tags = ref([])

// 分页相关
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 筛选表单
const filterForm = reactive({
  keyword: '',
  categoryId: '',
  tagId: '',
  status: ''
})

// 预览相关
const previewVisible = ref(false)
const previewPost = ref({})

// 获取文章列表
const fetchPostList = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: filterForm.keyword || undefined,
      categoryId: filterForm.categoryId || undefined,
      tagId: filterForm.tagId || undefined,
      status: filterForm.status || undefined
    }
    
    const res = await getPostList(params)
    if (res && res.items) {
      postList.value = res.items
      total.value = res.total
    } else {
      console.error('文章列表数据格式不正确:', res)
      postList.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('获取文章列表失败:', error)
    ElMessage.error('获取文章列表失败')
    postList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 获取分类和标签列表
const fetchOptions = async () => {
  try {
    // 并行请求分类和标签数据
    const [categoriesData, tagsData] = await Promise.all([
      getCategoryList(),
      getTagList()
    ])
    
    categories.value = categoriesData
    tags.value = tagsData
  } catch (error) {
    console.error('获取分类或标签数据失败:', error)
    ElMessage.error('获取分类或标签数据失败')
  }
}

// 搜索方法
const handleSearch = () => {
  currentPage.value = 1
  fetchPostList()
}

// 重置筛选表单
const handleReset = () => {
  Object.keys(filterForm).forEach(key => {
    filterForm[key] = ''
  })
  currentPage.value = 1
  fetchPostList()
}

// 创建文章
const handleCreate = () => {
  try {
    appStore.startLoading('正在准备编辑器...')
    router.push('/dashboard/posts/create')
    console.log('导航到创建文章页面: /dashboard/posts/create')
  } catch (error) {
    console.error('跳转到创建文章页面失败:', error)
    appStore.endLoading() // 确保发生错误时结束加载状态
    ElMessage.error('跳转到创建文章页面失败')
  }
}

// 编辑文章
const handleEdit = (row) => {
  appStore.startLoading('正在加载文章内容...')
  router.push(`/dashboard/posts/edit/${row.id}`)
}

// 预览文章
const handlePreview = (row) => {
  appStore.startLoading('正在加载预览...')
  router.push(`/dashboard/posts/preview/${row.id}`)
}

// 删除文章
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除文章 "${row.title}" 吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await deletePost(row.id)
      ElMessage.success('删除成功')
      fetchPostList()
    } catch (error) {
      console.error('删除文章失败:', error)
      ElMessage.error('删除文章失败')
    }
  }).catch(() => {
    // 用户取消删除
  })
}

// 分页方法
const handleSizeChange = (size) => {
  pageSize.value = size
  fetchPostList()
}

const handleCurrentChange = (page) => {
  currentPage.value = page
  fetchPostList()
}

onMounted(async () => {
  await Promise.all([
    fetchOptions(),
    fetchPostList()
  ])
})
</script>

<style scoped lang="scss">
.post-list {
  padding: 24px;
  
  .page-header {
    margin-bottom: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    h2 {
      margin: 0;
      font-size: 24px;
      color: #303133;
    }
  }
  
  .filter-card {
    margin-bottom: 24px;
  }
  
  .table-card {
    .pagination-container {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }
  
  .tag-item {
    margin-right: 4px;
    margin-bottom: 4px;
  }
  
  .preview-wrapper {
    padding: 20px;
    
    .preview-title {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    
    .preview-meta {
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      
      .preview-category {
        margin-right: 8px;
      }
      
      .preview-tags {
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
      }
      
      .preview-time {
        color: #909399;
        font-size: 14px;
      }
    }
    
    .preview-content {
      font-size: 16px;
      line-height: 1.8;
      color: #303133;
      white-space: pre-wrap;
    }
  }
}
</style> 