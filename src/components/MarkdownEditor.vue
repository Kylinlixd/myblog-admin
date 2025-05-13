<template>
  <div class="markdown-editor-wrapper">
    <md-editor
      v-model="content"
      :theme="theme"
      :preview-theme="previewTheme"
      :code-theme="codeTheme"
      :language="language"
      :height="height"
      @onSave="handleSave"
      @onChange="handleChange"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'

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

const emit = defineEmits(['update:modelValue', 'onSave'])

const content = ref(props.modelValue)

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  console.log('MarkdownEditor 接收到新的内容:', newValue)
  if (newValue !== content.value) {
    content.value = newValue
  }
}, { immediate: true })

// 监听内部值变化
const handleChange = (value) => {
  console.log('MarkdownEditor 内容变化:', value)
  content.value = value
  emit('update:modelValue', value)
}

// 处理保存事件
const handleSave = () => {
  emit('onSave')
}

// 暴露方法给父组件
defineExpose({
  setContent: (value) => {
    console.log('设置编辑器内容:', value)
    content.value = value
  }
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
</style> 