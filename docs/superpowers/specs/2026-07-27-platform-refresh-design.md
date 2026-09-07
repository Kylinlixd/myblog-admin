# Kylin Blog Platform Refresh Design

## Goal

Deliver a coherent, production-ready personal publishing platform across the public blog, management workspace, Django API, and `leexd.top`. The refresh must improve visual hierarchy, interaction feedback, daily publishing efficiency, code maintainability, security, and deployment reliability without rewriting the existing Vue/Django architecture or risking current content.

## Delivery Order

1. Public blog visual and interaction refresh.
2. Management workspace efficiency improvements.
3. Frontend code review, dependency cleanup, and redundant-file removal.
4. Backend permission, API, and maintainability improvements.
5. GitHub push and production deployment with backup, verification, and rollback notes.

Each completed stage is recorded in `docs/DELIVERY_2026-07-27.md` with verification evidence.

## Architecture

Keep the current Vue 3/Vite single application and Django REST API. The public blog remains under `/blog`; the authenticated workspace remains under `/dashboard`. Public reading and authenticated writing continue to share API response contracts, URL helpers, and media storage.

The refresh does not split the frontend, add a native mobile application, or replace Ant Design Vue. GSAP is loaded only by the public homepage for scroll choreography. The rest of the application uses native CSS transitions and existing loading components.

## Public Blog

### Visual System

The selected direction is “Night-blue Digital Garden” using Outfit typography, deep navy surfaces, blue ambient light, cool neutral copy, and image-led editorial cards. The public shell starts with a balanced floating navigation bar: brand on the left, primary reading routes in the center, and search plus a visually quieter management entry on the right.

The homepage follows this reading path:

- Navigation: floating, translucent, keyboard accessible, and responsive.
- Attention: a centered two-line hero with two high-contrast actions and a featured cover.
- Interest: a dense 12-column, two-row content grid. A 7x2 card and two 5x1 cards occupy all 24 grid cells with no gaps.
- Desire: a pinned introduction beside stacked recent-article cards, followed by horizontal category accordions.
- Action: search and archive calls to action followed by a compact footer.

The hero automatically uses the most recent published article that has an image. If no suitable image exists, it uses the night-blue ambient fallback. This avoids a new database field and keeps publishing maintenance minimal.

Article lists, search, category, tag, article detail, and about pages inherit the same tokens, navigation, cards, spacing, and state treatment. Long-form pages prioritize line length, heading rhythm, code readability, media scaling, and mobile typography over decorative motion.

### Interaction and Responsive Behavior

Desktop, tablet, and mobile browsers use one responsive implementation. Navigation condenses to brand, search, and menu controls on narrow screens. Touch targets are at least 44px. Clickable cards, buttons, links, and media provide immediate pressed, hover, focus, loading, success, and error feedback.

Route changes use the installed NProgress dependency. Content fetches use skeleton or `AsyncState` feedback rather than blocking page spinners. Images use reserved aspect ratios and progressive opacity to prevent layout shift. Submitting controls disable repeated requests while showing progress. Failures preserve user context and offer retry.

Homepage motion uses GSAP ScrollTrigger for pinned content and image scale/fade. Mobile layouts reduce pinning and stacking to simpler reveals. `prefers-reduced-motion` disables scrubbing, continuous marquees, and large transforms.

## Management Workspace

The management shell keeps a dark navigation rail and uses a low-fatigue light content workspace. Navigation is grouped around Overview, Writing, Content, Interaction, and Resources. The public-blog link and account actions remain visible without competing with primary tasks.

### Writing and Publishing

The article editor becomes a focused two-column workspace: title and Markdown content on the left, publication state, category, tags, cover/media, and type on a sticky right rail. Primary actions are Preview, Save Draft, and Publish. On mobile these actions move into a sticky bottom bar.

The editor retains direct uploads and file-library selection. Local draft recovery and an unsaved-change guard protect long-form work without requiring a new backend autosave API. Loading buttons prevent duplicate saves. Preview reuses the public article rendering path so preview and production output remain consistent.

The current oversized editor is reduced by deleting unreachable paths and extracting only boundaries that carry their own behavior: media selection and pure payload normalization. No speculative component framework is introduced.

