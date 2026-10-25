<template>
  <div class="blog-search-container cinematic-page">
    <header class="search-hero cinematic-hero">
      <h1>搜索数字花园</h1>
      <p>从文章、分类和标签中，找到与你当前问题最接近的线索。</p>
    </header>
    <div class="search-section">
      <!-- 搜索框 -->
      <div class="search-box cinematic-card">
        <div class="search-input-wrapper">
          <!-- 回车由 a-input-search 内部转成 @search，press-enter 绑定会被覆盖、属无效绑定 -->
          <a-input-search
            v-model:value="keyword"
            placeholder="搜索文章、标签或关键词..."
            enter-button
            size="large"
            :loading="loading"
            @search="handleSearch"
            class="search-input"
          >
            <template #prefix>
              <search-outlined class="search-icon" />
            </template>
          </a-input-search>
        </div>
        
        <!-- 高级搜索开关：与输入框同排，不再单独占一行 -->
        <div class="search-options">
          <a-button type="text" :aria-expanded="showAdvancedSearch" @click="toggleAdvancedSearch">
            {{ showAdvancedSearch ? '收起筛选' : '筛选' }}
            <template #icon>
              <component :is="showAdvancedSearch ? UpOutlined : DownOutlined" />
            </template>
          </a-button>
        </div>

        <div v-show="showAdvancedSearch" class="advanced-search-options">
          <div class="filter-grid">
            <label class="filter-field">
              <span class="filter-label">分类</span>
              <a-select
                v-model:value="advancedOptions.category"
                class="filter-control"
                placeholder="选择分类"
                allowClear
              >
                <a-select-option v-for="category in categories" :key="category.id" :value="category.id">
                  {{ category.name }}
                </a-select-option>
              </a-select>
            </label>

            <label class="filter-field">
              <span class="filter-label">标签</span>
              <a-select
                v-model:value="advancedOptions.tag"
                class="filter-control"
                placeholder="选择标签"
                allowClear
              >
                <a-select-option v-for="tag in tags" :key="tag.id" :value="tag.id">
                  {{ tag.name }}
                </a-select-option>
              </a-select>
            </label>

            <label class="filter-field">
              <span class="filter-label">发布时间</span>
              <a-select
                v-model:value="advancedOptions.time"
                class="filter-control"
                placeholder="选择时间范围"
                allowClear
              >
                <a-select-option value="week">最近一周</a-select-option>
                <a-select-option value="month">最近一月</a-select-option>
                <a-select-option value="quarter">最近三月</a-select-option>
                <a-select-option value="year">最近一年</a-select-option>
              </a-select>
            </label>

            <label class="filter-field">
              <span class="filter-label">排序方式</span>
              <a-select v-model:value="advancedOptions.sortBy" class="filter-control">
                <a-select-option value="time_desc">最新发布</a-select-option>
                <a-select-option value="time_asc">最早发布</a-select-option>
                <a-select-option value="likes_desc">最多点赞</a-select-option>
                <a-select-option value="comments_desc">最多评论</a-select-option>
                <a-select-option value="views_desc">最多浏览</a-select-option>
              </a-select>
            </label>

            <div class="filter-field filter-field--check">
              <span class="filter-label" aria-hidden="true"></span>
              <a-checkbox v-model:checked="advancedOptions.hasMedia">只显示包含多媒体</a-checkbox>
            </div>
          </div>

          <div class="filter-footer">
            <span v-if="filtersDirty" class="filter-dirty" role="status">
              {{ keyword.trim() ? '筛选条件已更新，点「搜索」应用' : '可直接按条件筛选，点「搜索」开始' }}
            </span>
            <div class="filter-actions">
              <a-button @click="resetAdvancedOptions">重置</a-button>
              <a-button type="primary" :disabled="!canSearch" :loading="loading" @click="handleSearch">搜索</a-button>
            </div>
          </div>
        </div>
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
            :color="tagColor({ id: index })"
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
      
      <!-- 搜索建议：原占位块已删除（suggestions 从未被置真，属死代码） -->
    </div>
    
    <!-- 搜索结果 -->
    <div class="search-results cinematic-card" v-if="searched">
      <div class="search-result-heading">
        <div>
          <span class="search-result-kicker">SEARCH INDEX · 搜索索引</span>
          <h2 v-if="keyword.trim()">与“<strong>{{ keyword }}</strong>”相关的内容</h2>
          <h2 v-else>按筛选条件找到的内容</h2>
        </div>
        <div class="result-heading-meta">
          <span class="result-count">{{ loading ? '检索中' : `找到 ${total} 条` }}</span>
          <a-radio-group v-if="searchResults.length > 0" v-model:value="viewMode" button-style="solid" size="small" class="view-mode-toggle">
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
      </div>
      <div v-if="loading" class="loading-state">
        <a-skeleton :active="true" :paragraph="{ rows: 4 }" :title="true" :loading="true" />
        <a-skeleton :active="true" :paragraph="{ rows: 4 }" :title="true" :loading="true" style="margin-top: 2rem;" />
        <a-skeleton :active="true" :paragraph="{ rows: 4 }" :title="true" :loading="true" style="margin-top: 2rem;" />
        <p style="margin-top:2rem; color:#888;">搜索中...</p>
      </div>
      
      <div v-else-if="!searchResults || searchResults.length === 0" class="no-results">
        <inbox-outlined />
        <strong class="no-results__title">没有找到匹配的线索</strong>
        <p>{{ keyword.trim() ? '换一个更具体的词，或减少筛选条件后再试一次。' : '当前筛选条件下还没有内容，试试放宽时间范围。' }}</p>
        <a-button type="primary" @click="resetSearch">重新筛选</a-button>
      </div>
      
      <div v-else class="results-content">
        <!-- 列表视图 -->
        <div v-if="viewMode === 'list'" class="list-view">
          <a-list
            :data-source="searchResults"
            :pagination="false"
            :virtual="true"
            :item-height="100"
            :height="500"
          >
            <template #renderItem="{ item }">
              <a-list-item>
                <div class="result-content">
                  <div class="result-header">
                    <span class="result-type">{{ getItemType(item) }}</span>
                    <router-link :to="getItemLink(item)" class="result-link">
                      <h3 class="result-title" v-html="highlightKeyword(item.title || item.name)"></h3>
                    </router-link>
                  </div>
                  <p v-if="item.excerpt" class="result-excerpt" v-html="highlightKeyword(plainExcerpt(item.excerpt))"></p>
                  <div class="result-meta">
                    <span v-if="item.createdAt" class="result-date">{{ formatDate(item.createdAt) }}</span>
                    <span v-if="item.views" class="result-views">{{ item.views }} 阅读</span>
                    <span v-if="item.category" class="result-category">
                      <folder-outlined /> {{ item.category.name }}
                    </span>
                    <span v-if="item.tags && item.tags.length" class="result-tags">
                      <tag-outlined /> 
                      <a-tag v-for="tag in item.tags" :key="tag.id" :color="tagColor(tag)">
                        {{ tag.name }}
                      </a-tag>
                    </span>
                  </div>
                </div>
              </a-list-item>
            </template>
          </a-list>
        </div>
        
        <!-- 卡片视图 -->
        <div v-else class="card-view">
          <div v-for="(item, index) in searchResults" :key="item.id || index" class="result-card cinematic-card">
            <router-link :to="getItemLink(item)" class="card-link">
              <div class="card-image" v-if="item.cover">
                <img :src="item.cover" :alt="item.title || item.name" loading="lazy">
              </div>
              <div class="card-content">
                <h3 class="card-title" v-html="highlightKeyword(item.title || item.name)"></h3>
                <p v-if="item.excerpt" class="card-excerpt" v-html="highlightKeyword(plainExcerpt(item.excerpt))"></p>
                <div class="card-meta">
                  <span class="card-type">{{ getItemType(item) }}</span>
                  <span v-if="item.createdAt" class="card-date">{{ formatDate(item.createdAt) }}</span>
                  <span v-if="item.views" class="card-views">{{ item.views }} 阅读</span>
                  <span v-if="item.category" class="card-category">
                    <folder-outlined /> {{ item.category.name }}
                  </span>
                  <span v-if="item.tags && item.tags.length" class="card-tags">
                    <tag-outlined /> 
                    <a-tag v-for="tag in item.tags" :key="tag.id" :color="tagColor(tag)">
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
            :showTotal="(total) => `共 ${total} 条`"
            @change="handlePageChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  SearchOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
  DownOutlined,
  UpOutlined,
  InboxOutlined,
  FolderOutlined,
  TagOutlined
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { getBlogDynamics, getCategoryDynamics, getTagDynamics, getBlogCategoryList, getBlogTagList, searchBlog } from '@/api/blog'
import { collectAllPages, normalizeCollectionResponse } from '@/api/collections'
import { normalizeSearchItem, paginate, refineItems } from './searchFilters'
import { showError } from '@/utils/performance'
import { excerptFromMarkdown } from '@/utils/seoMeta'

