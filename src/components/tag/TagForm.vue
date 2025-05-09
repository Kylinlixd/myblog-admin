<template>
  <a-modal
    v-model:open="dialogVisible"
    :title="isEdit ? '编辑标签' : '创建标签'"
    :footer="null"
    width="600px"
    @cancel="handleClose"
  >
    <a-form
      ref="formRef"
      :model="form"
      :rules="rules"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 16 }"
      @keypress.enter="submitForm"
    >
      <a-form-item label="名称" name="name">
        <a-input v-model:value="form.name" placeholder="请输入标签名称" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup>
import { ref, reactive, watchEffect, defineEmits } from 'vue'
import { message } from 'ant-design-vue'
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
      message.success('标签更新成功')
    } else {
      await createTag(form)
      message.success('标签创建成功')
    }
    
    // 通知父组件成功
    emit('success')
    // 关闭对话框
    dialogVisible.value = false
  } catch (error) {
    console.error('提交表单失败:', error)
    message.error('保存失败，请重试')
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