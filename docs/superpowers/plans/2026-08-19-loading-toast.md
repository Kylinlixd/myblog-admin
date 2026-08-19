# Loading Toast Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the global loading toast so it matches the blog's warm paper visual system without changing loading behavior.

**Architecture:** Keep `App.vue` as the single rendering boundary and `app.js` as the existing state owner. Change only the toast's color, surface, border, shadow, and motion tokens; preserve its DOM, positioning, accessibility attributes, and responsive rules.

**Tech Stack:** Vue 3 SFC, scoped CSS, Jest source assertions, Vite.

---

### Task 1: Lock the visual contract with a regression test

**Files:**
- Modify: `src/__tests__/interactionFeedback.spec.js`
- Test target: `src/App.vue`

- [ ] **Step 1: Write the failing assertions**

Add assertions that `App.vue` contains the warm paper surface, blog ink, muted metadata, teal accent, and reduced-motion rule:

```js
expect(source).toContain('background: rgb(255 253 248 / 94%)')
expect(source).toContain('color: var(--blog-text)')
expect(source).toContain('color: var(--blog-text-muted)')
expect(source).toContain('#2a7180')
expect(source).toContain('prefers-reduced-motion: reduce')
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- --runInBand src/__tests__/interactionFeedback.spec.js`

Expected: the new color assertions fail because the current toast still uses the dark navy palette.

### Task 2: Implement the A loading toast theme

**Files:**
- Modify: `src/App.vue:57-139`

- [ ] **Step 1: Replace only toast presentation tokens**

Keep the existing template and state behavior. Update the style rules so the toast uses:

```css
.loading-toast {
  border: 1px solid var(--blog-line, #e9e3d8);
  border-radius: 18px;
  background: rgb(255 253 248 / 94%);
  box-shadow: 0 16px 34px rgb(88 65 37 / 12%);
  color: var(--blog-text, #243041);
  backdrop-filter: blur(16px);
}

.loading-toast__status {
  border-color: rgb(42 113 128 / 42%);
  background: rgb(42 113 128 / 8%);
  color: #2a7180;
}

.loading-toast__status::before {
  border-color: #2a7180 transparent transparent;
}

.loading-toast__status i {
  border-color: #2a7180 transparent transparent;
}

.loading-toast__copy strong { color: var(--blog-text, #243041); }
.loading-toast__copy > span { color: var(--blog-text-muted, #718096); }
```

Preserve the existing mobile width, safe-area inset, transition, and reduced-motion selectors.

- [ ] **Step 2: Run the focused test and verify it passes**

Run: `npm test -- --runInBand src/__tests__/interactionFeedback.spec.js`

Expected: PASS.

### Task 3: Verify the visual result

**Files:**
- Verify: `src/App.vue`
- Verify: `src/__tests__/interactionFeedback.spec.js`

- [ ] **Step 1: Run static checks**

Run: `git diff --check` and `npm test -- --listTests`.

Expected: no whitespace errors and the interaction feedback test is listed.

- [ ] **Step 2: Build or report the existing build limitation**

Run: `npm run build`.

Expected: Vite completes successfully; if the existing icon dependency graph exceeds the command timeout, keep the source/test verification evidence and report the build limitation explicitly.

- [ ] **Step 3: Browser-check the toast**

Open the local app, trigger a route/API loading state, and confirm the toast is warm white with teal accents, readable text, and no layout change.