### Content, Comments, and Files

Content management provides clear status filters, text/category/tag search, row actions, and existing bulk operations with consistent confirmation and feedback. Destructive actions show the target and require confirmation. Where the current API can safely support it, a short client-side undo window delays irreversible deletion; otherwise the UI uses explicit confirmation.

Comments prioritize pending review and show article context. File management standardizes search, type filtering, upload progress, retry, preview, and deletion errors. Existing shared table, page-header, pagination, and async-state components are reused before new code is added.

### Authentication

Public registration is removed from the frontend. The backend registration action is no longer anonymous and is limited to authenticated administrators. Existing accounts and login behavior remain intact. Session initialization, expiration handling, logout, and redirect behavior retain their focused tests.

## Code Review and Cleanup

The cleanup is evidence-based. A file or dependency is removed only after import, route, test, and build references are checked.

Expected targets include the public debug route and diagnostic-only view, unused legacy editors and route wrappers, the untouched Vite starter stylesheet, obsolete CORS/migration helpers, duplicate store/API helpers, production debug logs, and dependencies with no runtime or build consumers. Large-file refactoring is limited to paths changed by this refresh.

Console logging that exposes payloads, tokens, user input, URLs, or file metadata is removed. Intentional error reporting remains concise and excludes secrets. The build must not embed server credentials, deployment passwords, or environment files.

## Backend API

Public list/detail/category/tag/comment-read endpoints remain anonymous where intended. Write, moderation, upload, dashboard, and user-management endpoints require authentication, with user creation restricted to administrators.

Dynamic/article response normalization is consolidated where it removes verified duplication. Updates must preserve category, tags, media URLs, and file relationships. Querysets retain `select_related` and `prefetch_related` on list paths. Broad exception handlers are narrowed when a concrete API error can be returned safely; production responses never expose raw exception text.

No destructive schema migration is planned. If implementation discovers a required migration, production deployment must back up the database first and verify reversibility before applying it.

## Data and Error Flow

The browser calls relative `/api/` and public `/blog/` endpoints through Nginx. The shared HTTP client attaches authentication only where needed, performs the existing refresh flow once, and emits the existing expiration event if refresh fails. Components receive normalized collections and explicit loading, empty, error, and success states.

User input is validated in the UI for immediate feedback and again by Django serializers at the trust boundary. Failed article saves keep the editor content and local recovery draft. Upload failures keep successfully uploaded items and allow retry of the failed item. Authentication failures never clear unrelated local drafts.

## Testing and Verification

Frontend verification includes focused Jest tests for navigation active state, mobile menu behavior, collection normalization, interaction/loading states, editor draft recovery, registration removal, and any extracted payload helper. The full frontend gate is `npm run check`.

Backend verification includes tests for anonymous registration denial, administrator user creation, public article reads, protected writes, article update relationships, comments, uploads, dashboard statistics, and production configuration. The full backend gate is `python manage.py check`, `python manage.py test`, and `python manage.py check --deploy` with production-like environment values.

Production smoke tests cover HTTP-to-HTTPS behavior, certificate validity, homepage assets, public APIs, login, authenticated dashboard, article create/update/preview, media delivery, comments, mobile viewport behavior, and server service health.

## Deployment and Rollback

Deployment uses the existing server at `192.3.221.53` and domain `leexd.top`. Before mutation, inspect the current Nginx, systemd, application directories, Git revisions, database, media storage, and certificate state. Back up database/configuration and record current Git revisions. Credentials are used only interactively and never stored in repositories or delivery logs.

Push tested commits to the existing GitHub repositories. On the server, fetch those revisions, install only changed dependencies, run backend checks and migrations if any, build the frontend, publish static assets atomically where possible, restart Gunicorn only when backend code changes, reload Nginx after validation, then run smoke tests.

Rollback restores the recorded frontend artifact or Git revision, backend revision, and service configuration. Database restoration is required only if a non-reversible migration is introduced; the planned implementation avoids one.

## Out of Scope

- Native iOS or Android applications.
- A frontend framework rewrite or public/admin application split.
- Scheduled publishing, background task infrastructure, analytics services, or a new media CDN without an explicit operational need.
- Public account registration.
