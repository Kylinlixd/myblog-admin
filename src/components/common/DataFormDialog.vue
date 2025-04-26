<template>
  <a-modal
    v-model:visible="dialogVisible"
    :title="title"
    :width="width"
    :destroy-on-close="destroyOnClose"
    @after-close="handleClosed"
  >
    <a-form
      ref="formRef"
      :model="model"
      :rules="rules"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 16 }"
      @submit.prevent="handleSubmit"
    >
      <slot></slot>
    </a-form>
    <template #footer>
      <div class="dialog-footer">
        <a-button @click="handleCancel">取消</a-button>
        <a-button type="primary" @click="handleSubmit" :loading="loading">确定</a-button>
      </div>
    </template>
  </a-modal>
</template>

<script setup>
import { ref, defineEmits, watch, nextTick } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '编辑'
  },
  model: {
    type: Object,
    required: true
  },
  rules: {
    type: Object,
    default: () => ({})
  },
  width: {
    type: String,
    default: '500px'
  },
  loading: {
    type: Boolean,
    default: false
  },
  destroyOnClose: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'submit', 'cancel', 'closed'])

const dialogVisible = ref(props.modelValue)
const formRef = ref(null)

// 同步对话框显示状态
watch(() => props.modelValue, (val) => {
  dialogVisible.value = val
})

watch(() => dialogVisible.value, (val) => {
  emit('update:modelValue', val)
})

// 表单提交处理
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    emit('submit', props.model)
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

// 取消按钮处理
const handleCancel = () => {
  dialogVisible.value = false
  emit('cancel')
}

// 对话框关闭后的处理
const handleClosed = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  emit('closed')
}
</script>

<style lang="scss" scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
  
  .a-button {
    margin-left: 10px;
  }
}
</style> 