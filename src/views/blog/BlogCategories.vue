<template>
  <div class="blog-categories">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>
    
    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
      <el-empty 
        description="加载失败" 
        :image-size="200"
      >
        <template #description>
          <p>{{ errorMessage }}</p>
        </template>
        <el-button type="primary" @click="loadData">重试</el-button>
      </el-empty>
    </div>
    
    <!-- 内容 -->
    <div v-else>
      <!-- 分类页面标题 -->
      <div class="page-header">
        <template v-if="activeCategoryId">
          <h1 class="page-title">{{ activeCategory?.name || '分类文章' }}</h1>
          <p v-if="activeCategory?.description" class="category-description">
            {{ activeCategory.description }}
          </p>
          <el-button type="primary" text @click="backToCategories">
            <el-icon><i-ep-back /></el-icon> 返回全部分类
          </el-button>
        </template>
        
        <template v-else>
          <h1 class="page-title">文章分类</h1>
          <p class="page-description">
            浏览不同分类下的文章，探索更多精彩内容
          </p>
        </template>
      </div>
      
      <!-- 分类列表 -->
      <div v-if="!activeCategoryId" class="categories-wrapper">
        <div class="categories-grid">
          <div 
            v-for="category in categories" 
            :key="category.id" 
            class="category-card" 
            @click="viewCategory(category.id)"
          >
            <el-icon class="category-icon"><i-ep-folder-opened /></el-icon>
            <h3 class="category-name">{{ category.name }}</h3>
            <div class="category-count">{{ category.count || 0 }} 篇文章</div>
            <p v-if="category.description" class="category-desc">
              {{ category.description }}
            </p>
          </div>
        </div>
      </div>
      
      <!-- 特定分类的文章列表 -->
      <div v-else>
        <!-- 文章列表 -->
        <div class="post-list" v-if="categoryPosts.length > 0">
          <article v-for="post in categoryPosts" :key="post.id" class="post-item">
            <div class="post-inner">
              <div 
                v-if="post.coverImage" 
                class="post-image"
              >
                <router-link :to="`/blog/post/${post.id}`">
                  <img :src="post.coverImage || 'https://placeholder.pics/svg/400/DEDEDE/555555/文章图片'" :alt="post.title">
                </router-link>
              </div>
              <div class="post-content">
                <h2 class="post-title">
                  <router-link :to="`/blog/post/${post.id}`">{{ post.title }}</router-link>
                </h2>
                <div class="post-meta">
                  <span class="post-date">
                    <el-icon><i-ep-calendar /></el-icon>
                    {{ formatDate(post.createTime) }}
                  </span>
                  <span class="post-views">
                    <el-icon><i-ep-view /></el-icon>
                    {{ post.viewCount }} 阅读
                  </span>
                </div>
                
                <div class="post-summary">{{ post.summary }}</div>
                
                <div class="post-tags" v-if="post.tags && post.tags.length">
                  <router-link 
                    v-for="tag in post.tags" 
                    :key="tag.id" 
                    :to="`/blog/tags/${tag.id}`"
                    class="post-tag"
                  >
                    <el-icon><i-ep-collection-tag /></el-icon> {{ tag.name }}
                  </router-link>
                </div>
                
                <router-link :to="`/blog/post/${post.id}`" class="read-more">
                  阅读全文 <el-icon><i-ep-right /></el-icon>
                </router-link>
              </div>
            </div>
          </article>
        </div>
        
        <!-- 空状态 -->
        <el-empty 
          v-if="categoryPosts.length === 0"
          description="该分类下暂无文章" 
          :image-size="200"
        />
        
        <!-- 分页 -->
        <div class="pagination-container" v-if="total > 0">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 30, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
            background
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCategoryList } from '../../api/category'
import { getCategoryPosts } from '../../api/blog'

const route = useRoute()
const router = useRouter()

// 状态
const loading = ref(true)
const error = ref(false)
const errorMessage = ref('')
const categories = ref([])
const categoryPosts = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)

// 活动分类ID，通过路由参数获取
const activeCategoryId = computed(() => {
  return route.params.id ? Number(route.params.id) : null
})

// 当前活动分类
const activeCategory = computed(() => {
  return categories.value.find(c => c.id === activeCategoryId.value) || null
})

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 获取分页参数
const getPageParams = () => {
  const pageParam = parseInt(route.query.page) || 1
  const pageSizeParam = parseInt(route.query.pageSize) || 10
  
  page.value = pageParam
  pageSize.value = pageSizeParam
}

// 加载分类列表
const loadCategories = async () => {
  try {
    const data = await getCategoryList()
    categories.value = data.map(category => ({
      ...category,
      count: Math.floor(Math.random() * 30) + 1 // 模拟文章数量，实际应该从API获取
    }))
  } catch (err) {
    console.error('获取分类列表失败:', err)
    error.value = true
    errorMessage.value = err.message || '获取分类列表失败，请重试'
  }
}

