<template>
  <div class="blog-about">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="15" animated />
    </div>
    
    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
      <el-empty 
        description="加载关于我信息失败" 
        :image-size="200"
      >
        <template #description>
          <p>{{ errorMessage }}</p>
        </template>
        <el-button type="primary" @click="fetchAboutInfo">重试</el-button>
      </el-empty>
    </div>
    
    <!-- 内容 -->
    <div v-else class="about-content">
      <div class="about-header">
        <div class="about-avatar">
          <img :src="aboutInfo.avatar || 'https://placeholder.pics/svg/150'" alt="博主头像">
        </div>
        <h1 class="about-name">{{ aboutInfo.name || '博主名称' }}</h1>
        <div class="about-social">
          <a v-if="aboutInfo.github" :href="aboutInfo.github" target="_blank" title="GitHub">
            <el-icon><i-ep-link /></el-icon>
          </a>
          <a v-if="aboutInfo.email" :href="`mailto:${aboutInfo.email}`" title="Email">
            <el-icon><i-ep-message /></el-icon>
          </a>
        </div>
      </div>
      
      <div class="about-sections">
        <!-- 介绍内容 -->
        <div class="about-section">
          <div class="section-content markdown-content" v-html="renderedContent"></div>
        </div>
        
        <!-- 技能 -->
        <div v-if="aboutInfo.skills && aboutInfo.skills.length" class="about-section">
          <h2 class="section-title">我的技能</h2>
          <div class="skills-wrapper">
            <div v-for="(skill, index) in aboutInfo.skills" :key="index" class="skill-item">
              <div class="skill-info">
                <span class="skill-name">{{ skill.name }}</span>
                <span class="skill-level">{{ skill.level }}%</span>
              </div>
              <el-progress 
                :percentage="skill.level" 
                :color="getSkillColor(skill.level)"
                :stroke-width="15"
                :show-text="false"
              />
            </div>
          </div>
        </div>
        
        <!-- 联系表单 -->
        <div class="about-section">
          <h2 class="section-title">联系我</h2>
          <div class="contact-form">
            <el-form 
              ref="contactFormRef"
              :model="contactForm"
              :rules="contactRules"
              label-position="top"
            >
              <el-form-item label="您的姓名" prop="name">
                <el-input v-model="contactForm.name" placeholder="请输入您的姓名" />
              </el-form-item>
              
              <el-form-item label="您的邮箱" prop="email">
                <el-input v-model="contactForm.email" placeholder="请输入您的邮箱" />
              </el-form-item>
              
              <el-form-item label="留言内容" prop="message">
                <el-input 
                  v-model="contactForm.message" 
                  type="textarea" 
                  rows="5"
                  placeholder="请输入您想对我说的话..."
                />
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="submitContact" :loading="submitting">
                  发送留言
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { getAboutInfo } from '../../api/blog'
import MarkdownIt from 'markdown-it'

// 创建Markdown渲染器
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})

// 状态
const loading = ref(true)
const error = ref(false)
const errorMessage = ref('')
const aboutInfo = ref({
  name: '',
  avatar: '',
  introduction: '',
  email: '',
  github: '',
  skills: []
})

// 渲染Markdown内容
const renderedContent = computed(() => {
  return md.render(aboutInfo.value.introduction || '')
})

// 获取技能条颜色
const getSkillColor = (level) => {
  if (level >= 90) {
    return '#67c23a' // 高级 - 绿色
  } else if (level >= 70) {
    return '#409eff' // 中高级 - 蓝色 
  } else if (level >= 50) {
    return '#e6a23c' // 中级 - 橙色
  } else {
    return '#f56c6c' // 初级 - 红色
  }
}

// 联系表单
const contactForm = ref({
  name: '',
  email: '',
  message: ''
})

