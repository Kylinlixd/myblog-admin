<template>
  <div class="blog-layout">
    <!-- 顶部导航 -->
    <header class="blog-header">
      <div class="container">
        <div class="blog-logo">
          <router-link to="/blog">
            <h1>X - LiXD's Blog</h1>
          </router-link>
        </div>
        <nav class="blog-nav">
          <div class="nav-menu">
            <router-link 
              to="/blog" 
              class="nav-item" 
              :class="{ 'active': $route.path === '/blog' }"
              v-slot="{ isActive }"
            >
              <div class="nav-content">
                <span>首页</span>
                <div class="nav-border" :class="{ 'nav-border-active': isActive }"></div>
              </div>
            </router-link>
            
            <!-- 动态菜单 - 改为直接链接 -->
            <router-link 
              to="/blog/blogdynamic" 
              class="nav-item" 
              :class="{ 'active': $route.path === '/blog/blogdynamic' }"
              v-slot="{ isActive }"
            >
              <div class="nav-content">
                <span>动态</span>
                <div class="nav-border" :class="{ 'nav-border-active': isActive }"></div>
              </div>
            </router-link>
            
            <!-- 归类菜单 -->
            <router-link 
              to="/blog/categories" 
              class="nav-item" 
              :class="{ 'active': $route.path.includes('/blog/categories') }"
              v-slot="{ isActive }"
            >
              <div class="nav-content">
                <span>归类</span>
                <div class="nav-border" :class="{ 'nav-border-active': isActive }"></div>
              </div>
            </router-link>
            
            <!-- 关于菜单 -->
            <router-link 
              to="/blog/about" 
              class="nav-item" 
              :class="{ 'active': $route.path === '/blog/about' }"
              v-slot="{ isActive }"
            >
              <div class="nav-content">
                <span>关于</span>
                <div class="nav-border" :class="{ 'nav-border-active': isActive }"></div>
              </div>
            </router-link>
          </div>
        </nav>
        <div class="blog-search">
          <el-input
            v-model="searchQuery"
            placeholder="搜索动态..."
            :prefix-icon="Search"
            @keyup.enter="handleSearch"
            clearable
          />
        </div>
        <!-- 登录按钮 -->
        <div class="login-btn">
          <router-link to="/login" class="login-link">
            <InteractiveHoverButton></InteractiveHoverButton>
          </router-link>
        </div>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="blog-main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" :key="$route.fullPath" />
        </transition>
      </router-view>
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
.blog-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f5f5;
  color: #333;
}

.container {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  padding: 0;
}

// 头部样式
.blog-header {
  background-color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 15px 0;
  position: sticky;
  top: 0;
  z-index: 100;
  
  .container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    flex-wrap: nowrap;
  }
  
  .blog-logo {
    flex-shrink: 0;
    h1 {
      font-size: 1.5rem;
      margin: 0;
      background: linear-gradient(90deg, #38bdf8, #818cf8, #c084fc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-left: 20px;
    }
    
    a {
      text-decoration: none;
      color: inherit;
    }
  }
  
  .blog-search {
    flex-shrink: 0;
    width: 200px;
    margin-right: 15px;
    
    .el-input__inner {
      border-radius: 20px;
      transition: all 0.3s ease;
      
      &:focus {
        box-shadow: 0 0 0 2px rgba(192, 132, 252, 0.2);
      }
    }
  }
  
  .login-btn {
    flex-shrink: 0;
    .login-link {
      text-decoration: none;
    }
  }
}

