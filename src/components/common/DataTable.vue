<template>
  <div class="data-table admin-table-card" :aria-busy="loading">
    <div class="table-wrapper" :class="{ 'is-loading': loading }">
      <table class="inspira-table">
        <thead>
          <tr>
            <th v-if="selectable" class="selection-cell">
              <input
                type="checkbox"
                aria-label="选择当前页全部数据"
                :checked="allVisibleSelected"
                :indeterminate="someVisibleSelected"
                :disabled="!data.length"
                @change="toggleVisibleRows"
              />
            </th>
            <th v-for="(column, index) in columns" :key="index" :style="column.width ? { width: column.width } : {}">
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <slot v-if="$slots.default"></slot>
          <template v-else>
            <tr v-for="(row, rowIndex) in data" :key="getRowKey(row, rowIndex)">
              <td v-if="selectable" class="selection-cell">
                <input
                  type="checkbox"
                  :aria-label="`选择第 ${rowIndex + 1} 行`"
                  :checked="isSelected(row, rowIndex)"
                  @change="toggleRow(row, rowIndex, $event)"
                />
              </td>
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
            <td :colspan="columns.length + (selectable ? 1 : 0)" class="empty-cell">
              <div class="empty-data">
                <i class="icon-empty"></i>
                <span>{{ emptyText }}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="loading" class="loading-overlay" role="status" aria-label="正在加载内容">
        <div class="loading-skeleton" aria-hidden="true"><i /><i /><i /></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

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
  },
  selectable: {
    type: Boolean,
    default: false
  },
  selectedRowKeys: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['selection-change'])
const visibleKeys = computed(() => props.data.map((row, index) => getRowKey(row, index)))
const selectedSet = computed(() => new Set(props.selectedRowKeys))
const allVisibleSelected = computed(() => visibleKeys.value.length > 0 && visibleKeys.value.every((key) => selectedSet.value.has(key)))
const someVisibleSelected = computed(() => !allVisibleSelected.value && visibleKeys.value.some((key) => selectedSet.value.has(key)))

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

const isSelected = (row, index) => selectedSet.value.has(getRowKey(row, index))

const toggleRow = (row, index, event) => {
  const next = new Set(props.selectedRowKeys)
  const key = getRowKey(row, index)
  if (event.target.checked) next.add(key)
  else next.delete(key)
  emit('selection-change', [...next])
}

const toggleVisibleRows = (event) => {
  const visible = new Set(visibleKeys.value)
  const next = new Set(props.selectedRowKeys.filter((key) => !visible.has(key)))
  if (event.target.checked) visibleKeys.value.forEach((key) => next.add(key))
  emit('selection-change', [...next])
}
</script>

<style lang="scss" scoped>
.data-table {
  width: 100%;
  min-width: 0;
  overflow: hidden;
}

.table-wrapper {
  position: relative;
  width: 100%;
  min-height: 240px;
  overflow: auto;
  border-radius: 8px;
  box-shadow: none;
  
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
    transition: background-color var(--transition-fast), color var(--transition-fast), opacity var(--transition-fast);
  }

  .selection-cell {
    width: 48px;
    padding-inline: 16px 4px;
    text-align: center;
  }

  input[type='checkbox'] {
    width: 16px;
    height: 16px;
    accent-color: var(--color-primary);
    cursor: pointer;
  }
  
  th {
    font-weight: 600;
    color: #606266;
    background-color: #f8faff;
    white-space: nowrap;
  }
  
  tr:hover td {
    background-color: #f8fbff;
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
  background-color: var(--color-surface);
  min-height: 240px;
  z-index: 1;
}

.loading-skeleton {
  display: grid;
  width: min(440px, 72%);
  gap: 12px;
}

.loading-skeleton i {
  display: block;
  height: 12px;
  border-radius: 999px;
  background: var(--color-border);
  animation: table-pulse 1.35s ease-in-out infinite;
}

.loading-skeleton i:nth-child(2) { width: 82%; }
.loading-skeleton i:nth-child(3) { width: 64%; }
@keyframes table-pulse { 50% { opacity: .48; } }

:global([data-theme='dark']) {
  .table-wrapper {
    box-shadow: none;
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
    background-color: #141b2d;
  }
}

@media (prefers-reduced-motion: reduce) {
  .loading-skeleton i { animation: none; }
}
</style>
