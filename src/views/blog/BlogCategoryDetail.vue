<template>
  <div class="category-detail-container">
    <div class="page-header">
      <h1 class="page-title">{{ category?.name || '加载中...' }}</h1>
      <p class="page-subtitle">探索这个分类下的精彩内容</p>
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
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  padding: 3rem;
  min-height: 100vh;
  background: #f8fafc;
  position: relative;
  overflow: hidden;
}

.category-detail-container::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 0%,
    rgba(56, 189, 248, 0.08) 30%,
    rgba(129, 140, 248, 0.08) 40%,
    rgba(192, 132, 252, 0.08) 50%,
    transparent 100%
  );
  animation: gradientMove 30s linear infinite;
  z-index: 0;
}

.category-detail-container::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    -45deg,
    transparent 0%,
    rgba(56, 189, 248, 0.06) 30%,
    rgba(129, 140, 248, 0.06) 40%,
    rgba(192, 132, 252, 0.06) 50%,
    transparent 100%
  );
  animation: gradientMove 25s linear infinite reverse;
  z-index: 0;
}

@keyframes gradientMove {
  0% {
    transform: rotate(0deg) scale(1);
  }
  50% {
    transform: rotate(180deg) scale(1.2);
  }
  100% {
    transform: rotate(360deg) scale(1);
  }
}

.page-header {
  position: relative;
  z-index: 1;
  text-align: center;
  margin-bottom: 3rem;
  padding: 2.5rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.page-header:hover {
  transform: translateY(-6px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: #d1d5db;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  background: linear-gradient(90deg, #38bdf8, #818cf8, #c084fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.4;
  margin-top: -0.5rem;
}

.page-subtitle {
  color: #6b7280;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
  font-weight: 500;
}

.page-desc {
  color: #4b5563;
  font-size: 1.1rem;
  line-height: 1.7;
  max-width: 700px;
  margin: 0 auto;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 4rem;
  color: #4b5563;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.dynamics-grid {
  position: relative;
  z-index: 1;
  display: grid;
    grid-template-columns: repeat(3, 1fr);
  gap: 2.5rem;
  padding: 1rem;
}

.dynamic-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid #e5e7eb;
  position: relative;
  z-index: 1;
}

.dynamic-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: #d1d5db;
}

.dynamic-link {
  display: block;
  text-decoration: none;
  color: inherit;
  height: 100%;
}

.dynamic-content {
  padding: 2rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.dynamic-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  background: linear-gradient(90deg, #38bdf8, #818cf8, #c084fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dynamic-summary {
  color: #4b5563;
  font-size: 1.1rem;
  line-height: 1.7;
  margin-bottom: 1.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.dynamic-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #6b7280;
  font-size: 0.95rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.dynamic-date {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dynamic-views {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

@media (max-width: 1400px) {
  .dynamics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 1024px) {
  .category-detail-container {
    padding: 2rem;
  }
  
  .page-header {
    padding: 2rem;
    margin-bottom: 2.5rem;
  }
  
  .page-title {
    font-size: 2.2rem;
    margin-top: -0.3rem;
  }
  
  .page-subtitle {
    font-size: 1rem;
    margin-bottom: 1.2rem;
  }
  
  .page-desc {
    font-size: 1.05rem;
  }
}

@media (max-width: 768px) {
  .category-detail-container {
    padding: 1.5rem;
  }
  
  .page-header {
    padding: 2rem;
    margin-bottom: 2rem;
  }
  
  .page-title {
    font-size: 2.5rem;
  }
  
  .page-subtitle {
    font-size: 1.1rem;
  }
  
  .page-desc {
    font-size: 1.1rem;
  }
  
  .dynamics-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .dynamic-content {
    padding: 1.5rem;
  }
  
  .dynamic-title {
    font-size: 1.3rem;
  }
  
  .dynamic-summary {
    font-size: 1rem;
  }
}
</style> 