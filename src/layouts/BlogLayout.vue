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
            
            <!-- 动态菜单 -->
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
        <!-- 搜索框 -->
        <div class="blog-search">
          <div class="search-box">
            <div class="search-input">
              <search-outlined class="search-icon" />
              <input 
                type="text" 
                v-model="searchQuery"
                placeholder="搜索动态、标签、分类或关键词..."
                @input="handleSearchInput"
                @keyup.enter="handleSearch"
              />
            </div>
            <a-button 
              type="primary" 
              class="search-button"
              :loading="searching"
              @click="handleSearch"
            >
              搜索
            </a-button>
          </div>
          
          <!-- 搜索建议 -->
          <div v-if="showSuggestions && (suggestions.length > 0 || searchHistory.length > 0)" class="search-suggestions">
            <!-- 搜索历史 -->
            <div v-if="searchHistory.length > 0" class="suggestion-section">
              <div class="suggestion-header">
                <span>历史搜索</span>
                <a-button type="link" size="small" @click="searchHistory = []">
                  <delete-outlined />
                </a-button>
              </div>
              <div class="suggestion-list">
                <div 
                  v-for="(item, index) in searchHistory" 
                  :key="`history-${index}`"
                  class="suggestion-item"
                  @click="useSuggestion({ title: item })"
                >
                  <clock-circle-outlined />
                  <span>{{ item }}</span>
                </div>
              </div>
            </div>
            
            <!-- 搜索结果 -->
            <div v-if="suggestions.length > 0" class="suggestion-section">
              <div class="suggestion-header">
                <span>搜索结果</span>
              </div>
              <div class="suggestion-list">
                <div 
                  v-for="(item, index) in suggestions" 
                  :key="`suggestion-${index}`"
                  class="suggestion-item"
                  @click="useSuggestion(item)"
                >
                  <component :is="item.icon" />
                  <span>{{ item.title }}</span>
                  <span class="suggestion-type">{{ item.type === 'dynamic' ? '动态' : item.type === 'category' ? '分类' : '标签' }}</span>
                </div>
              </div>
            </div>
          </div>
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
    <a-back-top :visibilityHeight="300" :style="{ right: '30px', bottom: '30px' }" />
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
    margin-right: 15px;
    position: relative;
    
    .search-box {
      display: flex;
      align-items: center;
      background: #f5f5f5;
      border-radius: 20px;
      padding: 4px;
      transition: all 0.3s ease;
      min-width: 300px;
      
      &:hover {
        background: #e8e8e8;
      }
      
      .search-input {
        display: flex;
        align-items: center;
        flex: 1;
        padding: 0 12px;
        
        .search-icon {
          color: #999;
          font-size: 16px;
          margin-right: 8px;
        }
        
        input {
          flex: 1;
          border: none;
          background: none;
          outline: none;
          font-size: 14px;
          color: #333;
          padding: 4px 0;
          
          &::placeholder {
            color: #999;
          }
        }
      }
      
      .search-button {
        border-radius: 16px;
        height: 32px;
        padding: 0 16px;
        font-size: 14px;
        background: #1890ff;
        border: none;
        
        &:hover {
          background: #40a9ff;
        }
      }
    }
    
    .search-suggestions {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      margin-top: 8px;
      z-index: 1000;
      
      .suggestion-section {
        padding: 8px 0;
        
        &:not(:last-child) {
          border-bottom: 1px solid #f0f0f0;
        }
      }
      
      .suggestion-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 16px;
        margin-bottom: 8px;
        
        span {
          color: #666;
          font-size: 12px;
        }
      }
      
      .suggestion-list {
        .suggestion-item {
          display: flex;
          align-items: center;
          padding: 8px 16px;
          cursor: pointer;
          transition: background-color 0.3s;
          
          &:hover {
            background-color: #f5f5f5;
          }
          
          .anticon {
            color: #999;
            margin-right: 8px;
            font-size: 14px;
          }
          
          span {
            color: #333;
            font-size: 14px;
            
            &.suggestion-type {
              margin-left: auto;
              color: #999;
              font-size: 12px;
              background: #f5f5f5;
              padding: 2px 6px;
              border-radius: 4px;
            }
          }
        }
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
import { SearchOutlined, TagOutlined, FolderOutlined, FireOutlined, DeleteOutlined, ClockCircleOutlined } from '@ant-design/icons-vue'
import { useAppStore } from '../stores/app'
import InteractiveHoverButton from '../components/InspiraUI/InteractiveHoverButton.vue'
import { message } from 'ant-design-vue'
import { getBlogDynamics, getBlogCategoryList, getBlogTagList, searchBlog } from '@/api/blog'

const router = useRouter()
const appStore = useAppStore()

// 搜索相关
const searchQuery = ref('')
const searching = ref(false)
const showSuggestions = ref(false)
const suggestions = ref([])
const searchHistory = ref([])

// 加载搜索历史
const loadSearchHistory = () => {
  try {
    const history = localStorage.getItem('search_history')
    if (history) {
      searchHistory.value = JSON.parse(history)
    }
  } catch (error) {
    console.error('加载搜索历史失败:', error)
    searchHistory.value = []
  }
}

// 保存搜索历史
const saveSearchHistory = (keyword) => {
  if (!keyword.trim()) return
  
  // 移除相同的关键词并添加到最前面
  searchHistory.value = searchHistory.value.filter(item => item !== keyword)
  searchHistory.value.unshift(keyword)
  
  // 限制历史记录数量
  if (searchHistory.value.length > 10) {
    searchHistory.value = searchHistory.value.slice(0, 10)
  }
  
  // 保存到localStorage
  try {
    localStorage.setItem('search_history', JSON.stringify(searchHistory.value))
  } catch (error) {
    console.error('保存搜索历史失败:', error)
  }
}

// 处理搜索输入
const handleSearchInput = async () => {
  if (!searchQuery.value.trim()) {
    showSuggestions.value = false
    suggestions.value = []
    return
  }

  showSuggestions.value = true
  const keyword = searchQuery.value.trim()
  
  try {
    // 使用搜索API获取建议
    const searchRes = await searchBlog({
      keyword,
      page: 1,
      pageSize: 5,
      searchType: 'all',
      includeTags: true,
      includeCategories: true,
      sortBy: 'relevance'
    })
    
    // 处理搜索结果
    if (searchRes.data && searchRes.data.list) {
      suggestions.value = searchRes.data.list.map(item => {
        let type = 'dynamic'
        let icon = FireOutlined
        let title = item.title
        
        if (item.type === 'tag') {
          type = 'tag'
          icon = TagOutlined
          title = item.name
        } else if (item.type === 'category') {
          type = 'category'
          icon = FolderOutlined
          title = item.name
        }
        
        return {
          type,
          title,
          id: item.id,
          icon,
          relevance: item.relevance || 0
        }
      })
      
      // 按相关度排序
      suggestions.value.sort((a, b) => b.relevance - a.relevance)
    } else {
      suggestions.value = []
    }
    
  } catch (error) {
    console.error('获取搜索建议失败:', error)
    suggestions.value = []
  }
}

// 使用搜索建议
const useSuggestion = (suggestion) => {
  searchQuery.value = suggestion.title
  handleSearch()
}

// 处理搜索
const handleSearch = () => {
  if (!searchQuery.value.trim()) {
    message.warning('请输入搜索关键词')
    return
  }
  
  searching.value = true
  saveSearchHistory(searchQuery.value.trim())
  
  // 如果已经在搜索页面，直接发送事件
  if (router.currentRoute.value.path === '/blog/search') {
    console.log('[布局] 已在搜索页面，发送搜索事件')
    
    // 发布一个事件，让搜索页面知道有新的搜索请求
    window.dispatchEvent(new CustomEvent('update-search', {
      detail: {
        keyword: searchQuery.value.trim(),
        type: 'all',
        includeTags: true,
        includeCategories: true,
        sortBy: 'relevance'
      }
    }))
  } else {
    // 否则跳转到搜索页面，带上搜索参数
    console.log('[布局] 跳转到搜索页面')
    
    router.push({
      path: '/blog/search',
      query: { 
        keyword: searchQuery.value.trim(),
        type: 'all', // 综合搜索
        includeTags: true,
        includeCategories: true,
        sortBy: 'relevance'
      }
    }).catch(err => {
      if (err.name !== 'NavigationDuplicated') {
        console.error('路由跳转错误:', err)
      }
    })
  }
  
  // 最终处理
  setTimeout(() => {
    searching.value = false
    showSuggestions.value = false
  })
}

// 点击外部关闭搜索建议
const closeSuggestions = (event) => {
  const searchContainer = document.querySelector('.blog-search')
  if (searchContainer && !searchContainer.contains(event.target)) {
    showSuggestions.value = false
  }
}

// 监听路由变化
watch(() => router.currentRoute.value, () => {
  showSuggestions.value = false
})

onMounted(() => {
  document.addEventListener('click', closeSuggestions)
  loadSearchHistory()
})

// 组件销毁时移除事件监听
onBeforeUnmount(() => {
  document.removeEventListener('click', closeSuggestions)
})
</script>