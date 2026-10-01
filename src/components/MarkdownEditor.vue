<template>
  <div class="markdown-editor-wrapper" :class="mobilePaneClass">
    <!--
      手机上如果沿用左右分栏，两块各只剩三百多像素：预览看不清、正文也难写。
      窄屏改成「编辑 / 预览」二选一，每个视图独占整个高度。
    -->
    <div v-if="isMobile" class="markdown-editor-panes">
      <a-radio-group v-model:value="mobilePane" button-style="solid" size="small">
        <a-radio-button value="edit">
          <edit-outlined />
          编辑
        </a-radio-button>
        <a-radio-button value="preview">
          <eye-outlined />
          预览
        </a-radio-button>
      </a-radio-group>
      <span class="markdown-editor-panes__hint">
        {{ mobilePane === 'edit' ? '正在编辑正文' : '预览渲染结果' }}
      </span>
    </div>

    <md-editor
      ref="editorRef"
      v-model="content"
      :theme="theme"
      :preview-theme="previewTheme"
      :code-theme="codeTheme"
      :language="language"
      :height="height"
      :preview="!isMobile || mobilePane === 'preview'"
      :on-upload-img="handleUploadImg"
      @onSave="handleSave"
      @onChange="handleChange"
    />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { MdEditor } from 'md-editor-v3'
import { EditOutlined, EyeOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import 'md-editor-v3/lib/style.css'

import { uploadImage } from '@/utils/upload'
import { buildApiUrl } from '@/utils/apiBaseUrl'

const editorRef = ref(null)

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  height: {
    type: String,
    default: '400px'
  },
  theme: {
    type: String,
    default: 'light'
  },
  previewTheme: {
    type: String,
    default: 'default'
  },
  codeTheme: {
    type: String,
    default: 'atom-one-light'
  },
  language: {
    type: String,
    default: 'zh-CN'
  }
})

const emit = defineEmits(['update:modelValue', 'onSave', 'on-image-uploaded'])

const content = ref(props.modelValue)

// 窄屏用「编辑/预览」切换代替分栏（matchMedia 在 jsdom 里可能不存在，需兜底）
const MOBILE_QUERY = '(max-width: 768px)'
const isMobile = ref(false)
const mobilePane = ref('edit')
let mediaQueryList = null

const syncViewport = (event) => {
  isMobile.value = Boolean(event?.matches)
}

onMounted(() => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
  mediaQueryList = window.matchMedia(MOBILE_QUERY)
  isMobile.value = mediaQueryList.matches
  if (typeof mediaQueryList.addEventListener === 'function') {
    mediaQueryList.addEventListener('change', syncViewport)
  }
})

onBeforeUnmount(() => {
  if (mediaQueryList && typeof mediaQueryList.removeEventListener === 'function') {
    mediaQueryList.removeEventListener('change', syncViewport)
  }
})

/**
 * 窄屏一次只显示一个视图。
 * md-editor 的 previewOnly 实测不会隐藏编辑区，所以用类名 + CSS 兜住，
 * 保证「预览」页签下确实只剩预览。
 */
const mobilePaneClass = computed(() => {
  if (!isMobile.value) return ''
  return mobilePane.value === 'preview' ? 'is-mobile-preview' : 'is-mobile-edit'
})

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  if (newValue !== content.value) {
    content.value = newValue
  }
}, { immediate: true })

// 监听内部值变化
const handleChange = (value) => {
  content.value = value
  emit('update:modelValue', value)
}

// 处理保存事件
const handleSave = () => {
  emit('onSave')
}

/**
 * md-editor 自带的「上传图片 / 裁剪上传」入口。
 * 没有接这个事件时，编辑器的图片上传是空转的；这里接到文件管理系统
 * （POST /api/upload/upload/），上传成功后再把引用插回正文，
 * 同时把结果抛给父组件，让它挂成动态附件。
 */
const handleUploadImg = async (files, callback) => {
  const uploaded = []
  const urls = []

  try {
    for (const file of files || []) {
      const result = await uploadImage(file)
      if (!result?.url) continue
      uploaded.push(result)
      urls.push(buildApiUrl(result.url))
    }

    if (!urls.length) throw new Error('图片上传失败，请重试')

    callback(urls)
    uploaded.forEach((item) => emit('on-image-uploaded', item))
    message.success(`已上传 ${uploaded.length} 张图片`)
  } catch (error) {
    console.error('编辑器图片上传失败:', error)
    message.error(error?.message || '图片上传失败，请重试')
    callback([])
  }
}

// 暴露方法给父组件
defineExpose({
  setContent: (value) => {
    content.value = value
  },
  // 将外部媒体引用交给编辑器，插入当前光标位置。
  insertContent: (value) => {
    if (!value || !editorRef.value?.insert) return false
    editorRef.value.insert(() => ({
      targetValue: value,
      select: false
    }))
    return true
  },
  // 插入完成后把焦点交还给编辑器，方便继续输入。
  focus: () => editorRef.value?.focus?.()
})
</script>

<style scoped>
.markdown-editor-wrapper {
  width: 100%;
  height: 100%;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  overflow: hidden;
}

/*
 * 窄屏下编辑器与预览并排会把正文编辑区压得太窄，
 * 这里改成上下排布：上面编辑、下面预览，并给整体留出更高的可视高度。
 *
 * md-editor 的分栏宽度、拖拽条显示都是写在行内样式上的
 * （input-wrapper 是 style="width: 50%"，拖拽条是 style="display: initial"），
 * 所以这里必须用 !important 才能覆盖。
 */
.markdown-editor-panes {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.markdown-editor-panes__hint {
  color: #8c8c8c;
  font-size: 12px;
}

@media (max-width: 768px) {
  .markdown-editor-wrapper :deep(.md-editor) {
    height: min(760px, 80vh) !important;
  }

  /* 窄屏一次只显示一个视图：分栏与横向拖拽条都不需要了 */
  .markdown-editor-wrapper :deep(.md-editor-resize-operate) {
    display: none !important;
  }

  .markdown-editor-wrapper.is-mobile-edit :deep(.md-editor-preview-wrapper) {
    display: none !important;
  }

  .markdown-editor-wrapper.is-mobile-preview :deep(.md-editor-input-wrapper) {
    display: none !important;
  }

  /* md-editor 把分栏宽度写在行内样式上，必须 !important 才能占满 */
  .markdown-editor-wrapper.is-mobile-edit :deep(.md-editor-input-wrapper),
  .markdown-editor-wrapper.is-mobile-preview :deep(.md-editor-preview-wrapper) {
    width: 100% !important;
    flex: 1 1 auto;
    min-width: 0;
  }

  /* 预览里的图/表不再横向溢出被裁掉 */
  .markdown-editor-wrapper :deep(.md-editor-preview) img,
  .markdown-editor-wrapper :deep(.md-editor-preview) table {
    max-width: 100%;
  }

  .markdown-editor-wrapper :deep(.md-editor-preview) {
    overflow-x: auto;
  }
}
</style>
