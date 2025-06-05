<template>
  <LampEffect>
    <span class="font-heading text-6xl"> Lamp Effect </span>
  </LampEffect>
</template>


<script setup>
import LampEffect from '@/components/InspiraUI/LampEffect.vue'
</script>

<style scoped>
.test-content {
  @apply max-w-4xl mx-auto py-12 px-4;
  position: relative;
  z-index: 50;
  margin-top: 2rem;
}

.test-section {
  @apply bg-slate-900/50 p-6 rounded-lg backdrop-blur-sm;
}

.test-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4 mt-6;
}

.test-card {
  @apply bg-cyan-500/10 p-4 rounded-lg;
}
</style> 