# Mobile File Selector Density Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide file names and sizes in the mobile file selector while preserving thumbnails, selection feedback, and desktop file details.

**Architecture:** Keep the existing file selector template and data flow unchanged. Add a mobile-only SCSS override for `.file-info` and remove the thumbnail's reserved bottom spacing at the same breakpoint. Protect the behavior with a source-level layout regression test.

**Tech Stack:** Vue 3, Ant Design Vue, scoped SCSS, Jest.

---

### Task 1: Add the mobile presentation regression test

**Files:**
- Modify: `src/views/dynamics/__tests__/AdminEditorLayout.spec.js`

- [ ] **Step 1: Write the failing test**

  Read `src/views/dynamics/DynamicEdit.vue` and assert that the mobile media query hides `.file-info`, removes `.file-preview` bottom spacing, and that the template still contains `.file-name` and `.file-size` for desktop rendering.

- [ ] **Step 2: Run the focused test to verify it fails**

  ```bash
  npm test -- --runInBand src/views/dynamics/__tests__/AdminEditorLayout.spec.js
  ```

  Expected: the new mobile presentation assertion fails because the mobile override does not yet exist.

### Task 2: Implement the mobile-only information reduction

**Files:**
- Modify: `src/views/dynamics/DynamicEdit.vue:1420-1465`

- [ ] **Step 1: Add the mobile CSS override**

  Add the following rules inside the existing `@media (max-width: 640px)` block:

  ```scss
  .file-selector {
    .file-preview {
      margin-bottom: 0;
    }

    .file-info {
      display: none;
    }
  }
  ```

  Do not alter the template, API response normalization, selection state, search, filtering, or desktop styles.

- [ ] **Step 2: Run the focused test to verify it passes**

  ```bash
  npm test -- --runInBand src/views/dynamics/__tests__/AdminEditorLayout.spec.js
  ```

  Expected: the layout test passes.

### Task 3: Verify and publish

**Files:**
- No additional files.

- [ ] **Step 1: Run the full frontend verification**

  ```bash
  npm run check
  ```

  Expected: all Jest suites pass and Vite production build succeeds.

- [ ] **Step 2: Commit the implementation and test**

  ```bash
  git add src/views/dynamics/DynamicEdit.vue src/views/dynamics/__tests__/AdminEditorLayout.spec.js
  git commit -m "优化：移动端文件选择器展示"
  ```

- [ ] **Step 3: Push `main` and deploy the generated `dist/` release**

  Push the commit to `origin/main`, copy the built `dist/` artifact to `/var/www/myblog-admin/releases/<commit-sha>/` on `192.3.221.53`, atomically point `/var/www/myblog-admin/current` to that release, and verify `index.html` exists at the release root.

- [ ] **Step 4: Verify online resources**

  Confirm `https://leexd.top/` and `https://leexd.top/api/blog/dynamics/` return HTTP 200, and confirm the deployed DynamicEdit JS/CSS checksums match the local build.
