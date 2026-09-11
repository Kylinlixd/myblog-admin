# Markdown Mac Code Window Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Render every fenced Markdown code block in the blog list, blog detail, and admin preview as a consistent light Mac-style code window with safe syntax highlighting, line numbers, copy, collapse, and mobile overflow behavior.

**Architecture:** A shared Markdown-it factory registers a `macCodeWindow` fence renderer and accepts the existing highlight.js callback. The renderer emits static, sanitized markup; a shared DOM binder wires copy/collapse controls after Vue updates. Shared global CSS owns the visual treatment, while each page keeps its existing content truncation or full-content behavior.

**Tech Stack:** Vue 3 `<script setup>`, Markdown-it 14, highlight.js 11, DOMPurify, Jest + jsdom, Sass.

---

## File map

- Create `src/utils/markdownRenderer.js`: shared Markdown-it factory and `macCodeWindow` fence renderer.
- Create `src/utils/__tests__/markdownRenderer.spec.js`: renderer output and escaping tests.
- Modify `src/utils/blogCodeBlocks.js`: retain legacy wrapper compatibility and add idempotent event binding for plugin output.
- Modify `src/utils/__tests__/blogCodeBlocks.spec.js`: cover plugin markup binding, copy fallback, collapse state, and repeated binding.
- Modify `src/views/blog/BlogDynamic.vue`: use the shared renderer and bind code window controls for truncated cards.
- Modify `src/views/blog/BlogDynamicDetail.vue`: use the shared renderer, retain highlight.js language registration, bind controls after content updates, and remove duplicate local wrapper generation.
- Modify `src/views/dynamics/DynamicPreview.vue`: use the shared renderer and bind controls after preview content updates.
- Create `src/styles/blog-code-window.scss`: global responsive Mac window styles.
- Modify `src/styles/main.scss`: import the shared code window stylesheet.
- Modify `src/views/blog/BlogDynamicDetail.vue`: remove the old scoped code window declarations after the global stylesheet is in place.

### Task 1: Add failing renderer tests

**Files:**
- Create: `src/utils/__tests__/markdownRenderer.spec.js`

- [x] **Step 1: Write the failing tests**

```js
import { createMarkdownRenderer } from '../markdownRenderer'

describe('createMarkdownRenderer', () => {
  it('renders fenced code as a Mac window with language, line numbers and controls', () => {
    const md = createMarkdownRenderer({ highlight: (code) => `<span>${code}</span>` })
    const html = md.render('```json\n{"ok": true}\n```')

    expect(html).toContain('class="blog-code-window"')
    expect(html).toContain('data-blog-code-window="true"')
    expect(html).toContain('class="blog-code-language">json</span>')
    expect(html).toContain('class="blog-code-lines"')
    expect(html).toContain('1\n2')
    expect(html).toContain('data-blog-code-action="collapse"')
    expect(html).toContain('data-blog-code-action="copy"')
  })

  it('escapes unknown-language code and attributes without executing markup', () => {
    const md = createMarkdownRenderer()
    const html = md.render('```unknown\n<script>alert(1)</script>\n```')

    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('data-language="unknown"')
  })

  it('renders empty fences and language aliases without throwing', () => {
    const md = createMarkdownRenderer()
    expect(() => md.render('```\n```')).not.toThrow()
    expect(md.render('```js\nconst answer = 42\n```')).toContain('data-language="js"')
  })
})
```

- [x] **Step 2: Run the focused test and confirm it fails**

Run:

```bash
npm test -- --runInBand src/utils/__tests__/markdownRenderer.spec.js
```

Expected: FAIL because `src/utils/markdownRenderer.js` does not exist.

- [x] **Step 3: Commit the red tests**

```bash
git add src/utils/__tests__/markdownRenderer.spec.js
git commit -m "test: specify markdown mac code renderer"
```

### Task 2: Implement the Markdown-it Mac window renderer

**Files:**
- Create: `src/utils/markdownRenderer.js`

- [x] **Step 1: Implement the shared factory and fence renderer**

Implement `createMarkdownRenderer({ highlight } = {})` with the existing options `html: true`, `linkify: true`, and `typographer: true`. Register a `macCodeWindow` plugin that replaces `md.renderer.rules.fence` and emits this exact semantic shape:

