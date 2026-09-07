# Admin Experience Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh the admin backend shell, grouped menu, register page, logout flow, and auth route initialization.

**Architecture:** Keep backend APIs and business pages unchanged. Concentrate structural changes in `src/config/adminMenu.js`, `src/layouts/DefaultLayout.vue`, `src/views/Register.vue`, `src/stores/user.js`, and `src/router/index.js`, with small tests around the changed contracts.

**Tech Stack:** Vue 3, Pinia, Vue Router, Ant Design Vue, Jest, Vite.

---

### Task 1: Menu Contract

**Files:**
- Modify: `src/config/adminMenu.js`
- Modify: `src/config/__tests__/adminMenu.spec.js`

- [ ] Add grouped menu metadata with labels, descriptions, group ids, and group labels.
- [ ] Verify tests fail before implementation.
- [ ] Update `adminMenu` to expose the grouped metadata.
- [ ] Verify the menu tests pass.

### Task 2: Register Validation And Auth Store

**Files:**
- Create: `src/views/register/validation.js`
- Create: `src/views/register/__tests__/validation.spec.js`
- Modify: `src/stores/user.js`
- Modify: `src/stores/__tests__/user.spec.js`

- [ ] Add tests for password confirmation and register error propagation.
- [ ] Verify tests fail before implementation.
- [ ] Implement `validatePasswordConfirmation` and let `userStore.register` expose backend errors to callers.
- [ ] Verify targeted tests pass.

### Task 3: Auth Route Initialization

**Files:**
- Modify: `src/router/index.js`

- [ ] Make the route guard async for admin/auth routes.
- [ ] Initialize the session before deciding login/register redirects.
- [ ] Keep public blog routes fast and unauthenticated.

### Task 4: Admin Shell And Register UI

**Files:**
- Modify: `src/layouts/DefaultLayout.vue`
- Modify: `src/views/Register.vue`

- [ ] Rebuild the sidebar around grouped menu sections.
- [ ] Polish header account menu and logout confirmation styling.
- [ ] Rewrite register page with the login visual system and Ant Design form controls.
- [ ] Keep mobile layout stable.

### Task 5: Verification And Git

**Files:**
- Commit all intended frontend changes only.

- [ ] Run targeted Jest tests.
- [ ] Run `npm run build`.
- [ ] Inspect git diff and status.
- [ ] Commit and push `codex/admin-experience-refresh`.
