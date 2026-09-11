<template>
  <div class="blog-dynamic-container cinematic-page">
    <div class="blog-dynamic">
      <!-- 页面标题 -->
      <div class="page-header cinematic-hero blog-dynamic-hero">
        <h1 class="page-title">探索动态</h1>
        <p class="page-description">记录我的开发之路，分享生活点滴和思考</p>
      </div>

      <div v-if="dynamicList.length === 0 && !loading" class="empty-state cinematic-card">
        <p>暂无动态内容</p>
        <a-button @click="refreshList" type="primary" size="small">刷新</a-button>
      </div>

      <div v-if="dynamicList.length > 0" class="blog-dynamic-layout">
        <aside v-if="timelineGroups.length || activeTimeline" class="dynamic-timeline" aria-label="时间线">
          <div class="dynamic-timeline__label">时间线</div>
          <p class="dynamic-timeline__intro">按发布节奏回看内容</p>
          <nav class="dynamic-timeline__nav">
            <button
              type="button"
              :class="{ 'is-active': !activeTimeline }"
              @click="selectTimelinePeriod('')"
            >
              <span class="timeline-year">全部</span>
              <strong>动态</strong>
            </button>
            <button
              v-for="group in timelineGroups"
              :key="group.key"
              type="button"
              :class="{ 'is-active': activeTimeline === group.key }"
              @click="selectTimelinePeriod(group.key)"
            >
              <span class="timeline-year">{{ group.year }}</span>
              <strong>{{ group.monthLabel }}</strong>
              <small>{{ group.count }} 篇</small>
            </button>
          </nav>
        </aside>

        <div class="blog-dynamic-stream">
          <!-- 动态列表 -->
          <div v-if="dynamicList.length > 0" class="dynamic-list">
        <div
          v-for="(item, index) in dynamicList"
          :key="item.id || index"
          class="dynamic-item cinematic-card"
        >
          <!-- 动态头部 -->
          <div class="dynamic-header">
            <router-link :to="`/blog/dynamics/${item.id}`" class="dynamic-title-link">
              <h3 v-if="item.title" class="dynamic-title">{{item.title}}</h3>
            </router-link>
            <div class="dynamic-meta">
              <span class="dynamic-time">{{ formatDate(item.createTime) }}</span>
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

            <div v-if="mediaCount(item)" class="dynamic-media-list">
              <template v-for="media in previewMediaItems(item)" :key="media.url">
                <div v-if="isMediaUnavailable(media.url)" class="media-unavailable">该媒体已不可用</div>
                <img v-else-if="media.type === 'image'" :src="media.url" :alt="media.name || '动态图片'" loading="lazy" decoding="async" @error="markMediaUnavailable(media.url)" />
                <audio v-else-if="media.type === 'audio'" controls preload="none" :src="media.url" @error="markMediaUnavailable(media.url)">您的浏览器不支持音频播放</audio>
                <video v-else-if="media.type === 'video'" controls preload="none" :src="media.url" :poster="media.posterUrl || undefined" playsinline @error="markMediaUnavailable(media.url)">您的浏览器不支持视频播放</video>
                <a v-else :href="media.url" target="_blank" rel="noopener" @click.prevent="openMedia(media)">下载附件{{ media.name ? `：${media.name}` : '' }}</a>
              </template>
              <router-link v-if="mediaCount(item) > 1" :to="`/blog/dynamics/${item.id}`">查看全部 {{ mediaCount(item) }} 个附件</router-link>
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
            <div v-if="selectedDynamic && selectedDynamic.id === item.id" class="comment-section cinematic-card">
            <div class="comment-header">
              <h3>评论 ({{ item.comments || 0 }})</h3>
            </div>
            
            <!-- 评论表单 -->
            <div class="comment-form">
              <CommentComposer :loading="item.isSubmittingComment" :reset-key="commentComposerResetKey" @submit="submitComment(item, $event)" />
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
                    <UserAvatar :src="comment.avatar" :nickname="comment.nickname" tone="warm" :size="36" />
                    <span class="nickname">{{ comment.nickname || '匿名用户' }}</span>
                    <a v-if="comment.website" class="comment-website" :href="comment.website" target="_blank" rel="noopener noreferrer">主页</a>
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
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onActivated } from 'vue'
import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'
import { message } from 'ant-design-vue'
import { buildApiUrl } from '@/utils/apiBaseUrl'
import { 
  getBlogDynamics, 
  getBlogDynamicTimeline,
  likeDynamic, 
  commentDynamic, 
  getDynamicComments 
} from '../../api/blog'
import { 
  LikeOutlined, 
  MessageOutlined, 
  EyeOutlined
} from '@ant-design/icons-vue'
import CommentComposer from '@/components/blog/CommentComposer.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'

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
const website = ref('')
const commentComposerResetKey = ref(0)
const unavailableMediaUrls = ref(new Set())
const timelineGroups = ref([])
const activeTimeline = ref('')

