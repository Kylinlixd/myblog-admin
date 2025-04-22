<template>
  <div class="page-header">
    <div class="title">
      <slot name="icon">
        <component :is="icon" v-if="icon" />
      </slot>
      <h2>{{ title }}</h2>
    </div>
    <div class="actions">
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

defineProps({
  title: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: ''
  }
})
</script>

<style lang="scss" scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
  
  .title {
    display: flex;
    align-items: center;
    
    h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #303133;
    }
    
    .anticon {
      margin-right: 8px;
      font-size: 22px;
      color: #0096ff;
    }
  }
  
  .actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

:global([data-theme='dark']) {
  .page-header {
    border-bottom-color: #2c2c2c;
    
    .title h2 {
      color: #e0e0e0;
    }
  }
}
</style> 