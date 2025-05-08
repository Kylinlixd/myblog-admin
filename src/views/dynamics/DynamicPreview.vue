<template>
  <div class="dynamic-preview">
    <div class="preview-header">
      <h2>动态预览</h2>
      <a-space>
        <a-button @click="handleEdit" type="primary">
          <template #icon><edit-outlined /></template>
          编辑
        </a-button>
        <a-button @click="handleClose">
          <template #icon><close-outlined /></template>
          关闭
        </a-button>
      </a-space>
    </div>
    
    <a-card class="preview-card">
      <template #extra>
        <a-space>
          <a-tag :color="getTypeTagColor(dynamic.type)">
            {{ getTypeText(dynamic.type) }}
          </a-tag>
          <a-tag :color="dynamic.status === 'published' ? 'success' : 'default'">
            {{ dynamic.status === 'published' ? '已发布' : '草稿' }}
          </a-tag>
          <span class="preview-time">{{ formatDate(dynamic.createdAt) }}</span>
        </a-space>
      </template>

      <div class="preview-content">
        <!-- 文本内容 -->
        <div v-if="dynamic.content" class="content-text">
          {{ dynamic.content }}
        </div>
        
        <!-- 媒体内容 -->
        <div v-if="dynamic.mediaUrls && dynamic.mediaUrls.length" class="media-content">
          <!-- 图片预览 -->
          <template v-if="dynamic.type === 'image'">
            <a-image-preview-group>
              <div class="image-grid">
                <a-image
                  v-for="(url, index) in dynamic.mediaUrls"
                  :key="index"
                  :src="url"
                  :preview="{
                    src: url,
                    mask: false
                  }"
                  class="preview-image"
                />
              </div>
            </a-image-preview-group>
          </template>
          
          <!-- 音频预览 -->
          <template v-else-if="dynamic.type === 'audio'">
            <div class="audio-player">
              <audio
                v-for="(url, index) in dynamic.mediaUrls"
                :key="index"
                controls
                :src="url"
                class="audio-element"
              >
                您的浏览器不支持音频播放
              </audio>
            </div>
          </template>
          
          <!-- 视频预览 -->
          <template v-else-if="dynamic.type === 'video'">
            <div class="video-player">
              <video
                v-for="(url, index) in dynamic.mediaUrls"
                :key="index"
                controls
                :src="url"
                class="video-element"
              >
                您的浏览器不支持视频播放
              </video>
            </div>
          </template>
        </div>
      </div>

      <!-- 分类和标签 -->
      <div class="preview-meta">
        <div v-if="dynamic.categoryId" class="category">
          <span class="label">分类：</span>
          <a-tag color="blue">{{ getCategoryName(dynamic.categoryId) }}</a-tag>
        </div>
        <div v-if="dynamic.tags && dynamic.tags.length" class="tags">
          <span class="label">标签：</span>
          <a-space wrap :size="[4, 4]">
            <a-tag
              v-for="tag in dynamic.tags"
              :key="tag.id"
              color="blue"
            >
              {{ tag.name }}
            </a-tag>
          </a-space>
        </div>
      </div>
    </a-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { getDynamicDetail } from '@/api/dynamic'
import { getCategoryList } from '@/api/category'
import { EditOutlined, CloseOutlined } from '@ant-design/icons-vue'

const route = useRoute()
const router = useRouter()

// 动态数据
const dynamic = ref({
  id: '',
  type: 'text',
  content: '',
  mediaUrls: [],
  status: 'draft',
  categoryId: null,
  tags: [],
  createdAt: ''
})

// 分类数据
const categories = ref([])

// 获取动态详情
const fetchDynamicDetail = async () => {
  try {
    const res = await getDynamicDetail(route.params.id)
    if (res.code === 200 && res.data) {
      dynamic.value = res.data
    } else {
      throw new Error(res.message || '获取动态详情失败')
    }
  } catch (error) {
    console.error('获取动态详情失败:', error)
    message.error('获取动态详情失败: ' + (error.response?.data?.message || error.message || '未知错误'))
  }
}

// 获取分类列表
const fetchCategories = async () => {
  try {
    const data = await getCategoryList()
    categories.value = data || []
  } catch (error) {
    console.error('获取分类列表失败:', error)
    message.error('获取分类列表失败')
  }
}

// 获取分类名称
const getCategoryName = (categoryId) => {
  const category = categories.value.find(c => c.id === categoryId)
  return category ? category.name : '未知分类'
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

// 获取类型标签颜色
const getTypeTagColor = (type) => {
  const colorMap = {
    text: '',
    image: 'blue',
    audio: 'purple',
    video: 'magenta'
  }
  return colorMap[type] || ''
}

// 获取类型文本
const getTypeText = (type) => {
  const textMap = {
    text: '文本',
    image: '图文',
    audio: '音频',
    video: '视频'
  }
  return textMap[type] || type
}

// 编辑动态
const handleEdit = () => {
  router.push(`/dashboard/dynamics/edit/${dynamic.value.id}`)
}

// 关闭预览
const handleClose = () => {
  router.push('/dashboard/dynamics')
}

// 在组件挂载时获取数据
onMounted(async () => {
  await Promise.all([
    fetchDynamicDetail(),
    fetchCategories()
  ])
})
</script>

<style scoped lang="scss">
.dynamic-preview {
  padding: 24px;
  
  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    
    h2 {
      margin: 0;
      font-size: 24px;
      color: var(--text-primary);
    }
  }
  
  .preview-card {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    
    :deep(.ant-card-head) {
      border-bottom: 1px solid #f0f0f0;
    }
    
    .preview-time {
      color: var(--text-secondary);
      font-size: 14px;
    }
  }
  
  .preview-content {
    .content-text {
      font-size: 16px;
      line-height: 1.8;
      color: var(--text-primary);
      margin-bottom: 24px;
      white-space: pre-wrap;
      word-break: break-all;
    }
    
    .media-content {
      margin-top: 16px;
      
      .image-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
        
        .preview-image {
          width: 100%;
          height: 200px;
          object-fit: cover;
          border-radius: 8px;
        }
      }
      
      .audio-player {
        margin-bottom: 24px;
        
        .audio-element {
          width: 100%;
          margin-bottom: 16px;
        }
      }
      
      .video-player {
        margin-bottom: 24px;
        
        .video-element {
          width: 100%;
          max-height: 500px;
          margin-bottom: 16px;
          border-radius: 8px;
        }
      }
    }
  }
  
  .preview-meta {
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid #f0f0f0;
    
    .category, .tags {
      margin-bottom: 12px;
      
      .label {
        color: var(--text-secondary);
        margin-right: 8px;
      }
    }
  }
}

// 响应式布局
@media (max-width: 768px) {
  .dynamic-preview {
    padding: 16px;
    
    .preview-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
      
      h2 {
        font-size: 20px;
      }
    }
    
    .preview-content {
      .image-grid {
        grid-template-columns: 1fr;
      }
    }
  }
}
</style>