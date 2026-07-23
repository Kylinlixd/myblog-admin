<template>
  <div class="comment-list admin-page">
    <PageHeader title="评论管理" icon="CommentOutlined" />
    
    <!-- 搜索表单 -->
    <SearchForm 
      :form="filterForm" 
      :default-values="{ status: 'approved' }"
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
          <a-popconfirm
            title="确定要删除该评论吗？"
            ok-text="确定"
            cancel-text="取消"
            @confirm="handleDelete(row)"
          >
            <a-button
              type="primary" 
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
import { message } from 'ant-design-vue'
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
  { label: '评论者', prop: 'nickname', width: '120px' },
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
  status: 'approved'  // 默认设置为已通过状态
})

// 获取评论列表
const getComments = async () => {
  loading.value = true
  
  try {
    console.log('开始获取评论列表');
    const response = await getCommentList({
      page: currentPage.value,
      pageSize: pageSize.value,
      ...filterForm
    })
    
    console.log('获取评论列表响应:', response);
    
    if (response && response.code === 200 && response.data) {
      // 使用标准响应格式
      comments.value = response.data.list || [];
      total.value = response.data.total || 0;
      console.log('评论列表数据处理完成, 共', comments.value.length, '条记录');
    } else {
      console.error('评论数据为空或格式不正确:', response);
      message.error('获取评论列表失败: 响应格式异常');
      comments.value = [];
      total.value = 0;
    }
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
const handleDelete = async (row) => {
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
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

onMounted(() => {
  getComments()
})
</script>

<style lang="scss" scoped>
.comment-list {
  padding: 20px;
  :deep(.page-header) {
    margin-bottom: 16px;
  }
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
