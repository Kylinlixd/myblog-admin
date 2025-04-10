<template>
  <div class="comment-list">
    <div class="page-header">
      <h2>评论管理</h2>
    </div>
    
    <div class="filter-card">
      <form class="filter-form" @submit.prevent="handleSearch">
        <el-form-item label="文章" prop="postId">
          <el-input v-model="filterForm.postTitle" placeholder="请输入文章标题" />
        </el-form-item>
        
        <el-form-item label="评论者" prop="author">
          <el-input v-model="filterForm.author" placeholder="请输入评论者" />
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-select v-model="filterForm.status" placeholder="请选择状态" clearable>
            <el-option label="待审核" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </form>
    </div>
    
    <div class="table-card">
      <div class="table-wrapper" :class="{ 'is-loading': loading }">
        <table class="inspira-table">
          <thead>
            <tr>
              <th>文章</th>
              <th>评论内容</th>
              <th>评论者</th>
              <th>邮箱</th>
              <th>状态</th>
              <th>评论时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in comments" :key="row.id">
              <td class="post-cell">{{ row.postTitle }}</td>
              <td class="content-cell">{{ row.content }}</td>
              <td>{{ row.author }}</td>
              <td>{{ row.email }}</td>
              <td>
                <span class="status-tag" :class="getStatusType(row.status)">
                  {{ getStatusText(row.status) }}
                </span>
              </td>
              <td>{{ row.createTime }}</td>
              <td>
                <div class="action-buttons">
                  <button
                    v-if="row.status === 'pending'"
                    class="action-button success"
                    @click="handleApprove(row)"
                  >
                    <i class="icon-check"></i>通过
                  </button>
                  <button
                    v-if="row.status === 'pending'"
                    class="action-button danger"
                    @click="handleReject(row)"
                  >
                    <i class="icon-close"></i>拒绝
                  </button>
                  <button
                    class="action-button danger"
                    @click="handleDelete(row)"
                  >
                    <i class="icon-delete"></i>删除
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="pagination">
        <div class="pagination-info">
          共 {{ total }} 条
          <div class="page-size-selector">
            <select v-model="pageSize" class="inspira-select" @change="handleSizeChange">
              <option v-for="size in [10, 20, 50, 100]" :key="size" :value="size">
                {{ size }}条/页
              </option>
            </select>
          </div>
        </div>
        
        <div class="pagination-buttons">
          <button
            class="pagination-button"
            :disabled="currentPage === 1"
            @click="handleCurrentChange(currentPage - 1)"
          >
            <i class="icon-arrow-left"></i>
          </button>
          
          <div class="page-numbers">
            <button
              v-for="page in pageNumbers"
              :key="page"
              class="pagination-button"
              :class="{ active: page === currentPage }"
              @click="handleCurrentChange(page)"
            >
              {{ page }}
            </button>
          </div>
          
          <button
            class="pagination-button"
            :disabled="currentPage === totalPages"
            @click="handleCurrentChange(currentPage + 1)"
          >
            <i class="icon-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
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

// 分页计算
const totalPages = computed(() => Math.ceil(total.value / pageSize.value))
const pageNumbers = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)
  
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
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
const resetFilter = () => {
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
const handleApprove = async (row) => {
  if (!confirm('确定要通过这条评论吗？')) return
  
  try {
    await approveComment(row.id)
    getComments()
  } catch (error) {
    console.error('操作失败:', error)
  }
}

// 拒绝评论
const handleReject = async (row) => {
  if (!confirm('确定要拒绝这条评论吗？')) return
  
  try {
    await rejectComment(row.id)
    getComments()
  } catch (error) {
    console.error('操作失败:', error)
  }
}

// 删除评论
const handleDelete = async (row) => {
  if (!confirm('确定要删除这条评论吗？删除后无法恢复。')) return
  
  try {
    await deleteComment(row.id)
    getComments()
  } catch (error) {
    console.error('删除评论失败:', error)
  }
}

// 分页处理
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  getComments()
}

const handleCurrentChange = (page) => {
  currentPage.value = page
  getComments()
}

onMounted(() => {
  getComments()
})
</script>

