<template>
  <div class="comment-list admin-page">
    <PageHeader title="评论管理" subtitle="审核读者反馈并维护讨论秩序。" />
    
    <!-- 搜索表单 -->
    <SearchForm 
      :form="filterForm" 
      :default-values="{ status: '' }"
      :search-on-reset="false"
      @search="handleSearch" 
      @reset="resetFilter"
    >
      <a-form-item label="评论者" name="author">
        <a-input v-model:value="filterForm.author" placeholder="请输入评论者" allowClear />
      </a-form-item>
      <a-form-item label="状态" name="status">
        <a-select v-model:value="filterForm.status" placeholder="请选择状态" allowClear>
          <a-select-option value="pending">待审核</a-select-option>
          <a-select-option value="approved">已通过</a-select-option>
          <a-select-option value="rejected">已拒绝</a-select-option>
        </a-select>
      </a-form-item>
    </SearchForm>

    <div class="comment-batch-toolbar" :class="{ 'comment-batch-toolbar--active': selectedCommentIds.length }">
      <span>
        <strong>{{ selectedCommentIds.length }}</strong>
        {{ selectedCommentIds.length ? '条评论已选择' : '选择评论后可批量处理' }}
      </span>
          <a-space>
            <a-button
              type="primary"
              :disabled="!selectedCommentIds.length"
              :loading="batchApproving"
              @click="handleBatchApprove"
            >
              <template #icon><check-outlined /></template>
              批量通过
            </a-button>
            <a-button
              danger
              :disabled="!selectedCommentIds.length"
              :loading="batchDeleting"
              @click="handleBatchDelete"
            >
              <template #icon><delete-outlined /></template>
              批量删除
            </a-button>
          </a-space>
    </div>
    
    <!-- 评论列表 -->
    <DataTable
      :data="comments"
      :columns="columns"
      :loading="loading"
      selectable
      :selected-row-keys="selectedCommentIds"
      row-key="id"
      @selection-change="selectedCommentIds = $event"
    >
      <template #content="{ row }">
        <div class="content-cell">{{ row.content }}</div>
      </template>
      
      <template #status="{ row }">
        <a-tag :color="getStatusColor(row.status)">
          {{ getStatusText(row.status) }}
        </a-tag>
      </template>
      
      <template #createTime="{ row }">
        {{ formatDate(row.createTime) }}
      </template>

      <template #actions="{ row }">
        <a-space class="table-row-actions">
          <a-button
            v-if="row.status === 'pending'"
            type="text"
            size="small"
            class="row-action row-action--primary"
            @click="handleApprove(row)"
          >
            <template #icon><check-outlined /></template>通过
          </a-button>
          <a-button
            v-if="row.status === 'pending'"
            type="text"
            size="small"
            class="row-action"
            @click="handleReject(row)"
          >
            <template #icon><close-outlined /></template>拒绝
          </a-button>
          <a-popconfirm
            title="确定要删除该评论吗？"
            ok-text="确定"
            cancel-text="取消"
            @confirm="handleDelete(row)"
          >
            <a-button
              type="text"
              size="small"
              class="row-action row-action--danger"
              danger
            >
              <template #icon><delete-outlined /></template>删除
            </a-button>
          </a-popconfirm>
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
import { CheckOutlined, CloseOutlined, DeleteOutlined } from '@ant-design/icons-vue'

// 导入通用组件
import DataTable from '../../components/common/DataTable.vue'
import Pagination from '../../components/common/Pagination.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import SearchForm from '../../components/common/SearchForm.vue'

// 表格列配置
const columns = [
  { label: '评论内容', prop: 'content', slot: 'content', width: '300px' },
  { label: '评论者', prop: 'nickname', width: '120px' },
  { label: '邮箱', prop: 'email', width: '180px' },
  { label: '状态', prop: 'status', slot: 'status', width: '100px' },
  { label: '评论时间', prop: 'createTime', slot: 'createTime', width: '150px' },
  { label: '操作', slot: 'actions', width: '200px' }
]

