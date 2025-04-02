<template>
  <div class="blog-post">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="20" animated>
        <template #template>
          <div class="skeleton-card">
            <el-skeleton-item variant="image" style="width: 100%; height: 240px" />
            <div style="padding: 20px;">
              <el-skeleton-item variant="h1" style="width: 70%" />
              <div style="display: flex; align-items: center; margin: 16px 0">
                <el-skeleton-item variant="text" style="width: 15%; margin-right: 16px" />
                <el-skeleton-item variant="text" style="width: 15%; margin-right: 16px" />
                <el-skeleton-item variant="text" style="width: 15%" />
              </div>
              <el-skeleton-item variant="text" style="width: 100%; height: 60px" />
              <el-skeleton-item variant="text" style="width: 100%; height: 400px" />
            </div>
          </div>
        </template>
      </el-skeleton>
    </div>
    
    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
      <el-empty 
        description="加载文章失败" 
        :image-size="200"
      >
        <template #description>
          <p>{{ errorMessage }}</p>
        </template>
        <div class="error-actions">
          <el-button type="primary" @click="fetchPost">重试</el-button>
          <el-button @click="goBack">返回上页</el-button>
        </div>
      </el-empty>
    </div>
    
    <!-- 内容 -->
    <div v-else-if="post.id" class="post-content">
      <!-- 文章头部 -->
      <div class="post-header">
        <h1 class="post-title">{{ post.title }}</h1>
        <div class="post-meta">
          <div class="meta-item">
            <el-icon><i-ep-calendar /></el-icon>
            <span>{{ formatDate(post.createTime) }}</span>
          </div>
          <div class="meta-item">
            <el-icon><i-ep-folder /></el-icon>
            <router-link :to="`/blog/categories/${post.categoryId}`" class="category-link">
              {{ post.categoryName }}
            </router-link>
          </div>
          <div class="meta-item">
            <el-icon><i-ep-view /></el-icon>
            <span>{{ post.viewCount }} 阅读</span>
          </div>
        </div>
        
        <!-- 标签 -->
        <div v-if="post.tags && post.tags.length" class="post-tags">
          <router-link 
            v-for="tag in post.tags" 
            :key="tag.id" 
            :to="`/blog/tags/${tag.id}`"
            class="tag-link"
          >
            <el-icon><i-ep-collection-tag /></el-icon>
            {{ tag.name }}
          </router-link>
        </div>
        
        <!-- 摘要 -->
        <div v-if="post.summary" class="post-summary">
          <div class="summary-title">摘要</div>
          <div class="summary-content">
            {{ post.summary }}
          </div>
        </div>
      </div>
      
      <!-- 文章正文 -->
      <div class="post-body">
        <div class="markdown-content" v-html="renderedContent"></div>
      </div>
      
      <!-- 文章底部 -->
      <div class="post-footer">
        <div class="post-copyright">
          <p>本文作者: {{ post.author || '博主' }}</p>
          <p>本文链接: {{ currentPageUrl }}</p>
          <p>版权声明: 本博客所有文章除特别声明外，均采用 
            <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank">
              CC BY-NC-SA 4.0
            </a> 许可协议，转载请注明出处。
          </p>
        </div>
        
        <!-- 上一篇/下一篇文章导航 -->
        <div class="post-navigation">
          <div class="prev-next-title">文章导航</div>
          <div class="prev-next-links">
            <div class="nav-item prev" v-if="adjacentPosts.prev">
              <router-link :to="`/blog/post/${adjacentPosts.prev.id}`">
                <el-icon><i-ep-arrow-left /></el-icon>
                <span class="nav-title">{{ adjacentPosts.prev.title }}</span>
              </router-link>
            </div>
            <div class="nav-item next" v-if="adjacentPosts.next">
              <router-link :to="`/blog/post/${adjacentPosts.next.id}`">
                <span class="nav-title">{{ adjacentPosts.next.title }}</span>
                <el-icon><i-ep-arrow-right /></el-icon>
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 文章不存在 -->
    <div v-else class="not-found-container">
      <el-empty description="文章不存在" :image-size="200">
        <el-button @click="goBack">返回上页</el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getBlogPostDetail, getAdjacentPosts, increasePostView } from '../../api/blog'
import MarkdownIt from 'markdown-it'

// 创建Markdown渲染器
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})

const route = useRoute()
const router = useRouter()

// 状态
const loading = ref(true)
const error = ref(false)
const errorMessage = ref('')
const post = ref({})
const adjacentPosts = ref({
  prev: null,
  next: null
})

// 渲染Markdown内容
const renderedContent = computed(() => {
  return md.render(post.value.content || '')
})

// 当前页面的完整URL
const currentPageUrl = computed(() => {
  return window.location.href
})

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 获取文章详情
const fetchPost = async () => {
  const postId = parseInt(route.params.id)
  if (!postId) {
    error.value = true
    errorMessage.value = '无效的文章ID'
    loading.value = false
    return
  }
  
  loading.value = true
  error.value = false
  errorMessage.value = ''
  
  try {
    // 获取文章详情
    const postData = await getBlogPostDetail(postId)
    post.value = postData
    
    // 更新页面标题
    document.title = `${post.value.title} - 博客`
    
    // 获取上一篇/下一篇文章
    const adjacentData = await getAdjacentPosts(postId)
    adjacentPosts.value = adjacentData
    
    // 增加浏览量
    try {
      await increasePostView(postId)
    } catch (err) {
      console.error('增加浏览量失败:', err)
    }
  } catch (err) {
    console.error('获取文章详情失败:', err)
    error.value = true
    errorMessage.value = err.message || '获取文章详情失败，请重试'
  } finally {
    loading.value = false
  }
}

