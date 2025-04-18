<template>
  <div class="pagination">
    <div class="pagination-info">
      共 {{ total }} 条
      <div class="page-size-selector">
        <el-select v-model="currentSize" @change="handleSizeChange" size="small">
          <el-option
            v-for="size in pageSizes"
            :key="size"
            :label="`${size}条/页`"
            :value="size"
          />
        </el-select>
      </div>
    </div>
    
    <div class="pagination-buttons">
      <el-button
        type="text"
        :disabled="currentPage === 1"
        @click="handleCurrentChange(currentPage - 1)"
        icon="ArrowLeft"
      />
      
      <div class="page-numbers">
        <el-button
          v-for="page in displayPageNumbers"
          :key="page"
          type="text"
          :class="{ active: page === currentPage }"
          @click="handleCurrentChange(page)"
        >
          {{ page }}
        </el-button>
      </div>
      
      <el-button
        type="text"
        :disabled="currentPage === totalPages"
        @click="handleCurrentChange(currentPage + 1)"
        icon="ArrowRight"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'

const props = defineProps({
  total: {
    type: Number,
    default: 0
  },
  pageSize: {
    type: Number,
    default: 10
  },
  currentPage: {
    type: Number,
    default: 1
  },
  pageSizes: {
    type: Array,
    default: () => [10, 20, 50, 100]
  }
})

const emit = defineEmits(['size-change', 'current-change'])

// 使用本地状态跟踪当前页码和每页条数
const currentSize = ref(props.pageSize)
const internalCurrentPage = ref(props.currentPage)

// 监听外部属性变化
watch(() => props.pageSize, (newVal) => {
  currentSize.value = newVal
})

watch(() => props.currentPage, (newVal) => {
  internalCurrentPage.value = newVal
})

// 计算总页数
const totalPages = computed(() => Math.ceil(props.total / currentSize.value) || 1)

// 显示的页码按钮
const displayPageNumbers = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, internalCurrentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)
  
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

// 处理页码变化
const handleCurrentChange = (page) => {
  if (page < 1 || page > totalPages.value) return
  internalCurrentPage.value = page
  emit('current-change', page)
}

// 处理每页条数变化
const handleSizeChange = (size) => {
  currentSize.value = size
  // 切换每页条数时，通常回到第一页
  internalCurrentPage.value = 1
  emit('size-change', size)
  emit('current-change', 1)
}
</script>

<style lang="scss" scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  
  .pagination-info {
    display: flex;
    align-items: center;
    color: #606266;
    font-size: 14px;
    
    .page-size-selector {
      margin-left: 12px;
    }
  }
  
  .pagination-buttons {
    display: flex;
    align-items: center;
    
    .page-numbers {
      display: flex;
      margin: 0 8px;
    }
    
    .el-button {
      padding: 8px 12px;
      margin: 0 4px;
      
      &.active {
        color: #0096ff;
        font-weight: bold;
      }
    }
  }
}

:global([data-theme='dark']) {
  .pagination {
    .pagination-info {
      color: #c0c4cc;
    }
  }
}
</style> 