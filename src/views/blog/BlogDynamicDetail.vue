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
      
      <div class="dynamic-body markdown-body" v-html="dynamic.content"></div>
      
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

:deep(.markdown-body a) {
  color: #38bdf8;
  text-decoration: none;
  position: relative;
  z-index: 3;
  cursor: pointer;
}

:deep(.markdown-body a:hover) {
  text-decoration: underline;
}

:deep(.markdown-body button) {
  position: relative;
  z-index: 3;
  cursor: pointer;
}

:deep(.markdown-body input),
:deep(.markdown-body select),
:deep(.markdown-body textarea) {
  position: relative;
  z-index: 3;
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
</style> 