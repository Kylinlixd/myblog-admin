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
            <div v-if="item.content && item.content.length > 200" class="read-more">
              <router-link :to="`/blog/dynamics/${item.id}`">
                阅读全文
              </router-link>
            </div>

            <!-- 图片展示 -->
            <div v-if="item.images && item.images.length" class="image-gallery">
              <div v-for="(image, imgIndex) in item.images.slice(0, 3)" :key="imgIndex" class="gallery-image">
                <img :src="image" :alt="`图片 ${imgIndex + 1}`" />
              </div>
              <div v-if="item.images.length > 3" class="more-images">
                <router-link :to="`/blog/dynamics/${item.id}`">
                  查看全部 {{ item.images.length }} 张图片
                </router-link>
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
              <a-button 
                type="text" 
                @click="handleLike(item)"
                :class="{ 'liked': item.liked }"
              >
                <like-outlined :style="{ color: item.liked ? '#1890ff' : 'inherit' }" />
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

          <!-- 评论列表 -->
          <div v-if="selectedDynamic && selectedDynamic.id === item.id" class="comment-section">
            <div class="comment-header">
              <h3>评论 ({{ item.comments || 0 }})</h3>
            </div>
            
            <!-- 评论表单 -->
            <div class="comment-form">
              <a-form
                ref="commentForm"
                :model="{ nickname, email, content: commentContent }"
                :rules="commentRules"
                layout="vertical"
              >
                <a-form-item label="昵称（选填）" name="nickname">
                  <a-input 
                    v-model:value="nickname" 
                    placeholder="请输入您的昵称，不填则显示为匿名用户" 
                  />
                </a-form-item>
                <a-form-item label="邮箱（选填）" name="email">
                  <a-input 
                    v-model:value="email" 
                    placeholder="请输入您的邮箱，用于接收回复通知" 
                  />
                </a-form-item>
                <a-form-item label="评论内容" name="content">
                  <a-textarea
                    v-model:value="commentContent"
                    placeholder="请输入评论内容"
                    :rows="4"
                    :maxLength="500"
                    show-count
                  />
                </a-form-item>
                <a-form-item>
                  <a-button
                    type="primary"
                    :loading="item.isSubmittingComment"
                    @click="submitComment(item)"
                  >
                    发表评论
                  </a-button>
                </a-form-item>
              </a-form>
            </div>

            <!-- 评论列表 -->
            <div class="comment-list">
              <div v-if="item.commentList && item.commentList.length > 0">
                <div
                  v-for="comment in item.commentList"
                  :key="comment.id"
                  class="comment-item"
                >
                  <div class="comment-user">
                    <a-avatar :src="comment.avatar || '/default-avatar.png'" />
                    <span class="nickname">{{ comment.nickname || '匿名用户' }}</span>
                    <span class="time">{{ formatDate(comment.createTime) }}</span>
                  </div>
                  <div class="comment-content">{{ comment.content }}</div>
                </div>
              </div>
              <div v-else class="no-comments">
                暂无评论，快来发表第一条评论吧！
              </div>
            </div>

            <!-- 评论分页 -->
            <div v-if="item.commentList && item.commentList.length > 0" class="comment-pagination">
              <a-pagination
                v-model:current="item.commentPage"
                :total="item.commentTotal"
                :pageSize="item.commentPageSize"
                @change="handleCommentPageChange"
              />
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

// 选中的动态
const selectedDynamic = ref(null)

// 评论分页相关
const handleCommentPageChange = async (page) => {
  if (!selectedDynamic.value) return
  selectedDynamic.value.commentPage = page
  await fetchComments(selectedDynamic.value)
}

// 渲染Markdown内容
const renderMarkdown = (content) => {
  if (!content) return ''
  // 移除HTML标签
  const plainText = content.replace(/<[^>]+>/g, '')
  // 截取前200个字符
  const truncatedText = plainText.length > 200 ? plainText.slice(0, 200) + '...' : plainText
  return md.render(truncatedText)
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
    const response = await likeDynamic(item.id)
    if (response.code === 200) {
      // 更新点赞状态和数量
      item.liked = response.data.liked
      item.likes = response.data.like_count
      message.success(item.liked ? '点赞成功' : '取消点赞成功')
    } else {
      message.error(response.message || '操作失败')
    }
  } catch (error) {
    console.error('点赞失败:', error)
    message.error(error.response?.data?.message || '点赞失败')
  } finally {
    item.isLiking = false
  }
}

