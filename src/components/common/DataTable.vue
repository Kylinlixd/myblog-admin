<template>
  <div class="data-table">
    <div class="table-wrapper" :class="{ 'is-loading': loading }">
      <table class="inspira-table">
        <thead>
          <tr>
            <th v-for="(column, index) in columns" :key="index" :style="column.width ? { width: column.width } : {}">
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <slot v-if="$slots.default"></slot>
          <template v-else>
            <tr v-for="(row, rowIndex) in data" :key="getRowKey(row, rowIndex)">
              <td v-for="(column, colIndex) in columns" :key="colIndex">
                <template v-if="column.slot">
                  <slot :name="column.slot" :row="row" :index="rowIndex"></slot>
                </template>
                <template v-else-if="column.render">
                  <div v-html="column.render(row)"></div>
                </template>
                <template v-else>
                  {{ getValueByPath(row, column.prop) }}
                </template>
              </td>
            </tr>
          </template>
          <tr v-if="!loading && (!data || data.length === 0)">
            <td :colspan="columns.length" class="empty-cell">
              <div class="empty-data">
                <i class="icon-empty"></i>
                <span>{{ emptyText }}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="loading" class="loading-overlay">
        <div class="loading-spinner"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineEmits } from 'vue'

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  columns: {
    type: Array,
    default: () => []
  },
  rowKey: {
    type: String,
    default: 'id'
  },
  loading: {
    type: Boolean,
    default: false
  },
  emptyText: {
    type: String,
    default: '暂无数据'
  }
})

// 按路径获取对象属性值，支持嵌套属性
const getValueByPath = (object, path) => {
  if (!object || !path) return ''
  if (object[path] !== undefined) return object[path]
  
  const keys = path.split('.')
  let result = object
  
  for (const key of keys) {
    if (result === undefined || result === null) return ''
    result = result[key]
  }
  
  return result
}

// 获取行唯一键
const getRowKey = (row, index) => {
  if (props.rowKey && row[props.rowKey] !== undefined) {
    return row[props.rowKey]
  }
  return index
}
</script>

<style lang="scss" scoped>
.data-table {
  width: 100%;
  overflow: auto;
}

.table-wrapper {
  position: relative;
  width: 100%;
  overflow: auto;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  
  &.is-loading {
    .inspira-table {
      opacity: 0.6;
    }
  }
}

.inspira-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  
  th, td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid #ebeef5;
    transition: all 0.3s;
  }
  
  th {
    font-weight: 600;
    color: #606266;
    background-color: #f5f7fa;
    white-space: nowrap;
  }
  
  tr:hover td {
    background-color: #f5f7fa;
  }
  
  .empty-cell {
    text-align: center;
    padding: 30px 0;
  }
  
  .empty-data {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #909399;
    
    i {
      font-size: 42px;
      margin-bottom: 10px;
    }
  }
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.7);
  z-index: 1;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #0096ff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

:global([data-theme='dark']) {
  .table-wrapper {
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.3);
  }
  
  .inspira-table {
    th, td {
      border-bottom: 1px solid #2c2c2c;
    }
    
    th {
      background-color: #2c2c2c;
      color: #c0c4cc;
    }
    
    tr:hover td {
      background-color: #2c2c2c;
    }
  }
  
  .loading-overlay {
    background-color: rgba(0, 0, 0, 0.5);
  }
}
</style> 