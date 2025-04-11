<template>
  <AuroraBackground>
    <div class="blog-home">
      <div class="blog-banner">
        <div class="banner-content">
          <h1>欢迎访问我的博客</h1>
          <p>探索技术的无限可能</p>
        </div>
      </div>
    
      <div class="blog-content">
        <div class="main-content">
          <div class="recent-posts">
            <h2 class="section-title">最新文章</h2>
            
            <div v-if="loading" class="loading-container">
              <el-skeleton :rows="3" animated />
              <el-skeleton :rows="3" animated style="margin-top: 1rem" />
            </div>
            
            <div v-else-if="errorMessage" class="error-message">
              <el-empty 
                description="加载文章失败" 
                :image-size="100"
              >
                <p>{{ errorMessage }}</p>
                <el-button type="primary" @click="fetchPosts">重试</el-button>
              </el-empty>
            </div>
            
            <div v-else-if="posts.length === 0" class="empty-posts">
              <el-empty description="暂无文章" :image-size="100" />
            </div>
            
            <div v-else class="post-list">
              <div v-for="post in posts" :key="post.id" class="post-card">
                <router-link :to="`/blog/post/${post.id}`" class="post-link">
                  <h3 class="post-title">{{ post.title }}</h3>
                </router-link>
                <p class="post-summary">{{ post.summary }}</p>
                <div class="post-meta">
                  <span class="post-category">
                    <el-tag size="small">{{ post.categoryName }}</el-tag>
                  </span>
                  <span v-if="post.tags && post.tags.length > 0" class="post-tags">
                    <el-tag
                      v-for="tag in post.tags"
                      :key="tag.id"
                      size="small"
                      effect="plain"
                      class="tag-item"
                    >
                      {{ tag.name }}
                    </el-tag>
                  </span>
                  <span class="post-date">{{ formatDate(post.createdAt) }}</span>
                </div>
                <div class="post-footer">
                  <router-link :to="`/blog/post/${post.id}`" class="read-more">
                    阅读全文
                    <el-icon><Right /></el-icon>
                  </router-link>
                </div>
              </div>
              
              <div class="pagination-container">
                <el-pagination
                  v-model:current-page="currentPage"
                  :page-size="pageSize"
                  :total="total"
                  :page-sizes="[5, 10, 20]"
                  layout="total, sizes, prev, pager, next"
                  @size-change="handleSizeChange"
                  @current-change="handleCurrentChange"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AuroraBackground>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getPostList } from '../../api/post'
import { getCategoryList } from '../../api/category'
import { getTagList } from '../../api/tag'
import { ElMessage } from 'element-plus'
import { Right } from '@element-plus/icons-vue'
import AuroraBackground from '../../components/InspiraUI/AuroraBackground.vue'

// 文章列表状态
const posts = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(5)
const loading = ref(true)
const errorMessage = ref('')

// 分类列表状态
const categories = ref([])
const loadingCategories = ref(true)

// 标签列表状态
const tags = ref([])
const loadingTags = ref(true)

// 获取文章列表
const fetchPosts = async () => {
  loading.value = true
  errorMessage.value = ''
  
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      status: 'published' // 只获取已发布的文章
    }
    
    const response = await getPostList(params)
    posts.value = response.items
    total.value = response.total
  } catch (error) {
    console.error('获取文章列表失败:', error)
    errorMessage.value = error.message || '获取文章列表失败，请稍后重试'
    ElMessage.error(errorMessage.value)
  } finally {
    loading.value = false
  }
}

// 获取分类列表
const fetchCategories = async () => {
  loadingCategories.value = true
  
  try {
    const categoryList = await getCategoryList()
    categories.value = categoryList
  } catch (error) {
    console.error('获取分类列表失败:', error)
    ElMessage.error('获取分类列表失败')
  } finally {
    loadingCategories.value = false
  }
}

// 获取标签列表
const fetchTags = async () => {
  loadingTags.value = true
  
  try {
    const tagList = await getTagList()
    tags.value = tagList
  } catch (error) {
    console.error('获取标签列表失败:', error)
    ElMessage.error('获取标签列表失败')
  } finally {
    loadingTags.value = false
  }
}

// 分页处理
const handleSizeChange = (size) => {
  pageSize.value = size
  fetchPosts()
}