const contactRules = {
  name: [
    { required: true, message: '请输入您的姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '姓名长度应在2-20个字符之间', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入您的邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  message: [
    { required: true, message: '请输入留言内容', trigger: 'blur' },
    { min: 5, max: 500, message: '留言内容应在5-500个字符之间', trigger: 'blur' }
  ]
}

const contactFormRef = ref(null)
const submitting = ref(false)

// 提交联系表单
const submitContact = async () => {
  if (!contactFormRef.value) return
  
  await contactFormRef.value.validate(async (valid, fields) => {
    if (!valid) {
      console.log('表单验证失败:', fields)
      return
    }
    
    submitting.value = true
    try {
      // 在实际环境中会调用API发送留言数据
      // await sendContactMessage(contactForm.value)
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      ElMessage.success('您的留言已发送成功！')
      contactFormRef.value.resetFields()
    } catch (error) {
      console.error('发送留言失败:', error)
      ElMessage.error('发送留言失败，请稍后重试')
    } finally {
      submitting.value = false
    }
  })
}

// 获取关于我信息
const fetchAboutInfo = async () => {
  loading.value = true
  error.value = false
  errorMessage.value = ''
  
  try {
    const data = await getAboutInfo()
    aboutInfo.value = data
  } catch (err) {
    console.error('获取关于我信息失败:', err)
    error.value = true
    errorMessage.value = err.message || '获取信息失败，请重试'
  } finally {
    loading.value = false
  }
}

// 组件挂载时初始化
onMounted(() => {
  fetchAboutInfo()
})
</script>

<style lang="scss" scoped>
.blog-about {
  overflow: hidden;
}

.loading-container,
.error-container {
  margin: 30px 0;
}

// 关于我内容样式
.about-content {
  display: flex;
  flex-direction: column;
}

// 头部信息
.about-header {
  background-color: #fff;
  padding: 40px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  text-align: center;
  margin-bottom: 30px;
  
  .about-avatar {
    margin: 0 auto 20px;
    
    img {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      object-fit: cover;
    }
  }
  
  .about-name {
    font-size: 1.8rem;
    margin: 0 0 15px;
    color: #333;
  }
  
  .about-social {
    display: flex;
    justify-content: center;
    gap: 15px;
    
    a {
      color: #666;
      font-size: 1.2rem;
      transition: color 0.3s;
      
      &:hover {
        color: var(--el-color-primary);
      }
    }
  }
}

// 内容区域
.about-sections {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.about-section {
  background-color: #fff;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  
  .section-title {
    font-size: 1.5rem;
    margin: 0 0 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid #eee;
    color: #333;
  }
  
  .section-content {
    color: #333;
    line-height: 1.6;
  }
}

// Markdown内容样式
.markdown-content {
  :deep(h1) {
    font-size: 1.8rem;
    margin: 1.5rem 0 1rem;
  }
  
  :deep(h2) {
    font-size: 1.5rem;
    margin: 1.2rem 0 0.8rem;
    padding-bottom: 0.3rem;
    border-bottom: 1px solid #eee;
  }
  
  :deep(h3) {
    font-size: 1.3rem;
    margin: 1rem 0 0.6rem;
  }
  
  :deep(p) {
    margin: 0.8rem 0;
    line-height: 1.6;
  }
  
  :deep(ul, ol) {
    padding-left: 2rem;
    margin: 0.8rem 0;
    
    li {
      margin-bottom: 0.5rem;
    }
  }
  
  :deep(a) {
    color: var(--el-color-primary);
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
  
  :deep(blockquote) {
    margin: 1rem 0;
    padding: 0.5rem 1rem;
    border-left: 4px solid var(--el-color-primary-light-5);
    background-color: var(--el-color-primary-light-9);
    color: #666;
  }
  
  :deep(code) {
    font-family: monospace;
    background-color: #f5f5f5;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-size: 0.9rem;
  }
  
  :deep(pre) {
    background-color: #f5f5f5;
    padding: 1rem;
    border-radius: 5px;
    overflow-x: auto;
    margin: 1rem 0;
    
    code {
      background-color: transparent;
      padding: 0;
    }
  }
}

// 技能样式
.skills-wrapper {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.skill-item {
  .skill-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
    
    .skill-name {
      font-weight: 500;
      color: #333;
    }
    
    .skill-level {
      color: #666;
    }
  }
}

// 联系表单样式
.contact-form {
  max-width: 600px;
  margin: 0 auto;
}

// 响应式调整
@media (max-width: 768px) {
  .about-header {
    padding: 30px 15px;
    
    .about-avatar img {
      width: 100px;
      height: 100px;
    }
    
    .about-name {
      font-size: 1.5rem;
    }
  }
  
  .about-section {
    padding: 20px;
    
    .section-title {
      font-size: 1.3rem;
    }
  }
}
</style> 