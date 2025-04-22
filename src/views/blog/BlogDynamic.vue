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
      <el-button @click="refreshList" type="primary" size="small">刷新</el-button>
      <el-button @click="useMockData" type="success" size="small">使用测试数据</el-button>
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
              <el-icon><i-ep-view /></el-icon> {{ item.views }}
            </span>
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
      <div v-else-if="dynamicList.length > 0" class="no-more">没有更多内容了</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onActivated } from 'vue'
import MarkdownIt from 'markdown-it'
import { ElMessage } from 'element-plus'
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
    console.log('响应类型:', typeof response)
    console.log('响应结构:', JSON.stringify(response, null, 2))

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
      console.error('无法解析的响应格式，使用模拟数据:', response);
      // 使用模拟数据进行测试
      list = getMockDynamics();
      total = list.length;
      ElMessage.warning('使用模拟数据进行测试');
    }
    
    console.log('解析后的数据:', {list, total});
    
    if (list && list.length > 0) {
      console.log('获取到动态列表:', list.length, '条');
      console.log('第一条动态:', JSON.stringify(list[0], null, 2));
    } else {
      console.log('动态列表为空');
    }
    
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
    
    console.log('更新后的动态列表长度:', dynamicList.value.length);
    hasMore.value = dynamicList.value.length < total
  } catch (error) {
    console.error('获取博客动态列表失败详情:', error)
    ElMessage.error('获取动态列表失败，使用模拟数据进行测试')
    
    // 使用模拟数据
    const mockList = getMockDynamics();
    if (isRefresh) {
      dynamicList.value = mockList;
    } else {
      dynamicList.value = [...dynamicList.value, ...mockList];
    }
    
    hasMore.value = false;
  } finally {
    loading.value = false
  }
}

// 生成模拟数据用于测试
const getMockDynamics = () => {
  return [
    {
      id: '1',
      title: '测试动态1',
      content: '这是一篇测试动态的内容，包含**Markdown**格式。\n\n- 项目1\n- 项目2',
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
      type: '日常',
      likes: 15,
      comments: 5,
      views: 100,
      images: [
        { url: 'https://picsum.photos/800/600?random=1', description: '测试图片1' }
      ]
    },
    {
      id: '2',
      title: '测试动态2',
      content: '另一篇测试动态，这次有不同的内容。\n\n```js\nconsole.log("Hello World");\n```',
      createTime: new Date(Date.now() - 86400000).toISOString(), // 昨天
      updateTime: new Date(Date.now() - 86400000).toISOString(),
      type: '技术',
      likes: 7,
      comments: 2,
      views: 50
    },
    {
      id: '3',
      title: '带视频的测试动态',
      content: '这篇动态包含一个视频。',
      createTime: new Date(Date.now() - 172800000).toISOString(), // 前天
      updateTime: new Date(Date.now() - 172800000).toISOString(),
      type: '视频',
      likes: 25,
      comments: 10,
      views: 200,
      video: {
        url: 'https://www.w3schools.com/html/mov_bbb.mp4',
        cover: 'https://picsum.photos/800/450?random=3'
      }
    }
  ]
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
    // 使用getDynamicComments函数替代原生fetch
    const result = await getDynamicComments(item.id, { page: 1, pageSize: 10 })
    item.commentList = result.list || []
    item.commentsLoaded = true
  } catch (error) {
    ElMessage.error('获取评论失败')
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
    ElMessage.warning('评论内容不能为空')
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
      ElMessage.success('评论成功')
    }
  } catch (error) {
    ElMessage.error('提交评论失败')
    console.error('提交评论失败:', error)
  } finally {
    item.isSubmittingComment = false
  }
}

// 使用模拟数据
const useMockData = () => {
  dynamicList.value = getMockDynamics();
  hasMore.value = false;
  ElMessage.success('已加载测试数据');
}

// 初始化
onMounted(() => {
  // 只有在访问动态页面时才加载数据
  if (window.location.pathname.includes('/blog/blogdynamic')) {
    fetchDynamicList()
  }
})

// 当组件被keep-alive激活时
onActivated(() => {
  // 页面激活时检查是否需要刷新
  if (window.location.pathname.includes('/blog/blogdynamic') && fetchedPages.value.size === 0) {
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

.dynamic-title {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 1.5em;
  color: var(--el-color-primary);
}

.dynamic-views {
  font-size: 0.9em;
  display: flex;
  align-items: center;
  gap: 4px;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: var(--el-text-color-secondary);
}

.empty-state p {
  margin-bottom: 20px;
}

.empty-state .el-button {
  margin: 0 5px;
}
</style>