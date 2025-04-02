<template>
  <div class="blog-tags">
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
      <!-- 标签页面标题 -->
      <div class="page-header">
        <template v-if="activeTagId">
          <h1 class="page-title">
            <el-icon><i-ep-collection-tag /></el-icon>
            {{ activeTag?.name || '标签文章' }}
          </h1>
          <el-button type="primary" text @click="backToTags">
            <el-icon><i-ep-back /></el-icon> 返回全部标签
          </el-button>
        </template>
        
        <template v-else>
          <h1 class="page-title">文章标签</h1>
          <p class="page-description">
            浏览不同标签下的文章，发现你感兴趣的内容
          </p>
        </template>
      </div>
      
      <!-- 标签云 -->
      <div v-if="!activeTagId" class="tags-cloud-wrapper">
        <div class="tags-cloud">
          <div 
            v-for="tag in tags" 
            :key="tag.id" 
            class="tag-item" 
            @click="viewTag(tag.id)"
            :style="{ fontSize: getTagSize(tag.count) }"
          >
            <el-icon><i-ep-collection-tag /></el-icon>
            <span class="tag-name">{{ tag.name }}</span>
            <span class="tag-count">({{ tag.count || 0 }})</span>
          </div>
        </div>
      </div>
      
      <!-- 特定标签的文章列表 -->
      <div v-else>
        <!-- 文章列表 -->
        <div class="post-list" v-if="tagPosts.length > 0">
          <article v-for="post in tagPosts" :key="post.id" class="post-item">
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
                  <span class="post-category">
                    <el-icon><i-ep-folder /></el-icon>
                    <router-link :to="`/blog/categories/${post.categoryId}`" class="category-link">
                      {{ post.categoryName }}
                    </router-link>
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
                    :class="{ 'active-tag': tag.id === activeTagId }"
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
          v-if="tagPosts.length === 0"
          description="该标签下暂无文章" 
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
import { getTagList } from '../../api/tag'
import { getTagPosts } from '../../api/blog'

const route = useRoute()
const router = useRouter()

// 状态
const loading = ref(true)
const error = ref(false)
const errorMessage = ref('')
const tags = ref([])
const tagPosts = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)

// 活动标签ID，通过路由参数获取
const activeTagId = computed(() => {
  return route.params.id ? Number(route.params.id) : null
})

// 当前活动标签
const activeTag = computed(() => {
  return tags.value.find(t => t.id === activeTagId.value) || null
})

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 根据文章数量获取标签字体大小
const getTagSize = (count) => {
  // 默认最小标签大小
  const minSize = 14
  
  // 如果没有计数或计数为0，返回最小尺寸
  if (!count) return `${minSize}px`
  
  // 根据文章数量动态计算字体大小，范围在14px到28px之间
  const size = minSize + Math.min(count, 20) * 0.7
  return `${size}px`
}

// 获取分页参数
const getPageParams = () => {
  const pageParam = parseInt(route.query.page) || 1
  const pageSizeParam = parseInt(route.query.pageSize) || 10
  
  page.value = pageParam
  pageSize.value = pageSizeParam
}

// 加载标签列表
const loadTags = async () => {
  try {
    const data = await getTagList()
    tags.value = data.map(tag => ({
      ...tag,
      count: Math.floor(Math.random() * 30) + 1 // 模拟文章数量，实际应该从API获取
    }))
  } catch (err) {
    console.error('获取标签列表失败:', err)
    error.value = true
    errorMessage.value = err.message || '获取标签列表失败，请重试'
  }
}

// 加载特定标签的文章
const loadTagPosts = async () => {
  if (!activeTagId.value) return
  
  try {
    // 准备查询参数
    const params = {
      page: page.value,
      pageSize: pageSize.value
    }
    
    // 发起请求
    const data = await getTagPosts(activeTagId.value, params)
    tagPosts.value = data.items
    total.value = data.total
  } catch (err) {
    console.error('获取标签文章失败:', err)
    error.value = true
    errorMessage.value = err.message || '获取标签文章失败，请重试'
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

// 查看特定标签
const viewTag = (tagId) => {
  router.push(`/blog/tags/${tagId}`)
}

// 返回标签列表
const backToTags = () => {
  router.push('/blog/tags')
}

// 初始化加载数据
const loadData = async () => {
  loading.value = true
  error.value = false
  errorMessage.value = ''
  
  try {
    getPageParams()
    await loadTags()
    
    if (activeTagId.value) {
      await loadTagPosts()
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
  if (activeTagId.value) {
    getPageParams()
    loadTagPosts()
  }
}, { deep: true })

// 组件挂载时初始化
onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.blog-tags {
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
    display: flex;
    align-items: center;
    
    .el-icon {
      margin-right: 8px;
      font-size: 1.6rem;
    }
  }
  
  .page-description {
    margin: 0 0 15px;
    color: #666;
    font-size: 1rem;
    line-height: 1.6;
  }
}

// 标签云样式
.tags-cloud-wrapper {
  background-color: #fff;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  margin-bottom: 30px;
}

.tags-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  
  .tag-item {
    display: inline-flex;
    align-items: center;
    background-color: #f0f2f5;
    color: #555;
    padding: 8px 15px;
    border-radius: 4px;
    transition: all 0.3s;
    cursor: pointer;
    
    &:hover {
      background-color: var(--el-color-primary-light-8);
      color: var(--el-color-primary);
      transform: translateY(-3px);
    }
    
    .el-icon {
      margin-right: 6px;
    }
    
    .tag-count {
      margin-left: 5px;
      font-size: 0.85em;
      opacity: 0.8;
    }
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
    
    .category-link {
      color: #666;
      text-decoration: none;
      transition: color 0.3s;
      
      &:hover {
        color: var(--el-color-primary);
      }
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
      
      &.active-tag {
        background-color: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
        font-weight: 500;
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