// 后端 excerpt 是正文截断，可能带未闭合的 markdown 记号：
// 与列表/标签页同一套纯文本口径清洗
const plainExcerpt = (text) => excerptFromMarkdown(text, 400)

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
  category: undefined,
  tag: undefined,
  time: undefined,
  sortBy: 'time_desc',
  hasMedia: false
})
// 筛选条件是否已改动但还没提交：只更新提示，不自动发请求
const filtersDirty = ref(false)

// 关键词和筛选条件至少有一个，才允许提交
const activeFilterCount = computed(() => {
  const options = advancedOptions.value
  return [options.category, options.tag, options.time, options.hasMedia].filter(Boolean).length
})
const canSearch = computed(() => Boolean(keyword.value.trim()) || activeFilterCount.value > 0)

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
}

// 处理分页变化：antd 在改每页条数时会同时 emit change(page, pageSize)，
// 因此 size 变化也走这里（原来 @showSizeChange 会导致同一操作连发两次搜索）
const handlePageChange = (page, size) => {
  const nextSize = Number(size) || pageSize.value
  const sizeChanged = nextSize !== pageSize.value
  pageSize.value = nextSize
  currentPage.value = sizeChanged ? 1 : page
  handleSearch()
}

// 按条件浏览：不带关键词时，从公共动态流按分类 / 标签取全量，再在本地筛选与分页
const browseByFilters = async () => {
  const options = advancedOptions.value
  // 分类 / 标签动态流返回的是 data.dynamics（不是 items/results），这里统一成 {count, results}
  const normalizeFeed = (response) => {
    const data = response?.data ?? response
    const list = data?.dynamics ?? data?.items
    if (Array.isArray(list)) return { count: Number(data?.total) || list.length, results: list }
    return normalizeCollectionResponse(response)
  }

  const loadPage = async (page) => {
    const response = options.tag
      ? await getTagDynamics(options.tag, { page })
      : options.category
        ? await getCategoryDynamics(options.category, { page })
        : await getBlogDynamics({ page })
    return normalizeFeed(response)
  }

  const { results } = await collectAllPages(loadPage)
  return refineItems(results.map(normalizeSearchItem), options)
}

