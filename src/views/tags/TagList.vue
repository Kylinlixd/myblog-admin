<template>
  <div class="tag-list">
    <div class="page-header">
      <h2>标签管理</h2>
      <button class="inspira-button" @click="handleCreate">
        <i class="icon-plus"></i>新建标签
      </button>
    </div>
    
    <div class="table-card">
      <div class="table-wrapper" :class="{ 'is-loading': loading }">
        <table class="inspira-table">
          <thead>
            <tr>
              <th>标签名称</th>
              <th>描述</th>
              <th>文章数量</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in tags" :key="row.id">
              <td class="name-cell">{{ row.name }}</td>
              <td class="description-cell">{{ row.description }}</td>
              <td class="count-cell">{{ row.postCount }}</td>
              <td>{{ row.createTime }}</td>
              <td>
                <div class="action-buttons">
                  <button class="action-button" @click="handleEdit(row)">
                    <i class="icon-edit"></i>编辑
                  </button>
                  <button class="action-button danger" @click="handleDelete(row)">
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
    
    <!-- 标签编辑对话框 -->
    <div class="dialog" :class="{ 'is-active': dialogVisible }">
      <div class="dialog-overlay" @click="dialogVisible = false"></div>
      <div class="dialog-content">
        <div class="dialog-header">
          <h3>{{ dialogType === 'create' ? '新建标签' : '编辑标签' }}</h3>
          <button class="close-button" @click="dialogVisible = false">
            <i class="icon-close"></i>
          </button>
        </div>
        
        <form class="dialog-form" @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>标签名称</label>
            <input
              v-model="tagForm.name"
              type="text"
              class="inspira-input"
              placeholder="请输入标签名称"
              :class="{ 'is-error': errors.name }"
            />
            <span class="error-message" v-if="errors.name">{{ errors.name }}</span>
          </div>
          
          <div class="form-group">
            <label>描述</label>
            <textarea
              v-model="tagForm.description"
              class="inspira-textarea"
              :rows="3"
              placeholder="请输入标签描述"
              :class="{ 'is-error': errors.description }"
            ></textarea>
            <span class="error-message" v-if="errors.description">{{ errors.description }}</span>
          </div>
          
          <div class="form-group">
            <label>排序</label>
            <div class="number-input">
              <button
                type="button"
                class="number-button"
                @click="tagForm.sort = Math.max(0, tagForm.sort - 1)"
              >
                <i class="icon-minus"></i>
              </button>
              <input
                v-model.number="tagForm.sort"
                type="number"
                class="inspira-input"
                min="0"
                max="999"
              />
              <button
                type="button"
                class="number-button"
                @click="tagForm.sort = Math.min(999, tagForm.sort + 1)"
              >
                <i class="icon-plus"></i>
              </button>
            </div>
          </div>
          
          <div class="dialog-footer">
            <button type="button" class="inspira-button secondary" @click="dialogVisible = false">
              取消
            </button>
            <button type="submit" class="inspira-button">
              确定
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import request from '../../utils/request'