```js
<pre class="blog-code-window" data-blog-code-window="true" data-language="json">
  <div class="blog-code-header">
    <span class="blog-code-dots" aria-hidden="true"><i></i><i></i><i></i></span>
    <span class="blog-code-language">json</span>
    <span class="blog-code-actions">
      <button type="button" class="blog-code-action blog-code-collapse" data-blog-code-action="collapse" aria-expanded="true" aria-label="折叠json代码">⌄</button>
      <button type="button" class="blog-code-action blog-code-copy" data-blog-code-action="copy" aria-label="复制json代码">复制</button>
    </span>
  </div>
  <div class="blog-code-body">
    <span class="blog-code-lines" aria-hidden="true">1\n2</span>
    <div class="blog-code-content"><code class="language-json">...</code></div>
  </div>
</pre>
```

Use `token.info.trim().split(/\s+/)[0] || 'text'` for the language, `md.utils.escapeHtml` for language and attributes, `token.content` for raw copy data, and `highlight(token.content, language)` only when the callback returns highlighted HTML. When highlighting is unavailable, escape the code text. Preserve the final newline behavior so line numbers equal `Math.max(1, token.content.split('\n').length)`.

- [x] **Step 2: Run the focused renderer tests**

Run:

```bash
npm test -- --runInBand src/utils/__tests__/markdownRenderer.spec.js
```

Expected: PASS.

- [x] **Step 3: Commit the renderer**

```bash
git add src/utils/markdownRenderer.js src/utils/__tests__/markdownRenderer.spec.js
git commit -m "feat: render markdown code as mac windows"
```

### Task 3: Bind copy and collapse controls safely

**Files:**
- Modify: `src/utils/blogCodeBlocks.js`
- Modify: `src/utils/__tests__/blogCodeBlocks.spec.js`

- [x] **Step 1: Extend tests for plugin output and idempotent binding**

Add tests that render a code window with `createMarkdownRenderer`, call `bindCodeBlockInteractions(root)` twice, click the collapse button, and assert `aria-expanded="false"` plus `.is-collapsed`. Mock `navigator.clipboard.writeText` and assert the exact raw code is copied. Delete `navigator.clipboard` in a second test and assert the textarea fallback receives the raw code. Keep the existing legacy `enhanceCodeBlocks` tests until all page consumers are migrated.

```js
const root = document.createElement('div')
root.innerHTML = createMarkdownRenderer().render('```js\nconst answer = 42\n```')
bindCodeBlockInteractions(root)
bindCodeBlockInteractions(root)
root.querySelector('[data-blog-code-action="collapse"]').click()
expect(root.querySelector('pre')).toHaveClass('is-collapsed')
expect(root.querySelector('[data-blog-code-action="collapse"]')).toHaveAttribute('aria-expanded', 'false')
```

- [x] **Step 2: Run the focused interaction tests and confirm the new cases fail**

Run:

```bash
npm test -- --runInBand src/utils/__tests__/blogCodeBlocks.spec.js
```

Expected: the existing compatibility tests pass, while the new binder assertions fail because `bindCodeBlockInteractions` is not exported.

- [x] **Step 3: Implement `bindCodeBlockInteractions(root)`**

Export an idempotent binder that finds `pre[data-blog-code-window="true"]`, skips `data-blog-code-bound="true"`, stores the raw code in `data-blog-code-copy` or reads it from the nested `<code>`, and attaches only the marked collapse/copy buttons. Keep `enhanceCodeBlocks(root)` as a compatibility wrapper: it may wrap legacy plain `<pre><code>` nodes, then call `bindCodeBlockInteractions(root)`. Do not add inline event attributes.

- [x] **Step 4: Run interaction tests and commit**

Run:

```bash
npm test -- --runInBand src/utils/__tests__/blogCodeBlocks.spec.js
```

Expected: PASS.

```bash
git add src/utils/blogCodeBlocks.js src/utils/__tests__/blogCodeBlocks.spec.js
git commit -m "feat: bind markdown code window actions"
```

### Task 4: Integrate all three Markdown renderers

**Files:**
- Modify: `src/views/blog/BlogDynamic.vue`
- Modify: `src/views/blog/BlogDynamicDetail.vue`
- Modify: `src/views/dynamics/DynamicPreview.vue`

- [x] **Step 1: Update the blog list renderer**

Replace the local `new MarkdownIt(...)` instance with `createMarkdownRenderer()`. Add a `ref` around the list content root and call `bindCodeBlockInteractions` after `nextTick` in `onMounted`, `onActivated`, and after list refresh. Keep the existing HTML stripping and 200-character truncation before `md.render`.

