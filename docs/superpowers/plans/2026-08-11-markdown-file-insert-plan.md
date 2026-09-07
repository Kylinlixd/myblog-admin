# Markdown 文件快速插入 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在动态编辑页中支持将已选择的图片、音频、视频按当前光标位置快速插入 Markdown，同时保留仅关联媒体文件的操作。

**Architecture:** `MarkdownEditor` 仅封装 `md-editor-v3` 的光标插入 API，向父组件暴露 `insertContent` 和 `focus` 能力，并通过 `update:modelValue` 同步内容。`DynamicEdit` 保留现有文件关联逻辑，新增一个生成媒体引用和调用编辑器插入的处理函数；选择器底部提供两个互不混淆的动作。

**Tech Stack:** Vue 3 `<script setup>`、`md-editor-v3@5.6.1`、Ant Design Vue、Jest/Vue Test Utils、Vite。

---

### Task 1: 为文件插入行为补充失败测试

**Files:**
- Modify: `src/views/dynamics/__tests__/DynamicEditFileSelector.spec.js`
- Test: `src/views/dynamics/__tests__/DynamicEditFileSelector.spec.js`

- [ ] **Step 1: 扩展 MarkdownEditor mock，暴露可断言的插入方法**

将当前空组件 mock 改为暴露 `insertContent`、`focus` 两个 jest mock，并保留 `v-model` 不参与本测试的简单 stub。

- [ ] **Step 2: 写图片插入的失败测试**

挂载动态编辑页，设置一张图片为 `selectedFiles`，设置编辑器引用为 mock，调用待实现的 `handleFileInsert`。断言编辑器收到 `![cover.png](/media/cover.png)`，媒体 URL 和文件 ID 正确更新，选择器关闭且选中项清空。

- [ ] **Step 3: 写音视频格式和多图顺序的失败测试**

分别断言音频生成 `<audio controls src="/media/audio.mp3"></audio>`、视频生成 `<video controls src="/media/demo.mp4"></video>`；多张图片按 `selectedFiles` 顺序生成两行引用，中间有一个空行。

- [ ] **Step 4: 写“仅关联媒体不修改正文”的回归测试**

保留现有 `handleFileConfirm` 测试，并增加正文初始值断言，确保调用旧确认流程不会调用 `insertContent` 或改变 `form.content`。

- [ ] **Step 5: 运行测试确认按预期失败**

Run: `npm test -- --runInBand src/views/dynamics/__tests__/DynamicEditFileSelector.spec.js`

Expected: 新增测试因 `handleFileInsert` 尚未实现而失败，现有文件选择测试保持通过。

### Task 2: 封装 Markdown 编辑器的光标插入能力

**Files:**
- Modify: `src/components/MarkdownEditor.vue`
- Test: `src/components/__tests__/MarkdownEditor.spec.js`（若现有文件不存在则创建）

- [ ] **Step 1: 写编辑器插入能力的失败测试**

使用 mock 的 `md-editor` 组件暴露 `insert` 和 `focus` 方法，调用 `wrapper.vm.insertContent('![图片](/media/a.png)')`，断言 `insert` 被调用、父组件收到更新后的值，再调用 `wrapper.vm.focus()` 断言转发焦点。

- [ ] **Step 2: 运行组件测试确认失败**

Run: `npm test -- --runInBand src/components/__tests__/MarkdownEditor.spec.js`

Expected: `insertContent` 和 `focus` 尚未暴露导致失败。

- [ ] **Step 3: 实现最小编辑器转发**

给 `<md-editor>` 增加组件 ref；通过 `md-editor-v3` 的 `insert` API 在当前选区插入字符串，并通过 `handleChange`/`update:modelValue` 保持父子内容同步；暴露 `insertContent` 和 `focus`。保留已有 `setContent` 行为，避免影响编辑详情回填。

- [ ] **Step 4: 运行组件测试确认通过**

Run: `npm test -- --runInBand src/components/__tests__/MarkdownEditor.spec.js`

Expected: PASS。

### Task 3: 增加文件选择器双动作和媒体引用生成

**Files:**
- Modify: `src/views/dynamics/DynamicEdit.vue`
- Test: `src/views/dynamics/__tests__/DynamicEditFileSelector.spec.js`

- [ ] **Step 1: 修改选择器底部按钮文案和事件**

保留取消按钮，将现有“确定”改为“仅关联媒体”，新增主按钮“插入正文”，两个按钮都复用已选择文件的类型校验和媒体关联更新。

- [ ] **Step 2: 提取公共媒体关联逻辑**

从 `handleFileConfirm` 抽出最小的 `applySelectedFiles`，统一更新 `fileList`、`form.mediaUrls`、`form.fileIds`，并保留原有刷新文件列表和表单验证行为。

- [ ] **Step 3: 实现引用生成**

新增 `buildMarkdownMediaReference(file)`：图片返回 `![${file.name}](${file.url})`，音频和视频分别返回对应的 HTML 标签。新增 `handleFileInsert`：校验选择、应用媒体关联、拼接多文件引用、调用 `markdownEditorRef.insertContent`、关闭选择器、清空选中项并调用 `markdownEditorRef.focus`。

- [ ] **Step 4: 运行动态编辑测试确认通过**

Run: `npm test -- --runInBand src/views/dynamics/__tests__/DynamicEditFileSelector.spec.js`

Expected: 新增插入测试和现有文件选择测试全部 PASS。

### Task 4: 全量验证并提交

**Files:**
- Verify: `src/components/MarkdownEditor.vue`
- Verify: `src/views/dynamics/DynamicEdit.vue`
- Verify: `src/components/__tests__/MarkdownEditor.spec.js`
- Verify: `src/views/dynamics/__tests__/DynamicEditFileSelector.spec.js`

- [ ] **Step 1: 检查差异和格式**

Run: `git diff --check`

Expected: 无输出且退出码为 0。

- [ ] **Step 2: 运行全量测试**

Run: `npm test -- --runInBand`

Expected: 所有测试通过。

- [ ] **Step 3: 运行生产构建**

Run: `npm run build`

Expected: 构建成功，仅允许已有的 Browserslist 数据过期提示。

- [ ] **Step 4: 提交中文 commit**

```bash
git add src/components/MarkdownEditor.vue src/components/__tests__/MarkdownEditor.spec.js src/views/dynamics/DynamicEdit.vue src/views/dynamics/__tests__/DynamicEditFileSelector.spec.js
git commit -m "功能：支持文件快速插入Markdown正文"
```
