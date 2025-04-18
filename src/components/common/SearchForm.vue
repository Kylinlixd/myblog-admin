<template>
  <div class="search-form">
    <el-form :model="form" inline @submit.prevent="handleSearch">
      <slot></slot>
      
      <div class="form-buttons">
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>搜索
        </el-button>
        <el-button @click="handleReset">
          <el-icon><RefreshRight /></el-icon>重置
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, watch } from 'vue'
import { Search, RefreshRight } from '@element-plus/icons-vue'

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
    .el-form {
      display: flex;
      flex-direction: column;
      
      .el-form-item {
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