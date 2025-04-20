<template>
  <div class="tag-list-page">
    <div class="header-actions">
      <a-button type="primary" @click="handleCreate">
        <template #icon><plus-outlined /></template>新建标签
      </a-button>
    </div>
    
    <div class="tags-container">
      <a-table
        :columns="columns"
        :data-source="tagList"
        :pagination="false"
        :loading="loading"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="primary" @click="handleEdit(record)">
                <template #icon><edit-outlined /></template>编辑
              </a-button>
              <a-button type="primary" danger @click="handleDelete(record)">
                <template #icon><delete-outlined /></template>删除
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
      
      <div class="pagination-container">
        <a-pagination
          v-model:current="currentPage"
          :total="total"
          :page-size="pageSize"
          show-size-changer
          @change="handlePageChange"
          @showSizeChange="handleSizeChange"
        />
      </div>
    </div>
    
    <a-modal
      v-model:visible="dialogVisible"
      :title="dialogTitle"
      @cancel="handleCancel"
      @ok="submitForm"
      :confirm-loading="formLoading"
    >
      <a-form
        ref="tagFormRef"
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
            placeholder="请输入标签描述"
            :rows="4"
          />
        </a-form-item>
        
        <a-form-item label="排序" name="sort">
          <a-input-number v-model:value="tagForm.sort" :min="0" :max="999" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import request from '@/utils/request'

const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id'
  },
  {
    title: '标签名称',
    dataIndex: 'name',
    key: 'name'
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description'
  },
  {
    title: '操作',
    key: 'action'
  }
]

const loading = ref(false)
const tagList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const dialogVisible = ref(false)
const dialogTitle = ref('新建标签')
const formLoading = ref(false)
const isEdit = ref(false)
const tagFormRef = ref(null)

const tagForm = reactive({
  id: null,
  name: '',
  description: '',
  sort: 0
})

const rules = {
  name: [
    { required: true, message: '请输入标签名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  sort: [
    { required: true, message: '请输入排序值', trigger: 'change' }
  ]
}

// 获取标签列表
const getTagList = async () => {
  loading.value = true
  try {
    const res = await request.get('/api/tags', {
      params: {
        page: currentPage.value,
        limit: pageSize.value
      }
    })
    tagList.value = res.data.items
    total.value = res.data.total
  } catch (error) {
    console.error('获取标签列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 处理页码变化
const handlePageChange = (page, pageSize) => {
  currentPage.value = page
  getTagList()
}

// 处理每页数量变化
const handleSizeChange = (current, size) => {
  pageSize.value = size
  getTagList()
}

// 处理创建标签
const handleCreate = () => {
  isEdit.value = false
  dialogTitle.value = '新建标签'
  tagForm.id = null
  tagForm.name = ''
  tagForm.description = ''
  tagForm.sort = 0
  dialogVisible.value = true
}

// 处理编辑标签
const handleEdit = (row) => {
  isEdit.value = true
  dialogTitle.value = '编辑标签'
  tagForm.id = row.id
  tagForm.name = row.name
  tagForm.description = row.description
  tagForm.sort = row.sort || 0
  dialogVisible.value = true
}

// 处理删除标签
const handleDelete = (row) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除标签"${row.name}"吗？`,
    okText: '确定',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      try {
        await request.delete(`/api/tags/${row.id}`)
        message.success('删除成功')
        getTagList()
      } catch (error) {
        console.error('删除失败:', error)
      }
    }
  })
}

// 提交表单
const submitForm = async () => {
  formLoading.value = true
  try {
    const validateResult = await tagFormRef.value.validate()
    
    if (isEdit.value) {
      await request.put(`/api/tags/${tagForm.id}`, tagForm)
      message.success('更新成功')
    } else {
      await request.post('/api/tags', tagForm)
      message.success('创建成功')
    }
    
    dialogVisible.value = false
    getTagList()
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    formLoading.value = false
  }
}

// 取消
const handleCancel = () => {
  dialogVisible.value = false
}

onMounted(() => {
  getTagList()
})
</script>

<style scoped>
.tag-list-page {
  padding: 20px;
}

.header-actions {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}
</style> 