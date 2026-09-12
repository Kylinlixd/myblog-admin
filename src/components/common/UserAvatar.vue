<template>
  <a-avatar
    :size="size"
    :class="['user-avatar', `user-avatar--${tone}`]"
    :src="imageSrc || undefined"
    :alt="alt || label"
    :load-error="handleError"
  >
    <template v-if="!imageSrc">
      <svg v-if="tone === 'warm'" class="user-avatar__coffee" viewBox="0 0 48 48" aria-hidden="true">
        <path d="M10 20h24v9.5A8.5 8.5 0 0 1 25.5 38h-7A8.5 8.5 0 0 1 10 29.5V20Z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" />
        <path d="M34 23h2.8a5.2 5.2 0 0 1 0 10.4H33M15 42h19M17 13c0-2.2 2.4-2.4 2.4-4.6M24 13c0-2.2 2.4-2.4 2.4-4.6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
      </svg>
      <user-outlined v-else class="user-avatar__icon" />
    </template>
  </a-avatar>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { UserOutlined } from '@ant-design/icons-vue'
import { buildApiUrl } from '@/utils/apiBaseUrl'

const props = defineProps({
  src: { type: String, default: '' },
  nickname: { type: String, default: '' },
  username: { type: String, default: '' },
  size: { type: [Number, String], default: 36 },
  alt: { type: String, default: '' },
  tone: { type: String, default: 'cool' },
  fallback: { type: String, default: '' },
  fallbackSeed: { type: [Number, String], default: '' }
})

const failed = ref(false)
const fallbackSrc = computed(() => {
  if (props.fallback !== 'anonymous') return ''
  const seed = String(props.fallbackSeed || props.nickname || props.username || '0')
  const numericSeed = Number(seed)
  if (Number.isFinite(numericSeed) && seed.trim() !== '') {
    return `/assets/default-avatars/anonymous/anonymous-${String((Math.abs(numericSeed) % 16) + 1).padStart(2, '0')}.svg`
  }
  let hash = 0
  for (const character of seed) hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  const index = (hash % 16) + 1
  return `/assets/default-avatars/anonymous/anonymous-${String(index).padStart(2, '0')}.svg`
})
const normalisedSrc = computed(() => {
  const value = String(props.src || '').trim()
  // Legacy placeholder paths should use the same initials/icon fallback as
  // an account that has never uploaded an avatar.
  if (!value || /(?:default-avatar|about-avatar|placeholder-avatar)/i.test(value)) return ''
  return buildApiUrl(value)
})
const imageSrc = computed(() => failed.value ? '' : (normalisedSrc.value || fallbackSrc.value))
const label = computed(() => props.nickname || props.username || '用户')

watch([normalisedSrc, fallbackSrc], () => { failed.value = false })
const handleError = () => { failed.value = true }
</script>

<style scoped>
.user-avatar { display: inline-grid; place-items: center; flex: 0 0 auto; overflow: hidden; color: #2f5de5; background: #e8efff; font-weight: 700; }
.user-avatar--warm { color: #735a45; background: #f1e8dc; }
.user-avatar__letter { line-height: 1; }
.user-avatar__icon { display: block; color: currentColor; font-size: .85em; line-height: 1; }
.user-avatar__coffee { display: block; width: 70%; height: 70%; }
</style>
