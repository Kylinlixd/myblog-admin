# 首页间距与主题卡片层次 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 拉开首页理念区的文字节奏，并让主题卡片拥有可辨识的视觉差异，同时保持数据、路由和移动端布局稳定。

**Architecture:** 继续在 `BlogHome.vue` 内完成展示层调整。模板只增加卡片编号和装饰节点，样式使用现有 `--topic-index` 为不同卡片提供暖色变体；桌面端采用轻微错落，移动端覆盖为单列无偏移。现有 GSAP 动画和 reduced-motion 逻辑不变。

**Tech Stack:** Vue 3、Scoped CSS、GSAP/ScrollTrigger、Jest 源码回归测试、Vite。

---

### Task 1: 为视觉结构补充回归测试

**Files:**
- Modify: `src/views/blog/__tests__/BlogHomeExperience.spec.js`

- [ ] **Step 1: 写理念区间距的失败断言**

增加断言，要求源码包含 `.scrub-reveal` 的舒展行距和 `.signal-meta` 与主标题之间的留白规则，例如 `line-height: 1.02`、`margin-bottom: clamp(84px`。

- [ ] **Step 2: 写主题卡片结构的失败断言**

增加断言，要求主题卡片模板包含 `topic-accordion__index` 和 `topic-accordion__decoration` 两个装饰节点，并包含桌面网格、卡片描述默认可读、移动端单列覆盖等 CSS 规则。

- [ ] **Step 3: 运行首页测试确认失败**

Run: `npm test -- --runInBand src/views/blog/__tests__/BlogHomeExperience.spec.js`

Expected: 新增断言失败，现有首页行为断言通过。

### Task 2: 实现理念区间距和主题卡片层次

**Files:**
- Modify: `src/views/blog/BlogHome.vue`
- Test: `src/views/blog/__tests__/BlogHomeExperience.spec.js`

- [ ] **Step 1: 增加主题卡片的语义装饰节点**

在现有分类 `router-link` 内增加：

```vue
<small class="topic-accordion__index">0{{ index + 1 }}</small>
<i class="topic-accordion__decoration" aria-hidden="true" />
<div class="topic-accordion__copy">
  <span>{{ item.name }}</span>
  <p>{{ item.description || '沿着这个主题继续阅读。' }}</p>
</div>
```

保留原有分类链接、`--topic-index` 和文案，不新增数据请求。

- [ ] **Step 2: 调整理念区的垂直节奏**

将 `.signal-meta` 的下边距调整为 `clamp(84px, 9vh, 124px)`，将 `.scrub-reveal` 行高调整为 `1.02`，并使用 `gap: clamp(6px, 1vw, 16px)` 让三行标题间有明确呼吸感。移动端保留更紧凑但不粘连的行距与间距。

- [ ] **Step 3: 将主题卡片改为有差异的编辑式网格**

桌面端使用四列 CSS Grid、`gap: 14px` 和不同卡片顶部偏移；卡片通过 `nth-child` 设置不同暖色光晕、几何装饰和高度感。编号放在顶部，标题/描述固定在底部，描述默认可读但弱对比，悬停和键盘聚焦时增强。

- [ ] **Step 4: 添加移动端覆盖规则**

在 `max-width: 640px` 下将主题卡片恢复为单列、取消顶部偏移、统一最小高度和间距；装饰节点降低尺寸与透明度，保证内容不被遮挡。

- [ ] **Step 5: 运行首页测试确认通过**

Run: `npm test -- --runInBand src/views/blog/__tests__/BlogHomeExperience.spec.js`

Expected: 首页测试全部 PASS。

### Task 3: 全量验证并提交

**Files:**
- Verify: `src/views/blog/BlogHome.vue`
- Verify: `src/views/blog/__tests__/BlogHomeExperience.spec.js`

- [ ] **Step 1: 检查差异**

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
git add src/views/blog/BlogHome.vue src/views/blog/__tests__/BlogHomeExperience.spec.js
git commit -m "优化：首页理念区间距与主题卡片层次"
```
