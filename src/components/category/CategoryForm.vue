<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑分类' : '创建分类'"
    width="500px"
    :before-close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="80px"
      @keyup.enter="submitForm"
    >
      <el-form-item label="名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入分类名称" />
      </el-form-item>
      
      <el-form-item label="描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="请输入分类描述"
        />
      </el-form-item>
    </el-form>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="loading" @click="submitForm">
          确定
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watchEffect, defineEmits, defineProps } from 'vue'
import { ElMessage } from 'element-plus'
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
      ElMessage.success('分类更新成功')
    } else {
      await createCategory(form)
      ElMessage.success('分类创建成功')
    }
    
    // 通知父组件成功
    emit('success')
    // 关闭对话框
    dialogVisible.value = false
  } catch (error) {
    console.error('提交表单失败:', error)
    ElMessage.error('保存失败，请重试')
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