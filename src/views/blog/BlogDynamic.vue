<template>
  <div class="blog-dynamic">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">动态</h1>
      <p class="page-description">分享我的生活点滴和思考</p>
    </div>

    <!-- 动态列表 -->
    <div class="dynamic-list">
      <div v-for="(item, index) in dynamicList" :key="index" class="dynamic-item">
        <!-- 动态头部 -->
        <div class="dynamic-header">
          <div class="dynamic-meta">
            <span class="dynamic-time">{{ formatDate(item.createTime) }}</span>
            <span class="dynamic-type">{{ item.type }}</span>
          </div>
        </div>

        <!-- 动态内容 -->
        <div class="dynamic-content">
          <!-- Markdown内容 -->
          <div v-if="item.content" class="markdown-content" v-html="renderMarkdown(item.content)"></div>

          <!-- 图片展示 -->
          <div v-if="item.images && item.images.length" class="image-gallery">
            <el-image
              v-for="(img, imgIndex) in item.images"
              :key="imgIndex"
              :src="img.url"
              :preview-src-list="item.images.map(i => i.url)"
              fit="cover"
              class="gallery-image"
            />
          </div>

          <!-- 音频播放器 -->
          <div v-if="item.audio" class="audio-player">
            <audio controls :src="item.audio.url" class="audio-element">
              您的浏览器不支持音频播放
            </audio>
          </div>

          <!-- 视频播放器 -->
          <div v-if="item.video" class="video-player">
            <video
              controls
              :src="item.video.url"
              :poster="item.video.cover"
              class="video-element"
            >
              您的浏览器不支持视频播放
            </video>
          </div>
        </div>

        <!-- 动态底部 -->
        <div class="dynamic-footer">
          <div class="dynamic-actions">
            <el-button type="text" @click="handleLike(item)">
              <el-icon><i-ep-star /></el-icon>
              <span>{{ item.likes || 0 }}</span>
            </el-button>
            <el-button type="text" @click="handleComment(item)">
              <el-icon><i-ep-chat-dot-round /></el-icon>
              <span>{{ item.comments || 0 }}</span>
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载更多 -->
    <div class="load-more">
      <el-button 
        type="primary" 
        :loading="loading" 
        @click="loadMore"
        v-if="hasMore"
      >
        加载更多
      </el-button>
      <div v-else class="no-more">没有更多内容了</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onActivated } from 'vue'
import MarkdownIt from 'markdown-it'
import { ElMessage } from 'element-plus'
import { createBlogApiUrl } from '../../api/blog'

// 创建Markdown渲染器
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})

// 状态
const loading = ref(false)
const dynamicList = ref([])
const page = ref(1)
const pageSize = ref(10)
const hasMore = ref(true)
const fetchedPages = ref(new Set()) // 用于跟踪已请求的页码

