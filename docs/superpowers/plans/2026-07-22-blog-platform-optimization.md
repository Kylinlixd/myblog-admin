# Blog Platform Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a consistent modern public blog and admin experience, simplify the Vue application core, harden the Django API, and replace drifted developer documentation in both repositories.

**Architecture:** Keep the existing Vue 3/Vite and Django/DRF applications and preserve public routes. Implement vertical, testable slices: first stabilize tests, then introduce shared theme and request primitives, rebuild the public and admin shells on those primitives, harden backend configuration and queries, and finally rewrite and verify documentation.

**Tech Stack:** Vue 3, Vite 6, Pinia, Vue Router, Ant Design Vue 4, Jest 29, Django 5.1, Django REST Framework 3.16, SimpleJWT, MySQL/SQLite test database.

---

## File map

### Frontend repository: `myblog-admin`

- `src/styles/theme.scss`: canonical design tokens and responsive defaults.
- `src/styles/global.scss`: minimal reset, document typography, accessibility, and shared layout primitives.
- `src/main.js`: only browser entry and Ant Design theme registration.
- `src/services/http/tokenStorage.js`: access/refresh token persistence without response-shape guessing.
- `src/services/http/errors.js`: normalized frontend API error type.
- `src/services/http/client.js`: single Axios instance, refresh queue, request ID, and response unwrapping.
- `src/utils/request.js`: compatibility re-export during migration.
- `src/components/common/AsyncState.vue`: loading, empty, and error presentation.
- `src/components/blog/ArticleCard.vue`: shared public content summary card.
- `src/components/blog/BlogSearch.vue`: responsive site search and history.
- `src/layouts/BlogLayout.vue`: public site shell only.
- `src/views/blog/BlogHome.vue`: public landing page driven by real content APIs.
- `src/config/adminMenu.js`: admin navigation source of truth.
- `src/layouts/DefaultLayout.vue`: responsive admin shell.
- `src/views/Dashboard.vue`: useful operational summary without synthetic browser metrics.
- `src/router/index.js`: simplified auth/title/scroll guards.
- `src/**/__tests__/*.spec.js`: focused unit and component regression tests.

### Backend repository: `blog_li`

- `blog/settings.py`: environment-driven development/production-safe settings.
- `blog/urls.py`: production API routes without public debug endpoints.
- `blog/exception_handler.py`: stable error envelope with request ID.
- `apps/dynamic/views.py`: optimized querysets, validated parameters, atomic counters.
- `apps/dynamic/tests.py`: tests for the actual Dynamic model and current routes.
- `apps/user/tests.py`: current authentication contract tests.
- `.env.example`: complete, non-secret configuration template.

### Documentation

- Frontend: `README.md`, `docs/DEV_GUIDE.md`, `docs/API_REFERENCE.md`, `docs/DEPLOY.md`.
- Backend: `README.md`, `docs/development.md`, `docs/api.md`, `docs/deployment.md`.

---

### Task 1: Establish reproducible baselines

**Files:**
- Modify: `myblog-admin/package.json`
- Create: `myblog-admin/src/services/http/__tests__/tokenStorage.spec.js`
- Modify: `blog_li/requirements.txt`

- [ ] **Step 1: Install locked frontend dependencies and capture current failures**

Run: `npm ci`

Run: `npm test -- --runInBand --passWithNoTests`

Expected: dependency installation succeeds; test command either reports no tests or exposes the current Jest configuration failure without modifying application behavior.

- [ ] **Step 2: Add deterministic check scripts**

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "test:ci": "jest --runInBand",
    "check": "npm run test:ci && npm run build"
  }
}
```

- [ ] **Step 3: Create a backend virtual environment and capture current failures**

Run: `python3 -m venv .venv && .venv/bin/pip install -r requirements.txt`

Run: `.venv/bin/python manage.py check`

Run: `.venv/bin/python manage.py test`

Expected: `check` identifies configuration issues if environment values are absent; tests expose the stale `apps.post` imports in `apps/dynamic/tests.py`.

- [ ] **Step 4: Commit only reproducibility changes**

```bash
git add package.json package-lock.json
git commit -m "chore: add reproducible frontend checks"
```

---

### Task 2: Consolidate token storage and API errors

**Files:**
- Create: `src/services/http/tokenStorage.js`
- Create: `src/services/http/errors.js`
- Test: `src/services/http/__tests__/tokenStorage.spec.js`
- Test: `src/services/http/__tests__/errors.spec.js`

- [ ] **Step 1: Write failing token storage tests**

```js
import { clearSession, getAccessToken, saveSession } from '../tokenStorage'

