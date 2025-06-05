<template>
  <div class="pagination">
    <div class="pagination-wrapper">
      <a-pagination
        v-model:current="internalCurrentPage"
        :total="total"
        :pageSize="currentSize"
        :showSizeChanger="true"
        :pageSizeOptions="pageSizes.map(String)"
        :showTotal="total => `共 ${total} 条`"
        @change="handleCurrentChange"
        @showSizeChange="handleSizeChange"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

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

// 处理页码变化
const handleCurrentChange = (page) => {
  if (page < 1 || page > totalPages.value) return
  internalCurrentPage.value = page
  emit('current-change', page)
}

// 处理每页条数变化
const handleSizeChange = (current, size) => {
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
  justify-content: flex-end;
  padding: 16px 0;
  
  .pagination-wrapper {
    display: flex;
    align-items: center;
  }
}
</style> 