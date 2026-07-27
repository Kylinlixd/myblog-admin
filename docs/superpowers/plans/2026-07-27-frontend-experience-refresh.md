# Frontend Experience Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the approved night-blue public blog, responsive interaction feedback, a safer publishing workspace, and evidence-based frontend cleanup.

**Architecture:** Keep the existing Vue 3 application and shared API layer. Limit GSAP to `BlogHome.vue`, reuse Ant Design Vue and shared async components in the workspace, and extract only editor draft/payload logic that can be tested independently.

**Tech Stack:** Vue 3, Vue Router, Pinia, Vite, Ant Design Vue, GSAP ScrollTrigger, Jest, Sass.

---

### Task 1: Establish the frontend verification baseline

**Files:**
- Modify: `package.json`
- Test: existing Jest suite

- [ ] **Step 1: Install the locked dependency tree and run the current suite**

Run: `npm ci && npm run test:ci`

Expected: existing tests pass before feature changes.

- [ ] **Step 2: Add GSAP as the only new runtime dependency**

Run: `npm install gsap@^3.13.0`

Expected: `package.json` and `package-lock.json` contain `gsap`; no React adapter is added to this Vue application.

- [ ] **Step 3: Commit the dependency baseline**

```bash
git add package.json package-lock.json
git commit -m "build: add scoped homepage motion dependency"
```

### Task 2: Add route and press feedback

**Files:**
- Modify: `src/main.js`
- Modify: `src/styles/global.scss`
- Modify: `src/styles/nprogress.scss`
- Test: `src/__tests__/interactionFeedback.spec.js`

- [ ] **Step 1: Write the failing source contract test**

```js
import fs from 'node:fs'
import path from 'node:path'

describe('global interaction feedback', () => {
  it('connects router navigation to NProgress', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/main.js'), 'utf8')
    expect(source).toContain("import NProgress from 'nprogress'")
    expect(source).toContain('NProgress.start()')
    expect(source).toContain('NProgress.done()')
  })

  it('provides touch, focus, and reduced-motion fallbacks', () => {
    const css = fs.readFileSync(path.join(process.cwd(), 'src/styles/global.scss'), 'utf8')
    expect(css).toContain(':focus-visible')
    expect(css).toContain(':active')
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
  })
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm run test:ci -- src/__tests__/interactionFeedback.spec.js`

Expected: FAIL because NProgress is not wired and the global interaction rules are absent.

- [ ] **Step 3: Wire route progress and native interaction states**

```js
import NProgress from 'nprogress'

router.beforeEach(() => {
  NProgress.start()
})

router.afterEach(() => {
  NProgress.done()
})

router.onError(() => {
  NProgress.done()
})
```

```scss
:where(a, button, [role='button']) {
  -webkit-tap-highlight-color: transparent;
}

:where(a, button, [role='button']):active {
  transform: scale(.98);
}

:where(a, button, input, select, textarea, [tabindex]):focus-visible {
  outline: 3px solid color-mix(in srgb, var(--color-primary) 45%, transparent);
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
}
```

- [ ] **Step 4: Run the focused test**

Run: `npm run test:ci -- src/__tests__/interactionFeedback.spec.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/main.js src/styles/global.scss src/styles/nprogress.scss src/__tests__/interactionFeedback.spec.js
git commit -m "feat: add responsive interaction feedback"
```

### Task 3: Build the balanced public navigation

**Files:**
- Modify: `src/layouts/BlogLayout.vue`
- Modify: `src/layouts/__tests__/BlogLayoutNavigation.spec.js`

- [ ] **Step 1: Extend navigation tests**

```js
it('uses a balanced floating navigation with accessible mobile state', () => {
  const source = readLayout()
  expect(source).toContain('class="site-header-panel"')
  expect(source).toContain(':aria-expanded="mobileOpen"')
  expect(source).toContain('aria-controls="mobile-navigation"')
  expect(source).toContain('id="mobile-navigation"')
  expect(source).toContain('@keydown.esc="mobileOpen = false"')
})
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm run test:ci -- src/layouts/__tests__/BlogLayoutNavigation.spec.js`

Expected: FAIL on the new shell and accessibility contracts.

- [ ] **Step 3: Implement the responsive navigation structure**

```vue
<header class="site-header" @keydown.esc="mobileOpen = false">
  <div class="site-header-panel app-container">
    <router-link class="brand" to="/blog">LIXD <small>DIGITAL GARDEN</small></router-link>
    <nav class="desktop-nav" aria-label="主导航">...</nav>
    <div class="header-actions">...</div>
    <button
      class="menu-button"
      type="button"
      aria-controls="mobile-navigation"
      :aria-expanded="mobileOpen"
      @click="mobileOpen = !mobileOpen"
    >...</button>
  </div>
  <nav v-if="mobileOpen" id="mobile-navigation" class="mobile-nav" aria-label="移动端导航">...</nav>
</header>
```

