<template>
  <Transition name="fade">
    <div v-if="visible" class="page-loading" :class="{ 'has-error': hasError }">
      <template v-if="!hasError">
        <div class="loading-spinner"></div>
        <div class="loading-text">{{ text }}</div>
      </template>
      <template v-else>
        <div class="error-icon">
          <svg viewBox="0 0 24 24" width="60" height="60" stroke="currentColor" fill="none">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div class="error-text">{{ text }}</div>
        <button v-if="canRetry" class="retry-button" @click="handleRetry">
          重试
        </button>
      </template>
      <div v-if="autoHideCountdown > 0" class="countdown">
        {{ autoHideCountdown }}秒后自动关闭
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: true
  },
  text: {
    type: String,
    default: '加载中...'
  },
  hasError: {
    type: Boolean,
    default: false
  },
  autoHide: {
    type: Boolean,
    default: false
  },
  timeout: {
    type: Number,
    default: 3000
  },
  canRetry: {
    type: Boolean,
    default: true
  }
})

const visible = ref(props.show)
const autoHideCountdown = ref(0)
const countdownTimer = ref(null)
const emit = defineEmits(['hide', 'retry'])

// 自动隐藏倒计时
const startCountdown = () => {
  // 清除现有计时器
  stopCountdown()
  
  // 只有在有错误或设置了自动隐藏时才启动倒计时
  if ((props.hasError || props.autoHide) && props.show) {
    // 设置倒计时初始值（秒）
    autoHideCountdown.value = Math.floor(props.timeout / 1000) 
    console.log('Countdown started:', autoHideCountdown.value) // 添加调试信息
    
    // 每秒更新倒计时
    countdownTimer.value = setInterval(() => {
      autoHideCountdown.value--
      console.log('Countdown:', autoHideCountdown.value) // 添加调试信息
      
      // 倒计时结束，隐藏加载器
      if (autoHideCountdown.value <= 0) {
        stopCountdown()
        visible.value = false
        setTimeout(() => {
          emit('hide')
        }, 300)
      }
    }, 1000)
  }
}

// 停止倒计时
const stopCountdown = () => {
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
    countdownTimer.value = null
  }
}

// 重试操作
const handleRetry = () => {
  console.log('触发重试操作')
  stopCountdown()
  emit('retry')
}

// 监听show属性变化
watch(() => props.show, (newVal) => {
  console.log('PageLoading show changed:', newVal) // 调试日志
  visible.value = newVal
  
  if (newVal) {
    // 显示加载器时开始倒计时（如果需要）
    if (props.hasError || props.autoHide) {
      startCountdown()
    }
  } else {
    // 隐藏加载器时停止倒计时
    stopCountdown()
    setTimeout(() => {
      emit('hide')
    }, 300) // 等待淡出动画完成
  }
}, { immediate: true })

// 监听错误状态变化
watch(() => props.hasError, (newVal) => {
  console.log('PageLoading hasError changed:', newVal)
  if (newVal) {
    // 发生错误时启动倒计时
    startCountdown()
  }
})

onMounted(() => {
  console.log('PageLoading mounted, visible:', visible.value) // 调试日志
  
  if ((props.hasError || props.autoHide) && props.show) {
    startCountdown()
  }
})

onUnmounted(() => {
  stopCountdown()
})
</script>

<style scoped>
/* 提供组件级别的样式覆盖，确保显示正确 */
.page-loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.page-loading.has-error {
  background-color: rgba(220, 0, 0, 0.4);
}

.loading-spinner {
  width: 70px;
  height: 70px;
  border: 5px solid rgba(255, 255, 255, 0.3);
  border-top-color: #409EFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text, .error-text {
  margin-top: 24px;
  font-size: 20px;
  color: white;
  font-weight: 500;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  text-align: center;
  max-width: 80%;
}

.error-icon {
  color: #ff4d4f;
  animation: pulse 2s infinite;
}

.retry-button {
  margin-top: 24px;
  padding: 8px 24px;
  background-color: #409EFF;
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.retry-button:hover {
  background-color: #66b1ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.countdown {
  position: absolute;
  bottom: 40px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>