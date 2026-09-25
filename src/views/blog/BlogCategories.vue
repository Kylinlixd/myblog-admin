<template>
  <main class="categories-container cinematic-page">
    <header class="page-header cinematic-hero archive-hero">
      <span class="archive-kicker">KNOWLEDGE ARCHIVE · 归档索引</span>
      <h1 class="page-title">把零散问题，整理成可继续探索的路径。</h1>
      <div class="archive-aside">
        <p class="page-desc">按主题进入内容脉络，每个分类都是一段正在生长的技术记录。</p>
        <div class="archive-meta"><span>{{ categories.length }} 个主题</span><span>持续更新中</span></div>
      </div>
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

/*
 * 归档页 hero：左侧大标题、右侧说明与徽标，右侧整体与标题末行对齐。
 * 标题列宽够放下「把零散问题，整理成」这样的半句，避免四行碎断。
 */
/*
 * 选择器带上 .page-header.cinematic-hero 是为了压过 blog-cinematic.scss 里
 * `.cinematic-page .page-header.cinematic-hero` 的 hero 重置（那边 gap/align-items 都是 initial）。
 * 另外 .cinematic-hero::before 那条装饰线本身也是栅格项，这里用 grid-area 把它固定在第一行，
 * 否则它会占掉一行、把后面的内容整体挤下去。
 */
.page-header.cinematic-hero.archive-hero {
  grid-template-columns: minmax(0, 1.32fr) minmax(300px, .78fr);
  grid-template-areas:
    'rule rule'
    'kicker kicker'
    'title aside';
  align-items: end;
  gap: 18px clamp(28px, 4vw, 64px);
  max-width: 1240px;
  margin-bottom: clamp(30px, 4vw, 52px);
}

.page-header.cinematic-hero.archive-hero::before {
  grid-area: rule;
}

.archive-kicker {
  grid-area: kicker;
  color: #b85e2d;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .18em;
  line-height: 1.4;
}

.page-title {
  grid-area: title;
  max-width: 100%;
  margin: 0;
  color: #253142;
  font-size: clamp(34px, 4.3vw, 58px);
  font-weight: 800;
  letter-spacing: -.05em;
  line-height: 1.08;
  text-wrap: balance;
}

/* 说明与徽标合成右侧一整列，整体与标题末行对齐 */
.archive-aside {
  display: grid;
  grid-area: aside;
  align-self: end;
  gap: 16px;
}

.page-desc {
  max-width: 100%;
  margin: 0;
  color: #5b6672;
  font-size: 15px;
  line-height: 1.7;
}

.archive-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 0;
  color: #7d695c;
  font-size: 12px;
}

.archive-meta span {
  flex: 0 0 auto;
  padding: 7px 11px;
  border: 1px solid #ead8c7;
  border-radius: 999px;
  background: rgb(255 250 242 / 72%);
  white-space: nowrap;
}
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
@media (max-width: 980px) {
  .page-header.cinematic-hero.archive-hero {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      'rule'
      'kicker'
      'title'
      'aside';
    gap: 14px;
  }

  .page-header.cinematic-hero.archive-hero .archive-aside {
    align-self: auto;
    gap: 12px;
    margin-top: 4px;
  }
}

@media (max-width: 620px) {
  .categories-container { padding-inline: 16px; }
  .category-card { grid-column: span 12; }
  .page-header.cinematic-hero.archive-hero { margin-bottom: 28px; }
  .page-header.cinematic-hero.archive-hero .page-title { font-size: clamp(30px, 8.6vw, 42px); line-height: 1.12; text-wrap: pretty; }
  .page-header.cinematic-hero.archive-hero .page-desc { font-size: 14px; }
  .page-header.cinematic-hero.archive-hero .archive-meta { gap: 8px; }
}
</style>
