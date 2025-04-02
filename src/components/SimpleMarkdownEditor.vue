<template>
  <div class="simple-markdown-editor">
    <div class="editor-toolbar">
      <button type="button" @click="insertMarkdown('**', '**')">加粗</button>
      <button type="button" @click="insertMarkdown('*', '*')">斜体</button>
      <button type="button" @click="insertMarkdown('# ', '')">标题</button>
      <button type="button" @click="insertMarkdown('- ', '')">列表</button>
      <button type="button" @click="insertMarkdown('> ', '')">引用</button>
      <button type="button" @click="insertMarkdown('```\n', '\n```')">代码块</button>
      <button type="button" @click="insertMarkdown('[链接文字](', ')')">链接</button>
      <button type="button" @click="insertMarkdown('![图片描述](', ')')">图片</button>
      <button type="button" @click="handleSave">保存</button>
    </div>
    <textarea 
      ref="textareaRef"
      class="editor-textarea"
      :value="modelValue"
      @input="handleInput"
      @keydown="handleKeyDown"
      :placeholder="placeholder"
      :style="{ height: height }"
    ></textarea>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '请输入Markdown内容...'
  },
  height: {
    type: String,
    default: '400px'
  }
})

const emit = defineEmits(['update:modelValue', 'onSave'])

const textareaRef = ref(null)

// 处理输入
const handleInput = (e) => {
  emit('update:modelValue', e.target.value)
}

// 插入Markdown语法
const insertMarkdown = (before, after) => {
  const textarea = textareaRef.value
  if (!textarea) return
  
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = textarea.value
  
  const selectedText = text.substring(start, end)
  const newText = text.substring(0, start) + before + selectedText + after + text.substring(end)
  
  emit('update:modelValue', newText)
  
  // 设置光标位置
  setTimeout(() => {
    textarea.focus()
    textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length)
  }, 0)
}

// 处理快捷键
const handleKeyDown = (e) => {
  // Ctrl+S / Cmd+S
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    handleSave()
  }
  
  // Tab 键缩进
  if (e.key === 'Tab') {
    e.preventDefault()
    insertMarkdown('  ', '')
  }
}

// 保存
const handleSave = () => {
  emit('onSave')
}
</script>

<style scoped>
.simple-markdown-editor {
  width: 100%;
  border: 1px solid var(--border-color, #dcdfe6);
  border-radius: 4px;
  overflow: hidden;
}

.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding: 10px;
  border-bottom: 1px solid var(--border-color, #dcdfe6);
  background-color: var(--background-light, #f5f7fa);
}

.editor-toolbar button {
  padding: 5px 10px;
  background-color: var(--background-color, #ffffff);
  border: 1px solid var(--border-color, #dcdfe6);
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.editor-toolbar button:hover {
  background-color: var(--primary-color, #409EFF);
  color: white;
}

.editor-textarea {
  width: 100%;
  padding: 12px;
  box-sizing: border-box;
  border: none;
  outline: none;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  background-color: var(--background-color, #ffffff);
  color: var(--text-primary, #303133);
}
</style> 