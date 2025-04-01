<template>
  <div class="post-list">
    <div class="page-header">
      <h2>文章管理</h2>
      <button class="inspira-button" @click="handleCreate">
        <i class="icon-plus"></i>新建文章
      </button>
    </div>
    
    <div class="filter-card">
      <form class="filter-form" @submit.prevent="handleSearch">
        <div class="form-group">
          <label>标题</label>
          <div class="input-wrapper">
            <input
              v-model="filterForm.title"
              type="text"
              placeholder="请输入标题"
              class="inspira-input"
            />
            <i class="icon-clear" v-if="filterForm.title" @click="filterForm.title = ''"></i>
          </div>
        </div>
        
        <div class="form-group">
          <label>分类</label>
          <div class="select-wrapper">
            <select v-model="filterForm.categoryId" class="inspira-select">
              <option value="">请选择分类</option>
              <option
                v-for="item in categories"
                :key="item.id"
                :value="item.id"
              >{{ item.name }}</option>
            </select>
            <i class="icon-arrow-down"></i>
          </div>
        </div>
        
        <div class="form-group">
          <label>状态</label>
          <div class="select-wrapper">
            <select v-model="filterForm.status" class="inspira-select">
              <option value="">请选择状态</option>
              <option value="published">已发布</option>
              <option value="draft">草稿</option>
            </select>
            <i class="icon-arrow-down"></i>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="submit" class="inspira-button">
            <i class="icon-search"></i>搜索
          </button>
          <button type="button" class="inspira-button secondary" @click="handleReset">
            <i class="icon-refresh"></i>重置
          </button>
        </div>
      </form>
    </div>
    
    <div class="table-card">
      <div class="table-wrapper" :class="{ 'is-loading': loading }">
        <table class="inspira-table">
          <thead>
            <tr>
              <th>标题</th>
              <th>分类</th>
              <th>作者</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in posts" :key="row.id">
              <td class="title-cell">{{ row.title }}</td>
              <td>{{ row.categoryName }}</td>
              <td>{{ row.author }}</td>
              <td>
                <span class="status-tag" :class="row.status">
                  {{ row.status === 'published' ? '已发布' : '草稿' }}
                </span>
              </td>
              <td>{{ row.createTime }}</td>
              <td>
                <div class="action-buttons">
                  <button class="action-button" @click="handleEdit(row)">
                    <i class="icon-edit"></i>编辑
                  </button>
                  <button class="action-button" @click="handlePreview(row)">
                    <i class="icon-view"></i>预览
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
    
    <!-- 文章编辑对话框 -->
    <div class="dialog" :class="{ 'is-active': dialogVisible }">
      <div class="dialog-overlay" @click="dialogVisible = false"></div>
      <div class="dialog-content">
        <div class="dialog-header">
          <h3>{{ dialogType === 'create' ? '新建文章' : '编辑文章' }}</h3>
          <button class="close-button" @click="dialogVisible = false">
            <i class="icon-close"></i>
          </button>
        </div>
        
        <form class="dialog-form" @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>标题</label>
            <input
              v-model="postForm.title"
              type="text"
              class="inspira-input"
              placeholder="请输入标题"
              :class="{ 'is-error': errors.title }"
            />
            <span class="error-message" v-if="errors.title">{{ errors.title }}</span>
          </div>
          
          <div class="form-group">
            <label>分类</label>
            <div class="select-wrapper">
              <select v-model="postForm.categoryId" class="inspira-select">
                <option value="">请选择分类</option>
                <option
                  v-for="item in categories"
                  :key="item.id"
                  :value="item.id"
                >{{ item.name }}</option>
              </select>
              <i class="icon-arrow-down"></i>
            </div>
            <span class="error-message" v-if="errors.categoryId">{{ errors.categoryId }}</span>
          </div>
          
          <div class="form-group">
            <label>标签</label>
            <div class="tags-input">
              <div class="selected-tags">
                <span
                  v-for="tag in selectedTags"
                  :key="tag.id"
                  class="tag"
                >
                  {{ tag.name }}
                  <i class="icon-close" @click="removeTag(tag)"></i>
                </span>
              </div>
              <input
                v-model="tagInput"
                type="text"
                class="inspira-input"
                placeholder="输入标签名称"
                @keydown.enter.prevent="addTag"
              />
            </div>
          </div>
          
          <div class="form-group">
            <label>内容</label>
            <textarea
              v-model="postForm.content"
              class="inspira-textarea"
              :rows="15"
              placeholder="请输入文章内容"
              :class="{ 'is-error': errors.content }"
            ></textarea>
            <span class="error-message" v-if="errors.content">{{ errors.content }}</span>
          </div>
          
          <div class="form-group">
            <label>状态</label>
            <div class="radio-group">
              <label class="radio-label">
                <input
                  type="radio"
                  v-model="postForm.status"
                  value="draft"
                  class="inspira-radio"
                />
                <span>草稿</span>
              </label>
              <label class="radio-label">
                <input
                  type="radio"
                  v-model="postForm.status"
                  value="published"
                  class="inspira-radio"
                />
                <span>发布</span>
              </label>
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

