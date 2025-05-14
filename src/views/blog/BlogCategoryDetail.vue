<template>
  <div class="category-detail-container">
    <div class="page-header">
      <h1 class="page-title">{{ category?.name || '加载中...' }}</h1>
      <p class="page-desc">{{ category?.description || '' }}</p>
    </div>
    
    <div class="dynamics-list">
      <div v-if="loading" class="loading-state">
        <a-spin />
        <p>加载中...</p>
      </div>
      
      <div v-else-if="dynamics.length === 0" class="empty-state">
        <p>该分类下暂无文章</p>
      </div>
      
      <div v-else class="dynamics-grid">
        <div v-for="dynamic in dynamics" :key="dynamic.id" class="dynamic-card">
          <router-link :to="`/blog/dynamics/${dynamic.id}`" class="dynamic-link">
            <div class="dynamic-content">
              <h3 class="dynamic-title">{{ dynamic.title }}</h3>
              <p class="dynamic-summary">{{ dynamic.summary }}</p>
              <div class="dynamic-meta">
                <span class="dynamic-date">{{ formatDate(dynamic.createdAt) }}</span>
                <span class="dynamic-views">{{ dynamic.views }} 阅读</span>
              </div>
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getCategoryDynamics } from '@/api/blog'
import { useAppStore } from '@/stores/app'
import dayjs from 'dayjs'

const route = useRoute()
const appStore = useAppStore()
const category = ref(null)
const dynamics = ref([])
const loading = ref(true)

const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD')
}

const fetchCategoryDynamics = async () => {
  try {
    loading.value = true
    appStore.startLoading('加载分类文章...')
    
    const categoryId = route.params.id
    const response = await getCategoryDynamics(categoryId)
    
    if (response.code === 200) {
      category.value = response.data.category
      dynamics.value = response.data.dynamics
    } else {
      console.error('获取分类文章失败:', response.message)
      appStore.setLoadingError('获取分类文章失败，请刷新重试')
    }
  } catch (error) {
    console.error('获取分类文章失败:', error)
    appStore.setLoadingError('获取分类文章失败，请刷新重试')
  } finally {
    loading.value = false
    appStore.endLoading()
  }
}

onMounted(() => {
  fetchCategoryDynamics()
})
</script>

<style scoped>
.category-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.page-header {
  text-align: center;
  margin-bottom: 3rem;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  background: linear-gradient(90deg, #38bdf8, #818cf8, #c084fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.page-desc {
  color: #666;
  font-size: 1.1rem;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.dynamics-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .dynamics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 992px) {
  .dynamics-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.dynamic-card {
  background-color: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.dynamic-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.dynamic-link {
  display: block;
  text-decoration: none;
  color: inherit;
}

.dynamic-content {
  padding: 1.5rem;
}

.dynamic-title {
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
}

.dynamic-summary {
  color: #666;
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dynamic-meta {
  display: flex;
  justify-content: space-between;
  color: #888;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
  }
}
</style> 