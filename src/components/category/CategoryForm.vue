<template>
  <a-modal
    v-model:visible="dialogVisible"
    :title="isEdit ? '编辑分类' : '创建分类'"
    width="500px"
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
        <a-input v-model:value="form.name" placeholder="请输入分类名称" />
      </a-form-item>
      
      <a-form-item label="描述" name="description">
        <a-textarea
          v-model:value="form.description"
          :rows="3"
          placeholder="请输入分类描述"
        />
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
import { ref, reactive, watchEffect, defineEmits } from 'vue'
import { message } from 'ant-design-vue'
import { createCategory, updateCategory } from '../../api/category'

const props = defineProps({
  visible: Boolean,
  category: {
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
  name: '',
  description: ''
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
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

// 监听分类数据，用于编辑模式
watchEffect(() => {
  if (props.category && props.category.id) {
    isEdit.value = true
    Object.assign(form, props.category)
  } else {
    isEdit.value = false
    form.name = ''
    form.description = ''
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
      await updateCategory(props.category.id, form)
      message.success('分类更新成功')
    } else {
      await createCategory(form)
      message.success('分类创建成功')
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