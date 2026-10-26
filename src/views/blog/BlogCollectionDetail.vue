<template>
  <main class="collection-detail cinematic-page">
    <div v-if="loadError" class="detail-error" role="alert">
      <p class="detail-error__title">获取合集数据失败</p>
      <p class="detail-error__desc">{{ loadError }}</p>
      <div class="detail-error__actions">
        <a-button type="primary" :loading="retrying" @click="fetchCollection">重试</a-button>
        <router-link to="/blog/categories" class="back-link">← 返回拾光</router-link>
      </div>
    </div>
    <div v-else-if="collection" class="detail-inner">
      <header class="detail-hero">
        <img v-if="collection.cover" :src="collection.cover" :alt="collection.title" class="detail-cover" />
        <div class="detail-head">
          <span class="detail-kicker">COLLECTION · 合集</span>
          <h1 class="detail-title">{{ collection.title }}</h1>
          <p class="detail-desc">{{ collection.description || '按系列持续更新的完整阅读路径。' }}</p>
          <div class="detail-meta">
            <span>{{ collection.itemCount }} 篇</span>
            <span>{{ sortMode === 'oldest' ? '从最早一期开始' : '从最新一期开始' }}</span>
            <span>持续更新中</span>
          </div>
        </div>
      </header>

      <section class="catalog" aria-label="合集目录">
        <div class="catalog-toolbar">
          <span class="catalog-label">目录 · Catalog</span>
          <div class="sort-toggle" role="group" aria-label="合集排序方式">
            <button
              type="button"
              class="sort-option"
              :class="{ 'sort-option--active': sortMode === 'oldest' }"
              :aria-pressed="sortMode === 'oldest'"
              @click="sortMode = 'oldest'"
            >从最早看起</button>
            <button
              type="button"
              class="sort-option"
              :class="{ 'sort-option--active': sortMode === 'latest' }"
              :aria-pressed="sortMode === 'latest'"
              @click="sortMode = 'latest'"
            >从最新看起</button>
          </div>
        </div>
        <router-link
          v-for="(item, index) in sortedItems"
          :key="item.id"
          :to="{ path: `/blog/dynamics/${item.id}`, query: { from: 'light' } }"
          class="catalog-row"
        >
          <span class="row-index">{{ String(index + 1).padStart(2, '0') }}</span>
          <span class="row-body">
            <span class="row-title">{{ item.title }}</span>
            <span class="row-meta">{{ formatDate(item.createdAt) }} · {{ item.viewCount }} 次阅读</span>
          </span>
          <span class="row-arrow">→</span>
        </router-link>
        <p v-if="!collection.items.length" class="catalog-empty">这个合集的第一篇还在路上，先去其他分类逛逛。</p>
      </section>

      <footer class="detail-footer">
        <router-link to="/blog/categories" class="back-link">← 返回拾光</router-link>
      </footer>
    </div>
  </main>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getBlogCollectionDetail } from '@/api/blog'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const appStore = useAppStore()
const collection = ref(null)
const loadError = ref('')
const retrying = ref(false)
// 默认保持合集原有语义：按发布顺序从最早一期看起；可切换为最新优先
const sortMode = ref('oldest')

const sortedItems = computed(() => {
  const items = collection.value?.items ?? []
  if (sortMode.value !== 'latest') return items
  return [...items].sort((a, b) => publishTime(b) - publishTime(a) || (b.sort ?? 0) - (a.sort ?? 0))
})

function publishTime(item) {
  const time = Date.parse(item.createdAt)
  return Number.isNaN(time) ? 0 : time
}

function formatDate(value) {
  if (!value) return ''
  return String(value).slice(0, 10)
}

async function fetchCollection() {
  loadError.value = ''
  retrying.value = true
  try {
    appStore.startLoading('加载合集数据...')
    const response = await getBlogCollectionDetail(route.params.id, { order: sortMode.value })
    if (response?.code === 200 && response.data) {
      collection.value = response.data
      document.title = `${collection.value.title}｜拾光｜时不语之间`
    } else loadError.value = response?.message || '该合集不存在或已被删除'
  } catch (error) {
    console.error('获取合集数据失败:', error)
    loadError.value = error?.message || '网络异常，请稍后重试'
  } finally {
    appStore.endLoading()
    retrying.value = false
  }
}

