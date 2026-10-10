<template>
  <main class="collection-detail cinematic-page">
    <div v-if="collection" class="detail-inner">
      <header class="detail-hero">
        <img v-if="collection.cover" :src="collection.cover" :alt="collection.title" class="detail-cover" />
        <div class="detail-head">
          <span class="detail-kicker">COLLECTION · 合集</span>
          <h1 class="detail-title">{{ collection.title }}</h1>
          <p class="detail-desc">{{ collection.description || '按系列持续更新的完整阅读路径。' }}</p>
          <div class="detail-meta">
            <span>{{ collection.itemCount }} 篇</span>
            <span>按发布顺序排列</span>
            <span>持续更新中</span>
          </div>
        </div>
      </header>

      <section class="catalog" aria-label="合集目录">
        <router-link
          v-for="(item, index) in collection.items"
          :key="item.id"
          :to="`/blog/dynamics/${item.id}`"
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
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getBlogCollectionDetail } from '@/api/blog'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const appStore = useAppStore()
const collection = ref(null)

function formatDate(value) {
  if (!value) return ''
  return String(value).slice(0, 10)
}

async function fetchCollection() {
  try {
    appStore.startLoading('加载合集数据...')
    const response = await getBlogCollectionDetail(route.params.id)
    if (response?.code === 200) collection.value = response.data
    else appStore.setLoadingError('获取合集数据失败，请刷新重试')
    appStore.endLoading()
  } catch (error) {
    console.error('获取合集数据失败:', error)
    appStore.setLoadingError('获取合集数据失败，请刷新重试')
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
.catalog-row { display: flex; align-items: center; gap: 18px; padding: 16px 20px; border: 1px solid rgb(108 82 54 / 12%); border-radius: 14px; background: rgb(255 250 242 / 85%); color: inherit; text-decoration: none; transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease; }
.catalog-row:hover { transform: translateX(6px); border-color: #c86f37; box-shadow: 0 12px 28px rgb(92 59 35 / 12%); }
.row-index { flex: 0 0 auto; color: #c86f37; font-size: 18px; font-weight: 800; font-variant-numeric: tabular-nums; }
.row-body { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 4px; }
.row-title { overflow: hidden; color: #253142; font-size: 15px; font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }
.row-meta { color: #8d857a; font-size: 12px; }
.row-arrow { flex: 0 0 auto; color: #b85e2d; font-size: 16px; }
.catalog-empty { padding: 28px; border: 1px dashed #ead8c7; border-radius: 14px; color: #8d857a; font-size: 14px; text-align: center; }
.detail-footer { margin-top: 30px; }
.back-link { color: #8d857a; font-size: 13px; text-decoration: none; }
.back-link:hover { color: #c86f37; }
@media (max-width: 760px) {
  .detail-hero { grid-template-columns: 1fr; }
  .row-title { white-space: normal; }
}
</style>
