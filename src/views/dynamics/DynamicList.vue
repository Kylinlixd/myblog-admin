<template>
  <div class="dynamic-list">
    <div class="page-header">
      <h2>动态列表</h2>
      <el-button type="primary" @click="navigateToCreate">
        <el-icon><Plus /></el-icon>新建动态
      </el-button>
    </div>
    
    <el-card class="list-card">
      <el-table 
        v-loading="loading" 
        :data="dynamicList" 
        border 
        style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="标题" min-width="200" />
        <el-table-column label="封面图" width="120">
          <template #default="scope">
            <el-image 
              v-if="scope.row.coverImage" 
              :src="scope.row.coverImage" 
              style="width: 80px; height: 45px" 
              fit="cover" />
            <span v-else>无封面</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column prop="updatedAt" label="更新时间" width="180" />
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button size="small" @click="viewDetail(scope.row)">查看</el-button>
            <el-button size="small" type="primary" @click="editDynamic(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteDynamic(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { getDynamicList, deleteDynamic as deleteAdminDynamic } from '@/api/dynamic'

const router = useRouter()
const loading = ref(false)
const dynamicList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 获取动态列表
const fetchDynamics = async () => {
  loading.value = true
  console.log('准备获取动态列表...')
  try {
    console.log('调用getDynamicList API，参数:', {
      page: currentPage.value,
      pageSize: pageSize.value
    })
    const res = await getDynamicList({
      page: currentPage.value,
      pageSize: pageSize.value
    })
    console.log('动态列表API响应:', res)
    dynamicList.value = res.data.items || []
    total.value = res.data.total || 0
  } catch (error) {
    console.error('获取动态列表失败:', error)
    ElMessage.error('获取动态列表失败')
  } finally {
    loading.value = false
  }
}

// 跳转到创建动态页面
const navigateToCreate = () => {
  router.push('/dashboard/dynamics/create')
}

// 查看动态详情
const viewDetail = (row) => {
  // 这里可以打开一个对话框显示详情，或者跳转到详情页
  window.open(`/blog/blogdynamic?id=${row.id}`, '_blank')
}

// 编辑动态
const editDynamic = (row) => {
  router.push(`/dashboard/dynamics/edit/${row.id}`)
}

// 删除动态
const deleteDynamic = async (row) => {
  try {
    await ElMessageBox.confirm('确认删除该动态吗？此操作不可恢复', '警告', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    loading.value = true
    await deleteAdminDynamic(row.id)
    ElMessage.success('删除成功')
    fetchDynamics() // 重新加载列表
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除动态失败:', error)
      ElMessage.error('删除动态失败')
    }
  } finally {
    loading.value = false
  }
}

// 处理分页
const handleSizeChange = (val) => {
  pageSize.value = val
  fetchDynamics()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchDynamics()
}

onMounted(() => {
  fetchDynamics()
})
</script>

<style scoped>
.dynamic-list {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.list-card {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>