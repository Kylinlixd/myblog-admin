<template>
  <div class="async-state" role="status" :aria-busy="loading">
    <div v-if="loading" class="state-skeleton" aria-label="正在加载内容">
      <span />
      <span />
      <span />
    </div>
    <template v-else-if="error">
      <div class="state-icon">!</div>
      <h3>内容暂时无法加载</h3>
      <p>{{ error }}</p>
      <a-button type="primary" class="state-retry" @click="$emit('retry')">重新加载</a-button>
    </template>
    <template v-else-if="empty">
      <div class="state-icon state-icon--empty">○</div>
      <h3>{{ emptyTitle }}</h3>
      <p>{{ emptyDescription }}</p>
      <a-button class="state-retry" @click="$emit('retry')">重新加载</a-button>
    </template>
  </div>
</template>

<script setup>
defineProps({
  loading: Boolean,
  error: { type: String, default: '' },
  empty: Boolean,
  emptyTitle: { type: String, default: '暂时没有内容' },
  emptyDescription: { type: String, default: '新的内容正在路上，稍后再来看看。' }
})

defineEmits(['retry'])
</script>

<style scoped>
.async-state {
  display: grid;
  min-height: 240px;
  place-items: center;
  align-content: center;
  gap: 8px;
  padding: 40px 24px;
  color: var(--color-text-secondary);
  text-align: center;
}

.async-state h3,
.async-state p {
  margin: 0;
}

.async-state h3 { color: var(--color-text); }
.state-icon { display: grid; width: 42px; height: 42px; place-items: center; border-radius: 50%; background: #fff1f2; color: var(--color-danger); font-weight: 700; }
.state-icon--empty { background: var(--color-primary-soft); color: var(--color-primary); }
.state-retry { margin-top: 8px; }
.state-skeleton { width: min(560px, 100%); }
.state-skeleton span { display: block; height: 14px; margin: 12px auto; border-radius: 999px; background: var(--color-border); animation: state-pulse 1.35s ease-in-out infinite; }
.state-skeleton span:nth-child(2) { width: 82%; }
.state-skeleton span:nth-child(3) { width: 64%; }
@keyframes state-pulse { 50% { opacity: .48; } }
@media (prefers-reduced-motion: reduce) { .state-skeleton span { animation: none; } }
</style>