// 表单错误
const errors = reactive({
  title: '',
  categoryId: '',
  content: ''
})

// 标签输入
const tagInput = ref('')
const selectedTags = computed(() => {
  return tags.value.filter(tag => postForm.tags.includes(tag.id))
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

// 分页处理
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  getPosts()
}

const handleCurrentChange = (page) => {
  currentPage.value = page
  getPosts()
}

// 标签处理
const addTag = () => {
  if (!tagInput.value) return
  
  const existingTag = tags.value.find(tag => tag.name === tagInput.value)
  if (existingTag) {
    if (!postForm.tags.includes(existingTag.id)) {
      postForm.tags.push(existingTag.id)
    }
  } else {
    // 创建新标签
    const newTag = {
      id: Date.now(),
      name: tagInput.value
    }
    tags.value.push(newTag)
    postForm.tags.push(newTag.id)
  }
  
  tagInput.value = ''
}

const removeTag = (tag) => {
  postForm.tags = postForm.tags.filter(id => id !== tag.id)
}

// 表单验证
const validateForm = () => {
  let isValid = true
  errors.title = ''
  errors.categoryId = ''
  errors.content = ''
  
  if (!postForm.title) {
    errors.title = '请输入标题'
    isValid = false
  } else if (postForm.title.length < 2 || postForm.title.length > 100) {
    errors.title = '长度在 2 到 100 个字符'
    isValid = false
  }
  
  if (!postForm.categoryId) {
    errors.categoryId = '请选择分类'
    isValid = false
  }
  
  if (!postForm.content) {
    errors.content = '请输入内容'
    isValid = false
  } else if (postForm.content.length < 10) {
    errors.content = '内容不能少于 10 个字符'
    isValid = false
  }
  
  return isValid
}

// 创建文章
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
  // 实现预览逻辑
}

// 删除文章
const handleDelete = async (row) => {
  if (!confirm('确定要删除这篇文章吗？')) return
  
  try {
    await request.delete(`/posts/${row.id}`)
    getPosts()
  } catch (error) {
    console.error('删除文章失败:', error)
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!validateForm()) return
  
  try {
    if (dialogType.value === 'create') {
      await request.post('/posts', postForm)
    } else {
      await request.put(`/posts/${postForm.id}`, postForm)
    }
    dialogVisible.value = false
    getPosts()
  } catch (error) {
    console.error('保存文章失败:', error)
  }
}

onMounted(() => {
  getPosts()
  getCategories()
  getTags()
})
</script>

<style scoped lang="scss">
.post-list {
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
  
  .filter-card {
    background: rgba(var(--background-primary-rgb), 0.8);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.1);
    
    .filter-form {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      
      .form-group {
        margin: 0;
        
        label {
          display: block;
          margin-bottom: 8px;
          color: var(--text-secondary);
          font-size: 14px;
        }
        
        .input-wrapper {
          position: relative;
          
          .icon-clear {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-secondary);
            cursor: pointer;
            transition: color 0.3s ease;
            
            &:hover {
              color: var(--text-primary);
            }
          }
        }
        
        .select-wrapper {
          position: relative;
          
          .icon-arrow-down {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-secondary);
            pointer-events: none;
          }
        }
      }
      
      .form-actions {
        display: flex;
        gap: 12px;
        align-items: flex-end;
      }
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
        
        &.title-cell {
          max-width: 300px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
      
      tr {
        transition: background-color 0.3s ease;
        
        &:hover {
          background: rgba(var(--background-light-rgb), 0.3);
        }
      }
      
      .status-tag {
        display: inline-flex;
        align-items: center;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
        
        &.published {
          background: rgba(var(--success-color-rgb), 0.1);
          color: var(--success-color);
        }
        
        &.draft {
          background: rgba(var(--warning-color-rgb), 0.1);
          color: var(--warning-color);
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
  min-height: 120px;
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

.inspira-radio {
  appearance: none;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(0, 255, 255, 0.3);
  border-radius: 50%;
  margin: 0;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
  
  &:checked {
    border-color: rgba(0, 255, 255, 0.8);
    
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 8px;
      height: 8px;
      background: rgba(0, 255, 255, 0.8);
      border-radius: 50%;
    }
  }
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