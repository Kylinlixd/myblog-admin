import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/antd.css'
import DOMPurify from 'dompurify'

// 配置 DOMPurify
DOMPurify.setConfig({
  ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'code', 'pre', 'blockquote', 'img', 'br', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target'],
  ALLOWED_PROTOCOLS: ['http', 'https', 'mailto', 'tel']
})

// 添加全局错误处理
const app = createApp(App)

app.config.errorHandler = (err, vm, info) => {
  console.error('全局错误:', err)
  console.error('错误信息:', info)
}

// 添加全局警告处理
app.config.warnHandler = (msg, vm, trace) => {
  console.warn('全局警告:', msg)
  console.warn('警告追踪:', trace)
}

app.use(createPinia())
app.use(router)
app.use(Antd)

app.mount('#app') 