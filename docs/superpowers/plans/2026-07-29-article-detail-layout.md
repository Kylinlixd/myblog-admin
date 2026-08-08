# 文章详情页排版优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将文章详情页重构为温暖编辑型阅读布局，并加入桌面目录、移动端折叠目录和阅读进度。

**Architecture:** 保留现有 API、Markdown 渲染与评论逻辑，在 `BlogDynamicDetail.vue` 增加展示层计算（标题目录、阅读时长、进度），样式集中在该页面的 scoped style 中，避免影响其他博客页面。目录由 Markdown 标题生成安全锚点，滚动监听只更新轻量进度状态。

**Tech Stack:** Vue 3 `<script setup>`、Vue Router、dayjs、MarkdownIt、SCSS、Jest。

---

### Task 1: 建立文章详情排版回归测试

**Files:**
- Create: `src/views/blog/__tests__/BlogDynamicDetailLayout.spec.js`
- Test: `src/views/blog/__tests__/BlogDynamicDetailLayout.spec.js`

- [ ] **Step 1: Write failing source assertions**

```js
import fs from 'node:fs'
import path from 'node:path'

const source = fs.readFileSync(
  path.join(process.cwd(), 'src/views/blog/BlogDynamicDetail.vue'),
  'utf8'
)

test('文章详情包含编辑型头部元信息与阅读结构', () => {
  expect(source).toContain('article-reading-shell')
  expect(source).toContain('reading-progress')
  expect(source).toContain('阅读时长')
})

test('文章详情包含目录与移动端折叠入口', () => {
  expect(source).toContain('article-toc')
  expect(source).toContain('目录')
  expect(source).toContain('tocOpen')
})

test('文章详情包含移动端和 reduced motion 规则', () => {
  expect(source).toContain('@media (max-width: 768px)')
  expect(source).toContain('prefers-reduced-motion: reduce')
})
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- --runInBand src/views/blog/__tests__/BlogDynamicDetailLayout.spec.js`

Expected: FAIL because the new layout hooks are not yet in `BlogDynamicDetail.vue`.

### Task 2: Implement article detail structure and behavior

**Files:**
- Modify: `src/views/blog/BlogDynamicDetail.vue`

- [ ] **Step 1: Add layout structure**

Wrap the current detail content in `.article-reading-shell`, add a `.reading-progress` bar, split the article into `.article-main-column` and `.article-side-column`, and keep the existing comment section below the article. Add a mobile `a-collapse` directory trigger and desktop directory list.

- [ ] **Step 2: Add computed article metadata**

Add `computed`, `nextTick`, and `onBeforeUnmount` imports. Add `tocOpen`, `readingProgress`, and `tocItems` refs. Derive `readingMinutes` from content length using `Math.max(1, Math.ceil(String(dynamic.value?.content || '').replace(/\\s+/g, '').length / 450))`. Build `tocItems` from rendered `h2`/`h3` nodes after `dynamic` loads, assigning `article-heading-${index}` IDs and preserving text.

- [ ] **Step 3: Add scroll behavior**

Add a passive scroll handler that computes progress from the article body bounding rectangle and sets `readingProgress` between 0 and 100. Add `scrollToHeading(id)` that calls `document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })`, then closes the mobile directory. Register and unregister the listener with `onMounted`/`onBeforeUnmount`.

- [ ] **Step 4: Keep existing API behavior intact**

Do not change `fetchDynamicDetail`, `increaseDynamicView`, comment submission, comment pagination, or Markdown sanitization behavior except to call the new metadata setup after the dynamic response is assigned.

- [ ] **Step 5: Run focused tests**

Run: `npm test -- --runInBand src/views/blog/__tests__/BlogDynamicDetailLayout.spec.js src/views/blog/__tests__/BlogDetailSecurity.spec.js`

Expected: PASS.

### Task 3: Add responsive reading styles

**Files:**
- Modify: `src/views/blog/BlogDynamicDetail.vue`

- [ ] **Step 1: Style desktop reading shell**

Use a warm ivory surface, max-width `1180px`, a `minmax(0, 760px) 220px` grid, sticky side column, 68–78 character line length, dark text, and clear heading/paragraph rhythm. Give code blocks horizontal scrolling and media `max-width: 100%`.

- [ ] **Step 2: Style metadata and interaction states**

Style category eyebrow, title, summary, meta chips, tags, progress bar, active TOC item, comments card, focus states, and hover states using existing CSS variables where available.

- [ ] **Step 3: Style mobile layout**

At `max-width: 768px`, switch to one column, hide the desktop side column, show the mobile directory trigger, reduce title size, stack metadata, set `overflow-wrap:anywhere`, and make comment form controls full width. Ensure no horizontal page overflow.

- [ ] **Step 4: Add reduced motion fallback**

Under `@media (prefers-reduced-motion: reduce)`, disable shell entrance animation and set scroll behavior to `auto`.

- [ ] **Step 5: Run focused and full tests**

Run: `npm test -- --runInBand src/views/blog/__tests__/BlogDynamicDetailLayout.spec.js src/views/blog/__tests__/BlogCinematicPages.spec.js src/views/blog/__tests__/BlogDetailSecurity.spec.js`

Expected: PASS.

### Task 4: Build, verify, document, and publish

**Files:**
- Modify: `docs/DELIVERY_2026-07-27.md`

- [ ] **Step 1: Run full frontend tests and production build**

Run: `npm test -- --runInBand` and `npm run build`.

Expected: all test suites pass and Vite exits successfully.

- [ ] **Step 2: Append delivery node**

Record the layout changes, test counts, commit SHA, production release path, and public HTTP health checks in `docs/DELIVERY_2026-07-27.md`.

- [ ] **Step 3: Commit and push**

```bash
git add src/views/blog/BlogDynamicDetail.vue src/views/blog/__tests__/BlogDynamicDetailLayout.spec.js docs/DELIVERY_2026-07-27.md
git commit -m "feat: redesign article detail reading layout"
git push origin main
```

- [ ] **Step 4: Deploy and verify**

Package `dist`, upload to the server, switch `/var/www/myblog-admin/current`, reload nginx, verify `blog-li`, `nginx`, and `blog-li-access-log-cleanup.timer`, then check `https://leexd.top/` and `https://leexd.top/blog/dynamics/<id>` return HTTP 200.