// 加载特定分类的文章
const loadCategoryPosts = async () => {
  if (!activeCategoryId.value) return
  
  try {
    // 准备查询参数
    const params = {
      page: page.value,
      pageSize: pageSize.value
    }
    
    // 发起请求
    const data = await getCategoryPosts(activeCategoryId.value, params)
    categoryPosts.value = data.items
    total.value = data.total
  } catch (err) {
    console.error('获取分类文章失败:', err)
    error.value = true
    errorMessage.value = err.message || '获取分类文章失败，请重试'
  }
}

// 分页大小变化
const handleSizeChange = (newSize) => {
  pageSize.value = newSize
  router.push({
    path: route.path,
    query: {
      ...route.query,
      page: 1, // 切换每页数量时，重置为第一页
      pageSize: newSize
    }
  })
}

// 页码变化
const handlePageChange = (newPage) => {
  router.push({
    path: route.path,
    query: {
      ...route.query,
      page: newPage
    }
  })
}

// 查看特定分类
const viewCategory = (categoryId) => {
  router.push(`/blog/categories/${categoryId}`)
}

// 返回分类列表
const backToCategories = () => {
  router.push('/blog/categories')
}

// 初始化加载数据
const loadData = async () => {
  loading.value = true
  error.value = false
  errorMessage.value = ''
  
  try {
    getPageParams()
    await loadCategories()
    
    if (activeCategoryId.value) {
      await loadCategoryPosts()
    }
  } catch (err) {
    console.error('加载数据失败:', err)
    error.value = true
    errorMessage.value = err.message || '加载数据失败，请重试'
  } finally {
    loading.value = false
  }
}

// 监听路由变化
watch(() => route.params.id, () => {
  loadData()
}, { immediate: true })

// 监听分页参数变化
watch(() => route.query, () => {
  if (activeCategoryId.value) {
    getPageParams()
    loadCategoryPosts()
  }
}, { deep: true })

// 组件挂载时初始化
onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.blog-categories {
  overflow: hidden;
}

.loading-container,
.error-container {
  margin: 30px 0;
}

// 页面头部样式
.page-header {
  margin-bottom: 30px;
  background-color: #fff;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  
  .page-title {
    margin: 0 0 10px;
    color: #333;
    font-size: 1.8rem;
  }
  
  .page-description,
  .category-description {
    margin: 0 0 15px;
    color: #666;
    font-size: 1rem;
    line-height: 1.6;
  }
}

// 分类列表样式
.categories-wrapper {
  margin-bottom: 30px;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.category-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
  text-align: center;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
  
  .category-icon {
    font-size: 2.5rem;
    color: var(--el-color-primary);
    margin-bottom: 15px;
  }
  
  .category-name {
    font-size: 1.3rem;
    margin: 0 0 10px;
    color: #333;
  }
  
  .category-count {
    color: #666;
    font-size: 0.9rem;
    margin-bottom: 10px;
  }
  
  .category-desc {
    color: #777;
    font-size: 0.9rem;
    margin: 0;
    line-height: 1.5;
    
    // 多行文本溢出省略
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

// 文章列表样式
.post-list {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.post-item {
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s, box-shadow 0.3s;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
  
  .post-inner {
    display: flex;
    
    @media (max-width: 768px) {
      flex-direction: column;
    }
  }
  
  .post-image {
    width: 300px;
    flex-shrink: 0;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    @media (max-width: 768px) {
      width: 100%;
      height: 200px;
    }
  }
  
  .post-content {
    padding: 20px;
    flex: 1;
  }
  
  .post-title {
    font-size: 1.4rem;
    margin: 0 0 12px;
    
    a {
      color: #333;
      text-decoration: none;
      transition: color 0.3s;
      
      &:hover {
        color: var(--el-color-primary);
      }
    }
  }
  
  .post-meta {
    display: flex;
    gap: 15px;
    margin-bottom: 12px;
    color: #666;
    font-size: 0.9rem;
    flex-wrap: wrap;
    
    .el-icon {
      margin-right: 4px;
    }
  }
  
  .post-summary {
    margin-bottom: 15px;
    color: #666;
    font-size: 0.95rem;
    line-height: 1.6;
  }
  
  .post-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 15px;
    
    .post-tag {
      display: inline-flex;
      align-items: center;
      background-color: #f0f2f5;
      color: #666;
      font-size: 0.85rem;
      padding: 4px 10px;
      border-radius: 3px;
      text-decoration: none;
      transition: all 0.3s;
      
      .el-icon {
        margin-right: 4px;
        font-size: 0.9rem;
      }
      
      &:hover {
        background-color: var(--el-color-primary-light-8);
        color: var(--el-color-primary);
      }
    }
  }
  
  .read-more {
    display: inline-flex;
    align-items: center;
    color: var(--el-color-primary);
    text-decoration: none;
    font-size: 0.9rem;
    font-weight: 500;
    
    .el-icon {
      margin-left: 4px;
      transition: transform 0.3s;
    }
    
    &:hover {
      color: var(--el-color-primary-dark-2);
      
      .el-icon {
        transform: translateX(3px);
      }
    }
  }
}

// 分页样式
.pagination-container {
  margin-top: 40px;
  display: flex;
  justify-content: center;
}

// 响应式调整
@media (max-width: 768px) {
  .page-header .page-title {
    font-size: 1.5rem;
  }
  
  .post-item .post-title {
    font-size: 1.2rem;
  }
}
</style> 