// 请求序号：快速改条件/连点搜索时丢弃过期响应，避免旧结果覆盖新状态
let searchSequence = 0
// 全量结果缓存：排序/筛选都在本地做，翻页或重复搜索不需要重新拉取
const fullResultSet = ref(null)
const resultSetKey = ref('')

const currentResultSetKey = () => JSON.stringify({
  keyword: keyword.value.trim(),
  ...advancedOptions.value
})

const fetchRefinedResultSet = async () => {
  const options = advancedOptions.value
  const trimmed = keyword.value.trim()

  if (trimmed) {
    // 排序/筛选是前端做的：必须先取全量，否则"最多浏览"只排了服务端给的那 10 条
    const all = await collectAllPages(async (page) => {
      const response = await searchBlog({ keyword: trimmed, page, pageSize: 100 })
      return normalizeCollectionResponse(response)
    })
    return refineItems(all.results.map(normalizeSearchItem), options)
  }
  return browseByFilters()
}

// 处理搜索：有关键词走搜索接口，没有关键词时按条件筛选
const handleSearch = async () => {
  const trimmed = keyword.value.trim()

  if (!trimmed && activeFilterCount.value === 0) {
    message.warning('请输入关键词，或至少选择一个筛选条件')
    return
  }

  const sequence = ++searchSequence
  loading.value = true
  searched.value = true
  searchPerformed.value = true

  try {
    const key = currentResultSetKey()
    if (key !== resultSetKey.value || fullResultSet.value === null) {
      const refined = await fetchRefinedResultSet()
      if (sequence !== searchSequence) return
      fullResultSet.value = refined
      resultSetKey.value = key
    }

    if (trimmed) saveSearchHistory(trimmed)

    const paged = paginate(fullResultSet.value, currentPage.value, pageSize.value)
    searchResults.value = paged.items
    total.value = paged.total
    currentPage.value = paged.page
    pageSize.value = paged.pageSize

    if (total.value === 0) {
      message.info(trimmed ? '未找到相关结果，请尝试其他关键词' : '当前筛选条件下还没有内容')
    }
  } catch (error) {
    if (sequence !== searchSequence) return
    console.error('[Search] 搜索失败:', error)
    if (error?.code === 'NETWORK_ERROR' || error?.status === 0) {
      showError('网络连接失败，请检查网络设置')
    } else {
      showError('搜索失败，请稍后重试')
    }
    searchResults.value = []
    total.value = 0
  } finally {
    if (sequence === searchSequence) {
      loading.value = false
      filtersDirty.value = false
    }
  }
}

