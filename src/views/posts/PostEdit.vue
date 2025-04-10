<template>
  <div class="post-edit-container" :class="{ 'is-fullscreen': isFullscreen }">
    <template v-if="!isFullscreen">
      <div class="page-header">
        <div class="header-left">
          <h2 class="page-title">{{ isEdit ? '编辑文章' : '创建文章' }}</h2>
        </div>
        <div class="header-right">
          <el-button @click="router.back()" plain>
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
        </div>
      </div>

      <el-form
        ref="formRef"
        :model="postForm"
        label-width="100px"
        class="post-form"
        label-position="top"
        v-loading="loading"
      >
        <el-card class="form-card">
          <template #header>
            <div class="card-header">
              <span>基本信息</span>
            </div>
          </template>
          
          <el-form-item label="文章标题" required>
            <el-input v-model="postForm.title" placeholder="请输入文章标题"></el-input>
          </el-form-item>
          
          <el-form-item label="文章摘要">
            <el-input
              v-model="postForm.summary"
              type="textarea"
              :rows="3"
              placeholder="请输入文章摘要"
            ></el-input>
          </el-form-item>
          
          <el-form-item label="文章状态">
            <el-radio-group v-model="postForm.status">
              <el-radio label="draft">草稿</el-radio>
              <el-radio label="published">发布</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-card>
        
        <el-card class="form-card">
          <template #header>
            <div class="card-header">
              <span>分类与标签</span>
            </div>
          </template>
          
          <el-form-item label="文章分类" required>
            <el-select
              v-model="postForm.categoryId"
              placeholder="请选择文章分类"
              style="width: 100%"
            >
              <el-option
                v-for="item in categories"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              ></el-option>
            </el-select>
          </el-form-item>
          
          <el-form-item label="文章标签">
            <el-select
              v-model="postForm.tagIds"
              multiple
              placeholder="请选择文章标签"
              style="width: 100%"
            >
              <el-option
                v-for="item in tags"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              ></el-option>
            </el-select>
          </el-form-item>
        </el-card>
      </el-form>
    </template>

    <el-card class="form-card editor-card" :class="{ 'fullscreen-editor': isFullscreen }">
      <template #header>
        <div class="card-header">
          <span>文章内容</span>
          <div class="editor-tools">
            <el-tooltip content="预览" placement="top">
              <el-button
                :type="showPreview ? 'primary' : 'default'"
                circle
                @click="togglePreview"
              >
                <el-icon><View /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip :content="isFullscreen ? '退出全屏' : '全屏'" placement="top">
              <el-button
                :type="isFullscreen ? 'primary' : 'default'"
                circle
                @click="toggleFullscreen"
              >
                <el-icon><FullScreen /></el-icon>
              </el-button>
            </el-tooltip>
          </div>
        </div>
      </template>
      
      <el-form-item label="正文内容" required class="editor-form-item">
        <div class="editor-container">
          <MdEditor
            v-model="postForm.content"
            :theme="theme"
            :preview-theme="previewTheme"
            :code-theme="codeTheme"
            :toolbars="toolbars"
            :show-preview="showPreview"
            :height="editorHeight"
            placeholder="请输入Markdown内容..."
            @onSave="handleQuickSave"
            @onChange="handleEditorChange"
            @onPreview="handlePreview"
          />
        </div>
      </el-form-item>
    </el-card>

    <template v-if="!isFullscreen">
      <div class="form-actions">
        <el-button @click="router.back()">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
        <el-button type="success" @click="handleSubmitAndPublish" v-if="postForm.status !== 'published'">保存并发布</el-button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, View, FullScreen } from '@element-plus/icons-vue'
import { getPostDetail, createPost, updatePost } from '../../api/post'
import { getCategoryList } from '../../api/category'
import { getTagList } from '../../api/tag'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { useThemeStore } from '../../stores/theme'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const route = useRoute()
const themeStore = useThemeStore()
const appStore = useAppStore()
const formRef = ref(null)
const loading = ref(false)
const categories = ref([])
const tags = ref([])
const showPreview = ref(false)
const isFullscreen = ref(false)

// 编辑器主题设置
const theme = computed(() => themeStore.isDark ? 'dark' : 'light')
const previewTheme = computed(() => themeStore.isDark ? 'dark' : 'light')
const codeTheme = computed(() => themeStore.isDark ? 'atom-dark' : 'github')

// 编辑器工具栏配置
const toolbars = [
  'bold', 'underline', 'italic', 'strikethrough', 'title', 'sub', 'sup', 'quote', 'unordered-list', 'ordered-list',
  'task', 'code-row', 'code', 'link', 'image', 'table', 'revoke', 'next', 'save', 'preview', 'html-preview', 'catalog'
]

// 是否为编辑模式
const isEdit = computed(() => !!route.params.id)

