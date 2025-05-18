<template>
  <div class="blog-dynamic-container">
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
            <router-link :to="`/blog/dynamics/${item.id}`" class="dynamic-title-link">
              <h3 v-if="item.title" class="dynamic-title">{{item.title}}</h3>
            </router-link>
            <div class="dynamic-meta">
              <span class="dynamic-time">{{ formatDate(item.createTime) }}</span>
              <span v-if="item.type" class="dynamic-type">{{ item.type }}</span>
              <span v-if="item.views" class="dynamic-views">
                <eye-outlined /> {{ item.views }}
              </span>
            </div>
          </div>

          <!-- 动态内容 -->
          <div class="dynamic-content">
            <div v-if="item.content" class="markdown-content" v-html="renderMarkdown(item.content)"></div>

            <!-- 图片展示 -->
            <div v-if="item.images && item.images.length" class="image-gallery">
              <div v-for="(image, imgIndex) in item.images" :key="imgIndex" class="gallery-image">
                <img :src="image" :alt="`图片 ${imgIndex + 1}`" />
              </div>
            </div>

            <!-- 音频播放器 -->
            <div v-if="item.audio" class="audio-player">
              <audio class="audio-element" controls>
                <source :src="item.audio" type="audio/mpeg">
                您的浏览器不支持音频播放
              </audio>
            </div>

            <!-- 视频播放器 -->
            <div v-if="item.video" class="video-player">
              <video class="video-element" controls>
                <source :src="item.video" type="video/mp4">
                您的浏览器不支持视频播放
              </video>
            </div>
          </div>

          <!-- 动态底部 -->
          <div class="dynamic-footer">
            <div class="dynamic-actions">
              <a-button type="text" @click="handleLike(item)">
                <like-outlined />
                <span>{{ item.likes || 0 }}</span>
              </a-button>
              <a-button type="text" @click="handleComment(item)">
                <message-outlined />
                <span>{{ item.comments || 0 }}</span>
              </a-button>
              <router-link :to="`/blog/dynamics/${item.id}`" class="view-detail-link">
                <a-button type="text">
                  <eye-outlined />
                  <span>查看详情</span>
                </a-button>
              </router-link>
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
    <SnowfallBg class="snowfall-bg" />
  </div>
</template>

<script setup>
import { ref, onMounted, onActivated } from 'vue'
import MarkdownIt from 'markdown-it'
import { message } from 'ant-design-vue'
import SnowfallBg from '@/components/InspiraUI/SnowfallBg.vue'
import { 
  getBlogDynamics, 
  likeDynamic, 
  commentDynamic, 
  getDynamicComments 
} from '../../api/blog'
import { 
  LikeOutlined, 
  MessageOutlined, 
  EyeOutlined,
  CalendarOutlined,
  TagOutlined,
  FolderOutlined
} from '@ant-design/icons-vue'

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
      // 后端返回标准格式 {code: 200, data: {items: [], total: 0}}
      console.log('使用标准响应格式解析数据')
      list = response.data.items || [];
      total = response.data.total || 0;
      
      // 处理列表数据
      list = list.map(item => ({
        ...item,
        createTime: item.created_at || item.createdAt,
        updateTime: item.updated_at || item.updatedAt,
        views: item.views || 0,
        likes: item.likes || 0,
        comments: item.comments || 0,
        images: item.mediaUrls || [],
        type: item.type || 'text',
        status: item.status || 'draft'
      }));
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
    
    console.log('处理后的列表数据:', list)
    
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
    message.error('点赞失败')
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
    message.error('获取评论失败')
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
    message.warning('评论内容不能为空')
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
      message.success('评论成功')
    }
  } catch (error) {
    message.error('评论失败')
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
.blog-dynamic-container {
  position: relative;
  width: 100%;
  min-height: 100vh;
}

.blog-dynamic {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.snowfall-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

.page-header {
  text-align: center;
  margin-bottom: 3rem;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  background: linear-gradient(90deg, #38bdf8, #818cf8, #c084fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.page-description {
  color: #666;
  font-size: 1.1rem;
}

.dynamic-list {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.dynamic-item {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.dynamic-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.dynamic-header {
  margin-bottom: 1rem;
}

.dynamic-title-link {
  text-decoration: none;
  color: inherit;
  display: block;
}

.dynamic-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1a1a1a;
  transition: color 0.3s ease;
}

.dynamic-title-link:hover .dynamic-title {
  color: #38bdf8;
}

.dynamic-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: #666;
  font-size: 0.9rem;
}

.dynamic-content {
  margin-bottom: 1rem;
}

.markdown-content {
  font-size: 1rem;
  line-height: 1.6;
  color: #333;
}

.image-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}

.gallery-image {
  width: 100%;
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
}

.audio-player,
.video-player {
  margin: 1rem 0;
}

.audio-element,
.video-element {
  width: 100%;
  border-radius: 8px;
}

.dynamic-footer {
  border-top: 1px solid #eee;
  padding-top: 1rem;
  margin-top: 1rem;
}

.dynamic-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.view-detail-link {
  text-decoration: none;
}

.load-more {
  text-align: center;
  margin-top: 2rem;
}

.no-more {
  color: #666;
  font-size: 0.9rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

@media (max-width: 768px) {
  .blog-dynamic {
    padding: 1rem;
  }

  .page-title {
    font-size: 2rem;
  }

  .dynamic-item {
    padding: 1rem;
  }

  .dynamic-title {
    font-size: 1.3rem;
  }

  .image-gallery {
    grid-template-columns: 1fr;
  }
}
</style>