<template>
  <div class="search-form">
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
  margin-bottom: 24px;
  padding: 24px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  
  :deep(.ant-form) {
    display: flex;
    flex-wrap: nowrap;
    gap: 12px;
    align-items: center;
  }

  :deep(.ant-form-item) {
    margin-bottom: 0;
    margin-right: 0;
    min-width: 200px;
    flex: none;
  }

  :deep(.ant-input) {
    border: none;
    background: #fafbfc;
    box-shadow: none;
    border-radius: 6px;
    min-width: 90px;
    max-width: 120px;
    width: 100px;
    height: 24px !important;
    line-height: 24px !important;
    font-size: 13px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    padding: 0 6px;
    &:hover {
      border-color: #40a9ff;
    }
    &:focus {
      border-color: #40a9ff;
      box-shadow: none;
    }
  }

  :deep(.ant-select-selector) {
    min-width: 90px;
    max-width: 120px;
    width: 100px;
    height: 24px !important;
    line-height: 24px !important;
    font-size: 13px;
    display: flex;
    align-items: center;
    border-radius: 6px;
    background: #fafbfc;
    border: none;
    box-shadow: none;
    padding: 0 6px;
  }

  .form-buttons {
    display: flex;
    gap: 10px;
    margin-left: 0;
    align-items: center;
    .search-button, .reset-button {
      height: 36px;
      padding: 0 18px;
      border-radius: 6px;
      font-weight: 500;
      font-size: 15px;
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
    background-color: #1f1f1f;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.2);

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