const handleCurrentChange = (page) => {
  currentPage.value = page
  fetchPosts()
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 页面加载时获取数据
onMounted(() => {
  fetchPosts()
  fetchCategories()
  fetchTags()
})
</script>

<style scoped lang="scss">
.blog-home {
  display: flex;
  flex: 1;
  flex-direction: column;
  width: 100%; // 确保组件宽度为 100%
}

.blog-banner {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-color-light));
  color: white;
  padding: 3rem 0;
  text-align: center;
  margin-bottom: 2rem;
  border-radius: 8px;
  
  .banner-content {

    h1 {
    color: #2c3e50;
    font-size: 2.5rem;
    margin-bottom: 10px;
    line-height: 1.2;
    }
    p {
    color: #555;
    font-size: 1.1rem;
    font-weight: 300;
    margin: 0;
    }
  }
  
  @media (max-width: 768px) {
    padding: 2rem 0;
    margin-bottom: 1rem;
    
    .banner-content {
      h1 {
        font-size: 1.8rem;
      }
      
      p {
        font-size: 1rem;
      }
    }
  }
}

.blog-content {
  display: flex;
  gap: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
}

.main-content {
  flex: 2;
  
  .section-title {
    font-size: 1.8rem;
    margin-top: 0;
    margin-bottom: 1.5rem;
    // 修改 margin-left 让标题在宽度三分之一处 
    color: var(--text-primary);
    // border-bottom: 2px solid var(--border-color);
    // padding-bottom: 0.5rem;
    text-align: center;
  }
}

.sidebar {
  flex: 1;
  
  @media (max-width: 768px) {
    margin-top: 1rem;
  }
}

.post-list {
  .post-card {
    margin-bottom: 1.5rem;
    padding: 1.5rem;
    background-color: var(--bg-surface);
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    transition: transform 0.3s, box-shadow 0.3s;
    
    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 5px 15px 0 rgba(0, 0, 0, 0.1);
    }
    
    .post-link {
      text-decoration: none;
    }
    
    .post-title {
      margin-top: 0;
      margin-bottom: 1rem;
      font-size: 1.5rem;
      color: var(--text-primary);
      transition: color 0.2s;
      
      &:hover {
        color: var(--primary-color);
      }
    }
    
    .post-summary {
      color: var(--text-secondary);
      margin-bottom: 1rem;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .post-meta {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      margin-bottom: 1rem;
      font-size: 0.9rem;
      gap: 0.5rem;
      
      .post-category {
        margin-right: 1rem;
      }
      
      .post-tags {
        margin-right: 1rem;
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      
      .post-date {
        color: var(--text-secondary);
        margin-left: auto;
      }
      
      @media (max-width: 576px) {
        flex-direction: column;
        align-items: flex-start;
        
        .post-date {
          margin-left: 0;
          margin-top: 0.5rem;
        }
      }
    }
    
    .post-footer {
      display: flex;
      justify-content: flex-end;
      
      .read-more {
        display: flex;
        align-items: center;
        color: var(--primary-color);
        text-decoration: none;
        font-weight: 500;
        gap: 0.25rem;
        
        &:hover {
          opacity: 0.8;
        }
      }
    }
    
    @media (max-width: 576px) {
      padding: 1rem;
      margin-bottom: 1rem;
      
      .post-title {
        font-size: 1.2rem;
      }
    }
  }
}

.sidebar-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: var(--bg-surface);
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  
  .sidebar-title {
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1.2rem;
    color: var(--text-primary);
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border-color);
  }
  
  @media (max-width: 768px) {
    margin-bottom: 1rem;
    padding: 1rem;
  }
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  
  .category-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    text-decoration: none;
    color: var(--text-secondary);
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--border-color-light);
    transition: color 0.2s;
    
    &:hover {
      color: var(--primary-color);
    }
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  @media (max-width: 768px) {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
    
    .category-item {
      border-bottom: none;
      background-color: #f5f7fa;
      padding: 0.5rem;
      border-radius: 4px;
    }
  }
  
  @media (max-width: 576px) {
    grid-template-columns: 1fr;
  }
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  
  .tag-item {
    margin-bottom: 0.5rem;
    text-decoration: none;
  }
}

.about-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  
  .about-avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    margin-bottom: 1rem;
    object-fit: cover;
  }
  
  .about-name {
    font-weight: 600;
    margin: 0 0 0.5rem;
    color: var(--text-primary);
  }
  
  .about-bio {
    color: var(--text-secondary);
    margin: 0 0 1rem;
  }
  
  .about-link {
    display: flex;
    align-items: center;
    color: var(--primary-color);
    text-decoration: none;
    font-weight: 500;
    gap: 0.25rem;
    
    &:hover {
      opacity: 0.8;
    }
  }
}

.pagination-container {
  margin-top: 2rem;
  display: flex;
  justify-content: center;
}

.loading-container,
.error-message,
.empty-posts,
.empty-categories,
.empty-tags {
  padding: 1rem;
}
</style>