// 渲染Markdown内容
const renderMarkdown = (content) => {
  return md.render(content || '')
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 获取动态列表
const fetchDynamicList = async (isRefresh = false) => {
  if (loading.value) return
  
  // 如果不是刷新，且该页已加载过，则跳过请求
  if (!isRefresh && fetchedPages.value.has(page.value)) {
    console.log(`页码 ${page.value} 已加载过，跳过重复请求`)
    return
  }
  
  loading.value = true
  console.log('前台博客页面请求动态列表，页码:', page.value, '每页数量:', pageSize.value)
  
  try {
    // 直接使用原生fetch请求，绕过所有axios配置
    const apiParams = new URLSearchParams({
      page: page.value,
      pageSize: pageSize.value
    })
    
    // 使用辅助函数创建API URL，确保正确的路径前缀
    const url = createBlogApiUrl('dynamics') + `?${apiParams.toString()}`
    console.log('发送请求URL:', url)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`请求失败: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('前台博客动态列表API响应:', data)
    
    if (data.code === 200) {
      const { list = [], total = 0 } = data.data || {}
      
      if (isRefresh) {
        // 如果是刷新，清空现有列表
        dynamicList.value = [...list]
        // 重置已获取页面记录
        fetchedPages.value = new Set([page.value])
      } else {
        // 追加数据
        dynamicList.value = [...dynamicList.value, ...list]
        // 记录已获取的页码
        fetchedPages.value.add(page.value)
      }
      
      hasMore.value = dynamicList.value.length < total
    } else {
      ElMessage.error(data.message || '获取动态列表失败')
    }
  } catch (error) {
    ElMessage.error('获取动态列表失败')
    console.error('获取动态列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 刷新列表
const refreshList = () => {
  page.value = 1
  fetchDynamicList(true)
}

// 加载更多
const loadMore = () => {
  page.value++
  fetchDynamicList()
}

// 点赞
const handleLike = async (item) => {
  if (loading.value) return
  if (item.isLiking) return
  
  item.isLiking = true
  try {
    // 使用辅助函数创建API URL
    const url = createBlogApiUrl(`dynamics/${item.id}/like`)
    console.log('发送点赞请求:', url)
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`请求失败: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('前台博客动态点赞API响应:', data)
    
    if (data.code === 200) {
      item.likes = data.data.likes
    } else {
      ElMessage.error(data.message || '点赞失败')
    }
  } catch (error) {
    ElMessage.error('点赞失败')
    console.error('点赞失败:', error)
  } finally {
    item.isLiking = false
  }
}

// 获取评论
const fetchComments = async (item) => {
  if (item.isLoadingComments) return
  if (item.commentsLoaded) return
  
  item.isLoadingComments = true
  try {
    // 使用辅助函数创建API URL
    const url = createBlogApiUrl(`dynamics/${item.id}/comments`)
    console.log('获取评论请求:', url)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`请求失败: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('前台博客动态评论API响应:', data)
    
    if (data.code === 200) {
      item.comments = data.data.comments
      item.commentsLoaded = true
    } else {
      ElMessage.error(data.message || '获取评论失败')
    }
  } catch (error) {
    ElMessage.error('获取评论失败')
    console.error('获取评论失败:', error)
  } finally {
    item.isLoadingComments = false
  }
}

// 提交评论
const submitComment = async (item) => {
  if (!commentContent.value.trim()) {
    ElMessage.warning('评论内容不能为空')
    return
  }
  
  if (item.isSubmittingComment) return
  item.isSubmittingComment = true
  
  try {
    // 使用辅助函数创建API URL
    const url = createBlogApiUrl(`dynamics/${item.id}/comments`)
    console.log('提交评论请求:', url)
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: commentContent.value,
        nickname: nickname.value || '匿名用户',
        email: email.value || ''
      })
    })
    
    if (!response.ok) {
      throw new Error(`请求失败: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('前台博客动态评论提交API响应:', data)
    
    if (data.code === 200) {
      item.comments = data.data.comments
      item.isSubmittingComment = false
      commentContent.value = ''
    } else {
      ElMessage.error(data.message || '提交评论失败')
    }
  } catch (error) {
    ElMessage.error('提交评论失败')
    console.error('提交评论失败:', error)
  } finally {
    item.isSubmittingComment = false
  }
}

// 初始化
onMounted(() => {
  fetchDynamicList()
})

// 当组件被keep-alive激活时
onActivated(() => {
  // 页面激活时检查是否需要刷新
  if (fetchedPages.value.size === 0) {
    fetchDynamicList()
  }
})
</script>

<style scoped>
.blog-dynamic {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-title {
  font-size: 2.5em;
  margin-bottom: 10px;
  color: var(--el-text-color-primary);
}

.page-description {
  font-size: 1.1em;
  color: var(--el-text-color-secondary);
}

.dynamic-list {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.dynamic-item {
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.dynamic-header {
  margin-bottom: 15px;
}

.dynamic-meta {
  display: flex;
  align-items: center;
  gap: 15px;
  color: var(--el-text-color-secondary);
}

.dynamic-time {
  font-size: 0.9em;
}

.dynamic-type {
  font-size: 0.9em;
  padding: 2px 8px;
  background: var(--el-color-primary-light-9);
  border-radius: 4px;
  color: var(--el-color-primary);
}

.dynamic-content {
  margin-bottom: 15px;
}

.markdown-content {
  margin-bottom: 15px;
}

.image-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
  margin: 15px 0;
}

.gallery-image {
  width: 100%;
  height: 200px;
  border-radius: 4px;
  cursor: pointer;
}

.audio-player,
.video-player {
  margin: 15px 0;
}

.audio-element,
.video-element {
  width: 100%;
  border-radius: 4px;
}

.dynamic-footer {
  border-top: 1px solid var(--el-border-color-light);
  padding-top: 15px;
}

.dynamic-actions {
  display: flex;
  gap: 15px;
}

.load-more {
  text-align: center;
  margin-top: 30px;
}

.no-more {
  color: var(--el-text-color-secondary);
  font-size: 0.9em;
}
</style>