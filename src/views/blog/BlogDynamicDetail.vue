<template>
  <div class="dynamic-detail-container cinematic-page">
    <div v-if="loading" class="loading-state">
      <a-spin />
      <p>加载中...</p>
    </div>
    
    <div v-else-if="!dynamic" class="error-state">
      <p>文章不存在或已被删除</p>
    </div>
    
    <div v-else class="article-reading-shell">
      <div class="reading-progress" aria-hidden="true"><span :style="{ width: `${readingProgress}%` }"></span></div>
      <header class="article-header">
        <div class="article-kicker">{{ dynamic.type || 'TECH NOTE' }} · DIGITAL GARDEN</div>
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
        <button class="mobile-toc-trigger" type="button" @click="tocOpen = !tocOpen">
          <span>目录</span><span>{{ tocOpen ? '收起' : `${tocItems.length} 个章节` }}</span>
        </button>
        <nav v-if="tocOpen" class="mobile-toc-list" aria-label="文章目录">
          <button v-for="item in tocItems" :key="item.id" type="button" :class="`toc-level-${item.level}`" @click="scrollToHeading(item.id)">{{ item.text }}</button>
        </nav>
      </div>

      <div class="article-layout" :class="{ 'article-layout--without-toc': !tocItems.length }">
        <main class="article-main-column">
          <div v-if="dynamic.type === 'video' && dynamicMediaUrls.length" class="dynamic-video">
            <video
              v-for="url in dynamicMediaUrls"
              :key="url"
              class="dynamic-video__player"
              controls
              preload="metadata"
              :src="url"
            >
              您的浏览器不支持视频播放
            </video>
          </div>
          <div ref="articleBodyRef" class="dynamic-body markdown-body reading-frame" v-html="renderMarkdown(dynamic.content)"></div>

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
        </main>

        <aside v-if="tocItems.length" class="article-side-column">
          <div class="article-toc">
            <div class="article-toc__label">ON THIS PAGE</div>
            <div class="article-toc__title">目录</div>
            <nav aria-label="文章目录">
              <button v-for="item in tocItems" :key="item.id" type="button" :class="`toc-level-${item.level}`" @click="scrollToHeading(item.id)">{{ item.text }}</button>
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
                :loading="isSubmittingComment"
                @click="submitComment"
              >
                发表评论
              </a-button>
            </a-form-item>
          </a-form>
        </div>

        <!-- 评论列表 -->
        <div class="comment-list">
          <div v-if="commentList && commentList.length > 0">
            <div
              v-for="comment in commentList"
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
import { computed, ref, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { getBlogDynamicDetail, increaseDynamicView, commentDynamic, getDynamicComments } from '@/api/blog'
import { buildApiUrl } from '@/utils/apiBaseUrl'
import { useAppStore } from '@/stores/app'
import dayjs from 'dayjs'
import MarkdownIt from 'markdown-it'
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

Object.entries({ bash, css, javascript, json, python, sql, typescript, xml }).forEach(
  ([language, definition]) => hljs.registerLanguage(language, definition)
)

// 创建 Markdown 渲染器
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
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
const dynamicMediaUrls = computed(() => {
  const media = dynamic.value?.mediaUrls ?? dynamic.value?.media_urls ?? dynamic.value?.files ?? []
  const items = Array.isArray(media) ? media : [media]
  return items
    .map((item) => buildApiUrl(typeof item === 'string' ? item : item?.url || item?.file_url || ''))
    .filter(Boolean)
})
const loading = ref(true)
const articleBodyRef = ref(null)
const tocItems = ref([])
const tocOpen = ref(false)
const readingProgress = ref(0)
const readingMinutes = ref(1)

// 评论相关
const commentForm = ref(null)
const commentContent = ref('')
const nickname = ref('')
const email = ref('')
const isSubmittingComment = ref(false)
const commentList = ref([])
const commentPage = ref(1)
const commentPageSize = ref(10)
const commentTotal = ref(0)

// 评论表单验证规则
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

const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

const syncArticleNavigation = async () => {
  await nextTick()
  if (!articleBodyRef.value) return
  const headings = [...articleBodyRef.value.querySelectorAll('h2, h3')]
  tocItems.value = headings.map((heading, index) => {
    const id = `article-heading-${index + 1}`
    heading.id = id
    return { id, level: heading.tagName === 'H2' ? 2 : 3, text: heading.textContent?.trim() || `章节 ${index + 1}` }
  })
}

const updateReadingProgress = () => {
  const element = articleBodyRef.value
  if (!element) return
  const rect = element.getBoundingClientRect()
  const total = Math.max(1, element.offsetHeight - window.innerHeight * 0.65)
  const travelled = Math.min(total, Math.max(0, window.innerHeight * 0.35 - rect.top))
  readingProgress.value = Math.round((travelled / total) * 100)
}

const scrollToHeading = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  tocOpen.value = false
}

