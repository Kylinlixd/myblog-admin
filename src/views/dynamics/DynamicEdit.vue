<template>
  <div class="dynamic-edit">
    <div class="edit-header">
      <h2>{{ isEdit ? '编辑动态' : '新建动态' }}</h2>
      <div class="header-actions">
        <el-button @click="handlePreview" v-if="form.content">
          <el-icon><View /></el-icon>预览
        </el-button>
        <el-button @click="handleSave" type="primary">
          <el-icon><Check /></el-icon>保存
        </el-button>
        <el-button @click="handleCancel">
          <el-icon><Close /></el-icon>取消
        </el-button>
      </div>
    </div>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      class="edit-form"
    >
      <el-form-item label="内容类型" prop="type">
        <el-radio-group v-model="form.type">
          <el-radio label="text">纯文本</el-radio>
          <el-radio label="image">图文</el-radio>
          <el-radio label="audio">音频</el-radio>
          <el-radio label="video">视频</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="内容" prop="content">
        <el-input
          v-model="form.content"
          type="textarea"
          :rows="10"
          placeholder="请输入动态内容，支持Markdown格式"
        />
      </el-form-item>

      <!-- 图片上传 -->
      <el-form-item
        label="图片"
        prop="images"
        v-if="form.type === 'image'"
      >
        <el-upload
          class="upload-list"
          :action="null"
          :file-list="form.images"
          :on-success="handleImageSuccess"
          :on-remove="handleImageRemove"
          :on-preview="handleImagePreview"
          :before-upload="beforeImageUpload"
          :http-request="() => {}"
          list-type="picture-card"
          multiple
          accept="image/*"
        >
          <el-icon><Plus /></el-icon>
        </el-upload>
      </el-form-item>

      <!-- 音频上传 -->
      <el-form-item
        label="音频"
        prop="audio"
        v-if="form.type === 'audio'"
      >
        <el-upload
          class="upload-single"
          :action="null"
          :file-list="form.audio ? [form.audio] : []"
          :on-success="handleAudioSuccess"
          :on-remove="handleAudioRemove"
          :before-upload="beforeAudioUpload"
          :http-request="() => {}"
          accept="audio/*"
        >
          <el-button type="primary">
            <el-icon><Upload /></el-icon>上传音频
          </el-button>
        </el-upload>
      </el-form-item>

      <!-- 视频上传 -->
      <el-form-item
        label="视频"
        prop="video"
        v-if="form.type === 'video'"
      >
        <el-upload
          class="upload-single"
          :action="null"
          :file-list="form.video ? [form.video] : []"
          :on-success="handleVideoSuccess"
          :on-remove="handleVideoRemove"
          :before-upload="beforeVideoUpload"
          :http-request="() => {}"
          accept="video/*"
        >
          <el-button type="primary">
            <el-icon><Upload /></el-icon>上传视频
          </el-button>
        </el-upload>
      </el-form-item>

      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio label="draft">草稿</el-radio>
          <el-radio label="published">发布</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { View, Check, Close, Plus, Upload } from '@element-plus/icons-vue'
import { getDynamicDetail, createDynamic, updateDynamic } from '../../api/blog'
import { uploadImage, uploadAudio, uploadVideo, checkFileSize, checkFileType } from '../../utils/upload'

const route = useRoute()
const router = useRouter()
const formRef = ref(null)

// 判断是否为编辑模式
const isEdit = computed(() => route.params.id !== undefined)

// 表单数据
const form = ref({
  type: 'text',
  content: '',
  images: [],
  audio: null,
  video: null,
  status: 'draft'
})

