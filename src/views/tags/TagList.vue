<template>
  <div class="tag-list">
    <PageHeader title="标签管理" icon="Collection">
      <template #actions>
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>新建标签
        </el-button>
      </template>
    </PageHeader>
    
    <!-- 标签列表 -->
    <DataTable
      :data="tags"
      :columns="columns"
      :loading="loading"
      row-key="id"
    >
      <template #name="{ row }">
        <span class="tag-name">{{ row.name }}</span>
      </template>
      
      <template #actions="{ row }">
        <el-button-group>
          <el-button type="primary" link @click="handleEdit(row)">
            <el-icon><Edit /></el-icon>编辑
          </el-button>
          <el-button type="danger" link @click="handleDelete(row)">
            <el-icon><Delete /></el-icon>删除
          </el-button>
        </el-button-group>
      </template>
    </DataTable>
    
    <!-- 分页 -->
    <Pagination
      :total="total"
      :current-page="currentPage"
      :page-size="pageSize"
      @current-change="handleCurrentChange"
      @size-change="handleSizeChange"
    />
    
    <!-- 标签编辑对话框 -->
    <DataFormDialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新建标签' : '编辑标签'"
      :model="tagForm"
      :rules="rules"
      :loading="formLoading"
      @submit="handleSubmit"
    >
      <el-form-item label="标签名称" prop="name">
        <el-input v-model="tagForm.name" placeholder="请输入标签名称" />
      </el-form-item>
      
      <el-form-item label="描述" prop="description">
        <el-input
          v-model="tagForm.description"
          type="textarea"
          :rows="3"
          placeholder="请输入标签描述"
        />
      </el-form-item>
      
      <el-form-item label="排序" prop="sort">
        <el-input-number v-model="tagForm.sort" :min="0" :max="999" />
      </el-form-item>
    </DataFormDialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTagList, createTag, updateTag, deleteTag } from '../../api/tag'
import { Plus, Edit, Delete, Collection } from '@element-plus/icons-vue'

// 导入通用组件
import DataTable from '../../components/common/DataTable.vue'
import Pagination from '../../components/common/Pagination.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import DataFormDialog from '../../components/common/DataFormDialog.vue'

// 表格列配置
const columns = [
  { label: '标签名称', prop: 'name', slot: 'name', width: '200px' },
  { label: '描述', prop: 'description', width: '300px' },
  { label: '文章数量', prop: 'postCount', width: '100px' },
  { label: '创建时间', prop: 'createTime', width: '180px' },
  { label: '操作', slot: 'actions', width: '200px' }
]

// 数据列表
const tags = ref([])
const loading = ref(false)
const formLoading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

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
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 200, message: '长度不能超过 200 个字符', trigger: 'blur' }
  ]
}

// 获取标签列表
const getTags = async () => {
  loading.value = true
  try {
    const response = await getTagList({
      page: currentPage.value,
      pageSize: pageSize.value
    })
    if (response.code === 200) {
      tags.value = response.data.list || []
      total.value = response.data.total || 0
    } else {
      ElMessage.error(response.message || '获取标签列表失败')
    }
  } catch (error) {
    console.error('获取标签列表失败:', error)
    ElMessage.error('获取标签列表失败')
  } finally {
    loading.value = false
  }
}

// 页码改变
const handleCurrentChange = (page) => {
  currentPage.value = page
  getTags()
}

// 每页条数改变
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  getTags()
}

// 打开新建标签对话框
const handleCreate = () => {
  dialogType.value = 'create'
  Object.keys(tagForm).forEach(key => {
    tagForm[key] = key === 'sort' ? 0 : ''
  })
  dialogVisible.value = true
}

// 打开编辑标签对话框
const handleEdit = (row) => {
  dialogType.value = 'edit'
  Object.keys(tagForm).forEach(key => {
    tagForm[key] = row[key]
  })
  dialogVisible.value = true
}

// 删除标签
const handleDelete = (row) => {
  ElMessageBox.confirm(
    '确定要删除该标签吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const response = await deleteTag(row.id)
      if (response.code === 200) {
        ElMessage.success('删除成功')
        getTags()
      } else {
        ElMessage.error(response.message || '删除失败')
      }
    } catch (error) {
      console.error('删除标签失败:', error)
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

// 提交表单
const handleSubmit = async () => {
  formLoading.value = true
  try {
    if (dialogType.value === 'create') {
      const response = await createTag(tagForm)
      if (response.code === 200) {
        ElMessage.success('创建成功')
        dialogVisible.value = false
        getTags()
      } else {
        ElMessage.error(response.message || '创建失败')
      }
    } else {
      const response = await updateTag(tagForm.id, tagForm)
      if (response.code === 200) {
        ElMessage.success('更新成功')
        dialogVisible.value = false
        getTags()
      } else {
        ElMessage.error(response.message || '更新失败')
      }
    }
  } catch (error) {
    console.error('提交标签失败:', error)
    ElMessage.error('操作失败，请稍后重试')
  } finally {
    formLoading.value = false
  }
}

onMounted(() => {
  getTags()
})
</script>

<style lang="scss" scoped>
.tag-list {
  padding: 20px;
}

.tag-name {
  display: inline-block;
  padding: 4px 10px;
  background-color: rgba(64, 158, 255, 0.1);
  color: #409eff;
  border-radius: 16px;
  font-size: 14px;
}

:global([data-theme='dark']) {
  .tag-name {
    background-color: rgba(64, 158, 255, 0.2);
  }
}
</style> 