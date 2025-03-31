<template>
  <div class="post-list">
    <div class="page-header">
      <h2>文章管理</h2>
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>新建文章
      </el-button>
    </div>
    
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="标题">
          <el-input v-model="filterForm.title" placeholder="请输入标题" clearable />
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
      <el-table
        v-loading="loading"
        :data="posts"
        border
        style="width: 100%"
      >
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="categoryName" label="分类" width="120" />
        <el-table-column prop="author" label="作者" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'published' ? 'success' : 'info'">
              {{ row.status === 'published' ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
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
        </el-table-column>
      </el-table>
      
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
    
    <!-- 文章编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新建文章' : '编辑文章'"
      width="80%"
      destroy-on-close
    >
      <el-form
        ref="postForm"
        :model="postForm"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="postForm.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="分类" prop="categoryId">
          <el-select v-model="postForm.categoryId" placeholder="请选择分类">
            <el-option
              v-for="item in categories"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="标签" prop="tags">
          <el-select
            v-model="postForm.tags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="请选择标签"
          >
            <el-option
              v-for="item in tags"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="postForm.content"
            type="textarea"
            :rows="15"
            placeholder="请输入文章内容"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="postForm.status">
            <el-radio label="draft">草稿</el-radio>
            <el-radio label="published">发布</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, Edit, View, Delete } from '@element-plus/icons-vue'
import request from '../../utils/request'

// 数据列表
const posts = ref([])
const categories = ref([])
const tags = ref([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 筛选表单
const filterForm = reactive({
  title: '',
  categoryId: '',
  status: ''
})

// 编辑表单
const dialogVisible = ref(false)
const dialogType = ref('create')
const postForm = reactive({
  title: '',
  categoryId: '',
  tags: [],
  content: '',
  status: 'draft'
})

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  categoryId: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ],
  content: [
    { required: true, message: '请输入内容', trigger: 'blur' },
    { min: 10, message: '内容不能少于 10 个字符', trigger: 'blur' }
  ]
}

// 获取文章列表
const getPosts = async () => {
  loading.value = true
  try {
    const { list, total: totalCount } = await request.get('/posts', {
      params: {
        page: currentPage.value,
        pageSize: pageSize.value,
        ...filterForm
      }
    })
    posts.value = list
    total.value = totalCount
  } catch (error) {
    console.error('获取文章列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取分类列表
const getCategories = async () => {
  try {
    const list = await request.get('/categories')
    categories.value = list
  } catch (error) {
    console.error('获取分类列表失败:', error)
  }
}

// 获取标签列表
const getTags = async () => {
  try {
    const list = await request.get('/tags')
    tags.value = list
  } catch (error) {
    console.error('获取标签列表失败:', error)
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  getPosts()
}

// 重置
const handleReset = () => {
  Object.keys(filterForm).forEach(key => {
    filterForm[key] = ''
  })
  handleSearch()
}

// 新建文章
const handleCreate = () => {
  dialogType.value = 'create'
  Object.keys(postForm).forEach(key => {
    postForm[key] = key === 'status' ? 'draft' : ''
  })
  dialogVisible.value = true
}

// 编辑文章
const handleEdit = (row) => {
  dialogType.value = 'edit'
  Object.keys(postForm).forEach(key => {
    postForm[key] = row[key]
  })
  dialogVisible.value = true
}

// 预览文章
const handlePreview = (row) => {
  // TODO: 实现预览功能
  console.log('预览文章:', row)
}

// 删除文章
const handleDelete = (row) => {
  ElMessageBox.confirm(
    '确定要删除这篇文章吗？',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await request.delete(`/posts/${row.id}`)
      ElMessage.success('删除成功')
      getPosts()
    } catch (error) {
      console.error('删除文章失败:', error)
    }
  })
}

// 提交表单
const handleSubmit = async () => {
  try {
    if (dialogType.value === 'create') {
      await request.post('/posts', postForm)
      ElMessage.success('创建成功')
    } else {
      await request.put(`/posts/${postForm.id}`, postForm)
      ElMessage.success('更新成功')
    }
    dialogVisible.value = false
    getPosts()
  } catch (error) {
    console.error('保存文章失败:', error)
  }
}

// 分页
const handleSizeChange = (val) => {
  pageSize.value = val
  getPosts()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  getPosts()
}

onMounted(() => {
  getPosts()
  getCategories()
  getTags()
})
</script>

<style scoped lang="scss">
.post-list {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    h2 {
      margin: 0;
      font-size: 20px;
      color: var(--text-primary);
    }
  }
  
  .filter-card {
    margin-bottom: 20px;
  }
  
  .table-card {
    .pagination {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }
}
</style> 