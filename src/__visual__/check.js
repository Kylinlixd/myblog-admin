import { createApp, h, ref } from 'vue'

import 'ant-design-vue/dist/reset.css'
import '@/styles/main.scss'
import MarkdownEditor from '@/components/MarkdownEditor.vue'

const SAMPLE = [
  '## 移动端实时预览',
  '',
  '这是一段检查上下排布的正文，包含**加粗**、`行内代码` 与引用：',
  '',
  '> 空谈无益，拿出代码来。——Linus Torvalds',
  '',
  '- 列表项一',
  '- 列表项二',
  '',
  '结尾一句，用来撑高预览，确认它能随页面滚动而不是被裁成一条。'
].join('\n')

const Demo = {
  setup() {
    const value = ref(SAMPLE)
    return () => h('div', { style: 'padding: 12px' }, [
      h(MarkdownEditor, { modelValue: value.value, 'onUpdate:modelValue': (v) => { value.value = v }, height: '400px' })
    ])
  }
}
createApp(Demo).mount('#visual-check')
