import { message, Modal } from 'ant-design-vue'

/**
 * 从Element Plus迁移到Ant Design Vue的辅助函数
 * 用于替换项目中使用的ElMessage和ElMessageBox
 */

// 替代ElMessage
export const showMessage = {
  success: (content) => message.success(content),
  warning: (content) => message.warning(content),
  info: (content) => message.info(content),
  error: (content) => message.error(content)
}

// 替代ElMessageBox.confirm
export const confirmDialog = (content, title = '提示', options = {}) => {
  return new Promise((resolve, reject) => {
    Modal.confirm({
      title,
      content,
      okText: options.confirmButtonText || '确定',
      cancelText: options.cancelButtonText || '取消',
      onOk: () => resolve(true),
      onCancel: () => reject(new Error('取消操作'))
    })
  })
}

// 替代ElMessageBox.alert
export const alertDialog = (content, title = '提示', options = {}) => {
  return new Promise((resolve) => {
    Modal.info({
      title,
      content,
      okText: options.confirmButtonText || '确定',
      onOk: () => resolve()
    })
  })
}

/**
 * Element Plus和Ant Design Vue组件对照表
 * 
 * Element Plus      -> Ant Design Vue
 * el-button         -> a-button
 * el-form           -> a-form
 * el-form-item      -> a-form-item
 * el-input          -> a-input
 * el-input-password -> a-input-password
 * el-select         -> a-select
 * el-option         -> a-select-option
 * el-table          -> a-table
 * el-table-column   -> 通过columns属性定义
 * el-pagination     -> a-pagination
 * el-dialog         -> a-modal
 * el-card           -> a-card
 * el-menu           -> a-menu
 * el-menu-item      -> a-menu-item
 * el-tabs           -> a-tabs
 * el-tab-pane       -> a-tab-pane
 * el-date-picker    -> a-date-picker
 * el-time-picker    -> a-time-picker
 * el-upload         -> a-upload
 * el-image          -> a-image
 * el-badge          -> a-badge
 * el-tag            -> a-tag
 * el-switch         -> a-switch
 * el-avatar         -> a-avatar
 * el-radio          -> a-radio
 * el-checkbox       -> a-checkbox
 * el-input-number   -> a-input-number
 */ 