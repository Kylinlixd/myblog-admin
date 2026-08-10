<template>
  <div class="dynamic-edit">
    <div class="edit-header">
      <h2>{{ isEdit ? '编辑动态' : '新建动态' }}</h2>
      <div class="header-actions">
        <a-button aria-label="预览" :disabled="!form.content.trim()" @click="handlePreview">
          <template #icon><eye-outlined /></template>预览
        </a-button>
        <a-button @click="handleSave" type="primary" :loading="saving" :disabled="saving">
          <template #icon><check-outlined /></template>保存
        </a-button>
        <a-button @click="handleCancel">
          <template #icon><close-outlined /></template>取消
        </a-button>
      </div>
    </div>

    <a-form
      ref="formRef"
      :model="form"
      :rules="rules"
      :label-col="{ span: 3 }"
      :wrapper-col="{ span: 18 }"
      class="edit-form"
    >
      <!-- 标题输入框 -->
      <a-form-item class="editor-title-field" label="标题" name="title" :rules="rules.title">
        <a-input
          v-model:value="form.title"
          placeholder="请输入动态标题"
          :maxLength="100"
          show-count
        />
      </a-form-item>

      <a-form-item class="editor-settings-field" label="分类" name="categoryId">
        <div class="taxonomy-control">
          <a-select v-model:value="form.categoryId" placeholder="请选择分类" :loading="categoriesLoading" :options="categoryOptions" />
          <a-button type="link" class="taxonomy-add" @click="openTaxonomyModal('category')">+ 新建</a-button>
        </div>
      </a-form-item>

      <a-form-item class="editor-settings-field" label="标签" name="tags">
        <div class="taxonomy-control">
          <a-select v-model:value="form.tags" mode="multiple" placeholder="请选择标签" :loading="tagsLoading" :options="tagOptions" />
          <a-button type="link" class="taxonomy-add" @click="openTaxonomyModal('tag')">+ 新建</a-button>
        </div>
      </a-form-item>

      <a-form-item class="editor-settings-field" label="内容类型" name="type">
        <div class="content-type-control">
          <a-radio-group v-model:value="form.type">
            <a-radio value="text">纯文本</a-radio>
            <a-radio value="image">图文</a-radio>
            <a-radio value="audio">音频</a-radio>
            <a-radio value="video">视频</a-radio>
          </a-radio-group>
          <a-upload
            v-if="form.type === 'text'"
            class="quick-media-upload"
            :show-upload-list="false"
            :open-file-dialog-on-click="true"
            :before-upload="beforeMediaUpload"
            :custom-request="handleCustomUpload"
            accept="image/*,.heic,.heif,audio/*,video/*,.mov,.m4v,.hevc"
          >
            <a-button type="primary">
              <template #icon><upload-outlined /></template>
              上传文件
            </a-button>
          </a-upload>
        </div>
        <div class="media-upload-status" :class="`is-${uploadState.stage}`">
          <strong>支持 MOV / MP4 / HEVC · HEIC / HEIF</strong>
          <span v-if="uploadState.stage === 'uploading'">正在上传 {{ uploadState.progress }}%</span>
          <span v-else-if="uploadState.stage === 'processing'">正在优化视频，完成后会自动生成封面</span>
          <span v-else-if="uploadState.stage === 'success'">{{ uploadState.message }}</span>
          <span v-else-if="uploadState.stage === 'error'">{{ uploadState.message }}</span>
          <span v-else>单个文件不超过 50MB，视频会转为网页友好的 MP4</span>
        </div>
      </a-form-item>

      <!-- 图片上传 -->
      <a-form-item
        class="editor-settings-field media-upload-field"
        label="图片"
        name="mediaUrls"
        v-if="form.type === 'image'"
      >
        <div class="media-upload-container">
          <a-upload
            list-type="picture-card"
            :file-list="fileList"
            :open-file-dialog-on-click="true"
            :before-upload="beforeImageUpload"
            :custom-request="handleCustomUpload"
            @remove="handleMediaRemove"
            :preview="handleImagePreview"
            multiple
            accept="image/*,.heic,.heif"
          >
            <div>
              <plus-outlined />
              <div style="margin-top: 8px">上传</div>
            </div>
          </a-upload>
          <a-button type="primary" @click="showFileSelector" style="margin-left: 8px">
            <template #icon><folder-outlined /></template>
            从文件库选择
          </a-button>
        </div>
        <div class="upload-tip">支持 JPG、PNG、GIF、HEIC、HEIF，单个文件不超过 50MB</div>
      </a-form-item>

      <!-- 音频上传 -->
      <a-form-item
        class="editor-settings-field media-upload-field"
        label="音频"
        name="mediaUrls"
        v-if="form.type === 'audio'"
      >
        <div class="media-upload-container">
          <a-upload
            :file-list="fileList"
            :open-file-dialog-on-click="true"
            :before-upload="beforeAudioUpload"
            :custom-request="handleCustomUpload"
            @remove="handleMediaRemove"
            accept="audio/*"
          >
            <a-button type="primary">
              <template #icon><upload-outlined /></template>上传音频
            </a-button>
          </a-upload>
          <a-button type="primary" @click="showFileSelector" style="margin-left: 8px">
            <template #icon><folder-outlined /></template>
            从文件库选择
          </a-button>
        </div>
        <div v-if="form.mediaUrls && form.mediaUrls.length > 0" class="media-preview">
          <audio controls :src="form.mediaUrls[0]" style="width: 100%"></audio>
        </div>
      </a-form-item>

      <!-- 视频上传 -->
      <a-form-item
        class="editor-settings-field media-upload-field"
        label="视频"
        name="mediaUrls"
        v-if="form.type === 'video'"
      >
        <div class="media-upload-container">
          <a-upload
            :file-list="fileList"
            :open-file-dialog-on-click="true"
            :before-upload="beforeVideoUpload"
            :custom-request="handleCustomUpload"
            @remove="handleMediaRemove"
            accept="video/*,.mov,.m4v,.hevc"
          >
            <a-button type="primary">
              <template #icon><upload-outlined /></template>上传视频
            </a-button>
          </a-upload>
          <a-button type="primary" @click="showFileSelector" style="margin-left: 8px">
            <template #icon><folder-outlined /></template>
            从文件库选择
          </a-button>
        </div>
        <div v-if="form.mediaUrls && form.mediaUrls.length > 0" class="media-preview">
          <video controls preload="metadata" playsinline :src="form.mediaUrls[0]" :poster="fileList[0]?.posterUrl || undefined" style="width: 100%"></video>
        </div>
      </a-form-item>

      <a-form-item class="editor-content-field" label="内容" name="content">
        <markdown-editor
          ref="markdownEditorRef"
          v-model="form.content"
          :height="'400px'"
          :theme="'light'"
          :preview-theme="'default'"
          :code-theme="'atom-one-light'"
          :language="'zh-CN'"
          @onSave="handleSave"
        />
      </a-form-item>

      <a-form-item class="editor-settings-field" label="状态" name="status">
        <a-radio-group v-model:value="form.status">
          <a-radio value="draft">草稿</a-radio>
          <a-radio value="published">发布</a-radio>
        </a-radio-group>
      </a-form-item>
      
      <a-form-item class="editor-form-actions" :wrapper-col="{ span: 24 }">
        <a-button type="primary" @click="handleSave" :loading="saving" :disabled="saving">保存</a-button>
        <a-button style="margin-left: 10px" @click="handleCancel">取消</a-button>
      </a-form-item>
    </a-form>
    
    <a-modal
      v-model:open="previewVisible"
      :title="previewTitle"
      :footer="null"
      width="800px"
    >
      <img v-if="previewType === 'image'" alt="预览" style="width: 100%" :src="previewUrl" />
      <audio v-if="previewType === 'audio'" controls style="width: 100%" :src="previewUrl"></audio>
      <video v-if="previewType === 'video'" controls preload="metadata" playsinline style="width: 100%" :src="previewUrl" :poster="previewPosterUrl || undefined"></video>
    </a-modal>

    <!-- 文件选择器弹窗 -->
    <a-modal
      v-model:open="fileSelectorVisible"
      title="选择文件"
      width="800px"
      :footer="null"
    >
      <div class="file-selector">
        <div class="file-selector-header">
          <a-input-search
            class="file-search"
            v-model:value="fileSearchKeyword"
            placeholder="搜索文件"
            style="width: 280px; max-width: 100%"
            @search="handleFileSearch"
            :loading="fileListLoading"
          />
          <a-select
            class="file-type-filter"
            v-model:value="fileTypeFilter"
            style="width: 140px"
            @change="handleFileTypeChange"
            :loading="fileListLoading"
          >
            <a-select-option value="all">全部类型</a-select-option>
            <a-select-option value="image">图片</a-select-option>
            <a-select-option value="audio">音频</a-select-option>
            <a-select-option value="video">视频</a-select-option>
          </a-select>
        </div>
        
        <div class="file-list">
          <a-spin :spinning="fileListLoading">
            <a-list
              :grid="{ gutter: 16, column: 4 }"
              :data-source="fileListData"
              :loading="fileListLoading"
            >
              <template #renderItem="{ item }">
                <a-list-item>
                  <div
                    class="file-item"
                    :class="{ 'file-item-selected': isFileSelected(item) }"
                    @click="handleFileSelect(item)"
                  >
                    <div class="file-preview">
                      <div class="file-preview-content">
                        <img
                          v-if="item.type === 'image'"
                          :src="item.url"
                          :alt="item.name"
                        />
                        <video
                          v-else-if="item.type === 'video'"
                          :src="item.url"
                          :poster="item.posterUrl ? buildApiUrl(item.posterUrl) : undefined"
                          controls
                          preload="metadata"
                          playsinline
                          style="max-width: 100%; max-height: 100%;"
                        ></video>
                        <audio
                          v-else-if="item.type === 'audio'"
                          :src="item.url"
                          controls
                        ></audio>
                        <file-outlined v-else />
                      </div>
                      <div class="file-selected-icon" v-if="isFileSelected(item)">
                        <check-outlined />
                      </div>
                    </div>
                    <div class="file-info">
                      <div class="file-name" :title="item.name">{{ item.name }}</div>
                      <div class="file-size">{{ formatFileSize(item.size) }}</div>
                    </div>
                  </div>
                </a-list-item>
              </template>
            </a-list>
          </a-spin>
        </div>
        
        <div class="file-selector-footer">
          <div class="selected-info" v-if="selectedFiles.length > 0">
            已选择 {{ selectedFiles.length }} 个文件
          </div>
          <div class="file-selector-actions">
            <a-button @click="fileSelectorVisible = false">取消</a-button>
            <a-button type="primary" @click="handleFileConfirm">确定</a-button>
          </div>
        </div>
      </div>
    </a-modal>

    <a-modal v-model:open="taxonomyModalVisible" :title="taxonomyModalType === 'category' ? '新建分类' : '新建标签'" :confirm-loading="taxonomySaving" ok-text="创建" cancel-text="取消" @ok="createTaxonomy">
      <a-form layout="vertical">
        <a-form-item :label="taxonomyModalType === 'category' ? '分类名称' : '标签名称'" required>
          <a-input v-model:value="taxonomyName" :maxlength="30" show-count :placeholder="taxonomyModalType === 'category' ? '例如：前端工程' : '例如：Vue'" @press-enter="createTaxonomy" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import { 
  EyeOutlined, 
  CheckOutlined, 
  CloseOutlined, 
  PlusOutlined, 
  UploadOutlined,
  DeleteOutlined,
  FolderOutlined,
  FileOutlined
} from '@ant-design/icons-vue'
import { getDynamicDetail, createDynamic, updateDynamic } from '../../api/dynamic'
import { uploadImage, uploadAudio, uploadVideo, checkFileSize, checkFileType } from '../../utils/upload'
import { getCategoryList, createCategory } from '../../api/category'
import { getTagList, createTag } from '../../api/tag'
import { getFileList } from '../../api/file'
import MarkdownEditor from '@/components/MarkdownEditor.vue'
import { buildApiUrl, stripApiBaseUrl } from '@/utils/apiBaseUrl'
import { clearEditorDraft, loadEditorDraft, saveEditorDraft } from './editorDraft'

