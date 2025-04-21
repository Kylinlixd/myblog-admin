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
import { getBlogCategoryList } from '@/api/blog'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const categories = ref([])

const fetchCategories = async () => {
  try {
    appStore.startLoading('加载分类数据...')
    
    // 使用真实API调用获取分类数据
    const response = await getBlogCategoryList()
    if (response.code === 200) {
      categories.value = response.data.map(category => ({
        ...category,
        count: category.count || 0
      }))
    } else {
      console.error('获取分类数据失败:', response.message)
      appStore.setLoadingError('获取分类数据失败，请刷新重试')
    }
    
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