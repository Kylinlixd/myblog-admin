<template>
  <div class="category-list admin-page">
    <!-- 搜索表单 -->
    <a-form layout="inline" class="search-form admin-filter">
      <div class="search-form-left">
        <a-form-item label="名称">
          <a-input 
            v-model:value="searchForm.name" 
            placeholder="搜索分类名称" 
            allowClear 
          />
        </a-form-item>
        <a-form-item label="状态">
          <a-select
            v-model:value="searchForm.status"
            placeholder="选择状态"
            allowClear
          >
            <a-select-option value="active">启用</a-select-option>
            <a-select-option value="inactive">禁用</a-select-option>
          </a-select>
        </a-form-item>
      </div>
      <div class="search-form-right">
        <a-form-item>
          <a-space size="middle">
            <a-button type="primary" @click="handleSearch">
              <template #icon><SearchOutlined /></template>
              搜索
            </a-button>
            <a-button @click="resetSearch">
              <template #icon><ReloadOutlined /></template>
              重置
            </a-button>
          </a-space>
        </a-form-item>
      </div>
    </a-form>

    <!-- 操作按钮 -->
    <div class="table-operations admin-toolbar">
      <a-space size="middle">
        <a-button type="primary" @click="handleAdd">
          <template #icon><PlusOutlined /></template>
          新建分类
        </a-button>
        <a-popconfirm
          title="确定要删除选中的分类吗？"
          ok-text="确定"
          cancel-text="取消"
          @confirm="handleBatchDelete"
        >
          <a-button danger :disabled="!selectedRowKeys.length">
            <template #icon><DeleteOutlined /></template>
            批量删除
          </a-button>
        </a-popconfirm>
      </a-space>
    </div>

    <!-- 数据表格 -->
    <a-table
      :columns="columns"
      :data-source="categoryList"
      :loading="loading"
      :pagination="pagination"
      :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
      :row-key="record => record.id"
      @change="handleTableChange"
      :expandable="false"
      :indent-size="0"
      :scroll="{ x: '100%' }"
      class="responsive-table"
    >
      <template #bodyCell="{ column, record }">
        <!-- 状态列 -->
        <template v-if="column.dataIndex === 'status'">
          <a-tag :color="record.status === 'active' ? 'success' : 'default'">
            {{ record.status === 'active' ? '启用' : '禁用' }}
          </a-tag>
        </template>

        <!-- 操作列 -->
        <template v-else-if="column.dataIndex === 'action'">
          <a-space>
            <a-button type="primary" size="small" @click="handleEdit(record)">
              <template #icon><EditOutlined /></template>
              编辑
            </a-button>
            <a-popconfirm
              title="确定要删除该分类吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="handleDelete(record)"
            >
              <a-button type="primary" danger size="small">
                <template #icon><DeleteOutlined /></template>
                删除
              </a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- 分类编辑对话框 -->
    <a-modal
      v-model:open="dialogVisible"
      :title="dialogType === 'create' ? '新建分类' : '编辑分类'"
      wrap-class-name="admin-edit-modal"
      width="600px"
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
        
        <a-form-item label="状态" name="status">
          <a-select v-model:value="categoryForm.status">
            <a-select-option value="active">启用</a-select-option>
            <a-select-option value="inactive">禁用</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { message, Popconfirm as APopconfirm, Modal as AModal, Form as AForm, Input as AInput, Textarea as ATextarea, Select as ASelect } from 'ant-design-vue'
import { getCategoryList, createCategory, updateCategory, deleteCategory } from '@/api/category'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue'

// 表格列配置
const columns = [
  {
    title: '分类名称',
    dataIndex: 'name',
    key: 'name',
    width: '30%',
    ellipsis: true
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
    width: '35%',
    ellipsis: true
  },
  {
    title: '排序',
    dataIndex: 'sort',
    key: 'sort',
    width: '10%'
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: '15%'
  },
  {
    title: '操作',
    dataIndex: 'action',
    key: 'action',
    width: '20%',
    fixed: 'right'
  }
]

// 数据列表
const categoryList = ref([])
const loading = ref(false)
const formLoading = ref(false)
const formRef = ref(null)

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total) => `共 ${total} 条`,
  onChange: (page, pageSize) => {
    pagination.current = page
    pagination.pageSize = pageSize
    fetchCategories()
  },
  onShowSizeChange: (current, size) => {
    pagination.current = 1
    pagination.pageSize = size
    fetchCategories()
  }
})

// 表格选择相关
const selectedRowKeys = ref([])
const onSelectChange = (keys) => {
  selectedRowKeys.value = keys
}

