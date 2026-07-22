<template>
  <div class="dynamic-form">
    <a-form
      :model="formState"
      :rules="rules"
      ref="formRef"
      layout="vertical"
      @finish="handleSubmit"
    >
      <!-- 标题输入框 -->
      <a-form-item
        label="标题"
        name="title"
        :rules="[
          { required: true, message: '请输入标题' },
          { max: 100, message: '标题不能超过100个字符' }
        ]"
      >
        <a-input
          v-model:value="formState.title"
          placeholder="请输入动态标题"
          :maxLength="100"
          show-count
        />
      </a-form-item>

      <!-- 分类选择 -->
      <a-form-item
        label="分类"
        name="categoryId"
        :rules="[{ required: true, message: '请选择分类' }]"
      >
        <a-select
          v-model:value="formState.categoryId"
          placeholder="请选择分类"
          :loading="categoriesLoading"
        >
          <a-select-option v-for="category in categories" :key="category.id" :value="category.id">
            {{ category.name }}
          </a-select-option>
        </a-select>
      </a-form-item>

      <!-- 标签选择 -->
      <a-form-item
        label="标签"
        name="tagIds"
      >
        <a-select
          v-model:value="formState.tagIds"
          placeholder="请选择标签"
          mode="multiple"
          :loading="tagsLoading"
          :maxTagCount="5"
          :maxTagTextLength="10"
        >
          <a-select-option v-for="tag in tags" :key="tag.id" :value="tag.id">
            {{ tag.name }}
          </a-select-option>
        </a-select>
      </a-form-item>

      <!-- 内容类型 -->
      <a-form-item
        label="内容类型"
        name="type"
        :rules="[{ required: true, message: '请选择内容类型' }]"
      >
        <a-radio-group v-model:value="formState.type">
          <a-radio value="text">纯文本</a-radio>
          <a-radio value="image">图文</a-radio>
          <a-radio value="audio">音频</a-radio>
          <a-radio value="video">视频</a-radio>
        </a-radio-group>
      </a-form-item>

      <!-- 内容输入 -->
      <a-form-item
        label="内容"
        name="content"
        :rules="[
          { required: true, message: '请输入内容' },
          { max: 5000, message: '内容不能超过5000个字符' }
        ]"
      >
        <a-textarea
          v-model:value="formState.content"
          placeholder="请输入动态内容"
          :rows="6"
          :maxLength="5000"
          show-count
        />
      </a-form-item>

      <!-- 媒体上传 -->
      <a-form-item
        v-if="formState.type !== 'text'"
        label="媒体文件"
        name="mediaUrls"
      >
        <a-upload
          v-if="formState.type === 'image'"
          v-model:file-list="fileList"
          :customRequest="handleCustomUpload"
          :beforeUpload="beforeUpload"
          list-type="picture-card"
          :maxCount="9"
          multiple
        >
          <div v-if="fileList.length < 9">
            <plus-outlined />
            <div style="margin-top: 8px">上传图片</div>
          </div>
        </a-upload>

        <a-upload
          v-else-if="formState.type === 'audio'"
          v-model:file-list="fileList"
          :customRequest="handleCustomUpload"
          :beforeUpload="beforeUpload"
          :maxCount="1"
        >
          <a-button>
            <upload-outlined /> 上传音频
          </a-button>
        </a-upload>

        <a-upload
          v-else-if="formState.type === 'video'"
          v-model:file-list="fileList"
          :customRequest="handleCustomUpload"
          :beforeUpload="beforeUpload"
          :maxCount="1"
        >
          <a-button>
            <upload-outlined /> 上传视频
          </a-button>
        </a-upload>
      </a-form-item>

      <!-- 位置信息 -->
      <a-form-item
        label="位置"
        name="location"
      >
        <a-input
          v-model:value="formState.location.address"
          placeholder="请输入位置信息"
          :maxLength="100"
        />
      </a-form-item>

      <!-- 发布状态 -->
      <a-form-item
        label="发布状态"
        name="status"
      >
        <a-radio-group v-model:value="formState.status">
          <a-radio value="draft">草稿</a-radio>
          <a-radio value="published">发布</a-radio>
        </a-radio-group>
      </a-form-item>

      <!-- 是否公开 -->
      <a-form-item
        label="是否公开"
        name="isPublic"
      >
        <a-switch v-model:checked="formState.isPublic" />
      </a-form-item>

      <!-- 提交按钮 -->
      <a-form-item>
        <a-space>
          <a-button type="primary" html-type="submit" :loading="loading">
            {{ props.dynamicId ? '更新' : '发布' }}
          </a-button>
          <a-button @click="handleCancel">取消</a-button>
        </a-space>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { PlusOutlined, UploadOutlined } from '@ant-design/icons-vue'
import { createDynamic, updateDynamic, getDynamicDetail } from '@/api/dynamic'
import { getCategoryList } from '@/api/category'
import { getTagList } from '@/api/tag'
import { uploadFile } from '@/api/file'

