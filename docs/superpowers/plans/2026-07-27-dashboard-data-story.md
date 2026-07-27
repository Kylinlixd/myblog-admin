# 管理后台仪表盘数据叙事 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用现有真实统计数据构建层级清晰的内容运营仪表盘。

**Architecture:** 保持单文件 `Dashboard.vue` 与现有 `/api/stats/` 请求；派生指标全部使用 computed。趋势、比例条和内容构成都使用原生 HTML/CSS，避免新增图表依赖。

**Tech Stack:** Vue 3、Ant Design Vue、SCSS、Vitest

---

### Task 1: 数据派生契约

**Files:**
- Modify: `src/views/Dashboard.vue`
- Modify: `src/views/dashboard/__tests__/DashboardTrendCard.spec.js`

- [ ] **Step 1: 写失败测试**

```js
expect(source).toContain('contentBreakdown')
expect(source).toContain('totalEntities')
expect(source).toContain('dashboard-spotlight')
expect(source).toContain('composition-panel')
expect(source).toContain('metric-progress')
```

- [ ] **Step 2: 验证失败**

Run: `npm test -- --run src/views/dashboard/__tests__/DashboardTrendCard.spec.js`
Expected: FAIL，缺少构成数据和新布局。

- [ ] **Step 3: 实现派生数据**

```js
const totalEntities = computed(() => statCards.value.reduce((sum, item) => sum + Number(item.value || 0), 0))
const contentBreakdown = computed(() => statCards.value.map((item) => ({
  ...item,
  share: totalEntities.value ? Math.round((Number(item.value || 0) / totalEntities.value) * 100) : 0
})))
```

每个 KPI 卡使用同一个 `share` 渲染比例条，不创建不存在的同比数据。

- [ ] **Step 4: 测试计算边界**

覆盖总量为零时 share 为 0、非零时四舍五入百分比。

### Task 2: 12 列仪表盘布局

**Files:**
- Modify: `src/views/Dashboard.vue`

- [ ] **Step 1: 实现概览带**

加入 `.dashboard-spotlight`，展示欢迎语、当天日期、内容实体总量和新建内容入口；保留错误提醒。

- [ ] **Step 2: 改造 KPI 卡**

每卡增加编号、比例条和“占全部内容实体 x%”，链接继续指向对应管理页。

- [ ] **Step 3: 改造主网格**

`.dashboard-grid` 使用 12 列；趋势面板跨 8 列，右侧跨 4 列并依次放置内容构成和快捷动作。1080px 以下改为单列，600px 以下压缩卡片和图表间距。

- [ ] **Step 4: 测试并提交**

Run: `npm test -- --run src/views/dashboard/__tests__/DashboardTrendCard.spec.js src/views/dashboard/__tests__/stats.spec.js`
Expected: PASS

```bash
git add src/views/Dashboard.vue src/views/dashboard/__tests__/DashboardTrendCard.spec.js
git commit -m "feat: redesign dashboard data story"
```

### Task 3: 总体验证与交付记录

**Files:**
- Modify: `docs/DELIVERY_2026-07-27.md`

- [ ] **Step 1: 运行完整检查**

Run: `npm run check`
Expected: all tests PASS and production build succeeds.

- [ ] **Step 2: 检查变更范围**

Run: `git diff --check && git status --short`
Expected: 无空白错误，只包含本次公共站、列表、仪表盘、测试和文档文件。

- [ ] **Step 3: 更新交付记录并提交**

记录三个节点、验证命令、构建结果和部署状态。

```bash
git add docs/DELIVERY_2026-07-27.md
git commit -m "docs: record visual redesign delivery"
```

