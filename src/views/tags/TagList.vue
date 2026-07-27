<template>
  <div class="tag-list admin-page">
    <PageHeader title="标签管理" subtitle="维护跨文章使用的主题标签。">
      <template #actions>
        <a-button type="primary" @click="handleAdd">
          <template #icon><PlusOutlined /></template>
          新建标签
        </a-button>
      </template>
    </PageHeader>

    <!-- 搜索表单 -->
    <a-form layout="inline" class="search-form admin-filter">
      <a-form-item label="名称">
        <a-input v-model:value="searchForm.name" placeholder="搜索标签名称" allowClear />
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
      <a-form-item>
        <a-space>
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
    </a-form>

    <!-- 操作按钮 -->
    <div class="table-operations admin-toolbar">
      <a-space>
        <a-popconfirm
          title="确定要删除选中的标签吗？"
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
    <a-card class="admin-table-card">
      <a-table
      :columns="columns"
      :data-source="tagList"
      :loading="loading"
      :pagination="pagination"
      :row-selection="{
        selectedRowKeys,
        onChange: onSelectChange,
        type: 'checkbox'
      }"
      :row-key="record => record.id"
      @change="handleTableChange"
      :scroll="{ x: 800 }"
    >
      <template #bodyCell="{ column, record }">
        <!-- 状态列 -->
        <template v-if="column.dataIndex === 'status'">
          <a-tag :color="record.status === 'active' ? 'success' : 'default'">
            {{ record.status === 'active' ? '启用' : '禁用' }}
          </a-tag>
        </template>

        <!-- 创建时间列 -->
        <template v-else-if="column.dataIndex === 'createdAt'">
          {{ formatDate(record.createdAt) }}
        </template>

        <!-- 更新时间列 -->
        <template v-else-if="column.dataIndex === 'updatedAt'">
          {{ formatDate(record.updatedAt) }}
        </template>

        <!-- 操作列 -->
        <template v-else-if="column.dataIndex === 'action'">
          <a-space class="table-row-actions">
            <a-button type="primary" size="small" @click="handleEdit(record)">
              <template #icon><EditOutlined /></template>
              编辑
            </a-button>
            <a-popconfirm
              title="确定要删除该标签吗？"
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
    </a-card>

    <!-- 标签编辑对话框 -->
    <a-modal
      v-model:open="dialogVisible"
      :title="dialogType === 'create' ? '新建标签' : '编辑标签'"
      wrap-class-name="admin-edit-modal"
      @ok="handleSubmit"
      :confirmLoading="formLoading"
      width="600px"
    >
      <a-form
        ref="formRef"
        :model="tagForm"
        :rules="rules"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
      >
        <a-form-item label="标签名称" name="name">
          <a-input v-model:value="tagForm.name" placeholder="请输入标签名称" />
        </a-form-item>
        
        <a-form-item label="描述" name="description">
          <a-textarea
            v-model:value="tagForm.description"
            :rows="3"
            placeholder="请输入标签描述"
          />
        </a-form-item>
        
        <a-form-item label="状态" name="status">
          <a-select v-model:value="tagForm.status">
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
import { getTagList, createTag, updateTag, deleteTag } from '@/api/tag'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'

// 表格列配置
const columns = [
  {
    title: '标签名称',
    dataIndex: 'name',
    key: 'name',
    width: '25%',
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
    width: '30%',
    ellipsis: true,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: '10%',
  },
  {
    title: '使用次数',
    dataIndex: 'useCount',
    key: 'useCount',
    width: '10%',
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: '15%',
  },
  {
    title: '更新时间',
    dataIndex: 'updatedAt',
    key: 'updatedAt',
    width: '15%',
  },
  {
    title: '操作',
    dataIndex: 'action',
    key: 'action',
    width: '20%',
    fixed: 'right',
  }
]

// 数据列表
const tagList = ref([])
const loading = ref(false)
const formLoading = ref(false)
const formRef = ref(null)

// 表格选择相关
const selectedRowKeys = ref([])
const onSelectChange = (keys) => {
  selectedRowKeys.value = keys
}

// 表格变化处理
const handleTableChange = (pagination, filters, sorter) => {
  // 这里可以处理分页、筛选、排序等变化
}

// 搜索表单
const searchForm = reactive({
  name: '',
  status: undefined
})

// 处理搜索
const handleSearch = () => {
  fetchTags()
}

// 重置搜索
const resetSearch = () => {
  searchForm.name = ''
  searchForm.status = undefined
  fetchTags()
}

// 编辑对话框
const dialogVisible = ref(false)
const dialogType = ref('create')
const tagForm = reactive({
  id: '',
  name: '',
  description: '',
  status: 'active'
})

// 表单规则
const rules = {
  name: [
    { required: true, message: '请输入标签名称', trigger: 'blur' },
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

// 获取标签列表
const fetchTags = async () => {
  loading.value = true
  try {
    const result = await getTagList()
    
    if (result && result.results) {
      // 标准分页格式
      tagList.value = (result.results || []).map(item => ({
        ...item,
        status: item.status || 'inactive' // 确保有默认状态
      }));
    } else if (result && Array.isArray(result)) {
      // 直接返回数组
      tagList.value = result.map(item => ({
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
      tagList.value = items.map(item => ({
        ...item,
        status: item.status || 'inactive'
      }));
    } else {
      console.error('标签列表返回异常:', result);
      tagList.value = [];
    }
  } catch (error) {
    console.error('获取标签列表失败:', error)
    message.error('获取标签列表失败')
    tagList.value = [];
  } finally {
    loading.value = false
  }
}

// 打开新建标签对话框
const handleAdd = () => {
  dialogType.value = 'create'
  tagForm.id = ''
  tagForm.name = ''
  tagForm.description = ''
  tagForm.status = 'active'
  dialogVisible.value = true
}

// 打开编辑标签对话框
const handleEdit = (record) => {
  dialogType.value = 'edit'
  tagForm.id = record.id
  tagForm.name = record.name
  tagForm.description = record.description
  tagForm.status = record.status || 'inactive' // 确保编辑时有状态值
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
      ...tagForm,
      status: tagForm.status || 'inactive' // 确保提交时有状态值
    }
    
    if (dialogType.value === 'create') {
      await createTag(submitData)
      message.success('标签创建成功')
    } else {
      await updateTag(submitData.id, submitData)
      message.success('标签更新成功')
    }
    
    // 刷新标签列表
    fetchTags()
    dialogVisible.value = false
  } catch (error) {
    console.error('保存标签失败:', error)
    message.error(error.message || '操作失败，请重试')
  } finally {
    formLoading.value = false
  }
}

// 删除标签
const handleDelete = async (record) => {
  try {
    loading.value = true
    await deleteTag(record.id)
    message.success('标签删除成功')
    fetchTags()
  } catch (error) {
    console.error('删除标签失败:', error)
    message.error('删除失败，请重试')
  } finally {
    loading.value = false
  }
}

// 批量删除
const handleBatchDelete = async () => {
  if (!selectedRowKeys.value.length) {
    message.warning('请选择要删除的标签')
    return
  }

  try {
    loading.value = true
    await Promise.all(selectedRowKeys.value.map(id => deleteTag(id)))
    message.success('批量删除成功')
    selectedRowKeys.value = []
    fetchTags()
  } catch (error) {
    console.error('批量删除失败:', error)
    message.error('批量删除失败，请重试')
  } finally {
    loading.value = false
  }
}

// 组件挂载时获取标签列表
onMounted(() => {
  fetchTags()
})
</script>

<style scoped>
:deep(.table-row-actions) {
  flex-wrap: nowrap;
}
</style>