// 表单数据
const postForm = reactive({
  title: '',
  content: '',
  summary: '',
  categoryId: '',
  tagIds: [],
  status: 'draft',
  authorId: 1, // 假设作者ID为1
})

// 获取分类和标签数据
const fetchOptionsData = async () => {
  try {
    const [categoriesData, tagsData] = await Promise.all([
      getCategoryList(),
      getTagList()
    ])
    categories.value = categoriesData
    tags.value = tagsData
  } catch (error) {
    console.error('获取分类或标签数据失败:', error)
    ElMessage.error('获取分类或标签数据失败')
  }
}

// 获取文章详情
const fetchPostDetail = async (id) => {
  loading.value = true
  try {
    const res = await getPostDetail(id)
    postForm.title = res.title
    postForm.content = res.content
    postForm.summary = res.summary
    postForm.categoryId = res.categoryId || ''
    postForm.status = res.status
    postForm.tagIds = res.tags?.map(tag => tag.id) || []
    
    // 通知应用状态文章已加载完成
    appStore.endLoading()
  } catch (error) {
    console.error('获取文章详情失败:', error)
    ElMessage.error('获取文章详情失败: ' + (error.message || '未知错误'))
    appStore.setLoadingError('获取文章详情失败')
  } finally {
    loading.value = false
  }
}

// 切换预览状态
const togglePreview = () => {
  showPreview.value = !showPreview.value
  // 强制更新编辑器高度，确保预览区域正确显示
  nextTick(() => {
    updateEditorHeight()
  })
}

// 更新编辑器高度
const updateEditorHeight = () => {
  const editor = document.querySelector('.md-editor')
  if (editor) {
    if (isFullscreen.value) {
      editor.style.height = '100%'
    } else {
      editor.style.height = 'calc(100vh - 500px)'
    }
  }
}

// 计算编辑器高度
const editorHeight = computed(() => {
  if (isFullscreen.value) {
    return '100%'
  }
  return 'calc(100vh - 500px)'
})

// 切换全屏状态
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  // 强制更新编辑器高度
  nextTick(() => {
    updateEditorHeight()
  })
}

// 预览处理
const handlePreview = (v) => {
  console.log('Preview content:', v)
  // 强制更新编辑器高度
  nextTick(() => {
    updateEditorHeight()
  })
}

// 编辑器内容变化处理
const handleEditorChange = (v) => {
  postForm.content = v
  // 自动保存到本地存储
  localStorage.setItem('post_draft', JSON.stringify({
    ...postForm,
    timestamp: Date.now()
  }))
}

// 从本地存储恢复草稿
const restoreDraft = () => {
  const draft = localStorage.getItem('post_draft')
  if (draft) {
    const { timestamp, ...draftData } = JSON.parse(draft)
    // 如果草稿在24小时内，则恢复
    if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
      Object.assign(postForm, draftData)
      ElMessage.info('已恢复上次编辑的草稿')
    } else {
      localStorage.removeItem('post_draft')
    }
  }
}

// Markdown编辑器快速保存
const handleQuickSave = () => {
  if (postForm.title) {
    handleSubmit()
  } else {
    ElMessage.warning('请先填写文章标题')
  }
}

// 提交表单
const handleSubmit = async (isPublish = false) => {
  // 手动表单验证
  if (!postForm.title) {
    ElMessage.warning('请填写文章标题')
    return
  }
  
  if (!postForm.content) {
    ElMessage.warning('请填写文章内容')
    return
  }
  
  if (!postForm.categoryId) {
    ElMessage.warning('请选择文章分类')
    return
  }
  
  try {
    loading.value = true
    appStore.setLoading(true, '正在保存文章...')
    
    // 确保状态值正确传递
    const submitData = {
      ...postForm,
      status: isPublish ? 'published' : postForm.status // 如果是发布操作，强制设置为已发布
    }
    
    console.log('提交数据:', {
      ...submitData,
      categoryId: submitData.categoryId,
      tagIds: submitData.tagIds,
      status: submitData.status
    }) // 添加更详细的日志
    
    if (isEdit.value) {
      // 更新文章
      const response = await updatePost(route.params.id, submitData)
      console.log('更新文章响应:', response) // 添加响应日志
    } else {
      // 创建新文章
      const response = await createPost(submitData)
      console.log('创建文章响应:', response) // 添加响应日志
    }
    
    ElMessage.success(isEdit.value ? '文章更新成功' : '文章创建成功')
    router.push('/dashboard/posts')
  } catch (error) {
    console.error('保存文章失败:', error)
    ElMessage.error('保存文章失败: ' + (error.message || '未知错误'))
  } finally {
    loading.value = false
    appStore.endLoading()
  }
}

// 保存并发布
const handleSubmitAndPublish = async () => {
  // 先设置状态为已发布
  postForm.status = 'published'
  await handleSubmit(true) // 传入 true 表示是发布操作
}

