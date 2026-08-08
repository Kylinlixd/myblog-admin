<template>
  <main class="categories-container cinematic-page">
    <header class="page-header cinematic-hero">
      <span class="archive-kicker">KNOWLEDGE ARCHIVE · 归档索引</span>
      <h1 class="page-title">把零散问题，整理成可继续探索的路径。</h1>
      <p class="page-desc">按主题进入内容脉络，每个分类都是一段正在生长的技术记录。</p>
      <div class="archive-meta"><span>{{ categories.length }} 个主题</span><span>持续更新中</span></div>
    </header>
    <section class="categories-grid" aria-label="文章分类">
      <article v-for="(category, index) in categories" :key="category.id" class="category-card cinematic-card">
        <router-link :to="`/blog/categories/${category.id}`" class="category-link">
          <div class="category-content">
            <span class="category-index">0{{ index + 1 }}</span>
            <h2 class="category-name">{{ category.name }}</h2>
            <span class="category-count">{{ category.dynamicCount ?? category.count ?? 0 }} 篇文章</span>
            <p class="category-desc">{{ category.description || '记录实践、判断与下一步。' }}</p>
          </div>
        </router-link>
      </article>
    </section>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getBlogCategoryList } from '@/api/blog'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const categories = ref([])

async function fetchCategories() {
  try {
    appStore.startLoading('加载分类数据...')
    const response = await getBlogCategoryList()
    if (response?.code === 200) categories.value = response.data.map((category) => ({ ...category, count: category.count || 0 }))
    else appStore.setLoadingError('获取分类数据失败，请刷新重试')
    appStore.endLoading()
  } catch (error) {
    console.error('获取分类数据失败:', error)
    appStore.setLoadingError('获取分类数据失败，请刷新重试')
  }
}

onMounted(fetchCategories)
</script>

<style scoped>
.categories-container { max-width: 1240px; margin: 0 auto; padding: clamp(32px, 6vw, 86px) 20px 90px; }
.page-header { margin-bottom: 42px; text-align: left; }
.archive-kicker { color: #b85e2d; font-size: 11px; font-weight: 800; letter-spacing: .18em; }
.page-title { max-width: 760px; margin: 14px 0; color: #253142; font-size: clamp(38px, 6vw, 76px); font-weight: 800; letter-spacing: -.065em; line-height: .98; }
.page-desc { max-width: 570px; margin: 0; color: #5b6672; font-size: 15px; line-height: 1.7; }
.archive-meta { display: flex; gap: 10px; margin-top: 24px; color: #7d695c; font-size: 12px; }
.archive-meta span { padding: 7px 11px; border: 1px solid #ead8c7; border-radius: 999px; background: rgb(255 250 242 / 72%); }
.categories-grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 16px; }
.category-card { grid-column: span 4; min-height: 214px; overflow: hidden; border-radius: 4px 24px 4px 24px; background: rgb(255 250 242 / 88%); box-shadow: 0 16px 38px rgb(92 59 35 / 10%); transition: transform .3s ease, box-shadow .3s ease; }
.category-card:hover { transform: translateY(-7px) rotate(-.5deg); box-shadow: 0 24px 48px rgb(92 59 35 / 17%); }
.category-link { display: block; height: 100%; color: inherit; }
.category-content { position: relative; display: flex; height: 100%; flex-direction: column; padding: 26px; }
.category-index { position: absolute; top: 20px; right: 22px; color: #c47747; font-size: 11px; font-weight: 800; letter-spacing: .12em; }
.category-name { margin: 34px 0 12px; color: #253142; font-size: clamp(20px, 2.1vw, 28px); letter-spacing: -.04em; }
.category-count { width: fit-content; padding: 5px 9px; border-radius: 999px; background: #f7e2cf; color: #a44e25; font-size: 12px; font-weight: 700; }
.category-desc { margin: auto 0 0; color: #697586; font-size: 13px; line-height: 1.55; }
@media (max-width: 980px) { .category-card { grid-column: span 6; } }
@media (max-width: 620px) { .categories-container { padding-inline: 16px; } .category-card { grid-column: span 12; } .page-title { font-size: clamp(40px, 13vw, 64px); } }
</style>
