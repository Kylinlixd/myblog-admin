# Admin Frontend Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the `myblog-admin` Vue workspace into reliable end-to-end use with `blog_li`, prioritizing page layout, interaction feedback, and responsive behavior.

**Architecture:** Import the upstream Vue 3 application into this local repository, keep its existing Pinia/Vue Router/Ant Design Vue structure, and make the smallest shared fixes that improve every page. The HTTP client remains the only token/API boundary; shared page primitives remain the only place for common loading, empty, error, table, filter, and pagination behavior.

**Tech Stack:** Vue 3, Vite, Pinia, Vue Router, Ant Design Vue, Axios, Sass, Jest, existing icon and editor packages. No new dependencies.

---

## File map

- `src/services/http/client.js`, `src/services/http/errors.js`, `src/utils/apiBaseUrl.js`: request headers, refresh flow, API URL resolution, and user-facing error normalization.
- `src/api/*.js`, `src/stores/user.js`: backend payload normalization and session state used by all pages.
- `src/components/common/{AsyncState,DataTable,SearchForm,PageHeader,Pagination}.vue`: shared page states and controls.
- `src/layouts/DefaultLayout.vue`, `src/styles/{theme,admin-workspace,main}.scss`: A-direction workspace shell and responsive surface system.
- `src/views/{Login,Dashboard}.vue`, `src/views/dynamics/{DynamicList,DynamicEdit}.vue`, `src/views/{categories/CategoryList,tags/TagList,comments/CommentList,files/FileList,user/Profile}.vue`: page-specific layout and interaction fixes.
- `src/**/__tests__/*.spec.js`, `src/services/http/__tests__/*.spec.js`: regression coverage for request behavior and UI states.

### Task 1: Import and baseline the upstream admin application

**Files:**
- Modify: repository history and all upstream application files from `https://github.com/Kylinlixd/myblog-admin.git`
- Test: `package-lock.json`, existing source tests

- [ ] **Step 1: Add the upstream remote and fetch its default branch**

```bash
git remote add origin https://github.com/Kylinlixd/myblog-admin.git
git fetch origin main
```

Expected: `origin/main` is available locally; if the remote default branch differs, use the branch reported by `git ls-remote --symref origin HEAD`.

- [ ] **Step 2: Merge the upstream baseline without deleting the approved design commit**

```bash
git merge origin/main --allow-unrelated-histories -m "chore: import upstream admin baseline"
```

Expected: source files, `package.json`, and `package-lock.json` are present while `docs/superpowers/specs/2026-08-08-admin-frontend-polish-design.md` remains in the tree.

- [ ] **Step 3: Install the existing dependency lockfile and run the baseline check**

```bash
npm ci
npm run check
```

Expected: baseline failures, if any, are recorded before edits; no package is added.

- [ ] **Step 4: Commit the imported baseline**

```bash
git add package.json package-lock.json src public index.html vite.config.js tsconfig.json tsconfig.node.json babel.config.js jest.config.js jest.setup.js postcss.config.js docs
git commit -m "chore: import upstream admin baseline"
```

### Task 2: Stabilize API URL, envelope, token refresh, and error feedback

**Files:**
- Modify: `src/services/http/client.js`, `src/services/http/errors.js`, `src/utils/apiBaseUrl.js`, `src/api/auth.js`, `src/api/collections.js`, `src/api/file.js`, `src/api/comment.js`, `src/stores/user.js`
- Test: `src/services/http/__tests__/client.spec.js`, `src/services/http/__tests__/errors.spec.js`, `src/services/http/__tests__/tokenStorage.spec.js`, `src/api/__tests__/auth.spec.js`, `src/api/__tests__/collections.spec.js`

- [ ] **Step 1: Add regression tests for the production-safe refresh URL and response envelope**

The refresh request must use the same API base as normal requests and unwrap the backend response before saving tokens:

```js
expect(refreshRequest.url).toContain('/api/token/refresh/')
expect(getAccessToken()).toBe('next-access')
```

Add a test that a non-string backend `message` becomes a readable fallback instead of `[object Object]`, and a test that GET requests do not receive a write-only `X-Request-ID` header.

- [ ] **Step 2: Run the focused HTTP tests and verify the new tests fail against the baseline**

```bash
npx jest --runInBand src/services/http/__tests__/client.spec.js src/services/http/__tests__/errors.spec.js
```

Expected: the new refresh/envelope/header assertions fail against the current implementation.

- [ ] **Step 3: Implement the smallest shared request fix**

Use the configured base URL for refresh and unwrap either `{ access, refresh }` or `{ data: { access, refresh } }`:

