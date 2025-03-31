<template>
  <div class="tag-list">
    <div class="page-header">
      <h2>标签管理</h2>
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>新建标签
      </el-button>
    </div>
    
    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="tags"
        border
        style="width: 100%"
      >
        <el-table-column prop="name" label="标签名称" min-width="200" />
        <el-table-column prop="description" label="描述" min-width="300" show-overflow-tooltip />
        <el-table-column prop="postCount" label="文章数量" width="100" align="center" />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button-group>
              <el-button type="primary" link @click="handleEdit(row)">
                <el-icon><Edit /></el-icon>编辑
              </el-button>
              <el-button type="danger" link @click="handleDelete(row)">
                <el-icon><Delete /></el-icon>删除
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 标签编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新建标签' : '编辑标签'"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="tagForm"
        :model="tagForm"
        :rules="rules"
        label-width="100px"
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
const tags = ref([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 编辑表单
const dialogVisible = ref(false)
const dialogType = ref('create')
const tagForm = reactive({
  id: '',
  name: '',
  description: '',
  sort: 0
})

// 表单验证规则
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
    const { list, total: totalCount } = await request.get('/tags', {
      params: {
        page: currentPage.value,
        pageSize: pageSize.value
      }
    })
    tags.value = list
    total.value = totalCount
  } catch (error) {
    console.error('获取标签列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 新建标签
const handleCreate = () => {
  dialogType.value = 'create'
  Object.keys(tagForm).forEach(key => {
    tagForm[key] = key === 'sort' ? 0 : ''
  })
  dialogVisible.value = true
}

// 编辑标签
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
    '确定要删除这个标签吗？删除后无法恢复，且该标签下的文章将失去此标签。',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await request.delete(`/tags/${row.id}`)
      ElMessage.success('删除成功')
      getTags()
    } catch (error) {
      console.error('删除标签失败:', error)
    }
  })
}

// 提交表单
const handleSubmit = async () => {
  try {
    if (dialogType.value === 'create') {
      await request.post('/tags', tagForm)
      ElMessage.success('创建成功')
    } else {
      await request.put(`/tags/${tagForm.id}`, tagForm)
      ElMessage.success('更新成功')
    }
    dialogVisible.value = false
    getTags()
  } catch (error) {
    console.error('保存标签失败:', error)
  }
}

// 分页
const handleSizeChange = (val) => {
  pageSize.value = val
  getTags()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  getTags()
}

onMounted(() => {
  getTags()
})
</script>

<style scoped lang="scss">
.tag-list {
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
  
  .table-card {
    .pagination {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }
}
</style> 