describe('tokenStorage', () => {
  beforeEach(() => localStorage.clear())

  it('stores raw tokens and returns the access token', () => {
    saveSession({ access: 'access-value', refresh: 'refresh-value' })
    expect(getAccessToken()).toBe('access-value')
    expect(localStorage.getItem('blog.accessToken')).toBe('access-value')
  })

  it('clears both tokens', () => {
    saveSession({ access: 'a', refresh: 'r' })
    clearSession()
    expect(getAccessToken()).toBe('')
    expect(localStorage.getItem('blog.refreshToken')).toBeNull()
  })
})
```

- [ ] **Step 2: Run the tests and verify the missing module failure**

Run: `npm run test:ci -- src/services/http/__tests__/tokenStorage.spec.js`

Expected: FAIL because `tokenStorage.js` does not exist.

- [ ] **Step 3: Implement the storage contract**

```js
const ACCESS_KEY = 'blog.accessToken'
const REFRESH_KEY = 'blog.refreshToken'

export const getAccessToken = () => localStorage.getItem(ACCESS_KEY) || ''
export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY) || ''

export function saveSession({ access, refresh }) {
  if (!access) throw new TypeError('access token is required')
  localStorage.setItem(ACCESS_KEY, String(access))
  if (refresh) localStorage.setItem(REFRESH_KEY, String(refresh))
}

export function clearSession() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}
```

- [ ] **Step 4: Write and implement API error normalization tests**

Test these mappings in `errors.spec.js`: DRF field errors become `fieldErrors`, network failures use status `0`, and response request IDs are preserved. Implement `ApiError` and `normalizeApiError(error)` in `errors.js` with the stable fields `status`, `code`, `message`, `fieldErrors`, and `requestId`.

- [ ] **Step 5: Run focused tests and commit**

Run: `npm run test:ci -- src/services/http/__tests__`

Expected: PASS.

```bash
git add src/services/http
git commit -m "refactor: standardize frontend session and api errors"
```

---

### Task 3: Build the single HTTP client and migrate authentication

**Files:**
- Create: `src/services/http/client.js`
- Modify: `src/utils/request.js`
- Modify: `src/api/auth.js`
- Modify: `src/api/blog.js`
- Modify: `src/stores/user.js`
- Test: `src/services/http/__tests__/client.spec.js`

- [ ] **Step 1: Write failing response-unwrapping and refresh-queue tests**

Create an Axios mock adapter in `client.spec.js` and assert:

```js
expect(unwrapResponse({ code: 200, data: { id: 1 }, message: 'success' })).toEqual({ id: 1 })
expect(() => unwrapResponse({ code: 400, message: 'invalid' })).toThrow('invalid')
```

Also send two requests that receive 401 and assert the injected `refreshSession` function runs exactly once before both requests are replayed.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm run test:ci -- src/services/http/__tests__/client.spec.js`

Expected: FAIL because the client and exports do not exist.

- [ ] **Step 3: Implement one Axios client**

The client must:

```js
const http = axios.create({ baseURL: '', timeout: 15000 })

http.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers['X-Request-ID'] = generateRequestId()
  return config
})
```

Implement one refresh promise shared by concurrent 401 responses. On refresh failure call `clearSession()` and reject with `normalizeApiError(error)`. Do not rewrite HTTP 500 responses to success and do not log tokens or response bodies.

- [ ] **Step 4: Migrate domain APIs and store**

Update authentication and blog API functions to use `http.get/post/put/delete`. Make `user.js` consume the real `{ access, refresh }` login contract once, call `saveSession`, and remove multi-format token parsing and duplicate localStorage writes. Keep exported API function names stable for existing callers.

- [ ] **Step 5: Preserve imports during migration**

Make `src/utils/request.js` a compatibility export:

```js
export { default } from '@/services/http/client'
```

- [ ] **Step 6: Run tests and commit**

Run: `npm run test:ci -- src/services/http/__tests__`

Run: `npm run build`

Expected: both pass.

```bash
git add src/services/http src/utils/request.js src/api/auth.js src/api/blog.js src/stores/user.js
git commit -m "refactor: use a single authenticated http client"
```

---

### Task 4: Establish the design system and clean application startup