// 数据列表
const comments = ref([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const selectedCommentIds = ref([])
const batchDeleting = ref(false)
const batchApproving = ref(false)

// 筛选表单
const filterForm = reactive({
  author: '',
  status: ''
})

// 获取评论列表
const getComments = async () => {
  loading.value = true
  
  try {
    const activeFilters = Object.fromEntries(
      Object.entries(filterForm).filter(([, value]) => value !== '' && value !== null && value !== undefined)
    )
    const response = await getCommentList({
      page: currentPage.value,
      pageSize: pageSize.value,
      ...activeFilters
    })
    comments.value = response.results
    total.value = response.count
  } catch (error) {
    console.error('获取评论列表失败:', error);
    
    // 检查是否是认证错误
    if (error.message && (
      error.message.includes('登录已过期') || 
      error.message.includes('未登录') ||
      error.response?.status === 401
    )) {
      message.error('登录已过期，请重新登录');
    } else {
      message.error('获取评论列表失败: ' + (error.message || '未知错误'));
    }
  } finally {
    loading.value = false;
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
    await approveComment(row.id)
    message.success('评论已通过')
    getComments()
  } catch (error) {
    console.error('审核评论失败:', error)
    message.error('操作失败')
  }
}

// 拒绝评论
const handleReject = async (row) => {
  try {
    await rejectComment(row.id)
    message.success('评论已拒绝')
    getComments()
  } catch (error) {
    console.error('拒绝评论失败:', error)
    message.error('操作失败')
  }
}

// 删除评论
const handleDelete = async (row) => {
  try {
    await deleteComment(row.id)
    message.success('删除成功')
    selectedCommentIds.value = selectedCommentIds.value.filter((id) => id !== row.id)
    getComments()
  } catch (error) {
    console.error('删除评论失败:', error)
    message.error('删除失败')
  }
}

const handleBatchDelete = () => {
  if (!selectedCommentIds.value.length || batchDeleting.value) return

  Modal.confirm({
    title: `删除选中的 ${selectedCommentIds.value.length} 条评论？`,
    content: '删除后无法恢复，请确认这些评论不再需要保留。',
    okText: '确认删除',
    cancelText: '取消',
    okButtonProps: { danger: true },
    async onOk() {
      batchDeleting.value = true
      const ids = [...selectedCommentIds.value]
      try {
        const results = await Promise.allSettled(ids.map(async (id) => {
          await deleteComment(id)
          return id
        }))
        const failedIds = results.reduce((failed, result, index) => {
          if (result.status === 'rejected') failed.push(ids[index])
          return failed
        }, [])
        const successCount = ids.length - failedIds.length
        selectedCommentIds.value = failedIds

        if (!failedIds.length) message.success(`已删除 ${successCount} 条评论`)
        else message.warning(`已删除 ${successCount} 条，${failedIds.length} 条删除失败并保持选中`)
        await getComments()
      } finally {
        batchDeleting.value = false
      }
    }
  })
}

const handleBatchApprove = () => {
  if (!selectedCommentIds.value.length || batchApproving.value) return
  Modal.confirm({
    title: `通过选中的 ${selectedCommentIds.value.length} 条评论？`,
    content: '通过后评论会显示在文章讨论区。',
    okText: '确认通过',
    cancelText: '取消',
    async onOk() {
      batchApproving.value = true
      const ids = [...selectedCommentIds.value]
      try {
        const results = await Promise.allSettled(ids.map(async (id) => {
          await approveComment(id)
          return id
        }))
        const failedIds = results.reduce((failed, result, index) => {
          if (result.status === 'rejected') failed.push(ids[index])
          return failed
        }, [])
        const successCount = ids.length - failedIds.length
        selectedCommentIds.value = failedIds
        if (!failedIds.length) message.success(`已通过 ${successCount} 条评论`)
        else message.warning(`已通过 ${successCount} 条，${failedIds.length} 条失败并保持选中`)
        await getComments()
      } finally {
        batchApproving.value = false
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

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

onMounted(() => {
  getComments()
})
</script>

<style lang="scss" scoped>
.content-cell {
  max-width: 300px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.comment-batch-toolbar {
  display: flex;
  min-height: 58px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: 14px 0;
  padding: 9px 12px 9px 18px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: white;
  color: var(--color-text-secondary);
  font-size: 13px;
  transition: border-color var(--transition-fast), background var(--transition-fast);
}

.comment-batch-toolbar--active {
  border-color: rgb(49 91 234 / 26%);
  background: #f7f9ff;
}

.comment-batch-toolbar strong { margin-right: 4px; color: var(--color-primary); font-size: 17px; }

@media (max-width: 560px) {
  .comment-batch-toolbar { align-items: stretch; flex-direction: column; }
}
</style>