// 获取评论列表
const fetchComments = async () => {
  if (!dynamic.value) return
  
  try {
    const result = await getDynamicComments(dynamic.value.id, {
      page: commentPage.value,
      pageSize: commentPageSize.value
    })
    
    
    if (result && result.code === 200 && result.data) {
      commentList.value = result.data.list || []
      commentTotal.value = result.data.total || 0
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

// 提交评论
const submitComment = async () => {
  if (!dynamic.value) return
  
  try {
    await commentForm.value.validate()
    
    if (isSubmittingComment.value) return
    isSubmittingComment.value = true
    
    const commentData = {
      dynamic_id: dynamic.value.id,
      content: DOMPurify.sanitize(commentContent.value),
      nickname: DOMPurify.sanitize(nickname.value || '匿名用户'),
      email: DOMPurify.sanitize(email.value || '')
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
      commentPage.value = 1
      await fetchComments()
    } else {
      message.error(result?.message || '评论失败')
    }
  } catch (error) {
    if (error.errorFields) {
      message.error('请检查评论内容')
    } else {
      console.error('评论失败:', error)
      message.error(error.message || error.response?.data?.message || '评论失败，请稍后重试')
    }
  } finally {
    isSubmittingComment.value = false
  }
}

// 评论分页
const handleCommentPageChange = async (page) => {
  commentPage.value = page
  await fetchComments()
}

const fetchDynamicDetail = async () => {
  try {
    loading.value = true
    appStore.startLoading('加载文章内容...')
    
    const dynamicId = route.params.id
    const response = await getBlogDynamicDetail(dynamicId)
    
        if (response.code === 200) {
          dynamic.value = response.data
          const textLength = String(dynamic.value.content || '').replace(/\s+/g, '').length
          readingMinutes.value = Math.max(1, Math.ceil(textLength / 450))
          await syncArticleNavigation()
      // 增加阅读量
      await increaseDynamicView(dynamicId)
      // 加载评论列表
      await fetchComments()
    } else {
      console.error('获取文章详情失败:', response.message)
      appStore.setLoadingError('获取文章详情失败，请刷新重试')
    }
  } catch (error) {
    console.error('获取文章详情失败:', error)
    appStore.setLoadingError('获取文章详情失败，请刷新重试')
  } finally {
    loading.value = false
    appStore.endLoading()
  }
}

onMounted(fetchDynamicDetail)
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

:deep(.markdown-body pre) {
  margin: 1.5rem 0;
  padding: 1.5rem;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  background-color: #1e293b;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

:deep(.markdown-body pre code) {
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
      margin: clamp(42px, 8vw, 92px) auto 44px;
      padding: clamp(28px, 5vw, 64px);
      border: 1px solid var(--article-line);
      border-radius: 28px;
      background:
        radial-gradient(circle at 90% 0%, rgb(42 113 128 / 13%), transparent 34%),
        linear-gradient(135deg, #fffdf8, #f7efe4);
      box-shadow: 0 26px 70px rgb(88 65 37 / 12%);
      animation: article-enter .6s ease both;
    }

    .article-kicker,
    .article-toc__label {
      color: #a66b28;
      font: 700 11px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
      letter-spacing: .14em;
      text-transform: uppercase;
    }

    .article-header .dynamic-title {
      margin: 18px 0 16px;
      color: var(--article-ink);
      font-size: clamp(2.15rem, 5vw, 4.6rem);
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
      color: var(--article-muted);
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
      gap: clamp(28px, 5vw, 72px);
      align-items: start;
      justify-content: center;
    }

    .article-layout--without-toc {
      grid-template-columns: minmax(0, 780px);
    }

    .article-main-column { min-width: 0; }

    .dynamic-video {
      display: grid;
      gap: 16px;
      margin-bottom: 22px;
    }

    .dynamic-video__player {
      display: block;
      width: 100%;
      max-height: min(68vh, 680px);
      border: 1px solid var(--article-line);
      border-radius: 22px;
      background: #10243a;
      box-shadow: 0 20px 52px rgb(88 65 37 / 9%);
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

    .article-main-column .dynamic-footer {
      width: 100%;
      margin-top: 22px;
      border-top-color: var(--article-line);
    }

    .article-side-column {
      position: sticky;
      top: 34px;
    }

    .article-toc {
      padding: 18px 0 18px 18px;
      border-left: 1px solid var(--article-line);
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

    .article-toc .toc-level-3,
    .mobile-toc-list .toc-level-3 { padding-left: 20px; }

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
    .article-main-column :deep(.markdown-body pre) {
      border: 1px solid #263f5b;
      border-radius: 14px;
      box-shadow: 0 14px 30px rgb(25 47 72 / 15%);
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
      .article-header .dynamic-title { font-size: clamp(2rem, 11vw, 3.1rem); }
      .article-header .dynamic-meta span { padding: 6px 9px; }
      .article-main-column .dynamic-body { padding: 25px 20px; border-radius: 16px; }
      .comment-section { width: 100%; padding: 22px 18px; }
      .comment-form .ant-input, .comment-form .ant-input-affix-wrapper, .comment-form textarea { max-width: 100%; }
    }

    @media (prefers-reduced-motion: reduce) {
      .article-header { animation: none; }
      .reading-progress span, .article-toc button, .mobile-toc-list button { transition: none; }
      html { scroll-behavior: auto; }
    }
</style>
