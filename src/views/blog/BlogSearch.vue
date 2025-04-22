<template>
  <div class="blog-search-container">
    <div class="search-section">
      <!-- 搜索框 -->
      <div class="search-box">
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
            <search-outlined />
          </template>
        </a-input-search>
        
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
          <a-form-item label="分类">
            <a-select
              v-model:value="advancedOptions.category"
              placeholder="选择分类"
              style="width: 200px"
              allowClear
            >
              <a-select-option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </a-select-option>
            </a-select>
          </a-form-item>
          
          <a-form-item label="标签">
            <a-select
              v-model:value="advancedOptions.tags"
              mode="multiple"
              placeholder="选择标签"
              style="width: 300px"
              allowClear
            >
              <a-select-option v-for="tag in tags" :key="tag.id" :value="tag.id">
                {{ tag.name }}
              </a-select-option>
            </a-select>
          </a-form-item>
          
          <a-form-item label="发布日期">
            <a-range-picker 
              v-model:value="advancedOptions.dateRange" 
              format="YYYY-MM-DD"
              :allowClear="true"
            />
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
          <a-radio-group v-model:value="filters.type" @change="handleFilterChange">
            <a-radio value="">全部</a-radio>
            <a-radio value="note">笔记</a-radio>
            <a-radio value="share">分享</a-radio>
          </a-radio-group>
        </div>
        
        <!-- 分类筛选 -->
        <div class="filter-group">
          <span class="filter-label">分类:</span>
          <a-select
            v-model:value="filters.category"
            placeholder="选择分类"
            allowClear
            @change="handleFilterChange"
            style="width: 200px"
          >
            <a-select-option
              v-for="category in categories" 
              :key="category.id" 
              :value="category.id"
            >
              {{ category.name }}
            </a-select-option>
          </a-select>
        </div>
        
        <!-- 标签筛选 -->
        <div class="filter-group">
          <span class="filter-label">标签:</span>
          <a-select
            v-model:value="filters.tag"
            placeholder="选择标签"
            allowClear
            @change="handleFilterChange"
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
        </div>
        
        <!-- 时间筛选 -->
        <div class="filter-group">
          <span class="filter-label">发布时间:</span>
          <a-select
            v-model:value="filters.time"
            placeholder="选择时间范围"
            allowClear
            @change="handleFilterChange"
            style="width: 200px"
          >
            <a-select-option value="week">最近一周</a-select-option>
            <a-select-option value="month">最近一月</a-select-option>
            <a-select-option value="quarter">最近三月</a-select-option>
            <a-select-option value="year">最近一年</a-select-option>
          </a-select>
        </div>
        
        <!-- 排序方式 -->
        <div class="filter-group">
          <span class="filter-label">排序方式:</span>
          <a-select
            v-model:value="filters.sortBy"
            placeholder="排序方式"
            @change="handleFilterChange"
            style="width: 200px"
          >
            <a-select-option value="time_desc">最新发布</a-select-option>
            <a-select-option value="time_asc">最早发布</a-select-option>
            <a-select-option value="likes_desc">最多点赞</a-select-option>
            <a-select-option value="comments_desc">最多评论</a-select-option>
            <a-select-option value="views_desc">最多浏览</a-select-option>
          </a-select>
        </div>
        
        <!-- 媒体类型筛选 -->
        <div class="filter-group media-filter">
          <a-checkbox v-model:checked="filters.hasMedia" @change="handleFilterChange">包含多媒体</a-checkbox>
        </div>
      </div>
    </div>
    
    <!-- 搜索结果 -->
    <div class="search-results" v-if="searchPerformed">
      <!-- 结果摘要 -->
      <div class="results-summary">
        <p v-if="searchResults.length > 0">
          找到 <span class="highlight">{{ totalResults }}</span> 条相关结果
          <template v-if="keyword">（关键词: <span class="highlight">{{ keyword }}</span>）</template>
        </p>
        <p v-else>
          没有找到相关结果
          <template v-if="keyword">（关键词: <span class="highlight">{{ keyword }}</span>）</template>
        </p>
      </div>
      
      <!-- 列表视图 -->
      <template v-if="viewMode === 'list' && searchResults.length > 0">
        <a-table
          :dataSource="searchResults"
          :columns="columns"
          :pagination="tablePagination"
          :loading="loading"
          @change="handleTableChange"
          rowKey="id"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'title'">
              <div class="article-title-cell">
                <router-link :to="`/blog/article/${record.id}`" class="article-title">
                  {{ record.title }}
                </router-link>
                <a-tag v-if="record.isTop" color="red">置顶</a-tag>
                <a-tag v-if="record.isHot" color="orange">热门</a-tag>
                <a-tag v-if="record.isRecommend" color="green">推荐</a-tag>
              </div>
            </template>
            
            <template v-else-if="column.key === 'category'">
              <a-tag color="blue">{{ record.category?.name || '未分类' }}</a-tag>
            </template>
            
            <template v-else-if="column.key === 'tags'">
              <div class="tag-list">
                <a-tag
                  v-for="tag in record.tags"
                  :key="tag.id"
                  :color="getTagColor(tag.name)"
                >
                  {{ tag.name }}
                </a-tag>
              </div>
            </template>
            
            <template v-else-if="column.key === 'createTime'">
              {{ formatDate(record.createTime) }}
            </template>
            
            <template v-else-if="column.key === 'viewCount'">
              <eye-outlined /> {{ record.viewCount }}
            </template>
            
            <template v-else-if="column.key === 'likeCount'">
              <like-outlined /> {{ record.likeCount }}
            </template>
            
            <template v-else-if="column.key === 'commentCount'">
              <comment-outlined /> {{ record.commentCount }}
            </template>
            
            <template v-else-if="column.key === 'action'">
              <a-space>
                <router-link :to="`/blog/article/${record.id}`">
                  <a-button type="link">查看</a-button>
                </router-link>
                <a-dropdown>
                  <template #overlay>
                    <a-menu>
                      <a-menu-item key="share">
                        <share-alt-outlined /> 分享
                      </a-menu-item>
                      <a-menu-item key="bookmark">
                        <book-outlined /> 收藏
                      </a-menu-item>
                      <a-menu-item key="report">
                        <warning-outlined /> 举报
                      </a-menu-item>
                    </a-menu>
                  </template>
                  <a-button type="link">
                    更多
                    <down-outlined />
                  </a-button>
                </a-dropdown>
              </a-space>
            </template>
          </template>
        </a-table>
      </template>
      
      <!-- 卡片视图 -->
      <template v-else-if="viewMode === 'card' && searchResults.length > 0">
        <div class="card-view">
          <a-row :gutter="[16, 16]">
            <a-col :xs="24" :sm="12" :md="8" :lg="8" :xl="6" v-for="article in searchResults" :key="article.id">
              <a-card hoverable>
                <template #cover>
                  <img :src="article.coverImage || '/images/default-cover.jpg'" alt="封面图" />
                </template>
                <template #title>
                  <router-link :to="`/blog/article/${article.id}`" class="card-title">
                    {{ article.title }}
                  </router-link>
                </template>
                <template #extra>
                  <a-space>
                    <a-tag v-if="article.isTop" color="red">置顶</a-tag>
                    <a-tag v-if="article.isHot" color="orange">热门</a-tag>
                  </a-space>
                </template>
                <a-card-meta>
                  <template #description>
                    <div class="card-content">
                      <p class="card-summary">{{ article.summary }}</p>
                      <div class="card-footer">
                        <div class="card-stats">
                          <span><eye-outlined /> {{ article.viewCount }}</span>
                          <span><like-outlined /> {{ article.likeCount }}</span>
                          <span><comment-outlined /> {{ article.commentCount }}</span>
                        </div>
                        <span class="card-date">{{ formatDate(article.createTime) }}</span>
                      </div>
                    </div>
                  </template>
                </a-card-meta>
              </a-card>
            </a-col>
          </a-row>
        </div>
        
        <!-- 分页 -->
        <div class="pagination-container">
          <a-pagination
            v-model:current="pagination.currentPage"
            :total="totalResults"
            :pageSize="pagination.pageSize"
            show-size-changer
            :pageSizeOptions="['10', '20', '50', '100']"
            @change="handlePageChange"
            @showSizeChange="handleSizeChange"
            showTotal="共 {total} 条记录"
          />
        </div>
      </template>
      
      <!-- 无结果 -->
      <div v-if="searchPerformed && searchResults.length === 0" class="no-results">
        <a-empty
          description="没有找到相关内容"
          :image="Empty.PRESENTED_IMAGE_SIMPLE"
        >
          <template #description>
            <span>
              没有找到与 "{{ keyword }}" 相关的内容，请尝试其他关键词
            </span>
          </template>
          <a-button type="primary" @click="resetSearch">清空搜索</a-button>
        </a-empty>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { SearchOutlined, CloseCircleOutlined, EyeOutlined, LikeOutlined, CommentOutlined, CloseOutlined, UnorderedListOutlined, AppstoreOutlined, ShareAltOutlined, BookOutlined, WarningOutlined, DownOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { getBlogDynamics, getBlogCategoryList, getBlogTagList } from '@/api/blog'
import { Empty } from 'ant-design-vue'
</script>