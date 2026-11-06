<template>
  <div class="comment-list admin-page">
    <PageHeader compact :title="t('shell.menu.comments')" :subtitle="t('commentMgr.subtitle')" />
    
    <!-- 搜索表单 -->
    <SearchForm 
      :form="filterForm" 
      :default-values="{ status: '' }"
      :search-on-reset="false"
      @search="handleSearch" 
      @reset="resetFilter"
    >
      <a-form-item :label="t('commentMgr.author')" name="author">
        <a-input v-model:value="filterForm.author" :placeholder="t('commentMgr.authorPlaceholder')" allowClear />
      </a-form-item>
      <a-form-item :label="t('adminShared.status')" name="status">
        <a-select v-model:value="filterForm.status" :placeholder="t('commentMgr.statusPlaceholder')" allowClear>
          <a-select-option value="pending">{{ t('commentMgr.status.pending') }}</a-select-option>
          <a-select-option value="approved">{{ t('commentMgr.status.approved') }}</a-select-option>
          <a-select-option value="rejected">{{ t('commentMgr.status.rejected') }}</a-select-option>
        </a-select>
      </a-form-item>
    </SearchForm>

    <div class="comment-batch-toolbar" :class="{ 'comment-batch-toolbar--active': selectedCommentIds.length }">
      <span>
        <strong>{{ selectedCommentIds.length }}</strong>
        {{ selectedCommentIds.length ? t('commentMgr.selectedCount', { n: selectedCommentIds.length }) : t('commentMgr.selectHint') }}
      </span>
          <a-space>
            <a-button
              type="primary"
              :disabled="!selectedCommentIds.length || batchActionPending !== ''"
              :loading="batchApproving"
              @click="handleBatchApprove"
            >
              <template #icon><check-outlined /></template>
              {{ t('adminShared.batchApprove') }}
            </a-button>
            <a-button
              danger
              :disabled="!selectedCommentIds.length || batchActionPending !== ''"
              :loading="batchDeleting"
              @click="handleBatchDelete"
            >
              <template #icon><delete-outlined /></template>
              {{ t('adminShared.batchDelete') }}
            </a-button>
          </a-space>
    </div>
    
    <!-- 评论列表 -->
    <AsyncState
      v-if="loading || errorMessage || !comments.length"
      data-testid="comment-async-state"
      :loading="loading"
      :error="errorMessage"
      :empty="!loading && !errorMessage"
      :empty-title="t('commentMgr.empty')"
      :empty-description="t('commentMgr.emptyHint')"
      @retry="getComments"
    />

    <DataTable
      v-else
      :data="comments"
      :columns="columns"
      :loading="loading"
      column-storage-key="comments"
      selectable
      :selected-row-keys="selectedCommentIds"
      row-key="id"
      @selection-change="selectedCommentIds = $event"
    >
      <template #content="{ row }">
        <div class="content-cell content-cell--wrapping">{{ row.content }}</div>
      </template>
      
      <template #status="{ row }">
        <a-tag :color="getStatusColor(row.status)">
          {{ getStatusText(row.status) }}
        </a-tag>
      </template>
      
      <template #nickname="{ row }">
        <span>{{ row.nickname || t('component.anonymous') }}</span>
      </template>

      <template #createTime="{ row }">
        {{ formatDate(row.created_at || row.createTime) }}
      </template>

      <template #actions="{ row }">
        <a-space class="table-row-actions">
          <a-button
            v-if="row.status === 'pending'"
            type="text"
            size="small"
            class="row-action row-action--primary"
            :data-testid="`approve-comment-${row.id}`"
            :loading="isActionPending(row.id, 'approve')"
            :disabled="isCommentPending(row.id)"
            @click="handleApprove(row)"
          >
            <template #icon><check-outlined /></template>{{ t('adminShared.approve') }}
          </a-button>
          <a-button
            v-if="row.status === 'pending'"
            type="text"
            size="small"
            class="row-action"
            :data-testid="`reject-comment-${row.id}`"
            :loading="isActionPending(row.id, 'reject')"
            :disabled="isCommentPending(row.id)"
            @click="handleReject(row)"
          >
            <template #icon><close-outlined /></template>{{ t('adminShared.reject') }}
          </a-button>
          <a-popconfirm
            :title="t('commentMgr.deleteConfirm')"
            :ok-text="t('adminShared.confirm')"
            :cancel-text="t('adminShared.cancel')"
            @confirm="handleDelete(row)"
          >
            <a-button
              type="text"
              size="small"
              class="row-action row-action--danger"
              danger
              :data-testid="`delete-comment-${row.id}`"
              :loading="isActionPending(row.id, 'delete')"
              :disabled="isCommentPending(row.id)"
            >
              <template #icon><delete-outlined /></template>{{ t('adminShared.delete') }}
            </a-button>
          </a-popconfirm>
        </a-space>
      </template>
    </DataTable>
    
    <!-- 分页 -->
    <Pagination
      v-if="!loading && !errorMessage && comments.length"
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
import AsyncState from '../../components/common/AsyncState.vue'
import { t } from '@/i18n'

// 表格列配置
const columns = computed(() => [
  { key: 'serialNo', label: t('adminShared.serialNo'), prop: 'serialNo', width: '72px' },
  { key: 'content', label: t('commentMgr.column.content'), prop: 'content', slot: 'content', width: '300px' },
  { key: 'nickname', label: t('commentMgr.author'), prop: 'nickname', slot: 'nickname', width: '120px' },
  { key: 'email', label: t('commentMgr.column.email'), prop: 'email', width: '180px' },
  { key: 'status', label: t('adminShared.status'), prop: 'status', slot: 'status', width: '100px' },
  { key: 'createTime', label: t('commentMgr.column.createTime'), prop: 'createTime', slot: 'createTime', width: '150px' },
  { key: 'actions', label: t('adminShared.actions'), slot: 'actions', width: '200px' }
])

