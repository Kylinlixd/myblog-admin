<template>
  <div class="blog-search-container">
    <div class="search-header">
      <div class="search-input-wrapper">
        <el-input
          v-model="searchKeyword"
          placeholder="输入关键词搜索博客内容"
          @keyup.enter="handleSearch"
          @focus="showSuggestions = true"
          @input="handleSearchInput"
        >
          <template #prefix>
            <el-icon><search /></el-icon>
          </template>
          <template #suffix>
            <el-icon v-if="searchKeyword" class="clear-icon" @click="clearSearchInput"><close-circle /></el-icon>
          </template>
        </el-input>
        
        <!-- 搜索建议 -->
        <div v-if="showSuggestions" class="search-suggestions">
          <!-- 热门搜索 -->
          <div v-if="!searchKeyword && hotSearchTerms.length > 0" class="suggestion-section">
            <div class="suggestion-header">
              <span>热门搜索</span>
            </div>
            <div class="hot-terms">
              <span 
                v-for="(term, index) in hotSearchTerms" 
                :key="`hot-${index}`" 
                class="hot-term" 
                @click="useSearchTerm(term)"
              >
                {{ term }}
              </span>
            </div>
          </div>
          
          <!-- 搜索历史 -->
          <div v-if="!searchKeyword && searchHistory.length > 0" class="suggestion-section">
            <div class="suggestion-header">
              <span>搜索历史</span>
              <span class="clear-history" @click="clearSearchHistory">清空</span>
            </div>
            <div class="history-items">
              <div v-for="(item, index) in searchHistory" :key="`history-${index}`" class="history-item">
                <span class="history-term" @click="useSearchTerm(item)">{{ item }}</span>
                <el-icon class="remove-history" @click.stop="removeSearchHistoryItem(index)"><close /></el-icon>
              </div>
            </div>
          </div>
          
          <!-- 搜索建议 -->
          <div v-if="searchKeyword && searchSuggestions.length > 0" class="suggestion-section">
            <div class="suggestion-header">
              <span>搜索建议</span>
            </div>
            <div class="suggestion-items">
              <div 
                v-for="(suggestion, index) in searchSuggestions" 
                :key="`suggestion-${index}`" 
                class="suggestion-item"
                @click="useSearchTerm(suggestion)"
              >
                <el-icon><search /></el-icon>
                <span v-html="highlightKeyword(suggestion)"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <el-button type="primary" @click="handleSearch">搜索</el-button>
    </div>
    
    <!-- 高级筛选选项 -->
    <div class="filter-section" v-if="searched">
      <div class="filter-header">
        <span>高级筛选</span>
        <span class="clear-filters" @click="clearFilters">清除筛选</span>
      </div>
      
      <div class="filters">
        <!-- 内容类型筛选 -->
        <div class="filter-group">
          <span class="filter-label">内容类型:</span>
          <el-radio-group v-model="filters.type" @change="handleFilterChange">
            <el-radio label="">全部</el-radio>
            <el-radio label="article">文章</el-radio>
            <el-radio label="note">笔记</el-radio>
            <el-radio label="share">分享</el-radio>
          </el-radio-group>
        </div>
        
        <!-- 分类筛选 -->
        <div class="filter-group">
          <span class="filter-label">分类:</span>
          <el-select v-model="filters.category" placeholder="选择分类" clearable @change="handleFilterChange">
            <el-option 
              v-for="category in categories" 
              :key="category.id" 
              :label="category.name" 
              :value="category.id" 
            />
          </el-select>
        </div>
        
        <!-- 标签筛选 -->
        <div class="filter-group">
          <span class="filter-label">标签:</span>
          <el-select v-model="filters.tag" placeholder="选择标签" clearable @change="handleFilterChange">
            <el-option 
              v-for="tag in tags" 
              :key="tag.id" 
              :label="tag.name" 
              :value="tag.id" 
            />
          </el-select>
        </div>
        
        <!-- 时间筛选 -->
        <div class="filter-group">
          <span class="filter-label">发布时间:</span>
          <el-select v-model="filters.time" placeholder="选择时间范围" clearable @change="handleFilterChange">
            <el-option label="最近一周" value="week" />
            <el-option label="最近一月" value="month" />
            <el-option label="最近三月" value="quarter" />
            <el-option label="最近一年" value="year" />
          </el-select>
        </div>
        
        <!-- 排序方式 -->
        <div class="filter-group">
          <span class="filter-label">排序方式:</span>
          <el-select v-model="filters.sortBy" placeholder="排序方式" @change="handleFilterChange">
            <el-option label="最新发布" value="time_desc" />
            <el-option label="最早发布" value="time_asc" />
            <el-option label="最多点赞" value="likes_desc" />
            <el-option label="最多评论" value="comments_desc" />
            <el-option label="最多浏览" value="views_desc" />
          </el-select>
        </div>
        
        <!-- 媒体类型筛选 -->
        <div class="filter-group media-filter">
          <el-checkbox v-model="filters.hasMedia" @change="handleFilterChange">包含多媒体</el-checkbox>
        </div>
      </div>
    </div>
    
    <!-- 搜索结果 -->
    <div class="search-results" v-if="searched">
      <div class="result-header">
        <h2 v-if="searchResults.length > 0">
          搜索结果: 共 <span class="highlight">{{ totalCount }}</span> 项
        </h2>
        <h2 v-else>未找到匹配 "<span class="highlight">{{ keyword }}</span>" 的结果</h2>
      </div>
      
      <div class="results-list" v-if="searchResults.length > 0">
        <div v-for="(result, index) in searchResults" :key="`result-${index}`" class="result-item">
          <h3 class="result-title">
            <router-link :to="`/blog/dynamic/${result.id}`" v-html="highlightKeyword(result.title)"></router-link>
          </h3>
          
          <div class="result-meta">
            <span class="result-category" v-if="result.category">
              <el-tag size="small">{{ result.category.name }}</el-tag>
            </span>
            <span class="result-date">{{ formatDate(result.createdAt) }}</span>
            <span class="result-stats">
              <el-icon><view /></el-icon> {{ result.views }}
              <el-icon><thumb /></el-icon> {{ result.likes }}
              <el-icon><chat-round /></el-icon> {{ result.commentCount }}
            </span>
          </div>
          
          <div class="result-tags" v-if="result.tags && result.tags.length > 0">
            <el-tag 
              v-for="tag in result.tags" 
              :key="tag.id" 
              size="small" 
              effect="plain"
            >
              {{ tag.name }}
            </el-tag>
          </div>
          
          <div class="result-desc" v-html="highlightKeyword(result.description || '')"></div>
          
          <!-- 内容匹配片段展示 -->
          <div class="match-snippets" v-if="result.matchSnippets && result.matchSnippets.length > 0">
            <div v-for="(snippet, snippetIndex) in result.matchSnippets" :key="`snippet-${snippetIndex}`" class="match-snippet">
              <div class="snippet-content" v-html="highlightKeyword(snippet)"></div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 加载更多 -->
      <div class="load-more" v-if="searchResults.length > 0">
        <el-button 
          v-if="hasMore" 
          :loading="loading" 
          @click="loadMore"
        >
          加载更多
        </el-button>
        <div v-else class="no-more">没有更多数据了</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search, CloseCircle, View, Thumb, ChatRound, Close } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getBlogDynamics, getBlogCategoryList, getBlogTagList } from '@/api/blog'