const route = useRoute()
const router = useRouter()
const formRef = ref(null)
const markdownEditorRef = ref(null)  // 添加编辑器引用

// 判断是否为编辑模式
const isEdit = computed(() => route.params.id !== undefined)
const draftId = computed(() => String(route.params.id || 'new'))
const saving = ref(false)
const dirty = ref(false)
let mediaTypeReady = false
let draftTimer
let isHydrating = false

// 表单数据 - 修改为使用 mediaUrls 统一存储媒体文件
const form = ref({
  title: '',  // 添加标题字段
  type: 'text',
  content: '',
  mediaUrls: [],
  fileIds: [],
  status: 'draft',
  categoryId: undefined,
  tags: []
})

watch(form, () => {
  if (isHydrating) return
  dirty.value = true
  window.clearTimeout(draftTimer)
  draftTimer = window.setTimeout(() => saveEditorDraft(draftId.value, form.value), 700)
}, { deep: true, flush: 'sync' })

watch(() => form.value.type, (type, previousType) => {
  if (!mediaTypeReady || !previousType || type === previousType) return
  form.value.mediaUrls = []
  form.value.fileIds = []
  fileList.value = []
  selectedFiles.value = []
}, { flush: 'sync' })

// 文件列表 - 上传组件使用
const fileList = ref([])
// 让移动端用户区分网络上传和服务端视频优化两个阶段。
const uploadState = ref({ stage: 'idle', progress: 0, message: '' })