// 获取评论
const fetchComments = async (item) => {
  if (item.isLoadingComments) return
  
  item.isLoadingComments = true
  try {
    console.log(`正在获取ID为${item.id}的动态评论...`);
    const result = await getDynamicComments(item.id, {
      page: item.commentPage || 1,
      pageSize: item.commentPageSize || 10
    })
    
    if (result && result.code === 200 && result.data) {
      // 检查返回的数据格式
      console.log('获取到评论数据结构:', JSON.stringify(result.data));
      
      // 兼容不同的返回格式
      if (Array.isArray(result.data)) {
        // 如果直接返回数组
        item.commentList = result.data;
        item.commentTotal = result.data.length;
      } else if (result.data.list) {
        // 返回标准格式
        item.commentList = result.data.list || [];
        item.commentTotal = result.data.total || 0;
        item.commentPageSize = result.data.pageSize || 10;
      } else {
        // 其他可能的格式
        item.commentList = [];
        item.commentTotal = 0;
      }
      
      item.commentsLoaded = true;
      console.log('评论列表数据处理完成:', item.commentList);
    } else {
      console.error('获取评论列表响应格式错误:', result);
      message.error('获取评论列表失败：响应格式错误');
      // 设置空数据避免UI错误
      item.commentList = [];
      item.commentTotal = 0;
    }
  } catch (error) {
    console.error('获取评论异常:', error);
    message.error(error?.message || '获取评论失败，请稍后重试');
    // 设置空数据避免UI错误
    item.commentList = [];
    item.commentTotal = 0;
  } finally {
    item.isLoadingComments = false;
  }
}

// 修改handleComment函数
const handleComment = async (item) => {
  // 如果点击的是当前选中的动态，则关闭评论列表
  if (selectedDynamic.value && selectedDynamic.value.id === item.id) {
    selectedDynamic.value = null
    return
  }
  
  // 选中新的动态并加载评论
  selectedDynamic.value = item
  if (!item.commentsLoaded) {
    await fetchComments(item)
  }
}

// 修改submitComment函数
const submitComment = async (item) => {
  try {
    // 验证表单
    await commentForm.value.validate()
    
    if (item.isSubmittingComment) return
    item.isSubmittingComment = true
    
    const commentData = {
      dynamic_id: item.id,
      content: commentContent.value,
      nickname: nickname.value || '匿名用户',
      email: email.value || ''
    }
    
    console.log('提交评论数据:', commentData)
    
    const result = await commentDynamic(item.id, commentData)
    
    if (result.code === 200) {
      message.success('评论成功')
      commentContent.value = ''
      nickname.value = ''
      email.value = ''
      // 重新获取评论列表
      item.commentPage = 1
      await fetchComments(item)
      // 更新评论数
      item.comments = (item.comments || 0) + 1
    } else {
      message.error(result.message || '评论失败')
    }
  } catch (error) {
    if (error.errorFields) {
      // 表单验证错误
      message.error('请检查评论内容')
    } else {
      console.error('评论失败:', error)
      message.error(error.response?.data?.message || '评论失败，请稍后重试')
    }
  } finally {
    item.isSubmittingComment = false
  }
}

