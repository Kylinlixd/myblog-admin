<template>
  <div class="category-list">
    <div class="page-header">
      <h2>分类管理</h2>
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>新建分类
      </el-button>
    </div>
    
    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="categories"
        row-key="id"
        border
        default-expand-all
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        style="width: 100%"
      >
        <el-table-column prop="name" label="分类名称" min-width="200" />
        <el-table-column prop="description" label="描述" min-width="300" show-overflow-tooltip />
        <el-table-column prop="postCount" label="文章数量" width="100" align="center" />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button-group>
              <el-button type="primary" link @click="handleEdit(row)">
                <el-icon><Edit /></el-icon>编辑
              </el-button>
              <el-button type="primary" link @click="handleAddChild(row)">
                <el-icon><Plus /></el-icon>添加子分类
              </el-button>
              <el-button type="danger" link @click="handleDelete(row)">
                <el-icon><Delete /></el-icon>删除
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 分类编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新建分类' : '编辑分类'"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="categoryForm"
        :model="categoryForm"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="上级分类">
          <el-tree-select
            v-model="categoryForm.parentId"
            :data="categoryOptions"
            :props="{ label: 'name', value: 'id' }"
            placeholder="请选择上级分类"
            clearable
            check-strictly
          />
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
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import request from '../../utils/request'

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

// 分类选项（用于树形选择器）
const categoryOptions = ref([])

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 200, message: '长度不能超过 200 个字符', trigger: 'blur' }
  ]
}

// 获取分类列表
const getCategories = async () => {
  loading.value = true
  try {
    const list = await request.get('/categories')
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
const handleDelete = (row) => {
  ElMessageBox.confirm(
    '确定要删除这个分类吗？删除后无法恢复，且该分类下的文章将变为未分类状态。',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await request.delete(`/categories/${row.id}`)
      ElMessage.success('删除成功')
      getCategories()
    } catch (error) {
      console.error('删除分类失败:', error)
    }
  })
}

// 提交表单
const handleSubmit = async () => {
  try {
    if (dialogType.value === 'create') {
      await request.post('/categories', categoryForm)
      ElMessage.success('创建成功')
    } else {
      await request.put(`/categories/${categoryForm.id}`, categoryForm)
      ElMessage.success('更新成功')
    }
    dialogVisible.value = false
    getCategories()
  } catch (error) {
    console.error('保存分类失败:', error)
  }
}

onMounted(() => {
  getCategories()
})
</script>

<style scoped lang="scss">
.category-list {
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
}
</style> 