// 返回上一页
const goBack = () => {
  router.go(-1)
}

// 监听路由参数变化，重新加载文章
watch(() => route.params.id, () => {
  fetchPost()
}, { immediate: true })

// 组件挂载时初始化
onMounted(() => {
  fetchPost()
})
</script>

<style lang="scss" scoped>
.blog-post {
  overflow: hidden;
}

.loading-container,
.error-container,
.not-found-container {
  margin: 30px 0;
}

.skeleton-card {
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.error-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
}

// 文章内容样式
.post-content {
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

// 文章头部样式
.post-header {
  padding: 30px 30px 20px;
  border-bottom: 1px solid #eee;
  
  .post-title {
    font-size: 2rem;
    margin: 0 0 20px;
    color: #333;
    line-height: 1.4;
  }
  
  .post-meta {
    display: flex;
    gap: 20px;
    margin-bottom: 15px;
    flex-wrap: wrap;
    
    .meta-item {
      display: flex;
      align-items: center;
      color: #666;
      font-size: 0.9rem;
      
      .el-icon {
        margin-right: 5px;
        font-size: 1rem;
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
  }
  
  .post-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 20px;
    
    .tag-link {
      display: inline-flex;
      align-items: center;
      background-color: #f0f2f5;
      color: #666;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 0.9rem;
      text-decoration: none;
      transition: all 0.3s;
      
      .el-icon {
        margin-right: 4px;
      }
      
      &:hover {
        background-color: var(--el-color-primary-light-8);
        color: var(--el-color-primary);
      }
    }
  }
  
  .post-summary {
    background-color: #f9f9f9;
    padding: 15px;
    border-radius: 4px;
    margin-bottom: 10px;
    
    .summary-title {
      font-weight: 600;
      margin-bottom: 8px;
      color: #333;
    }
    
    .summary-content {
      color: #666;
      line-height: 1.6;
      font-size: 0.95rem;
    }
  }
}

// 文章正文样式
.post-body {
  padding: 30px;
  color: #333;
}

// Markdown内容样式
.markdown-content {
  line-height: 1.8;
  font-size: 1rem;
  
  :deep(h1) {
    font-size: 1.8rem;
    margin: 1.8rem 0 1.2rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #eee;
  }
  
  :deep(h2) {
    font-size: 1.5rem;
    margin: 1.5rem 0 1rem;
    padding-bottom: 0.3rem;
    border-bottom: 1px solid #eee;
  }
  
  :deep(h3) {
    font-size: 1.3rem;
    margin: 1.3rem 0 0.8rem;
  }
  
  :deep(h4) {
    font-size: 1.1rem;
    margin: 1.1rem 0 0.6rem;
  }
  
  :deep(p) {
    margin: 1rem 0;
  }
  
  :deep(ul, ol) {
    padding-left: 2rem;
    margin: 1rem 0;
    
    li {
      margin-bottom: 0.5rem;
    }
  }
  
  :deep(a) {
    color: var(--el-color-primary);
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
  
  :deep(blockquote) {
    margin: 1rem 0;
    padding: 0.5rem 1rem;
    border-left: 4px solid var(--el-color-primary-light-5);
    background-color: var(--el-color-primary-light-9);
    color: #666;
  }
  
  :deep(code) {
    font-family: monospace;
    background-color: #f5f5f5;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-size: 0.9rem;
  }
  
  :deep(pre) {
    background-color: #f5f5f5;
    padding: 1rem;
    border-radius: 5px;
    overflow-x: auto;
    margin: 1rem 0;
    
    code {
      background-color: transparent;
      padding: 0;
    }
  }
  
  :deep(img) {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 1rem auto;
    border-radius: 4px;
  }
  
  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
    
    th, td {
      border: 1px solid #eee;
      padding: 8px 12px;
      text-align: left;
    }
    
    th {
      background-color: #f5f5f5;
      font-weight: 600;
    }
    
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
  }
}

// 文章底部样式
.post-footer {
  padding: 30px;
  border-top: 1px solid #eee;
  
  .post-copyright {
    background-color: #f9f9f9;
    padding: 15px;
    border-radius: 4px;
    margin-bottom: 30px;
    
    p {
      margin: 5px 0;
      font-size: 0.9rem;
      color: #666;
    }
    
    a {
      color: var(--el-color-primary);
      text-decoration: none;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
  
  .post-navigation {
    .prev-next-title {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 15px;
      color: #333;
    }
    
    .prev-next-links {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      
      @media (max-width: 768px) {
        flex-direction: column;
      }
      
      .nav-item {
        flex: 1;
        
        a {
          display: flex;
          align-items: center;
          background-color: #f5f5f5;
          padding: 15px;
          border-radius: 4px;
          text-decoration: none;
          color: #333;
          transition: all 0.3s;
          
          &:hover {
            background-color: var(--el-color-primary-light-9);
            color: var(--el-color-primary);
          }
        }
        
        &.prev a {
          .el-icon {
            margin-right: 10px;
          }
        }
        
        &.next a {
          justify-content: flex-end;
          text-align: right;
          
          .el-icon {
            margin-left: 10px;
          }
        }
        
        .nav-title {
          font-size: 0.95rem;
          line-height: 1.4;
          
          // 多行文本溢出省略
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }
  }
}

// 响应式调整
@media (max-width: 768px) {
  .post-header {
    padding: 20px 20px 15px;
    
    .post-title {
      font-size: 1.6rem;
      margin-bottom: 15px;
    }
    
    .post-meta {
      gap: 15px;
    }
  }
  
  .post-body,
  .post-footer {
    padding: 20px;
  }
}
</style> 