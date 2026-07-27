# Homepage Signal Section Design

## Goal

Turn the homepage second screen into a focused night-blue manifesto that makes the sentence “技术不是孤立的答案，而是一条从问题、判断到持续构建的路径。” feel like a progression rather than a static block of text.

## Direction

Use a single immersive “path manifesto” section. Keep the sentence in exactly three authored lines and preserve the existing wide editorial typography. A semantic route above the copy connects 问题、判断、构建 with a luminous progress line. The section remains one composition instead of introducing another card system.

## Layout

- The section occupies a substantial viewport chapter without delaying the following content on tall screens.
- A substantive supporting sentence replaces the isolated label treatment.
- The three route terms sit on one horizontal track on desktop and remain evenly distributed on mobile.
- The manifesto keeps these exact lines:
  1. 技术不是孤立的答案，
  2. 而是一条从问题、判断
  3. 到持续构建的路径。
- Desktop lines use restrained progressive indentation. Mobile removes indentation and uses responsive type and negative tracking so each authored line remains unbroken.

## Visual Treatment

- Layered radial light, a subtle line grid, and a restrained blue glow extend the current night-blue system.
- The first line is cool white, the second shifts toward periwinkle, and the third resolves in brighter blue-white.
- No cards, numeric section labels, badges, or decorative stock imagery are added.

## Motion and Accessibility

- GSAP scrubs each line from low-opacity outline-like text into full color while moving it slightly upward.
- A separate ScrollTrigger scales the route progress line from left to right.
- Motion is scoped to the homepage context and reverted on unmount.
- `prefers-reduced-motion: reduce` shows the final readable state with no animated transforms.
- The heading carries one complete accessible label; decorative route graphics are hidden from assistive technology.

## Responsive and Regression Requirements

- No horizontal page overflow at desktop or mobile widths.
- The manifesto remains exactly three DOM lines and each line uses `white-space: nowrap`.
- The following interest section remains reachable without an oversized empty gap.
- Existing hero, Bento, data loading, navigation, and admin behavior are unchanged.
- Add source-level regression assertions for the route, exact copy, progress animation, mobile nowrap contract, and reduced-motion fallback; run the complete test and production build gates.
