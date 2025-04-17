<template>
  <div class="page-loading">
    <el-spinner size="large" />  
  </div>
</template>

<script setup>
// 这里可以添加加载逻辑
</script>

<style scoped>
.page-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
</style>http://localhost:5173/login?redirect=/dashboard