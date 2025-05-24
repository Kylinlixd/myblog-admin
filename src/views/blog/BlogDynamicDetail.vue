<template>
  <div class="dynamic-detail-container">
    <div v-if="loading" class="loading-state">
      <a-spin />
      <p>加载中...</p>
    </div>
    
    <div v-else-if="!dynamic" class="error-state">
      <p>文章不存在或已被删除</p>
    </div>
    
    <div v-else class="dynamic-content">
      <div class="dynamic-header">
        <h1 class="dynamic-title">{{ dynamic.title }}</h1>
        <div class="dynamic-meta">
          <span class="dynamic-date">{{ formatDate(dynamic.createdAt) }}</span>
          <span class="dynamic-views">{{ dynamic.views }} 阅读</span>
        </div>
      </div>
      
      <div class="dynamic-body markdown-body" v-html="renderMarkdown(dynamic.content)"></div>
      
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

      <!-- 评论列表 -->
      <div class="comment-section">
        <div class="comment-header">
          <h3>评论 ({{ dynamic.comments || 0 }})</h3>
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
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getBlogDynamicDetail, increaseDynamicView, commentDynamic, getDynamicComments } from '@/api/blog'
import { useAppStore } from '@/stores/app'
import dayjs from 'dayjs'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-light.css'
import { message } from 'ant-design-vue'

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
  return md.render(content || '')
}

const route = useRoute()
const appStore = useAppStore()
const dynamic = ref(null)
const loading = ref(true)

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

// 获取评论列表
const fetchComments = async () => {
  if (!dynamic.value) return
  
  try {
    const result = await getDynamicComments(dynamic.value.id, {
      page: commentPage.value,
      pageSize: commentPageSize.value
    })
    
    console.log('获取评论列表响应:', result)
    
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
    // 验证表单
    await commentForm.value.validate()
    
    if (isSubmittingComment.value) return
    isSubmittingComment.value = true
    
    const commentData = {
      dynamic_id: dynamic.value.id,
      content: commentContent.value,
      nickname: nickname.value || '匿名用户',
      email: email.value || ''
    }
    
    console.log('提交评论数据:', commentData)
    
    const result = await commentDynamic(dynamic.value.id, commentData)
    
    if (result && result.code === 200) {
      message.success('评论成功')
      // 清空表单
      commentContent.value = ''
      nickname.value = ''
      email.value = ''
      // 重新获取评论列表
      commentPage.value = 1
      await fetchComments()
      // 更新评论数
      dynamic.value.comments = (dynamic.value.comments || 0) + 1
    } else {
      message.error(result?.message || '评论失败')
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

onMounted(() => {
  fetchDynamicDetail()
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
  max-width: 900px;
  margin: 0 auto;
  padding: 0 15px 30px;
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
  margin-bottom: 3rem;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  line-height: 1.8;
  color: #334155;
  position: relative;
  z-index: 2;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.dynamic-footer {
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
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 1.8;
  color: #334155;
  word-wrap: break-word;
  padding: 0;
  width: 100%;
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
  margin-bottom: 1.5rem;
  color: #334155;
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
    padding: 0 15px 20px;
  }

  .dynamic-body {
    padding: 1.5rem;
  }

  :deep(.markdown-body) {
    font-size: 15px;
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
  margin-top: 40px;
  padding: 20px;
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
  color: #666;
  line-height: 1.6;
  word-break: break-all;
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
</style> 