<template>
  <div class="search-form">
    <a-form :model="form" layout="inline" @submit.prevent="handleSearch">
      <slot></slot>
      
      <div class="form-buttons">
        <a-button type="primary" @click="handleSearch">
          <template #icon><search-outlined /></template>搜索
        </a-button>
        <a-button @click="handleReset">
          <template #icon><reload-outlined /></template>重置
        </a-button>
      </div>
    </a-form>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, watch } from 'vue'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue'

const props = defineProps({
  form: {
    type: Object,
    required: true
  },
  searchOnReset: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['search', 'reset'])

// 处理搜索
const handleSearch = () => {
  emit('search', props.form)
}

// 处理重置
const handleReset = () => {
  // 清空表单
  Object.keys(props.form).forEach(key => {
    props.form[key] = ''
  })
  
  emit('reset')
  
  // 如果需要在重置后自动搜索
  if (props.searchOnReset) {
    handleSearch()
  }
}
</script>

<style lang="scss" scoped>
.search-form {
  margin-bottom: 24px;
  padding: 20px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  
  .form-buttons {
    margin-left: 12px;
    display: inline-flex;
    gap: 8px;
  }
}

:global([data-theme='dark']) {
  .search-form {
    background-color: #1f1f1f;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.3);
  }
}

@media (max-width: 768px) {
  .search-form {
    .a-form {
      display: flex;
      flex-direction: column;
      
      .a-form-item {
        margin-right: 0;
        margin-bottom: 16px;
      }
    }
    
    .form-buttons {
      margin-left: 0;
      justify-content: flex-end;
      width: 100%;
    }
  }
}
</style> 