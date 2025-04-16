<template>
  <div class="dynamic-list-skeleton">
    <div class="skeleton-header">
      <el-skeleton-item variant="h1" style="width: 200px" />
      <el-skeleton-item variant="button" style="width: 100px" />
    </div>
    
    <div class="skeleton-filter">
      <el-skeleton-item variant="text" style="width: 200px" />
      <el-skeleton-item variant="text" style="width: 200px" />
      <el-skeleton-item variant="text" style="width: 200px" />
    </div>
    
    <div class="skeleton-table">
      <el-skeleton-item variant="text" style="width: 100%" />
      <el-skeleton-item variant="text" style="width: 100%" />
      <el-skeleton-item variant="text" style="width: 100%" />
      <el-skeleton-item variant="text" style="width: 100%" />
      <el-skeleton-item variant="text" style="width: 100%" />
    </div>
    
    <div class="skeleton-pagination">
      <el-skeleton-item variant="text" style="width: 200px" />
    </div>
  </div>
</template>

<script setup>
import { ElSkeleton, ElSkeletonItem } from 'element-plus'
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