**Files:**
- Modify: `src/styles/theme.scss`
- Modify: `src/styles/global.scss`
- Modify: `src/styles/main.scss`
- Modify: `src/main.js`
- Modify: `src/App.vue`
- Delete: `src/main.ts`
- Modify: `src/router/index.js`

- [ ] **Step 1: Add the chosen design tokens**

Define canonical variables in `theme.scss`:

```scss
:root {
  --color-primary: #315bea;
  --color-primary-hover: #2549c9;
  --color-text: #172033;
  --color-text-secondary: #667085;
  --color-text-muted: #98a2b3;
  --color-page: #f6f8fb;
  --color-surface: #fff;
  --color-border: #e2e7ef;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --shadow-float: 0 14px 36px rgb(23 32 51 / 10%);
  --content-width: 1200px;
  --reading-width: 760px;
}
```

- [ ] **Step 2: Replace conflicting global rules**

Keep a single box-sizing reset, body typography/background, accessible `:focus-visible`, responsive container, image defaults, and reduced-motion rule. Remove duplicate button/input/table/image definitions and global heading margins that leak into Ant Design components.

- [ ] **Step 3: Simplify startup and loading**

Register Ant Design Vue with a `ConfigProvider` theme matching `--color-primary`. Remove the unused `main.ts`, fetch monkey patch, synthetic component preloading, legacy Performance Timing logging, fixed 500ms loading delay, and global full-screen overlay for routine requests. Keep the global Vue error handler but display a generic message without swallowing browser errors.

- [ ] **Step 4: Simplify route guards**

Use route meta for `document.title`, only redirect when an authenticated route has no session, preserve the requested URL in `redirect`, and call `next()` exactly once. Do not cancel navigation solely because `to.path === from.path`.

- [ ] **Step 5: Build and commit**

Run: `npm run build`

Expected: PASS with `src/main.js` as the only entry.

```bash
git add src/styles src/main.js src/App.vue src/router/index.js
git rm src/main.ts
git commit -m "refactor: unify frontend theme and startup"
```

---

### Task 5: Rebuild the public blog shell and home page

**Files:**
- Create: `src/components/common/AsyncState.vue`
- Create: `src/components/blog/ArticleCard.vue`
- Create: `src/components/blog/BlogSearch.vue`
- Modify: `src/layouts/BlogLayout.vue`
- Modify: `src/views/blog/BlogHome.vue`
- Test: `src/components/blog/__tests__/ArticleCard.spec.js`
- Test: `src/views/blog/__tests__/BlogHome.spec.js`

- [ ] **Step 1: Write failing ArticleCard tests**

Mount a published article and assert the title, summary, category, formatted date, and `/blog/dynamics/:id` link are rendered. Mount an article without category or summary and assert the component still renders without placeholder exceptions.

- [ ] **Step 2: Implement shared public components**

`ArticleCard.vue` accepts one `article` prop and emits no data requests. `AsyncState.vue` accepts `loading`, `error`, `empty`, and emits `retry`. `BlogSearch.vue` owns query input and persisted history, while API suggestion loading is debounced and cancellable.

- [ ] **Step 3: Reduce BlogLayout to shell responsibilities**

Render brand, four navigation links, `BlogSearch`, admin/login link, mobile menu, router view, and footer. Use a bounded container, sticky translucent header, visible active state, semantic `header/nav/main/footer`, and a 768px mobile breakpoint.

- [ ] **Step 4: Build a data-driven home page**

Fetch recent, hot, category, and tag data through `blog.js`; display an intro panel, latest article list, compact discovery sidebar, and `AsyncState`. Remove the full-screen animated wave, hard-coded technology wall, and slide-in animation loop.

- [ ] **Step 5: Run component tests, build, and commit**

Run: `npm run test:ci -- src/components/blog src/views/blog`

Run: `npm run build`

Expected: PASS.

```bash
git add src/components/common src/components/blog src/layouts/BlogLayout.vue src/views/blog/BlogHome.vue
git commit -m "feat: redesign the public blog experience"
```

---

### Task 6: Rebuild the admin shell and dashboard

**Files:**
- Create: `src/config/adminMenu.js`
- Modify: `src/layouts/DefaultLayout.vue`
- Modify: `src/views/Dashboard.vue`
- Modify: `src/components/common/PageHeader.vue`
- Modify: `src/components/common/SearchForm.vue`
- Modify: `src/components/common/DataTable.vue`
- Test: `src/layouts/__tests__/DefaultLayout.spec.js`
- Test: `src/views/__tests__/Dashboard.spec.js`

