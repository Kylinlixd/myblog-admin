<template>
  <div class="about-container">
    <div class="about-header">
      <div class="avatar">
        <img :src="profile.avatar" alt="LiXD" onerror="this.src='https://ui-avatars.com/api/?name=LiXD&background=random'" />
      </div>
      <h1 class="name">{{ profile.name || 'LiXD' }}</h1>
      <div class="title">{{ profile.title || '全栈开发工程师 / 技术博主' }}</div>
      <div class="social-links">
        <a v-if="profile.github" :href="profile.github" target="_blank" class="social-item">
          <i class="fab fa-github"></i>
        </a>
        <a v-if="profile.twitter" :href="profile.twitter" target="_blank" class="social-item">
          <i class="fab fa-twitter"></i>
        </a>
        <a v-if="profile.email" :href="`mailto:${profile.email}`" class="social-item">
          <i class="fas fa-envelope"></i>
        </a>
      </div>
    </div>

    <div class="about-content">
      <section class="about-section">
        <h2 class="section-title">关于我</h2>
        <div class="section-content">
          <div v-if="profile.bio" v-html="profile.bio"></div>
          <div v-else>
            <p>嗨，我是LiXD，一名热爱编程和分享的全栈开发者。我专注于前端和后端技术，尤其是Vue.js、React、Node.js和Python。</p>
            <p>通过这个博客，我希望能分享我在技术道路上的所学所思，同时也记录自己的成长历程。除了编程，我还喜欢阅读、旅行和摄影。</p>
          </div>
        </div>
      </section>

      <section class="about-section">
        <h2 class="section-title">技能与专长</h2>
        <div class="section-content">
          <div class="skills-grid">
            <div v-for="(skills, category) in profile.skills || defaultSkills" :key="category" class="skill-category">
              <h3>{{ category }}</h3>
              <div class="skill-items">
                <div v-for="skill in skills" :key="skill" class="skill-item">{{ skill }}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="about-section">
        <h2 class="section-title">联系我</h2>
        <div class="section-content">
          <p>如果你有任何问题、合作意向或者只是想交个朋友，欢迎随时联系我。</p>
          <div class="contact-info">
            <div v-if="profile.email" class="contact-item">
              <i class="fas fa-envelope"></i>
              <a :href="`mailto:${profile.email}`">{{ profile.email }}</a>
            </div>
            <div v-if="profile.website" class="contact-item">
              <i class="fas fa-globe"></i>
              <a :href="profile.website" target="_blank">{{ profile.website }}</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getAboutInfo } from '@/api/blog'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const profile = ref({})

// 默认技能数据
const defaultSkills = {
  '前端开发': ['HTML/CSS', 'JavaScript', 'Vue.js', 'React', 'TypeScript'],
  '后端开发': ['Node.js', 'Python', 'Django', 'Flask', 'Express'],
  '数据库': ['MySQL', 'MongoDB', 'Redis', 'PostgreSQL'],
  '开发工具': ['Git', 'Docker', 'Webpack', 'VS Code']
}

// 获取关于我页面数据
const fetchAboutInfo = async () => {
  try {
    appStore.startLoading('加载个人资料...')
    const response = await getAboutInfo()
    if (response.code === 200) {
      profile.value = response.data
    } else {
      console.error('获取个人资料失败:', response.message)
    }
  } catch (error) {
    console.error('获取个人资料失败:', error)
  } finally {
    appStore.endLoading()
  }
}

onMounted(() => {
  // 加载FontAwesome图标
  if (!document.getElementById('font-awesome-css')) {
    const fontAwesome = document.createElement('link')
    fontAwesome.id = 'font-awesome-css'
    fontAwesome.rel = 'stylesheet'
    fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css'
    document.head.appendChild(fontAwesome)
  }
  
  // 只有在访问关于页面时才加载数据
  if (window.location.pathname.includes('/blog/about')) {
    // 获取个人资料
    fetchAboutInfo()
  }
})
</script>

<style scoped>
.about-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 3rem 1rem;
}

.about-header {
  text-align: center;
  margin-bottom: 4rem;
}

.avatar {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 auto 1.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.name {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  background: linear-gradient(90deg, #38bdf8, #818cf8, #c084fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.title {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 1.5rem;
}

.social-links {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
}

.social-item {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4b5563;
  font-size: 1.2rem;
  transition: all 0.3s ease;
}

.social-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  background: linear-gradient(90deg, #38bdf8, #818cf8, #c084fc);
  color: #fff;
}

.about-section {
  margin-bottom: 3rem;
}

.section-title {
  font-size: 1.8rem;
  margin-bottom: 1rem;
  color: #333;
  position: relative;
  padding-bottom: 0.5rem;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 50px;
  height: 3px;
  background: linear-gradient(90deg, #38bdf8, #818cf8, #c084fc);
}

.section-content {
  font-size: 1rem;
  line-height: 1.7;
  color: #4b5563;
}

.section-content p {
  margin-bottom: 1rem;
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 2rem;
}

.skill-category h3 {
  font-size: 1.2rem;
  margin-bottom: 0.8rem;
  color: #333;
}

.skill-items {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.skill-item {
  background-color: #f3e8ff;
  color: #9333ea;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.9rem;
}

.contact-info {
  margin-top: 1.5rem;
}

.contact-item {
  display: flex;
  align-items: center;
  margin-bottom: 0.8rem;
}

.contact-item i {
  margin-right: 10px;
  color: #6d28d9;
}

.contact-item a {
  color: #4b5563;
  text-decoration: none;
  transition: color 0.3s ease;
}

.contact-item a:hover {
  color: #6d28d9;
}

@media (max-width: 768px) {
  .about-header {
    margin-bottom: 2.5rem;
  }
  
  .name {
    font-size: 2rem;
  }
  
  .skills-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}
</style> 