<template>
  <div class="dynamic-detail-container cinematic-page">
    <div v-if="loading" class="loading-state">
      <a-spin />
      <p>加载中...</p>
    </div>
    
    <div v-else-if="!dynamic" class="error-state">
      <p>{{ detailErrorKind === 'not-found' ? '文章不存在或已被删除' : '文章加载失败，请稍后重试' }}</p>
      <a-button v-if="detailErrorKind !== 'not-found'" type="primary" @click="fetchDynamicDetail(route.params.id)">重试</a-button>
    </div>
    
    <div v-else class="article-reading-shell">
      <div class="reading-progress" aria-hidden="true"><span :style="{ width: `${readingProgress}%` }"></span></div>
      <header class="article-header">
        <h1 class="dynamic-title">{{ dynamic.title }}</h1>
        <p v-if="dynamic.summary || dynamic.excerpt" class="article-summary">{{ dynamic.summary || dynamic.excerpt }}</p>
        <div class="dynamic-meta">
          <span class="dynamic-date">{{ formatDate(dynamic.createdAt) }}</span>
          <span>{{ dynamic.views || 0 }} 阅读</span>
          <span aria-label="阅读时长">{{ readingMinutes }} 分钟阅读</span>
          <span v-if="dynamic.category?.name">{{ dynamic.category.name }}</span>
        </div>
      </header>

      <div v-if="tocItems.length" class="mobile-toc-panel">
        <button class="mobile-toc-trigger" type="button" :aria-expanded="tocOpen" aria-controls="mobile-article-toc" @click="tocOpen = !tocOpen">
          <span>目录</span><span>{{ tocOpen ? '收起' : `${tocItems.length} 个章节` }}</span>
        </button>
        <nav v-if="tocOpen" id="mobile-article-toc" class="mobile-toc-list" aria-label="文章目录">
          <button v-for="item in tocItems" :key="item.id" type="button" :class="[`toc-level-${item.level}`, { 'is-active': activeTocId === item.id }]" :aria-current="activeTocId === item.id ? 'location' : undefined" @click="scrollToHeading(item.id)">{{ item.text }}</button>
        </nav>
      </div>

      <div class="article-layout" :class="{ 'article-layout--without-toc': !tocItems.length }">
        <main class="article-main-column">
          <div v-if="topMediaItems.length" class="dynamic-media">
            <template v-for="item in topMediaItems" :key="item.url">
              <div v-if="isMediaUnavailable(item.url)" class="media-unavailable" role="status">该媒体已不可用</div>
              <img v-else-if="item.type === 'image'" class="dynamic-media__image" :src="item.url" :alt="item.name || '动态图片'" loading="lazy" decoding="async" @error="markMediaUnavailable(item.url)" />
              <audio v-else-if="item.type === 'audio'" class="dynamic-media__audio" controls preload="metadata" :src="item.url" @error="markMediaUnavailable(item.url)">您的浏览器不支持音频播放</audio>
              <video v-else-if="item.type === 'video'" class="dynamic-media__video" controls preload="metadata" :src="item.url" :poster="item.posterUrl || undefined" playsinline @error="markMediaUnavailable(item.url)">您的浏览器不支持视频播放</video>
            </template>
          </div>
          <div ref="articleBodyRef" class="dynamic-body markdown-body reading-frame" v-html="renderedArticleContent"></div>

          <section v-if="attachmentItems.length" class="dynamic-attachments" aria-label="附件下载">
            <div class="dynamic-attachments__heading">
              <span>附件下载</span>
              <small>{{ attachmentItems.length }} 个文件</small>
            </div>
            <div class="dynamic-attachments__list">
              <a
                v-for="item in attachmentItems"
                :key="item.url"
                class="dynamic-attachment"
                :href="item.url"
                target="_blank"
                rel="noopener"
                @click.prevent="openMedia(item)"
              >
                <download-outlined />
                <span>{{ item.name || '下载附件' }}</span>
                <small v-if="item.size">{{ formatFileSize(item.size) }}</small>
              </a>
            </div>
          </section>

          <div class="dynamic-footer">
            <div class="dynamic-tags" v-if="dynamic.tags && dynamic.tags.length">
              <span class="tag-label">标签：</span>
              <router-link 
                v-for="tag in dynamic.tags" 
                :key="tag.id"
                :to="`/blog/tags/${tag.id}`"
                class="tag-item"
              >
                {{ tag.name }}
              </router-link>
            </div>
          </div>
          <nav v-if="adjacent.prev || adjacent.next" class="article-adjacent" aria-label="文章导航">
            <router-link
              v-if="adjacent.prev"
              :to="`/blog/dynamics/${adjacent.prev.id}`"
              class="article-adjacent__item article-adjacent__item--prev"
            >
              <span class="article-adjacent__direction"><left-outlined /> 上一篇</span>
              <strong>{{ adjacent.prev.title }}</strong>
              <small>{{ adjacent.prev.category?.name || '继续阅读' }}</small>
            </router-link>
            <span v-else class="article-adjacent__item article-adjacent__item--spacer" aria-hidden="true"></span>
            <router-link
              v-if="adjacent.next"
              :to="`/blog/dynamics/${adjacent.next.id}`"
              class="article-adjacent__item article-adjacent__item--next"
            >
              <span class="article-adjacent__direction">下一篇 <right-outlined /></span>
              <strong>{{ adjacent.next.title }}</strong>
              <small>{{ adjacent.next.category?.name || '继续阅读' }}</small>
            </router-link>
            <span v-else class="article-adjacent__item article-adjacent__item--spacer" aria-hidden="true"></span>
          </nav>
        </main>

        <aside v-if="tocItems.length" class="article-side-column">
          <div class="article-toc">
            <span class="article-toc__cursor" aria-hidden="true"></span>
            <div class="article-toc__label">ON THIS PAGE</div>
            <div class="article-toc__title">目录</div>
            <nav aria-label="文章目录">
              <button v-for="item in tocItems" :key="item.id" type="button" :class="[`toc-level-${item.level}`, { 'is-active': activeTocId === item.id }]" :aria-current="activeTocId === item.id ? 'location' : undefined" @click="scrollToHeading(item.id)">{{ item.text }}</button>
            </nav>
          </div>
        </aside>
      </div>

      <!-- 评论列表 -->
      <div class="comment-section cinematic-card">
        <div class="comment-header">
          <h3>评论 ({{ commentTotal }})</h3>
        </div>
        
        <!-- 评论表单 -->
        <div class="comment-form">
          <CommentComposer :loading="isSubmittingComment" :reset-key="commentComposerResetKey" @submit="submitComment" />
        </div>

        <!-- 评论列表 -->
        <div class="comment-list">
          <div v-if="commentList && commentList.length > 0">
              <CommentThread
                v-for="comment in commentList"
                :key="comment.id"
                :comment="comment"
                @reply="startReply"
              />
          </div>
          <div v-else class="no-comments">
            暂无评论，快来发表第一条评论吧！
          </div>
        </div>

        <div v-if="replyingTo" class="reply-editor">
          <div class="reply-editor__meta">
            <span>回复 @{{ replyingTo.nickname || '匿名用户' }}</span>
            <button class="reply-editor__cancel" type="button" @click="cancelReply">取消</button>
          </div>
          <a-textarea v-model:value="replyContent" :rows="3" :max-length="500" show-count placeholder="请输入回复内容" />
          <a-button type="primary" :loading="isSubmittingComment" @click="submitReply">提交回复</a-button>
        </div>

        <!-- 评论分页 -->
        <div v-if="commentList && commentList.length > 0" class="comment-pagination">
          <a-pagination
            v-model:current="commentPage"
            :total="commentTotal"
            :pageSize="commentPageSize"
            @change="handleCommentPageChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, nextTick, onMounted, onBeforeUnmount, onUpdated, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getBlogDynamicDetail, increaseDynamicView, commentDynamic, getDynamicComments, getAdjacentDynamics } from '@/api/blog'