const mediaItems = (dynamic) => {
  const media = dynamic.mediaUrls ?? dynamic.media_urls ?? dynamic.files ?? []
  return (Array.isArray(media) ? media : [media]).map((item) => {
    const poster = typeof item === 'string' ? '' : item?.posterUrl || item?.poster_url || ''
    return {
      url: buildApiUrl(typeof item === 'string' ? item : item?.url || item?.file_url || ''),
      type: typeof item === 'string' ? dynamic.type : item?.type || item?.file_type || dynamic.type,
      name: typeof item === 'object' ? item?.name || '' : '',
      posterUrl: poster ? buildApiUrl(poster) : ''
    }
  }).filter((item) => item.url)
}
const mediaCount = (dynamic) => Number(dynamic?.mediaCount ?? mediaItems(dynamic).length)
const previewMediaItems = (dynamic) => mediaItems(dynamic).slice(0, 1)
const markMediaUnavailable = (url) => unavailableMediaUrls.value.add(url)
const isMediaUnavailable = (url) => unavailableMediaUrls.value.has(url)
const openMedia = async (item) => {
  const popup = window.open('', '_blank')
  if (!popup) return window.location.assign(item.url)
  if (new URL(item.url, window.location.href).origin !== window.location.origin) return popup.location.assign(item.url)
  try {
    const response = await fetch(item.url, { method: 'HEAD' })
    if (response.ok) return popup.location.assign(item.url)
    popup.close()
    if (response.status === 404) markMediaUnavailable(item.url)
    else message.error('媒体加载失败，请稍后重试')
  } catch {
    popup.close()
    message.error('媒体加载失败，请稍后重试')
  }
}

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
  return DOMPurify.sanitize(md.render(truncatedText))
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const fetchTimeline = async () => {
  try {
    const response = await getBlogDynamicTimeline()
    timelineGroups.value = response?.code === 200 && Array.isArray(response.data)
      ? response.data
      : []
  } catch {
    timelineGroups.value = []
  }
}

const selectTimelinePeriod = async (key) => {
  const nextPeriod = activeTimeline.value === key ? '' : key
  if (nextPeriod === activeTimeline.value) return
  activeTimeline.value = nextPeriod
  page.value = 1
  fetchedPages.value = new Set()
  unavailableMediaUrls.value = new Set()
  dynamicList.value = []
  hasMore.value = true
  await fetchDynamicList()
}

// 获取动态列表
const fetchDynamicList = async (isRefresh = false) => {
  if (loading.value) return
  
  // 如果不是刷新，且该页已加载过，则跳过请求
  if (!isRefresh && fetchedPages.value.has(page.value)) {
    return
  }
  
  loading.value = true
  
  try {
    // 使用getBlogDynamics函数替代原生fetch
    const response = await getBlogDynamics({
      page: page.value,
      pageSize: pageSize.value,
      month: activeTimeline.value || undefined
    })
    
    
    let list = [], total = 0;
    
    // 处理不同的响应结构
    if (response && response.code === 200 && response.data) {
      // 后端返回标准格式 {code: 200, data: {items: [], total: 0}}
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
        type: item.type || 'text',
        status: item.status || 'draft'
      }));
    } else if (Array.isArray(response)) {
      // 后端直接返回数组
      list = response;
      total = response.length;
    } else if (response && response.list) {
      // 后端返回 {list: [], total: 0}
      list = response.list;
      total = response.total || 0;
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
    message.error('动态内容加载失败，请稍后重试')
    if (isRefresh) dynamicList.value = []
    hasMore.value = false;
  } finally {
    loading.value = false;
  }
}

