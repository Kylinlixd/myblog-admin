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
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getBlogDynamicDetail, increaseDynamicView } from '@/api/blog'
import { useAppStore } from '@/stores/app'
import dayjs from 'dayjs'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-light.css'

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

const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
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
  background: #fff;
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
  margin: 0;
  padding: 0 15px 30px;
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 2;
}

.dynamic-header {
  margin-bottom: 2rem;
  padding: 30px 15px;
  background: linear-gradient(135deg, #f6f8fa 0%, #ffffff 100%);
  border-bottom: 1px solid #eaecef;
}

.dynamic-title {
  font-size: 2em;
  font-weight: bold;
  color: #1a1a1a;
  margin-bottom: 15px;
  line-height: 1.3;
}

.dynamic-meta {
  display: flex;
  align-items: center;
  gap: 15px;
  color: #666;
  font-size: 0.9em;
  flex-wrap: wrap;
}

.dynamic-body {
  margin-bottom: 3rem;
  line-height: 1.8;
  color: #333;
  position: relative;
  z-index: 2;
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
  color: #24292e;
  word-wrap: break-word;
  padding: 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  position: relative;
  z-index: 2;
}

:deep(.markdown-body > *) {
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
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
  color: #1a1a1a;
  width: 100%;
}

:deep(.markdown-body h1) {
  font-size: 1.8em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
}

:deep(.markdown-body h2) {
  font-size: 1.5em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
}

:deep(.markdown-body h3) {
  font-size: 1.25em;
}

:deep(.markdown-body p) {
  margin-top: 0;
  margin-bottom: 16px;
  width: 100%;
}

:deep(.markdown-body code) {
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 85%;
  background-color: rgba(27, 31, 35, 0.05);
  border-radius: 3px;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  color: #24292e;
}

:deep(.markdown-body pre) {
  margin-top: 0;
  margin-bottom: 16px;
  padding: 16px;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  background-color: #f6f8fa;
  border-radius: 3px;
  width: 100%;
  box-sizing: border-box;
}

:deep(.markdown-body pre code) {
  padding: 0;
  margin: 0;
  font-size: 100%;
  word-break: normal;
  white-space: pre;
  background: transparent;
  border: 0;
  width: 100%;
  display: block;
  color: #24292e;
}

:deep(.markdown-body blockquote) {
  padding: 0 1em;
  color: #6a737d;
  border-left: 0.25em solid #dfe2e5;
  margin: 0 0 16px 0;
  width: 100%;
  box-sizing: border-box;
}

:deep(.markdown-body img) {
  max-width: 100%;
  height: auto;
  margin: 16px 0;
  border-radius: 4px;
  display: block;
}

:deep(.markdown-body table) {
  display: block;
  width: 100%;
  overflow: auto;
  margin-top: 0;
  margin-bottom: 16px;
  border-spacing: 0;
  border-collapse: collapse;
}

:deep(.markdown-body table th),
:deep(.markdown-body table td) {
  padding: 6px 13px;
  border: 1px solid #dfe2e5;
}

:deep(.markdown-body table tr) {
  background-color: #fff;
  border-top: 1px solid #c6cbd1;
}

:deep(.markdown-body table tr:nth-child(2n)) {
  background-color: #f6f8fa;
}

:deep(.markdown-body ul),
:deep(.markdown-body ol) {
  padding-left: 2em;
  margin-top: 0;
  margin-bottom: 16px;
  width: 100%;
  box-sizing: border-box;
}

:deep(.markdown-body li) {
  margin-top: 0.25em;
}

:deep(.markdown-body hr) {
  height: 0.25em;
  padding: 0;
  margin: 24px 0;
  background-color: #e1e4e8;
  border: 0;
  width: 100%;
}

/* 响应式布局 */
@media screen and (min-width: 768px) {
  .dynamic-content {
    padding: 0 30px 40px;
  }

  .dynamic-header {
    padding: 40px 30px;
  }

  .dynamic-title {
    font-size: 2.2em;
  }
}

@media screen and (min-width: 1200px) {
  .dynamic-content {
    padding: 0 40px 40px;
  }

  .dynamic-header {
    padding: 50px 40px;
  }

  .dynamic-title {
    font-size: 2.5em;
  }
}

@media screen and (max-width: 767px) {
  .dynamic-header {
    padding: 20px 15px;
  }

  .dynamic-title {
    font-size: 1.8em;
  }

  .dynamic-meta {
    gap: 12px;
  }

  .dynamic-content {
    padding: 0 15px 20px;
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
  color: #032f62;
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
  color: #032f62;
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
</style> 