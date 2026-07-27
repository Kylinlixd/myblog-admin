# 管理后台列表动作一致性 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 统一动态、分类、标签、文件与评论列表的行内操作按钮。

**Architecture:** 使用现有全局 `admin-workspace.scss` 定义一个 CSS 契约，各页面只声明语义类，不创建新组件，不修改业务事件或确认逻辑。

**Tech Stack:** Vue 3、Ant Design Vue、SCSS、Vitest

---

### Task 1: 行内动作契约

**Files:**
- Modify: `src/styles/admin-workspace.scss`
- Create: `src/styles/__tests__/adminRowActions.spec.js`

- [ ] **Step 1: 写失败测试**

```js
expect(styles).toContain('.table-row-actions')
expect(styles).toContain('.row-action--primary')
expect(styles).toContain('.row-action--danger')
expect(styles).toContain('min-height: 30px')
```

- [ ] **Step 2: 验证失败**

Run: `npm test -- --run src/styles/__tests__/adminRowActions.spec.js`
Expected: FAIL，缺少语义样式。

- [ ] **Step 3: 实现样式**

`.table-row-actions` 使用 inline-flex、6px 间距和窄屏换行；`.row-action` 统一 30px 高度、8px 圆角、无重阴影；primary 为蓝色弱底，danger 为红色弱底，中性为灰色弱底，并为 focus-visible 提供轮廓。

- [ ] **Step 4: 测试并提交**

Run: `npm test -- --run src/styles/__tests__/adminRowActions.spec.js`
Expected: PASS

```bash
git add src/styles
git commit -m "style: define admin row action system"
```

### Task 2: 五个列表统一

**Files:**
- Modify: `src/views/dynamics/DynamicList.vue`
- Modify: `src/views/categories/CategoryList.vue`
- Modify: `src/views/tags/TagList.vue`
- Modify: `src/views/files/FileList.vue`
- Modify: `src/views/comments/CommentList.vue`
- Modify: `src/views/__tests__/adminFilterControls.spec.js`

- [ ] **Step 1: 扩展失败测试**

```js
listViews.forEach((view) => {
  expect(view).toContain('class="table-row-actions"')
  expect(view).toContain('class="row-action')
  expect(view).not.toContain('type="primary" danger size="small"')
})
```

- [ ] **Step 2: 验证失败**

Run: `npm test -- --run src/views/__tests__/adminFilterControls.spec.js`
Expected: FAIL，列表动作仍分叉。

- [ ] **Step 3: 更新按钮标记**

把操作容器统一为 `<a-space class="table-row-actions">`；编辑/审核使用 `row-action row-action--primary`，查看/下载/复制/拒绝使用 `row-action`，删除使用 `row-action row-action--danger`。所有按钮保留 `size="small"` 和原事件。

- [ ] **Step 4: 删除 TagList 局部重复样式**

移除其 scoped `.table-row-actions`，由全局契约唯一控制。

- [ ] **Step 5: 测试并提交**

Run: `npm test -- --run src/views/__tests__/adminFilterControls.spec.js src/styles/__tests__/adminRowActions.spec.js`
Expected: PASS

```bash
git add src/views src/styles
git commit -m "feat: unify admin list actions"
```