<style scoped lang="scss">
.comment-list {
  padding: 20px;
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    h2 {
      margin: 0;
      font-size: 24px;
      color: rgba(255, 255, 255, 0.9);
    }
  }
  
  .filter-card {
    background: rgba(51, 102, 153, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 20px;
    border: 1px solid rgba(0, 255, 255, 0.2);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    
    .filter-form {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      align-items: flex-end;
      
      .form-group {
        flex: 1;
        min-width: 200px;
        
        label {
          display: block;
          margin-bottom: 8px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 14px;
        }
      }
      
      .form-actions {
        display: flex;
        gap: 10px;
      }
    }
  }
  
  .table-card {
    background: rgba(51, 102, 153, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 20px;
    border: 1px solid rgba(0, 255, 255, 0.2);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    
    .table-wrapper {
      position: relative;
      overflow-x: auto;
      
      &.is-loading::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(51, 102, 153, 0.1);
        backdrop-filter: blur(5px);
      }
    }
    
    .inspira-table {
      width: 100%;
      border-collapse: collapse;
      
      th, td {
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid rgba(0, 255, 255, 0.1);
      }
      
      th {
        font-weight: 500;
        color: rgba(255, 255, 255, 0.8);
        background: rgba(51, 102, 153, 0.1);
      }
      
      td {
        color: rgba(255, 255, 255, 0.9);
      }
      
      .post-cell,
      .content-cell {
        max-width: 300px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .status-tag {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
        
        &.warning {
          background: rgba(255, 193, 7, 0.2);
          color: #ffc107;
        }
        
        &.success {
          background: rgba(76, 175, 80, 0.2);
          color: #4caf50;
        }
        
        &.danger {
          background: rgba(244, 67, 54, 0.2);
          color: #f44336;
        }
        
        &.info {
          background: rgba(33, 150, 243, 0.2);
          color: #2196f3;
        }
      }
      
      .action-buttons {
        display: flex;
        gap: 8px;
        
        .action-button {
          background: none;
          border: none;
          color: rgba(0, 255, 255, 0.8);
          cursor: pointer;
          padding: 4px 8px;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: color 0.3s ease;
          
          &:hover {
            color: rgba(0, 255, 255, 1);
          }
          
          &.success {
            color: rgba(76, 175, 80, 0.8);
            
            &:hover {
              color: rgba(76, 175, 80, 1);
            }
          }
          
          &.danger {
            color: rgba(244, 67, 54, 0.8);
            
            &:hover {
              color: rgba(244, 67, 54, 1);
            }
          }
        }
      }
    }
  }
  
  .pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
    
    .pagination-info {
      display: flex;
      align-items: center;
      gap: 10px;
      color: rgba(255, 255, 255, 0.6);
    }
    
    .pagination-buttons {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .pagination-button {
        background: rgba(51, 102, 153, 0.1);
        border: 1px solid rgba(0, 255, 255, 0.2);
        color: rgba(255, 255, 255, 0.8);
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.3s ease;
        
        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        &:hover:not(:disabled) {
          background: rgba(51, 102, 153, 0.2);
          border-color: rgba(0, 255, 255, 0.4);
        }
        
        &.active {
          background: rgba(0, 255, 255, 0.2);
          border-color: rgba(0, 255, 255, 0.6);
          color: rgba(0, 255, 255, 1);
        }
      }
    }
  }
}

.inspira-input,
.inspira-select {
  width: 100%;
  height: 40px;
  background: rgba(51, 102, 153, 0.2);
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 8px;
  padding: 0 12px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: rgba(0, 255, 255, 0.6);
    box-shadow: 0 0 0 2px rgba(0, 255, 255, 0.1);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
}

.inspira-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 8.825L1.175 4 2.238 2.938 6 6.7l3.763-3.763L10.825 4z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 32px;
}

.inspira-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 20px;
  background: linear-gradient(45deg, #336699, #0066cc);
  border: none;
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 255, 255, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &.secondary {
    background: rgba(51, 102, 153, 0.2);
    border: 1px solid rgba(0, 255, 255, 0.3);
    
    &:hover {
      background: rgba(51, 102, 153, 0.3);
      border-color: rgba(0, 255, 255, 0.6);
    }
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
}
</style> 