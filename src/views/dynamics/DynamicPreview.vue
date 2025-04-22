<template>
  <div class="dynamic-preview">
    <div class="preview-header">
      <h2>动态预览</h2>
      <a-button @click="handleClose">
        <template #icon><close-outlined /></template>关闭
      </a-button>
    </div>
    
    <a-card class="preview-card">
      <div class="preview-content">
        <!-- Markdown内容 -->
        <div v-if="dynamic.content" class="markdown-content" v-html="renderMarkdown(dynamic.content)"></div>
        
        <!-- 图片展示 -->
        <div v-if="dynamic.images && dynamic.images.length" class="image-gallery">
          <a-image
            v-for="(img, index) in dynamic.images"
            :key="index"
            :src="img.url"
            :preview="true"
            :preview-src="img.url"
            fit="cover"
            class="gallery-image"
          />
        </div>
        
        <!-- 音频播放器 -->
        <div v-if="dynamic.audio" class="audio-player">
          <audio controls :src="dynamic.audio.url" class="audio-element">
            您的浏览器不支持音频播放
          </audio>
        </div>
        
        <!-- 视频播放器 -->
        <div v-if="dynamic.video" class="video-player">
          <video
            controls
            :src="dynamic.video.url"
            :poster="dynamic.video.cover"
            class="video-element"
          >
            您的浏览器不支持视频播放
          </video>
        </div>
      </div>
      
      <div class="preview-meta">
        <a-tag :color="getTypeTagColor(dynamic.type)" class="type-tag">
          {{ getTypeText(dynamic.type) }}
        </a-tag>
        <a-tag :color="dynamic.status === 'published' ? 'success' : ''" class="status-tag">
          {{ dynamic.status === 'published' ? '已发布' : '草稿' }}
        </a-tag>
        <span class="preview-time">{{ formatTime(dynamic.createTime) }}</span>
      </div>
    </a-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from '../../utils/elementToAntd'
import { getDynamicDetail } from '../../api/dynamic'
import MarkdownIt from 'markdown-it'
import dayjs from 'dayjs'
import { CloseOutlined } from '@ant-design/icons-vue'

const route = useRoute()
const router = useRouter()

// 创建Markdown渲染器
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})

// 动态数据
const dynamic = ref({})

// 格式化时间
const formatTime = (time) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

// 获取类型标签颜色
const getTypeTagColor = (type) => {
  const colors = {
    image: 'green',
    video: 'orange',
    audio: 'blue',
    text: ''
  }
  return colors[type] || ''
}

// 获取类型文本
const getTypeText = (type) => {
  const types = {
    image: '图文',
    video: '视频',
    audio: '音频',
    text: '纯文本'
  }
  return types[type] || type
}

// 渲染Markdown内容
const renderMarkdown = (content) => {
  return md.render(content || '')
}

// 获取动态详情
const fetchDynamicDetail = async () => {
  try {
    const response = await getDynamicDetail(route.params.id)
    if (response.code === 200) {
      dynamic.value = response.data
    } else {
      ElMessage.error(response.message || '获取动态详情失败')
      handleClose()
    }
  } catch (error) {
    ElMessage.error('获取动态详情失败')
    console.error('获取动态详情失败:', error)
    handleClose()
  }
}

// 关闭预览
const handleClose = () => {
  router.back()
}

// 初始化
onMounted(() => {
  fetchDynamicDetail()
})
</script>

<style scoped>
.dynamic-preview {
  padding: 20px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.preview-card {
  margin-bottom: 20px;
}

.preview-content {
  margin-bottom: 20px;
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

.preview-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--el-text-color-secondary);
  font-size: 0.9em;
}

.type-tag,
.status-tag {
  margin-right: 10px;
}
</style>