// 主内容区样式
.blog-main {
  flex: 1;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  
  > div {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
}

// 底部样式
.blog-footer {
  background-color: #fff;
  border-top: 1px solid #eee;
  padding: 20px 0;
  margin-top: 0;
  
  .footer-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
    
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
        color: #c084fc;
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
  .blog-header .container {
    padding: 0 10px;
    
    .blog-logo h1 {
      font-size: 1.3rem;
    }
    
    .blog-nav .nav-menu {
      gap: 15px;
    }
  }
}

@media (max-width: 768px) {
  .blog-header {
    .container {
      flex-direction: row;
      flex-wrap: wrap;
      justify-content: space-between;
      
      .blog-logo {
        margin-bottom: 0;
        h1 {
          font-size: 1.2rem;
        }
      }
      
      .blog-nav {
        order: 3;
        width: 100%;
        margin: 10px 0;
      }
      
      .blog-search {
        order: 4;
        width: 100%;
      }
      
      .login-btn {
        order: 2;
        margin: 0;
      }
    }
  }
}

// 添加动态菜单样式
.dynamic-menu {
  position: relative;
  cursor: pointer;
  
  .nav-content {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .menu-arrow {
    font-size: 10px;
    color: #666;
    transition: transform 0.3s ease;
    margin-left: 2px;
    margin-top: 2px;
  }
  
  .menu-arrow-open {
    transform: rotate(180deg);
  }
  
  .dynamic-submenu {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    min-width: 180px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
    padding: 8px 0;
    z-index: 101;
    margin-top: 10px;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    
    &[style*="display: block"] {
      opacity: 1;
      visibility: visible;
    }
    
    .submenu-item {
      padding: 8px 16px;
      transition: all 0.2s ease;
      
      &:hover {
        background-color: #f5f5f5;
      }
      
      .submenu-link {
        color: #333;
        text-decoration: none;
        display: block;
        white-space: nowrap;
        
        &:hover {
          color: #c084fc;
        }
      }
    }
    
    &::before {
      content: "";
      position: absolute;
      top: -6px;
      left: 50%;
      transform: translateX(-50%);
      width: 12px;
      height: 12px;
      background-color: #fff;
      border-radius: 2px;
      transform: translateX(-50%) rotate(45deg);
      box-shadow: -2px -2px 5px rgba(0, 0, 0, 0.04);
    }
  }
  
  &:hover .nav-content span {
    color: #c084fc;
  }
}

.blog-nav {
  display: flex;
  justify-content: center;
  
  .nav-menu {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 30px;
    
    .nav-item {
      position: relative;
      text-decoration: none;
      color: #333;
      font-weight: 500;
      padding: 8px 12px;
      transition: all 0.3s ease;
      overflow: hidden;
      white-space: nowrap;
      
      .nav-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
      }
      
      span {
        position: relative;
        z-index: 2;
        transition: transform 0.3s ease, color 0.3s ease;
      }
      
      .nav-border {
        position: absolute;
        bottom: -2px;
        left: 0;
        width: 100%;
        height: 2px;
        background: linear-gradient(90deg, #38bdf8, #818cf8, #c084fc);
        transform: scaleX(0);
        transform-origin: right;
        transition: transform 0.3s ease;
      }
      
      &:hover {
        span {
          color: #c084fc;
          transform: translateY(-2px);
        }
        
        .nav-border {
          transform: scaleX(0.8);
          transform-origin: left;
        }
      }
      
      &.active {
        span {
          color: #c084fc;
          font-weight: 600;
        }
        
        .nav-border-active {
          transform: scaleX(1);
          transform-origin: left;
        }
      }
    }
    
    .dynamic-menu {
      display: inline-flex;
    }
  }
}
</style>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { getRecentDynamics } from '../api/blog'
import { useAppStore } from '../stores/app'
import InteractiveHoverButton from '../components/InspiraUI/InteractiveHoverButton.vue'

const router = useRouter()
const appStore = useAppStore()

// 动态菜单状态
const showDynamicMenu = ref(false)
const dynamicMenuItems = ref([])

// 切换动态菜单显示状态
const toggleDynamicMenu = () => {
  showDynamicMenu.value = !showDynamicMenu.value
}

// 点击其他区域关闭菜单
const closeMenuOnOutsideClick = (event) => {
  const menu = document.querySelector('.dynamic-menu')
  if (menu && !menu.contains(event.target)) {
    showDynamicMenu.value = false
  }
}

// 获取动态菜单数据
const fetchDynamicMenuItems = async () => {
  try {
    // 模拟从API获取数据
    // 实际项目中应该替换为真实的API调用
    const data = [
      { title: '最新动态', path: '/blog/latest' },
      { title: '热门文章', path: '/blog/hot' },
      { title: '技术分享', path: '/blog/tech' },
      { title: '生活随笔', path: '/blog/life' }
    ]
    
    dynamicMenuItems.value = data
  } catch (error) {
    console.error('获取动态菜单数据失败:', error)
  }
}

// 监听路由变化关闭菜单
watch(() => router.currentRoute.value, () => {
  showDynamicMenu.value = false
})

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

// 最新动态
const recentDynamics = ref([])

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
    
    console.log('准备加载博客前台最新动态...')
    // 获取最新动态
    const response = await getRecentDynamics({
      limit: 5
    })
    console.log('博客前台最新动态API响应:', response)
    
    if (response.code === 200) { recentDynamics.value = response.data }
    
    appStore.endLoading()
  } catch (error) {
    console.error('获取博客数据失败:', error)
    appStore.setLoadingError('获取博客数据失败，请刷新重试')
  }
}

onMounted(() => {
  fetchData()
  fetchDynamicMenuItems()
  document.addEventListener('click', closeMenuOnOutsideClick)
})

// 组件销毁时移除事件监听
onBeforeUnmount(() => {
  document.removeEventListener('click', closeMenuOnOutsideClick)
})
</script>