// 数据列表
const tags = ref([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 编辑表单
const dialogVisible = ref(false)
const dialogType = ref('create')
const tagForm = reactive({
  id: '',
  name: '',
  description: '',
  sort: 0
})

// 表单错误
const errors = reactive({
  name: '',
  description: ''
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

// 表单验证
const validateForm = () => {
  let isValid = true
  errors.name = ''
  errors.description = ''
  
  if (!tagForm.name) {
    errors.name = '请输入标签名称'
    isValid = false
  } else if (tagForm.name.length < 2 || tagForm.name.length > 50) {
    errors.name = '长度在 2 到 50 个字符'
    isValid = false
  }
  
  if (tagForm.description && tagForm.description.length > 200) {
    errors.description = '长度不能超过 200 个字符'
    isValid = false
  }
  
  return isValid
}

// 获取标签列表
const getTags = async () => {
  loading.value = true
  try {
    const { list, total: totalCount } = await request.get('/tags', {
      params: {
        page: currentPage.value,
        pageSize: pageSize.value
      }
    })
    tags.value = list
    total.value = totalCount
  } catch (error) {
    console.error('获取标签列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 新建标签
const handleCreate = () => {
  dialogType.value = 'create'
  Object.keys(tagForm).forEach(key => {
    tagForm[key] = key === 'sort' ? 0 : ''
  })
  dialogVisible.value = true
}

// 编辑标签
const handleEdit = (row) => {
  dialogType.value = 'edit'
  Object.keys(tagForm).forEach(key => {
    tagForm[key] = row[key]
  })
  dialogVisible.value = true
}

// 删除标签
const handleDelete = async (row) => {
  if (!confirm('确定要删除这个标签吗？删除后无法恢复，且该标签下的文章将失去此标签。')) return
  
  try {
    await request.delete(`/tags/${row.id}`)
    getTags()
  } catch (error) {
    console.error('删除标签失败:', error)
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!validateForm()) return
  
  try {
    if (dialogType.value === 'create') {
      await request.post('/tags', tagForm)
    } else {
      await request.put(`/tags/${tagForm.id}`, tagForm)
    }
    dialogVisible.value = false
    getTags()
  } catch (error) {
    console.error('保存标签失败:', error)
  }
}

// 分页处理
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  getTags()
}

const handleCurrentChange = (page) => {
  currentPage.value = page
  getTags()
}

onMounted(() => {
  getTags()
})
</script>

<style scoped lang="scss">
.tag-list {
  padding: 24px;
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    
    h2 {
      margin: 0;
      font-size: 24px;
      color: var(--text-primary);
    }
  }
  
  .table-card {
    background: rgba(var(--background-primary-rgb), 0.8);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.1);
    
    .table-wrapper {
      position: relative;
      overflow-x: auto;
      
      &.is-loading {
        &::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(var(--background-primary-rgb), 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1;
        }
        
        &::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 40px;
          height: 40px;
          border: 3px solid var(--border-color);
          border-top-color: var(--primary-color);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          z-index: 2;
        }
      }
    }
    
    .inspira-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      
      th {
        background: rgba(var(--background-light-rgb), 0.5);
        padding: 16px;
        font-weight: 500;
        color: var(--text-secondary);
        text-align: left;
        white-space: nowrap;
        
        &:first-child {
          border-top-left-radius: 8px;
        }
        
        &:last-child {
          border-top-right-radius: 8px;
        }
      }
      
      td {
        padding: 16px;
        border-top: 1px solid var(--border-color);
        
        &.name-cell {
          font-weight: 500;
          color: var(--text-primary);
        }
        
        &.description-cell {
          max-width: 300px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        &.count-cell {
          text-align: center;
        }
      }
      
      tr {
        transition: background-color 0.3s ease;
        
        &:hover {
          background: rgba(var(--background-light-rgb), 0.3);
        }
      }
      
      .action-buttons {
        display: flex;
        gap: 8px;
        
        .action-button {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          background: rgba(var(--background-light-rgb), 0.5);
          color: var(--text-secondary);
          
          i {
            margin-right: 4px;
            font-size: 14px;
          }
          
          &:hover {
            background: rgba(var(--background-light-rgb), 0.8);
            color: var(--text-primary);
          }
          
          &.danger {
            background: rgba(var(--danger-color-rgb), 0.1);
            color: var(--danger-color);
            
            &:hover {
              background: rgba(var(--danger-color-rgb), 0.2);
            }
          }
        }
      }
    }
    
    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 24px;
      
      .pagination-info {
        display: flex;
        align-items: center;
        gap: 12px;
        color: var(--text-secondary);
        font-size: 14px;
        
        .page-size-selector {
          width: 100px;
        }
      }
      
      .pagination-buttons {
        display: flex;
        gap: 8px;
        
        .pagination-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 4px;
          font-size: 14px;
          border: 1px solid var(--border-color);
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.3s ease;
          
          &:hover:not(:disabled) {
            background: rgba(var(--background-light-rgb), 0.5);
            color: var(--text-primary);
            border-color: var(--primary-color);
          }
          
          &.active {
            background: var(--primary-color);
            color: white;
            border-color: var(--primary-color);
          }
          
          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        }
      }
    }
  }
  
  .dialog {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    
    &.is-active {
      opacity: 1;
      visibility: visible;
      
      .dialog-content {
        transform: translateY(0);
      }
    }
    
    .dialog-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(5px);
    }
    
    .dialog-content {
      position: relative;
      width: 90%;
      max-width: 500px;
      max-height: 90vh;
      background: rgba(var(--background-primary-rgb), 0.95);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
      overflow: hidden;
      transform: translateY(20px);
      transition: transform 0.3s ease;
      
      .dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid var(--border-color);
        
        h3 {
          margin: 0;
          font-size: 20px;
          color: var(--text-primary);
        }
        
        .close-button {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 4px;
          transition: color 0.3s ease;
          
          &:hover {
            color: var(--text-primary);
          }
        }
      }
      
      .dialog-form {
        padding: 20px;
        overflow-y: auto;
        
        .form-group {
          margin-bottom: 20px;
          
          label {
            display: block;
            margin-bottom: 8px;
            color: var(--text-secondary);
            font-size: 14px;
          }
          
          .error-message {
            display: block;
            margin-top: 4px;
            color: var(--danger-color);
            font-size: 12px;
          }
          
          .number-input {
            display: flex;
            align-items: center;
            gap: 8px;
            
            .number-button {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 32px;
              height: 32px;
              border-radius: 4px;
              border: 1px solid var(--border-color);
              background: transparent;
              color: var(--text-secondary);
              cursor: pointer;
              transition: all 0.3s ease;
              
              &:hover {
                background: rgba(var(--background-light-rgb), 0.5);
                color: var(--text-primary);
                border-color: var(--primary-color);
              }
            }
            
            .inspira-input {
              width: 80px;
              text-align: center;
            }
          }
        }
        
        .dialog-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid var(--border-color);
        }
      }
    }
  }
}

@keyframes spin {
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

.inspira-input,
.inspira-select,
.inspira-textarea {
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
  
  &.is-error {
    border-color: #ff6b6b;
    
    &:focus {
      box-shadow: 0 0 0 2px rgba(255, 107, 107, 0.1);
    }
  }
}

.inspira-textarea {
  height: auto;
  min-height: 80px;
  padding: 12px;
  resize: vertical;
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