<template>
  <div class="min-h-screen">
    <WavyBackground class="w-full">
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
            <div v-for="(tech, index) in techStack" 
                 :key="tech" 
                 class="tech-item"
                 :style="{ animationDelay: `${index * 0.2}s` }">
              {{ tech }}
            </div>
          </div>
        </div>
      </div>
    </WavyBackground>
  </div>
</template>

<script setup>
import WavyBackground from '@/components/InspiraUI/WavyBackground.vue'

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
</style> 