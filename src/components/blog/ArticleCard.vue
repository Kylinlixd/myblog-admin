<template>
  <article class="article-card">
    <router-link :to="`/blog/dynamics/${article.id}`" class="article-link">
      <div class="article-card__media" :class="{ 'article-card__media--fallback': !mediaUrl }">
        <img v-if="mediaUrl" :src="mediaUrl" :alt="article.title" loading="lazy" />
      </div>
      <div class="article-meta">
        <span class="article-category">{{ article.category?.name || '随笔' }}</span>
        <time :datetime="article.created_at">{{ formattedDate }}</time>
      </div>
      <h3>{{ article.title || '未命名内容' }}</h3>
      <p>{{ excerpt }}</p>
      <div class="article-footer">
        <span>{{ article.author?.nickname || article.author?.username || 'LiXD' }}</span>
        <span>{{ article.view_count ?? article.views ?? 0 }} 次阅读</span>
      </div>
    </router-link>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { buildApiUrl } from '@/utils/apiBaseUrl'

const props = defineProps({
  article: { type: Object, required: true }
})

const excerpt = computed(() => {
  const source = props.article.summary || props.article.content || '点击阅读完整内容。'
  return source.replace(/[#>*_`\[\]]/g, '').replace(/\s+/g, ' ').trim().slice(0, 120)
})

const mediaUrl = computed(() => {
  const media = props.article.mediaUrls || props.article.files || []
  const first = Array.isArray(media) ? media[0] : media
  return buildApiUrl(typeof first === 'string' ? first : first?.url || first?.file_url || '')
})

const formattedDate = computed(() => {
  if (!props.article.created_at) return '最近更新'
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric', month: 'short', day: 'numeric'
  }).format(new Date(props.article.created_at))
})
</script>

<style scoped>
.article-card { overflow: hidden; border: 1px solid var(--color-border); border-radius: 18px; background: var(--color-surface); }
.article-link { display: block; padding: 12px; border-radius: var(--radius-sm); transition: background var(--transition-fast), transform var(--transition-fast); }
.article-link:hover { background: var(--color-surface-muted); transform: translateX(3px); }
.article-card__media { height: 190px; margin-bottom: 16px; overflow: hidden; border-radius: 12px; background: var(--color-surface-muted); }
.article-card__media img { width: 100%; height: 100%; object-fit: cover; transition: transform .7s ease; }
.article-link:hover .article-card__media img { transform: scale(1.05); }
.article-card__media--fallback { background: radial-gradient(circle at 25% 20%, rgb(72 112 255 / 38%), transparent 42%), linear-gradient(145deg, #152642, #08111e); }
.article-meta, .article-footer { display: flex; align-items: center; justify-content: space-between; gap: 16px; color: var(--color-text-muted); font-size: 13px; }
.article-category { color: var(--color-primary); font-weight: 650; }
h3 { margin: 10px 0 8px; color: var(--color-text); font-size: clamp(19px, 2vw, 23px); line-height: 1.35; }
p { display: -webkit-box; margin: 0 0 18px; overflow: hidden; color: var(--color-text-secondary); -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
@media (max-width: 520px) { .article-card__media { height: 160px; } .article-footer { align-items: flex-start; flex-direction: column; gap: 4px; } }
</style>