import { formatDate } from '@/utils/format'

const route = useRoute()
const router = useRouter()

// 搜索状态
const searchKeyword = ref('') // 输入框中的关键词
const keyword = ref('') // 实际用于搜索的关键词
const searched = ref(false) // 是否已经搜索过
const loading = ref(false) // 加载状态
const showSuggestions = ref(false) // 是否显示搜索建议

// 分页相关
const page = ref(1)
const pageSize = ref(10)
const hasMore = ref(false)
const totalCount = ref(0)

// 搜索结果
const searchResults = ref([])

// 筛选条件
const filters = reactive({
  type: '', // 文章类型：article, note, share
  category: '', // 分类ID
  tag: '', // 标签ID
  time: '', // 时间范围：week, month, quarter, year
  sortBy: 'time_desc', // 排序方式：time_desc, time_asc, likes_desc, comments_desc, views_desc
  hasMedia: false // 是否包含多媒体
})

// 分类和标签数据
const categories = ref([])
const tags = ref([])

// 热门搜索词
const hotSearchTerms = ref(['Vue3', 'React', 'TypeScript', '前端开发', 'Element Plus', '博客搭建'])

// 搜索建议
const searchSuggestions = computed(() => {
  if (!searchKeyword.value) return []
  
  // 这里可以根据输入生成搜索建议
  // 简单实现：从热门搜索词中筛选包含当前输入的词
  return hotSearchTerms.value.filter(term => 
    term.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

// 搜索历史
const searchHistory = ref([])

// 加载分类和标签数据
const loadCategoriesAndTags = async () => {
  try {
    const [categoriesRes, tagsRes] = await Promise.all([
      getBlogCategoryList(),
      getBlogTagList()
    ])
    
    categories.value = categoriesRes.data
    tags.value = tagsRes.data
  } catch (error) {
    console.error('加载分类和标签失败:', error)
  }
}

// 加载搜索历史
const loadSearchHistory = () => {
  try {
    const history = localStorage.getItem('searchHistory')
    if (history) {
      searchHistory.value = JSON.parse(history)
    }
  } catch (error) {
    console.error('加载搜索历史失败:', error)
    searchHistory.value = []
  }
}

// 保存搜索关键词到历史记录
const saveSearchHistory = (term) => {
  if (!term) return
  
  try {
    // 移除已存在的相同关键词
    const index = searchHistory.value.findIndex(item => item === term)
    if (index !== -1) {
      searchHistory.value.splice(index, 1)
    }
    
    // 将新关键词添加到头部
    searchHistory.value.unshift(term)
    
    // 限制历史记录数量为10条
    if (searchHistory.value.length > 10) {
      searchHistory.value = searchHistory.value.slice(0, 10)
    }
    
    // 保存到本地存储
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value))
  } catch (error) {
    console.error('保存搜索历史失败:', error)
  }
}

// 使用搜索词
const useSearchTerm = (term) => {
  searchKeyword.value = term
  showSuggestions.value = false
  handleSearch()
}

// 清空搜索输入
const clearSearchInput = () => {
  searchKeyword.value = ''
  showSuggestions.value = true
}

// 处理搜索输入变化
const handleSearchInput = () => {
  showSuggestions.value = true
}

// 清除所有筛选条件
const clearFilters = () => {
  Object.keys(filters).forEach(key => {
    if (key === 'sortBy') {
      filters[key] = 'time_desc'
    } else if (key === 'hasMedia') {
      filters[key] = false
    } else {
      filters[key] = ''
    }
  })
  
  handleFilterChange()
}

// 处理筛选条件变化
const handleFilterChange = () => {
  if (searched.value) {
    fetchSearchResults(true)
  }
}

// 执行搜索
const handleSearch = () => {
  if (!searchKeyword.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }
  
  keyword.value = searchKeyword.value.trim()
  
  // 更新URL查询参数
  updateQueryParams()
  
  // 保存到搜索历史
  saveSearchHistory(keyword.value)
  
  // 隐藏搜索建议
  showSuggestions.value = false
  
  // 重置页码并获取搜索结果
  page.value = 1
  searched.value = true
  fetchSearchResults(true)
}

// 更新URL查询参数
const updateQueryParams = () => {
  const query = { 
    keyword: keyword.value,
    ...Object.fromEntries(
      Object.entries(filters)
        .filter(([key, value]) => {
          // 只包含有值的筛选条件
          if (typeof value === 'boolean') return value
          return value !== ''
        })
    )
  }
  
  router.push({ 
    path: route.path, 
    query
  })
}

// 获取搜索结果
const fetchSearchResults = async (reset = false) => {
  if (loading.value) return
  
  try {
    loading.value = true
    
    // 如果是重置，则清空之前的结果
    if (reset) {
      searchResults.value = []
      page.value = 1
    }
    
    // 构建搜索参数
    const params = {
      keyword: keyword.value,
      page: page.value,
      pageSize: pageSize.value,
      ...Object.fromEntries(
        Object.entries(filters)
          .filter(([key, value]) => {
            // 只包含有值的筛选条件
            if (typeof value === 'boolean') return value
            return value !== ''
          })
      )
    }
    
    const res = await getBlogDynamics(params)
    
    // 更新总数和是否有更多
    totalCount.value = res.total
    hasMore.value = page.value * pageSize.value < res.total
    
    // 处理搜索结果数据，添加匹配片段等信息
    const processedResults = res.data.map(item => {
      // 这里可以添加处理逻辑，例如提取匹配的内容片段
      // 简单模拟匹配片段
      let matchSnippets = []
      
      if (item.content && keyword.value) {
        const content = item.content
        const keywordLower = keyword.value.toLowerCase()
        const contentLower = content.toLowerCase()
        
        let index = contentLower.indexOf(keywordLower)
        if (index !== -1) {
          const start = Math.max(0, index - 50)
          const end = Math.min(content.length, index + keyword.value.length + 50)
          let snippet = content.slice(start, end)
          
          // 添加省略号
          if (start > 0) snippet = '...' + snippet
          if (end < content.length) snippet = snippet + '...'
          
          matchSnippets.push(snippet)
        }
      }
      
      return {
        ...item,
        matchSnippets
      }
    })
    
    // 追加或设置搜索结果
    if (reset) {
      searchResults.value = processedResults
    } else {
      searchResults.value = [...searchResults.value, ...processedResults]
    }
  } catch (error) {
    console.error('搜索失败:', error)
    ElMessage.error('搜索失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 处理文档点击事件，关闭搜索建议
const handleDocumentClick = (event) => {
  const searchInputWrapper = document.querySelector('.search-input-wrapper')
  if (searchInputWrapper && !searchInputWrapper.contains(event.target)) {
    showSuggestions.value = false
  }
}

// 加载更多搜索结果
const loadMore = async () => {
  if (loading.value || !hasMore.value) return
  
  page.value++
  await fetchSearchResults()
}

// 清空搜索历史
const clearSearchHistory = () => {
  searchHistory.value = []
  localStorage.removeItem('searchHistory')
}

// 删除单条搜索历史
const removeSearchHistoryItem = (index) => {
  searchHistory.value.splice(index, 1)
  localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value))
}

// 高亮显示关键词
const highlightKeyword = (text) => {
  if (!keyword.value || !text) return text
  
  const regex = new RegExp(`(${keyword.value})`, 'gi')
  return text.replace(regex, '<span class="highlight">$1</span>')
}

// 监听路由变化
watch(
  () => route.query,
  (newQuery) => {
    // 当路由查询参数变化时，更新搜索条件并执行搜索
    if (newQuery.keyword) {
      keyword.value = newQuery.keyword
      searchKeyword.value = newQuery.keyword
      
      // 更新过滤条件
      if (newQuery.type) filters.type = newQuery.type
      if (newQuery.category) filters.category = newQuery.category
      if (newQuery.tag) filters.tag = newQuery.tag
      if (newQuery.sortBy) filters.sortBy = newQuery.sortBy
      if (newQuery.time) filters.time = newQuery.time
      if (newQuery.hasMedia) filters.hasMedia = newQuery.hasMedia === 'true'
      
      fetchSearchResults(true)
    } else {
      // 重置搜索条件
      keyword.value = ''
      searchKeyword.value = ''
      searchResults.value = []
      searched.value = false
    }
  },
  { immediate: true }
)

// 组件挂载时
onMounted(async () => {
  // 加载分类和标签
  await loadCategoriesAndTags()
  
  // 加载搜索历史
  loadSearchHistory()
  
  // 添加点击事件监听
  document.addEventListener('click', handleDocumentClick)
  
  // 检查URL参数，如果有关键词则执行搜索
  if (route.query.keyword) {
    keyword.value = route.query.keyword
    searchKeyword.value = route.query.keyword
    
    // 更新过滤条件
    if (route.query.type) filters.type = route.query.type
    if (route.query.category) filters.category = route.query.category
    if (route.query.tag) filters.tag = route.query.tag
    if (route.query.sortBy) filters.sortBy = route.query.sortBy
    if (route.query.time) filters.time = route.query.time
    if (route.query.hasMedia) filters.hasMedia = route.query.hasMedia === 'true'
    
    fetchSearchResults(true)
  }
})

// 组件卸载前
onBeforeUnmount(() => {
  // 移除事件监听
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<style scoped>
.blog-search-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.search-header {
  display: flex;
  margin-bottom: 20px;
}

.search-input-wrapper {
  flex: 1;
  margin-right: 10px;
  position: relative;
}

.clear-icon {
  cursor: pointer;
  color: #909399;
}

.clear-icon:hover {
  color: #409EFF;
}

.search-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  z-index: 100;
  max-height: 400px;
  overflow-y: auto;
  margin-top: 5px;
}

.suggestion-section {
  padding: 10px 15px;
  border-bottom: 1px solid #EBEEF5;
}

.suggestion-section:last-child {
  border-bottom: none;
}

.suggestion-header {
  display: flex;
  justify-content: space-between;
  color: #909399;
  font-size: 14px;
  margin-bottom: 10px;
}

.clear-history {
  color: #409EFF;
  cursor: pointer;
}

.hot-terms {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hot-term {
  background: #f2f6fc;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.3s;
}

.hot-term:hover {
  background: #ecf5ff;
  color: #409EFF;
}

.history-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0;
}

.history-term {
  flex: 1;
  cursor: pointer;
}

.history-term:hover {
  color: #409EFF;
}

.remove-history {
  cursor: pointer;
  color: #909399;
}

.remove-history:hover {
  color: #F56C6C;
}

.suggestion-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 0;
  cursor: pointer;
}

.suggestion-item:hover {
  color: #409EFF;
}

.filter-section {
  margin-bottom: 20px;
  padding: 15px;
  border-radius: 4px;
  background: #f5f7fa;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  font-size: 14px;
  color: #606266;
}

.clear-filters {
  color: #409EFF;
  cursor: pointer;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.filter-group {
  display: flex;
  align-items: center;
  margin-right: 20px;
}

.filter-label {
  margin-right: 10px;
  white-space: nowrap;
  color: #606266;
}

.media-filter {
  display: flex;
  align-items: center;
}

.search-results {
  margin-top: 20px;
}

.result-header {
  margin-bottom: 20px;
}

.result-header h2 {
  font-size: 18px;
  font-weight: 500;
  color: #303133;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.result-item {
  padding: 15px;
  border-radius: 4px;
  background: #fff;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
  transition: transform 0.3s, box-shadow 0.3s;
}

.result-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px 0 rgba(0,0,0,0.1);
}

.result-title {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 18px;
}

.result-title a {
  color: #303133;
  text-decoration: none;
  transition: color 0.3s;
}

.result-title a:hover {
  color: #409EFF;
}

.result-meta {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 10px;
  font-size: 13px;
  color: #909399;
}

.result-stats {
  display: flex;
  align-items: center;
  gap: 5px;
}

.result-stats .el-icon {
  margin-right: 3px;
}

.result-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 10px;
}

.result-desc {
  margin-bottom: 10px;
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
}

.match-snippets {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 13px;
}

.match-snippet {
  padding: 5px 0;
  color: #606266;
}

.snippet-content {
  line-height: 1.5;
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.no-more {
  color: #909399;
  font-size: 14px;
}

.highlight {
  color: #409EFF;
  font-weight: bold;
}
</style> 