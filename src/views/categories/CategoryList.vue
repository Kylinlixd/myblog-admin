<template>
  <div class="category-list">
    <a-page-header
      title="分类管理"
      subtitle="管理博客分类"
    >
      <template #extra>
        <a-button type="primary" @click="handleCreate">
          <plus-outlined /> 新建分类
        </a-button>
      </template>
    </a-page-header>
    
    <a-card class="data-card">
      <a-table
        :loading="loading"
        :columns="columns"
        :data-source="categories"
        :pagination="false"
        row-key="id"
        :expand-row-by-click="true"
      >
        <template #bodyCell="{ column, record }">
          <!-- 分类名称列 -->
          <template v-if="column.dataIndex === 'name'">
            <span>{{ record.name }}</span>
            <a-tag v-if="record.parentId" color="blue">子分类</a-tag>
          </template>
          
          <!-- 操作列 -->
          <template v-if="column.dataIndex === 'action'">
            <a-space>
              <a-button type="primary" size="small" @click.stop="handleEdit(record)">
                <template #icon><edit-outlined /></template>编辑
              </a-button>
              <a-button 
                v-if="!record.parentId" 
                type="primary" 
                size="small" 
                @click.stop="handleAddChild(record)"
              >
                <template #icon><plus-outlined /></template>添加子分类
              </a-button>
              <a-popconfirm
                :title="record.children && record.children.length ? 
                  '该分类包含子分类，删除将同时删除所有子分类，确定继续吗？' : 
                  '确定要删除该分类吗？'"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleDelete(record)"
              >
                <a-button type="primary" danger size="small" @click.stop>
                  <template #icon><delete-outlined /></template>删除
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>

          <!-- 创建时间列 -->
          <template v-if="column.dataIndex === 'createdAt'">
            {{ formatDate(record.createdAt) }}
          </template>
        </template>
      </a-table>
    </a-card>
    
    <!-- 分类编辑对话框 -->
    <a-modal
      v-model:visible="dialogVisible"
      :title="dialogType === 'create' ? '新建分类' : '编辑分类'"
      @ok="handleSubmit"
      :confirm-loading="formLoading"
      @cancel="dialogVisible = false"
    >
      <a-form
        ref="formRef"
        :model="categoryForm"
        :rules="rules"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
      >
        <a-form-item label="上级分类" name="parentId">
          <a-select
            v-model:value="categoryForm.parentId"
            placeholder="请选择上级分类"
            allowClear
          >
            <a-select-option
              v-for="item in categoryOptions"
              :key="item.id"
              :value="item.id"
            >
              {{ item.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        
        <a-form-item label="分类名称" name="name">
          <a-input v-model:value="categoryForm.name" placeholder="请输入分类名称" />
        </a-form-item>
        
        <a-form-item label="描述" name="description">
          <a-textarea
            v-model:value="categoryForm.description"
            :rows="3"
            placeholder="请输入分类描述"
          />
        </a-form-item>
        
        <a-form-item label="排序" name="sort">
          <a-input-number v-model:value="categoryForm.sort" :min="0" :max="999" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { getCategoryList, createCategory, updateCategory, deleteCategory } from '@/api/category'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons-vue'

// 表格列配置
const columns = [
  {
    title: '分类名称',
    dataIndex: 'name',
    key: 'name',
    width: '30%',
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
    width: '35%',
    ellipsis: true,
  },
  {
    title: '排序',
    dataIndex: 'sort',
    key: 'sort',
    width: '10%',
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: '15%',
  },
  {
    title: '操作',
    dataIndex: 'action',
    key: 'action',
    width: '20%',
  }
]

// 数据列表
const categories = ref([])
const loading = ref(false)
const formLoading = ref(false)
const formRef = ref(null)

// 编辑对话框
const dialogVisible = ref(false)
const dialogType = ref('create')
const categoryForm = reactive({
  id: '',
  parentId: undefined,
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

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString()
}

// 获取分类列表
const fetchCategories = async () => {
  loading.value = true
  try {
    const result = await getCategoryList()
    categories.value = result || []
    
    // 处理分类选项
    updateCategoryOptions()
  } catch (error) {
    console.error('获取分类列表失败:', error)
    message.error('获取分类列表失败')
  } finally {
    loading.value = false
  }
}

// 更新分类选项
const updateCategoryOptions = () => {
  // 过滤当前编辑的分类及其子分类，避免循环引用
  categoryOptions.value = categories.value.filter(item => {
    if (dialogType.value === 'edit' && item.id === categoryForm.id) return false
    if (dialogType.value === 'edit' && item.parentId === categoryForm.id) return false
    return true
  })
}

// 打开新建分类对话框
const handleCreate = () => {
  dialogType.value = 'create'
  categoryForm.id = ''
  categoryForm.parentId = undefined
  categoryForm.name = ''
  categoryForm.description = ''
  categoryForm.sort = 0
  dialogVisible.value = true
  updateCategoryOptions()
}

// 打开编辑分类对话框
const handleEdit = (record) => {
  dialogType.value = 'edit'
  categoryForm.id = record.id
  categoryForm.parentId = record.parentId
  categoryForm.name = record.name
  categoryForm.description = record.description
  categoryForm.sort = record.sort || 0
  dialogVisible.value = true
  updateCategoryOptions()
}

// 打开添加子分类对话框
const handleAddChild = (parent) => {
  dialogType.value = 'create'
  categoryForm.id = ''
  categoryForm.parentId = parent.id
  categoryForm.name = ''
  categoryForm.description = ''
  categoryForm.sort = 0
  dialogVisible.value = true
  updateCategoryOptions()
}

// 处理表单提交
const handleSubmit = async () => {
  try {
    if (formRef.value) {
      await formRef.value.validate()
    }
    
    formLoading.value = true
    
    if (dialogType.value === 'create') {
      await createCategory(categoryForm)
      message.success('分类创建成功')
    } else {
      await updateCategory(categoryForm.id, categoryForm)
      message.success('分类更新成功')
    }
    
    // 刷新分类列表
    fetchCategories()
    dialogVisible.value = false
  } catch (error) {
    console.error('保存分类失败:', error)
    message.error(error.message || '操作失败，请重试')
  } finally {
    formLoading.value = false
  }
}

// 删除分类
const handleDelete = async (record) => {
  try {
    loading.value = true
    await deleteCategory(record.id)
    message.success('分类删除成功')
    fetchCategories()
  } catch (error) {
    console.error('删除分类失败:', error)
    message.error('删除失败，请重试')
  } finally {
    loading.value = false
  }
}

// 组件挂载时获取分类列表
onMounted(() => {
  fetchCategories()
})
</script>

<style scoped>
.category-list {
  padding: 20px;
}

.data-card {
  margin-top: 16px;
}

:deep(.ant-table-row-expand-icon) {
  display: none;
}
</style> 