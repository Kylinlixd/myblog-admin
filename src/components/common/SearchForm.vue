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
    flex-wrap: wrap;
    gap: 16px;
    align-items: flex-start;
  }

  :deep(.ant-form-item) {
    margin-bottom: 0;
    margin-right: 0;
  }

  :deep(.ant-input),
  :deep(.ant-select-selector) {
    border-radius: 6px;
    border: 1px solid #e8e8e8;
    transition: all 0.3s ease;

    &:hover {
      border-color: #40a9ff;
    }

    &:focus {
      border-color: #40a9ff;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
    }
  }

  .form-buttons {
    display: flex;
    gap: 12px;
    margin-left: auto;
    align-items: center;

    .search-button {
      height: 36px;
      padding: 0 20px;
      border-radius: 6px;
      font-weight: 500;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
      }
    }

    .reset-button {
      height: 36px;
      padding: 0 20px;
      border-radius: 6px;
      transition: all 0.3s ease;

      &:hover {
        color: #40a9ff;
        border-color: #40a9ff;
        background: rgba(24, 144, 255, 0.05);
      }
    }
  }
}

:global([data-theme='dark']) {
  .search-form {
    background-color: #1f1f1f;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.2);

    :deep(.ant-input),
    :deep(.ant-select-selector) {
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