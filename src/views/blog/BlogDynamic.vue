<template>
  <div class="blog-dynamic">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">动态</h1>
      <p class="page-description">分享我的生活点滴和思考</p>
    </div>

    <!-- 调试信息 -->
    <div v-if="dynamicList.length === 0 && !loading" class="empty-state">
      <p>暂无动态内容</p>
      <a-button @click="refreshList" type="primary" size="small">刷新</a-button>
      <a-button @click="useMockData" type="success" size="small">使用测试数据</a-button>
    </div>

    <!-- 动态列表 -->
    <div v-if="dynamicList.length > 0" class="dynamic-list">
      <div v-for="(item, index) in dynamicList" :key="item.id || index" class="dynamic-item">
        <!-- 动态头部 -->
        <div class="dynamic-header">
          <h3 v-if="item.title" class="dynamic-title">{{item.title}}</h3>
          <div class="dynamic-meta">
            <span class="dynamic-time">{{ formatDate(item.createTime) }}</span>
            <span v-if="item.type" class="dynamic-type">{{ item.type }}</span>
            <span v-if="item.views" class="dynamic-views">
              <a-icon type="eye" /> {{ item.views }}
            </span>
          </div>
        </div>

        <!-- 动态内容 -->
        <div class="dynamic-content">
          <!-- Markdown内容 -->
          <div v-if="item.content" class="markdown-content" v-html="renderMarkdown(item.content)"></div>

          <!-- 图片展示 -->
          <div v-if="item.images && item.images.length" class="image-gallery">
            <a-image
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
            <a-button type="text" @click="handleLike(item)">
              <a-icon type="star" />
              <span>{{ item.likes || 0 }}</span>
            </a-button>
            <a-button type="text" @click="handleComment(item)">
              <a-icon type="message" />
              <span>{{ item.comments || 0 }}</span>
            </a-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载更多 -->
    <div class="load-more">
      <a-button 
        type="primary" 
        :loading="loading" 
        @click="loadMore"
        v-if="hasMore"
      >
        加载更多
      </a-button>
      <div v-else-if="dynamicList.length > 0" class="no-more">没有更多内容了</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onActivated } from 'vue'
import MarkdownIt from 'markdown-it'
import { message as AntMessage } from 'ant-design-vue'
// 导入API函数而不是仅导入createBlogApiUrl
import { 
  getBlogDynamics, 
  likeDynamic, 
  commentDynamic, 
  getDynamicComments 
} from '../../api/blog'

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
const commentContent = ref('')
const nickname = ref('')
const email = ref('')

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
    // 使用getBlogDynamics函数替代原生fetch
    const response = await getBlogDynamics({
      page: page.value,
      pageSize: pageSize.value
    })
    
    console.log('前台博客动态列表API响应:', response)
    
    let list = [], total = 0;
    
    // 处理不同的响应结构
    if (response && response.code === 200 && response.data) {
      // 后端返回标准格式 {code: 200, data: {list: [], total: 0}}
      console.log('使用标准响应格式解析数据')
      list = response.data.list || [];
      total = response.data.total || 0;
    } else if (Array.isArray(response)) {
      // 后端直接返回数组
      console.log('使用数组格式解析数据')
      list = response;
      total = response.length;
    } else if (response && response.list) {
      // 后端返回 {list: [], total: 0}
      console.log('使用对象格式解析数据')
      list = response.list;
      total = response.total || 0;
    } else {
      console.log('使用模拟数据');
      list = getMockDynamics();
      total = list.length;
    }
    
    if (isRefresh) {
      dynamicList.value = list;
    } else {
      dynamicList.value = [...dynamicList.value, ...list];
    }
    
    // 记录已加载的页码
    fetchedPages.value.add(page.value);
    
    // 更新是否有更多数据
    hasMore.value = dynamicList.value.length < total;
    
  } catch (error) {
    console.error('获取动态列表失败:', error);
    // 使用模拟数据
    const mockList = getMockDynamics();
    if (isRefresh) {
      dynamicList.value = mockList;
    } else {
      dynamicList.value = [...dynamicList.value, ...mockList];
    }
    hasMore.value = false;
  } finally {
    loading.value = false;
  }
}

