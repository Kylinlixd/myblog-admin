<template>
  <div class="comment-list">
    <PageHeader title="评论管理" icon="CommentOutlined" />
    
    <!-- 搜索表单 -->
    <SearchForm :form="filterForm" @search="handleSearch" @reset="resetFilter">
      <a-form-item label="评论者" name="author">
        <a-input v-model:value="filterForm.author" placeholder="请输入评论者" />
      </a-form-item>
      
      <a-form-item label="状态" name="status">
        <a-select v-model:value="filterForm.status" placeholder="请选择状态" allowClear>
          <a-select-option value="pending">待审核</a-select-option>
          <a-select-option value="approved">已通过</a-select-option>
          <a-select-option value="rejected">已拒绝</a-select-option>
        </a-select>
      </a-form-item>
    </SearchForm>
    
    <!-- 评论列表 -->
    <DataTable
      :data="comments"
      :columns="columns"
      :loading="loading"
      row-key="id"
    >
      <template #content="{ row }">
        <div class="content-cell">{{ row.content }}</div>
      </template>
      
      <template #status="{ row }">
        <a-tag :color="getStatusColor(row.status)">
          {{ getStatusText(row.status) }}
        </a-tag>
      </template>
      
      <template #actions="{ row }">
        <a-space>
          <a-button
            v-if="row.status === 'pending'"
            type="primary"
            @click="handleApprove(row)"
          >
            <template #icon><check-outlined /></template>通过
          </a-button>
          <a-button
            v-if="row.status === 'pending'"
            @click="handleReject(row)"
          >
            <template #icon><close-outlined /></template>拒绝
          </a-button>
          <a-button
            type="primary" 
            danger
            @click="handleDelete(row)"
          >
            <template #icon><delete-outlined /></template>删除
          </a-button>
        </a-space>
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
import { ref, reactive, computed, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { getCommentList, approveComment, rejectComment, deleteComment } from '../../api/comment'
import { CheckOutlined, CloseOutlined, DeleteOutlined, CommentOutlined } from '@ant-design/icons-vue'

// 导入通用组件
import DataTable from '../../components/common/DataTable.vue'
import Pagination from '../../components/common/Pagination.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import SearchForm from '../../components/common/SearchForm.vue'

// 表格列配置
const columns = [
  { label: '评论内容', prop: 'content', slot: 'content', width: '300px' },
  { label: '评论者', prop: 'author', width: '120px' },
  { label: '邮箱', prop: 'email', width: '180px' },
  { label: '状态', prop: 'status', slot: 'status', width: '100px' },
  { label: '评论时间', prop: 'createTime', width: '180px' },
  { label: '操作', slot: 'actions', width: '200px' }
]

// 数据列表
const comments = ref([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 筛选表单
const filterForm = reactive({
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
    
    if (response.code === 200) {
      comments.value = response.data.list || []
      total.value = response.data.total || 0
    } else {
      message.error(response.message || '获取评论列表失败')
    }
  } catch (error) {
    console.error('获取评论列表失败:', error)
    message.error('获取评论列表失败')
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
const resetFilter = () => {
  // 搜索表单组件会自动重置表单
  handleSearch()
}

// 分页大小改变
const handleSizeChange = (size) => {
  pageSize.value = size
  getComments()
}

// 页码改变
const handleCurrentChange = (page) => {
  currentPage.value = page
  getComments()
}

// 通过评论
const handleApprove = async (row) => {
  try {
    const response = await approveComment(row.id)
    if (response.code === 200) {
      message.success('评论已通过')
      getComments()
    } else {
      message.error(response.message || '操作失败')
    }
  } catch (error) {
    console.error('审核评论失败:', error)
    message.error('操作失败')
  }
}

// 拒绝评论
const handleReject = async (row) => {
  try {
    const response = await rejectComment(row.id)
    if (response.code === 200) {
      message.success('评论已拒绝')
      getComments()
    } else {
      message.error(response.message || '操作失败')
    }
  } catch (error) {
    console.error('拒绝评论失败:', error)
    message.error('操作失败')
  }
}

// 删除评论
const handleDelete = (row) => {
  Modal.confirm({
    title: '提示',
    content: '确定要删除该评论吗？',
    okText: '确定',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      try {
        const response = await deleteComment(row.id)
        if (response.code === 200) {
          message.success('删除成功')
          getComments()
        } else {
          message.error(response.message || '删除失败')
        }
      } catch (error) {
        console.error('删除评论失败:', error)
        message.error('删除失败')
      }
    }
  })
}

// 获取状态颜色
const getStatusColor = (status) => {
  const map = {
    pending: 'warning',
    approved: 'success',
    rejected: 'error'
  }
  return map[status] || 'default'
}

// 获取状态文本
const getStatusText = (status) => {
  const map = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  }
  return map[status] || status
}

onMounted(() => {
  getComments()
})
</script>

<style lang="scss" scoped>
.comment-list {
  padding: 20px;
}

.content-cell {
  max-width: 300px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style> 