<template>
  <div class="min-h-screen">
    <!-- 首页主视觉区域 -->
    <WavyBackground class="w-full" v-if="!currentFilter">
      <div class="content-container">
        <div class="blog-header">
          <h1 class="blog-title">LiXD's Blog</h1>
        </div>
        <div class="header-section">
          <p class="inter-var text-center text-2xl font-bold text-white lg:text-7xl md:text-4xl">
            探索技术的无限可能
          </p>
          <p class="inter-var mt-4 text-center text-base font-normal text-white md:text-lg">
            欢迎访问我的博客
          </p>
        </div>

        <div class="tech-section">
          <h2 class="text-2xl font-semibold mb-6 text-white text-center">技术栈</h2>
          <div class="tech-grid">
            <router-link 
              v-for="(tech, index) in techStack" 
                 :key="tech" 
              :to="`/blog/search?keyword=${tech}`"
                 class="tech-item"
                 :style="{ animationDelay: `${index * 0.2}s` }">
              {{ tech }}
            </router-link>
          </div>
        </div>
      </div>
    </WavyBackground>

  </div>
</template>

<script setup>
import WavyBackground from '@/components/InspiraUI/WavyBackground.vue'
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'

// 接收通过路由传递的过滤参数
const props = defineProps({
  filter: {
    type: String,
    default: ''
  }
})

const route = useRoute()
const currentFilter = ref(props.filter || '')

// 技术栈数据
const techStack = [
  'Python',
  'Django',
  'Vue.js',
  'TypeScript',
  'Node.js',
  'Java',
  'Spring Boot',
  'MySQL',
  'Redis',
  'Docker',
  'Kubernetes',
  'Git'
]

// 监听路由变化，更新过滤条件
watch(() => route.query, (newQuery) => {
  if (newQuery.filter) {
    currentFilter.value = newQuery.filter
  } else {
    currentFilter.value = ''
  }
}, { immediate: true, deep: true })

</script>

<style scoped>
.blog-header {
  @apply flex items-center justify-center py-4;
  position: relative;
  z-index: 10;
  margin-top: 2rem;
  width: 100%;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  min-height: 60px;
}

.blog-title {
  @apply text-2xl font-bold text-white;
  text-align: center;
  width: 100%;
  white-space: nowrap;
  min-width: 200px;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

.content-container {
  position: relative;
  z-index: 10;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  gap: 2rem;
}

.header-section {
  @apply mb-12;
  text-align: center;
  position: relative;
  width: 100%;
  max-width: 1200px;
  padding: 0 1rem;
  margin-top: 4rem;
}

.tech-section {
  @apply p-6;
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 1200px;
  padding: 2rem 1rem;
  margin-top: 2rem;
}

.tech-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
  width: 100%;
}

.tech-item {
  @apply bg-white/20 text-white px-3 py-2 rounded-md text-center;
  position: relative;
  z-index: 10;
  opacity: 0;
  transform: translateX(-100%);
  animation: slideIn 1s forwards;
  min-width: 0;
  word-break: break-word;
  font-size: 0.875rem;
  text-decoration: none;
  transition: all 0.3s ease;
  cursor: pointer;
}

.tech-item:hover {
  @apply bg-white/30;
  transform: translateY(-2px);
}

@media (max-width: 640px) {
  .tech-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .tech-item {
    font-size: 0.75rem;
    padding: 0.5rem;
  }
  
  .blog-title {
    font-size: 1.25rem;
    min-width: 150px;
  }
  
  .header-section {
    margin-top: 2rem;
  }
  
  .header-section p {
    font-size: 1.25rem;
  }
  
  .content-container {
    gap: 1rem;
  }
}

@keyframes slideIn {
  0% {
    opacity: 0;
    transform: translateX(-100%);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 添加过滤内容样式 */
.filtered-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 1rem;
}

.filter-header {
  text-align: center;
  margin-bottom: 3rem;
}

.filter-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  background: linear-gradient(90deg, #38bdf8, #818cf8, #c084fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.filter-desc {
  color: #666;
  font-size: 1.1rem;
}

.articles-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

/* 平板断点 (768px) */
@media (min-width: 768px) {
  .articles-container {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 桌面断点 (1024px) */
@media (min-width: 1024px) {
  .articles-container {
    grid-template-columns: repeat(3, 1fr);
  }
}

.article-card {
  background-color: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  height: 100%;
}

.article-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.article-link {
  display: block;
  text-decoration: none;
  color: inherit;
}

.article-image {
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.article-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.article-card:hover .article-image img {
  transform: scale(1.05);
}

.article-content {
  padding: 1.5rem;
}

.article-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.8rem;
  font-size: 0.85rem;
  color: #666;
}

.article-category {
  color: #9333ea;
  font-weight: 500;
}

.article-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.8rem;
  color: #333;
  line-height: 1.4;
}

.article-excerpt {
  color: #666;
  font-size: 0.95rem;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (max-width: 640px) {
  .filter-title {
    font-size: 2rem;
  }
  
  .filter-desc {
    font-size: 1rem;
  }
  
  .article-image {
    height: 180px;
  }
}
</style> 