// 预览相关状态
const previewVisible = ref(false)
const previewUrl = ref('')
const previewTitle = ref('')
const previewType = ref('image')
const previewPosterUrl = ref('')

// 分类和标签数据
const categories = ref([])
const tags = ref([])
const categoriesLoading = ref(false)
const tagsLoading = ref(false)
const taxonomyModalVisible = ref(false)
const taxonomyModalType = ref('category')
const taxonomyName = ref('')
const taxonomySaving = ref(false)

// 文件选择器相关状态
const fileSelectorVisible = ref(false)
const fileSearchKeyword = ref('')
const fileTypeFilter = ref('all')
const fileListLoading = ref(false)
const fileListData = ref([])
const fileCurrentPage = ref(1)
const filePageSize = ref(12)
const fileTotal = ref(0)
const selectedFiles = ref([])

const applyFileListResponse = ({ count, results }) => {
  fileListData.value = results.map(file => ({
    id: file.id,
    name: file.name,
    type: file.type,
    url: file.url,
    posterUrl: file.posterUrl || file.poster_url,
    size: file.size ?? 0,
    created_at: file.created_at,
    updated_at: file.updated_at,
    description: file.description,
    is_public: file.is_public
  }))
  fileTotal.value = count
}

// 添加计算属性来处理标签选项
const tagOptions = computed(() => {
  return (tags.value || []).map(item => ({
    value: item.id,
    label: item.name
  }))
})

// 添加计算属性来处理分类选项
const categoryOptions = computed(() => {
  return (categories.value || []).map(item => ({
    value: item.id,
    label: item.name
  }))
})