onMounted(async () => {
  // 获取分类和标签数据
  await fetchOptionsData()
  
  // 如果是编辑模式，获取文章详情
  if (isEdit.value) {
    await fetchPostDetail(route.params.id)
  } else {
    // 创建模式尝试恢复草稿
    restoreDraft()
    // 创建模式不需要获取文章详情，直接结束加载
    appStore.endLoading()
  }
  
  // 初始化编辑器高度
  nextTick(() => {
    updateEditorHeight()
  })
})

// 组件卸载时清理
onUnmounted(() => {
  if (!isEdit.value) {
    // 如果是新建模式，保存草稿
    if (postForm.title || postForm.content) {
      localStorage.setItem('post_draft', JSON.stringify({
        ...postForm,
        timestamp: Date.now()
      }))
    }
  }
})
</script>

<style scoped lang="scss">
.post-edit-container {
  padding: 24px;
  min-height: 100vh;
  overflow-y: auto;
  transition: all 0.3s ease;
  
  &.is-fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    padding: 0;
    background-color: var(--background-color);
    overflow: hidden;
    
    .editor-card {
      height: 100vh;
      margin: 0;
      border-radius: 0;
      
      &.fullscreen-editor {
        :deep(.el-card__body) {
          height: calc(100vh - 60px);
          padding: 0;
          display: flex;
          flex-direction: column;
        }
      }
    }
    
    .editor-container {
      height: 100%;
      flex: 1;
      display: flex;
      flex-direction: column;
      
      :deep(.md-editor) {
        height: 100% !important;
        flex: 1;
      }
    }
  }
  
  .post-form {
    display: flex;
    flex-direction: column;
    min-height: calc(100vh - 48px); // 减去容器的padding
  }
  
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
  }
  
  .form-card {
    margin-bottom: 24px;
    
    &.editor-card {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      
      :deep(.el-card__body) {
        flex: 1;
        padding: 0;
        display: flex;
        flex-direction: column;
      }
    }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 20px;
      
      span {
        font-size: 18px;
        font-weight: 500;
      }
      
      .editor-tools {
        display: flex;
        gap: 8px;
      }
    }
  }
  
  .editor-form-item {
    margin: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    
    :deep(.el-form-item__content) {
      flex: 1;
      display: flex;
      flex-direction: column;
      margin-left: 0 !important; // 移除左边距
    }
  }
  
  .editor-container {
    flex: 1;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    
    :deep(.md-editor) {
      flex: 1;
      height: 100% !important;
      border-radius: 0 !important; // 移除编辑器边框圆角
    }
  }
  
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
  }
}

:deep(.md-editor) {
  border: none !important;
  margin: 0 !important;
  z-index: 1 !important;
  border-radius: 0 !important; // 移除编辑器边框圆角
  
  .md-editor-preview {
    z-index: 10 !important;
    height: 100% !important;
  }
  
  .md-editor-toolbar {
    z-index: 2 !important;
  }
  
  .md-editor-content {
    height: calc(100% - 40px) !important;
  }
}

:deep(.md-editor-toolbar-item) {
  z-index: 1 !important;
}

:deep(.md-editor-dark) {
  --md-bk-color: var(--background-color) !important;
  --md-hover-color: var(--background-light) !important;
  --md-active-color: var(--background-light) !important;
  --md-border-color: var(--border-color) !important;
  --md-text-color: var(--text-primary) !important;
  --md-preview-bg-color: var(--background-color) !important;
  --md-preview-color: var(--text-primary) !important;
}

:deep(.md-editor-light) {
  --md-bk-color: var(--background-color) !important;
  --md-hover-color: var(--background-light) !important;
  --md-active-color: var(--background-light) !important;
  --md-border-color: var(--border-color) !important;
  --md-text-color: var(--text-primary) !important;
  --md-preview-bg-color: var(--background-color) !important;
  --md-preview-color: var(--text-primary) !important;
}

:deep(.md-preview) {
  background-color: var(--background-color) !important;
  color: var(--text-primary) !important;
  
  h1, h2, h3, h4, h5, h6 {
    color: var(--text-primary) !important;
  }
  
  code {
    background-color: var(--background-light) !important;
    color: var(--text-primary) !important;
  }
  
  pre {
    background-color: var(--background-light) !important;
    
    code {
      background-color: transparent !important;
    }
  }
  
  blockquote {
    border-left-color: var(--border-color) !important;
    color: var(--text-secondary) !important;
  }
  
  table {
    th, td {
      border-color: var(--border-color) !important;
    }
    
    th {
      background-color: var(--background-light) !important;
    }
  }
}

.editor-card {
  &.fullscreen-editor {
    :deep(.el-card__body) {
      height: calc(100vh - 60px);
      display: flex;
      flex-direction: column;
      
      .editor-container {
        flex: 1;
        height: 100%;
      }
    }
  }
}
</style> 