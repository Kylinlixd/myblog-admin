# Warm Garden and Admin Polish Design

## Goal

Resolve the remaining admin workflow gaps and rebuild the public experience around a warm, readable technology editorial system that feels visual and alive on desktop and mobile.

## Chosen direction

Three directions were considered:

1. Keep the night-blue shell and only lighten content cards. This is low risk but preserves the visual mismatch the user rejected.
2. Use a split light/dark site with a dark homepage and light reading pages. This improves reading but makes navigation between sections feel like switching products.
3. Rebuild the public shell as a warm daylight digital garden with ivory surfaces, navy typography, amber accents, editorial photography, and restrained technical graphics. This is the selected direction because it improves reading, keeps technology cues, and gives every public page one coherent identity.

No framework or dependency migration is required. Existing Vue, Ant Design Vue, GSAP, and API contracts remain in place.

## Admin navigation

On desktop, the sidebar collapse control moves out of the white workspace header and onto the right edge of the dark sidebar. It appears as a compact floating rail control aligned below the brand block, so it visually belongs to navigation and remains reachable in expanded and collapsed states. Mobile keeps the header menu button because the drawer still needs an entry point.

The control retains its accessible label, keyboard focus ring, persistent collapsed state, and existing 992px desktop/mobile breakpoint.

## Dashboard trend

The seven-day column chart becomes an accessible native SVG line chart. The chart uses a softly filled area, horizontal reference lines, visible data points, day labels, and focusable point groups with count labels. Its view box makes it responsive without a chart library. The existing real statistics, summaries, empty state, and API mapping remain unchanged.

## Comment management

The initial and reset filter state uses an empty status so administrators see all comments. The page adds row checkboxes, a select-all checkbox for the current page, a selected-count toolbar, and a guarded batch-delete action.

Batch deletion reuses the existing authenticated single-delete endpoint and runs selected deletions with `Promise.allSettled`. Fully successful deletion clears selection and refreshes the page. Partial failure keeps failed IDs selected and reports exact success/failure counts. The action is disabled while no rows are selected or deletion is in progress.

The generic `DataTable` owns selection rendering and emits selected row keys; comment-specific deletion behavior stays in `CommentList`.

## Public visual system

The blog shell changes from midnight blue to warm ivory (`#f4efe5` family), with ink navy text, muted brown-gray metadata, and a single amber accent. Grid and grain remain as subtle technical texture rather than dominant neon decoration. Navigation becomes a warm translucent surface with clear active states.

The homepage uses editorial asymmetry and three image moments:

- a large feature photograph beside the hero, using article media when present and a bundled visual fallback otherwise;
- a horizontal image ribbon that translates at different speeds during scroll;
- image-led article cards with warm overlays and clipped reveal animation.

GSAP motion is scoped to the homepage and uses transforms and opacity only: hero entrance, scroll-linked image drift, line-by-line manifesto reveal, image-mask opening, and layered card parallax. Reduced-motion users receive the complete static composition with no hidden content.

The existing content APIs, links, featured-content logic, sections, and manual manifesto carousel remain functional.

## Dynamic and about readability

All dynamic list and detail surfaces use bright paper-like backgrounds. Body copy uses high-contrast navy (`#243041` or darker), metadata uses a distinct muted tone, form fields are white, and comments remain readable without dark-theme overrides.

The about profile card gets an explicit public-theme surface and text contract. Its definition-list values wrap safely, remain above decorative layers, and keep sufficient contrast at desktop and mobile widths. The global public styles stop overriding local light cards with a conflicting dark `!important` background.

## Images and resilience

The existing author photograph is reused as a local, reliable fallback rather than introducing remote runtime dependencies. A dedicated warm-technology visual is derived from local assets and shipped in `public`, so the homepage remains visually complete even when articles have no media.

Images use meaningful alt text where informative, empty alt text where decorative, lazy loading below the fold, fixed aspect ratios, and object-fit cropping to avoid layout shift.

## Verification

Automated checks cover sidebar control placement, SVG line-chart structure, all-comments default filtering, table selection, batch-delete behavior markers, warm public theme variables, homepage image/motion composition, dynamic readability, and about-card value contrast.

The final gate is the complete Jest suite, production build, dependency audit, and real Chromium rendering at 1920px desktop, 1366px desktop, and 390px mobile. Browser verification checks overflow, computed colors, visible about values, comment default query parameters, and reduced-motion accessibility.
