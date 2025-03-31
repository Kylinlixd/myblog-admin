<template>
  <div class="comment-list">
    <div class="page-header">
      <h2>评论管理</h2>
    </div>
    
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="文章">
          <el-input v-model="filterForm.postTitle" placeholder="请输入文章标题" clearable />
        </el-form-item>
        <el-form-item label="评论者">
          <el-input v-model="filterForm.author" placeholder="请输入评论者" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="请选择状态" clearable>
            <el-option label="待审核" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已拒绝" value="rejected" />
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
        :data="comments"
        border
        style="width: 100%"
      >
        <el-table-column prop="postTitle" label="文章" min-width="200" show-overflow-tooltip />
        <el-table-column prop="content" label="评论内容" min-width="300" show-overflow-tooltip />
        <el-table-column prop="author" label="评论者" width="120" />
        <el-table-column prop="email" label="邮箱" width="180" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="评论时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button-group>
              <el-button
                v-if="row.status === 'pending'"
                type="success"
                link
                @click="handleApprove(row)"
              >
                <el-icon><Check /></el-icon>通过
              </el-button>
              <el-button
                v-if="row.status === 'pending'"
                type="danger"
                link
                @click="handleReject(row)"
              >
                <el-icon><Close /></el-icon>拒绝
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Check, Close, Delete } from '@element-plus/icons-vue'
import { getCommentList, approveComment, rejectComment, deleteComment } from '../../api/comment'

// 数据列表
const comments = ref([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 筛选表单
const filterForm = reactive({
  postTitle: '',
  author: '',
  status: ''
})

// 获取评论列表
const getComments = async () => {
  loading.value = true
  try {
    const response = await getCommentList({
      page: currentPage.value,
      pageSize: pageSize.value,
      ...filterForm
    })
    const { list, total: totalCount } = response.data
    comments.value = list
    total.value = totalCount
  } catch (error) {
    console.error('获取评论列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  getComments()
}

// 重置
const handleReset = () => {
  Object.keys(filterForm).forEach(key => {
    filterForm[key] = ''
  })
  handleSearch()
}

// 获取状态类型
const getStatusType = (status) => {
  const types = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return types[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const texts = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  }
  return texts[status] || status
}

// 通过评论
const handleApprove = (row) => {
  ElMessageBox.confirm(
    '确定要通过这条评论吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await approveComment(row.id)
      ElMessage.success('操作成功')
      getComments()
    } catch (error) {
      console.error('操作失败:', error)
    }
  })
}

// 拒绝评论
const handleReject = (row) => {
  ElMessageBox.confirm(
    '确定要拒绝这条评论吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await rejectComment(row.id)
      ElMessage.success('操作成功')
      getComments()
    } catch (error) {
      console.error('操作失败:', error)
    }
  })
}

// 删除评论
const handleDelete = (row) => {
  ElMessageBox.confirm(
    '确定要删除这条评论吗？删除后无法恢复。',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await deleteComment(row.id)
      ElMessage.success('删除成功')
      getComments()
    } catch (error) {
      console.error('删除评论失败:', error)
    }
  })
}

// 分页
const handleSizeChange = (val) => {
  pageSize.value = val
  getComments()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  getComments()
}

onMounted(() => {
  getComments()
})
</script>

<style scoped lang="scss">
.comment-list {
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