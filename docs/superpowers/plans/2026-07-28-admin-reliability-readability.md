# Admin Reliability and Readability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复管理后台误退出问题，重构宽屏仪表盘，并提升博客文章、评论与全局加载提示的可读性。

**Architecture:** 认证只由 Pinia 会话仓库与共享 HTTP 客户端负责，动态编辑和上传不再自行读取 token。仪表盘继续消费现有统计接口，通过纯映射函数生成安全数据；公共博客用独立阅读颜色与文章排版覆盖摘要级弱文本规则。

**Tech Stack:** Vue 3、Pinia、Axios、Ant Design Vue、SCSS、Jest、Vue CLI

---

### Task 1: 固化认证与上传回归

**Files:**
- Modify: `src/stores/__tests__/user.spec.js`
- Modify: `src/__tests__/interactionFeedback.spec.js`
- Create: `src/utils/__tests__/upload.spec.js`
- Modify: `src/views/dynamics/__tests__/dynamicPreviewWorkflow.spec.js`

- [ ] **Step 1: 为临时故障保留会话、401 清理会话写失败测试**

在用户仓库测试中 mock `getUserInfo`，分别抛出 `{ status: 500 }` 与 `{ status: 401 }`，断言前者仍保留 `blog.accessToken`，后者清除会话。

- [ ] **Step 2: 为认证过期事件与旧 token 读取写失败测试**

断言 `main.js` 的 `auth:expired` 处理调用 `useUserStore().clearUserData()`；断言动态编辑页和上传工具不包含 `localStorage.getItem('accessToken')`，上传工具不再导入 Axios。

- [ ] **Step 3: 运行定向测试并确认失败**

Run: `npm test -- --runInBand src/stores/__tests__/user.spec.js src/__tests__/interactionFeedback.spec.js src/utils/__tests__/upload.spec.js src/views/dynamics/__tests__/dynamicPreviewWorkflow.spec.js`

Expected: FAIL，指出 500 错误会清理会话、事件未清 Pinia、旧 token 仍存在。

### Task 2: 收口认证边界并删除重复上传实现

**Files:**
- Modify: `src/stores/user.js`
- Modify: `src/main.js`
- Modify: `src/utils/upload.js`
- Modify: `src/views/dynamics/DynamicEdit.vue`

- [ ] **Step 1: 只在 401 初始化失败时清理会话**

将 `initialize()` 的 catch 改为接收 `error`，仅在 `error?.status === 401` 时执行 `clearUserData()`；无论结果如何都完成初始化。

- [ ] **Step 2: 认证过期时同步清理 Pinia**

在 `auth:expired` 监听器开头调用 `useUserStore().clearUserData()`，再按当前受保护路由跳转登录页。

- [ ] **Step 3: 用现有文件 API 替换重复上传客户端**

`src/utils/upload.js` 只保留文件校验与以下薄封装：

```js
import { message } from 'ant-design-vue'
import { uploadFile as uploadFileRequest } from '@/api/file'

export const uploadFile = (file, type) => {
  if (!file || !(file instanceof File)) throw new Error('无效的文件对象')
  return uploadFileRequest({ file, file_type: type })
}
```

保留 `uploadImage`、`uploadAudio`、`uploadVideo`、`checkFileSize` 与 `checkFileType` 的现有公开签名。

- [ ] **Step 4: 删除动态保存前的手动 token 守卫**

删除 `DynamicEdit.vue` 中读取 `accessToken`、提示过期和跳转登录的代码，让共享请求层处理真正的 401。

- [ ] **Step 5: 运行认证定向测试并确认通过**

Run: `npm test -- --runInBand src/stores/__tests__/user.spec.js src/__tests__/interactionFeedback.spec.js src/utils/__tests__/upload.spec.js src/views/dynamics/__tests__/dynamicPreviewWorkflow.spec.js`

Expected: PASS。

- [ ] **Step 6: 提交可靠性修复**

