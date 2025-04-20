# Element Plus 到 Ant Design Vue 的迁移计划

## 背景

项目当前同时使用了 Element Plus 和 Ant Design Vue 两套UI组件库，为了保持统一的设计风格和减少维护成本，决定移除所有 Element Plus 组件，全面迁移到 Ant Design Vue。

## 已完成的迁移工作

1. 配置文件调整
   - 更新了 vite.config.js 中的依赖配置，将 Element Plus 替换为 Ant Design Vue
   - 修改了主题配置，支持 Ant Design Vue 的明暗主题切换

2. 工具类修改
   - 创建了 migrateHelpers.js 工具类，提供 Element Plus 到 Ant Design Vue 的消息组件转换
   - 修改了 request.js、blogRequest.js 和 upload.js 中的消息提示组件

3. 示例页面迁移
   - 完成了 TagList.vue 页面从 Element Plus 到 Ant Design Vue 的组件迁移

## 待完成的迁移工作

以下是按优先级排列的剩余迁移任务：

### 1. 基础组件迁移

需要迁移的主要组件对照表：
| Element Plus | Ant Design Vue |
|--------------|----------------|
| el-button    | a-button       |
| el-form      | a-form         |
| el-input     | a-input        |
| el-select    | a-select       |
| el-table     | a-table        |
| el-dialog    | a-modal        |
| el-card      | a-card         |
| el-menu      | a-menu         |
| el-tabs      | a-tabs         |
| el-upload    | a-upload       |
| el-image     | a-image        |
| el-pagination| a-pagination   |

### 2. 按模块迁移顺序

1. 公共组件
   - 先迁移 src/components 目录下的公共组件
   - 特别关注 DataTable、Pagination、PageHeader 等重用频率高的组件

2. 页面迁移
   - 按照页面访问频率由高到低进行迁移
   - Dashboard -> 博客管理 -> 标签/分类管理 -> 用户管理 -> 设置

3. 布局迁移
   - DefaultLayout.vue
   - BlogLayout.vue

### 3. API 适配差异处理

1. 表单处理
   - Element Plus: v-model="form.name"
   - Ant Design Vue: v-model:value="form.name"

2. 事件处理
   - Element Plus: @current-change, @size-change
   - Ant Design Vue: @change, @showSizeChange

3. 校验规则
   - Element Plus: { required: true, message: '必填', trigger: 'blur' }
   - Ant Design Vue: 将规则放入 name 属性而非 prop 属性

4. 图标系统
   - 从 @element-plus/icons-vue 迁移到 @ant-design/icons-vue

### 4. 样式处理

1. 全局样式迁移
   - 移除 Element Plus 的样式引用
   - 确保 Ant Design Vue 的样式正确引入

2. 自定义主题
   - 调整暗黑模式配置
   - 调整品牌色和主题变量

## 迁移后的测试计划

1. 功能测试
   - 验证每个页面的基本功能
   - 确保表单提交、数据加载等关键操作正常

2. 用户体验测试
   - 检查交互一致性
   - 验证响应式布局
   - 确保无样式错误

3. 性能测试
   - 页面加载速度
   - 组件渲染效率

## 注意事项

1. 渐进式迁移
   - 按模块迁移，确保每个模块迁移后功能正常再进行下一个
   - 优先迁移高频使用页面

2. 保持一致性
   - 迁移过程中保持组件使用风格一致
   - 统一处理消息提示、确认框等交互方式

3. 文档更新
   - 更新组件使用文档
   - 提供新的设计规范参考 