- [ ] **Step 1: Write failing shell and dashboard tests**

Assert `DefaultLayout` renders all visible items from `adminMenu`, marks the current route, and exposes the mobile drawer button. Mock `/api/stats/` and assert Dashboard renders content/category/tag/comment totals and a retry action on failure.

- [ ] **Step 2: Implement menu configuration and responsive shell**

Export records with `key`, `label`, `path`, and icon component from `adminMenu.js`. Make `DefaultLayout` render the records, keep desktop collapse state in localStorage, use a drawer below 992px, and keep logout/profile actions in one user menu.

- [ ] **Step 3: Replace synthetic performance charts**

Dashboard should display only backend-derived stats and recent operational data. Remove browser memory polling, fabricated chart samples, retry loops, ECharts registration from the page, and global loading calls. Use card skeletons during initial fetch and an inline retry state on failure.

- [ ] **Step 4: Align list page primitives**

Apply design tokens, consistent action spacing, responsive filter collapse, accessible labels, and horizontal table containment in the shared components without changing their public props/events.

- [ ] **Step 5: Run tests, build, and commit**

Run: `npm run test:ci -- src/layouts src/views`

Run: `npm run build`

Expected: PASS.

```bash
git add src/config src/layouts/DefaultLayout.vue src/views/Dashboard.vue src/components/common
git commit -m "feat: modernize the admin workspace"
```

---

### Task 7: Harden Django configuration and error responses

**Files:**
- Modify: `blog/settings.py`
- Modify: `blog/urls.py`
- Modify: `blog/exception_handler.py`
- Modify: `.env.example`
- Create: `blog/tests.py`

- [ ] **Step 1: Write failing environment parser and URL tests**

Test that `DEBUG=False` parses to `False`, comma-separated hosts/origins become lists, and `/debug/urls/` plus `/blog/test/` resolve to 404. Test that an API validation error includes `code`, `message`, `data`, and `requestId`.

- [ ] **Step 2: Implement safe environment settings**

Use explicit helpers:

```py
def env_bool(name, default=False):
    return os.getenv(name, str(default)).strip().lower() in {'1', 'true', 'yes', 'on'}

def env_list(name, default=''):
    return [item.strip() for item in os.getenv(name, default).split(',') if item.strip()]
```