const openTaxonomyModal = (type) => {
  taxonomyModalType.value = type
  taxonomyName.value = ''
  taxonomyModalVisible.value = true
}

const createTaxonomy = async () => {
  const name = taxonomyName.value.trim()
  if (!name) {
    message.warning(`请输入${taxonomyModalType.value === 'category' ? '分类' : '标签'}名称`)
    return
  }
  taxonomySaving.value = true
  try {
    const response = taxonomyModalType.value === 'category'
      ? await createCategory({ name })
      : await createTag({ name })
    const created = response
    if (taxonomyModalType.value === 'category') {
      await fetchCategories()
      const id = created?.id
      if (id) form.value.categoryId = id
    } else {
      await fetchTags()
      const id = created?.id
      if (id) form.value.tags = [...new Set([...(form.value.tags || []), id])]
    }
    taxonomyModalVisible.value = false
    message.success('创建成功')
  } catch (error) {
    message.error(error?.message || '创建失败，请稍后重试')
  } finally {
    taxonomySaving.value = false
  }
}

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入标题' },
    { max: 100, message: '标题不能超过100个字符' }
  ],
  type: [{ required: true, message: '请选择内容类型', trigger: 'change' }],
  content: [{ 
    required: true, 
    message: '请输入内容', 
    trigger: ['blur', 'change'],
    validator: (rule, value) => {
      if (!value && form.value.type === 'text') {
        return Promise.reject('请输入内容')
      }
      return Promise.resolve()
    }
  }],
  mediaUrls: [
    {
      validator: (rule, value) => {
        if ((form.value.type === 'image' || form.value.type === 'audio' || form.value.type === 'video') 
            && (!form.value.mediaUrls || form.value.mediaUrls.length === 0)) {
          return Promise.reject(`请上传${form.value.type === 'image' ? '图片' : form.value.type === 'audio' ? '音频' : '视频'}`)
        }
        return Promise.resolve()
      },
      trigger: 'change'
    }
  ]
}

// 获取标签列表
const fetchTags = async () => {
  tagsLoading.value = true
  try {
    const { results = [] } = (await getTagList()) || {}
    tags.value = results
  } catch (error) {
    console.error('获取标签列表失败:', error)
    message.error('获取标签列表失败')
    tags.value = []
  } finally {
    tagsLoading.value = false
  }
}

// 获取分类列表
const fetchCategories = async () => {
  categoriesLoading.value = true
  try {
    const { results = [] } = (await getCategoryList()) || {}
    categories.value = results
  } catch (error) {
    console.error('获取分类列表失败:', error)
    message.error('获取分类列表失败')
    categories.value = []
  } finally {
    categoriesLoading.value = false
  }
}

// 获取动态详情
const fetchDynamicDetail = async () => {
  if (!isEdit.value) return

  isHydrating = true
  try {
    const data = await getDynamicDetail(route.params.id)
    if (data) {
      // 处理 mediaUrls，确保是数组且包含前缀
      let mediaItems = []
      if (data.mediaUrls) {
        mediaItems = Array.isArray(data.mediaUrls) ? data.mediaUrls : [data.mediaUrls]
      }
      const mediaUrls = mediaItems.map(item => {
        const url = typeof item === 'string' ? item : item?.url || item?.file_url
        return url ? buildApiUrl(url) : null
      }).filter(Boolean)
      
      // 填充表单数据
      form.value = {
        title: data.title || '',  // 确保标题字段存在
        type: data.type || 'text',
        content: data.content || '',
        status: data.status || 'draft',
        mediaUrls: mediaUrls,
        fileIds: data.fileIds || [],
        categoryId: data.category?.id,
        tags: Array.isArray(data.tags) ? data.tags.map(tag => tag.id) : []
      }
      
      // 更新文件列表用于上传组件显示
      updateFileList(mediaItems)
      
      // 重置表单验证状态
      formRef.value?.resetFields()
      
      // 确保内容更新到编辑器
      nextTick(() => {
        if (form.value.content && markdownEditorRef.value) {
          markdownEditorRef.value.setContent(form.value.content)
        }
      })
      window.clearTimeout(draftTimer)
      draftTimer = undefined
      dirty.value = false
    } else {
      message.error('获取动态详情失败')
    }
  } catch (error) {
    console.error('获取动态详情失败:', error)
    message.error('获取动态详情失败')
  } finally {
    isHydrating = false
  }
}

// 更新文件列表
const updateFileList = (sourceItems = form.value.mediaUrls) => {
  if (!form.value.mediaUrls || form.value.mediaUrls.length === 0) {
    fileList.value = []
    return
  }
  
  // 确保 mediaUrls 是数组
  const mediaItems = Array.isArray(sourceItems) ? sourceItems : [sourceItems]
  fileList.value = mediaItems.map((item, index) => {
    const url = typeof item === 'string' ? item : item?.url || item?.file_url
    if (!url) {
      console.warn(`跳过无效的 URL，索引: ${index}`)
      return null
    }
    
    const fileName = (typeof item === 'object' && item?.name) || url.split('/').pop() || `file-${index}`
    const fullUrl = buildApiUrl(url)
    return {
      uid: `-${index}`,
      name: fileName,
      status: 'done',
      url: fullUrl,
      thumbUrl: fullUrl,
      posterUrl: typeof item === 'object' && item?.poster_url
        ? buildApiUrl(item.poster_url)
        : typeof item === 'object' && item?.posterUrl
          ? buildApiUrl(item.posterUrl)
          : undefined
    }
  }).filter(Boolean) // 过滤掉无效的项
  
}

