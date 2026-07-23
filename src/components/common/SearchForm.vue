<template>
  <div class="search-form admin-filter">
    <a-form :model="form" layout="inline" @submit.prevent="handleSearch">
      <slot></slot>
      
      <div class="form-buttons">
        <a-button type="primary" @click="handleSearch" class="search-button">
          <template #icon><search-outlined /></template>搜索
        </a-button>
        <a-button @click="handleReset" class="reset-button">
          <template #icon><reload-outlined /></template>重置
        </a-button>
      </div>
    </a-form>
  </div>
</template>

<script setup>
import { defineEmits, watch } from 'vue'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue'

const props = defineProps({
  form: {
    type: Object,
    required: true
  },
  searchOnReset: {
    type: Boolean,
    default: true
  },
  defaultValues: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['search', 'reset'])

// 处理搜索
const handleSearch = () => {
  emit('search', props.form)
}

// 处理重置
const handleReset = () => {
  // 重置为默认值
  Object.keys(props.form).forEach(key => {
    props.form[key] = props.defaultValues[key] || ''
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
  margin-bottom: 0;
  
  :deep(.ant-form) {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: flex-end;
  }

  :deep(.ant-form-item) {
    margin-bottom: 0;
    margin-right: 0;
    min-width: 180px;
    flex: none;
  }

  :deep(.ant-input) {
    min-width: 180px;
    height: 36px !important;
    line-height: 36px !important;
    font-size: 13px;
  }

  :deep(.ant-select-selector) {
    min-width: 160px;
    height: 36px !important;
    font-size: 13px;
  }

  .form-buttons {
    display: flex;
    gap: 8px;
    margin-left: 0;
    align-items: center;
    .search-button, .reset-button {
      height: 36px;
      padding: 0 16px;
      border-radius: 8px;
      font-weight: 650;
      font-size: 14px;
      transition: all 0.3s ease;
    }
    .search-button:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
    }
    .reset-button:hover {
      color: #40a9ff;
      border-color: #40a9ff;
      background: rgba(24, 144, 255, 0.05);
    }
  }
}

:global([data-theme='dark']) {
  .search-form {
    :deep(.ant-input) {
      background-color: #141414;
      border-color: #434343;

      &:hover {
        border-color: #177ddc;
      }

      &:focus {
        border-color: #177ddc;
        box-shadow: 0 0 0 2px rgba(23, 125, 220, 0.2);
      }
    }

    .form-buttons {
      .reset-button:hover {
        color: #177ddc;
        border-color: #177ddc;
        background: rgba(23, 125, 220, 0.1);
      }
    }
  }
}

@media (max-width: 768px) {
  .search-form {
    padding: 16px;

    :deep(.ant-form) {
      flex-direction: column;
    }

    :deep(.ant-form-item) {
      width: 100%;
      margin-bottom: 16px;
    }

    .form-buttons {
      margin-left: 0;
      width: 100%;
      justify-content: flex-end;
    }
  }
}
</style>
