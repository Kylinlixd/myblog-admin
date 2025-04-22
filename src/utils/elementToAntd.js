/**
 * Element Plus 到 Ant Design Vue 的适配层
 * 用于在迁移过程中保持API兼容性
 */

import { message, Modal, notification } from 'ant-design-vue';

// 消息提示适配
export const ElMessage = {
  success: (content) => message.success(content),
  warning: (content) => message.warning(content),
  info: (content) => message.info(content),
  error: (content) => message.error(content)
};

// 确认框适配
export const ElMessageBox = {
  confirm: (content, title, options = {}) => {
    return new Promise((resolve, reject) => {
      Modal.confirm({
        title: title || '确认',
        content,
        okText: options.confirmButtonText || '确定',
        cancelText: options.cancelButtonText || '取消',
        onOk: () => resolve(),
        onCancel: () => reject(new Error('取消'))
      });
    });
  },
  alert: (content, title, options = {}) => {
    return new Promise((resolve) => {
      Modal.info({
        title: title || '提示',
        content,
        okText: options.confirmButtonText || '确定',
        onOk: () => resolve()
      });
    });
  }
};

// 通知适配
export const ElNotification = {
  success: (options) => notification.success(options),
  warning: (options) => notification.warning(options),
  info: (options) => notification.info(options),
  error: (options) => notification.error(options)
};

// 骨架屏适配组件
export const ElSkeleton = {
  name: 'ElSkeleton',
  render() {
    return <a-skeleton active />;
  }
};

export const ElSkeletonItem = {
  name: 'ElSkeletonItem',
  render() {
    return <a-skeleton-element />;
  }
};

// Element Plus 图标适配
// 这里只添加了DynamicPreview中用到的Close图标
export const ElementPlusIconsVue = {
  Close: {
    name: 'Close',
    render() {
      return <CloseOutlined />;
    }
  }
};

// 从Ant Design导入实际需要使用的图标
import { CloseOutlined } from '@ant-design/icons-vue'; 