// 保存动态
const handleSave = async () => {
  if (saving.value) return
  saving.value = true
  try {
    // 表单验证
    await formRef.value.validate();
    
    // 验证媒体文件
    if (form.value.type !== 'text' && (!form.value.mediaUrls || form.value.mediaUrls.length === 0)) {
      message.error(`请上传${form.value.type === 'image' ? '图片' : form.value.type === 'audio' ? '音频' : '视频'}`);
      return;
    }
    
    // 处理媒体文件 URL，移除前缀
    const processedMediaUrls = form.value.mediaUrls.map(item => {
      const url = typeof item === 'string' ? item : item?.url || item?.file_url
      if (!url) return url;
      return stripApiBaseUrl(url);
    });
    
    // 准备提交的数据，确保格式正确
    const dynamicData = {
      title: form.value.title.trim(),  // 确保标题字段存在
      type: form.value.type,
      content: form.value.content.trim(),
      status: form.value.status,
      mediaUrls: processedMediaUrls,
      fileIds: form.value.fileIds || [],
      categoryId: form.value.categoryId,
      tags: form.value.tags
    };
    
    // 根据是否编辑模式选择API
    if (isEdit.value) {
      await updateDynamic(route.params.id, dynamicData);
    } else {
      await createDynamic(dynamicData);
    }

    window.clearTimeout(draftTimer)
    clearEditorDraft(draftId.value)
    dirty.value = false
    message.success(isEdit.value ? '动态更新成功' : '动态创建成功');
    router.push('/dashboard/dynamics');
  } catch (error) {
    console.error('表单验证或保存过程中出错:', error);
    
    // 显示更友好的错误信息
    if (error.errorFields) {
      // 表单验证错误
      const firstError = error.errorFields[0];
      message.error(firstError.errors[0] || '表单数据不完整，请检查');
    } else {
      // API或其他错误
      message.error(error.message || '保存失败，请稍后重试');
    }
  } finally {
    saving.value = false
  }
}

// 预览
const handlePreview = () => {
  if (!form.value.content.trim()) {
    message.warning('请先输入内容')
    return
  }
  
  // 创建临时对象用于预览
  const previewData = {
    ...form.value,
    id: route.params.id || 'draft',
    createdAt: new Date().toISOString()
  }
  localStorage.setItem('dynamicPreview', JSON.stringify(previewData))
  
  router.push({
    name: 'PreviewDynamic',
    params: { id: 'draft' }
  })
}

// 取消
const handleCancel = () => {
  Modal.confirm({
    title: '确认取消',
    content: '未保存的内容将会丢失，确认要取消吗？',
    okText: '确定',
    cancelText: '取消',
    onOk: () => {
      router.push('/dashboard/dynamics')
    }
  })
}

// 处理自定义上传
const handleCustomUpload = async ({ file, onSuccess, onError, onProgress }) => {
  const reportProgress = (percent) => {
    const progress = Math.max(0, Math.min(100, Number(percent) || 0))
    uploadState.value = {
      stage: progress >= 100 ? 'processing' : 'uploading',
      progress,
      message: progress >= 100 ? '正在优化视频' : ''
    }
    onProgress?.({ percent: progress })
  }

  uploadState.value = { stage: 'uploading', progress: 0, message: '' }
  try {
    if (!file || !(file instanceof File)) {
      throw new Error('无效的文件对象')
    }

    let result
    try {
      if (form.value.type === 'image') {
        result = await uploadImage(file, reportProgress)
      } else if (form.value.type === 'audio') {
        result = await uploadAudio(file, reportProgress)
      } else if (form.value.type === 'video') {
        result = await uploadVideo(file, reportProgress)
      } else {
        throw new Error('不支持的文件类型')
      }
    } catch (uploadError) {
      console.error('文件上传失败:', uploadError)
      uploadState.value = { stage: 'error', progress: uploadState.value.progress, message: uploadError.message || '文件上传失败' }
      message.error(uploadError.message || '文件上传失败')
      onError(uploadError)
      return
    }
    
    if (!result || !result.url) {
      const error = new Error('上传结果无效')
      console.error('上传结果无效:', result)
      uploadState.value = { stage: 'error', progress: uploadState.value.progress, message: '服务器返回数据无效' }
      message.error('上传失败：服务器返回数据无效')
      onError(error)
      return
    }

    // 添加到mediaUrls
    if (!form.value.mediaUrls) {
      form.value.mediaUrls = []
    }
    
    const fileUrl = buildApiUrl(result.url)
    
    // 对于音频和视频，只保留一个文件
    if (form.value.type === 'audio' || form.value.type === 'video') {
      form.value.mediaUrls = [fileUrl]
      form.value.fileIds = [result.id]
    } else {
      form.value.mediaUrls.push(fileUrl)
      if (!form.value.fileIds) {
        form.value.fileIds = []
      }
      form.value.fileIds.push(result.id)
    }
    
    // 更新文件列表
    const fileInfo = {
      uid: file.uid,
      name: result.name,
      status: 'done',
      url: fileUrl,
      thumbUrl: fileUrl,
      type: result.type,
      id: result.id,
      posterUrl: result.posterUrl || result.poster_url || undefined,
      size: result.size
    }
    
    if (form.value.type === 'audio' || form.value.type === 'video') {
      fileList.value = [fileInfo]
    } else {
      fileList.value.push(fileInfo)
    }
    
    // 触发表单验证
    formRef.value?.validateFields(['mediaUrls'])
    
    onSuccess(result)
    uploadState.value = { stage: 'success', progress: 100, message: '上传完成，媒体已优化' }
    message.success('上传成功')
  } catch (error) {
    console.error('上传处理失败:', error)
    uploadState.value = { stage: 'error', progress: uploadState.value.progress, message: error.message || '上传失败' }
    message.error(error.message || '上传失败')
    onError(error)
  }
}