```js
const apiRoot = getApiBaseUrl()
const refreshResponse = await axios.post(`${apiRoot}/api/token/refresh/`, { refresh }, { withCredentials: true })
const session = refreshResponse.data?.data || refreshResponse.data
saveSession({ access: session.access, refresh: session.refresh || refresh })
```

Only add `X-Request-ID` for methods other than `GET`, `HEAD`, and `OPTIONS`; preserve the existing single-flight refresh promise and `auth:expired` event.

- [ ] **Step 4: Normalize shared collection, file, and comment shapes at the API boundary**

Return one shape to views: `{ count, results }`, supporting backend `data.items`, `data.list`, `data.results`, `results`, and `count`. Normalize uploaded file fields to `type`, `size`, and `url`. Do not add response parsing inside view components.

- [ ] **Step 5: Run focused tests and commit**

```bash
npx jest --runInBand src/services/http/__tests__ src/api/__tests__/auth.spec.js src/api/__tests__/collections.spec.js
git add src/services/http src/utils/apiBaseUrl.js src/api src/stores/user.js
git commit -m "fix: stabilize admin API session handling"
```

Expected: focused tests pass.

### Task 3: Unify the A-direction shell and shared page controls

**Files:**
- Modify: `src/layouts/DefaultLayout.vue`, `src/components/common/AsyncState.vue`, `src/components/common/DataTable.vue`, `src/components/common/SearchForm.vue`, `src/components/common/PageHeader.vue`, `src/components/common/Pagination.vue`, `src/styles/theme.scss`, `src/styles/admin-workspace.scss`, `src/styles/main.scss`
- Test: `src/layouts/__tests__/DefaultLayoutCollapse.spec.js`, `src/components/common/__tests__/AsyncState.spec.js`, `src/components/common/__tests__/DataTableSelection.spec.js`, `src/views/__tests__/adminFilterControls.spec.js`

- [ ] **Step 1: Add shared-state tests for loading, empty, error, selection, reset, and pagination behavior**

The tests must assert:

```js
expect(wrapper.find('[role="status"]').exists()).toBe(true)
await wrapper.find('button').trigger('click')
expect(retry).toHaveBeenCalled()
```

Also assert that resetting a filter preserves numeric defaults such as `pageSize`, that selecting the current page does not select rows from another page, and that the mobile navigation closes after route selection.

- [ ] **Step 2: Implement the shared visual system without adding a library**

Keep the existing navy sidebar and blue accent, but centralize the following tokens in `theme.scss` and reuse them in `admin-workspace.scss`:

```scss
:root {
  --color-page: #f4f6f9;
  --color-surface: #fff;
  --color-primary: #315bea;
  --color-border: #e1e6ee;
  --radius-md: 12px;
  --transition-fast: 160ms ease;
}
```

Remove duplicated shadows/backgrounds from page-specific styles. Use CSS grid for page sections, `overflow-x: auto` for wide tables, visible `:focus-visible` rings, and `transform`/`opacity` only for transitions.

- [ ] **Step 3: Fix shell interactions and mobile layout**

Keep the existing collapsed desktop sidebar and mobile drawer. Ensure the menu button has an accessible expanded state, selecting a navigation item closes the drawer, the header action area wraps or hides secondary labels below 720px, and the content area never forces horizontal viewport overflow.

- [ ] **Step 4: Improve shared filter, table, and pagination affordances**

Use labels above controls on small screens, keep search and reset actions together, show a skeleton overlay that preserves table height, render a descriptive empty state, keep selected rows visible in the batch toolbar, and make pagination reset to page 1 when page size changes.

- [ ] **Step 5: Run shared component tests and commit**

```bash
npx jest --runInBand src/layouts/__tests__ src/components/common/__tests__ src/views/__tests__/adminFilterControls.spec.js
git add src/layouts/DefaultLayout.vue src/components/common src/styles
git commit -m "style: unify admin workspace surfaces"
```

### Task 4: Repair dashboard, login, lists, and editor interaction details

**Files:**
- Modify: `src/views/Login.vue`, `src/views/Dashboard.vue`, `src/views/dynamics/DynamicList.vue`, `src/views/dynamics/DynamicEdit.vue`, `src/views/dynamics/editorDraft.js`
- Test: `src/views/dashboard/__tests__/DashboardTrendCard.spec.js`, `src/views/dashboard/__tests__/stats.spec.js`, `src/views/dynamics/__tests__/AdminEditorLayout.spec.js`, `src/views/dynamics/__tests__/editorDraft.spec.js`, `src/views/dynamics/__tests__/dynamicPreviewWorkflow.spec.js`

