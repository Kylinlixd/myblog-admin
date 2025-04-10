<template>
  <div class="category-list">
    <div class="page-header">
      <h2>分类管理</h2>
      <button class="inspira-button" @click="handleCreate">
        <i class="icon-plus"></i>新建分类
      </button>
    </div>
    
    <div class="table-card">
      <div class="table-wrapper" :class="{ 'is-loading': loading }">
        <table class="inspira-table">
          <thead>
            <tr>
              <th>分类名称</th>
              <th>描述</th>
              <th>文章数量</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="category in categories" :key="category.id">
              <tr>
                <td class="name-cell">
                  <span class="category-name">{{ category.name }}</span>
                </td>
                <td class="description-cell">{{ category.description }}</td>
                <td class="count-cell">{{ category.postCount }}</td>
                <td>{{ category.createTime }}</td>
                <td>
                  <div class="action-buttons">
                    <button class="action-button" @click="handleEdit(category)">
                      <i class="icon-edit"></i>编辑
                    </button>
                    <button class="action-button" @click="handleAddChild(category)">
                      <i class="icon-plus"></i>添加子分类
                    </button>
                    <button class="action-button danger" @click="handleDelete(category)">
                      <i class="icon-delete"></i>删除
                    </button>
                  </div>
                </td>
              </tr>
              <template v-if="category.children && category.children.length">
                <tr v-for="child in category.children" :key="child.id" class="child-row">
                  <td class="name-cell">
                    <span class="category-name child">{{ child.name }}</span>
                  </td>
                  <td class="description-cell">{{ child.description }}</td>
                  <td class="count-cell">{{ child.postCount }}</td>
                  <td>{{ child.createTime }}</td>
                  <td>
                    <div class="action-buttons">
                      <button class="action-button" @click="handleEdit(child)">
                        <i class="icon-edit"></i>编辑
                      </button>
                      <button class="action-button" @click="handleAddChild(child)">
                        <i class="icon-plus"></i>添加子分类
                      </button>
                      <button class="action-button danger" @click="handleDelete(child)">
                        <i class="icon-delete"></i>删除
                      </button>
                    </div>
                  </td>
                </tr>
              </template>
            </template>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- 分类编辑对话框 -->
    <div class="dialog" :class="{ 'is-active': dialogVisible }">
      <div class="dialog-overlay" @click="dialogVisible = false"></div>
      <div class="dialog-content">
        <div class="dialog-header">
          <h3>{{ dialogType === 'create' ? '新建分类' : '编辑分类' }}</h3>
          <button class="close-button" @click="dialogVisible = false">
            <i class="icon-close"></i>
          </button>
        </div>
        
        <el-form class="dialog-form" @submit.prevent="handleSubmit">
          <el-form-item label="上级分类" prop="parentId">
            <el-select
              v-model="categoryForm.parentId"
              placeholder="请选择上级分类"
              clearable
            >
              <el-option
                v-for="item in categoryOptions"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="分类名称" prop="name">
            <el-input v-model="categoryForm.name" placeholder="请输入分类名称" />
          </el-form-item>
          
          <el-form-item label="描述" prop="description">
            <el-input
              v-model="categoryForm.description"
              type="textarea"
              :rows="3"
              placeholder="请输入分类描述"
            />
          </el-form-item>
          
          <el-form-item label="排序" prop="sort">
            <el-input-number v-model="categoryForm.sort" :min="0" :max="999" />
          </el-form-item>
          
          <div class="dialog-footer">
            <button type="button" class="inspira-button secondary" @click="dialogVisible = false">
              取消
            </button>
            <button type="submit" class="inspira-button">
              确定
            </button>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCategoryList, createCategory, updateCategory, deleteCategory } from '../../api/category'

// 数据列表
const categories = ref([])
const loading = ref(false)

// 编辑表单
const dialogVisible = ref(false)
const dialogType = ref('create')
const categoryForm = reactive({
  id: '',
  parentId: '',
  name: '',
  description: '',
  sort: 0
})

// 表单错误
const errors = reactive({
  name: '',
  description: ''
})

// 分类选项（用于选择器）
const categoryOptions = ref([])

// 表单验证
const validateForm = () => {
  let isValid = true
  errors.name = ''
  errors.description = ''
  
  if (!categoryForm.name) {
    errors.name = '请输入分类名称'
    isValid = false
  } else if (categoryForm.name.length < 2 || categoryForm.name.length > 50) {
    errors.name = '长度在 2 到 50 个字符'
    isValid = false
  }
  
  if (categoryForm.description && categoryForm.description.length > 200) {
    errors.description = '长度不能超过 200 个字符'
    isValid = false
  }
  
  return isValid
}

// 获取分类列表
const getCategories = async () => {
  loading.value = true
  try {
    const list = await getCategoryList()
    categories.value = list
    // 更新分类选项（排除当前编辑的分类及其子分类）
    categoryOptions.value = list.filter(item => {
      if (categoryForm.id && item.id === categoryForm.id) return false
      if (categoryForm.id && item.parentId === categoryForm.id) return false
      return true
    })
  } catch (error) {
    console.error('获取分类列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 新建分类
const handleCreate = () => {
  dialogType.value = 'create'
  Object.keys(categoryForm).forEach(key => {
    categoryForm[key] = key === 'sort' ? 0 : ''
  })
  dialogVisible.value = true
}

// 编辑分类
const handleEdit = (row) => {
  dialogType.value = 'edit'
  Object.keys(categoryForm).forEach(key => {
    categoryForm[key] = row[key]
  })
  dialogVisible.value = true
}

// 添加子分类
const handleAddChild = (row) => {
  dialogType.value = 'create'
  Object.keys(categoryForm).forEach(key => {
    categoryForm[key] = key === 'sort' ? 0 : ''
  })
  categoryForm.parentId = row.id
  dialogVisible.value = true
}

// 删除分类
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除"${row.name}"分类吗？删除后无法恢复，且相关文章将失去此分类。`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deleteCategory(row.id)
    ElMessage.success('删除成功')
    getCategories()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!validateForm()) return
  
  try {
    if (dialogType.value === 'create') {
      await createCategory(categoryForm)
      ElMessage.success('创建成功')
    } else {
      const { id, ...updateData } = categoryForm
      await updateCategory(id, updateData)
      ElMessage.success('更新成功')
    }
    
    dialogVisible.value = false
    getCategories()
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error(error.message || '操作失败，请稍后重试')
  }
}

onMounted(() => {
  getCategories()
})
</script>

<style scoped lang="scss">
.category-list {
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
          .category-name {
            display: flex;
            align-items: center;
            font-weight: 500;
            
            &.child {
              padding-left: 24px;
              position: relative;
              
              &::before {
                content: '';
                position: absolute;
                left: 8px;
                top: 50%;
                width: 12px;
                height: 1px;
                background-color: var(--border-color);
              }
              
              &::after {
                content: '';
                position: absolute;
                left: 8px;
                top: 0;
                width: 1px;
                height: 100%;
                background-color: var(--border-color);
              }
            }
          }
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
        
        &.child-row {
          background: rgba(var(--background-light-rgb), 0.1);
          
          &:hover {
            background: rgba(var(--background-light-rgb), 0.3);
          }
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