onMounted(fetchCollection)
</script>

<style scoped>
.collection-detail { max-width: 1080px; margin: 0 auto; padding: clamp(32px, 6vw, 80px) 20px 90px; }
.detail-hero { display: grid; grid-template-columns: minmax(280px, 460px) minmax(0, 1fr); gap: clamp(20px, 4vw, 44px); align-items: center; margin-bottom: clamp(28px, 4vw, 48px); }
.detail-cover { width: 100%; border-radius: 6px 22px 6px 22px; box-shadow: 0 20px 46px rgb(92 59 35 / 16%); }
.detail-kicker { color: #b85e2d; font-size: 11px; font-weight: 800; letter-spacing: .18em; }
.detail-title { margin: 10px 0 12px; color: #253142; font-size: clamp(28px, 3.6vw, 44px); font-weight: 800; letter-spacing: -.03em; line-height: 1.12; text-wrap: balance; }
.detail-desc { margin: 0 0 16px; color: #5b6672; font-size: 15px; line-height: 1.7; }
.detail-meta { display: flex; flex-wrap: wrap; gap: 10px; }
.detail-meta span { padding: 7px 11px; border: 1px solid #ead8c7; border-radius: 999px; background: rgb(255 250 242 / 72%); color: #7d695c; font-size: 12px; }
.catalog { display: flex; flex-direction: column; gap: 10px; }
.catalog-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 4px; }
.catalog-label { color: #b85e2d; font-size: 11px; font-weight: 800; letter-spacing: .18em; }
.sort-toggle { display: flex; gap: 8px; }
.sort-option { padding: 7px 14px; border: 1px solid #ead8c7; border-radius: 999px; background: rgb(255 250 242 / 72%); color: #7d695c; font-size: 12px; font-weight: 650; cursor: pointer; transition: border-color .2s ease, background .2s ease, color .2s ease; }
.sort-option:hover { border-color: #c86f37; color: #b85e2d; }
.sort-option:focus-visible { outline: 2px solid #c86f37; outline-offset: 2px; }
.sort-option--active { border-color: #c86f37; background: #c86f37; color: #fffaf2; }
.sort-option--active:hover { color: #fffaf2; }
.catalog-row { display: flex; align-items: center; gap: 18px; padding: 16px 20px; border: 1px solid rgb(108 82 54 / 12%); border-radius: 14px; background: rgb(255 250 242 / 85%); color: inherit; text-decoration: none; transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease; }
.catalog-row:hover { transform: translateX(6px); border-color: #c86f37; box-shadow: 0 12px 28px rgb(92 59 35 / 12%); }
.row-index { flex: 0 0 auto; color: #c86f37; font-size: 18px; font-weight: 800; font-variant-numeric: tabular-nums; }
.row-body { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 4px; }
.row-title { overflow: hidden; color: #253142; font-size: 15px; font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }
.row-meta { color: #8d857a; font-size: 12px; }
.row-arrow { flex: 0 0 auto; color: #b85e2d; font-size: 16px; }
.catalog-empty { padding: 28px; border: 1px dashed #ead8c7; border-radius: 14px; color: #8d857a; font-size: 14px; text-align: center; }
.detail-error { padding: clamp(40px, 8vw, 90px) 24px; border: 1px dashed #ead8c7; border-radius: 16px; background: rgb(255 250 242 / 85%); text-align: center; }
.detail-error__title { margin: 0 0 8px; color: #253142; font-size: 20px; font-weight: 750; }
.detail-error__desc { margin: 0 0 22px; color: #8d857a; font-size: 14px; }
.detail-error__actions { display: flex; justify-content: center; align-items: center; gap: 18px; }
.detail-footer { margin-top: 30px; }
.back-link { color: #8d857a; font-size: 13px; text-decoration: none; }
.back-link:hover { color: #c86f37; }
@media (max-width: 760px) {
  .detail-hero { grid-template-columns: 1fr; }
  .row-title { white-space: normal; }
  .catalog-toolbar { flex-wrap: wrap; row-gap: 8px; }
}
</style>
