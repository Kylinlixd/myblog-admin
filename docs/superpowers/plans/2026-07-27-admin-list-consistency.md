# Admin List Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify all admin list-page shells, update the public hero copy, remove misleading sidebar state, verify production, and publish the result.

**Architecture:** Reuse the existing `PageHeader` and global admin workspace classes instead of introducing a new component family. Keep each list's existing API and table implementation intact while normalizing only its presentation shell.

**Tech Stack:** Vue 3, Ant Design Vue, Sass, Jest, Vite, Nginx

---

### Task 1: Lock the shared presentation contract

**Files:**
- Modify: `src/views/__tests__/adminFilterControls.spec.js`
- Test: `src/views/__tests__/adminFilterControls.spec.js`

- [ ] **Step 1: Write the failing presentation contract test**

Add a test that reads the five list views and asserts each contains `PageHeader`, a non-empty `subtitle`, and an admin table surface. Assert `DefaultLayout.vue` no longer contains `本地开发`, and `BlogHome.vue` contains `探索技术的` plus `无限可能。`.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm test -- --runInBand src/views/__tests__/adminFilterControls.spec.js`

Expected: FAIL because four list pages do not use the shared page header and the old hero/sidebar copy still exists.

- [ ] **Step 3: Commit the failing contract with the implementation**

The contract remains in the same implementation commit so the branch never intentionally publishes a red revision.

### Task 2: Upgrade the shared title shell

**Files:**
- Modify: `src/components/common/PageHeader.vue`
- Modify: `src/styles/admin-workspace.scss`

- [ ] **Step 1: Add subtitle support**

Use this semantic structure:

```vue
<div class="page-header__copy">
  <div class="page-header__title">
    <slot name="icon"><component :is="icon" v-if="icon" /></slot>
    <h1>{{ title }}</h1>
  </div>
  <p v-if="subtitle">{{ subtitle }}</p>
</div>
```

Keep the existing `actions` slot and add an optional string `subtitle` prop.

- [ ] **Step 2: Centralize visual rules**

Define `.page-header`, `.page-header__copy`, `.page-header__title`, and `.page-header__actions` in `admin-workspace.scss`. At `max-width: 640px`, stack the title and actions and make the actions wrap.

- [ ] **Step 3: Remove the old scoped title styling**

Delete duplicated colors, borders, and dark-mode overrides from `PageHeader.vue`; the global workspace stylesheet owns the shell.

### Task 3: Normalize the five list pages

**Files:**
- Modify: `src/views/dynamics/DynamicList.vue`
- Modify: `src/views/categories/CategoryList.vue`
- Modify: `src/views/tags/TagList.vue`
- Modify: `src/views/comments/CommentList.vue`
- Modify: `src/views/files/FileList.vue`

- [ ] **Step 1: Add one shared header per page**

Use concise operational subtitles for content, category, tag, comment, and file management, importing the shared component through `@/components/common/PageHeader.vue`.

- [ ] **Step 2: Normalize table surfaces**

Wrap category and tag `a-table` elements in `<a-card class="admin-table-card">`. Retain their current columns, pagination, selection, events, and modals unchanged. Dynamic and file pages keep their existing card wrappers; comment keeps `DataTable`, which already carries `admin-table-card`.

- [ ] **Step 3: Delete local shell overrides**

Remove the comment page's `padding: 20px` and nested page-header margin override. Preserve only content-specific cell truncation.

### Task 4: Update public copy and navigation truthfulness

**Files:**
- Modify: `src/views/blog/BlogHome.vue`
- Modify: `src/layouts/DefaultLayout.vue`

- [ ] **Step 1: Replace the hero copy**

Set the hero heading to `<h1>探索技术的<br /><em>无限可能。</em></h1>`.

- [ ] **Step 2: Remove misleading environment state**

Delete the `sidebar-status` template block and its associated `.sidebar-status` and `.status-dot` CSS rules. Keep navigation grouping and active states unchanged.

### Task 5: Verify and publish

**Files:**
- Modify: `docs/DELIVERY_2026-07-27.md`

- [ ] **Step 1: Run focused tests**

Run: `npm test -- --runInBand src/views/__tests__/adminFilterControls.spec.js src/styles/__tests__/adminWorkspace.spec.js`

Expected: all focused tests PASS.

- [ ] **Step 2: Run the full frontend check**

Run: `npm run check`

Expected: all Jest suites PASS and Vite production build succeeds.

- [ ] **Step 3: Verify the production admin creation path**

Inspect Django's configured user model and permissions, then document that server administrators are created interactively with `/opt/blog_li/.venv/bin/python /opt/blog_li/manage.py createsuperuser`; passwords are stored as Django hashes, not plaintext.

- [ ] **Step 4: Delete exact server artifacts**

Confirm and delete only `/root/backups/kylin-blog-20260727T073026Z` and `/opt/blog_li-rollback-20260727T073026Z`, then verify both paths no longer exist and current service directories still resolve.

- [ ] **Step 5: Commit, push, deploy, and smoke test**

Commit the frontend changes, push `main`, deploy a new immutable frontend release, verify `nginx`, `blog-li`, and HTTPS, and append exact commit/release identifiers to the delivery record.
