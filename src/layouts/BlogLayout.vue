<template>
  <div class="blog-layout">
    <!-- 顶部导航 -->
    <header class="blog-header">
      <div class="container">
        <div class="blog-logo">
          <router-link to="/blog">
            <h1>我的博客</h1>
          </router-link>
        </div>
        <nav class="blog-nav">
          <div class="nav-menu">
            <router-link to="/blog" class="nav-item" active-class="active">
              <el-icon><i-ep-house /></el-icon>
              <span>首页</span>
            </router-link>
            <router-link to="/blog/categories" class="nav-item" active-class="active">
              <el-icon><i-ep-folder-opened /></el-icon>
              <span>分类</span>
            </router-link>
            <router-link to="/blog/tags" class="nav-item" active-class="active">
              <el-icon><i-ep-collection-tag /></el-icon>
              <span>标签</span>
            </router-link>
            <router-link to="/blog/about" class="nav-item" active-class="active">
              <el-icon><i-ep-user /></el-icon>
              <span>关于</span>
            </router-link>
          </div>
        </nav>
        <div class="blog-search">
          <el-input
            v-model="searchQuery"
            placeholder="搜索文章..."
            :prefix-icon="Search"
            @keyup.enter="handleSearch"
            clearable
          />
        </div>
        <!-- 登录按钮 -->
        <div class="login-btn">
          <router-link to="/login" class="login-link">
            <el-button type="primary" size="small">
              <el-icon><i-ep-key /></el-icon>
              登录
            </el-button>
          </router-link>
        </div>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="blog-main">
      <div class="container">
        <div class="content-wrapper">
          <!-- 左侧主内容 -->
          <section class="main-content">
            <router-view v-slot="{ Component }">
              <transition name="fade" mode="out-in">
                <component :is="Component" :key="$route.fullPath" />
              </transition>
            </router-view>
          </section>
        </div>
      </div>
    </main>

    <!-- 底部信息 -->
    <footer class="blog-footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-left">
            <p>&copy; {{ new Date().getFullYear() }} 我的博客 | All Rights Reserved</p>
          </div>
          <div class="footer-right">
            <p>
              <a href="#">关于我</a> | 
              <a href="#">联系方式</a> | 
              <a href="#">备案信息</a>
            </p>
          </div>
        </div>
      </div>
    </footer>

    <!-- 回到顶部按钮 -->
    <el-backtop :right="30" :bottom="30" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Key } from '@element-plus/icons-vue'
import { getRecentPosts, getBlogStats } from '../api/blog'
import { getCategoryList } from '../api/category'
import { useAppStore } from '../stores/app'

const router = useRouter()
const appStore = useAppStore()

// 搜索
const searchQuery = ref('')
const handleSearch = () => {
  if (!searchQuery.value.trim()) return
  router.push({
    path: '/blog',
    query: { keyword: searchQuery.value.trim() }
  })
  searchQuery.value = ''
}

// 博主信息
const authorInfo = ref({
  name: '博主名称',
  avatar: 'https://placeholder.pics/svg/150',
  description: '全栈开发工程师，热爱技术和分享。'
})

// 博客统计信息
const stats = ref({
  postCount: 0,
  categoryCount: 0,
  tagCount: 0,
  totalViews: 0
})

// 最新文章
const recentPosts = ref([])

// 分类列表
const categories = ref([])

// 标签列表（模拟数据）
const tags = ref([
  { id: 1, name: 'JavaScript', count: 15 },
  { id: 2, name: 'Vue.js', count: 10 },
  { id: 3, name: 'CSS', count: 8 },
  { id: 4, name: 'HTML', count: 12 },
  { id: 5, name: 'Node.js', count: 5 },
  { id: 6, name: 'React', count: 3 },
  { id: 7, name: 'TypeScript', count: 7 },
  { id: 8, name: '后端', count: 4 },
  { id: 9, name: '前端', count: 20 },
  { id: 10, name: '数据库', count: 2 }
])