The desktop grid is `minmax(180px,1fr) auto minmax(240px,1fr)`; mobile retains brand, search submit, and menu controls with 44px targets.

- [ ] **Step 4: Run navigation tests and build**

Run: `npm run test:ci -- src/layouts/__tests__/BlogLayoutNavigation.spec.js && npm run build`

Expected: PASS and a successful Vite build.

- [ ] **Step 5: Commit**

```bash
git add src/layouts/BlogLayout.vue src/layouts/__tests__/BlogLayoutNavigation.spec.js
git commit -m "feat: rebuild public navigation"
```

### Task 4: Build the night-blue homepage and scoped GSAP motion

**Files:**
- Modify: `src/views/blog/BlogHome.vue`
- Create: `src/views/blog/__tests__/BlogHomeExperience.spec.js`
- Modify: `src/styles/theme.scss`

- [ ] **Step 1: Write the failing homepage contract test**

```js
import fs from 'node:fs'
import path from 'node:path'

const source = fs.readFileSync(path.join(process.cwd(), 'src/views/blog/BlogHome.vue'), 'utf8')

describe('night-blue blog homepage', () => {
  it('keeps the hero wide and the bento grid dense', () => {
    expect(source).toContain('hero-feature')
    expect(source).toContain('grid-auto-flow: dense')
    expect(source).toContain('grid-template-columns: repeat(12')
  })

  it('scopes motion and honors reduced motion', () => {
    expect(source).toContain("from 'gsap'")
    expect(source).toContain("from 'gsap/ScrollTrigger'")
    expect(source).toContain('prefers-reduced-motion: reduce')
  })
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm run test:ci -- src/views/blog/__tests__/BlogHomeExperience.spec.js`

Expected: FAIL because the approved homepage structure is absent.

- [ ] **Step 3: Implement the AIDA data mapping and motion lifecycle**

```js
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const featured = computed(() => latest.value.find((item) => item.mediaUrls?.length) || latest.value[0])
let motionContext

async function setupMotion() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  await nextTick()
  motionContext = gsap.context(() => {
    gsap.utils.toArray('.story-card').forEach((card) => {
      gsap.fromTo(card, { scale: .88, opacity: .45 }, {
        scale: 1,
        opacity: 1,
        scrollTrigger: { trigger: card, start: 'top 86%', end: 'top 40%', scrub: true }
      })
    })
  })
}

onBeforeUnmount(() => motionContext?.revert())
```

The template includes navigation-safe actions, a two-line hero, exactly one 7x2 and two 5x1 bento cards, stacked story cards, category accordion links, and the archive/search CTA. The root is `overflow-x: hidden; width: 100%; max-width: 100%`.

- [ ] **Step 4: Run the homepage test and production build**

Run: `npm run test:ci -- src/views/blog/__tests__/BlogHomeExperience.spec.js && npm run build`

Expected: PASS; GSAP appears only in the homepage route chunk.

- [ ] **Step 5: Commit**

```bash
git add src/views/blog/BlogHome.vue src/views/blog/__tests__/BlogHomeExperience.spec.js src/styles/theme.scss
git commit -m "feat: create night-blue digital garden homepage"
```

### Task 5: Unify public reading cards and async states

**Files:**
- Modify: `src/components/blog/ArticleCard.vue`
- Modify: `src/components/common/AsyncState.vue`
- Modify: `src/views/blog/BlogDynamic.vue`
- Modify: `src/views/blog/BlogDynamicDetail.vue`
- Test: `src/components/blog/__tests__/ArticleCard.spec.js`
- Create: `src/components/common/__tests__/AsyncState.spec.js`

- [ ] **Step 1: Add tests for image fallback, retry, and non-blocking skeleton state**

```js
expect(articleCardSource).toContain('article-card__media--fallback')
expect(articleCardSource).toContain('loading="lazy"')
expect(asyncStateSource).toContain('state-skeleton')
expect(asyncStateSource).toContain("$emit('retry')")
```

- [ ] **Step 2: Run the focused tests and verify they fail**

Run: `npm run test:ci -- src/components/blog/__tests__/ArticleCard.spec.js src/components/common/__tests__/AsyncState.spec.js`

Expected: FAIL on the new media and skeleton contracts.

- [ ] **Step 3: Implement shared reading states**

Use an aspect-ratio media wrapper, lazy images with `@load` opacity transition, an ambient gradient fallback, three skeleton rows for loading, explicit error text plus retry, and the existing empty-state copy. Remove response-shape branching already covered by `normalizeCollectionResponse`.

- [ ] **Step 4: Run public component tests**