import { buildApiUrl } from '@/utils/apiBaseUrl'
import { useAppStore } from '@/stores/app'
import dayjs from 'dayjs'
import { DownloadOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons-vue'
import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import css from 'highlight.js/lib/languages/css'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import python from 'highlight.js/lib/languages/python'
import sql from 'highlight.js/lib/languages/sql'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import 'highlight.js/styles/atom-one-light.css'
import { message } from 'ant-design-vue'
import DOMPurify from 'dompurify'
import CommentThread from '@/components/blog/CommentThread.vue'
import CommentComposer from '@/components/blog/CommentComposer.vue'
import { createMarkdownRenderer } from '@/utils/markdownRenderer'
import { bindCodeBlockInteractions } from '@/utils/blogCodeBlocks'
import { collectArticleHeadings, getActiveHeadingId } from '@/utils/articleNavigation'

Object.entries({ bash, css, javascript, json, python, sql, typescript, xml }).forEach(
  ([language, definition]) => hljs.registerLanguage(language, definition)
)

// 创建 Markdown 渲染器
const md = createMarkdownRenderer({
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value
      } catch (__) {}
    }
    return '' // 使用默认的转义
  }
})

// 渲染 Markdown 内容
const renderMarkdown = (content) => {
  if (!content) return ''
  return DOMPurify.sanitize(md.render(content))
}

const route = useRoute()
const appStore = useAppStore()
const dynamic = ref(null)
const renderedArticleContent = computed(() => renderMarkdown(dynamic.value?.content || ''))
const unavailableMediaUrls = ref(new Set())
const adjacent = ref({ prev: null, next: null })

const contentContainsMedia = (url) => {
  const content = dynamic.value?.content || ''
  if (!content || !url) return false
  const path = url.replace(/^https?:\/\/[^/]+/, '')
  return content.includes(url) || content.includes(path)
}

