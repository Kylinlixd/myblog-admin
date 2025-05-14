<template>
  <div class="dynamic-detail-container">
    <div v-if="loading" class="loading-state">
      <a-spin />
      <p>加载中...</p>
    </div>
    
    <div v-else-if="!dynamic" class="error-state">
      <p>文章不存在或已被删除</p>
    </div>
    
    <div v-else class="dynamic-content">
      <div class="dynamic-header">
        <h1 class="dynamic-title">{{ dynamic.title }}</h1>
        <div class="dynamic-meta">
          <span class="dynamic-date">{{ formatDate(dynamic.createdAt) }}</span>
          <span class="dynamic-views">{{ dynamic.views }} 阅读</span>
        </div>
      </div>
      
      <div class="dynamic-body markdown-body" v-html="dynamic.content"></div>
      
      <div class="dynamic-footer">
        <div class="dynamic-tags" v-if="dynamic.tags && dynamic.tags.length">
          <span class="tag-label">标签：</span>
          <router-link 
            v-for="tag in dynamic.tags" 
            :key="tag.id"
            :to="`/blog/tags/${tag.id}`"
            class="tag-item"
          >
            {{ tag.name }}
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getBlogDynamicDetail, increaseDynamicView } from '@/api/blog'
import { useAppStore } from '@/stores/app'
import dayjs from 'dayjs'

const route = useRoute()
const appStore = useAppStore()
const dynamic = ref(null)
const loading = ref(true)

const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

const fetchDynamicDetail = async () => {
  try {
    loading.value = true
    appStore.startLoading('加载文章内容...')
    
    const dynamicId = route.params.id
    const response = await getBlogDynamicDetail(dynamicId)
    
    if (response.code === 200) {
      dynamic.value = response.data
      // 增加阅读量
      await increaseDynamicView(dynamicId)
    } else {
      console.error('获取文章详情失败:', response.message)
      appStore.setLoadingError('获取文章详情失败，请刷新重试')
    }
  } catch (error) {
    console.error('获取文章详情失败:', error)
    appStore.setLoadingError('获取文章详情失败，请刷新重试')
  } finally {
    loading.value = false
    appStore.endLoading()
  }
}

onMounted(() => {
  fetchDynamicDetail()
})
</script>

<style scoped>
.dynamic-detail-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.dynamic-header {
  margin-bottom: 2rem;
}

.dynamic-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  line-height: 1.3;
  color: #333;
}

.dynamic-meta {
  display: flex;
  gap: 1rem;
  color: #666;
  font-size: 0.9rem;
}

.dynamic-body {
  margin-bottom: 3rem;
  line-height: 1.8;
  color: #333;
}

.dynamic-footer {
  border-top: 1px solid #eee;
  padding-top: 1.5rem;
}

.dynamic-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.tag-label {
  color: #666;
}

.tag-item {
  display: inline-block;
  padding: 0.2rem 0.8rem;
  background-color: #f3f4f6;
  color: #4b5563;
  border-radius: 9999px;
  font-size: 0.9rem;
  text-decoration: none;
  transition: all 0.2s;
}

.tag-item:hover {
  background-color: #e5e7eb;
  color: #1f2937;
}

@media (max-width: 768px) {
  .dynamic-title {
    font-size: 2rem;
  }
  
  .dynamic-detail-container {
    padding: 1.5rem 1rem;
  }
}
</style> 