# Mobile Media Upload Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make mobile dynamic editing show the media upload action before the content editor and ensure the upload trigger remains tappable.

**Architecture:** Keep the existing Ant Design Vue upload and custom request pipeline. Reorder the existing media form items before the Markdown editor, then reset the mobile form from grid to a single-column flow so no fixed grid row can cover the upload controls. Add source-level regression assertions for DOM order, mobile layout reset, and explicit file-dialog behavior.

**Tech Stack:** Vue 3, Ant Design Vue, SCSS, Jest, Vue Test Utils, Vite.

---

### Task 1: Add regression coverage for mobile upload placement

**Files:**
- Modify: `src/views/dynamics/__tests__/AdminEditorLayout.spec.js`
- Modify: `src/views/dynamics/__tests__/DynamicEditMountedInteractions.spec.js`

- [ ] **Step 1: Write failing tests**

  Assert that `DynamicEdit.vue` places the image/audio/video upload blocks before `editor-content-field`, resets `.edit-form` to a single-column flow at the mobile breakpoint, and explicitly enables `open-file-dialog-on-click` on media upload controls. Add a mounted interaction assertion that selecting image type renders the upload field before the content field.

- [ ] **Step 2: Run the focused tests to verify the expected failure**

  Run:

  ```bash
  npm test -- --runInBand src/views/dynamics/__tests__/AdminEditorLayout.spec.js src/views/dynamics/__tests__/DynamicEditMountedInteractions.spec.js
  ```

  Expected: the new placement and mobile-layout assertions fail against the current DOM/CSS.

### Task 2: Reorder and stabilize the upload controls

**Files:**
- Modify: `src/views/dynamics/DynamicEdit.vue:82-180`
- Modify: `src/views/dynamics/DynamicEdit.vue:1380-1435`

- [ ] **Step 1: Move the existing image, audio, and video form items before `editor-content-field`**

  Keep their current validation, file-library actions, previews, and `custom-request` handlers unchanged. The resulting form order is title, taxonomy/type, active media upload, content editor, status, and save actions.

- [ ] **Step 2: Make the browser file dialog behavior explicit**

  Add `:open-file-dialog-on-click="true"` to the type-specific upload controls and the text quick-upload control. Add a shared `media-upload-field` class for the moved upload items without changing the API payload.

- [ ] **Step 3: Reset mobile layout constraints**

  At `max-width: 1080px`, keep the one-column grid for tablet widths. At `max-width: 640px`, change `.edit-form` to a block/flex column flow and reset `grid-column` and `grid-row` for all form fields, so the editor cannot span over media controls. Give the active upload container a full-width, touch-friendly layout.

- [ ] **Step 4: Run focused tests and verify they pass**

  Run the same focused Jest command from Task 1. Expected: all focused tests pass.

### Task 3: Verify the complete frontend artifact

**Files:**
- No additional files.

- [ ] **Step 1: Run the full frontend test suite**

  Run `npm run test:ci`. Expected: all tests pass.

- [ ] **Step 2: Run static checks and production build**

  Run `npm run check`. Expected: Jest and Vite build both complete successfully.

- [ ] **Step 3: Inspect the generated bundle for the new behavior**

  Confirm the build output contains the upload placement and file-dialog behavior, and that no unresolved compile warnings are present.

### Task 4: Publish and deploy

**Files:**
- No additional files.

- [ ] **Step 1: Commit the implementation and tests**

  ```bash
  git add src/views/dynamics/DynamicEdit.vue src/views/dynamics/__tests__/AdminEditorLayout.spec.js src/views/dynamics/__tests__/DynamicEditMountedInteractions.spec.js docs/superpowers/plans/2026-08-11-mobile-media-upload-fix.md
  git commit -m "修复：移动端上传位置与点击交互"
  ```

- [ ] **Step 2: Push `main`**

  Run `git push origin main` and confirm the remote accepts the commit.

- [ ] **Step 3: Deploy the built frontend release to `192.3.221.53`**

  Build a release named with the commit SHA, copy `dist/` to `/var/www/myblog-admin/releases/<sha>/`, update `/var/www/myblog-admin/current` atomically, and ensure the release contains `index.html` at its root.

- [ ] **Step 4: Verify online behavior**

  Request `https://leexd.top/` and the dynamic API, confirm HTTP 200, check the new bundle is referenced by `index.html`, and verify the current symlink points to the new release.
