<template>
  <div class="tag-detail-container">
    <!-- 标签信息头部 -->
    <div v-if="tag" class="tag-header">
      <div class="tag-info">
        <h1 class="tag-name">
          <tag-outlined />
          {{ tag.name }}
        </h1>
        <div class="tag-meta">
          <span class="tag-count">{{ tag.count ?? 0 }}篇文章</span>
          <span v-if="tag.description" class="tag-description">{{ tag.description }}</span>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <a-spin size="large" />
      <p>加载中...</p>
    </div>

    <!-- 标签下的文章列表 -->
    <div v-else-if="dynamics && dynamics.length > 0" class="dynamics-list">
      <a-row :gutter="[24, 24]">
        <a-col :xs="24" :md="12" :lg="8" v-for="dynamic in dynamics" :key="dynamic.id">
          <router-link :to="`/blog/dynamics/${dynamic.id}`" class="dynamic-card-link">
            <a-card hoverable class="dynamic-card">
              <!-- 文章图片 -->
              <img 
                v-if="dynamic.mediaUrls && dynamic.mediaUrls.length > 0" 
                :src="dynamic.mediaUrls[0]" 
                alt="文章图片"
                class="dynamic-image"
              />
              <div v-else class="dynamic-image dynamic-image-placeholder">
                <file-text-outlined />
              </div>
              
              <!-- 文章内容 -->
              <div class="dynamic-content">
                <h2 class="dynamic-title">{{ dynamic.title }}</h2>
                <div class="dynamic-excerpt">{{ getExcerpt(dynamic.content) }}</div>
                
                <!-- 文章元数据 -->
                <div class="dynamic-meta">
                  <span class="dynamic-date">{{ formatDate(dynamic.created_at) }}</span>
                  <span class="dynamic-views"><eye-outlined /> {{ dynamic.views || 0 }}</span>
                  <span class="dynamic-likes"><heart-outlined /> {{ dynamic.likes || 0 }}</span>
                </div>
                
                <!-- 标签 -->
                <div class="dynamic-tags">
                  <a-tag v-for="tag in dynamic.tags" :key="tag.id" color="blue">{{ tag.name }}</a-tag>
                </div>
              </div>
            </a-card>
          </router-link>
        </a-col>
      </a-row>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <a-pagination
          v-model:current="currentPage"
          :total="total"
          :pageSize="pageSize"
          @change="handlePageChange"
          showSizeChanger
          @showSizeChange="handleSizeChange"
          :pageSizeOptions="['6', '12', '24', '48']"
          :showTotal="total => `共 ${total} 篇文章`"
        />
      </div>
    </div>
    
    <!-- 无数据状态 -->
    <div v-else class="empty-container">
      <a-empty description="暂无文章" />
      <router-link to="/blog">
        <a-button type="primary">返回首页</a-button>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { getTagDynamics } from '@/api/blog'
import { TagOutlined, EyeOutlined, HeartOutlined, FileTextOutlined } from '@ant-design/icons-vue'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

// 状态变量
const loading = ref(true)
const tag = ref(null)
const dynamics = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(12)

// 获取标签详情和文章列表
const fetchTagDynamics = async () => {
  if (!route.params.id) {
    message.error('未找到标签ID')
    router.push('/blog')
    return
  }

  const tagId = route.params.id
  
  try {
    loading.value = true
    appStore.startLoading('加载标签内容...')
    
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value
    }
    
    const response = await getTagDynamics(tagId, params)
    console.log('标签详情响应:', response)
    
    if (response && response.code === 200 && response.data) {
      // 设置标签信息
      tag.value = response.data.tag || null
      
      // 设置文章列表
      dynamics.value = response.data.dynamics || []
      
      // 设置总数
      total.value = response.data.total || 0
      
      // 设置页面标题
      if (tag.value) {
        document.title = `${tag.value.name} - 标签文章`
      }
    } else {
      message.error('获取标签详情失败')
      dynamics.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('获取标签详情失败:', error)
    message.error('获取标签详情失败，请刷新重试')
    dynamics.value = []
    total.value = 0
  } finally {
    loading.value = false
    appStore.endLoading()
  }
}

// 监听路由参数变化
watch(() => route.params.id, (newId, oldId) => {
  if (newId && newId !== oldId) {
    currentPage.value = 1 // 重置页码
    fetchTagDynamics()
  }
}, { immediate: true })

// 处理分页变化
const handlePageChange = (page) => {
  currentPage.value = page
  fetchTagDynamics()
  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 处理每页数量变化
const handleSizeChange = (current, size) => {
  pageSize.value = size
  currentPage.value = 1
  fetchTagDynamics()
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 获取内容摘要
const getExcerpt = (content, maxLength = 100) => {
  if (!content) return ''
  
  // 移除HTML标签
  const plainText = content.replace(/<[^>]+>/g, '')
  
  // 截取指定长度
  return plainText.length > maxLength
    ? plainText.substring(0, maxLength) + '...'
    : plainText
}

// 组件挂载时加载数据
onMounted(() => {
  fetchTagDynamics()
})
</script>

<style scoped>
.tag-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.tag-header {
  margin-bottom: 30px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.tag-name {
  font-size: 28px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #1890ff;
}

.tag-meta {
  display: flex;
  align-items: center;
  gap: 20px;
  color: #666;
}

.tag-count {
  background: #e6f7ff;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 14px;
  color: #1890ff;
}

.tag-description {
  font-size: 16px;
  color: #666;
  line-height: 1.5;
}

.loading-container, .empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: 50px 0;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.loading-container p {
  margin-top: 20px;
  color: #666;
}

.empty-container {
  gap: 20px;
}

.dynamics-list {
  margin-top: 20px;
}

.dynamic-card {
  height: 100%;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.dynamic-card-link {
  text-decoration: none;
  color: inherit;
  display: block;
  height: 100%;
}

.dynamic-image {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 4px 4px 0 0;
  background-color: #f5f5f5;
}

.dynamic-image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  color: #d9d9d9;
}

.dynamic-content {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.dynamic-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #262626;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

.dynamic-excerpt {
  color: #666;
  margin-bottom: 15px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  font-size: 14px;
  line-height: 1.5;
}

.dynamic-meta {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 10px;
  color: #8c8c8c;
  font-size: 13px;
}

.dynamic-date,
.dynamic-views,
.dynamic-likes {
  display: flex;
  align-items: center;
  gap: 5px;
}

.dynamic-tags {
  margin-top: auto;
}

.pagination-container {
  margin-top: 40px;
  text-align: center;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .tag-header {
    padding: 15px;
  }
  
  .tag-name {
    font-size: 22px;
  }
  
  .tag-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .dynamic-image {
    height: 150px;
  }
}
</style>
