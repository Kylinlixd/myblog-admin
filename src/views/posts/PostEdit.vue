<template>
  <div class="dynamic-edit">
    <div class="page-header">
      <h2>{{ isEdit ? '编辑动态' : '新建动态' }}</h2>
      <div class="header-actions">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">
          保存
        </el-button>
      </div>
    </div>
    
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="80px"
      class="edit-form"
    >
      <el-form-item label="内容" prop="content">
        <MdEditor
          v-model="form.content"
          :preview="false"
          :toolbars="toolbars"
          @onUploadImg="handleUploadImage"
        />
      </el-form-item>
      
      <el-form-item label="类型" prop="type">
        <el-select v-model="form.type" placeholder="请选择类型">
          <el-option label="图文" value="image" />
          <el-option label="视频" value="video" />
          <el-option label="音频" value="audio" />
          <el-option label="纯文本" value="text" />
        </el-select>
      </el-form-item>
      
      <!-- 图片上传 -->
      <el-form-item v-if="form.type === 'image'" label="图片" prop="images">
        <el-upload
          v-model:file-list="form.images"
          action="/api/upload"
          list-type="picture-card"
          :on-preview="handlePictureCardPreview"
          :on-remove="handleRemove"
          :on-success="handleUploadSuccess"
          :before-upload="beforeImageUpload"
          multiple
        >
          <el-icon><Plus /></el-icon>
        </el-upload>
        <el-dialog v-model="dialogVisible">
          <img w-full :src="dialogImageUrl" alt="Preview Image" />
        </el-dialog>
      </el-form-item>
      
      <!-- 视频上传 -->
      <el-form-item v-if="form.type === 'video'" label="视频" prop="video">
        <el-upload
          class="video-uploader"
          action="/api/upload"
          :show-file-list="false"
          :on-success="handleVideoSuccess"
          :before-upload="beforeVideoUpload"
        >
          <video
            v-if="form.video?.url"
            :src="form.video.url"
            class="video"
            controls
          ></video>
          <el-icon v-else class="video-uploader-icon"><Plus /></el-icon>
        </el-upload>
        <div class="video-cover" v-if="form.video?.cover">
          <el-image
            :src="form.video.cover"
            fit="cover"
            class="cover-image"
          />
        </div>
      </el-form-item>
      
      <!-- 音频上传 -->
      <el-form-item v-if="form.type === 'audio'" label="音频" prop="audio">
        <el-upload
          class="audio-uploader"
          action="/api/upload"
          :show-file-list="false"
          :on-success="handleAudioSuccess"
          :before-upload="beforeAudioUpload"
        >
          <audio
            v-if="form.audio?.url"
            :src="form.audio.url"
            controls
            class="audio"
          ></audio>
          <el-icon v-else class="audio-uploader-icon"><Plus /></el-icon>
        </el-upload>
      </el-form-item>
      
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio label="published">发布</el-radio>
          <el-radio label="draft">草稿</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import MdEditor from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { getDynamicDetail, createDynamic, updateDynamic } from '../../api/blog'

const route = useRoute()
const router = useRouter()

// 是否为编辑模式
const isEdit = computed(() => !!route.params.id)

// 表单引用
const formRef = ref(null)

// 保存状态
const saving = ref(false)

// 表单数据
const form = reactive({
  content: '',
  type: 'text',
  images: [],
  video: null,
  audio: null,
  status: 'draft'
})

// 表单验证规则
const rules = {
  content: [
    { required: true, message: '请输入内容', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择类型', trigger: 'change' }
  ]
}

// 图片预览
const dialogVisible = ref(false)
const dialogImageUrl = ref('')

// 编辑器工具栏配置
const toolbars = {
  bold: true,
  italic: true,
  title: true,
  quote: true,
  list: true,
  code: true,
  link: true,
  image: true,
  table: true,
  preview: true,
  expand: true,
  undo: true,
  redo: true
}

// 图片上传前检查
const beforeImageUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}

// 视频上传前检查
const beforeVideoUpload = (file) => {
  const isVideo = file.type.startsWith('video/')
  const isLt50M = file.size / 1024 / 1024 < 50

  if (!isVideo) {
    ElMessage.error('只能上传视频文件!')
    return false
  }
  if (!isLt50M) {
    ElMessage.error('视频大小不能超过 50MB!')
    return false
  }
  return true
}

// 音频上传前检查
const beforeAudioUpload = (file) => {
  const isAudio = file.type.startsWith('audio/')
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isAudio) {
    ElMessage.error('只能上传音频文件!')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('音频大小不能超过 10MB!')
    return false
  }
  return true
}

// 处理图片预览
const handlePictureCardPreview = (file) => {
  dialogImageUrl.value = file.url
  dialogVisible.value = true
}

// 处理图片移除
const handleRemove = (file, fileList) => {
  form.images = fileList
}

// 处理图片上传成功
const handleUploadSuccess = (response, file, fileList) => {
  form.images = fileList.map(file => ({
    url: file.url,
    name: file.name
  }))
}

// 处理视频上传成功
const handleVideoSuccess = (response, file) => {
  form.video = {
    url: response.url,
    cover: response.cover || ''
  }
}

// 处理音频上传成功
const handleAudioSuccess = (response, file) => {
  form.audio = {
    url: response.url
  }
}

// 处理编辑器图片上传
const handleUploadImage = async (files, callback) => {
  const formData = new FormData()
  files.forEach(file => {
    formData.append('files', file)
  })
  
  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    const data = await response.json()
    if (data.code === 200) {
      callback(data.data.map(url => url))
    } else {
      ElMessage.error('图片上传失败')
    }
  } catch (error) {
    console.error('图片上传失败:', error)
    ElMessage.error('图片上传失败')
  }
}

// 获取动态详情
const fetchDynamicDetail = async (id) => {
  try {
    const response = await getDynamicDetail(id)
    if (response.code === 200) {
      Object.assign(form, response.data)
    } else {
      ElMessage.error(response.message || '获取动态详情失败')
    }
  } catch (error) {
    console.error('获取动态详情失败:', error)
    ElMessage.error('获取动态详情失败')
  }
}

// 保存动态
const handleSave = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    saving.value = true
    
    const data = {
      ...form,
      images: form.images.map(img => img.url)
    }
    
    if (isEdit.value) {
      await updateDynamic(route.params.id, data)
      ElMessage.success('更新成功')
    } else {
      await createDynamic(data)
      ElMessage.success('创建成功')
    }
    
    router.push('/dashboard/dynamics')
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 取消编辑
const handleCancel = () => {
  router.push('/dashboard/dynamics')
}

// 初始化
onMounted(() => {
  if (isEdit.value) {
    fetchDynamicDetail(route.params.id)
  }
})
</script>

<style scoped>
.dynamic-edit {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.edit-form {
  max-width: 1200px;
  margin: 0 auto;
}

.video-uploader,
.audio-uploader {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.video-uploader:hover,
.audio-uploader:hover {
  border-color: var(--el-color-primary);
}

.video-uploader-icon,
.audio-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  text-align: center;
  line-height: 178px;
}

.video,
.audio {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.video-cover {
  margin-top: 10px;
}

.cover-image {
  width: 200px;
  height: 120px;
  border-radius: 4px;
}
</style> 