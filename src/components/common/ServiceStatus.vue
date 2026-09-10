<template>
  <button class="service-status" type="button" :class="`service-status--${state}`" :title="detail" :aria-label="detail" @click="check">
    <i aria-hidden="true" />
    <span>{{ label }}</span>
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  state: { type: String, default: 'checking' },
  checkedAt: { type: [String, Date], default: null },
  latency: { type: Number, default: null },
  error: { type: String, default: '' }
})
const emit = defineEmits(['check'])
const labels = { ok: '服务正常', checking: '正在检测', error: '连接异常', expired: '会话已过期', forbidden: '无检测权限' }
const label = computed(() => labels[props.state] || labels.error)
const detail = computed(() => {
  if (props.error) return props.error
  const when = props.checkedAt ? new Date(props.checkedAt).toLocaleTimeString('zh-CN', { hour12: false }) : '尚未检测'
  return `仅检查后台 API 连接 · ${when}${props.latency == null ? '' : ` · 往返 ${props.latency}ms`}`
})
const check = () => emit('check')
</script>

<style scoped>
.service-status { display: inline-flex; align-items: center; gap: 7px; padding: 5px 8px; border: 0; border-radius: 7px; background: transparent; color: #718096; cursor: pointer; font-size: 12px; }
.service-status:hover { background: #f2f5fb; color: #315bea; }
.service-status i { width: 7px; height: 7px; border-radius: 50%; background: #94a3b8; box-shadow: 0 0 0 3px rgb(148 163 184 / 15%); }
.service-status--ok i { background: #35b77a; box-shadow: 0 0 0 3px rgb(53 183 122 / 14%); }
.service-status--error i, .service-status--expired i, .service-status--forbidden i { background: #ef6b62; box-shadow: 0 0 0 3px rgb(239 107 98 / 14%); }
</style>
