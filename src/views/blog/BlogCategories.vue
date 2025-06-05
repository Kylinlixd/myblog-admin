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
            <div class="category-count">{{ category.dynamicCount ?? category.count ?? 0 }}篇文章</div>
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
  // 只有在访问分类页面时才加载数据
  if (window.location.pathname.includes('/blog/categories')) {
    fetchCategories()
  }
})
</script>

<style scoped>
.categories-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
  text-align: center;
}

.page-title {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 10px;
  background: linear-gradient(90deg, #38bdf8, #818cf8, #c084fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.page-desc {
  font-size: 16px;
  color: #666;
}

.categories-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 20px;
  justify-content: center; /* 居中显示 */
}

/* 移动端 (480px - 767px) */
@media screen and (max-width: 767px) {
  .categories-container {
    padding: 15px;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .page-desc {
    font-size: 14px;
  }
}

.category-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: calc(25% - 15px); /* 4列布局，考虑gap */
  min-width: 280px; /* 防止卡片变得太小 */
  max-width: 400px; /* 防止卡片变得太大*/
  min-height: 120px;
}

@media screen and (max-width: 1199px) {
  .category-card {
    width: calc(33.333% - 14px); /* 3列布局 */
  }
}

@media screen and (max-width: 991px) {
  .category-card {
    width: calc(50% - 10px); /* 2列布局 */
  }
}

@media screen and (max-width: 767px) {
  .category-card {
    width: 100%; /* 1列布局 */
  }
}

.category-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.category-content {
  padding: 15px;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.category-name {
  font-size: clamp(16px, 1.5vw, 18px);
  font-weight: bold;
  margin: 0;
  color: #333;
}

.category-count {
  display: inline-block;
  background-color: #f3e8ff;
  color: #9333ea;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: clamp(12px, 1.2vw, 13px);
  font-weight: 500;
  margin: 8px 0;
}

.category-desc {
  font-size: clamp(12px, 1.2vw, 13px);
  color: #666;
  line-height: 1.4;
  margin: 0;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 移动端适配 */
@media screen and (max-width: 767px) {
  .category-content {
    padding: 12px;
  }

  .category-name {
    font-size: 15px;
  }

  .category-count {
    font-size: 12px;
    padding: 2px 8px;
  }

  .category-desc {
    font-size: 12px;
  }
}
</style> 