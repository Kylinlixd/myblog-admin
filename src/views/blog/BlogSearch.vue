<template>
  <div class="blog-search-container">
    <div class="search-section">
      <!-- 搜索框 -->
      <div class="search-box">
        <div class="search-input-wrapper">
          <a-input-search
            v-model:value="keyword"
            placeholder="搜索文章、标签或关键词..."
            enter-button
            size="large"
            :loading="loading"
            @search="handleSearch"
            @press-enter="handleSearch"
            class="search-input"
          >
            <template #prefix>
              <search-outlined class="search-icon" />
            </template>
          </a-input-search>
        </div>
        
        <!-- 高级搜索选项 -->
        <div class="search-options">
          <a-button type="link" @click="toggleAdvancedSearch">
            {{ showAdvancedSearch ? '收起' : '高级搜索' }}
            <template #icon>
              <component :is="showAdvancedSearch ? 'up-outlined' : 'down-outlined'" />
            </template>
          </a-button>
        </div>
      </div>
      
      <!-- 高级搜索选项 -->
      <div v-show="showAdvancedSearch" class="advanced-search-options">
        <a-form layout="inline" :model="advancedOptions">
          <!-- 内容类型筛选 -->
          <a-form-item label="内容类型">
            <a-radio-group v-model:value="advancedOptions.type" @change="handleSearch">
              <a-radio value="">全部</a-radio>
              <a-radio value="note">笔记</a-radio>
              <a-radio value="share">分享</a-radio>
            </a-radio-group>
          </a-form-item>
          
          <!-- 分类筛选 -->
          <a-form-item label="分类">
            <a-select
              v-model:value="advancedOptions.category"
              placeholder="选择分类"
              style="width: 200px"
              allowClear
              @change="handleSearch"
            >
              <a-select-option
                v-for="category in categories" 
                :key="category.id" 
                :value="category.id"
              >
                {{ category.name }}
              </a-select-option>
            </a-select>
          </a-form-item>
          
          <!-- 标签筛选 -->
          <a-form-item label="标签">
            <a-select
              v-model:value="advancedOptions.tag"
              placeholder="选择标签"
              allowClear
              @change="handleSearch"
              style="width: 200px"
            >
              <a-select-option
                v-for="tag in tags" 
                :key="tag.id" 
                :value="tag.id"
              >
                {{ tag.name }}
              </a-select-option>
            </a-select>
          </a-form-item>
          
          <!-- 时间筛选 -->
          <a-form-item label="发布时间">
            <a-select
              v-model:value="advancedOptions.time"
              placeholder="选择时间范围"
              allowClear
              @change="handleSearch"
              style="width: 200px"
            >
              <a-select-option value="week">最近一周</a-select-option>
              <a-select-option value="month">最近一月</a-select-option>
              <a-select-option value="quarter">最近三月</a-select-option>
              <a-select-option value="year">最近一年</a-select-option>
            </a-select>
          </a-form-item>
          
          <!-- 排序方式 -->
          <a-form-item label="排序方式">
            <a-select
              v-model:value="advancedOptions.sortBy"
              placeholder="排序方式"
              @change="handleSearch"
              style="width: 200px"
            >
              <a-select-option value="time_desc">最新发布</a-select-option>
              <a-select-option value="time_asc">最早发布</a-select-option>
              <a-select-option value="likes_desc">最多点赞</a-select-option>
              <a-select-option value="comments_desc">最多评论</a-select-option>
              <a-select-option value="views_desc">最多浏览</a-select-option>
            </a-select>
          </a-form-item>
          
          <!-- 媒体类型筛选 -->
          <a-form-item>
            <a-checkbox v-model:checked="advancedOptions.hasMedia" @change="handleSearch">
              包含多媒体
            </a-checkbox>
          </a-form-item>
          
          <a-form-item>
            <a-button type="primary" @click="handleSearch">搜索</a-button>
            <a-button style="margin-left: 8px" @click="resetAdvancedOptions">重置</a-button>
          </a-form-item>
        </a-form>
      </div>
      
      <!-- 搜索历史 -->
      <div class="search-history" v-if="searchHistory.length > 0 && !searchPerformed">
        <div class="history-header">
          <h3>搜索历史</h3>
          <a-button type="link" @click="clearSearchHistory">清空</a-button>
        </div>
        <div class="history-items">
          <a-tag 
            v-for="(item, index) in searchHistory" 
            :key="index"
            :color="getRandomColor()"
            @click="useHistoryItem(item)"
            class="history-item"
            closable
            @close="removeHistoryItem(index)"
          >
            {{ item }}
          </a-tag>
        </div>
      </div>
      
      <!-- 热门搜索 -->
      <div class="popular-searches" v-if="popularSearches.length > 0 && !searchPerformed">
        <div class="popular-header">
          <h3>热门搜索</h3>
        </div>
        <div class="popular-items">
          <a-tag 
            v-for="(item, index) in popularSearches" 
            :key="index"
            color="blue"
            @click="useHistoryItem(item)"
            class="popular-item"
          >
            {{ item }}
          </a-tag>
        </div>
      </div>
      
      <!-- 显示模式切换 -->
      <div class="view-mode-toggle" v-if="searchPerformed && searchResults.length > 0">
        <a-radio-group v-model:value="viewMode" button-style="solid">
          <a-radio-button value="list">
            <unordered-list-outlined />
            列表
          </a-radio-button>
          <a-radio-button value="card">
            <appstore-outlined />
            卡片
          </a-radio-button>
        </a-radio-group>
      </div>
      
      <!-- 搜索建议 -->
      <div v-if="showSuggestions && suggestions.length > 0" class="search-suggestions">
        <ul class="suggestions-list">
          <li 
            v-for="(suggestion, index) in suggestions" 
            :key="index" 
            class="suggestion-item"
            @click="useSuggestion(suggestion)"
          >
            <search-outlined />
            <span v-html="highlightKeyword(suggestion.title)"></span>
          </li>
        </ul>
      </div>
    </div>
    
    <!-- 搜索结果 -->
    <div class="search-results" v-if="searched">
      <div v-if="loading" class="loading-state">
        <a-spin size="large" />
        <p>搜索中...</p>
      </div>
      
      <div v-else-if="!searchResults || searchResults.length === 0" class="no-results">
        <inbox-outlined />
        <p>未找到相关结果</p>
        <a-button type="primary" @click="resetSearch">重新搜索</a-button>
      </div>
      
      <div v-else class="results-content">
        <!-- 列表视图 -->
        <div v-if="viewMode === 'list'" class="list-view">
          <div v-for="(item, index) in searchResults" :key="item.id || index" class="result-item">
            <router-link :to="getItemLink(item)" class="result-link">
              <h3 class="result-title" v-html="highlightKeyword(item.title || item.name)"></h3>
            </router-link>
            <p v-if="item.excerpt" class="result-excerpt" v-html="highlightKeyword(item.excerpt)"></p>
            <div class="result-meta">
              <span class="result-type">{{ getItemType(item) }}</span>
              <span v-if="item.createdAt" class="result-date">{{ formatDate(item.createdAt) }}</span>
              <span v-if="item.views" class="result-views">{{ item.views }} 阅读</span>
              <span v-if="item.category" class="result-category">
                <folder-outlined /> {{ item.category.name }}
              </span>
              <span v-if="item.tags && item.tags.length" class="result-tags">
                <tag-outlined /> 
                <a-tag v-for="tag in item.tags" :key="tag.id" :color="getRandomColor()">
                  {{ tag.name }}
                </a-tag>
              </span>
            </div>
          </div>
        </div>
        
        <!-- 卡片视图 -->
        <div v-else class="card-view">
          <div v-for="(item, index) in searchResults" :key="item.id || index" class="result-card">
            <router-link :to="getItemLink(item)" class="card-link">
              <div class="card-image" v-if="item.cover">
                <img :src="item.cover" :alt="item.title || item.name">
              </div>
              <div class="card-content">
                <h3 class="card-title" v-html="highlightKeyword(item.title || item.name)"></h3>
                <p v-if="item.excerpt" class="card-excerpt" v-html="highlightKeyword(item.excerpt)"></p>
                <div class="card-meta">
                  <span class="card-type">{{ getItemType(item) }}</span>
                  <span v-if="item.createdAt" class="card-date">{{ formatDate(item.createdAt) }}</span>
                  <span v-if="item.views" class="card-views">{{ item.views }} 阅读</span>
                  <span v-if="item.category" class="card-category">
                    <folder-outlined /> {{ item.category.name }}
                  </span>
                  <span v-if="item.tags && item.tags.length" class="card-tags">
                    <tag-outlined /> 
                    <a-tag v-for="tag in item.tags" :key="tag.id" :color="getRandomColor()">
                      {{ tag.name }}
                    </a-tag>
                  </span>
                </div>
              </div>
            </router-link>
          </div>
        </div>
        
        <!-- 分页 -->
        <div class="pagination" v-if="total > 0">
          <a-pagination
            v-model:current="currentPage"
            :total="total"
            :pageSize="pageSize"
            show-quick-jumper
            show-size-changer
            :pageSizeOptions="['10', '20', '50', '100']"
            @change="handlePageChange"
            @showSizeChange="handleSizeChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  SearchOutlined, 
  CloseCircleOutlined, 
  EyeOutlined, 
  LikeOutlined, 
  CommentOutlined, 
  CloseOutlined, 
  UnorderedListOutlined, 
  AppstoreOutlined, 
  ShareAltOutlined, 
  BookOutlined, 
  WarningOutlined, 
  DownOutlined, 
  UpOutlined,
  InboxOutlined,
  FolderOutlined,
  TagOutlined
} from '@ant-design/icons-vue'
import { message, Empty } from 'ant-design-vue'
import { getBlogDynamics, getBlogCategoryList, getBlogTagList, searchBlog } from '@/api/blog'