// 模拟数据
const getMockDynamics = () => {
  return [
    {
      id: 1,
      title: '欢迎来到我的博客',
      content: '这是我的第一篇博客文章，欢迎访问！',
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
      views: 100,
      likes: 10,
      comments: 5
    },
    {
      id: 2,
      title: '技术分享：Vue.js 3.0 新特性',
      content: 'Vue.js 3.0带来了很多激动人心的新特性，让我们一起来看看吧！',
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
      views: 80,
      likes: 8,
      comments: 3
    }
  ];
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
    // 使用likeDynamic函数替代原生fetch
    const result = await likeDynamic(item.id)
    item.likes = result.likes || (item.likes + 1) // 更新点赞数
  } catch (error) {
    AntMessage.error('点赞失败')
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
    // 使用getDynamicComments函数替代原生fetch
    const result = await getDynamicComments(item.id, { page: 1, pageSize: 10 })
    item.commentList = result.list || []
    item.commentsLoaded = true
  } catch (error) {
    AntMessage.error('获取评论失败')
    console.error('获取评论失败:', error)
  } finally {
    item.isLoadingComments = false
  }
}

// 处理评论按钮点击
const handleComment = (item) => {
  // 如果评论未加载，加载评论
  if (!item.commentsLoaded) {
    fetchComments(item)
  }
  // 这里可以显示评论表单或评论列表
  // 根据实际UI设计实现
}

// 提交评论
const submitComment = async (item) => {
  if (!commentContent.value.trim()) {
    AntMessage.warning('评论内容不能为空')
    return
  }
  
  if (item.isSubmittingComment) return
  item.isSubmittingComment = true
  
  try {
    // 使用commentDynamic函数替代原生fetch
    const result = await commentDynamic(item.id, {
      content: commentContent.value,
      nickname: nickname.value || '匿名用户',
      email: email.value || ''
    })
    
    // 更新评论列表
    if (result.success) {
      fetchComments(item) // 重新获取评论列表
      commentContent.value = '' // 清空评论内容
      AntMessage.success('评论成功')
    }
  } catch (error) {
    AntMessage.error('评论失败')
    console.error('评论失败:', error)
  } finally {
    item.isSubmittingComment = false
  }
}

// 使用模拟数据进行测试
const useMockData = () => {
  dynamicList.value = getMockDynamics()
  hasMore.value = false
}

onMounted(() => {
  fetchDynamicList()
})

onActivated(() => {
  if (dynamicList.value.length === 0) {
    fetchDynamicList()
  }
})
</script>

<style scoped>
.blog-dynamic {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
}

.page-description {
  font-size: 14px;
  color: #888;
}

.empty-state {
  text-align: center;
  margin-top: 50px;
}

.dynamic-list {
  margin-top: 20px;
}

.dynamic-item {
  border-bottom: 1px solid #eee;
  padding: 10px 0;
}

.dynamic-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dynamic-title {
  font-size: 18px;
  font-weight: bold;
}

.dynamic-meta {
  font-size: 12px;
  color: #999;
}

.dynamic-content {
  margin-top: 10px;
}

.markdown-content {
  font-size: 14px;
  line-height: 1.6;
}

.image-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.gallery-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
}

.audio-player {
  margin-top: 10px;
}

.video-player {
  margin-top: 10px;
}

.video-element {
  width: 100%;
  height: auto;
  border-radius: 4px;
}

.dynamic-footer {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dynamic-actions {
  display: flex;
  gap: 10px;
}

.load-more {
  text-align: center;
  margin-top: 20px;
}

.no-more {
  color: #999;
  font-size: 14px;
}
</style>