// 根据文章数量计算标签大小
const getTagSize = (count) => {
  const baseSize = 12
  const maxSize = 20
  const minCount = 1
  const maxCount = Math.max(...tags.value.map(tag => tag.count))
  
  if (maxCount === minCount) return `${baseSize}px`
  
  const size = baseSize + ((count - minCount) / (maxCount - minCount)) * (maxSize - baseSize)
  return `${size}px`
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 获取数据
const fetchData = async () => {
  try {
    appStore.startLoading('加载博客数据...')
    
    // 获取博客统计信息
    const statsData = await getBlogStats()
    stats.value = statsData
    
    // 获取最新文章
    const recentPostsData = await getRecentPosts(5)
    recentPosts.value = recentPostsData
    
    // 获取分类列表
    const categoriesData = await getCategoryList()
    categories.value = categoriesData.map(category => ({
      ...category,
      count: Math.floor(Math.random() * 20) // 模拟文章数量，实际应从API获取
    }))
    
    appStore.endLoading()
  } catch (error) {
    console.error('获取博客数据失败:', error)
    appStore.setLoadingError('获取博客数据失败，请刷新重试')
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.blog-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f5f5;
  color: #333;
}

.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 15px;
}

// 头部样式
.blog-header {
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 15px 0;
  position: sticky;
  top: 0;
  z-index: 100;
  
  .container {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .blog-logo {
    h1 {
      font-size: 1.8rem;
      margin: 0;
      color: var(--el-color-primary);
    }
    
    a {
      text-decoration: none;
      color: inherit;
    }
  }
  
  .blog-nav {
    .nav-menu {
      display: flex;
      gap: 20px;
      
      .nav-item {
        display: flex;
        align-items: center;
        gap: 5px;
        text-decoration: none;
        color: #333;
        font-weight: 500;
        padding: 5px 10px;
        position: relative;
        transition: color 0.3s;
        
        .el-icon {
          font-size: 1.1rem;
        }
        
        &:hover {
          color: var(--el-color-primary);
        }
        
        &.active {
          color: var(--el-color-primary);
          
          &::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            width: 100%;
            height: 2px;
            background-color: var(--el-color-primary);
          }
        }
      }
    }
  }
  
  .blog-search {
    width: 200px;
    margin-right: 15px;
  }
  
  .login-btn {
    .login-link {
      text-decoration: none;
    }
    
    .el-button {
      display: flex;
      align-items: center;
      gap: 5px;
    }
  }
}

// 主内容区样式
.blog-main {
  flex: 1;
  padding: 30px 0;
  
  .content-wrapper {
    display: flex;
    gap: 30px;
  }
  
  .main-content {
    flex: 1;
    min-width: 0;
  }
  
  .blog-sidebar {
    width: 300px;
    flex-shrink: 0;
  }
}

// 侧边栏样式
.sidebar-widget {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  overflow: hidden;
  
  .widget-title {
    font-size: 1.2rem;
    font-weight: 600;
    margin: 0;
    padding: 15px;
    border-bottom: 1px solid #eee;
    color: #333;
  }
  
  .widget-content {
    padding: 15px;
  }
  
  &.author-info {
    text-align: center;
    
    .author-avatar {
      margin-bottom: 10px;
      
      img {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        object-fit: cover;
      }
    }
    
    .author-name {
      font-size: 1.1rem;
      margin: 5px 0;
    }
    
    .author-description {
      color: #666;
      font-size: 0.9rem;
      margin-bottom: 10px;
    }
    
    .social-links {
      display: flex;
      justify-content: center;
      gap: 10px;
      
      a {
        color: #666;
        text-decoration: none;
        transition: color 0.3s;
        
        &:hover {
          color: var(--el-color-primary);
        }
      }
    }
  }
  
  &.blog-stats {
    ul {
      margin: 0;
      padding: 0;
      list-style: none;
      
      li {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
        color: #666;
        
        .el-icon {
          margin-right: 8px;
          color: var(--el-color-primary);
        }
      }
    }
  }
  
  &.recent-posts {
    ul {
      margin: 0;
      padding: 0;
      list-style: none;
      
      li {
        margin-bottom: 12px;
        padding-bottom: 12px;
        border-bottom: 1px dashed #eee;
        
        &:last-child {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }
        
        a {
          display: block;
          color: #333;
          text-decoration: none;
          font-weight: 500;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          
          &:hover {
            color: var(--el-color-primary);
          }
        }
        
        .post-date {
          display: block;
          font-size: 0.8rem;
          color: #999;
        }
      }
    }
  }
  
  &.categories {
    ul {
      margin: 0;
      padding: 0;
      list-style: none;
      
      li {
        margin-bottom: 8px;
        
        a {
          display: flex;
          justify-content: space-between;
          color: #333;
          text-decoration: none;
          padding: 5px 0;
          transition: color 0.3s;
          
          &:hover {
            color: var(--el-color-primary);
          }
          
          .category-count {
            color: #999;
            font-size: 0.9rem;
          }
        }
      }
    }
  }
  
  &.tag-cloud {
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      
      .tag {
        display: inline-block;
        color: #666;
        text-decoration: none;
        background-color: #f0f2f5;
        padding: 4px 10px;
        border-radius: 3px;
        transition: all 0.3s;
        
        &:hover {
          color: #fff;
          background-color: var(--el-color-primary);
        }
      }
    }
  }
}

// 底部样式
.blog-footer {
  background-color: #fff;
  border-top: 1px solid #eee;
  padding: 20px 0;
  margin-top: 30px;
  
  .footer-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    p {
      margin: 0;
      color: #666;
      font-size: 0.9rem;
    }
    
    a {
      color: #666;
      text-decoration: none;
      transition: color 0.3s;
      
      &:hover {
        color: var(--el-color-primary);
      }
    }
  }
}

// 动画效果
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// 响应式调整
@media (max-width: 992px) {
  .blog-main .content-wrapper {
    flex-direction: column;
  }
  
  .blog-sidebar {
    width: 100% !important;
  }
}

@media (max-width: 768px) {
  .blog-header {
    padding: 10px 0;
    
    .container {
      flex-direction: column;
      gap: 15px;
      align-items: center;
    }
    
    .blog-logo {
      margin-bottom: 5px;
      
      h1 {
        font-size: 1.5rem;
      }
    }
  }
  
  .blog-header .container > div {
    margin-bottom: 10px;
  }
  
  .blog-nav {
    width: 100%;
    
    .nav-menu {
      flex-wrap: wrap;
      justify-content: center;
      gap: 15px;
      
      .nav-item {
        padding: 8px 15px;
        background-color: #f5f7fa;
        border-radius: 20px;
        
        &.active {
          background-color: var(--el-color-primary-light-9);
          
          &::after {
            display: none;
          }
        }
      }
    }
  }
  
  .blog-search {
    width: 100% !important;
    margin-right: 0;
  }
  
  .login-btn {
    align-self: center;
    margin-top: 5px;
  }
  
  .blog-main {
    padding: 15px 0;
  }
  
  .footer-content {
    flex-direction: column;
    text-align: center;
    gap: 10px;
  }
}

@media (max-width: 576px) {
  .blog-nav .nav-menu {
    gap: 10px;
    
    .nav-item {
      padding: 6px 12px;
      font-size: 0.9rem;
    }
  }
  
  .blog-main {
    padding: 10px 0;
  }
  
  .container {
    padding: 0 10px;
  }
}
</style> 