- [x] **Step 2: Update the blog detail renderer**

Replace the local Markdown-it constructor with `createMarkdownRenderer({ highlight })`, keeping the existing highlight.js registrations and callback. In `syncArticleNavigation`, replace `enhanceCodeBlocks(articleBodyRef.value)` with `bindCodeBlockInteractions(articleBodyRef.value)` so the plugin output is not wrapped a second time. Keep DOMPurify, heading collection, lazy media, and reading progress unchanged.

- [x] **Step 3: Update the admin preview renderer**

Replace its local Markdown-it instance with `createMarkdownRenderer()`. Add `ref="previewContentRef"` to the Markdown content div and call `bindCodeBlockInteractions(previewContentRef.value)` after detail load and on Vue updates. Keep full preview content and existing media behavior.

- [x] **Step 4: Add source-level regression assertions**

Extend the existing page tests so each file contains `createMarkdownRenderer` and `bindCodeBlockInteractions`, and the detail file no longer invokes `enhanceCodeBlocks` directly for rendered article content.

- [x] **Step 5: Run focused page tests and commit**

Run:

```bash
npm test -- --runInBand src/views/blog/__tests__ src/views/dynamics/__tests__
```

Expected: PASS.

```bash
git add src/views/blog/BlogDynamic.vue src/views/blog/BlogDynamicDetail.vue src/views/dynamics/DynamicPreview.vue src/views/blog/__tests__ src/views/dynamics/__tests__
git commit -m "feat: share mac code windows across markdown views"
```

### Task 5: Move code window styling into the shared stylesheet

**Files:**
- Create: `src/styles/blog-code-window.scss`
- Modify: `src/styles/main.scss`
- Modify: `src/views/blog/BlogDynamicDetail.vue`

- [x] **Step 1: Add global styles**

Move the existing `.blog-code-window` rules into `blog-code-window.scss` without changing the established light palette. Keep the window border/radius, red-yellow-green dots, language label, line number divider, monospace body, `max-height: 560px`, internal `overflow: auto`, collapse transition, and focus-visible states. Add responsive rules at `max-width: 640px`: reduce header padding and line-number width, preserve 44px button hit areas, and set `code` to `min-width: max-content` so long lines scroll inside `.blog-code-body`.

- [x] **Step 2: Import the stylesheet**

Add this line to `src/styles/main.scss` with the other global imports:

```scss
@use './blog-code-window';
```

- [x] **Step 3: Remove duplicate detail-only declarations**

Delete the old `.article-main-column :deep(.blog-code-...)` declarations from `BlogDynamicDetail.vue`; retain only article-specific typography and table/media rules. This prevents scoped selectors from overriding list and preview styles.

- [x] **Step 4: Run style regression tests and commit**

Run:

```bash
npm test -- --runInBand src/styles/__tests__/blogCinematic.spec.js src/views/blog/__tests__/BlogDynamicDetailLayout.spec.js
```

Expected: PASS.

```bash
git add src/styles/blog-code-window.scss src/styles/main.scss src/views/blog/BlogDynamicDetail.vue
git commit -m "style: unify markdown code window presentation"
```

### Task 6: Full verification and visual checks

**Files:**
- Modify only if a test exposes a defect in the files above.

- [x] **Step 1: Run the complete test suite and production build**

Run:

```bash
npm run test:ci
npm run build
```

Expected: all Jest suites pass and Vite reports a successful production build.

- [x] **Step 2: Verify the sanitized output manually**

Use the dev server and a Markdown sample containing JSON, JavaScript, an unknown language, an empty fence, a long line, and `<script>alert(1)</script>`. Confirm the script is text, each block has its own controls, copy excludes line numbers, and collapse affects only the clicked block.

- [x] **Step 3: Check desktop and mobile rendering**

At a desktop viewport of 1440×900 and a mobile viewport of 390×844, inspect all three routes. Confirm the Mac header, controls, line numbers, internal horizontal scrolling, and no document-level horizontal overflow. Use browser console output to ensure no Vue or Markdown errors.

- [x] **Step 4: Run final diff checks and report**

Run:

```bash
git diff --check HEAD~5..HEAD
git status --short --branch
```

Report test/build results, the three integrated routes, and any remaining uncommitted unrelated task files without staging them.