const route = useRoute()
const router = useRouter()

// 搜索相关
const keyword = ref('')
const loading = ref(false)
const searched = ref(false)
const searchPerformed = ref(false)
const searchResults = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 高级搜索
const showAdvancedSearch = ref(false)
const advancedOptions = ref({
  type: '',
  category: undefined,
  tag: undefined,
  time: undefined,
  sortBy: 'time_desc',
  hasMedia: false
})

// 视图模式
const viewMode = ref('list')

// 分类和标签
const categories = ref([])
const tags = ref([])

// 搜索历史
const searchHistory = ref([])

// 热门搜索
const popularSearches = ref([
  'Vue3',
  'React',
  'TypeScript',
  'Node.js',
  'Python'
])

// 搜索建议
const showSuggestions = ref(false)
const suggestions = ref([])

// 计算过滤后的结果
const filteredResults = computed(() => {
  return searchResults.value
})

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 重置搜索
const resetSearch = () => {
  keyword.value = ''
  searchResults.value = []
  total.value = 0
  currentPage.value = 1
  searched.value = false
  searchPerformed.value = false
  showSuggestions.value = false
  suggestions.value = []
}

// 处理分页变化
const handlePageChange = (page) => {
  currentPage.value = page
  handleSearch()
}

// 处理每页数量变化
const handleSizeChange = (current, size) => {
  pageSize.value = size
  currentPage.value = 1
  handleSearch()
}

