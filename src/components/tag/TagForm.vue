<template>
  <a-modal
    v-model:visible="dialogVisible"
    :title="isEdit ? '编辑标签' : '创建标签'"
    width="400px"
    :before-close="handleClose"
  >
    <a-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="80px"
      @keyup.enter="submitForm"
    >
      <a-form-item label="名称" prop="name">
        <a-input v-model="form.name" placeholder="请输入标签名称" />
      </a-form-item>
    </a-form>
    
    <template #footer>
      <div class="dialog-footer">
        <a-button @click="handleClose">取消</a-button>
        <a-button type="primary" :loading="loading" @click="submitForm">
          确定
        </a-button>
      </div>
    </template>
  </a-modal>
</template>

<script setup>
import { ref, reactive, watchEffect, defineEmits, defineProps } from 'vue'
import { message as AntMessage } from 'ant-design-vue'
import { createTag, updateTag } from '../../api/tag'

const props = defineProps({
  visible: Boolean,
  tag: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:visible', 'success'])

const dialogVisible = ref(false)
const formRef = ref(null)
const loading = ref(false)

// 判断是否为编辑模式
const isEdit = ref(false)

// 表单数据
const form = reactive({
  name: ''
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入标签名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ]
}

// 监听对话框可见性
watchEffect(() => {
  dialogVisible.value = props.visible
})

// 监听对话框关闭
watchEffect(() => {
  emit('update:visible', dialogVisible.value)
})

// 监听标签数据，用于编辑模式
watchEffect(() => {
  if (props.tag && props.tag.id) {
    isEdit.value = true
    form.name = props.tag.name
  } else {
    isEdit.value = false
    form.name = ''
  }
})

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    
    loading.value = true
    
    if (isEdit.value) {
      await updateTag(props.tag.id, form)
      AntMessage.success('标签更新成功')
    } else {
      await createTag(form)
      AntMessage.success('标签创建成功')
    }
    
    // 通知父组件成功
    emit('success')
    // 关闭对话框
    dialogVisible.value = false
  } catch (error) {
    console.error('提交表单失败:', error)
    AntMessage.error('保存失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style> 