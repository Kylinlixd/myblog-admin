<template>
  <button
    class="service-status"
    type="button"
    :class="`service-status--${state}`"
    :aria-label="detail"
    :aria-describedby="showDetails ? 'service-status-detail' : undefined"
    @mouseenter="showDetails = true"
    @mouseleave="showDetails = false"
    @focus="showDetails = true"
    @blur="showDetails = false"
    @click="check"
  >
    <i aria-hidden="true" />
    <span>{{ label }}</span>
    <span v-if="showDetails" id="service-status-detail" class="service-status__popover" role="tooltip">{{ detail }}</span>
  </button>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  state: { type: String, default: 'checking' },
  checkedAt: { type: [String, Date], default: null },
  latency: { type: Number, default: null },
  error: { type: String, default: '' }
})
const emit = defineEmits(['check'])
const labels = { ok: '服务正常', checking: '正在检测', error: '连接异常', expired: '会话已过期', forbidden: '无检测权限' }
const label = computed(() => labels[props.state] || labels.error)
const showDetails = ref(false)
const detail = computed(() => {
  if (props.error) return props.error
  const when = props.checkedAt ? new Date(props.checkedAt).toLocaleTimeString('zh-CN', { hour12: false }) : '尚未检测'
  return `仅检查后台 API 连接 · ${when}${props.latency == null ? '' : ` · 往返 ${props.latency}ms`}`
})
const check = () => emit('check')
</script>

<style scoped>
.service-status { position: relative; display: inline-flex; align-items: center; gap: 7px; padding: 6px 10px; border: 1px solid transparent; border-radius: 999px; background: transparent; color: #718096; cursor: pointer; font-size: 12px; transition: background .2s ease, border-color .2s ease, color .2s ease, box-shadow .2s ease; }
.service-status:hover, .service-status:focus-visible { border-color: #dbe5f3; background: #f4f7fb; box-shadow: 0 4px 14px rgb(49 91 234 / 8%); color: #315bea; outline: none; }
.service-status i { width: 7px; height: 7px; border-radius: 50%; background: #94a3b8; box-shadow: 0 0 0 3px rgb(148 163 184 / 15%); }
.service-status--ok i { background: #35b77a; box-shadow: 0 0 0 3px rgb(53 183 122 / 14%); }
.service-status--error i, .service-status--expired i, .service-status--forbidden i { background: #ef6b62; box-shadow: 0 0 0 3px rgb(239 107 98 / 14%); }
.service-status__popover { position: absolute; z-index: 20; top: calc(100% + 9px); right: 0; width: max-content; max-width: min(300px, 72vw); padding: 9px 12px; border: 1px solid #e5e8ed; border-radius: 10px; background: #fff; box-shadow: 0 12px 28px rgb(30 50 80 / 14%); color: #4b5563; font-size: 11px; font-weight: 500; line-height: 1.5; text-align: left; white-space: normal; }
.service-status__popover::before { position: absolute; top: -5px; right: 18px; width: 9px; height: 9px; border-top: 1px solid #e5e8ed; border-left: 1px solid #e5e8ed; background: #fff; content: ''; transform: rotate(45deg); }
</style>
