<template>
  <div class="markdown-editor-wrapper">
    <div ref="editorRef" class="editor-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as MdEditorModule from 'md-editor-v3'
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

const editorRef = ref(null)
let editor = null

// 组件挂载后初始化编辑器
onMounted(() => {
  if (!editorRef.value) return

  try {
    console.log('初始化Markdown编辑器, MdEditorModule:', Object.keys(MdEditorModule))
    
    // 检查模块导出内容，尝试不同的导入方式
    let MdEditor = MdEditorModule.MdEditor
    
    if (!MdEditor?.createEditor && MdEditorModule.default) {
      console.log('使用默认导出')
      MdEditor = MdEditorModule.default
    }
    
    if (!MdEditor?.createEditor) {
      console.error('无法找到MdEditor.createEditor方法')
      console.log('可用方法:', Object.keys(MdEditor || {}))
      return
    }
    
    // 编辑器工具栏配置
    const toolbars = [
      'bold', 'italic', 'strikethrough', 'heading', 'line', 'quote', 'code',
      'link', 'image', 'table', 'list', 'ordered-list', 'check', 'preview',
      'fullscreen', 'save', 'undo', 'redo', 'codeBlock'
    ]
    
    // 创建编辑器实例
    editor = MdEditor.createEditor({
      el: editorRef.value,
      mode: 'ir', // 'ir' 或 'wysiwyg'
      props: {
        value: props.modelValue,
        theme: props.theme,
        previewTheme: props.previewTheme,
        codeTheme: props.codeTheme,
        language: props.language,
        height: props.height,
        toolbars: toolbars,
        onSave: () => emit('onSave'),
        onChange: (value) => emit('update:modelValue', value)
      }
    })
    
    // 如果初始有内容，设置内容
    if (props.modelValue) {
      editor.setValue(props.modelValue)
    }
    
    // 监听Ctrl+S快捷键
    document.addEventListener('keydown', handleKeyDown)
    
  } catch (error) {
    console.error('初始化Markdown编辑器失败:', error)
  }
})

// 监听键盘事件，支持Ctrl+S保存
const handleKeyDown = (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault()
    emit('onSave')
  }
}

// 监听值变化
watch(() => props.modelValue, (newValue) => {
  if (editor && newValue !== editor.getValue()) {
    editor.setValue(newValue)
  }
})

// 监听主题变化
watch(() => props.theme, (newTheme) => {
  if (editor) {
    editor.setTheme(newTheme)
  }
})

// 组件销毁前清理
onBeforeUnmount(() => {
  if (editor) {
    editor.destroy()
    editor = null
  }
  
  document.removeEventListener('keydown', handleKeyDown)
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

.editor-container {
  width: 100%;
  height: 100%;
}
</style> 