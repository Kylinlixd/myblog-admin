<template>
  <div class="post-preview-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">文章预览</h2>
      </div>
      <div class="header-right">
        <el-button @click="router.back()" plain>
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <el-button v-if="canEdit" type="primary" @click="handleEdit" plain>
          <el-icon><Edit /></el-icon>
          编辑
        </el-button>
      </div>
    </div>

    <el-card v-loading="loading" class="preview-card">
      <template #header>
        <div class="preview-header">
          <h1 class="preview-title">{{ post.title }}</h1>
          <div class="preview-meta">
            <el-tag v-if="post.category" class="meta-item">{{ post.category.name }}</el-tag>
            <el-tag 
              v-for="tag in post.tags" 
              :key="tag.id" 
              class="meta-item" 
              size="small" 
              type="info"
            >
              {{ tag.name }}
            </el-tag>
            <span class="meta-item">发布于: {{ post.createTime }}</span>
            <el-tag :type="post.status === 'published' ? 'success' : 'warning'" class="meta-item">
              {{ post.status === 'published' ? '已发布' : '草稿' }}
            </el-tag>
          </div>
        </div>
      </template>
      
      <div class="preview-content">
        <div v-if="post.summary" class="post-summary">
          <strong>摘要:</strong> {{ post.summary }}
        </div>
        
        <el-divider />
        
        <div class="markdown-body">
          <Suspense timeout="0">
  <template #default>
    <MdPreview :modelValue="post.content" :theme="theme" v-if="!loading" />
  </template>
  <template #fallback>
    <el-skeleton :rows="5" animated />
  </template>
</Suspense>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Edit } from '@element-plus/icons-vue'
import { getPostDetail } from '../../api/post'
const MdPreview = defineAsyncComponent({
  loader: () => import('md-editor-v3').then(mod => mod.MdPreview),
  delay: 200,
  timeout: 3000,
  suspensible: true
})

import { useThemeStore } from '../../stores/theme'
import { useAppStore } from '../../stores/app'

const router = useRouter()
const route = useRoute()
const themeStore = useThemeStore()
const appStore = useAppStore()

const loading = ref(true)
const post = ref({
  title: '',
  content: '',
  summary: '',
  category: null,
  tags: [],
  createTime: '',
  status: 'draft'
})

// 使用当前主题
const theme = computed(() => themeStore.isDark ? 'dark' : 'default')

// 权限控制
const canEdit = computed(() => true) // 这里可以添加实际的权限检查逻辑

// 获取文章详情
const fetchPostDetail = async () => {
  loading.value = true
  try {
    const res = await getPostDetail(route.params.id)
    post.value = res.data
    
    // 文章加载完成后关闭全局加载状态
    appStore.endLoading()
  } catch (error) {
    console.error('获取文章详情失败:', error)
    ElMessage.error('获取文章详情失败')
    router.push('/posts')
  } finally {
    loading.value = false
  }
}

// 跳转到编辑页面
const handleEdit = () => {
  appStore.startLoading('正在准备编辑器...')
  router.push(`/posts/edit/${route.params.id}`)
}

onMounted(() => {
  fetchPostDetail()
})
</script>

<style lang="scss" scoped>
.post-preview-container {
  padding: 24px;
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    
    .page-title {
      margin: 0;
      font-size: 24px;
      color: var(--text-primary);
    }
    
    .header-right {
      display: flex;
      gap: 12px;
    }
  }
  
  .preview-card {
    .preview-header {
      .preview-title {
        margin: 0 0 16px 0;
        font-size: 28px;
        color: var(--text-primary);
      }
      
      .preview-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: center;
        margin-bottom: 4px;
        
        .meta-item {
          margin-right: 8px;
          
          &:last-child {
            margin-right: 0;
          }
        }
      }
    }
    
    .preview-content {
      margin-top: 16px;
      
      .post-summary {
        padding: 16px;
        background-color: var(--background-light);
        border-radius: var(--border-radius);
        margin-bottom: 24px;
        color: var(--text-secondary);
        font-style: italic;
      }
    }
  }
  
  .markdown-body {
    padding: 8px 0;
    font-size: 16px;
    line-height: 1.8;
  }
}

:deep(.md-preview) {
  background-color: transparent !important;
}
</style>