const dynamicMediaItems = computed(() => {
  const media = dynamic.value?.mediaUrls ?? dynamic.value?.media_urls ?? dynamic.value?.files ?? []
  const items = Array.isArray(media) ? media : [media]
  return items.map((item) => {
    const url = buildApiUrl(typeof item === 'string' ? item : item?.url || item?.file_url || '')
    const poster = typeof item === 'string' ? '' : item?.posterUrl || item?.poster_url || ''
    return {
      url,
      posterUrl: poster ? buildApiUrl(poster) : '',
      name: typeof item === 'object' ? item?.name || '' : '',
      type: typeof item === 'object'
        ? item?.type || item?.file_type || dynamic.value?.type || 'other'
        : dynamic.value?.type || 'other',
      size: typeof item === 'object' ? item?.size || item?.file_size || 0 : 0
    }
  }).filter(item => item.url)
})
const visibleDynamicMediaItems = computed(() => dynamicMediaItems.value.filter(
  (item) => item.type !== 'image' || !contentContainsMedia(item.url)
))
const topMediaItems = computed(() => visibleDynamicMediaItems.value.filter(
  (item) => ['image', 'audio', 'video'].includes(item.type)
))
const attachmentItems = computed(() => visibleDynamicMediaItems.value.filter(
  (item) => !['image', 'audio', 'video'].includes(item.type)
))
const dynamicMediaUrls = computed(() => topMediaItems.value.map((item) => item.url))

const formatFileSize = (size) => {
  const value = Number(size) || 0
  if (!value) return ''
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`
  return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`
}
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
const loading = ref(true)
const detailErrorKind = ref('')
let detailRequestSequence = 0
const articleBodyRef = ref(null)
const tocItems = ref([])
const tocOpen = ref(false)
const activeTocId = ref('')
const readingProgress = ref(0)
const readingMinutes = ref(1)

// 评论相关
const commentContent = ref('')
const nickname = ref('')
const email = ref('')
const website = ref('')
const commentComposerResetKey = ref(0)
const isSubmittingComment = ref(false)
const commentList = ref([])
const commentPage = ref(1)
const commentPageSize = ref(10)
const commentTotal = ref(0)
const replyingTo = ref(null)
const replyContent = ref('')

const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

const syncArticleNavigation = async () => {
  await nextTick()
  if (!articleBodyRef.value) return
  tocItems.value = collectArticleHeadings(articleBodyRef.value)
  activeTocId.value = tocItems.value[0]?.id || ''
  bindCodeBlockInteractions(articleBodyRef.value)
}

// The article body is rendered only after the loading branch is removed. Bind
// again after that Vue update so controls are attached to the final v-html DOM.
onUpdated(() => {
  bindCodeBlockInteractions(articleBodyRef.value)
})

const hydrateLazyMedia = async () => {
  await nextTick()
  articleBodyRef.value?.querySelectorAll('img').forEach((image) => {
    image.loading = 'lazy'
    image.decoding = 'async'
  })
}

const updateReadingProgress = () => {
  const element = articleBodyRef.value
  if (!element) return
  const rect = element.getBoundingClientRect()
  const total = Math.max(1, element.offsetHeight - window.innerHeight * 0.65)
  const travelled = Math.min(total, Math.max(0, window.innerHeight * 0.35 - rect.top))
  readingProgress.value = Math.round((travelled / total) * 100)
  if (tocItems.value.length) activeTocId.value = getActiveHeadingId(tocItems.value, getReadingOffset())
}

const getReadingOffset = () => {
  const header = document.querySelector('.site-header-panel')
  return (header?.getBoundingClientRect?.().bottom || 0) + 28
}

const scrollToHeading = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  tocOpen.value = false
}

// 获取评论列表
const fetchComments = async (requestedId = dynamic.value?.id) => {
  const dynamicId = requestedId
  if (!dynamicId) return
  
  try {
    const result = await getDynamicComments(dynamicId, {
      page: commentPage.value,
      pageSize: commentPageSize.value,
      thread: 1
    })
    
    
    if (String(route.params.id) !== String(dynamicId)) return

    if (result && result.code === 200 && result.data) {
      commentList.value = result.data.list || []
      commentTotal.value = result.data.commentTotal ?? result.data.total ?? 0
      commentPageSize.value = result.data.pageSize || 10
    } else {
      console.error('获取评论列表失败:', result?.message)
      message.error('获取评论列表失败')
    }
  } catch (error) {
    console.error('获取评论失败:', error)
    message.error('获取评论失败')
  }
}

const fetchAdjacent = async (requestedId) => {
  try {
    const result = await getAdjacentDynamics(requestedId)
    if (String(route.params.id) !== String(requestedId)) return
    const payload = result?.data || {}
    adjacent.value = {
      prev: payload.prev || null,
      next: payload.next || null
    }
  } catch {
    if (String(route.params.id) === String(requestedId)) {
      adjacent.value = { prev: null, next: null }
    }
  }
}

// 提交评论
const submitComment = async (payload = {}) => {
  if (!dynamic.value) return
  
  try {
    if (isSubmittingComment.value) return
    isSubmittingComment.value = true
    
    const commentData = {
      dynamic_id: dynamic.value.id,
      content: DOMPurify.sanitize(payload.content || commentContent.value),
      nickname: DOMPurify.sanitize(payload.nickname || nickname.value || '匿名用户'),
      email: DOMPurify.sanitize(payload.email || email.value || ''),
      website: DOMPurify.sanitize(payload.website || website.value || ''),
      ...(replyingTo.value ? { parent_id: replyingTo.value.id } : {})
    }
    
    const result = await commentDynamic(dynamic.value.id, commentData)
    
    if (result && result.code === 200) {
      if (result.data?.status === 'pending') {
        message.info('评论已提交，需人工审核后展示，请耐心等待')
      } else {
        message.success('评论已发布')
      }
      commentContent.value = ''
      nickname.value = ''
      email.value = ''
      website.value = ''
      commentComposerResetKey.value += 1
      replyContent.value = ''
      replyingTo.value = null
      commentPage.value = 1
      await fetchComments()
    } else {
      message.error(result?.message || '评论失败')
    }
  } catch (error) {
    if (error?.errorFields) {
      message.error('请检查评论内容')
    } else {
      console.error('评论失败:', error)
      message.error(error.message || error.response?.data?.message || '评论失败，请稍后重试')
    }
  } finally {
    isSubmittingComment.value = false
  }
}

