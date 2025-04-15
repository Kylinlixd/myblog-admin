<template>
  <div class="blog-dynamic">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">动态</h1>
      <p class="page-description">分享我的生活点滴和思考</p>
    </div>

    <!-- 动态列表 -->
    <div class="dynamic-list">
      <div v-for="(item, index) in dynamicList" :key="index" class="dynamic-item">
        <!-- 动态头部 -->
        <div class="dynamic-header">
          <div class="dynamic-meta">
            <span class="dynamic-time">{{ formatDate(item.createTime) }}</span>
            <span class="dynamic-type">{{ item.type }}</span>
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
      <div v-else class="no-more">没有更多内容了</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getDynamicList } from '../../api/blog'
import MarkdownIt from 'markdown-it'
import { ElMessage } from 'element-plus'

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
const fetchDynamicList = async () => {
  if (loading.value) return
  
  loading.value = true
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value
    }
    const response = await getDynamicList(params)
    if (response.code === 200) {
      const { items, total } = response.data
      dynamicList.value = [...dynamicList.value, ...items]
      hasMore.value = dynamicList.value.length < total
    } else {
      ElMessage.error(response.message || '获取动态列表失败')
    }
  } catch (error) {
    ElMessage.error('获取动态列表失败')
    console.error('获取动态列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 加载更多
const loadMore = () => {
  page.value++
  fetchDynamicList()
}

// 点赞
const handleLike = (item) => {
  // TODO: 实现点赞功能
  ElMessage.success('点赞成功')
}

// 评论
const handleComment = (item) => {
  // TODO: 实现评论功能
  ElMessage.info('评论功能开发中')
}

// 初始化
onMounted(() => {
  fetchDynamicList()
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
</style> 