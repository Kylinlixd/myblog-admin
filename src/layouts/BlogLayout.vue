<template>
  <div class="blog-layout">
    <!-- 顶部导航 -->
    <header class="blog-header">
      <div class="container">
        <div class="blog-logo">
          <router-link to="/blog">
            <h1>X</h1>
          </router-link>
        </div>
        <nav class="blog-nav">
          <div class="nav-menu">
            <!-- 添加v-bind:class来动态设置激活状态 -->
            <router-link 
              to="/blog" 
              class="nav-item" 
              :class="{ 'active': $route.path === '/blog' }"
            >
              <!-- <el-icon><i-ep-house /></el-icon> -->
              <span>首页</span>
            </router-link>
            <!-- 移除其他导航项 -->
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
            <!-- <el-button type="primary" size="small">
              <el-icon><i-ep-key /></el-icon> -->             
            <InteractiveHoverButton></InteractiveHoverButton>
            <!-- </el-button> -->
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

<style lang="scss" scoped>
.blog-nav {
  display: flex;
  justify-content: center; // 使导航标签整体居中
  .nav-menu {
    display: flex;
    justify-content: center; // 确保菜单项整体居中
    gap: 20px;
    .nav-item {
      display: flex;
      align-items: center;
      justify-content: center; // 新增：让内部元素水平居中
      gap: 5px;
      text-decoration: none;
      color: #333;
      font-weight: 500;
      padding: 5px 10px;
      position: relative;
      transition: all 0.3s ease;
      border-radius: 5px; 
      background-color: transparent; 
      box-shadow: none; 

      .el-icon {
        font-size: 1.1rem;
      }

      &:hover {
        transform: scale(1.1);
        background-color: #fff; 
        box-shadow: 0 0 5px rgba(0, 0, 0, 0.2); 
      }

      &.active {
        background-color: #fff; 
        box-shadow: 0 0 5px rgba(0, 0, 0, 0.2); 
      }
    }
  }
}
</style>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { getRecentPosts } from '../api/blog'
import { useAppStore } from '../stores/app'
import InteractiveHoverButton from '../components/InspiraUI/InteractiveHoverButton.vue'

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

// 最新文章
const recentPosts = ref([])

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
    
    // 获取最新文章
    const recentPostsData = await getRecentPosts(5)
    recentPosts.value = recentPostsData
    
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
  max-width: 100%; // 修改为 100% 以确保容器能铺满屏幕
  margin: 0 auto;
  padding: 0; // 移除不必要的内边距
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
      margin-left: 20px;;
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
      margin-right: 60px;
    }
  }
}

// 主内容区样式
.blog-main {
  flex: 1;
  padding: 0px 0;
  
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



// 底部样式
.blog-footer {
  background-color: #fff;
  border-top: 1px solid #eee;
  padding: 20px 0;
  margin-top: 0px;
  
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