```bash
git add src/stores/user.js src/main.js src/utils/upload.js src/views/dynamics/DynamicEdit.vue src/stores/__tests__/user.spec.js src/__tests__/interactionFeedback.spec.js src/utils/__tests__/upload.spec.js src/views/dynamics/__tests__/dynamicPreviewWorkflow.spec.js
git commit -m "fix: preserve admin session across content publishing"
```

### Task 3: 建立仪表盘安全数据模型

**Files:**
- Modify: `src/views/dashboard/stats.js`
- Modify: `src/views/dashboard/__tests__/stats.spec.js`

- [ ] **Step 1: 为趋势与内容脉络映射写失败测试**

新增 `mapDashboardData(response)` 测试，验证 `total`、`daily`、`categories`、`tags` 均转为安全数字，缺失响应返回空数组，分类和标签限制为前五项。

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm test -- --runInBand src/views/dashboard/__tests__/stats.spec.js`

Expected: FAIL，`mapDashboardData` 尚未导出。

- [ ] **Step 3: 实现最小映射函数**

复用 `mapDashboardStats`，增加 `mapSeries(items, limit)`，输出 `{ name, count }`；增加 `mapDashboardData` 返回 `{ total, daily, categories, tags }`，不生成虚构增长数据。

- [ ] **Step 4: 运行测试并确认通过**

Run: `npm test -- --runInBand src/views/dashboard/__tests__/stats.spec.js`

Expected: PASS。

### Task 4: 重构宽屏内容运营台

**Files:**
- Modify: `src/views/Dashboard.vue`
- Modify: `src/views/dashboard/__tests__/DashboardTrendCard.spec.js`

- [ ] **Step 1: 更新结构测试**

断言页面包含 `metric-rail`、`operations-grid`、`content-pulse`、`taxonomy-list`、`trend-chart` 与真实 `categories`/`tags` 数据引用；断言不再存在四套卡片内联颜色。

- [ ] **Step 2: 运行结构测试并确认失败**

Run: `npm test -- --runInBand src/views/dashboard/__tests__/DashboardTrendCard.spec.js`

Expected: FAIL，新的运营台结构尚未存在。

- [ ] **Step 3: 重写模板与数据绑定**

顶部保留日期、管理员称呼、内容总量和新建动作；四项总量进入连续指标带；七日趋势为主画布；分类/标签数据进入内容脉络；快捷动作改为紧凑文本行；加载、错误和独立空状态完整保留。

- [ ] **Step 4: 完成宽屏和响应式样式**

页面最大宽度约 1600px；`operations-grid` 在桌面使用 `minmax(0, 9fr) minmax(300px, 3fr)`，1180px 以下堆叠，640px 以下单列。统一夜蓝强调色、等宽数字、44px 触控高度，并给 Edge/Chromium 提供不透明背景回退。

- [ ] **Step 5: 运行仪表盘测试并提交**

Run: `npm test -- --runInBand src/views/dashboard/__tests__/stats.spec.js src/views/dashboard/__tests__/DashboardTrendCard.spec.js`

Expected: PASS。

```bash
git add src/views/Dashboard.vue src/views/dashboard/stats.js src/views/dashboard/__tests__/stats.spec.js src/views/dashboard/__tests__/DashboardTrendCard.spec.js
git commit -m "feat: rebuild admin dashboard for wide screens"
```

### Task 5: 提升文章与评论可读性

**Files:**
- Modify: `src/styles/global.scss`
- Modify: `src/styles/blog-cinematic.scss`
- Modify: `src/views/blog/BlogDynamicDetail.vue`
- Modify: `src/views/blog/BlogDynamic.vue`
- Modify: `src/views/blog/__tests__/BlogCinematicPages.spec.js`
- Modify: `src/views/blog/__tests__/BlogDetailSecurity.spec.js`

- [ ] **Step 1: 为阅读排版和评论对比度写失败测试**

断言博客主题包含 `--blog-reading-text` 与 `--blog-comment-text`；详情页包含 `reading-frame`、`font-size: 18px`、`line-height: 1.9`，并且评论标签、输入占位符和 `.comment-content` 使用独立颜色；断言重复的 `if (!content) return ''` 只保留一次。

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm test -- --runInBand src/views/blog/__tests__/BlogCinematicPages.spec.js src/views/blog/__tests__/BlogDetailSecurity.spec.js`

