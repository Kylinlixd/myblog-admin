# Blog Homepage Sensory Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove proven frontend bloat and turn `/blog` into a compact, asymmetric night-blue landing page with a memorable two-line hero, responsive pointer depth, and polished scroll storytelling.

**Architecture:** Keep the existing Vue 3 page, API calls, BlogLayout, and GSAP dependency. Concentrate visual changes in `BlogHome.vue`, remove only unused build/tooling files, and lock the result with existing source-contract tests plus real production builds and responsive screenshots.

**Tech Stack:** Vue 3, Vue Router, SCSS, GSAP ScrollTrigger, Jest, Vite

---

## File map

- `src/views/blog/BlogHome.vue`: hero markup, pointer interaction, scroll motion, responsive visual rules.
- `src/views/blog/__tests__/BlogHomeExperience.spec.js`: hero and motion source contracts.
- `src/__tests__/leanSource.spec.js`: obsolete-file contracts.
- `src/services/http/client.js`: native request ID generation.
- `src/main.js`, `postcss.config.js`, `package*.json`: remove unused Tailwind wiring.
- `src/components/Breadcrumb.vue`: remove unused state without changing output.
- Delete `src/styles/tailwind.css`, `tailwind.config.js`, `src/utils/uuid.js`.

### Task 1: Remove proven obsolete frontend files

**Files:**
- Modify: `src/__tests__/leanSource.spec.js`
- Modify: `src/services/http/client.js`
- Modify: `src/main.js`
- Modify: `postcss.config.js`
- Modify: `src/components/Breadcrumb.vue`
- Modify: `package.json`
- Modify: `package-lock.json`
- Delete: `src/styles/tailwind.css`
- Delete: `tailwind.config.js`
- Delete: `src/utils/uuid.js`

- [ ] **Step 1: Write the failing cleanup contract**

Add:

```js
it('uses native request IDs and keeps unused Tailwind tooling out', () => {
  const obsoleteFiles = [
    'src/styles/tailwind.css',
    'tailwind.config.js',
    'src/utils/uuid.js'
  ]

  obsoleteFiles.forEach((file) => {
    expect(fs.existsSync(path.join(process.cwd(), file))).toBe(false)
  })

  const client = fs.readFileSync(path.join(process.cwd(), 'src/services/http/client.js'), 'utf8')
  expect(client).toContain('crypto.randomUUID()')
  expect(client).not.toContain("@/utils/uuid")
})
```

- [ ] **Step 2: Verify RED**

Run: `npm run test:ci -- src/__tests__/leanSource.spec.js`

Expected: FAIL because the files exist and the client imports `generateRequestId`.

- [ ] **Step 3: Apply the minimal cleanup**

Set the request ID in `client.js`:

```js
config.headers['X-Request-ID'] = crypto.randomUUID()
```

Remove the Tailwind import from `main.js`. Keep only Autoprefixer:

```js
export default {
  plugins: {
    autoprefixer: {},
  },
}
```

Delete the three obsolete files, run `npm uninstall --save-dev tailwindcss tailwindcss-animate`, and reduce Breadcrumb setup to:

```js
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
```

- [ ] **Step 4: Verify GREEN**

Run:

```bash
npm run test:ci -- src/__tests__/leanSource.spec.js
npm run build
git diff --check
```

Expected: tests and Vite build pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: remove unused frontend tooling"
```

### Task 2: Build the asymmetric hero contract

**Files:**
- Modify: `src/views/blog/__tests__/BlogHomeExperience.spec.js`
- Modify: `src/views/blog/BlogHome.vue`

- [ ] **Step 1: Write the failing hero contract**

```js
it('builds an asymmetric two-line hero with inline media', () => {
  expect(source).toContain('class="hero-stage"')
  expect(source).toContain('hero-title__portal')
  expect(source).toContain('hero-scroll-cue')
  expect(source).toContain('aria-label="探索技术，无限可能"')
  expect(source).not.toContain('SCROLL TO EXPLORE · 01')
  expect(source).not.toContain('CREATION PRINCIPLES · 03')
})
```

- [ ] **Step 2: Verify RED**

Run: `npm run test:ci -- src/views/blog/__tests__/BlogHomeExperience.spec.js`

Expected: FAIL because the new hero stage is absent.

- [ ] **Step 3: Implement the hero structure**

Keep the existing data and routes. Render exactly two title lines:

```vue
<h1 class="hero-title" aria-label="探索技术，无限可能">
  <span class="hero-title__line">探索技术</span>
  <span class="hero-title__line hero-title__line--accent" aria-hidden="true">
    <span>无限</span>
    <span class="hero-title__portal">
      <img v-if="featured && mediaUrl(featured)" :src="mediaUrl(featured)" alt="" />
    </span>
    <span>可能</span>
  </span>