const props = defineProps({
  dynamicId: {
    type: [String, Number],
    default: null
  }
})

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const categoriesLoading = ref(false)
const tagsLoading = ref(false)
const fileList = ref([])

// 分类和标签数据
const categories = ref([])
const tags = ref([])

// 表单状态
const formState = reactive({
  title: '',
  categoryId: undefined,
  tagIds: [],
  type: 'text',
  content: '',
  mediaUrls: [],
  location: {
    latitude: undefined,
    longitude: undefined,
    address: ''
  },
  isPublic: true,
  status: 'draft'
})

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入标题' },
    { max: 100, message: '标题不能超过100个字符' }
  ],
  content: [
    { required: true, message: '请输入内容' },
    { max: 5000, message: '内容不能超过5000个字符' }
  ],
  categoryId: [
    { required: true, message: '请选择分类' }
  ],
  type: [
    { required: true, message: '请选择内容类型' }
  ]
}

// 获取分类列表
const fetchCategories = async () => {
  try {
    categoriesLoading.value = true
    const response = await getCategoryList()
    categories.value = response.results || []
  } catch (error) {
    console.error('获取分类列表失败:', error)
    message.error('获取分类列表失败')
  } finally {
    categoriesLoading.value = false
  }
}

// 获取标签列表
const fetchTags = async () => {
  try {
    tagsLoading.value = true
    const response = await getTagList()
    tags.value = response.results || []
  } catch (error) {
    console.error('获取标签列表失败:', error)
    message.error('获取标签列表失败')
  } finally {
    tagsLoading.value = false
  }
}

// 获取动态详情
const fetchDynamicDetail = async (id) => {
  try {
    loading.value = true
    const response = await getDynamicDetail(id)
    if (response && response.code === 200 && response.data) {
      const data = response.data
      // 更新表单数据
      formState.title = data.title || ''
      formState.content = data.content || ''
      formState.type = data.type || 'text'
      formState.status = data.status || 'draft'
      formState.categoryId = data.category?.id
      formState.tagIds = data.tags?.map(tag => tag.id) || []
      formState.mediaUrls = data.media_urls || []
      formState.location.address = data.location || ''
      formState.isPublic = data.is_public ?? true

      // 更新文件列表
      if (data.media_urls?.length) {
        fileList.value = data.media_urls.map((url, index) => ({
          uid: `-${index}`,
          name: url.split('/').pop(),
          status: 'done',
          url: url
        }))
      }
    }
  } catch (error) {
    console.error('获取动态详情失败:', error)
    message.error('获取动态详情失败')
  } finally {
    loading.value = false
  }
}

// 处理表单提交
const handleSubmit = async (values) => {
  try {
    loading.value = true
    const formData = {
      ...values,
      title: values.title.trim(),
      content: values.content.trim(),
      media_urls: fileList.value.map(file => file.url || file.response?.url)
    }

    if (props.dynamicId) {
      await updateDynamic(props.dynamicId, formData)
      message.success('更新成功')
    } else {
      await createDynamic(formData)
      message.success('创建成功')
    }

    router.push('/dashboard/dynamics')
  } catch (error) {
    console.error('提交失败:', error)
    message.error(error.message || '提交失败')
  } finally {
    loading.value = false
  }
}

// 处理取消
const handleCancel = () => {
  router.back()
}

// 上传前检查
const beforeUpload = (file) => {
  const isLt100M = file.size / 1024 / 1024 < 100
  if (!isLt100M) {
    message.error('文件大小不能超过100MB!')
    return false
  }
  return true
}

// 处理自定义上传
const handleCustomUpload = async ({ file, onSuccess, onError }) => {
  try {
    const result = await uploadFile({
      file,
      file_type: formState.type
    })
    
    if (result && result.code === 200) {
      onSuccess(result)
    } else {
      message.error(result?.message || '上传失败')
      onError(new Error(result?.message || '上传失败'))
    }
  } catch (error) {
    console.error('上传失败:', error)
    message.error('上传失败')
    onError(error)
  }
}

// 监听内容类型变化
watch(() => formState.type, (newType) => {
  // 切换类型时清空文件列表
  fileList.value = []
})

onMounted(async () => {
  // 获取分类和标签数据
  await Promise.all([fetchCategories(), fetchTags()])
  
  // 如果是编辑模式，获取动态详情
  if (props.dynamicId) {
    await fetchDynamicDetail(props.dynamicId)
  }
})
</script>

<style scoped lang="scss">
.dynamic-form {
  padding: 24px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

  :deep(.ant-form-item) {
    margin-bottom: 24px;
  }

  :deep(.ant-form-item-label) {
    font-weight: 500;
  }

  :deep(.ant-input),
  :deep(.ant-input-textarea) {
    border-radius: 4px;
    
    &:hover,
    &:focus {
      border-color: #40a9ff;
    }
  }

  :deep(.ant-input-textarea) {
    resize: vertical;
  }

  :deep(.ant-upload-list) {
    .ant-upload-list-item {
      border-radius: 4px;
    }
  }

  :deep(.ant-upload.ant-upload-select) {
    border-radius: 4px;
  }
}
</style>