Expected: FAIL，阅读变量和新结构尚不存在。

- [ ] **Step 3: 拆分摘要色、阅读色与评论色**

在博客主题增加高对比阅读变量，限制弱文本规则只影响摘要元信息；表单标签、输入值、占位符和字数提示使用明确色阶。

- [ ] **Step 4: 重排文章详情**

为正文增加 `reading-frame`，宽度使用 `var(--reading-width)`，正文 18px/1.9，段落间距 1.35em；改善标题、列表、链接、引用、表格、代码块与图片节奏。评论区改为阅读区之后的独立讨论面板，并清理重复的 markdown 空判断。

- [ ] **Step 5: 同步动态列表评论可读性**

将动态流的评论样式与详情页共享相同的主题变量，同时保持列表摘要字号更紧凑。

- [ ] **Step 6: 运行博客测试并提交**

Run: `npm test -- --runInBand src/views/blog/__tests__/BlogCinematicPages.spec.js src/views/blog/__tests__/BlogDetailSecurity.spec.js`

Expected: PASS。

```bash
git add src/styles/global.scss src/styles/blog-cinematic.scss src/views/blog/BlogDynamic.vue src/views/blog/BlogDynamicDetail.vue src/views/blog/__tests__/BlogCinematicPages.spec.js src/views/blog/__tests__/BlogDetailSecurity.spec.js
git commit -m "style: improve article and comment readability"
```

### Task 6: 美化全局加载反馈

**Files:**
- Modify: `src/App.vue`
- Modify: `src/__tests__/interactionFeedback.spec.js`

- [ ] **Step 1: 写加载提示结构与降动效失败测试**

断言加载提示包含状态点、`loadingText`、进入离开 transition、移动端安全区和 `prefers-reduced-motion` 规则。

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm test -- --runInBand src/__tests__/interactionFeedback.spec.js`

Expected: FAIL，新的 `loading-toast` 结构尚不存在。

- [ ] **Step 3: 实现轻量加载浮层**

将右下角提示改成 `loading-toast`：双层状态点、清晰文案、短距离浮入；桌面距边 24px，移动端使用 `max(14px, env(safe-area-inset-bottom))`，降动效时关闭旋转和位移。

- [ ] **Step 4: 运行测试并提交**

Run: `npm test -- --runInBand src/__tests__/interactionFeedback.spec.js`

Expected: PASS。

```bash
git add src/App.vue src/__tests__/interactionFeedback.spec.js
git commit -m "style: refine global loading feedback"
```

### Task 7: 全量验证、视觉回归与交付

**Files:**
- Modify: `docs/DELIVERY_2026-07-27.md`

- [ ] **Step 1: 运行完整自动化验证**

Run: `npm run test:ci && npm run build`

Expected: 所有 Jest 测试通过，生产构建成功，无新增警告或错误。

- [ ] **Step 2: Chromium/Edge 视觉回归**

启动本地前端，分别检查 1920×1080、1440×900、390×844：后台仪表盘无横向溢出；动态发布不误跳登录；文章正文与评论清楚；加载浮层不遮挡核心按钮。Edge 使用 Chromium 内核，因此以 Chromium 自动化结果作为布局兼容基线，并在实际 Edge 可用时补充人工打开验证。

- [ ] **Step 3: 更新交付记录**

记录认证根因、删除的重复逻辑、仪表盘重构、阅读/评论对比度、加载反馈、测试结果与生产发布 SHA。

- [ ] **Step 4: 提交、推送并发布**

```bash
git add docs/DELIVERY_2026-07-27.md
git commit -m "docs: record admin reliability release"
git push origin main
```

使用现有不可变 release 目录部署构建产物，切换 `current` 软链接后检查 Nginx、API 与 `https://leexd.top`。