</h1>
```

Place the existing featured link beside the copy. Add `href="#garden-signal"` as the scroll cue and assign the next section `id="garden-signal"`. Replace numbered English labels with `沿着问题继续` and `创作方法`.

- [ ] **Step 4: Verify GREEN**

Run:

```bash
npm run test:ci -- src/views/blog/__tests__/BlogHomeExperience.spec.js
npm run build
git diff --check
```

Expected: homepage tests and production build pass.

- [ ] **Step 5: Commit**

```bash
git add src/views/blog/BlogHome.vue src/views/blog/__tests__/BlogHomeExperience.spec.js
git commit -m "feat: reshape blog homepage hero"
```

### Task 3: Add restrained depth and scroll choreography

**Files:**
- Modify: `src/views/blog/__tests__/BlogHomeExperience.spec.js`
- Modify: `src/views/blog/BlogHome.vue`

- [ ] **Step 1: Extend the failing motion contract**

```js
it('adds responsive depth without bypassing reduced motion', () => {
  expect(source).toContain('--hero-pointer-x')
  expect(source).toContain('gsap.quickTo')
  expect(source).toContain("pin: '.story-intro'")
  expect(source).toContain("window.matchMedia('(prefers-reduced-motion: reduce)')")
  expect(source).toContain('@media (hover: none)')
})
```

- [ ] **Step 2: Verify RED**

Run: `npm run test:ci -- src/views/blog/__tests__/BlogHomeExperience.spec.js`

Expected: FAIL because pointer depth and explicit pinning are absent.

- [ ] **Step 3: Implement motion**

Add `@pointermove="moveHero"` and `@pointerleave="resetHero"`. Use `gsap.quickTo` for low-amplitude feature rotation and CSS variables for the spotlight. Skip pointer depth on coarse pointers or reduced motion.

Inside the existing GSAP context, add:

```js
ScrollTrigger.create({
  trigger: '.story-section',
  start: 'top top+=110',
  end: 'bottom bottom-=110',
  pin: '.story-intro',
  pinSpacing: false
})
```

Update scoped CSS to use a 7/5 desktop hero grid, approximately one viewport of height, `line-height: .88`, inline portal media, glass edge refraction, one-column mobile layout, touch tilt disablement, and full reduced-motion visibility. Preserve the exact 24-cell bento math.

- [ ] **Step 4: Run full verification**

```bash
npm run test:ci -- src/views/blog/__tests__/BlogHomeExperience.spec.js
npm run check
git diff --check
```

Expected: all Jest suites and Vite build pass.

- [ ] **Step 5: Commit**

```bash
git add src/views/blog/BlogHome.vue src/views/blog/__tests__/BlogHomeExperience.spec.js
git commit -m "feat: add cinematic homepage depth"
```

### Task 4: Responsive visual regression and delivery

**Files:**
- Modify: `docs/DELIVERY_2026-07-27.md`

- [ ] **Step 1: Preview production**

Run: `npm run build && npm run preview -- --host 127.0.0.1 --port 4173`

Expected: `http://127.0.0.1:4173/blog` loads without horizontal overflow.

- [ ] **Step 2: Capture both breakpoints**

Capture 1080×1500 and 390×844 screenshots. Check two title lines, desktop asymmetry, continuous title/description/action rhythm, next chapter visible in the desktop capture, no mobile overlap, focus states, and reduced-motion visibility.

- [ ] **Step 3: Record delivery**

Append the deleted files, removed dependencies, responsive checks, and verification commands to `docs/DELIVERY_2026-07-27.md`.

- [ ] **Step 4: Final verification and commit**

```bash
npm run check
git diff --check
git status --short
git add docs/DELIVERY_2026-07-27.md
git commit -m "docs: record homepage sensory redesign"
```

Expected: tests and build pass and the delivery record is committed.

- [ ] **Step 5: Push**

Run: `git push origin main`

Expected: the final delivery commit reaches `Kylinlixd/myblog-admin`.

