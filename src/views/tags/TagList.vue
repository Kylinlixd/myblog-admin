<template>
  <div class="tag-list">
    <a-page-header
      title="标签管理"
      subtitle="管理博客标签"
    >
      <template #extra>
        <a-button type="primary" @click="handleCreate">
          <plus-outlined /> 新建标签
        </a-button>
      </template>
    </a-page-header>
    
    <a-card class="data-card">
      <a-table
        :loading="loading"
        :columns="columns"
        :data-source="tagList"
        :pagination="paginationConfig"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <!-- 标签名称列 -->
          <template v-if="column.dataIndex === 'name'">
            <a-tag color="blue">{{ record.name }}</a-tag>
          </template>         
          <!-- 操作列 -->
          <template v-if="column.dataIndex === 'action'">
            <a-space>
              <a-button type="primary" size="small" @click="handleEdit(record)">
                <template #icon><edit-outlined /></template>编辑
              </a-button>
              <a-popconfirm
                title="确定要删除该标签吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleDelete(record)"
              >
                <a-button type="primary" danger size="small">
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
    
    <!-- 标签编辑对话框 -->
    <a-modal
      v-model:visible="dialogVisible"
      :title="dialogType === 'create' ? '新建标签' : '编辑标签'"
      @ok="handleSubmit"
      :confirm-loading="formLoading"
      @cancel="dialogVisible = false"
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
        
        <a-form-item label="排序" name="sort">
          <a-input-number v-model:value="tagForm.sort" :min="0" :max="999" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { getTagList, createTag, updateTag, deleteTag } from '@/api/tag'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons-vue'

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
    width: '15%',
  }
]

// 数据列表
const tagList = ref([])
const loading = ref(false)
const formLoading = ref(false)
const formRef = ref(null)

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 计算分页配置
const paginationConfig = computed(() => ({
  current: currentPage.value,
  pageSize: pageSize.value,
  total: total.value,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total) => `共 ${total} 条`,
  onChange: (page, pageSize) => {
    currentPage.value = page
    fetchTags()
  },
  onShowSizeChange: (current, size) => {
    pageSize.value = size
    currentPage.value = 1
    fetchTags()
  }
}))

// 编辑对话框
const dialogVisible = ref(false)
const dialogType = ref('create')
const tagForm = reactive({
  id: '',
  name: '',
  description: '',
  sort: 0
})

// 表单规则
const rules = {
  name: [
    { required: true, message: '请输入标签名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
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
  loading.value = true;
  try {
    const result = await getTagList({
      page: currentPage.value,
      pageSize: pageSize.value
    });
    
    if (result && result.results) {
      tagList.value = result.results;
      total.value = result.count;
    } else if (Array.isArray(result)) {
      // 如果返回的是数组，直接使用
      tagList.value = result;
      total.value = result.length;
    } else if (result && result.items) {
      // 如果返回的是分页对象
      tagList.value = result.items;
      total.value = result.total;
    } else {
      tagList.value = [];
      total.value = 0;
    }
  } catch (error) {
    console.error('获取标签列表失败:', error);
    message.error('获取标签列表失败');
    tagList.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

// 打开新建标签对话框
const handleCreate = () => {
  dialogType.value = 'create'
  tagForm.id = ''
  tagForm.name = ''
  tagForm.description = ''
  tagForm.sort = 0
  dialogVisible.value = true
}

// 打开编辑标签对话框
const handleEdit = (record) => {
  dialogType.value = 'edit'
  tagForm.id = record.id
  tagForm.name = record.name
  tagForm.description = record.description
  tagForm.sort = record.sort || 0
  dialogVisible.value = true
}

// 处理表单提交
const handleSubmit = async () => {
  try {
    if (formRef.value) {
      await formRef.value.validate()
    }
    
    formLoading.value = true
    
    if (dialogType.value === 'create') {
      await createTag(tagForm)
      message.success('标签创建成功')
    } else {
      await updateTag(tagForm.id, tagForm)
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

// 组件挂载时获取标签列表
onMounted(() => {
  fetchTags()
})
</script>

<style scoped>
.tag-list {
  padding: 20px;
}

.data-card {
  margin-top: 16px;
}
</style>