// 监听路由参数变化
watch(() => route.query, (newQuery) => {
  if (newQuery.keyword && newQuery.keyword !== keyword.value) {
    keyword.value = newQuery.keyword
    handleSearch()
  }
}, { immediate: true })

// 初始化数据（route.query 的初始搜索由上方 watch immediate 覆盖，这里不再重复发起）
onMounted(async () => {
  // 加载分类和标签
  try {
    const [categoryRes, tagRes] = await Promise.all([
      collectAllPages((page) => getBlogCategoryList({ page }).then(normalizeCollectionResponse)),
      collectAllPages((page) => getBlogTagList({ page }).then(normalizeCollectionResponse))
    ])
    
    // 标签接口是分页的（73 个标签每页只给 10 个），必须逐页取全再进下拉
    categories.value = categoryRes.results
    tags.value = tagRes.results
    
  } catch (error) {
    console.error('[Search] 加载分类和标签失败:', error)
    // 设置默认值，避免UI错误
    categories.value = []
    tags.value = []
  }
  
  // 加载搜索历史
  loadSearchHistory()
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
    category: undefined,
    tag: undefined,
    time: undefined,
    sortBy: 'time_desc',
    hasMedia: false
  }
  filtersDirty.value = false
  // 有关键词就按关键词重搜；纯条件筛选被清空后回到初始状态，不再硬发一次请求
  if (keyword.value.trim()) handleSearch()
  else resetSearch()
}

// 标签颜色：按 id 稳定取色，重渲染不换色（随机色在每次 patch 都会闪变）
const tagColor = (tag) => {
  const colors = ['blue', 'green', 'red', 'orange', 'purple', 'cyan']
  const seed = Number(tag?.id ?? 0)
  return colors[Math.abs(Number.isFinite(seed) ? seed : 0) % colors.length]
}

// 高亮关键词
const highlightKeyword = (text) => {
  const value = String(text ?? '')
  const escaped = value.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character])
  if (!keyword.value) return escaped
  const escapedKeyword = keyword.value.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  if (!escapedKeyword) return escaped
  const regex = new RegExp(escapedKeyword, 'gi')
  return escaped.replace(regex, match => `<span class="highlight">${match}</span>`)
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

// 创建防抖函数
// 只提示「条件已更新」，由用户显式点搜索；避免点一下单选框就整页转圈
watch(advancedOptions, () => {
  filtersDirty.value = true
}, { deep: true })
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

.list-view :deep(.ant-list-item) {
  padding: 1.5rem 2.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  border: 1px solid #f0f0f0;
}

.list-view :deep(.ant-list-item:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border-color: #e6f7ff;
}

.result-content {
  width: 100%;
}

.result-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.result-type {
  background: #e6f7ff;
  color: #1890ff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
  flex-shrink: 0;
  margin-top: 4px;
}

.result-link {
  flex: 1;
  text-decoration: none;
  color: inherit;
}