// 刷新列表
const refreshList = () => {
  page.value = 1
  unavailableMediaUrls.value = new Set()
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
      if (response.data.already_liked) {
        message.info('你已点赞，无需重复操作')
      } else {
        message.success(item.liked ? '点赞成功' : '取消点赞成功')
      }
    } else {
      message.error(response.message || '操作失败')
    }
  } catch (error) {
    console.error('点赞失败:', error)
    const payload = error.response?.data || {}
    const duplicateLike = payload.data?.already_liked
      || (error.response?.status === 400 && /已经点过赞|已点赞/.test(payload.message || ''))
    if (duplicateLike) {
      item.liked = payload.data?.liked ?? true
      if (payload.data?.like_count != null) item.likes = payload.data.like_count
      message.info('你已点赞，无需重复操作')
      return
    }
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
    const result = await getDynamicComments(item.id, {
      page: item.commentPage || 1,
      pageSize: item.commentPageSize || 10
    })
    
    if (result && result.code === 200 && result.data) {
      // 检查返回的数据格式
      
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
const submitComment = async (item, payload = {}) => {
  try {
    // 手动验证表单
    if (!(payload.content || commentContent.value).trim()) {
      message.error('请输入评论内容')
      return
    }
    
    if (item.isSubmittingComment) return
    item.isSubmittingComment = true
    
    const commentData = {
      content: payload.content || commentContent.value,
      nickname: payload.nickname || nickname.value || '匿名用户',
      email: payload.email || email.value || '',
      website: payload.website || website.value || ''
    }
    
    
    const result = await commentDynamic(item.id, commentData)
    
    if (result.code === 200) {
      message.success('评论成功')
      commentContent.value = ''
      nickname.value = ''
      email.value = ''
      website.value = ''
      commentComposerResetKey.value += 1
      // 重新获取评论列表
      item.commentPage = 1
      await fetchComments(item)
      // 更新评论数
      item.comments = (item.comments || 0) + 1
    } else {
      message.error(result.message || '评论失败')
    }
  } catch (error) {
      console.error('评论失败:', error)
      message.error(error.response?.data?.message || '评论失败，请稍后重试')
  } finally {
    item.isSubmittingComment = false
  }
}

onMounted(() => {
  fetchTimeline()
  fetchDynamicList()
})

onActivated(() => {
  if (dynamicList.value.length === 0) {
    fetchDynamicList()
  }
  if (timelineGroups.value.length === 0) {
    fetchTimeline()
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

.blog-dynamic-container.cinematic-page {
  padding-block: clamp(28px, 4vw, 48px);
}

.blog-dynamic {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
  padding: clamp(24px, 4vw, 44px) 20px 72px;
}

.page-header {
  text-align: center;
  margin-bottom: clamp(24px, 3vw, 38px);
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

.blog-dynamic-hero {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  grid-template-rows: auto auto;
  align-items: center;
  column-gap: 18px;
  row-gap: 8px;
  max-width: 960px;
  margin: 0 auto clamp(20px, 2.5vw, 28px);
}

.blog-dynamic-hero::before {
  width: 24px;
  height: 24px;
  grid-column: 1;
  grid-row: 1 / span 2;
  align-self: center;
  margin: 0;
  border: 1px solid rgb(200 111 55 / 38%);
  border-radius: 50%;
  background:
    radial-gradient(circle, var(--blog-accent) 0 3px, transparent 3.5px),
    radial-gradient(circle, transparent 0 8px, rgb(200 111 55 / 12%) 8.5px 9px, transparent 9.5px);
  box-shadow: 0 0 0 5px rgb(200 111 55 / 6%);
}

.blog-dynamic-hero .page-title {
  grid-column: 2;
  grid-row: 1;
  margin: 0;
}

.blog-dynamic-hero .page-description {
  grid-column: 2;
  grid-row: 2;
  margin: 0;
  max-width: none;
}

.dynamic-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.blog-dynamic-layout {
  display: grid;
  grid-template-columns: 210px minmax(0, 1fr);
  align-items: start;
  gap: clamp(28px, 5vw, 64px);
}

.blog-dynamic-stream {
  min-width: 0;
}

.dynamic-timeline {
  position: sticky;
  top: 28px;
  max-height: calc(100vh - 56px);
  overflow: auto;
  padding: 12px 22px 12px 0;
  border-right: 1px solid rgb(148 163 184 / 22%);
}

.dynamic-timeline__label {
  color: #4f46e5;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: .14em;
}

.dynamic-timeline__intro {
  margin: 8px 0 0;
  color: #94a3b8;
  font-size: 12px;
  line-height: 1.6;
}

.dynamic-timeline__nav {
  position: relative;
  display: grid;
  gap: 15px;
  margin-top: 22px;
}

.dynamic-timeline__nav::before {
  position: absolute;
  top: 7px;
  bottom: 7px;
  left: 4px;
  width: 1px;
  background: linear-gradient(#c7d2fe, rgb(148 163 184 / 22%));
  content: '';
}

.dynamic-timeline__nav button {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 2px 10px;
  padding: 0 0 0 22px;
  border: 0;
  background: transparent;
  color: #475569;
  cursor: pointer;
  text-align: left;
  transition: color .2s ease, transform .2s ease;
}

.dynamic-timeline__nav button::before {
  position: absolute;
  top: 5px;
  left: 1px;
  width: 7px;
  height: 7px;
  border: 2px solid #818cf8;
  border-radius: 50%;
  background: #f8fafc;
  content: '';
  box-sizing: border-box;
}

.dynamic-timeline__nav button:hover {
  color: #4f46e5;
  transform: translateX(3px);
}

.dynamic-timeline__nav button.is-active {
  color: #4338ca;
}

.dynamic-timeline__nav button.is-active::before {
  border-color: #4f46e5;
  background: #4f46e5;
  box-shadow: 0 0 0 4px rgb(99 102 241 / 12%);
}

.timeline-year {
  grid-column: 1;
  color: #94a3b8;
  font-size: 11px;
  line-height: 1;
}

.dynamic-timeline__nav strong {
  grid-column: 1;
  color: inherit;
  font-size: 15px;
  font-weight: 750;
  line-height: 1.3;
}

.dynamic-timeline__nav small {
  grid-column: 2;
  grid-row: 1 / 3;
  align-self: center;
  color: #94a3b8;
  font-size: 11px;
}

.dynamic-timeline__nav button:hover small {
  color: #6366f1;
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

.dynamic-media-list {
  display: grid;
  gap: 12px;
  margin: 1rem 0;
}

.dynamic-media-list img,
.dynamic-media-list video,
.dynamic-media-list audio {
  width: 100%;
  max-height: 420px;
  object-fit: contain;
}

.media-unavailable {
  padding: 12px;
  color: #64748b;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
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

.comment-website { margin-left: 8px; color: #9b6b3e; font-size: 12px; text-decoration: none; }
.comment-website:hover { color: #2a7180; }

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
  color: var(--blog-comment-text);
  line-height: 1.75;
  overflow-wrap: anywhere;
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

@media (max-width: 900px) {
  .blog-dynamic-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .dynamic-timeline {
    position: static;
    max-height: none;
    overflow: visible;
    padding: 0;
    border-right: 0;
  }

  .dynamic-timeline__nav {
    display: flex;
    gap: 10px;
    margin-top: 14px;
    overflow-x: auto;
    padding-bottom: 6px;
  }

  .dynamic-timeline__nav::before,
  .dynamic-timeline__nav button::before {
    display: none;
  }

  .dynamic-timeline__nav button {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 11px;
    border: 1px solid rgb(148 163 184 / 24%);
    border-radius: 999px;
    background: rgb(255 255 255 / 76%);
  }

  .dynamic-timeline__nav button:hover {
    transform: translateY(-2px);
  }

  .timeline-year {
    font-size: 10px;
  }

  .dynamic-timeline__nav strong {
    font-size: 13px;
  }

  .dynamic-timeline__nav small {
    color: #94a3b8;
    font-size: 10px;
  }
}

@media (max-width: 768px) {
  .blog-dynamic-container.cinematic-page {
    padding-block: 20px 48px;
  }

  .blog-dynamic {
    padding: 1rem;
  }

  .blog-dynamic-hero {
    grid-template-columns: 30px minmax(0, 1fr);
    column-gap: 12px;
    row-gap: 6px;
    margin-bottom: 22px;
  }

  .blog-dynamic-hero::before {
    width: 22px;
    height: 22px;
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
