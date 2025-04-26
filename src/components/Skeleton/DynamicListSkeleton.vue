<template>
  <div class="dynamic-list-skeleton">
    <div class="skeleton-header">
      <a-skeleton-input :active="true" size="large" style="width: 200px" />
      <a-button-skeleton style="width: 100px" />
    </div>
    
    <div class="skeleton-filter">
      <a-skeleton-input :active="true" style="width: 200px" />
      <a-skeleton-input :active="true" style="width: 200px" />
      <a-skeleton-input :active="true" style="width: 200px" />
    </div>
    
    <div class="skeleton-table">
      <a-skeleton :active="true" :paragraph="{ rows: 5, width: '100%' }" :title="false" />
    </div>
    
    <div class="skeleton-pagination">
      <a-skeleton-input :active="true" style="width: 200px" />
    </div>
  </div>
</template>

<script setup>
import { Skeleton, SkeletonInput, Button } from 'ant-design-vue'

const ASkeletonInput = SkeletonInput
const AButtonSkeleton = Button.Skeleton
</script>

<style scoped>
.dynamic-list-skeleton {
  padding: 20px;
}

.skeleton-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.skeleton-filter {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.skeleton-table {
  margin-bottom: 20px;
}

.skeleton-pagination {
  display: flex;
  justify-content: center;
}
</style> 