// 修改评论表单部分
const commentForm = ref(null)
const commentRules = {
  content: [
    { required: true, message: '请输入评论内容', trigger: 'blur' },
    { min: 1, max: 500, message: '评论内容长度在1-500个字符之间', trigger: 'blur' }
  ],
  nickname: [
    { max: 50, message: '昵称长度不能超过50个字符', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ]
}

// 使用模拟数据进行测试
const useMockData = () => {
  dynamicList.value = getMockDynamics()
  hasMore.value = false
}

// 修改评论列表的显示逻辑
const isCommentSectionVisible = (item) => {
  return selectedDynamic.value && selectedDynamic.value.id === item.id
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
  background: linear-gradient(135deg, #f6f8fd 0%, #f1f4f9 100%);
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
  background: linear-gradient(90deg, #4f46e5, #7c3aed, #db2777);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.page-description {
  color: #64748b;
  font-size: 1.1rem;
}

.dynamic-list {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.dynamic-item {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border: 1px solid rgba(226, 232, 240, 0.8);
  backdrop-filter: blur(10px);
}

.dynamic-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
  border-color: rgba(99, 102, 241, 0.2);
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
  color: #1e293b;
  transition: all 0.3s ease;
  padding: 0.8rem 1.2rem;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%);
  position: relative;
  overflow: hidden;
}

.dynamic-title::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, 
    rgba(79, 70, 229, 0.05) 0%,
    rgba(124, 58, 237, 0.05) 50%,
    rgba(219, 39, 119, 0.05) 100%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}

.dynamic-title:hover::before {
  opacity: 1;
}

.dynamic-title::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(to bottom, #4f46e5, #7c3aed);
  border-radius: 2px;
}

.dynamic-title-link:hover .dynamic-title {
  transform: translateX(5px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.1);
}

.dynamic-title-link:hover {
  text-decoration: none;
}

.dynamic-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: #64748b;
  font-size: 0.9rem;
}

.dynamic-content {
  margin-bottom: 1rem;
}

.markdown-content {
  font-size: 1rem;
  line-height: 1.6;
  color: #334155;
  margin-bottom: 1rem;
}

.read-more {
  margin-top: 0.5rem;
  text-align: right;
}

.read-more a {
  color: #4f46e5;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
}

.read-more a:hover {
  color: #6366f1;
  text-decoration: underline;
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
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.gallery-image:hover {
  transform: scale(1.02);
}

.audio-player,
.video-player {
  margin: 1rem 0;
}

.audio-element,
.video-element {
  width: 100%;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dynamic-footer {
  border-top: 1px solid #e2e8f0;
  padding-top: 1rem;
  margin-top: 1rem;
}

.dynamic-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.dynamic-actions .ant-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  transition: all 0.3s;
  color: #64748b;
}

.dynamic-actions .ant-btn:hover {
  background-color: rgba(99, 102, 241, 0.1);
  color: #4f46e5;
}

.dynamic-actions .liked {
  color: #4f46e5;
}

.dynamic-actions .liked:hover {
  background-color: rgba(99, 102, 241, 0.1);
}

.view-detail-link {
  text-decoration: none;
}

.load-more {
  text-align: center;
  margin-top: 2rem;
}

.no-more {
  color: #64748b;
  font-size: 0.9rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #64748b;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  backdrop-filter: blur(10px);
}

.more-images {
  grid-column: 1 / -1;
  text-align: center;
  padding: 1rem;
  background: rgba(99, 102, 241, 0.05);
  border-radius: 12px;
}

.more-images a {
  color: #4f46e5;
  text-decoration: none;
  font-weight: 500;
}

.more-images a:hover {
  color: #6366f1;
  text-decoration: underline;
}

.comment-section {
  margin-top: 20px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(226, 232, 240, 0.8);
  backdrop-filter: blur(10px);
}

.comment-header {
  margin-bottom: 20px;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 10px;
}

.comment-header h3 {
  margin: 0;
  font-size: 18px;
  color: #1e293b;
}

.comment-form {
  margin-bottom: 30px;
}

.comment-list {
  margin-bottom: 20px;
}

.comment-item {
  padding: 15px 0;
  border-bottom: 1px solid #e2e8f0;
}

.comment-user {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.comment-user .nickname {
  margin-left: 8px;
  font-weight: 500;
  color: #1e293b;
}

.comment-user .time {
  margin-left: 12px;
  color: #94a3b8;
  font-size: 12px;
}

.comment-content {
  color: #334155;
  line-height: 1.6;
  word-break: break-all;
}

.no-comments {
  text-align: center;
  color: #94a3b8;
  padding: 20px 0;
}

.comment-pagination {
  text-align: center;
  margin-top: 20px;
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