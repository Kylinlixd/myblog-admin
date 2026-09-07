# Homepage Signal Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the homepage second screen as a three-line night-blue path manifesto with a semantic progress route and responsive scrubbed reveal.

**Architecture:** Keep the feature inside the existing `BlogHome.vue` because it is a single presentation chapter with no reusable data contract. Extend the existing scoped GSAP context and reduced-motion rules, and protect the authored line breaks with source-level regression tests.

**Tech Stack:** Vue 3 SFC, scoped CSS, GSAP ScrollTrigger, Jest

---

### Task 1: Lock the signal-section contract

**Files:**
- Modify: `src/views/blog/__tests__/BlogHomeExperience.spec.js`

- [ ] **Step 1: Write the failing test**

Add a test asserting that the source contains `signal-path__progress`, the three route terms, the exact three manifesto lines, `white-space: nowrap`, and a GSAP `scaleX` animation targeting the progress element.

```js
it('turns the second screen into a three-line path manifesto', () => {
  expect(source).toContain('signal-path__progress')
  expect(source).toContain('<span>问题</span>')
  expect(source).toContain('<span>判断</span>')
  expect(source).toContain('<span>构建</span>')
  expect(source).toContain('技术不是孤立的答案，')
  expect(source).toContain('而是一条从问题、判断')
  expect(source).toContain('到持续构建的路径。')
  expect(source).toContain('white-space: nowrap')
  expect(source).toContain("gsap.fromTo('.signal-path__progress'")
  expect(source).toContain('scaleX: 0')
})
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm test -- --runInBand src/views/blog/__tests__/BlogHomeExperience.spec.js`

Expected: FAIL because `signal-path__progress` and its animation are not implemented.

### Task 2: Build the path manifesto

**Files:**
- Modify: `src/views/blog/BlogHome.vue`

- [ ] **Step 1: Replace the second-screen template**

Add one ambient layer, a substantive supporting sentence, an accessible decorative route with 问题/判断/构建, a progress element, and the same three authored heading lines. Preserve `id="garden-signal"` and `scrub-reveal` so the existing navigation cue and animation scope remain valid.

- [ ] **Step 2: Extend the scoped GSAP animation**

Animate `.signal-path__progress` from `scaleX: 0` to `scaleX: 1` with a scrubbed ScrollTrigger. Enhance the existing `.scrub-reveal span` animation with a restrained blur-to-sharp transition while keeping the final opacity and position unchanged.

- [ ] **Step 3: Implement the visual and responsive contract**

Create the layered night-blue background, route track, progress glow, route term alignment, three-line color hierarchy, and desktop indentation. Set every manifesto line to `white-space: nowrap`; below 640px remove indentation and use a viewport-scaled font size that keeps all three authored lines intact. Add static final-state overrides for the progress element and text in reduced-motion mode.

- [ ] **Step 4: Run the focused test**

Run: `npm test -- --runInBand src/views/blog/__tests__/BlogHomeExperience.spec.js`

Expected: all `BlogHomeExperience` tests pass.

- [ ] **Step 5: Commit the implementation**

```bash
git add src/views/blog/BlogHome.vue src/views/blog/__tests__/BlogHomeExperience.spec.js
git commit -m "feat: refine homepage signal chapter"
```

### Task 3: Verify and deliver

**Files:**
- Modify: `docs/DELIVERY_2026-07-27.md`

- [ ] **Step 1: Run the complete quality gate**

Run: `npm run check`

Expected: all Jest suites pass and Vite production build exits successfully.

- [ ] **Step 2: Run repository checks**

Run: `npm audit --omit=dev --audit-level=high && git diff --check`

Expected: zero production vulnerabilities and no whitespace errors.

- [ ] **Step 3: Visually inspect desktop and mobile**

Verify the second screen at desktop and mobile widths: exactly three visible lines, no horizontal overflow, route progress present, following section reachable, and reduced-motion content readable.

- [ ] **Step 4: Record the delivery node**

Append the layout, motion, responsive, test, build, commit, deployment release, service, and HTTP smoke-test evidence to `docs/DELIVERY_2026-07-27.md`.

- [ ] **Step 5: Push and deploy**

Push `main`, build the verified revision, deploy it to a new `/var/www/myblog-admin/releases/<short-sha>` directory, atomically switch `current`, validate and reload Nginx, remove transfer archives, and confirm `/`, `/blog`, `/dashboard`, the blog API, and the new asset return HTTP 200.