const startReply = (comment) => {
  replyingTo.value = comment
  replyContent.value = ''
}
const cancelReply = () => { replyingTo.value = null; replyContent.value = '' }
const submitReply = async () => {
  const content = replyContent.value.trim()
  if (!replyingTo.value || !content || isSubmittingComment.value) return
  await submitComment({ content, nickname: nickname.value, email: email.value, website: website.value })
}

// 评论分页
const handleCommentPageChange = async (page) => {
  commentPage.value = page
  await fetchComments()
}

const isNotFoundError = (error) => {
  const status = error?.status ?? error?.response?.status ?? error?.code
  return Number(status) === 404
}

const fetchDynamicDetail = async (requestedId = route.params.id) => {
  const dynamicId = String(requestedId || '')
  const requestSequence = ++detailRequestSequence

  dynamic.value = null
  unavailableMediaUrls.value = new Set()
  detailErrorKind.value = ''
  commentList.value = []
  commentTotal.value = 0
  commentPage.value = 1
  adjacent.value = { prev: null, next: null }

  try {
    loading.value = true
    appStore.startLoading('加载文章内容...')

    if (!dynamicId) {
      const error = new Error('缺少文章 ID')
      error.status = 404
      throw error
    }

    const response = await getBlogDynamicDetail(dynamicId)
    if (requestSequence !== detailRequestSequence) return

    if (response?.code !== 200 || !response.data) {
      const error = new Error(response?.message || '获取文章详情失败')
      error.status = Number(response?.code) || 0
      throw error
    }

    dynamic.value = response.data
    const textLength = String(dynamic.value.content || '').replace(/\s+/g, '').length
    readingMinutes.value = Math.max(1, Math.ceil(textLength / 450))
    await syncArticleNavigation()
    await hydrateLazyMedia()
    if (requestSequence !== detailRequestSequence) return

    // 浏览量和评论是附加信息，失败时不阻断正文展示。
    void Promise.allSettled([
      increaseDynamicView(dynamicId),
      fetchComments(dynamicId),
      fetchAdjacent(dynamicId)
    ])
  } catch (error) {
    if (requestSequence !== detailRequestSequence) return
    console.error('获取文章详情失败:', error)
    detailErrorKind.value = isNotFoundError(error) ? 'not-found' : 'load-error'
    appStore.setLoadingError(
      detailErrorKind.value === 'not-found' ? '文章不存在或已被删除' : '文章加载失败，请稍后重试'
    )
  } finally {
    if (requestSequence !== detailRequestSequence) return
    loading.value = false
    appStore.endLoading()
  }
}

watch(() => route.params.id, (nextId, previousId) => {
  if (nextId && nextId !== previousId) fetchDynamicDetail(nextId)
})
onMounted(() => fetchDynamicDetail(route.params.id))
onMounted(() => {
  window.addEventListener('scroll', updateReadingProgress, { passive: true })
  window.addEventListener('resize', updateReadingProgress)
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateReadingProgress)
  window.removeEventListener('resize', updateReadingProgress)
})
</script>

<style scoped>
.dynamic-detail-container {
  width: 100%;
  margin: 0;
  padding: 0;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 3rem;
  color: #666;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.dynamic-content {
  width: 100%;
  max-width: 1040px;
  margin: 0 auto;
  padding: 0 2.5rem 30px;
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 2;
}

.dynamic-header {
  margin: 2rem 0 3rem;
  padding: 2.5rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.dynamic-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, 
    rgba(79, 70, 229, 0.05) 0%,
    rgba(124, 58, 237, 0.05) 50%,
    rgba(219, 39, 119, 0.05) 100%
  );
  z-index: 0;
}

