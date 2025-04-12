<template>
  <div class="categories-container">
    <div class="page-header">
      <h1 class="page-title">文章归类</h1>
      <p class="page-desc">根据主题和内容对文章进行分类</p>
    </div>
    
    <div class="categories-grid">
      <div v-for="category in categories" :key="category.id" class="category-card">
        <router-link :to="`/blog/categories/${category.id}`" class="category-link">
          <div class="category-content">
            <h3 class="category-name">{{ category.name }}</h3>
            <div class="category-count">{{ category.count }}篇文章</div>
            <p class="category-desc">{{ category.description }}</p>
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getCategoryList } from '@/api/category'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const categories = ref([])

const fetchCategories = async () => {
  try {
    appStore.startLoading('加载分类数据...')
    
    // 使用模拟数据，实际项目应替换为API调用
    const categoriesData = [
      { id: 1, name: '前端开发', count: 32, description: '前端技术、框架及最佳实践' },
      { id: 2, name: '后端开发', count: 24, description: '服务器端开发技术与架构' },
      { id: 3, name: '移动开发', count: 18, description: '移动应用开发及跨平台技术' },
      { id: 4, name: '数据库', count: 15, description: '数据库设计与优化' },
      { id: 5, name: '云计算', count: 12, description: '云服务及云原生架构' },
      { id: 6, name: '人工智能', count: 9, description: '机器学习与AI应用' },
      { id: 7, name: '开发工具', count: 21, description: '提高效率的开发工具与资源' },
      { id: 8, name: '项目管理', count: 11, description: '项目规划、执行与团队协作' }
    ]
    
    categories.value = categoriesData
    appStore.endLoading()
  } catch (error) {
    console.error('获取分类数据失败:', error)
    appStore.setLoadingError('获取分类数据失败，请刷新重试')
  }
}

onMounted(() => {
  fetchCategories()
})
</script>

<style scoped>
.categories-container {
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

.categories-grid {
  display: grid;
  grid-template-columns: 1fr; /* 默认移动端单列 */
  gap: 1.5rem;
}

/* 平板断点 (768px) */
@media (min-width: 768px) {
  .categories-grid {
    grid-template-columns: repeat(2, 1fr); /* 平板双列 */
  }
}

/* 小桌面断点 (992px) */
@media (min-width: 992px) {
  .categories-grid {
    grid-template-columns: repeat(3, 1fr); /* 小桌面三列 */
  }
}

/* 大桌面断点 (1200px) */
@media (min-width: 1200px) {
  .categories-grid {
    grid-template-columns: repeat(4, 1fr); /* 大桌面四列 */
  }
  
  .categories-container {
    padding: 3rem 2rem;
  }
}

.category-card {
  background-color: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  height: 100%; /* 确保所有卡片高度一致 */
}

.category-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.category-link {
  display: block;
  text-decoration: none;
  color: inherit;
}

.category-content {
  padding: 1.5rem;
}

.category-name {
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
}

.category-count {
  display: inline-block;
  background-color: #f3e8ff;
  color: #9333ea;
  padding: 0.3rem 0.6rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  margin-bottom: 1rem;
}

.category-desc {
  color: #666;
  font-size: 0.95rem;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
  }
}
</style> 