// 数据列表
const comments = ref([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const selectedCommentIds = ref([])
const batchActionPending = ref('')
const batchDeleting = computed(() => batchActionPending.value === 'delete')
const batchApproving = computed(() => batchActionPending.value === 'approve')
const errorMessage = ref('')
const pendingActions = reactive({})
let requestGeneration = 0

// 筛选表单
const filterForm = reactive({
  author: '',
  status: ''
})

// 获取评论列表
const getComments = async (allowPageReset = true) => {
  const generation = ++requestGeneration
  const requestedPage = currentPage.value
  const requestedPageSize = pageSize.value
  loading.value = true
  errorMessage.value = ''
  
  try {
    const activeFilters = Object.fromEntries(
      Object.entries(filterForm).filter(([, value]) => value !== '' && value !== null && value !== undefined)
    )
    const response = await getCommentList({
      page: requestedPage,
      pageSize: requestedPageSize,
      ...activeFilters
    })
    if (generation !== requestGeneration) return
    if (allowPageReset && requestedPage > 1 && response.results.length === 0) {
      currentPage.value = 1
      return getComments(false)
    }
    comments.value = response.results.map((comment, index) => ({
      ...comment,
      serialNo: (requestedPage - 1) * requestedPageSize + index + 1
    }))
    total.value = response.count
  } catch (error) {
    if (generation !== requestGeneration) return
    console.error('获取评论列表失败:', error);
    errorMessage.value = error.message || t('commentMgr.loadFailed')
    
    // 检查是否是认证错误
    if (error.message && (
      error.message.includes('登录已过期') ||
      error.message.includes('未登录') ||
      error.status === 401
    )) {
      message.error(t('commentMgr.sessionExpired'));
    } else {
      message.error(t('commentMgr.loadFailed') + ': ' + (error.message || t('commentMgr.unknownError')));
    }
  } finally {
    if (generation === requestGeneration) loading.value = false;
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
  const key = `${row.id}:approve`
  pendingActions[key] = true
  try {
    await approveComment(row.id)
    message.success(t('commentMgr.approveSuccess'))
    await getComments()
  } catch (error) {
    console.error('审核评论失败:', error)
    message.error(error.message || t('adminShared.operationFailed'))
  } finally {
    delete pendingActions[key]
  }
}

// 拒绝评论
const handleReject = async (row) => {
  const key = `${row.id}:reject`
  pendingActions[key] = true
  try {
    await rejectComment(row.id)
    message.success(t('commentMgr.rejectSuccess'))
    await getComments()
  } catch (error) {
    console.error('拒绝评论失败:', error)
    message.error(error.message || t('adminShared.operationFailed'))
  } finally {
    delete pendingActions[key]
  }
}

// 删除评论
const handleDelete = async (row) => {
  const key = `${row.id}:delete`
  pendingActions[key] = true
  try {
    await deleteComment(row.id)
    message.success(t('adminShared.deleteSuccess'))
    selectedCommentIds.value = selectedCommentIds.value.filter((id) => id !== row.id)
    await getComments()
  } catch (error) {
    console.error('删除评论失败:', error)
    message.error(error.message || t('adminShared.deleteFailed'))
  } finally {
    delete pendingActions[key]
  }
}

const isActionPending = (id, action) => Boolean(pendingActions[`${id}:${action}`])
const isCommentPending = (id) => ['approve', 'reject', 'delete'].some((action) => isActionPending(id, action))

const handleBatchDelete = () => {
  if (!selectedCommentIds.value.length || batchActionPending.value) return

  batchActionPending.value = 'delete'

  Modal.confirm({
    title: t('commentMgr.batchDeleteTitle', { n: selectedCommentIds.value.length }),
    content: t('commentMgr.batchDeleteContent'),
    okText: t('commentMgr.confirmDelete'),
    cancelText: t('adminShared.cancel'),
    okButtonProps: { danger: true },
    onCancel() {
      if (batchActionPending.value === 'delete') batchActionPending.value = ''
    },
    async onOk() {
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

        if (!failedIds.length) message.success(t('commentMgr.batchDeleteDone', { n: successCount }))
        else message.warning(t('commentMgr.batchDeletePartial', { success: successCount, failed: failedIds.length }))
        await getComments()
      } finally {
        if (batchActionPending.value === 'delete') batchActionPending.value = ''
      }
    }
  })
}

const handleBatchApprove = () => {
  if (!selectedCommentIds.value.length || batchActionPending.value) return

  batchActionPending.value = 'approve'
  Modal.confirm({
    title: t('commentMgr.batchApproveTitle', { n: selectedCommentIds.value.length }),
    content: t('commentMgr.batchApproveContent'),
    okText: t('commentMgr.confirmApprove'),
    cancelText: t('adminShared.cancel'),
    onCancel() {
      if (batchActionPending.value === 'approve') batchActionPending.value = ''
    },
    async onOk() {
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
        if (!failedIds.length) message.success(t('commentMgr.batchApproveDone', { n: successCount }))
        else message.warning(t('commentMgr.batchApprovePartial', { success: successCount, failed: failedIds.length }))
        await getComments()
      } finally {
        if (batchActionPending.value === 'approve') batchActionPending.value = ''
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
    pending: t('commentMgr.status.pending'),
    approved: t('commentMgr.status.approved'),
    rejected: t('commentMgr.status.rejected')
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

.content-cell--wrapping { overflow-wrap: anywhere; }

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