Run: `npm run test:ci -- src/components/blog/__tests__/ArticleCard.spec.js src/components/common/__tests__/AsyncState.spec.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/blog/ArticleCard.vue src/components/common/AsyncState.vue src/views/blog/BlogDynamic.vue src/views/blog/BlogDynamicDetail.vue src/components/blog/__tests__/ArticleCard.spec.js src/components/common/__tests__/AsyncState.spec.js
git commit -m "feat: unify public reading states"
```

### Task 6: Protect editor work and simplify the save payload

**Files:**
- Create: `src/views/dynamics/editorDraft.js`
- Create: `src/views/dynamics/__tests__/editorDraft.spec.js`
- Modify: `src/views/dynamics/DynamicEdit.vue`
- Modify: `src/api/dynamic.js`
- Modify: `src/api/__tests__/dynamic.spec.js`

- [ ] **Step 1: Write failing draft helper tests**

```js
import { clearEditorDraft, loadEditorDraft, saveEditorDraft } from '../editorDraft'

it('round-trips a scoped draft without credentials', () => {
  saveEditorDraft('new', { title: '草稿', content: '正文' })
  expect(loadEditorDraft('new')).toMatchObject({ title: '草稿', content: '正文' })
  clearEditorDraft('new')
  expect(loadEditorDraft('new')).toBeNull()
})
```

- [ ] **Step 2: Run the helper test and verify it fails**

Run: `npm run test:ci -- src/views/dynamics/__tests__/editorDraft.spec.js`

Expected: FAIL because `editorDraft.js` does not exist.

- [ ] **Step 3: Implement the local draft helper**

```js
const key = (id) => `kylin:editor-draft:${id}`

export function saveEditorDraft(id, value) {
  localStorage.setItem(key(id), JSON.stringify({ ...value, savedAt: Date.now() }))
}

export function loadEditorDraft(id) {
  try { return JSON.parse(localStorage.getItem(key(id))) }
  catch { return null }
}

export function clearEditorDraft(id) {
  localStorage.removeItem(key(id))
}
```

- [ ] **Step 4: Integrate debounced save, recovery, beforeunload, and button loading**

Use a 700ms native `setTimeout` watcher, recover only when the local draft is newer than the fetched article, add/remove one `beforeunload` listener, set `saving` before the request, clear the draft only after a successful response, and bind `:loading="saving" :disabled="saving"` to save/publish actions.

- [ ] **Step 5: Run editor and API tests**

Run: `npm run test:ci -- src/views/dynamics/__tests__/editorDraft.spec.js src/api/__tests__/dynamic.spec.js`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/views/dynamics/editorDraft.js src/views/dynamics/__tests__/editorDraft.spec.js src/views/dynamics/DynamicEdit.vue src/api/dynamic.js src/api/__tests__/dynamic.spec.js
git commit -m "feat: protect article editing workflow"
```

### Task 7: Remove public registration and verified dead frontend code

**Files:**
- Modify: `src/router/index.js`
- Modify: `src/views/Login.vue`
- Create: `src/router/__tests__/publicRoutes.spec.js`
- Delete only after `rg` verification: `src/views/Register.vue`, `src/views/register/`, `src/views/Debug.vue`, `src/utils/corsTest.js`, `src/style.css`, and other files proven to have no imports or routes
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Write the failing route test**

```js
import router from '../index'

it('does not expose public registration or diagnostics', () => {
  const paths = router.getRoutes().map((route) => route.path)
  expect(paths).not.toContain('/register')
  expect(paths).not.toContain('/debug')
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm run test:ci -- src/router/__tests__/publicRoutes.spec.js`

Expected: FAIL because `/register` and `/debug` are currently routed.

- [ ] **Step 3: Prove deletion candidates are unused**

Run one `rg -n` search per candidate basename across `src`, `public`, config, and tests. Remove only candidates whose only hit is their own file or the route/import being removed in this task.

- [ ] **Step 4: Remove routes, links, files, logs, and unused dependencies**

Delete the public register/debug records, remove the login registration link, delete verified dead files, and remove packages with zero runtime/build/test imports. Keep error logs that do not expose payloads; remove debug payload/file/token logging.

- [ ] **Step 5: Run the route test, full suite, and build**

Run: `npm run test:ci -- src/router/__tests__/publicRoutes.spec.js && npm run check`

Expected: all tests and the production build pass.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: remove legacy frontend paths"
```

### Task 8: Record and verify the frontend delivery node

**Files:**
- Create: `docs/DELIVERY_2026-07-27.md`

- [ ] **Step 1: Run final frontend verification**

Run: `npm run check && git diff --check && git status --short`

Expected: tests and build pass; no whitespace errors; only the delivery log is uncommitted.

- [ ] **Step 2: Record evidence**

Add a `Frontend` section with the commit range, test count, build result, main UX changes, deleted files/dependencies, and known out-of-scope items.

- [ ] **Step 3: Commit**

```bash
git add docs/DELIVERY_2026-07-27.md
git commit -m "docs: record frontend refresh delivery"
```

