# 首页大屏与动态详情可靠性 Implementation Plan

> **For agentic workers:** Execute these steps in order in the existing main worktree. Keep the frontend and backend commits separate because they are separate repositories.

**Goal:** Make the homepage fluid on large screens and make dynamic detail loading distinguish missing content from recoverable request failures.

**Architecture:** Add a homepage-only width token at the blog layout boundary. Treat the dynamic detail request as the only blocking request, render it before firing view/comment side effects, watch the route ID, and map backend `Http404` to a JSON 404 envelope.

**Tech Stack:** Vue 3, Vue Router, Jest, Django REST Framework, Django `APITestCase`, Vite.

---

### Task 1: Add regression tests

**Files:**
- Modify: `src/views/blog/__tests__/BlogHomeExperience.spec.js`
- Modify: `src/views/blog/__tests__/BlogDynamicDetailLayout.spec.js`
- Modify: `src/layouts/BlogLayout.vue` test coverage through source assertions
- Modify: `/Users/leexd/Documents/ChatGPT/blog_li/apps/dynamic/tests.py`

- [ ] Add assertions for the homepage-only `blog-shell--home` class, fluid `1480px` width token, and replacement of the fixed hero minimum height.
- [ ] Add assertions that detail loading watches `route.params.id`, distinguishes `not-found` from retryable errors, and isolates supplemental requests.
- [ ] Add a backend test asserting missing and draft public details return HTTP 404 with `code: 404`.
- [ ] Run the new frontend and backend tests and confirm each fails before implementation.

### Task 2: Implement responsive homepage layout

**Files:**
- Modify: `src/layouts/BlogLayout.vue`
- Modify: `src/views/blog/BlogHome.vue`

- [ ] Apply the homepage-only class when `route.name === 'BlogHome'`.
- [ ] Set `.blog-shell--home { --content-width: min(1480px, calc(100vw - 64px)); }`.
- [ ] Replace the hero fixed minimum-height range with a viewport-aware `clamp` and retain the mobile overrides.

### Task 3: Implement reliable dynamic detail loading

**Files:**
- Modify: `src/views/blog/BlogDynamicDetail.vue`
- Modify: `/Users/leexd/Documents/ChatGPT/blog_li/apps/dynamic/views.py`

- [ ] Catch `Http404` before the generic backend exception and return the public 404 envelope.
- [ ] Reset detail state on each ID load, render valid detail before side effects, and use a route watcher for ID changes.
- [ ] Render a retry action only for non-404 failures; keep the deleted/missing state separate.
- [ ] Start view-count and comment requests in the background so either failure leaves the article readable and cannot hold the main loading state.

### Task 4: Verify, commit, push, and deploy

**Files:**
- No additional source files.

- [ ] Run frontend Jest and `npm run build`.
- [ ] Run backend dynamic tests using `/opt/anaconda3/envs/blog/bin/python` when available.
- [ ] Commit and push frontend `main`, then backend `main`, with Chinese commit messages.
- [ ] Deploy the frontend release atomically and restart the backend service after uploading the backend change.
- [ ] Verify online: valid detail is 200, missing detail is JSON 404, JS assets are JavaScript responses, and homepage HTML loads.
