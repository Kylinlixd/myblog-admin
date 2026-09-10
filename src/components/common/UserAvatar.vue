<template>
  <a-avatar
    :size="size"
    :class="['user-avatar', `user-avatar--${tone}`]"
    :src="imageSrc || undefined"
    :alt="alt || label"
    @error="handleError"
  >
    <template v-if="!imageSrc">
      <user-outlined class="user-avatar__icon" />
    </template>
  </a-avatar>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { UserOutlined } from '@ant-design/icons-vue'

const props = defineProps({
  src: { type: String, default: '' },
  nickname: { type: String, default: '' },
  username: { type: String, default: '' },
  size: { type: [Number, String], default: 36 },
  alt: { type: String, default: '' },
  tone: { type: String, default: 'cool' }
})

const failed = ref(false)
const normalisedSrc = computed(() => {
  const value = String(props.src || '').trim()
  // Legacy placeholder paths should use the same initials/icon fallback as
  // an account that has never uploaded an avatar.
  if (!value || /(?:default-avatar|about-avatar|placeholder-avatar)/i.test(value)) return ''
  return value
})
const imageSrc = computed(() => failed.value ? '' : normalisedSrc.value)
const label = computed(() => props.nickname || props.username || '用户')

watch(normalisedSrc, () => { failed.value = false })
const handleError = () => { failed.value = true }
</script>

<style scoped>
.user-avatar { display: inline-grid; place-items: center; flex: 0 0 auto; overflow: hidden; color: #2f5de5; background: #e8efff; font-weight: 700; }
.user-avatar--warm { color: #735a45; background: #f1e8dc; }
.user-avatar__letter { line-height: 1; }
.user-avatar__icon { display: block; color: currentColor; font-size: .85em; line-height: 1; }
</style>