.dynamic-title {
  font-size: 2.2em;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 1.5rem;
  line-height: 1.3;
  position: relative;
  z-index: 1;
  background: linear-gradient(90deg, #1e293b, #334155);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dynamic-meta {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  color: #64748b;
  font-size: 0.95em;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
}

.dynamic-meta span {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dynamic-body {
  width: min(100%, var(--reading-width));
  margin-inline: auto;
  margin-bottom: 3rem;
  padding: clamp(24px, 5vw, 54px);
  background: var(--blog-paper);
  border-radius: 18px;
  box-shadow: 0 18px 50px rgb(92 65 37 / 9%);
  line-height: 1.9;
  color: var(--blog-reading-text);
  position: relative;
  z-index: 2;
  backdrop-filter: blur(10px);
  border: 1px solid var(--blog-line);
}

.dynamic-footer {
  width: min(100%, var(--reading-width));
  margin-inline: auto;
  border-top: 1px solid #eee;
  padding-top: 1.5rem;
  margin-top: 2rem;
}

.dynamic-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.tag-label {
  color: #666;
}

.tag-item {
  display: inline-block;
  padding: 0.2rem 0.8rem;
  background-color: #f3f4f6;
  color: #4b5563;
  border-radius: 9999px;
  font-size: 0.9rem;
  text-decoration: none;
  transition: all 0.2s;
  position: relative;
  z-index: 3;
}

.tag-item:hover {
  background-color: #e5e7eb;
  color: #1f2937;
}

/* Markdown 样式优化 */
:deep(.markdown-body) {
  font-family: "PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif;
  font-size: 18px;
  line-height: 1.9;
  color: var(--blog-reading-text);
  word-wrap: break-word;
  padding: 0;
  width: min(100%, var(--reading-width));
  max-width: 100%;
  box-sizing: border-box;
  position: relative;
  z-index: 2;
}

:deep(.markdown-body h1),
:deep(.markdown-body h2),
:deep(.markdown-body h3),
:deep(.markdown-body h4),
:deep(.markdown-body h5),
:deep(.markdown-body h6) {
  margin-top: 2rem;
  margin-bottom: 1rem;
  font-weight: 600;
  line-height: 1.25;
  color: #1e293b;
  position: relative;
  padding-left: 1rem;
}

:deep(.markdown-body h1) {
  font-size: 1.8em;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 0.5rem;
}

:deep(.markdown-body h2) {
  font-size: 1.5em;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 0.3rem;
}

:deep(.markdown-body h3) {
  font-size: 1.25em;
}

:deep(.markdown-body p) {
  margin-top: 0;
  margin-bottom: 1.35em;
  color: var(--blog-reading-text);
}

:deep(.markdown-body code) {
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 85%;
  background-color: rgba(79, 70, 229, 0.1);
  border-radius: 6px;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  color: #4f46e5;
}

:deep(.markdown-body .blog-code-window .blog-code-content code) {
  background: transparent;
  padding: 28px 24px;
}

:deep(.markdown-body pre:not(.blog-code-window)) {
  margin: 1.5rem 0;
  padding: 1.5rem;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  background-color: #1e293b;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

:deep(.markdown-body pre:not(.blog-code-window) code) {
  padding: 0;
  margin: 0;
  font-size: 100%;
  word-break: normal;
  white-space: pre;
  background: transparent;
  border: 0;
  color: #e2e8f0;
}

:deep(.markdown-body blockquote) {
  padding: 1rem 1.5rem;
  color: #64748b;
  border-left: 4px solid #4f46e5;
  background: rgba(79, 70, 229, 0.05);
  border-radius: 0 8px 8px 0;
  margin: 1.5rem 0;
}

:deep(.markdown-body img) {
  max-width: 100%;
  height: auto;
  margin: 1.5rem 0;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

:deep(.markdown-body table) {
  width: 100%;
  margin: 1.5rem 0;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

:deep(.markdown-body table th),
:deep(.markdown-body table td) {
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
}

:deep(.markdown-body table th) {
  background-color: #f8fafc;
  font-weight: 600;
  color: #1e293b;
}

:deep(.markdown-body table tr:nth-child(even)) {
  background-color: #f8fafc;
}

:deep(.markdown-body ul),
:deep(.markdown-body ol) {
  padding-left: 2rem;
  margin: 1.5rem 0;
}

:deep(.markdown-body li) {
  margin: 0.5rem 0;
  color: #334155;
}

:deep(.markdown-body hr) {
  height: 1px;
  padding: 0;
  margin: 2rem 0;
  background: linear-gradient(to right, transparent, #e2e8f0, transparent);
  border: 0;
}

/* 响应式布局优化 */
@media screen and (min-width: 768px) {
  .dynamic-content {
    padding: 0 30px 40px;
  }

  .dynamic-header {
    padding: 3rem;
  }

  .dynamic-title {
    font-size: 2.5em;
  }
}

@media screen and (min-width: 1200px) {
  .dynamic-content {
    padding: 0 40px 40px;
  }

  .dynamic-header {
    padding: 3.5rem;
  }

  .dynamic-title {
    font-size: 2.8em;
  }
}

@media screen and (max-width: 767px) {
  .dynamic-header {
    padding: 1.5rem;
    margin: 1rem 0 2rem;
  }

  .dynamic-title {
    font-size: 1.8em;
  }

  .dynamic-meta {
    gap: 1rem;
  }

  .dynamic-content {
    padding: 0 1.5rem 20px;
  }

  .dynamic-body {
    padding: 1.5rem;
  }

    :deep(.markdown-body) {
      padding: 0;
      font-size: 16px;
  }
}

/* 代码高亮样式优化 */
:deep(.hljs) {
  display: block;
  overflow-x: auto;
  padding: 0.5em;
  color: #24292e;
  background: #f6f8fa;
}

:deep(.hljs-comment),
:deep(.hljs-quote) {
  color: #6a737d;
  font-style: italic;
}

:deep(.hljs-keyword),
:deep(.hljs-selector-tag),
:deep(.hljs-subst) {
  color: #d73a49;
}

:deep(.hljs-literal),
:deep(.hljs-number),
:deep(.hljs-tag .hljs-attr),
:deep(.hljs-template-variable),
:deep(.hljs-variable) {
  color: #005cc5;
}

:deep(.hljs-string),
:deep(.hljs-doctag) {
  color: #1890ff;
}

:deep(.hljs-title),
:deep(.hljs-section),
:deep(.hljs-selector-id) {
  color: #6f42c1;
  font-weight: bold;
}

:deep(.hljs-subst) {
  font-weight: normal;
}

:deep(.hljs-type),
:deep(.hljs-class .hljs-title) {
  color: #6f42c1;
  font-weight: bold;
}

:deep(.hljs-tag),
:deep(.hljs-name),
:deep(.hljs-attribute) {
  color: #22863a;
  font-weight: normal;
}

:deep(.hljs-regexp),
:deep(.hljs-link) {
  color: #1890ff;
}

:deep(.hljs-symbol),
:deep(.hljs-bullet) {
  color: #005cc5;
}

:deep(.hljs-built_in),
:deep(.hljs-builtin-name) {
  color: #6f42c1;
}

:deep(.hljs-meta) {
  color: #6a737d;
  font-weight: bold;
}

:deep(.hljs-deletion) {
  background: #ffeef0;
}

:deep(.hljs-addition) {
  background: #e6ffed;
}

:deep(.hljs-emphasis) {
  font-style: italic;
}

:deep(.hljs-strong) {
  font-weight: bold;
}

/* 评论区域样式 */
.comment-section {
  width: min(100%, var(--reading-width));
  margin: 40px auto 0;
  padding: clamp(20px, 4vw, 32px);
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.comment-header {
  margin-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 10px;
}

.comment-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.comment-form {
  margin-bottom: 30px;
}

.comment-list {
  margin-bottom: 20px;
}

.comment-item {
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
}

.comment-user {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.comment-user .nickname {
  margin-left: 8px;
  font-weight: 500;
  color: #333;
}

.comment-user .time {
  margin-left: 12px;
  color: #999;
  font-size: 12px;
}

.comment-content {
  color: var(--blog-comment-text);
  line-height: 1.75;
  overflow-wrap: anywhere;
}

.no-comments {
  text-align: center;
  color: #999;
  padding: 20px 0;
}

.reply-editor {
  display: grid;
  gap: 12px;
  margin-top: 22px;
  padding: 18px;
  border: 1px solid var(--article-line);
  border-radius: 16px;
  background: #fcf7ef;
}

.reply-editor__meta {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--article-muted);
  font-size: 13px;
  line-height: 1.5;
}

.reply-editor__cancel {
  margin-left: auto;
  padding: 6px 10px;
  border: 1px solid #e4cdb8;
  border-radius: 999px;
  background: #fffaf3;
  color: #9b5e2f;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  transition: background-color .2s ease, border-color .2s ease, color .2s ease, box-shadow .2s ease;
}

.reply-editor__cancel:hover,
.reply-editor__cancel:focus-visible {
  background: #f1e2d1;
  border-color: #d9ae88;
  color: #9b5e2f;
  box-shadow: 0 3px 10px rgb(155 94 47 / 10%);
}

.reply-editor > :deep(.ant-btn) {
  justify-self: start;
  border-radius: 10px;
  border-color: #a96436;
  background: #a96436;
  box-shadow: none;
}

    .comment-pagination {
      text-align: center;
      margin-top: 20px;
    }

    .article-reading-shell {
      --article-ink: #17263d;
      --article-muted: #718096;
      --article-paper: #fffdf8;
      --article-line: #e9e3d8;
      width: min(1180px, calc(100% - 32px));
      margin: 0 auto;
      padding: 0 0 72px;
      color: var(--article-ink);
      position: relative;
    }

    .reading-progress {
      position: fixed;
      inset: 0 0 auto;
      z-index: 30;
      height: 3px;
      background: rgb(226 232 240 / 40%);
    }

    .reading-progress span {
      display: block;
      height: 100%;
      background: linear-gradient(90deg, #d98b38, #2a7180);
      transition: width .18s ease-out;
    }

    .article-header {
      max-width: 880px;
      margin: clamp(34px, 6vw, 68px) auto 36px;
      padding: clamp(26px, 4vw, 52px);
      border: 1px solid var(--article-line);
      border-radius: 28px;
      background:
        radial-gradient(circle at 90% 0%, rgb(42 113 128 / 13%), transparent 34%),
        linear-gradient(135deg, #fffdf8, #f7efe4);
      box-shadow: 0 26px 70px rgb(88 65 37 / 12%);
      animation: article-enter .6s ease both;
    }

    .article-toc__label {
      color: #a66b28;
      font: 700 11px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
      letter-spacing: .14em;
      text-transform: uppercase;
    }

    .article-header .dynamic-title {
      margin: 18px 0 16px;
      color: var(--article-ink);
      font-size: clamp(2rem, 4vw, 3.7rem);
      font-weight: 780;
      letter-spacing: -.055em;
      line-height: 1.04;
      text-shadow: none;
      background: none;
      -webkit-text-fill-color: currentColor;
    }

    .article-summary {
      max-width: 680px;
      margin: 0 0 24px;
      color: #536277;
      font-size: clamp(1rem, 2vw, 1.15rem);
      line-height: 1.75;
    }

    .article-header .dynamic-meta {
      gap: 8px;
      color: var(--article-muted, #64748b);
      font-size: 13px;
    }

    .article-header .dynamic-meta span {
      padding: 7px 11px;
      border: 1px solid rgb(127 147 151 / 22%);
      border-radius: 999px;
      background: rgb(255 255 255 / 62%);
    }

    .article-layout {
      display: grid;
      grid-template-columns: minmax(0, 780px) 220px;
      gap: clamp(32px, 4vw, 52px);
      align-items: start;
      justify-content: center;
    }

    .article-layout--without-toc {
      grid-template-columns: minmax(0, 780px);
    }

    .article-main-column { min-width: 0; }

    .dynamic-media {
      display: grid;
      gap: 16px;
      margin-bottom: 22px;
    }

    .dynamic-media__image,
    .dynamic-media__video {
      display: block;
      width: 100%;
      aspect-ratio: 16 / 9;
      object-fit: contain;
      max-height: min(68vh, 680px);
      border: 1px solid var(--article-line);
      border-radius: 22px;
      background: #10243a;
      box-shadow: 0 20px 52px rgb(88 65 37 / 9%);
    }

    .dynamic-media__audio { width: 100%; }

    .dynamic-media__file,
    .media-unavailable {
      padding: 14px;
      border: 1px dashed var(--article-line);
      border-radius: 10px;
      color: var(--article-muted);
    }

    .article-main-column .dynamic-body {
      width: 100%;
      margin: 0;
      padding: clamp(28px, 5vw, 62px);
      border: 1px solid var(--article-line);
      border-radius: 22px;
      background: var(--article-paper);
      box-shadow: 0 20px 52px rgb(88 65 37 / 9%);
    }

    .dynamic-attachments {
      width: min(100%, 780px);
      margin: 22px 0 0;
      padding: 18px;
      border: 1px dashed var(--article-line);
      border-radius: 18px;
      background: rgb(255 253 248 / 76%);
    }

    .dynamic-attachments__heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;
      color: var(--article-ink);
      font-size: 14px;
      font-weight: 750;
    }

    .dynamic-attachments__heading small {
      color: var(--article-muted);
      font-size: 11px;
      font-weight: 500;
    }

    .dynamic-attachments__list {
      display: grid;
      gap: 8px;
    }

    .dynamic-attachment {
      display: flex;
      min-width: 0;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      border: 1px solid var(--article-line);
      border-radius: 12px;
      background: var(--article-paper);
      color: var(--article-ink);
      text-decoration: none;
      transition: border-color .2s ease, box-shadow .2s ease, transform .2s ease;
    }

    .dynamic-attachment:hover,
    .dynamic-attachment:focus-visible {
      border-color: #d98b38;
      box-shadow: 0 12px 28px rgb(88 65 37 / 11%);
      transform: translateY(-1px);
    }

    .dynamic-attachment > span {
      min-width: 0;
      overflow: hidden;
      font-size: 14px;
      font-weight: 600;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .dynamic-attachment small {
      margin-left: auto;
      color: var(--article-muted);
      font-size: 11px;
      white-space: nowrap;
    }

    .article-main-column .dynamic-footer {
      width: 100%;
      margin-top: 22px;
      border-top-color: var(--article-line);
    }

    .article-adjacent {
      display: grid;
      width: min(100%, 780px);
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
      margin: 28px 0 0;
    }

    .article-adjacent__item {
      position: relative;
      display: flex;
      min-height: 126px;
      flex-direction: column;
      justify-content: center;
      overflow: hidden;
      padding: 17px 20px;
      border: 1px solid var(--article-line);
      border-radius: 18px;
      background: var(--article-paper);
      box-shadow: 0 14px 38px rgb(88 65 37 / 8%);
      color: var(--article-ink);
      text-decoration: none;
      transition: transform .24s ease, border-color .24s ease, box-shadow .24s ease;
    }

    .article-adjacent__item--next { align-items: flex-end; text-align: right; }
    .article-adjacent__item--spacer { pointer-events: none; box-shadow: none; opacity: 0; }

    .article-adjacent__item:hover,
    .article-adjacent__item:focus-visible {
      border-color: #d98b38;
      box-shadow: 0 18px 42px rgb(88 65 37 / 13%);
      transform: translateY(-3px);
    }

    .article-adjacent__direction {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 10px;
      color: #a66b28;
      font-size: 11px;
      font-weight: 750;
      letter-spacing: .1em;
    }

    .article-adjacent__item--next .article-adjacent__direction { justify-content: flex-end; }
    .article-adjacent__item strong {
      display: -webkit-box;
      max-width: 100%;
      overflow: hidden;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: -.015em;
      line-height: 1.45;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }

    .article-adjacent__item small {
      margin-top: 9px;
      color: var(--article-muted);
      font-size: 12px;
    }

    .article-side-column {
      position: sticky;
      top: 92px;
      max-height: calc(100vh - 112px);
    }

    .article-toc {
      position: relative;
      max-height: inherit;
      overflow: auto;
      padding: 18px 0 18px 22px;
    }

    .article-toc::before {
      position: absolute;
      inset: 18px auto 18px 0;
      width: 1px;
      background: var(--article-line);
      content: '';
    }

    .article-toc__cursor {
      position: absolute;
      z-index: 1;
      top: 18px;
      left: -1px;
      width: 3px;
      height: 25px;
      border-radius: 999px;
      background: #c66b32;
      box-shadow: 0 0 0 4px rgb(198 107 50 / 12%);
      opacity: 1;
      transform: translateY(0);
      transition: opacity .25s ease, transform .3s ease;
    }

    .article-toc__title {
      margin: 8px 0 16px;
      font-size: 18px;
      font-weight: 750;
    }

    .article-toc nav,
    .mobile-toc-list {
      display: grid;
      gap: 4px;
    }

    .article-toc button,
    .mobile-toc-list button {
      position: relative;
      width: 100%;
      padding: 7px 8px;
      border: 0;
      border-radius: 7px;
      background: transparent;
      color: #748092;
      cursor: pointer;
      font-size: 12px;
      line-height: 1.4;
      text-align: left;
      transition: color .2s ease, background .2s ease;
    }

    .article-toc button:hover,
    .mobile-toc-list button:hover {
      background: #f6eee3;
      color: #a66b28;
    }

    .article-toc button.is-active,
    .mobile-toc-list button.is-active {
      background: #fbf1e4;
      color: #9b5e2f;
      font-weight: 700;
    }

    .article-toc button.is-active::before {
      position: absolute;
      top: 50%;
      left: -22px;
      width: 3px;
      height: 22px;
      border-radius: 999px;
      background: #c66b32;
      box-shadow: 0 0 0 4px rgb(198 107 50 / 10%);
      content: '';
      transform: translateY(-50%);
    }


    .article-toc .toc-level-3,
    .mobile-toc-list .toc-level-3 { padding-left: 20px; }
    .article-toc .toc-level-4,
    .mobile-toc-list .toc-level-4 { padding-left: 32px; font-size: 11px; }

    .toc-empty { color: #9aa5b1; font-size: 12px; }

    .mobile-toc-panel { display: none; }

    .article-main-column :deep(.markdown-body) {
      width: 100%;
      max-width: 100%;
      font-size: clamp(16px, 1.35vw, 18px);
      line-height: 1.95;
      color: var(--article-ink);
    }

    .article-main-column :deep(.markdown-body h1),
    .article-main-column :deep(.markdown-body h2),
    .article-main-column :deep(.markdown-body h3),
    .article-main-column :deep(.markdown-body h4) {
      scroll-margin-top: 28px;
      padding-left: 0;
      border: 0;
      color: var(--article-ink);
      letter-spacing: -.025em;
    }

    .article-main-column :deep(.markdown-body h2) {
      margin-top: 2.8em;
      font-size: 1.55em;
    }

    .article-main-column :deep(.markdown-body h3) {
      margin-top: 2.2em;
      font-size: 1.22em;
    }

    .article-main-column :deep(.markdown-body p) { color: #26364d; }
    .article-main-column :deep(.markdown-body a) { color: #176b79; text-underline-offset: 3px; }
    .article-main-column :deep(.markdown-body blockquote) {
      border-left: 3px solid #d98b38;
      background: #fbf3e8;
      color: #596779;
    }
    .article-main-column :deep(.markdown-body table) { display: block; overflow-x: auto; }
    .article-main-column :deep(.markdown-body img) { display: block; margin-inline: auto; }

    @keyframes article-enter {
      from { opacity: 0; transform: translateY(14px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 900px) {
      .article-layout { grid-template-columns: minmax(0, 1fr); }
      .article-side-column { display: none; }
      .mobile-toc-panel {
        display: block;
        margin: 0 auto 20px;
        max-width: 780px;
        border: 1px solid var(--article-line);
        border-radius: 13px;
        background: var(--article-paper);
      }
      .mobile-toc-trigger {
        display: flex;
        width: 100%;
        justify-content: space-between;
        padding: 13px 16px;
        border: 0;
        background: transparent;
        color: var(--article-ink);
        cursor: pointer;
        font-weight: 700;
      }
      .mobile-toc-trigger span:last-child { color: var(--article-muted); font-size: 12px; font-weight: 500; }
      .mobile-toc-list { padding: 0 12px 12px; }
    }

    @media (max-width: 768px) {
      .article-reading-shell { width: min(100% - 20px, 780px); padding-bottom: 36px; }
      .article-header { margin: 24px auto 20px; padding: 25px 20px; border-radius: 20px; }
      .article-header .dynamic-title { font-size: clamp(1.65rem, 8.6vw, 2.6rem); letter-spacing: -.045em; }
      .article-header .dynamic-meta span { padding: 6px 9px; }
      .article-main-column .dynamic-body { padding: 25px 20px; border-radius: 16px; }
      .article-adjacent { grid-template-columns: minmax(0, 1fr); }
      .article-adjacent__item--next { align-items: flex-start; text-align: left; }
      .article-adjacent__item--next .article-adjacent__direction { justify-content: flex-start; }
      .comment-section { width: 100%; padding: 22px 18px; }
      .comment-form .ant-input, .comment-form .ant-input-affix-wrapper, .comment-form textarea { max-width: 100%; }
    }

    @media (prefers-reduced-motion: reduce) {
      .article-header { animation: none; }
      .reading-progress span, .article-toc button, .mobile-toc-list button { transition: none; }
      html { scroll-behavior: auto; }
    }
</style>
