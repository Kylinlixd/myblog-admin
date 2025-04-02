<template>
  <div class="post-edit-container">
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
      
      <el-card class="form-card">
        <template #header>
          <div class="card-header">
            <span>文章内容</span>
          </div>
        </template>
        
        <el-form-item label="正文内容" required>
          <div class="editor-container">
            <SimpleMarkdownEditor
              v-model="postForm.content"
              :height="'600px'"
              placeholder="请输入Markdown内容..."
              @onSave="handleQuickSave"
            />
          </div>
        </el-form-item>
      </el-card>
      
      <div class="form-actions">
        <el-button @click="router.back()">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
        <el-button type="success" @click="handleSubmitAndPublish" v-if="postForm.status !== 'published'">保存并发布</el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { getPostDetail, createPost, updatePost } from '../../api/post'
import { getCategoryList } from '../../api/category'
import { getTagList } from '../../api/tag'
import SimpleMarkdownEditor from '../../components/SimpleMarkdownEditor.vue'
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

// 编辑器主题设置
const theme = computed(() => themeStore.isDark ? 'dark' : 'light')
const previewTheme = computed(() => themeStore.isDark ? 'vuepress' : 'default')
const codeTheme = computed(() => themeStore.isDark ? 'atom-dark' : 'atom-one-light')

// 是否为编辑模式
const isEdit = computed(() => !!route.params.id)

// 表单数据
const postForm = reactive({
  title: '',
  content: '',
  summary: '',
  categoryId: '',
  tagIds: [],
  status: 'draft'
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

// Markdown编辑器快速保存
const handleQuickSave = () => {
  if (postForm.title) {
    handleSubmit()
  } else {
    ElMessage.warning('请先填写文章标题')
  }
}

// 提交表单
const handleSubmit = async () => {
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
    
    if (isEdit.value) {
      // 更新文章
      await updatePost(route.params.id, postForm)
    } else {
      // 创建新文章
      await createPost(postForm)
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
  postForm.status = 'published'
  await handleSubmit()
}

onMounted(async () => {
  // 获取分类和标签数据
  await fetchOptionsData()
  
  // 如果是编辑模式，获取文章详情
  if (isEdit.value) {
    await fetchPostDetail(route.params.id)
  } else {
    // 创建模式不需要获取文章详情，直接结束加载
    appStore.endLoading()
  }
})
</script>

<style scoped lang="scss">
.post-edit-container {
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
  }
  
  .form-card {
    margin-bottom: 24px;
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      span {
        font-size: 18px;
        font-weight: 500;
      }
    }
  }
  
  .editor-container {
    border: 1px solid var(--border-color);
    border-radius: 4px;
    overflow: hidden;
  }
  
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}

:deep(.md-editor) {
  border: none !important;
  margin: 0 !important;
  z-index: 1 !important;
}

:deep(.md-editor-toolbar-item) {
  z-index: 1 !important;
}

:deep(.md-editor-toolbar) {
  z-index: 2 !important;
}
</style> 