Require `DJANGO_SECRET_KEY` when `DEBUG` is false. Read `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, database fields, and `DJANGO_LOG_LEVEL`. Disable SQL query logging unless explicitly enabled.

- [ ] **Step 3: Remove debug routes and stabilize errors**

Delete `debug_urls` and the two public test/debug paths. The exception handler must map DRF errors to the stable envelope and use `request.request_id` when available without including exception details in 500 responses.

- [ ] **Step 4: Expand `.env.example` without secrets**

Document all fields with development-safe values, including `DJANGO_DEBUG=True`, a replace-me secret, hosts, CORS origins, DB fields, and log level.

- [ ] **Step 5: Run checks/tests and commit in backend repository**

Run: `.venv/bin/python manage.py check`

Run: `.venv/bin/python manage.py test blog`

Expected: PASS.

```bash
git add blog/settings.py blog/urls.py blog/exception_handler.py blog/tests.py .env.example
git commit -m "fix: make django configuration production safe"
```

---

### Task 8: Optimize Dynamic queries and replace stale backend tests

**Files:**
- Modify: `apps/dynamic/views.py`
- Modify: `apps/dynamic/models.py`
- Replace: `apps/dynamic/tests.py`
- Replace: `apps/user/tests.py`

- [ ] **Step 1: Write tests against real models and routes**

Create `User`, `Category`, `Tag`, and published/draft `Dynamic` objects. Verify public list excludes drafts, admin list requires auth, search filters title/content, retrieve returns category/tags, view count increments atomically, and invalid `limit` returns 400 instead of 500. Authentication tests must use `/api/auth/login/` and assert `data.access` and `data.refresh` according to the actual serializer output.

- [ ] **Step 2: Run tests and verify current failures**

Run: `.venv/bin/python manage.py test apps.dynamic apps.user`

Expected: FAIL on stale imports/contracts before implementation.

- [ ] **Step 3: Optimize and validate querysets**

Start list/detail querysets with:

```py
Dynamic.objects.select_related('author', 'category').prefetch_related('tags', 'files')
```

Use DRF serializers for retrieve responses instead of manually rebuilding fields. Validate sort fields and integer limits against allowlists; return a 400 validation response for invalid input. Remove broad `except Exception` blocks that expose exception strings.

- [ ] **Step 4: Make counters atomic**

Use `F('view_count') + 1` for views and a transaction around unique `DynamicLike` creation plus `F('like_count') + 1` for likes. Preserve the existing response keys used by the frontend.

- [ ] **Step 5: Run backend suite and commit**

Run: `.venv/bin/python manage.py test`

Run: `.venv/bin/python manage.py check --deploy`

Expected: tests pass; deployment check may retain only documented HTTPS/proxy warnings that depend on the deployment environment.

```bash
git add apps/dynamic apps/user/tests.py
git commit -m "refactor: optimize dynamic api and restore backend tests"
```

---

### Task 9: Rewrite developer and deployment documentation

**Files:**
- Modify: `myblog-admin/README.md`
- Replace: `myblog-admin/docs/DEV_GUIDE.md`
- Modify: `myblog-admin/docs/API_REFERENCE.md`
- Replace: `myblog-admin/docs/DEPLOY.md`
- Modify: `blog_li/README.md`
- Replace: `blog_li/docs/development.md`
- Modify: `blog_li/docs/api.md`
- Replace: `blog_li/docs/deployment.md`

- [ ] **Step 1: Rewrite frontend onboarding**

Document the actual public/admin split, real `src` structure, required Node version, `npm ci`, `npm run dev`, `npm run test:ci`, `npm run build`, API proxy assumptions, environment variables, design tokens, HTTP client, and troubleshooting. Use port 3000 because `vite.config.js` defines it.

- [ ] **Step 2: Rewrite backend onboarding**

Document only real directories and dependencies. Use `python3 -m venv .venv`, `.venv/bin/pip install -r requirements.txt`, `.env.example`, `manage.py migrate`, `createsuperuser`, `test`, `check`, and `runserver`. Remove nonexistent `config/`, `requirements/dev.txt`, Redis requirement, `apps/post`, and scripts.

- [ ] **Step 3: Align API and deployment docs**

Generate the endpoint table from `blog/urls.py`, describe the common success/error envelopes and JWT refresh flow, and provide Nginx examples that route SPA HTML separately from `/api/`, `/blog/`, and `/media/`. Deployment instructions must set `DJANGO_DEBUG=False`, an explicit secret, hosts, CORS origins, MySQL, Gunicorn, static collection, HTTPS, and backups.

- [ ] **Step 4: Validate every documented command/path**

Run: `rg -n "apps/post|requirements/dev|config/settings|localhost:5173|yourusername|Redis" README.md docs`

Expected: no stale references unless explicitly marked as an example.

Run the documented frontend and backend check commands once.

- [ ] **Step 5: Commit docs in each repository**

Frontend:

```bash
git add README.md docs
git commit -m "docs: rewrite frontend development guide"
```

Backend:

```bash
git add README.md docs .env.example
git commit -m "docs: rewrite backend development guide"
```

---

### Task 10: Full verification and final review

**Files:**
- Modify only files required to fix verified regressions.

- [ ] **Step 1: Run the frontend quality gate**

Run: `npm run check`

Expected: Jest PASS and Vite production build PASS.

- [ ] **Step 2: Run the backend quality gate**

Run: `.venv/bin/python manage.py check`

Run: `.venv/bin/python manage.py test`

Expected: PASS.

- [ ] **Step 3: Run static consistency checks**

Run: `git diff --check`

Run: `rg -n "console\.(log|warn)|apps\.post|DEBUG = True|ALLOWED_HOSTS = .*\*|debug/urls|blog/test" src blog apps README.md docs`

Expected: no sensitive/debug production residue; intentional warnings or documentation examples are reviewed manually.

- [ ] **Step 4: Review responsive pages in browser**

Verify `/blog`, one article detail, `/login`, `/dashboard`, and one management list at 360, 768, 1024, and 1440 pixels. Confirm keyboard focus, mobile menus, empty/error states, no horizontal overflow, and no console errors.

- [ ] **Step 5: Inspect repository diffs and commit final fixes**

Run in both repositories: `git status --short` and `git diff --stat HEAD~1`.

Commit only verified final fixes with a scoped message. Do not commit `.venv`, `node_modules`, generated `dist`, local databases, logs, or `.env` secrets.