// 处理媒体文件移除
const handleMediaRemove = (file) => {
  const index = fileList.value.findIndex(item => item.uid === file.uid)
  if (index !== -1) {
    fileList.value.splice(index, 1)
    form.value.mediaUrls.splice(index, 1)
    if (form.value.fileIds) {
      form.value.fileIds.splice(index, 1)
    }
    // 触发表单验证
    formRef.value?.validateFields(['mediaUrls'])
  }
  return true
}

// 预览媒体文件
const handlePreviewMedia = (file) => {
  const url = file.url || file.thumbUrl
  previewUrl.value = buildApiUrl(url)
  previewPosterUrl.value = file.posterUrl ? buildApiUrl(file.posterUrl) : ''
  previewVisible.value = true
  previewTitle.value = file.name || '预览'
  previewType.value = form.value.type
}

// 图片预览
const handleImagePreview = (file) => {
  handlePreviewMedia(file)
}

const detectMediaType = (file) => {
  const mimeType = String(file?.type || '').toLowerCase()
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType.startsWith('video/')) return 'video'

  const extension = String(file?.name || '').split('.').pop()?.toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'heic', 'heif'].includes(extension)) return 'image'
  if (['mp3', 'wav', 'ogg'].includes(extension)) return 'audio'
  if (['mp4', 'mov', 'm4v', 'webm', 'ogg', 'hevc'].includes(extension)) return 'video'
  return undefined
}

const beforeMediaUpload = (file) => {
  const mediaType = detectMediaType(file)
  if (!mediaType) {
    message.error('仅支持图片、音频或视频文件')
    return false
  }

  const isValid = mediaType === 'image'
    ? beforeImageUpload(file)
    : mediaType === 'audio'
      ? beforeAudioUpload(file)
      : beforeVideoUpload(file)

  if (isValid) form.value.type = mediaType
  return isValid
}

// 检查图片上传
const beforeImageUpload = (file) => {
  const isValidType = checkFileType(file, ['jpg', 'jpeg', 'png', 'gif', 'heic', 'heif'])
  const isValidSize = checkFileSize(file, 50)
  return isValidType && isValidSize
}

// 检查音频上传
const beforeAudioUpload = (file) => {
  const isValidType = checkFileType(file, ['mp3', 'wav', 'ogg'])
  const isValidSize = checkFileSize(file, 5)
  return isValidType && isValidSize
}

// 检查视频上传
const beforeVideoUpload = (file) => {
  const isValidType = checkFileType(file, ['mp4', 'mov', 'm4v', 'webm', 'ogg', 'hevc'])
  const isValidSize = checkFileSize(file, 50)
  return isValidType && isValidSize
}

// 显示文件选择器
const showFileSelector = () => {
  fileSelectorVisible.value = true
  fetchFileList()
}

// 获取文件列表
const fetchFileList = async () => {
  fileListLoading.value = true
  try {
    const params = {
      page: fileCurrentPage.value,
      pageSize: filePageSize.value,
      keyword: fileSearchKeyword.value,
      type: fileTypeFilter.value === 'all' ? undefined : fileTypeFilter.value
    }
    
    applyFileListResponse(await getFileList(params))
  } catch (error) {
    console.error('获取文件列表失败:', error)
    message.error('获取文件列表失败')
    fileListData.value = []
    fileTotal.value = 0
  } finally {
    fileListLoading.value = false
  }
}

// 处理文件搜索
const handleFileSearch = async (value) => {
  fileSearchKeyword.value = value
  fileCurrentPage.value = 1
  fileListLoading.value = true
  
  try {
    const params = {
      page: fileCurrentPage.value,
      pageSize: filePageSize.value,
      keyword: value,
      type: fileTypeFilter.value === 'all' ? undefined : fileTypeFilter.value
    }
    
    applyFileListResponse(await getFileList(params))
  } catch (error) {
    console.error('搜索文件失败:', error)
    message.error('搜索文件失败')
    fileListData.value = []
    fileTotal.value = 0
  } finally {
    fileListLoading.value = false
  }
}