// 表单验证规则
const rules = {
  type: [{ required: true, message: '请选择内容类型', trigger: 'change' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
  images: [
    {
      required: true,
      message: '请上传图片',
      trigger: 'change',
      validator: (rule, value, callback) => {
        if (form.value.type === 'image' && (!value || value.length === 0)) {
          callback(new Error('请上传图片'))
        } else {
          callback()
        }
      }
    }
  ],
  audio: [
    {
      required: true,
      message: '请上传音频',
      trigger: 'change',
      validator: (rule, value, callback) => {
        if (form.value.type === 'audio' && !value) {
          callback(new Error('请上传音频'))
        } else {
          callback()
        }
      }
    }
  ],
  video: [
    {
      required: true,
      message: '请上传视频',
      trigger: 'change',
      validator: (rule, value, callback) => {
        if (form.value.type === 'video' && !value) {
          callback(new Error('请上传视频'))
        } else {
          callback()
        }
      }
    }
  ]
}

// 获取动态详情
const fetchDynamicDetail = async () => {
  if (!isEdit.value) return
  
  try {
    const response = await getDynamicDetail(route.params.id)
    if (response.code === 200) {
      form.value = response.data
    } else {
      ElMessage.error(response.message || '获取动态详情失败')
      handleCancel()
    }
  } catch (error) {
    ElMessage.error('获取动态详情失败')
    console.error('获取动态详情失败:', error)
    handleCancel()
  }
}

// 图片上传前检查
const beforeImageUpload = (file) => {
  const isImage = checkFileType(file, ['jpg', 'jpeg', 'png', 'gif'])
  const isLt2M = checkFileSize(file, 2)
  return isImage && isLt2M
}

// 音频上传前检查
const beforeAudioUpload = (file) => {
  const isAudio = checkFileType(file, ['mp3', 'wav', 'ogg'])
  const isLt10M = checkFileSize(file, 10)
  return isAudio && isLt10M
}

// 视频上传前检查
const beforeVideoUpload = (file) => {
  const isVideo = checkFileType(file, ['mp4', 'webm', 'ogg'])
  const isLt50M = checkFileSize(file, 50)
  return isVideo && isLt50M
}

// 图片上传成功
const handleImageSuccess = async (response, file) => {
  try {
    const result = await uploadImage(file.raw)
    form.value.images.push({
      name: file.name,
      url: result.url
    })
  } catch (error) {
    console.error('图片上传失败:', error)
  }
}

// 图片移除
const handleImageRemove = (file) => {
  const index = form.value.images.findIndex(img => img.url === file.url)
  if (index !== -1) {
    form.value.images.splice(index, 1)
  }
}

// 图片预览
const handleImagePreview = (file) => {
  // 使用Element Plus的图片预览功能
}

// 音频上传成功
const handleAudioSuccess = async (response, file) => {
  try {
    const result = await uploadAudio(file.raw)
    form.value.audio = {
      name: file.name,
      url: result.url
    }
  } catch (error) {
    console.error('音频上传失败:', error)
  }
}

// 音频移除
const handleAudioRemove = () => {
  form.value.audio = null
}

// 视频上传成功
const handleVideoSuccess = async (response, file) => {
  try {
    const result = await uploadVideo(file.raw)
    form.value.video = {
      name: file.name,
      url: result.url,
      cover: result.cover
    }
  } catch (error) {
    console.error('视频上传失败:', error)
  }
}

// 视频移除
const handleVideoRemove = () => {
  form.value.video = null
}

// 预览
const handlePreview = () => {
  router.push({
    name: 'PreviewDynamic',
    params: { id: route.params.id || 'preview' },
    query: { data: JSON.stringify(form.value) }
  })
}

// 保存
const handleSave = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    const saveData = { ...form.value }
    if (saveData.type !== 'image') delete saveData.images
    if (saveData.type !== 'audio') delete saveData.audio
    if (saveData.type !== 'video') delete saveData.video
    
    const response = isEdit.value
      ? await updateDynamic(route.params.id, saveData)
      : await createDynamic(saveData)
      
    if (response.code === 200) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
      router.push('/dashboard/dynamics')
    } else {
      ElMessage.error(response.message || (isEdit.value ? '更新失败' : '创建失败'))
    }
  } catch (error) {
    if (error.message) {
      ElMessage.error(error.message)
    } else {
      ElMessage.error('表单验证失败')
    }
  }
}

// 取消
const handleCancel = () => {
  ElMessageBox.confirm(
    '确定要取消编辑吗？未保存的内容将会丢失。',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    router.push('/dashboard/dynamics')
  }).catch(() => {})
}

// 初始化
onMounted(() => {
  if (isEdit.value) {
    fetchDynamicDetail()
  }
})
</script>

<style scoped>
.dynamic-edit {
  padding: 20px;
}

.edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.edit-form {
  max-width: 800px;
  margin: 0 auto;
}

.upload-list {
  width: 100%;
}

.upload-single {
  width: 100%;
}

:deep(.el-upload--picture-card) {
  width: 100px;
  height: 100px;
  line-height: 100px;
}

:deep(.el-upload-list--picture-card .el-upload-list__item) {
  width: 100px;
  height: 100px;
}
</style> 