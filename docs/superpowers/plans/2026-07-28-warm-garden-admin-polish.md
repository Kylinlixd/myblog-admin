# Warm Garden and Admin Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve admin navigation, dashboard analytics, and comment operations while rebuilding the public blog as a bright warm-technology experience.

**Architecture:** Keep existing Vue and API boundaries. Extend the shared data table with controlled row selection, keep comment orchestration in its page, render dashboard data through native responsive SVG, and replace the public shell tokens so all pages inherit one light visual contract. Homepage motion remains locally scoped through the existing GSAP context.

**Tech Stack:** Vue 3, Vue Router, Ant Design Vue, GSAP/ScrollTrigger, SCSS, Jest, Testing Library, Vite

---

### Task 1: Sidebar-integrated collapse control

**Files:**
- Modify: `src/layouts/DefaultLayout.vue`
- Test: `src/layouts/__tests__/DefaultLayoutCollapse.spec.js`

- [ ] **Step 1: Write the failing placement test**

```js
expect(source).toContain('sidebar-collapse-control')
expect(sidebarMarkup).toContain('@click="toggleSidebar"')
expect(headerMarkup).not.toContain('折叠导航')
expect(headerMarkup).toContain('打开导航')
```

- [ ] **Step 2: Run the focused test and confirm it fails because the desktop control is still in the header**

Run: `npm test -- src/layouts/__tests__/DefaultLayoutCollapse.spec.js --runInBand`

- [ ] **Step 3: Move the desktop button into the sidebar edge**

Render a `sidebar-collapse-control` button inside the desktop sider, keep the mobile menu button in `.workspace-header`, and style the desktop button at the sidebar's right edge with expanded/collapsed icon states and a visible focus ring.

- [ ] **Step 4: Run the focused test and commit**

Run: `npm test -- src/layouts/__tests__/DefaultLayoutCollapse.spec.js --runInBand`

Commit: `feat: integrate admin sidebar collapse control`

### Task 2: Native SVG dashboard line chart

**Files:**
- Modify: `src/views/Dashboard.vue`
- Modify: `src/views/dashboard/__tests__/DashboardTrendCard.spec.js`

- [ ] **Step 1: Change the test expectation from bars to a line chart**

```js
expect(source).toContain('trend-line-chart')
expect(source).toContain('<svg')
expect(source).toContain('trendLinePoints')
expect(source).toContain('trendAreaPoints')
expect(source).not.toContain('trend-bar')
```

- [ ] **Step 2: Run the focused test and observe the expected failure**

Run: `npm test -- src/views/dashboard/__tests__/DashboardTrendCard.spec.js --runInBand`

- [ ] **Step 3: Implement responsive chart geometry**

Map seven daily values into a `700 × 260` view box with fixed padding, calculate point coordinates from the real maximum value, create a polyline and closed area polygon, and render day/count labels without adding a chart dependency.

- [ ] **Step 4: Run the focused test and commit**

Run: `npm test -- src/views/dashboard/__tests__/DashboardTrendCard.spec.js --runInBand`

Commit: `feat: replace dashboard bars with line trend`

### Task 3: All-comments default and batch deletion

**Files:**
- Modify: `src/components/common/DataTable.vue`
- Modify: `src/views/comments/CommentList.vue`
- Modify: `src/api/comment.js`
- Create: `src/components/common/__tests__/DataTableSelection.spec.js`
- Create: `src/views/comments/__tests__/CommentListBatch.spec.js`

- [ ] **Step 1: Write failing table-selection and comment-policy tests**

```js
expect(wrapper.findAll('input[type="checkbox"]')).toHaveLength(3)
await wrapper.find('thead input[type="checkbox"]').setValue(true)
expect(wrapper.emitted('selection-change').at(-1)[0]).toEqual([1, 2])

expect(source).toContain("status: ''")
expect(source).toContain('Promise.allSettled')
expect(source).toContain('批量删除')
expect(source).not.toContain("status: 'approved'")
```

- [ ] **Step 2: Run both focused tests and confirm missing selection/default behavior failures**

Run: `npm test -- src/components/common/__tests__/DataTableSelection.spec.js src/views/comments/__tests__/CommentListBatch.spec.js --runInBand`

- [ ] **Step 3: Add controlled selection to `DataTable`**

Add `selectable`, `selectedRowKeys`, and `selection-change`; render one checkbox column, implement current-page select-all, and keep all existing non-selectable consumers unchanged.

- [ ] **Step 4: Add batch-delete orchestration**

Initialize status as empty, omit empty filters from the request, render the selected-count toolbar, confirm deletion, delete selected IDs with `Promise.allSettled`, retain failed IDs, and refresh once after completion.