- [ ] **Step 1: Add regression assertions for page-level interaction states**

Cover these concrete cases:

```js
expect(wrapper.find('[aria-label="重试"]').exists()).toBe(true)
await wrapper.find('button[type="submit"]').trigger('submit')
expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
```

Also cover list reset returning to page 1, empty dynamic list showing a create action, editor save failure retaining title/content, preview visibility toggling only when content exists, and media type changes clearing incompatible upload controls.

- [ ] **Step 2: Improve login and dashboard layout using existing components**

Keep the split login layout but make the intro and form collapse cleanly below 860px. On the dashboard, keep the asymmetric trend/taxonomy grid, align metric values with tabular numerals, and ensure loading/error/empty states preserve the surrounding layout rather than replacing the whole page with a spinner.

- [ ] **Step 3: Fix dynamic list behavior**

Normalize the API response before rendering, reset page and selection after filter/reset, disable batch actions while deleting, use one confirmation for destructive actions, and make table actions readable on narrow screens through horizontal scrolling rather than clipped text.

- [ ] **Step 4: Fix editor behavior**

Keep title, markdown content, taxonomy, status, and media sections visually separated. Preserve drafts through the existing debounce helper, show saving state on both save buttons, keep current form values after a failed save/upload, and refresh taxonomy/file options after creating or selecting an item.

- [ ] **Step 5: Run focused page tests and commit**

```bash
npx jest --runInBand src/views/dashboard src/views/dynamics
git add src/views/Login.vue src/views/Dashboard.vue src/views/dynamics
git commit -m "fix: refine content workspace interactions"
```

### Task 5: Make taxonomy, comments, files, and profile pages consistent

**Files:**
- Modify: `src/views/categories/CategoryList.vue`, `src/views/tags/TagList.vue`, `src/views/comments/CommentList.vue`, `src/views/files/FileList.vue`, `src/views/user/Profile.vue`
- Test: existing page tests for comments, uploads, profile, taxonomy, and any new regression tests colocated with the affected view

- [ ] **Step 1: Add tests for destructive and async actions**

Assert that each page has an inline loading/empty/error state, that approve/reject/delete actions disable the affected control while pending, that batch operations retain failed IDs, and that avatar/profile save failures keep the local form state.

- [ ] **Step 2: Normalize page data through the API modules**

Replace checks such as `response.code === 200` in views with resolved/rejected promise handling from the shared client. Use the normalized `{ count, results }` and file `{ url, type, size }` shapes so the UI does not branch on backend response wrappers.

- [ ] **Step 3: Apply consistent page hierarchy and mobile behavior**

Use the shared page header, filter surface, table surface, batch toolbar, and pagination. Keep category/tag editing compact, allow long comment content to wrap, make file previews maintain a stable aspect ratio, and stack profile form sections below 720px.

- [ ] **Step 4: Run affected tests and commit**

```bash
npx jest --runInBand src/views src/components src/api
git add src/views/categories src/views/tags src/views/comments src/views/files src/views/user src/api
git commit -m "fix: align admin management page interactions"
```

### Task 6: Verify production-shaped build and deployed runtime

**Files:**
- Modify only if verification finds a concrete issue: `.env.example`, `vite.config.js`, `docs/DEPLOY.md`
- Test: full repository test suite, production build, local browser smoke checks, read-only server checks

- [ ] **Step 1: Run the full local verification**

```bash
npm run test:ci
npm run build
```

Expected: Jest and Vite both exit with code 0; `dist/index.html` and hashed assets exist.

- [ ] **Step 2: Run the existing browser smoke flow against a production-shaped preview**

```bash
npm run preview -- --host 127.0.0.1 --port 4173
```

Verify login route rendering, dashboard route rendering, mobile drawer open/close, dynamic list filter/reset, editor preview/save feedback, and one taxonomy/comment/file action. Stop the preview after the checks.

- [ ] **Step 3: Inspect the deployed server without writing credentials to disk**

Use the supplied SSH session to read the active frontend path, Nginx/API proxy configuration, deployed `index.html`, and service status. Confirm `/api/`, `/media/`, `/assets/`, `/login`, and `/dashboard` resolve as expected. Do not alter the server until the local build has passed.

- [ ] **Step 4: Commit any verification-only documentation change and report deployment status**

```bash
git status --short
git log --oneline -6
```

If the deployed build is not updated, report the exact blocker and leave local changes intact rather than claiming deployment success.

