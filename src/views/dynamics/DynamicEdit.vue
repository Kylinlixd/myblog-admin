<template>
  <div class="dynamic-edit">
    <div class="edit-header">
      <h2>{{ isEdit ? '编辑动态' : '新建动态' }}</h2>
      <div class="header-actions">
        <a-button @click="handlePreview" v-if="form.content">
          <template #icon><eye-outlined /></template>预览
        </a-button>
        <a-button @click="handleSave" type="primary">
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
      <a-form-item label="分类" name="categoryId">
        <a-select
          v-model:value="form.categoryId"
          placeholder="请选择分类"
          :loading="categoriesLoading"
          :options="categories.map(item => ({ value: item.id, label: item.name }))"
        >
        </a-select>
      </a-form-item>

      <a-form-item label="标签" name="tags">
        <a-select
          v-model:value="form.tags"
          mode="multiple"
          placeholder="请选择标签"
          :loading="tagsLoading"
          :options="tags.map(item => ({ value: item.id, label: item.name }))"
        >
        </a-select>
      </a-form-item>

      <a-form-item label="内容类型" name="type">
        <a-radio-group v-model:value="form.type">
          <a-radio value="text">纯文本</a-radio>
          <a-radio value="image">图文</a-radio>
          <a-radio value="audio">音频</a-radio>
          <a-radio value="video">视频</a-radio>
        </a-radio-group>
      </a-form-item>

      <a-form-item label="内容" name="content">
        <a-textarea
          v-model:value="form.content"
          :rows="10"
          placeholder="请输入动态内容，支持Markdown格式"
        />
      </a-form-item>

      <!-- 图片上传 -->
      <a-form-item
        label="图片"
        name="mediaUrls"
        v-if="form.type === 'image'"
      >
        <a-upload
          list-type="picture-card"
          :file-list="fileList"
          :before-upload="beforeImageUpload"
          :custom-request="handleCustomUpload"
          :remove="handleMediaRemove"
          :preview="handleImagePreview"
          multiple
          accept="image/*"
        >
          <div>
            <plus-outlined />
            <div style="margin-top: 8px">上传</div>
          </div>
          <template #itemRender="{ file }">
            <div>
              <img :src="file.url || file.thumbUrl" alt="image" style="width: 100%" />
              <div class="ant-upload-list-item-actions">
                <a-button type="link" @click="() => handlePreviewMedia(file)">
                  <eye-outlined />
                </a-button>
                <a-button type="link" @click="() => handleMediaRemove(file)">
                  <delete-outlined />
                </a-button>
              </div>
            </div>
          </template>
        </a-upload>
        <div class="upload-tip">支持 jpg、jpeg、png、gif 格式，单个文件不超过 2MB</div>
      </a-form-item>

      <!-- 音频上传 -->
      <a-form-item
        label="音频"
        name="mediaUrls"
        v-if="form.type === 'audio'"
      >
        <a-upload
          :file-list="fileList"
          :before-upload="beforeAudioUpload"
          :custom-request="handleCustomUpload"
          :remove="handleMediaRemove"
          accept="audio/*"
        >
          <a-button type="primary">
            <template #icon><upload-outlined /></template>上传音频
          </a-button>
        </a-upload>
        <div v-if="form.mediaUrls && form.mediaUrls.length > 0" class="media-preview">
          <audio controls :src="form.mediaUrls[0]"></audio>
        </div>
      </a-form-item>

      <!-- 视频上传 -->
      <a-form-item
        label="视频"
        name="mediaUrls"
        v-if="form.type === 'video'"
      >
        <a-upload
          :file-list="fileList"
          :before-upload="beforeVideoUpload"
          :custom-request="handleCustomUpload"
          :remove="handleMediaRemove"
          accept="video/*"
        >
          <a-button type="primary">
            <template #icon><upload-outlined /></template>上传视频
          </a-button>
        </a-upload>
        <div v-if="form.mediaUrls && form.mediaUrls.length > 0" class="media-preview">
          <video controls :src="form.mediaUrls[0]" style="max-width: 100%"></video>
        </div>
      </a-form-item>

      <a-form-item label="状态" name="status">
        <a-radio-group v-model:value="form.status">
          <a-radio value="draft">草稿</a-radio>
          <a-radio value="published">发布</a-radio>
        </a-radio-group>
      </a-form-item>
      
      <a-form-item :wrapper-col="{ span: 18, offset: 3 }">
        <a-button type="primary" @click="handleSave">保存</a-button>
        <a-button style="margin-left: 10px" @click="handleCancel">取消</a-button>
      </a-form-item>
    </a-form>
    
    <a-modal
      v-model:visible="previewVisible"
      :title="previewTitle"
      :footer="null"
      width="800px"
    >
      <img v-if="previewType === 'image'" alt="预览" style="width: 100%" :src="previewUrl" />
      <audio v-if="previewType === 'audio'" controls style="width: 100%" :src="previewUrl"></audio>
      <video v-if="previewType === 'video'" controls style="width: 100%" :src="previewUrl"></video>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import { 
  EyeOutlined, 
  CheckOutlined, 
  CloseOutlined, 
  PlusOutlined, 
  UploadOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue'
import { getDynamicDetail, createDynamic, updateDynamic } from '../../api/dynamic'
import { uploadImage, uploadAudio, uploadVideo, checkFileSize, checkFileType } from '../../utils/upload'
import { getCategoryList } from '../../api/category'
import { getTagList } from '../../api/tag'

const route = useRoute()
const router = useRouter()
const formRef = ref(null)

// 判断是否为编辑模式
const isEdit = computed(() => route.params.id !== undefined)

// 表单数据 - 修改为使用 mediaUrls 统一存储媒体文件
const form = ref({
  type: 'text',
  content: '',
  mediaUrls: [],
  status: 'draft',
  categoryId: undefined,
  tags: []
})

// 文件列表 - 上传组件使用
const fileList = ref([])

// 预览相关状态
const previewVisible = ref(false)
const previewUrl = ref('')
const previewTitle = ref('')
const previewType = ref('image')

// 分类和标签数据
const categories = ref([])
const tags = ref([])
const categoriesLoading = ref(false)
const tagsLoading = ref(false)

// 表单验证规则
const rules = {
  type: [{ required: true, message: '请选择内容类型', trigger: 'change' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
  mediaUrls: [
    {
      validator: (rule, value) => {
        if ((form.value.type === 'image' || form.value.type === 'audio' || form.value.type === 'video') 
            && (!value || value.length === 0)) {
          return Promise.reject(`请上传${form.value.type === 'image' ? '图片' : form.value.type === 'audio' ? '音频' : '视频'}`)
        }
        return Promise.resolve()
      },
      trigger: 'change'
    }
  ]
}

// 获取分类列表
const fetchCategories = async () => {
  categoriesLoading.value = true
  try {
    const data = await getCategoryList()
    categories.value = data || []
  } catch (error) {
    console.error('获取分类列表失败:', error)
    message.error('获取分类列表失败')
  } finally {
    categoriesLoading.value = false
  }
}

// 获取标签列表
const fetchTags = async () => {
  tagsLoading.value = true
  try {
    const data = await getTagList()
    tags.value = data || []
  } catch (error) {
    console.error('获取标签列表失败:', error)
    message.error('获取标签列表失败')
  } finally {
    tagsLoading.value = false
  }
}

// 获取动态详情
const fetchDynamicDetail = async () => {
  if (!isEdit.value) return
  
  try {
    const response = await getDynamicDetail(route.params.id)
    if (response.code === 200) {
      const data = response.data
      
      // 填充表单数据
      form.value.type = data.type
      form.value.content = data.content
      form.value.status = data.status
      form.value.mediaUrls = data.mediaUrls || []
      form.value.categoryId = data.categoryId
      form.value.tags = data.tags?.map(tag => tag.id) || []
      
      // 更新文件列表用于上传组件显示
      updateFileList()
    } else {
      message.error(response.message || '获取动态详情失败')
    }
  } catch (error) {
    console.error('获取动态详情失败:', error)
    message.error('获取动态详情失败')
  }
}

// 更新文件列表
const updateFileList = () => {
  if (!form.value.mediaUrls || form.value.mediaUrls.length === 0) {
    fileList.value = []
    return
  }
  
  fileList.value = form.value.mediaUrls.map((url, index) => {
    return {
      uid: `-${index}`,
      name: `file-${index}`,
      status: 'done',
      url: url
    }
  })
}

// 保存动态
const handleSave = async () => {
  try {
    // 表单验证
    await formRef.value.validate();
    
    // 验证媒体文件
    if (form.value.type !== 'text' && (!form.value.mediaUrls || form.value.mediaUrls.length === 0)) {
      message.error(`请上传${form.value.type === 'image' ? '图片' : form.value.type === 'audio' ? '音频' : '视频'}`);
      return;
    }
    
    // 准备提交的数据，确保格式正确
    const dynamicData = {
      type: form.value.type,
      content: form.value.content.trim(),
      status: form.value.status,
      mediaUrls: Array.isArray(form.value.mediaUrls) ? form.value.mediaUrls : [],
      categoryId: form.value.categoryId,
      tags: form.value.tags
    };
    
    // 打印将要提交的数据，用于调试
    console.log('即将提交的动态数据:', dynamicData);
    
    // 根据是否编辑模式选择API
    let response;
    if (isEdit.value) {
      response = await updateDynamic(route.params.id, dynamicData);
    } else {
      response = await createDynamic(dynamicData);
    }
    
    // 处理响应
    if (response.code === 200) {
      message.success(isEdit.value ? '动态更新成功' : '动态创建成功');
      router.push('/dashboard/dynamics');
    } else {
      // 显示API返回的具体错误信息
      message.error(response.message || (isEdit.value ? '更新失败' : '创建失败'));
      console.error('动态保存失败:', response.error || response.message);
    }
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
  }
}

// 预览
const handlePreview = () => {
  if (!form.value.content) {
    message.warning('请先输入内容')
    return
  }
  
  // 创建临时对象用于预览
  const previewData = { ...form.value }
  localStorage.setItem('dynamicPreview', JSON.stringify(previewData))
  
  router.push('/dashboard/dynamics/preview')
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
const handleCustomUpload = async ({ file, onSuccess, onError }) => {
  try {
    let result
    
    if (form.value.type === 'image') {
      result = await uploadImage(file)
    } else if (form.value.type === 'audio') {
      result = await uploadAudio(file)
    } else if (form.value.type === 'video') {
      result = await uploadVideo(file)
    }
    
    if (result && result.url) {
      // 添加到mediaUrls
      if (!form.value.mediaUrls) {
        form.value.mediaUrls = []
      }
      
      // 对于音频和视频，只保留一个文件
      if (form.value.type === 'audio' || form.value.type === 'video') {
        form.value.mediaUrls = [result.url]
      } else {
        form.value.mediaUrls.push(result.url)
      }
      
      // 更新文件列表
      updateFileList()
      
      onSuccess(result)
      message.success('上传成功')
    } else {
      onError()
      message.error('上传失败')
    }
  } catch (error) {
    onError()
    console.error('上传失败:', error)
    message.error('上传失败')
  }
}

// 处理媒体文件移除
const handleMediaRemove = (file) => {
  const index = fileList.value.findIndex(item => item.uid === file.uid)
  if (index !== -1) {
    fileList.value.splice(index, 1)
    form.value.mediaUrls.splice(index, 1)
  }
  return true
}

// 预览媒体文件
const handlePreviewMedia = (file) => {
  previewUrl.value = file.url || file.thumbUrl
  previewVisible.value = true
  previewTitle.value = file.name || '预览'
  previewType.value = form.value.type
}

// 图片预览
const handleImagePreview = (file) => {
  handlePreviewMedia(file)
}

// 检查图片上传
const beforeImageUpload = (file) => {
  const isValidType = checkFileType(file, ['jpg', 'jpeg', 'png', 'gif'])
  const isValidSize = checkFileSize(file, 2)
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
  const isValidType = checkFileType(file, ['mp4', 'webm', 'ogg'])
  const isValidSize = checkFileSize(file, 20)
  return isValidType && isValidSize
}

onMounted(() => {
  fetchDynamicDetail()
  fetchCategories()
  fetchTags()
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
    background: #fff;
    padding: 24px;
    border-radius: 4px;
  }
  
  .upload-tip {
    font-size: 12px;
    color: #888;
    margin-top: 5px;
  }
  
  .media-preview {
    margin-top: 16px;
  }
}

:global([data-theme='dark']) {
  .edit-form {
    background: #1f1f1f;
  }
}
</style>