// 处理文件类型筛选
const handleFileTypeChange = async (value) => {
  fileTypeFilter.value = value
  fileCurrentPage.value = 1
  fileListLoading.value = true
  
  try {
    const params = {
      page: fileCurrentPage.value,
      pageSize: filePageSize.value,
      keyword: fileSearchKeyword.value,
      type: value === 'all' ? undefined : value
    }
    
    applyFileListResponse(await getFileList(params))
  } catch (error) {
    console.error('获取文件列表失败:', error)
    message.error('获取文件列表失败')
    fileListData.value = []
    fileTotal.value = 0
  } finally {
    fileListLoading.value = false
  }
}

// 处理分页变化
const handleFilePageChange = (page) => {
  fileCurrentPage.value = page
  fetchFileList()
}

// 检查文件是否被选中
const isFileSelected = (file) => {
  return selectedFiles.value.some(f => f.id === file.id)
}

// 处理文件选择
const handleFileSelect = (file) => {
  const index = selectedFiles.value.findIndex(f => f.id === file.id)
  if (index === -1) {
    // 根据文件类型自动设置动态类型
    if (file.type === 'image') {
      form.value.type = 'image'
    } else if (file.type === 'audio') {
      form.value.type = 'audio'
    } else if (file.type === 'video') {
      form.value.type = 'video'
    }

    // 如果是音频或视频，只允许选择一个文件
    if (form.value.type === 'audio' || form.value.type === 'video') {
      selectedFiles.value = [file]
      message.success('已选择视频文件')
    } else {
      selectedFiles.value.push(file)
      message.success('已选择图片文件')
    }
  } else {
    selectedFiles.value.splice(index, 1)
    message.info('已取消选择')
  }
}

// 处理文件确认
const handleFileConfirm = () => {
  if (selectedFiles.value.length === 0) {
    message.warning('请选择文件')
    return
  }
  
  // 检查文件类型是否一致
  const fileTypes = new Set(selectedFiles.value.map(file => file.type))
  if (fileTypes.size > 1) {
    message.warning('请选择相同类型的文件')
    return
  }
  
  // 更新文件列表和表单数据
  const newFileList = selectedFiles.value.map(file => ({
    uid: `-${file.id}`,
    name: file.name,
    status: 'done',
    url: file.url,
    thumbUrl: file.url,
    type: file.type,
    id: file.id,
    posterUrl: file.posterUrl || file.poster_url
  }))
  
  fileList.value = newFileList
  form.value.mediaUrls = selectedFiles.value.map(file => file.url)
  form.value.fileIds = selectedFiles.value.map(file => file.id)
  
  fileSelectorVisible.value = false
  selectedFiles.value = []
  
  // 触发表单验证
  formRef.value?.validateFields(['mediaUrls', 'type'])
  fetchFileList()
}

// 格式化文件大小
const formatFileSize = (size) => {
  if (!size) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let index = 0
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024
    index++
  }
  return `${size.toFixed(2)} ${units[index]}`
}

// 在 script setup 部分添加 getFullUrl 方法
const getFullUrl = (url) => {
  if (!url) return ''
  return buildApiUrl(url)
}

function restoreLocalDraft() {
  const draft = loadEditorDraft(draftId.value)
  if (!draft) return
  isHydrating = true
  try {
    Object.assign(form.value, draft)
    updateFileList()
    message.info('已恢复本机保存的草稿')
  } finally {
    isHydrating = false
    window.clearTimeout(draftTimer)
    draftTimer = undefined
    dirty.value = false
  }
}

function guardUnsavedChanges(event) {
  if (!dirty.value) return
  event.preventDefault()
  event.returnValue = ''
}

onMounted(async () => {
  await Promise.all([fetchDynamicDetail(), fetchCategories(), fetchTags()])
  restoreLocalDraft()
  mediaTypeReady = true
  window.addEventListener('beforeunload', guardUnsavedChanges)
})

onBeforeUnmount(() => {
  window.clearTimeout(draftTimer)
  draftTimer = undefined
  window.removeEventListener('beforeunload', guardUnsavedChanges)
})
</script>