- [ ] **Step 5: Run both tests and commit**

Run: `npm test -- src/components/common/__tests__/DataTableSelection.spec.js src/views/comments/__tests__/CommentListBatch.spec.js --runInBand`

Commit: `feat: add comment batch management`

### Task 4: Warm public shell and readable public pages

**Files:**
- Modify: `src/styles/blog-cinematic.scss`
- Modify: `src/layouts/BlogLayout.vue`
- Modify: `src/views/blog/BlogDynamic.vue`
- Modify: `src/views/blog/BlogDynamicDetail.vue`
- Modify: `src/views/blog/BlogAbout.vue`
- Modify: `src/views/blog/__tests__/BlogCinematicPages.spec.js`
- Modify: `src/views/blog/__tests__/BlogDetailSecurity.spec.js`
- Modify: `src/views/blog/__tests__/BlogAbout.spec.js`

- [ ] **Step 1: Write failing theme and visibility assertions**

```js
expect(theme).toContain('--blog-bg: #f4efe5')
expect(theme).toContain('--blog-reading-text: #243041')
expect(source).toContain('profile-facts')
expect(source).toContain('overflow-wrap: anywhere')
```

- [ ] **Step 2: Run focused public-page tests and confirm dark-token failures**

Run: `npm test -- src/views/blog/__tests__/BlogCinematicPages.spec.js src/views/blog/__tests__/BlogDetailSecurity.spec.js src/views/blog/__tests__/BlogAbout.spec.js --runInBand`

- [ ] **Step 3: Replace global public tokens and component surfaces**

Move the shell, atmosphere, header, footer, cards, inputs, pagination, article body, comments, dynamic cards, and about profile facts to the warm palette. Remove conflicting dark `!important` declarations and preserve accessible focus states.

- [ ] **Step 4: Run focused tests and commit**

Run: `npm test -- src/views/blog/__tests__/BlogCinematicPages.spec.js src/views/blog/__tests__/BlogDetailSecurity.spec.js src/views/blog/__tests__/BlogAbout.spec.js --runInBand`

Commit: `style: brighten public reading experience`

### Task 5: Image-led warm homepage and motion polish

**Files:**
- Modify: `src/views/blog/BlogHome.vue`
- Create: `public/warm-garden-visual.svg`
- Modify: `src/views/blog/__tests__/BlogHomeExperience.spec.js`

- [ ] **Step 1: Write failing visual-composition tests**

```js
expect(source).toContain('/warm-garden-visual.svg')
expect(source).toContain('visual-ribbon')
expect(source).toContain('image-reveal')
expect(source).toContain("gsap.to('.visual-ribbon__track'")
expect(source).toContain('prefers-reduced-motion: reduce')
```

- [ ] **Step 2: Run the homepage test and confirm missing image-ribbon failures**

Run: `npm test -- src/views/blog/__tests__/BlogHomeExperience.spec.js --runInBand`

- [ ] **Step 3: Implement the warm editorial composition**

Create one bundled SVG visual with warm photographic-style shapes and technical linework. Use it as the fallback hero media and in an offset visual ribbon. Update CSS to warm surfaces, clipped images, editorial type rhythm, and asymmetric spacing. Extend the existing GSAP context with scroll-linked transform/opacity effects and ensure reduced-motion reveals all content.

- [ ] **Step 4: Run the homepage test and commit**

Run: `npm test -- src/views/blog/__tests__/BlogHomeExperience.spec.js --runInBand`

Commit: `feat: rebuild homepage as warm visual garden`

### Task 6: Full verification and delivery

**Files:**
- Modify: `docs/DELIVERY_2026-07-27.md`

- [ ] **Step 1: Run all automated checks**

Run: `npm run test:ci`

Expected: every Jest suite passes with zero failures.

Run: `npm run build`

Expected: Vite exits with code 0 and emits `dist`.

Run: `npm audit --omit=dev --audit-level=high`

Expected: zero high or critical production vulnerabilities.

- [ ] **Step 2: Perform browser verification**

Open the built app at 1920×1080, 1366×768, and 390×844. Confirm no horizontal overflow, sidebar control alignment, responsive SVG labels, comments loading without a status filter, legible dynamic copy, visible about facts, homepage images, scroll motion, and complete reduced-motion rendering.

- [ ] **Step 3: Record and publish the delivery**

Append the implementation commits and verification results to `docs/DELIVERY_2026-07-27.md`, commit the delivery record, push `main`, deploy the immutable build release, and smoke-test the public pages and API.
