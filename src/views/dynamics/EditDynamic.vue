<template>
  <div class="edit-dynamic">
    <a-page-header
      title="编辑动态"
      subtitle="修改动态内容"
      @back="handleBack"
    />
    
    <DynamicForm :dynamic-id="dynamicId" />
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import DynamicForm from './DynamicForm.vue'

const router = useRouter()
const route = useRoute()
const dynamicId = route.params.id

const handleBack = () => {
  router.back()
}
</script>

<style scoped lang="scss">
.edit-dynamic {
  :deep(.ant-page-header) {
    padding: 16px 24px;
    background: #fff;
    border-radius: 4px;
    margin-bottom: 24px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }
}
</style> 