.result-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: #1a1a1a;
  line-height: 1.4;
}

.result-excerpt {
  color: #666;
  margin-bottom: 1rem;
  line-height: 1.6;
  font-size: 0.95rem;
}

.result-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  color: #888;
  font-size: 0.9rem;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f0f0f0;
}

.result-date {
  color: #8c8c8c;
  display: flex;
  align-items: center;
  gap: 4px;
}

.result-date::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 4px;
  background: #d9d9d9;
  border-radius: 50%;
}

.result-views {
  color: #8c8c8c;
  display: flex;
  align-items: center;
  gap: 4px;
}

.result-views::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 4px;
  background: #d9d9d9;
  border-radius: 50%;
}

.result-category {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #52c41a;
}

.result-category::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 4px;
  background: #d9d9d9;
  border-radius: 50%;
}

.result-tags {
  display: flex;
  align-items: center;
  gap: 8px;
}

.result-tags::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 4px;
  background: #d9d9d9;
  border-radius: 50%;
}

.result-tags :deep(.ant-tag) {
  margin: 0;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
}

/* 卡片视图样式 */
.card-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.result-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  border: 1px solid #f0f0f0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.result-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border-color: #e6f7ff;
}

.card-link {
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.card-image {
  width: 100%;
  height: 200px;
  overflow: hidden;
  position: relative;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.result-card:hover .card-image img {
  transform: scale(1.05);
}

.card-content {
  padding: 1.5rem 2.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #1a1a1a;
  line-height: 1.4;
}

.card-excerpt {
  color: #666;
  margin-bottom: 1rem;
  line-height: 1.6;
  font-size: 0.95rem;
  flex: 1;
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  color: #888;
  font-size: 0.9rem;
  align-items: center;
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid #f0f0f0;
}

.card-type {
  background: #e6f7ff;
  color: #1890ff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
}

.card-date {
  color: #8c8c8c;
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-date::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 4px;
  background: #d9d9d9;
  border-radius: 50%;
}

.card-views {
  color: #8c8c8c;
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-views::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 4px;
  background: #d9d9d9;
  border-radius: 50%;
}

.card-category {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #52c41a;
}

.card-category::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 4px;
  background: #d9d9d9;
  border-radius: 50%;
}

.card-tags {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-tags::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 4px;
  background: #d9d9d9;
  border-radius: 50%;
}

.card-tags :deep(.ant-tag) {
  margin: 0;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
}

/* 高亮样式优化 */
.highlight {
  color: #1890ff;
  font-weight: 600;
  background: rgba(24, 144, 255, 0.1);
  padding: 0 2px;
  border-radius: 2px;
}

/* 响应式布局优化 */
@media (max-width: 768px) {
  .list-view :deep(.ant-list-item) {
    padding: 1rem 1.5rem;
  }

  .card-view {
    grid-template-columns: 1fr;
  }

  .card-image {
    height: 180px;
  }

  .card-content {
    padding: 1rem 1.5rem;
  }

  .result-meta,
  .card-meta {
    gap: 0.75rem;
  }
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

  .search-input-wrapper {
    max-width: 100%;
  }

  .search-input :deep(.ant-input) {
    font-size: 1rem;
  }

  .search-input :deep(.ant-btn) {
    height: 40px;
  }

  .advanced-search-options {
    padding: 1rem;
  }

  .advanced-search-options :deep(.ant-form) {
    grid-template-columns: 1fr;
  }

  .advanced-search-options :deep(.ant-form-item) {
    margin-bottom: 1rem;
  }

  .card-view {
    grid-template-columns: 1fr;
  }

  .result-card {
    padding: 1rem;
  }

  .pagination {
    margin-top: 1rem;
  }
}
/* editorial search redesign */
.blog-search-container { padding: clamp(28px, 5vw, 64px) 1rem 88px; }
.search-hero { max-width: 980px; margin: 0 auto 22px; padding: 0 4px; text-align: left; }
.search-hero h1 { max-width: 720px; margin: 0 0 10px; color: #253142; font-size: clamp(30px, 4.2vw, 52px); font-weight: 800; letter-spacing: -.055em; line-height: 1; text-wrap: balance; }
.search-hero p { max-width: 560px; margin: 0; color: #697586; font-size: 14px; line-height: 1.7; }
/* 搜索框与「筛选」开关同排；两者同高、圆角同族，整体读成一条控件 */
.search-box { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 10px; max-width: 980px; margin: 0 auto 12px; padding: 12px; border-radius: 20px; }
.search-input-wrapper { max-width: none; margin: 0; min-width: 0; }

/* 输入框与提交按钮合成一个胶囊：去掉中间的分隔线，只在整组外沿描边 */
.search-input :deep(.ant-input-affix-wrapper) {
  height: 52px;
  padding-inline-start: 18px;
  border: 1px solid #ead8c7;
  border-right: 0;
  border-radius: 14px 0 0 14px;
  background: #fffdfa;
  box-shadow: none;
}

.search-input :deep(.ant-input-affix-wrapper:hover),
.search-input :deep(.ant-input-affix-wrapper-focused) {
  border-color: #d9b795;
  box-shadow: none;
}

.search-input :deep(.ant-input) { background: transparent; font-size: 15px; }
.search-input :deep(.search-icon) { color: #c09472; }

.search-input :deep(.ant-btn),
.search-input :deep(.ant-input-search-button) {
  height: 52px;
  padding-inline: 22px;
  border: 1px solid #b85e2d;
  border-radius: 0 14px 14px 0;
  background: linear-gradient(180deg, #c26a37, #b0572a);
  box-shadow: 0 10px 22px rgb(176 87 42 / 22%);
}

.search-input :deep(.ant-btn:hover),
.search-input :deep(.ant-input-search-button:hover) {
  border-color: #a44e25;
  background: linear-gradient(180deg, #b85e2d, #a44e25);
}

/* 整组聚焦时给一圈柔和高亮，而不是只亮输入框 */
.search-input-wrapper:focus-within :deep(.ant-input-affix-wrapper),
.search-input-wrapper:focus-within :deep(.ant-input-search-button) {
  border-color: #b85e2d;
}

.search-input-wrapper:focus-within :deep(.ant-input-affix-wrapper) {
  box-shadow: inset 0 0 0 3px rgb(184 94 45 / 12%);
}

.search-options { display: flex; flex: 0 0 auto; justify-content: flex-end; }

.search-options :deep(.ant-btn) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 52px;
  padding-inline: 20px;
  border: 1px solid #ead8c7;
  border-radius: 14px;
  background: #fffdfa;
  color: #a44e25;
  font-size: 13px;
  font-weight: 700;
}

.search-options :deep(.ant-btn:hover),
.search-options :deep(.ant-btn[aria-expanded='true']) {
  border-color: #c47747;
  background: #fdf3ea;
  color: #8f3f18;
}
/* 筛选区属于搜索卡片内部：不再是一张独立卡片，只用一条内部分隔线 */
.advanced-search-options { grid-column: 1 / -1; margin: 2px 0 0; padding: 18px 2px 2px; border: 0; border-top: 1px solid #ead8c7; border-radius: 0; background: transparent; }

/* 筛选面板：两列栅格 + 固定标签列，控件等宽对齐 */
.filter-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 26px; }
.filter-field { display: grid; grid-template-columns: 74px minmax(0, 1fr); align-items: center; gap: 10px; min-width: 0; }
.filter-label { color: #5b6672; font-size: 12px; font-weight: 700; }
.filter-control { width: 100%; min-width: 0; }
.filter-field--check { cursor: pointer; }
.filter-footer { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin-top: 18px; padding-top: 16px; border-top: 1px solid #ead8c7; }
.filter-dirty { color: #a44e25; font-size: 12px; font-weight: 700; }
.filter-actions { display: flex; gap: 8px; margin-left: auto; }
.search-results { max-width: 980px; margin: 24px auto 0; padding: clamp(20px, 4vw, 38px); border-radius: 5px 24px 5px 24px; background: rgb(255 250 242 / 78%); box-shadow: 0 20px 48px rgb(92 59 35 / 10%); }
.search-result-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; padding-bottom: 20px; border-bottom: 1px solid #ead8c7; }
.search-result-kicker { color: #b85e2d; font-size: 10px; font-weight: 800; letter-spacing: .16em; }
.search-result-heading h2 { margin: 8px 0 0; color: #253142; font-size: clamp(20px, 3vw, 30px); letter-spacing: -.04em; line-height: 1.1; }
.search-result-heading h2 strong { color: #b85e2d; }
.result-heading-meta { display: flex; flex: 0 0 auto; align-items: center; gap: 14px; }
.result-count { flex: 0 0 auto; color: #7d695c; font-size: 12px; font-weight: 700; }
.search-history, .popular-searches { max-width: 980px; margin: 18px auto 0; padding: 14px 18px; border-bottom: 1px solid #ead8c7; }
.history-header h3, .popular-header h3 { margin: 0; color: #536174; font-size: 12px; font-weight: 800; letter-spacing: .05em; }
.history-items, .popular-items { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
.history-item, .popular-item { cursor: pointer; }
.view-mode-toggle { display: inline-flex; margin: 0; }
.view-mode-toggle :deep(.ant-radio-button-wrapper) { display: inline-flex; align-items: center; gap: 6px; height: 32px; font-size: 12px; line-height: 30px; }
.no-results { min-height: 260px; padding: 48px 20px; color: #7d695c; }
.no-results > svg { color: #c47747; font-size: 38px; }
.no-results__title { color: #253142; font-size: 20px; }
.no-results p { margin: 0; color: #697586; font-size: 13px; }
.list-view :deep(.ant-list-item) { padding: 22px 8px; border-color: #ead8c7; border-radius: 0; background: transparent; box-shadow: none; }
.list-view :deep(.ant-list-item:hover) { transform: none; border-color: #ead8c7; background: rgb(247 226 207 / 30%); }
.result-title, .card-title { color: #253142; letter-spacing: -.025em; }
.result-title:hover, .card-title:hover { color: #b85e2d; }
.result-excerpt, .card-excerpt { color: #5b6672; line-height: 1.75; }
.result-type, .card-type { border: 1px solid #ead8c7; border-radius: 4px; background: #f7e2cf; color: #a44e25; font-weight: 700; }
.result-meta, .card-meta { border-color: #ead8c7; color: #7d695c; }
.card-view { grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
.result-card { border: 1px solid #ead8c7; border-radius: 4px 20px 4px 20px; background: rgb(255 250 242 / 88%); box-shadow: 0 12px 26px rgb(92 59 35 / 8%); }
.result-card:hover { border-color: #d8ad8b; box-shadow: 0 20px 38px rgb(92 59 35 / 14%); transform: translateY(-5px); }
.card-content { padding: 22px; }
.highlight { color: #a44e25; background: #f7e2cf; }
@media (max-width: 768px) { .search-hero h1 { font-size: clamp(42px, 13vw, 64px); } .search-input :deep(.ant-input-affix-wrapper), .search-input :deep(.ant-btn), .search-input :deep(.ant-input-search-button) { height: 48px; } .search-result-heading { align-items: flex-start; flex-direction: column; gap: 10px; } .search-results { margin-top: 16px; padding: 20px 16px; } }
@media (prefers-reduced-motion: reduce) { .result-card, .list-view :deep(.ant-list-item), .search-input :deep(*) { transition: none !important; } }
/*
 * 响应式：必须放在 cinematic 覆盖之后，
 * 否则同优先级的 .filter-grid 两列定义会把它盖掉（之前就踩了这个顺序坑）。
 */
@media (max-width: 768px) {
  .search-box {
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
    padding: 12px;
  }

  .search-options {
    justify-content: stretch;
  }

  .search-options :deep(.ant-btn) {
    width: 100%;
    height: 46px;
    justify-content: center;
  }

  .filter-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }

  .filter-field {
    grid-template-columns: 68px minmax(0, 1fr);
  }

  .filter-field--check .filter-label {
    display: none;
  }

  .filter-field--check {
    grid-template-columns: minmax(0, 1fr);
  }

  .filter-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .filter-actions {
    margin-left: 0;
  }

  .filter-actions :deep(.ant-btn) {
    flex: 1 1 0;
  }

  .search-hero h1 {
    font-size: clamp(28px, 8vw, 38px);
  }
}
</style>
