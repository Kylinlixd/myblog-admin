<template>
  <div class="dynamic-list">
    <div class="page-header">
      <h2>动态列表</h2>
      <a-button type="primary" @click="navigateToCreate">
        <template #icon><plus-outlined /></template>
        新建动态
      </a-button>
    </div>
    
    <a-card class="list-card">
      <a-table
        :loading="loading"
        :dataSource="dynamicList"
        :columns="responsive ? columnsForMobile : columns"
        :pagination="false"
        :scroll="responsive ? { x: 600 } : {}"
        bordered
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'coverImage'">
            <a-image
              v-if="record.coverImage"
              :src="record.coverImage"
              :width="80"
              :height="45"
              :preview="false"
            />
            <span v-else>无封面</span>
          </template>

          <template v-if="column.key === 'action'">
            <a-space>
              <a-button size="small" @click="viewDetail(record)">查看</a-button>
              <a-button size="small" type="primary" @click="editDynamic(record)">编辑</a-button>
              <a-button size="small" danger @click="deleteDynamic(record)">删除</a-button>
            </a-space>
          </template>
        </template>

        <template #emptyText>
          <div class="empty-state">
            <a-empty description="暂无动态数据">
              <a-button type="primary" @click="navigateToCreate">创建新动态</a-button>
            </a-empty>
          </div>
        </template>
      </a-table>
      
      <div class="pagination-container">
        <a-pagination
          v-model:current="currentPage"
          v-model:pageSize="pageSize"
          :total="total"
          :pageSizeOptions="['10', '20', '50', '100']"
          :showSizeChanger="true"
          :showTotal="total => `共 ${total} 条`"
          @change="handlePageChange"
        />
      </div>
    </a-card>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, onUnmounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { useRouter } from 'vue-router'
import { getDynamicList, deleteDynamic as deleteAdminDynamic } from '@/api/dynamic'

const router = useRouter()
const loading = ref(false)
const dynamicList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const responsive = ref(false)

// 表格列定义
const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 80
  },
  {
    title: '标题',
    dataIndex: 'title',
    key: 'title'
  },
  {
    title: '封面图',
    dataIndex: 'coverImage',
    key: 'coverImage',
    width: 120
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 180
  },
  {
    title: '更新时间',
    dataIndex: 'updatedAt',
    key: 'updatedAt',
    width: 180
  },
  {
    title: '操作',
    key: 'action',
    width: 200
  }
]

// 移动端优化的列定义
const columnsForMobile = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 60
  },
  {
    title: '标题',
    dataIndex: 'title',
    key: 'title'
  },
  {
    title: '操作',
    key: 'action',
    fixed: 'right',
    width: 100
  }
]

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
    
    // 增加更详细的响应检查和日志
    if (res && res.code === 200) {
      console.log('处理响应数据:', res.data)
      
      // 检查响应数据的结构
      if (res.data && typeof res.data === 'object') {
        if (Array.isArray(res.data)) {
          // 如果直接返回数组
          dynamicList.value = res.data || []
          total.value = res.data.length || 0
          console.log('响应是数组类型，长度:', dynamicList.value.length)
        } else if (res.data.items) {
          // 如果返回带分页的对象结构
          dynamicList.value = res.data.items || []
          total.value = res.data.total || 0
          console.log('响应是带分页结构，条目数:', dynamicList.value.length, '总数:', total.value)
        } else {
          // 尝试其他可能的结构
          const possibleItems = res.data.list || res.data.data || res.data.records || []
          dynamicList.value = possibleItems
          total.value = res.data.total || res.data.totalCount || res.data.count || possibleItems.length || 0
          console.log('响应是其他结构，提取数据后条目数:', dynamicList.value.length)
        }
      } else {
        console.warn('响应数据异常:', res.data)
        dynamicList.value = []
        total.value = 0
      }
    } else {
      console.warn('API响应状态码非200或响应为空')
      dynamicList.value = []
      total.value = 0
    }
    
    // 即使没有数据也显示空表格
    if (dynamicList.value.length === 0) {
      console.log('没有找到动态数据，显示空表格')
    }
  } catch (error) {
    console.error('获取动态列表失败:', error)
    message.error('获取动态列表失败')
    dynamicList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 跳转到创建动态页面
const navigateToCreate = () => {
  router.push('/dashboard/dynamics/create')
}

// 查看动态详情
const viewDetail = (record) => {
  // 这里可以打开一个对话框显示详情，或者跳转到详情页
  window.open(`/blog/blogdynamic?id=${record.id}`, '_blank')
}

// 编辑动态
const editDynamic = (record) => {
  router.push(`/dashboard/dynamics/edit/${record.id}`)
}

// 删除动态
const deleteDynamic = (record) => {
  Modal.confirm({
    title: '警告',
    content: '确认删除该动态吗？此操作不可恢复',
    okText: '确认',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        loading.value = true
        await deleteAdminDynamic(record.id)
        message.success('删除成功')
        fetchDynamics() // 重新加载列表
      } catch (error) {
        console.error('删除动态失败:', error)
        message.error('删除动态失败')
      } finally {
        loading.value = false
      }
    }
  })
}

// 处理分页变化
const handlePageChange = (page, pageSize) => {
  currentPage.value = page
  pageSize.value = pageSize
  fetchDynamics()
}

// 检测设备尺寸
const checkResponsive = () => {
  responsive.value = window.innerWidth < 768
}

onMounted(() => {
  fetchDynamics()
  
  // 检测响应式
  checkResponsive()
  window.addEventListener('resize', checkResponsive)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkResponsive)
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

.page-header h2 {
  margin-bottom: 0;
  font-weight: 600;
  font-size: 18px;
  color: rgba(0, 0, 0, 0.85);
}

.list-card {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 移动端样式 */
@media screen and (max-width: 768px) {
  .dynamic-list {
    padding: 12px;
  }
  
  .page-header {
    margin-bottom: 12px;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .page-header h2 {
    font-size: 16px;
  }
  
  .list-card {
    margin-bottom: 12px;
  }
  
  .pagination-container {
    margin-top: 12px;
    justify-content: center;
  }
}
</style>