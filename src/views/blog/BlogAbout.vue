<template>
  <div class="blog-about">
    <!-- 内容 -->
    <div class="about-content">
      <div class="about-header">
        <div class="header-content">
          <div class="about-avatar">
            <img src="https://placeholder.pics/svg/150" alt="博主头像">
          </div>
          <h1 class="about-name">博主名称</h1>
        </div>
        <div class="about-social">
          <a href="https://github.com" target="_blank" title="GitHub">
            <el-icon><i-ep-link /></el-icon>
          </a>
          <a href="mailto:example@example.com" title="Email">
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
        <div class="about-section">
          <h2 class="section-title">我的技能</h2>
          <div class="skills-wrapper">
            <div v-for="(skill, index) in skills" :key="index" class="skill-item">
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
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'

// 创建Markdown渲染器
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})

// 静态数据
const introduction = `
# 关于我

你好，欢迎来到我的博客！我是一名热爱技术的开发者。

## 我的经历

- 从事前端开发多年
- 热爱开源技术
- 喜欢分享技术经验

## 联系方式

如果你有任何问题或建议，欢迎通过以下方式联系我：

- Email: example@example.com
- GitHub: https://github.com
`

// 技能数据
const skills = [
  { name: 'Vue.js', level: 90 },
  { name: 'React', level: 85 },
  { name: 'JavaScript', level: 95 },
  { name: 'TypeScript', level: 80 },
  { name: 'Node.js', level: 75 }
]

// 渲染Markdown内容
const renderedContent = computed(() => {
  return md.render(introduction)
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
</script>

<style lang="scss" scoped>
.blog-about {
  overflow: hidden;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.loading-container,
.error-container {
  margin: 30px 0;
}

// 关于我内容样式
.about-content {
  display: flex;
  flex-direction: column;
  max-width: 800px;
  margin: 0 auto;
}

// 头部信息
.about-header {
  background-color: #fff;
  padding: 40px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  text-align: center;
  margin-bottom: 30px;
  
  .header-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    margin-bottom: 15px;
  }
  
  .about-avatar {
    img {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      object-fit: cover;
    }
  }
  
  .about-name {
    font-size: 1.8rem;
    margin: 0;
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
    text-align: center;
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
    text-align: center;
  }
  
  :deep(h2) {
    font-size: 1.5rem;
    margin: 1.2rem 0 0.8rem;
    padding-bottom: 0.3rem;
    border-bottom: 1px solid #eee;
    text-align: center;
  }
  
  :deep(h3) {
    font-size: 1.3rem;
    margin: 1rem 0 0.6rem;
    text-align: center;
  }
  
  :deep(p) {
    margin: 0.8rem 0;
    line-height: 1.6;
    text-align: center;
  }
  
  :deep(ul, ol) {
    padding-left: 2rem;
    margin: 0.8rem auto;
    max-width: 600px;
    
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
    margin: 1rem auto;
    padding: 0.5rem 1rem;
    border-left: 4px solid var(--el-color-primary-light-5);
    background-color: var(--el-color-primary-light-9);
    color: #666;
    max-width: 600px;
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
    margin: 1rem auto;
    max-width: 600px;
    
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
  max-width: 600px;
  margin: 0 auto;
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
  .blog-about {
    padding: 10px;
  }
  
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