<style lang="scss" scoped>
.dynamic-edit {
  padding: 20px;
  
  .edit-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    h2 {
      margin: 0;
    }
    
    .header-actions {
      display: flex;
      gap: 10px;
    }
  }
  
  .edit-form {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 320px;
    align-items: start;
    gap: 0 28px;
    background: #fff;
    padding: 24px;
    border: 1px solid #e8edf4;
    border-radius: 16px;
    box-shadow: 0 16px 50px rgba(15, 35, 65, 0.06);

    :deep(.editor-title-field),
    :deep(.editor-content-field) {
      grid-column: 1;
    }

    :deep(.editor-settings-field) {
      grid-column: 2;
    }

    :deep(.editor-content-field) {
      grid-row: 2 / span 8;
      min-width: 0;
    }

    :deep(.editor-form-actions) {
      grid-column: 1 / -1;
      margin: 8px 0 0;
      padding-top: 20px;
      border-top: 1px solid #eef1f5;
    }
  }
  
  .upload-tip {
    font-size: 12px;
    color: #888;
    margin-top: 5px;
  }

  .taxonomy-control {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 4px;
  }

  .taxonomy-add {
    padding-inline: 4px;
    color: #315bea;
    font-size: 12px;
    white-space: nowrap;
  }

  .content-type-control {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }

  .media-upload-status {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 14px;
    align-items: center;
    width: 100%;
    margin-top: 10px;
    padding: 10px 12px;
    border: 1px solid #e6ebf3;
    border-radius: 10px;
    background: #f8fafc;
    color: #6b7890;
    font-size: 12px;

    strong {
      color: #315bea;
      font-weight: 600;
    }

    &.is-processing {
      border-color: #b9c9ff;
      background: #f0f4ff;
      color: #315bea;
    }

    &.is-success {
      border-color: #b7ebc6;
      background: #f2fff5;
      color: #278343;
    }

    &.is-error {
      border-color: #ffc9c9;
      background: #fff5f5;
      color: #c63838;
    }
  }
  
  .media-preview {
    margin-top: 16px;
    width: 100%;
    
    audio, video {
      width: 100%;
      max-width: 100%;
    }
  }
  
  .media-upload-container {
    display: flex;
    align-items: flex-start;
  }
  
  .file-selector {
    .file-selector-header {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
      margin-bottom: 16px;

      .file-search {
        width: min(100%, 280px);
        max-width: 280px;
      }

      .file-type-filter {
        width: 140px;
      }
    }
    
    .file-list {
      min-height: 400px;
      max-height: 600px;
      overflow-y: auto;
      margin-bottom: 16px;
      
      .file-item {
        position: relative;
        border: 1px solid #d9d9d9;
        border-radius: 4px;
        padding: 8px;
        cursor: pointer;
        transition: border-color 160ms ease, box-shadow 160ms ease, background-color 160ms ease;
        
        &:hover {
          border-color: #1890ff;
          box-shadow: 0 0 8px rgba(24, 144, 255, 0.2);
        }
        
        &.file-item-selected {
          border-color: #1890ff;
          background-color: #e6f7ff;
          box-shadow: 0 0 8px rgba(24, 144, 255, 0.3);
        }
        
        .file-preview {
          position: relative;
          width: 100%;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #fafafa;
          margin-bottom: 8px;
          border-radius: 4px;
          overflow: hidden;
          
          .file-preview-content {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            
            img, video, audio {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
            }
          }
          
          .file-selected-icon {
            position: absolute;
            top: 8px;
            right: 8px;
            width: 24px;
            height: 24px;
            background-color: #1890ff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 14px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
        }
        
        .file-info {
          .file-name {
            font-size: 12px;
            color: #333;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          
          .file-size {
            font-size: 12px;
            color: #999;
          }
        }
      }
    }
    
    .file-selector-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 16px;
      
      .selected-info {
        color: #1890ff;
        font-size: 14px;
      }
      
      .file-selector-actions {
        display: flex;
        gap: 8px;
      }
    }
  }
}

@media (max-width: 1080px) {
  .dynamic-edit {
    padding: 12px;

    .edit-header {
      position: sticky;
      top: 0;
      z-index: 5;
      padding: 12px 0;
      background: var(--color-page, #f5f7fa);
    }

    .edit-form {
      grid-template-columns: minmax(0, 1fr);
      padding: 18px;

      :deep(.editor-title-field),
      :deep(.editor-content-field),
      :deep(.editor-settings-field),
      :deep(.editor-form-actions) {
        grid-column: 1;
        grid-row: auto;
      }
    }
  }
}

@media (max-width: 640px) {
  .dynamic-edit {
    .edit-header {
      align-items: flex-start;
      gap: 12px;

      .header-actions {
        flex-wrap: wrap;
        justify-content: flex-end;
      }
    }

    .edit-form {
      padding: 14px;
      border-radius: 12px;
      display: flex;
      flex-direction: column;

      :deep(.editor-title-field),
      :deep(.editor-content-field),
      :deep(.editor-settings-field),
      :deep(.editor-form-actions) {
        grid-column: auto;
        grid-row: auto;
        width: 100%;
      }
    }

    .media-upload-container {
      flex-direction: column;
      gap: 10px;
      width: 100%;
    }

        .media-upload-field :deep(.ant-upload-select-picture-card),
        .media-upload-field :deep(.ant-upload) {
          min-width: 112px;
          min-height: 48px;
          touch-action: manipulation;
        }

        .file-selector {
          .file-preview {
            margin-bottom: 0;
          }

          .file-info {
            display: none;
          }
        }

        .content-type-control {
      align-items: flex-start;
      flex-direction: column;
      gap: 10px;
    }

    .quick-media-upload,
    .quick-media-upload :deep(.ant-upload) {
      width: 100%;
    }

    .quick-media-upload :deep(.ant-btn) {
      width: 100%;
    }
  }
}

:global([data-theme='dark']) {
  .edit-form {
    background: #1f1f1f;
  }
}
</style>