// 表格变化处理
const handleTableChange = (pagination, filters, sorter) => {
  console.log('表格变化:', { pagination, filters, sorter })
  // 这里可以处理分页、筛选、排序等变化
}

// 搜索表单
const searchForm = reactive({
  name: '',
  status: undefined
})

// 处理搜索
const handleSearch = () => {
  console.log('搜索条件:', searchForm)
  fetchCategories()
}

// 重置搜索
const resetSearch = () => {
  searchForm.name = ''
  searchForm.status = undefined
  fetchCategories()
}

// 编辑对话框
const dialogVisible = ref(false)
const dialogType = ref('create')
const categoryForm = reactive({
  id: '',
  name: '',
  description: '',
  status: 'active'
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
    console.log('分类列表API返回:', result);
    
    if (result && result.results) {
      // 标准分页格式
      categoryList.value = (result.results || []).map(item => ({
        ...item,
        status: item.status || 'inactive' // 确保有默认状态
      }));
    } else if (result && Array.isArray(result)) {
      // 直接返回数组
      categoryList.value = result.map(item => ({
        ...item,
        status: item.status || 'inactive'
      }));
    } else if (result && typeof result === 'object') {
      // 如果返回的是对象，尝试提取数据
      let items = [];
      if (Array.isArray(result.data)) {
        items = result.data;
      } else if (result.data && Array.isArray(result.data.results)) {
        items = result.data.results;
      } else if (result.data && result.data.items) {
        items = result.data.items;
      }
      categoryList.value = items.map(item => ({
        ...item,
        status: item.status || 'inactive'
      }));
    } else {
      console.error('分类列表返回异常:', result);
      categoryList.value = [];
    }
  } catch (error) {
    console.error('获取分类列表失败:', error)
    message.error('获取分类列表失败')
    categoryList.value = [];
  } finally {
    loading.value = false
  }
}

// 打开新建分类对话框
const handleAdd = () => {
  dialogType.value = 'create'
  categoryForm.id = ''
  categoryForm.name = ''
  categoryForm.description = ''
  categoryForm.status = 'active'
  dialogVisible.value = true
}

// 打开编辑分类对话框
const handleEdit = (record) => {
  dialogType.value = 'edit'
  categoryForm.id = record.id
  categoryForm.name = record.name
  categoryForm.description = record.description
  categoryForm.status = record.status || 'inactive'
  dialogVisible.value = true
}

// 处理表单提交
const handleSubmit = async () => {
  try {
    if (formRef.value) {
      await formRef.value.validate()
    }
    
    formLoading.value = true
    
    const submitData = {
      ...categoryForm,
      status: categoryForm.status || 'inactive'
    }
    
    if (dialogType.value === 'create') {
      await createCategory(submitData)
      message.success('分类创建成功')
    } else {
      await updateCategory(submitData.id, submitData)
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

// 批量删除
const handleBatchDelete = async () => {
  if (!selectedRowKeys.value.length) {
    message.warning('请选择要删除的分类')
    return
  }

  try {
    loading.value = true
    await Promise.all(selectedRowKeys.value.map(id => deleteCategory(id)))
    message.success('批量删除成功')
    selectedRowKeys.value = []
    fetchCategories()
  } catch (error) {
    console.error('批量删除失败:', error)
    message.error('批量删除失败，请重试')
  } finally {
    loading.value = false
  }
}

// 组件挂载时获取分类列表
onMounted(() => {
  fetchCategories()
})
</script>

<style scoped lang="scss">
.category-list {
  padding: 24px;
  background: #fff;
  border-radius: 4px;
}

.search-form {
  margin-bottom: 24px;
  padding: 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  
  .search-form-left {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 16px;
    
    .ant-form-item {
      margin-bottom: 0;
      margin-right: 0;
    }
  }
  
  .search-form-right {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: flex-start;
    
    .ant-form-item {
      margin-bottom: 0;
      margin-right: 0;
    }
  }
}

.table-operations {
  margin-bottom: 16px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.responsive-table {
  width: 100%;
}

@media screen and (max-width: 1200px) {
  .search-form {
    display: block;
  }
  
  .table-operations {
    display: block;
  }
}

// 响应式布局
@media (max-width: 768px) {
  .category-list {
    padding: 16px;

    .search-form {
      padding: 16px;
    }

    .table-operations {
      flex-direction: column;
      gap: 8px;

      .ant-space {
        width: 100%;
        justify-content: flex-start;
      }
    }
  }
}
</style>
