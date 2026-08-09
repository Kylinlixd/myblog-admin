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
          <a-button
            danger
            :loading="batchDeleting"
            :disabled="!selectedRowKeys.length || batchDeleting"
          >
            <template #icon><DeleteOutlined /></template>
            批量删除
          </a-button>
        </a-popconfirm>
      </a-space>
    </div>

    <!-- 数据表格 -->
    <AsyncState
      v-if="loading || errorMessage || !tagList.length"
      data-testid="tag-async-state"
      :loading="loading"
      :error="errorMessage"
      :empty="!loading && !errorMessage"
      empty-title="暂无标签"
      empty-description="创建一个标签来连接相关内容。"
      @retry="fetchTags"
    />

    <a-card v-else class="admin-table-card">
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
      :scroll="{ x: 1160 }"
      class="responsive-table tag-table"
    >
      <template #bodyCell="{ column, record }">
        <!-- 描述列 -->
        <template v-if="column.dataIndex === 'description'">
          <span class="tag-description" :title="record.description || '暂无描述'">
            {{ record.description || '暂无描述' }}
          </span>
        </template>

        <!-- 状态列 -->
        <template v-else-if="column.dataIndex === 'status'">
          <a-tag :color="record.status === 'active' ? 'success' : 'default'">
            {{ record.status === 'active' ? '启用' : '禁用' }}
          </a-tag>
        </template>

        <!-- 创建时间列 -->
        <template v-else-if="column.dataIndex === 'createdAt'">
          <span class="tag-date">{{ formatDate(record.createdAt) }}</span>
        </template>

        <!-- 更新时间列 -->
        <template v-else-if="column.dataIndex === 'updatedAt'">
          <span class="tag-date">{{ formatDate(record.updatedAt) }}</span>
        </template>

        <!-- 操作列 -->
        <template v-else-if="column.dataIndex === 'action'">
          <a-space class="table-row-actions">
            <a-button type="text" size="small" class="row-action row-action--primary" @click="handleEdit(record)">
              <template #icon><EditOutlined /></template>
              编辑
            </a-button>
            <a-popconfirm
              title="确定要删除该标签吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="handleDelete(record)"
            >
              <a-button
                type="text"
                danger
                size="small"
                class="row-action row-action--danger"
                :loading="isDeleting(record.id)"
                :disabled="isDeleting(record.id)"
              >
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
import AsyncState from '@/components/common/AsyncState.vue'

// 表格列配置
const columns = [
  {
    title: '标签名称',
    dataIndex: 'name',
    key: 'name',
    width: 180,
    ellipsis: true,
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
    width: 280,
    ellipsis: true,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 90,
    align: 'center',
  },
  {
    title: '使用次数',
    dataIndex: 'useCount',
    key: 'useCount',
    width: 100,
    align: 'center',
    sorter: (a, b) => Number(a.useCount || 0) - Number(b.useCount || 0),
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 160,
    sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  },
  {
    title: '更新时间',
    dataIndex: 'updatedAt',
    key: 'updatedAt',
    width: 160,
    sorter: (a, b) => new Date(a.updatedAt) - new Date(b.updatedAt),
  },
  {
    title: '操作',
    dataIndex: 'action',
    key: 'action',
    width: 190,
    fixed: 'right',
  }
]

// 数据列表
const tagList = ref([])
const loading = ref(false)
const errorMessage = ref('')
const formLoading = ref(false)
const formRef = ref(null)
const deletingIds = reactive(new Set())
const batchDeleting = ref(false)
let requestGeneration = 0

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total) => `共 ${total} 条`,
  onChange: (page, nextPageSize) => {
    const sizeChanged = nextPageSize !== pagination.pageSize
    pagination.pageSize = nextPageSize
    pagination.current = sizeChanged ? 1 : page
    fetchTags()
  }
})

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
  pagination.current = 1
  fetchTags()
}

// 重置搜索
const resetSearch = () => {
  searchForm.name = ''
  searchForm.status = undefined
  pagination.current = 1
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
  if (Number.isNaN(date.getTime())) return ''
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const normalizeTag = (item) => ({
  ...item,
  status: item.status || 'inactive',
  useCount: Number(item.useCount ?? item.dynamicCount ?? 0) || 0
})

// 获取标签列表
const fetchTags = async (allowPageReset = true) => {
  const generation = ++requestGeneration
  loading.value = true
  errorMessage.value = ''
  try {
    const { count, results } = await getTagList({
      page: pagination.current,
      pageSize: pagination.pageSize,
      name: searchForm.name || undefined,
      status: searchForm.status
    })
    if (generation !== requestGeneration) return
    if (allowPageReset && pagination.current > 1 && results.length === 0) {
      pagination.current = 1
      return fetchTags(false)
    }
    tagList.value = results.map(normalizeTag)
    pagination.total = count
  } catch (error) {
    if (generation !== requestGeneration) return
    console.error('获取标签列表失败:', error)
    errorMessage.value = error.message || '获取标签列表失败'
    tagList.value = []
    pagination.total = 0
  } finally {
    if (generation === requestGeneration) loading.value = false
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
    if (formRef.value?.validate) {
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
    await fetchTags()
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
  if (deletingIds.has(record.id)) return
  deletingIds.add(record.id)
  try {
    await deleteTag(record.id)
    message.success('标签删除成功')
    await fetchTags()
  } catch (error) {
    console.error('删除标签失败:', error)
    message.error('删除失败，请重试')
  } finally {
    deletingIds.delete(record.id)
  }
}

const isDeleting = (id) => deletingIds.has(id)

// 批量删除
const handleBatchDelete = async () => {
  if (batchDeleting.value || !selectedRowKeys.value.length) {
    if (batchDeleting.value) return
    message.warning('请选择要删除的标签')
    return
  }

  batchDeleting.value = true
  const selectedIds = [...selectedRowKeys.value]
  const ids = selectedIds.filter((id) => !deletingIds.has(id))
  if (!ids.length) {
    batchDeleting.value = false
    return
  }
  ids.forEach((id) => deletingIds.add(id))
  try {
    const results = await Promise.allSettled(ids.map((id) => deleteTag(id)))
    const failedIds = results.reduce((failed, result, index) => {
      if (result.status === 'rejected') failed.push(ids[index])
      return failed
    }, [])
    const skippedIds = selectedIds.filter((id) => !ids.includes(id))
    selectedRowKeys.value = [...skippedIds, ...failedIds]
    if (failedIds.length) message.warning(`${failedIds.length} 个标签删除失败并保持选中`)
    else message.success('批量删除成功')
    await fetchTags()
  } catch (error) {
    console.error('批量删除失败:', error)
    message.error('批量删除失败，请重试')
  } finally {
    ids.forEach((id) => deletingIds.delete(id))
    batchDeleting.value = false
  }
}

// 组件挂载时获取标签列表
onMounted(() => {
  fetchTags()
})
</script>

<style scoped lang="scss">
.tag-list :deep(.tag-description) {
  display: block;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-list :deep(.tag-date) {
  white-space: nowrap;
}

.tag-list :deep(.tag-table .ant-table-tbody > tr > td) {
  vertical-align: middle;
}
</style>
