# 夜蓝数字花园公共站 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将首页和所有公共博客页面统一为具有滚动叙事与动态环境背景的夜蓝数字花园。

**Architecture:** `BlogLayout.vue` 提供共享环境层和导航，`blog-cinematic.scss` 提供公共页面视觉契约，`BlogHome.vue` 承担高强度 GSAP 叙事。旧内页只调整容器类与局部冲突样式，避免改动数据请求。

**Tech Stack:** Vue 3、Vue Router、SCSS、GSAP ScrollTrigger、Vitest

---

### Task 1: 公共主题契约

**Files:**
- Create: `src/styles/blog-cinematic.scss`
- Modify: `src/styles/main.scss`
- Modify: `src/layouts/BlogLayout.vue`
- Create: `src/styles/__tests__/blogCinematic.spec.js`

- [ ] **Step 1: 写失败测试**

```js
expect(main).toContain("@use './blog-cinematic'")
expect(layout).toContain('class="blog-atmosphere"')
expect(styles).toContain('.cinematic-page')
expect(styles).toContain('prefers-reduced-motion: reduce')
```

- [ ] **Step 2: 验证失败**

Run: `npm test -- --run src/styles/__tests__/blogCinematic.spec.js`
Expected: FAIL，缺少共享样式和环境层。

- [ ] **Step 3: 实现共享环境层**

在 `BlogLayout.vue` 的 `.blog-shell` 内加入：

```vue
<div class="blog-atmosphere" aria-hidden="true">
  <span class="blog-atmosphere__orb blog-atmosphere__orb--one" />
  <span class="blog-atmosphere__orb blog-atmosphere__orb--two" />
  <span class="blog-atmosphere__grid" />
</div>
```

`blog-cinematic.scss` 定义全局夜蓝变量、`.cinematic-page`、`.cinematic-hero`、`.cinematic-card`、暗色 Ant Design 分页/输入组件及 reduced-motion 降级。

- [ ] **Step 4: 运行测试并提交**

Run: `npm test -- --run src/styles/__tests__/blogCinematic.spec.js`
Expected: PASS

```bash
git add src/styles src/layouts/BlogLayout.vue
git commit -m "feat: establish cinematic blog theme"
```

### Task 2: 首页 Hero 与滚动叙事

**Files:**
- Modify: `src/views/blog/BlogHome.vue`
- Modify: `src/views/blog/__tests__/BlogHomeExperience.spec.js`

- [ ] **Step 1: 扩展失败测试**

```js
expect(source).toContain('hero-title__line')
expect(source).toContain('manifesto-carousel')
expect(source).toContain('scrub-reveal')
expect(source).toContain('currentManifesto')
expect(source).toContain("scrub: true")
```

- [ ] **Step 2: 验证失败**

Run: `npm test -- --run src/views/blog/__tests__/BlogHomeExperience.spec.js`
Expected: FAIL，首页尚无新结构。

- [ ] **Step 3: 实现结构与状态**

把 Hero 标题拆成两行 span，增加三项真实创作原则数组和手动上一项/下一项控制；保留 12 列 Bento、横向手风琴和双倍标签跑马灯。

```js
const manifestoIndex = ref(0)
const manifestos = [
  { title: '从真实问题出发', body: '记录判断、取舍与修正，而不只展示最后答案。' },
  { title: '让知识彼此连接', body: '分类、标签与文章共同形成可继续探索的路径。' },
  { title: '持续构建与复盘', body: '把项目过程沉淀为下一次可复用的经验。' }
]
const currentManifesto = computed(() => manifestos[manifestoIndex.value])
```

- [ ] **Step 4: 实现 GSAP 动效**

使用现有 `gsap.context` 添加标题逐行入场、`.scrub-reveal span` 的 scrub 文字揭示，以及 `.hero-feature`、`.story-card__media` 的 scale/fade scroll。reduced-motion 分支保持提前返回。

- [ ] **Step 5: 测试并提交**

Run: `npm test -- --run src/views/blog/__tests__/BlogHomeExperience.spec.js`
Expected: PASS

```bash
git add src/views/blog/BlogHome.vue src/views/blog/__tests__/BlogHomeExperience.spec.js
git commit -m "feat: add cinematic homepage motion"
```

### Task 3: 公共内页统一

**Files:**
- Modify: `src/views/blog/BlogDynamic.vue`
- Modify: `src/views/blog/BlogCategories.vue`
- Modify: `src/views/blog/BlogCategoryDetail.vue`
- Modify: `src/views/blog/BlogTagDetail.vue`
- Modify: `src/views/blog/BlogSearch.vue`
- Modify: `src/views/blog/BlogAbout.vue`
- Modify: `src/views/blog/BlogDynamicDetail.vue`
- Create: `src/views/blog/__tests__/BlogCinematicPages.spec.js`

- [ ] **Step 1: 写页面契约失败测试**

```js
pages.forEach((source) => expect(source).toContain('cinematic-page'))
expect(dynamic).not.toContain('使用测试数据')
expect(dynamic).not.toContain('@click="useMockData"')
```

- [ ] **Step 2: 验证失败**

Run: `npm test -- --run src/views/blog/__tests__/BlogCinematicPages.spec.js`
Expected: FAIL，旧页面未接入主题契约。

- [ ] **Step 3: 接入共享类并删除调试入口**

为每个根容器加入 `cinematic-page`，页头加入 `cinematic-hero`，内容卡加入 `cinematic-card`；删除动态页“使用测试数据”按钮和 `useMockData` 函数，保留真实加载、刷新、分页和交互代码。

- [ ] **Step 4: 移除冲突浅色样式**

把白色页面背景、紫色浅渐变页头和黑色正文改为共享变量；保留页面专属布局与响应式规则。

- [ ] **Step 5: 回归测试并提交**

Run: `npm test -- --run src/views/blog/__tests__/BlogCinematicPages.spec.js src/views/blog/__tests__/BlogAbout.spec.js src/views/blog/__tests__/BlogDetailSecurity.spec.js`
Expected: PASS

```bash
git add src/views/blog
git commit -m "feat: unify public blog pages"
```

### Task 4: 公共站构建与视觉核验

**Files:**
- Modify: `docs/DELIVERY_2026-07-27.md`

- [ ] **Step 1: 运行完整检查**

Run: `npm run check`
Expected: unit tests and Vite build PASS

- [ ] **Step 2: 启动预览并检查桌面与移动端**

Run: `npm run dev -- --host 127.0.0.1`
Expected: `/blog`、`/blog/blogdynamic`、`/blog/categories`、`/blog/about` 无控制台错误和横向溢出。

- [ ] **Step 3: 记录节点并提交**

在交付文档记录主题、页面、动效、测试结果与提交号。

```bash
git add docs/DELIVERY_2026-07-27.md
git commit -m "docs: record cinematic blog delivery"
```