// 使用搜索建议
const useSuggestion = (suggestion) => {
  keyword.value = suggestion.title
  handleSearch()
}

// 处理来自布局搜索框的搜索请求
const handleUpdateSearch = (event) => {
  // 更新搜索参数
  keyword.value = event.detail.keyword
  advancedOptions.value.type = event.detail.type || ''
  advancedOptions.value.includeTags = event.detail.includeTags || true
  advancedOptions.value.includeCategories = event.detail.includeCategories || true
  advancedOptions.value.sortBy = event.detail.sortBy || 'relevance'
  
  // 执行搜索
  handleSearch()
}

// 处理搜索
const handleSearch = async () => {
  if (!keyword.value.trim()) {
    message.warning('请输入搜索关键词')
    return
  }
  
  loading.value = true
  searched.value = true
  searchPerformed.value = true
  
  try {
    const params = {
      keyword: keyword.value.trim(),
      page: currentPage.value,
      pageSize: pageSize.value,
      ...advancedOptions.value
    }
    
    console.log('[Search] 发送搜索请求, 参数:', params)
    const res = await searchBlog(params)
    console.log('[Search] 收到搜索响应:', res)
    
    // 检查响应格式
    if (res && res.code === 200 && res.data) {
      console.log('[Search] 处理搜索结果:', res.data)
      searchResults.value = res.data.list || []
      total.value = res.data.total || 0
      currentPage.value = res.data.page || 1
      pageSize.value = res.data.pageSize || 10
      
      // 如果没有搜索结果，显示提示
      if (searchResults.value.length === 0) {
        message.info('未找到相关结果，请尝试其他关键词')
      }
      
      console.log('[Search] 更新后的状态:', {
        results: searchResults.value,
        total: total.value,
        page: currentPage.value,
        pageSize: pageSize.value
      })
    } else {
      console.error('[Search] 搜索结果格式错误:', res)
      searchResults.value = []
      total.value = 0
      message.info('未找到相关结果，请尝试其他关键词')
    }
    
    // 保存搜索历史
    saveSearchHistory(keyword.value.trim())
    
  } catch (error) {
    console.error('[Search] 搜索失败:', error)
    // 如果是网络错误，显示网络错误提示
    if (error.message === '网络连接失败') {
      message.error('网络连接失败，请检查网络设置')
    } else {
      message.info('未找到相关结果，请尝试其他关键词')
    }
    searchResults.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 监听路由参数变化
watch(() => route.query, (newQuery) => {
  if (newQuery.keyword && newQuery.keyword !== keyword.value) {
    keyword.value = newQuery.keyword
    handleSearch()
  }
}, { immediate: true })

// 初始化数据
onMounted(async () => {
  // 从路由参数获取搜索关键词
  if (route.query.keyword) {
    keyword.value = route.query.keyword
    await handleSearch()
  }
  
  // 加载分类和标签
  try {
    const [categoryRes, tagRes] = await Promise.all([
      getBlogCategoryList(),
      getBlogTagList()
    ])
    
    // 检查响应格式并设置默认值
    categories.value = categoryRes?.data?.list || []
    tags.value = tagRes?.data?.list || []
    
    console.log('[Search] 加载分类和标签成功:', {
      categories: categories.value,
      tags: tags.value
    })
  } catch (error) {
    console.error('[Search] 加载分类和标签失败:', error)
    // 设置默认值，避免UI错误
    categories.value = []
    tags.value = []
  }
  
  // 加载搜索历史
  loadSearchHistory()
  
  // 添加事件监听器，响应顶部搜索框的请求
  window.addEventListener('update-search', handleUpdateSearch)
})

// 组件卸载前移除事件监听器
onBeforeUnmount(() => {
  window.removeEventListener('update-search', handleUpdateSearch)
})

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

// 使用历史记录项
const useHistoryItem = (item) => {
  keyword.value = item
  handleSearch()
}

// 移除历史记录项
const removeHistoryItem = (index) => {
  searchHistory.value.splice(index, 1)
  localStorage.setItem('search_history', JSON.stringify(searchHistory.value))
}

// 清空搜索历史
const clearSearchHistory = () => {
  searchHistory.value = []
  localStorage.removeItem('search_history')
}

// 切换高级搜索
const toggleAdvancedSearch = () => {
  showAdvancedSearch.value = !showAdvancedSearch.value
}

// 重置高级搜索选项
const resetAdvancedOptions = () => {
  advancedOptions.value = {
    type: '',
    category: undefined,
    tag: undefined,
    time: undefined,
    sortBy: 'time_desc',
    hasMedia: false
  }
  handleSearch()
}

// 获取随机颜色
const getRandomColor = () => {
  const colors = ['blue', 'green', 'red', 'orange', 'purple', 'cyan']
  return colors[Math.floor(Math.random() * colors.length)]
}

// 高亮关键词
const highlightKeyword = (text) => {
  if (!keyword.value) return text
  const regex = new RegExp(keyword.value, 'gi')
  return text.replace(regex, match => `<span class="highlight">${match}</span>`)
}

// 获取项目链接
const getItemLink = (item) => {
  if (item.type === 'dynamic') {
    return `/blog/dynamics/${item.id}`
  } else if (item.type === 'category') {
    return `/blog/categories/${item.id}`
  } else if (item.type === 'tag') {
    return `/blog/tags/${item.id}`
  }
  return '#'
}

// 获取项目类型
const getItemType = (item) => {
  switch (item.type) {
    case 'dynamic':
      return '动态'
    case 'category':
      return '分类'
    case 'tag':
      return '标签'
    default:
      return '未知'
  }
}
</script>

<style scoped>
.blog-search-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.search-section {
  margin-bottom: 2rem;
}

.search-box {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
  position: relative;
}

.search-input-wrapper {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
}

.search-input {
  width: 100%;
}

.search-input :deep(.ant-input-affix-wrapper) {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 48px;
  border: 1px solid #e8e8e8;
  transition: all 0.3s ease;
}

.search-input :deep(.ant-input-affix-wrapper:hover) {
  border-color: #40a9ff;
  box-shadow: 0 2px 12px rgba(24, 144, 255, 0.1);
}

.search-input :deep(.ant-input-affix-wrapper-focused) {
  border-color: #40a9ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.search-input :deep(.ant-input) {
  font-size: 1.1rem;
  padding: 8px 12px;
  height: 100%;
}

.search-input :deep(.ant-input-prefix) {
  margin-right: 8px;
  color: #bfbfbf;
  font-size: 18px;
  display: flex;
  align-items: center;
}

.search-input :deep(.ant-input-suffix) {
  margin-left: 8px;
}

.search-input :deep(.ant-btn) {
  height: 48px;
  border-radius: 0 8px 8px 0;
  padding: 0 24px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1890ff;
  border-color: #1890ff;
}

.search-input :deep(.ant-btn:hover) {
  background: #40a9ff;
  border-color: #40a9ff;
}

.search-input :deep(.ant-btn-primary) {
  background: #1890ff;
  border-color: #1890ff;
}

.search-input :deep(.ant-btn-primary:hover) {
  background: #40a9ff;
  border-color: #40a9ff;
}

.search-input :deep(.ant-input-search-button) {
  height: 48px;
  border-radius: 0 8px 8px 0;
  padding: 0 24px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1890ff;
  border-color: #1890ff;
}

.search-input :deep(.ant-input-search-button:hover) {
  background: #40a9ff;
  border-color: #40a9ff;
}

.search-options {
  text-align: center;
  margin-top: 8px;
}

.search-options :deep(.ant-btn-link) {
  color: #666;
  font-size: 14px;
  padding: 4px 8px;
}

.search-options :deep(.ant-btn-link:hover) {
  color: #1890ff;
}

.advanced-search-options {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  margin-top: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.advanced-search-options :deep(.ant-form) {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.advanced-search-options :deep(.ant-form-item) {
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.advanced-search-options :deep(.ant-form-item-label) {
  text-align: left;
  padding-bottom: 4px;
}

.advanced-search-options :deep(.ant-form-item-label > label) {
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

.advanced-search-options :deep(.ant-select),
.advanced-search-options :deep(.ant-radio-group) {
  width: 100%;
}

.advanced-search-options :deep(.ant-radio-group) {
  display: flex;
  gap: 1rem;
}

.advanced-search-options :deep(.ant-checkbox-wrapper) {
  margin-top: 8px;
}

.advanced-search-options :deep(.ant-form-item:last-child) {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e8e8e8;
}

.advanced-search-options :deep(.ant-form-item:last-child .ant-btn) {
  min-width: 120px;
  height: 40px;
}

.search-history,
.popular-searches {
  margin-top: 2rem;
}

.history-header,
.popular-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.history-header h3,
.popular-header h3 {
  font-size: 1.2rem;
  color: #333;
  margin: 0;
}

.history-items,
.popular-items {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.history-item,
.popular-item {
  cursor: pointer;
  transition: all 0.3s ease;
}

.history-item:hover,
.popular-item:hover {
  transform: translateY(-2px);
}

.view-mode-toggle {
  margin: 1.5rem 0;
  text-align: center;
}

.search-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  margin-top: 0.5rem;
}

.suggestions-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.suggestion-item {
  padding: 0.8rem 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.3s ease;
}

.suggestion-item:hover {
  background-color: #f5f5f5;
}

.search-results {
  margin-top: 2rem;
}

.loading-state,
.no-results {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.results-content {
  margin-top: 2rem;
}

/* 列表视图样式 */
.list-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.result-item {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.result-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.result-link {
  text-decoration: none;
  color: inherit;
}

.result-title {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1a1a1a;
}

.result-excerpt {
  color: #666;
  margin-bottom: 1rem;
  line-height: 1.6;
}

.result-meta {
  display: flex;
  gap: 1rem;
  color: #888;
  font-size: 0.9rem;
}

/* 卡片视图样式 */
.card-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.result-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.result-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-link {
  text-decoration: none;
  color: inherit;
  display: block;
}

.card-image {
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.result-card:hover .card-image img {
  transform: scale(1.05);
}

.card-content {
  padding: 1.5rem;
}

.card-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1a1a1a;
}

.card-excerpt {
  color: #666;
  margin-bottom: 1rem;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  display: flex;
  gap: 1rem;
  color: #888;
  font-size: 0.9rem;
}

.pagination {
  margin-top: 2rem;
  text-align: center;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .blog-search-container {
    padding: 1rem;
  }

  .search-input {
    max-width: 100%;
  }

  .advanced-search-options {
    padding: 1rem;
  }

  .card-view {
    grid-template-columns: 1fr;
  }

  .result-item,
  .result-card {
    padding: 1rem;
  }

  .advanced-search-options :deep(.ant-form) {
    grid-template-columns: 1fr;
  }
  
  .advanced-search-options :deep(.ant-form-item:last-child) {
    flex-direction: column;
    align-items: stretch;
  }
  
  .advanced-search-options :deep(.ant-form-item:last-child .ant-btn) {
    width: 100%;
  }
}

.highlight {
  color: #1890ff;
  font-weight: bold;
}
</style>