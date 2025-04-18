<template>
  <div class="category-list">
    <PageHeader title="分类管理" icon="Folder">
      <template #actions>
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>新建分类
        </el-button>
      </template>
    </PageHeader>
    
    <!-- 分类数据表格 -->
    <DataTable
      :loading="loading"
      :columns="columns"
    >
      <tr v-for="category in categories" :key="category.id">
        <td class="name-cell">
          <span class="category-name">{{ category.name }}</span>
        </td>
        <td class="description-cell">{{ category.description }}</td>
        <td class="count-cell">{{ category.postCount }}</td>
        <td>{{ category.createdAt }}</td>
        <td>
          <div class="action-buttons">
            <el-button type="primary" link @click="handleEdit(category)">
              <el-icon><Edit /></el-icon>编辑
            </el-button>
            <el-button type="primary" link @click="handleAddChild(category)">
              <el-icon><Plus /></el-icon>添加子分类
            </el-button>
            <el-button type="danger" link @click="handleDelete(category)">
              <el-icon><Delete /></el-icon>删除
            </el-button>
          </div>
        </td>
      </tr>
      <template v-for="category in categories" :key="`children-${category.id}`">
        <tr v-for="child in category.children" :key="child.id" class="child-row">
          <td class="name-cell">
            <span class="category-name child">{{ child.name }}</span>
          </td>
          <td class="description-cell">{{ child.description }}</td>
          <td class="count-cell">{{ child.postCount }}</td>
          <td>{{ child.createTime }}</td>
          <td>
            <div class="action-buttons">
              <el-button type="primary" link @click="handleEdit(child)">
                <el-icon><Edit /></el-icon>编辑
              </el-button>
              <el-button type="danger" link @click="handleDelete(child)">
                <el-icon><Delete /></el-icon>删除
              </el-button>
            </div>
          </td>
        </tr>
      </template>
    </DataTable>
    
    <!-- 分类编辑对话框 -->
    <DataFormDialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新建分类' : '编辑分类'"
      :model="categoryForm"
      :rules="rules"
      :loading="formLoading"
      @submit="handleSubmit"
    >
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
    </DataFormDialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCategoryList, createCategory, updateCategory, deleteCategory } from '../../api/category'
import { Plus, Edit, Delete, Folder } from '@element-plus/icons-vue'

// 导入通用组件
import DataTable from '../../components/common/DataTable.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import DataFormDialog from '../../components/common/DataFormDialog.vue'

// 表格列配置
const columns = [
  { label: '分类名称', width: '200px' },
  { label: '描述', width: '300px' },
  { label: '文章数量', width: '100px' },
  { label: '创建时间', width: '180px' },
  { label: '操作', width: '250px' }
]

// 数据列表
const categories = ref([])
const loading = ref(false)
const formLoading = ref(false)

// 编辑对话框
const dialogVisible = ref(false)
const dialogType = ref('create')
const categoryForm = reactive({
  id: '',
  parentId: '',
  name: '',
  description: '',
  sort: 0
})

// 表单规则
const rules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 200, message: '长度不能超过 200 个字符', trigger: 'blur' }
  ]
}

// 分类选项（用于选择器）
const categoryOptions = ref([])

// 获取分类列表
const getCategories = async () => {
  loading.value = true
  try {
    const response = await getCategoryList()
    if (response.code === 200) {
      categories.value = response.data || []
      
      // 更新分类选项（排除当前编辑的分类及其子分类）
      categoryOptions.value = categories.value.filter(item => {
        if (categoryForm.id && item.id === categoryForm.id) return false
        if (categoryForm.id && item.parentId === categoryForm.id) return false
        return true
      })
    } else {
      ElMessage.error(response.message || '获取分类列表失败')
    }
  } catch (error) {
    console.error('获取分类列表失败:', error)
    ElMessage.error('获取分类列表失败')
  } finally {
    loading.value = false
  }
}

// 打开新建分类对话框
const handleCreate = () => {
  dialogType.value = 'create'
  Object.keys(categoryForm).forEach(key => {
    categoryForm[key] = key === 'sort' ? 0 : ''
  })
  dialogVisible.value = true
}

// 打开编辑分类对话框
const handleEdit = (row) => {
  dialogType.value = 'edit'
  Object.keys(categoryForm).forEach(key => {
    categoryForm[key] = row[key]
  })
  dialogVisible.value = true
}

// 打开添加子分类对话框
const handleAddChild = (parent) => {
  dialogType.value = 'create'
  Object.keys(categoryForm).forEach(key => {
    categoryForm[key] = key === 'sort' ? 0 : ''
  })
  categoryForm.parentId = parent.id
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  formLoading.value = true
  try {
    if (dialogType.value === 'create') {
      const response = await createCategory(categoryForm)
      if (response.code === 200) {
        ElMessage.success('创建成功')
        dialogVisible.value = false
        getCategories()
      } else {
        ElMessage.error(response.message || '创建失败')
      }
    } else {
      const response = await updateCategory(categoryForm.id, categoryForm)
      if (response.code === 200) {
        ElMessage.success('更新成功')
        dialogVisible.value = false
        getCategories()
      } else {
        ElMessage.error(response.message || '更新失败')
      }
    }
  } catch (error) {
    console.error('提交分类失败:', error)
    ElMessage.error('操作失败，请稍后重试')
  } finally {
    formLoading.value = false
  }
}

// 删除分类
const handleDelete = (row) => {
  ElMessageBox.confirm(
    row.children && row.children.length ? 
      '该分类包含子分类，删除将同时删除所有子分类，确定继续吗？' : 
      '确定要删除该分类吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const response = await deleteCategory(row.id)
      if (response.code === 200) {
        ElMessage.success('删除成功')
        getCategories()
      } else {
        ElMessage.error(response.message || '删除失败')
      }
    } catch (error) {
      console.error('删除分类失败:', error)
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

onMounted(() => {
  getCategories()
})
</script>

<style lang="scss" scoped>
.category-list {
  padding: 20px;
}

.name-cell {
  .category-name {
    font-weight: 500;
    
    &.child {
      position: relative;
      padding-left: 20px;
      
      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        width: 12px;
        height: 12px;
        margin-top: -6px;
        border-left: 1px solid #909399;
        border-bottom: 1px solid #909399;
      }
    }
  }
}

.description-cell {
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.count-cell {
  text-align: center;
}

.child-row {
  background-color: rgba(0, 0, 0, 0.02);
}
</style> 