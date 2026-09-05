# 云端书籍管理 App Logo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create and validate one original, bright app-icon Logo whose first read is an unmistakable open book for reading and book management, with cloud connectivity and loft-like spatial depth as secondary cues.

**Architecture:** Produce a square bitmap concept through the built-in image generation workflow, then validate the same mark at app-icon sizes and against light, dark, and monochrome backgrounds. Keep the existing application code and `public/favicon.png` unchanged until the user approves the visual asset.

**Tech Stack:** Built-in `image_gen` tool, local image inspection, and ImageMagick or macOS `sips` for deterministic preview resizing/compositing when available.

---

## File map

- Create: `design/logo/book-cloud-library-primary.png` — approved main bitmap concept after generation and iteration.
- Create: `design/logo/book-cloud-library-preview.png` — contact sheet showing the primary mark on light, dark, monochrome, and 24/32px previews.
- Create: `design/logo/book-cloud-library-notes.md` — final construction notes, color roles, and validation observations.
- Inspect only: `public/favicon.png` — existing purple “Li” favicon; do not replace it in this plan.
- Do not modify: application source, routes, components, or runtime configuration.

### Task 1: Generate the legible primary mark

- [ ] **Step 1: Use the built-in image generator with the approved prompt.**

```text
Use case: logo-brand
Asset type: square mobile app icon and brand mark concept
Primary request: Create one original, clean, modern-oriental app icon for a book reading and book-management application. The first and strongest visual read must be an unmistakable open book with a visible center spine, two clearly separated pages, page edges, and one restrained index tab or bookmark to suggest cataloging and management. The book should have gentle three-quarter depth so it reads as a real object and a useful content space, not as two symmetrical curved shapes.
Scene/backdrop: simple rounded-square icon field with generous negative space
Subject: a clearly readable open book as the dominant central object; behind it, a very restrained loft/eave line creates a quiet reading-space frame; above the book, a small cloud made from connected nodes and short network arcs expresses internet access, sync, and online management rather than weather
Style/medium: polished flat app-icon illustration, crisp vector-friendly contour, restrained depth through two or three flat layers, no text
Composition/framing: book occupies roughly 70 percent of the mark; cloud and connectivity stay secondary; loft/eave is a background accent; balanced centered square composition
Lighting/mood: bright, calm, intelligent, trustworthy, modern oriental
Color palette: warm ivory pages, deep ink-blue outlines, light sky-teal cloud/network, one small warm amber bookmark or node accent
Materials/textures: clean flat color with only a very subtle page-layer shadow; no paper grain
Text (verbatim): ""
Constraints: make the book immediately recognizable at 24px and 32px; retain a clear spine and page silhouette; keep cloud connectivity secondary; create an original mark; no brand name, initials, letters, numbers, or watermark
Avoid: abstract geometric cube, literal house, building icon, roof dominating the mark, weather-cloud illustration, generic two-lobed shape, pants-like or underwear-like book silhouette, excessive 3D, gradients, glassmorphism, dense details, copied existing app icon, superpowes or Superpowers logo style
```

Expected result: one square primary concept with the open book visibly dominant and no text or watermark.

- [ ] **Step 2: Move the selected generated image into the project asset path without overwriting existing files.**

Run a read-only check first:

```bash
mkdir -p design/logo
test ! -e design/logo/book-cloud-library-primary.png
```

Expected: the check succeeds because the new asset path does not exist. Copy the generated output to `design/logo/book-cloud-library-primary.png` only after visual inspection.

### Task 2: Validate recognition before polishing

- [ ] **Step 1: Inspect the primary asset at full size.**

Use the local image viewer and check these exact questions:

1. Is the first object unmistakably an open book?
2. Can the center spine and page separation be seen without explanation?
3. Does the cloud read as network/online connection rather than weather?
4. Is the loft/eave clearly secondary?
5. Does any contour resemble a house, cube, or pants-like shape?

Expected: all five checks pass before creating presentations.

- [ ] **Step 2: Render deterministic recognition previews.**

Use available local tooling to create a preview sheet containing the original, a 32px render, a 24px render, and a grayscale render. If ImageMagick is available, use:

```bash
magick design/logo/book-cloud-library-primary.png -resize 32x32 design/logo/book-cloud-library-32.png
magick design/logo/book-cloud-library-primary.png -resize 24x24 design/logo/book-cloud-library-24.png
magick design/logo/book-cloud-library-primary.png -colorspace Gray design/logo/book-cloud-library-mono.png
```

If `magick` is unavailable, use macOS `sips` for the two size previews and the image viewer for the monochrome check; do not substitute a different design tool or redraw the mark.

Expected: the 24px and 32px previews retain the open-book silhouette and center spine.

### Task 3: Perform one targeted iteration only if validation fails

- [ ] **Step 1: Identify the single failed recognition rule.**

Use one of these targeted changes, not a wholesale restyle:

- If the book is unclear: enlarge the book, sharpen the center spine, flatten the outer page arcs, and remove nonessential cloud detail.
- If online management is unclear: add only two or three connected nodes above the book; keep the cloud small.
- If the mark looks like a building: remove the roof/eave line or move it behind the book as a thin frame.
- If the mark resembles a pants-like shape: replace the symmetrical curved base with explicit page corners, a center crease, and visible page layers.

- [ ] **Step 2: Regenerate one revised primary concept with the single targeted change.**

Repeat the original prompt while changing only the identified failure. Save the revision as `design/logo/book-cloud-library-primary-v2.png` for comparison; do not overwrite v1.

Expected: the revised version fixes the named failure without introducing a new competing primary symbol.

### Task 4: Produce presentation variants and notes

- [ ] **Step 1: Create light, dark, and monochrome presentation backgrounds.**

Use deterministic local compositing around the approved mark:

- Light: warm ivory or very pale sky background.
- Dark: deep ink-blue background with the page shapes preserved.
- Monochrome: one ink color on transparent or ivory.

Do not redraw or add new symbols during this step.

- [ ] **Step 2: Assemble `design/logo/book-cloud-library-preview.png`.**

The preview must show the approved mark at full size, on light and dark backgrounds, and at 24px and 32px. Label only the preview panels; the Logo itself remains text-free.

Expected: a reviewer can judge legibility, brightness, and platform-icon fit in one image.

- [ ] **Step 3: Write `design/logo/book-cloud-library-notes.md`.**

Record:

- the approved primary asset filename;
- the role of the book, index/bookmark, cloud nodes, and loft/eave;
- the final palette roles;
- the result of the five recognition checks;
- whether v2 was needed and why;
- an explicit note that no existing large-company icon was copied and no superpowes design was used.

- [ ] **Step 4: Verify the final asset set and leave application code untouched.**

Run:

```bash
test -s design/logo/book-cloud-library-primary.png
test -s design/logo/book-cloud-library-preview.png
test -s design/logo/book-cloud-library-notes.md
git diff -- app src public/favicon.png || true
git status --short
```

Expected: all three design files are non-empty; there is no change to application code or `public/favicon.png`.
