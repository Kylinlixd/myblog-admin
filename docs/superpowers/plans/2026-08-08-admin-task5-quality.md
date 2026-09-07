# Admin Task 5 Quality Findings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the taxonomy, comments, files, and profile workflows against pagination drift, stale responses, duplicate deletes, and wrapped avatar uploads.

**Architecture:** Keep the existing Vue page-local state and API modules. Each list loader will use a monotonically increasing request generation and only the latest generation may commit data, errors, or loading state. Each taxonomy/file delete page will use its existing reactive ID set as the shared lock for row and batch deletes; avatar response compatibility will be normalized in `src/api/auth.js` before Profile consumes it.

**Tech Stack:** Vue 3 Composition API, Ant Design Vue, Axios request wrapper, Jest, Vue Test Utils. No dependencies or backend changes.

---

## File map

- `src/views/categories/CategoryList.vue`: taxonomy pagination/search/reset, stale-load protection, shared delete-ID lock.
- `src/views/tags/TagList.vue`: taxonomy pagination/search/reset, stale-load protection, shared delete-ID lock.
- `src/views/files/FileList.vue`: filtered pagination/search loader, stale-load protection, shared delete-ID lock.
- `src/views/comments/CommentList.vue`: stale-load protection for data, errors, and loading state.
- `src/api/auth.js`: canonical avatar upload response normalization.
- `src/views/user/Profile.vue`: consume canonical avatar upload result through the API boundary.
- `src/views/categories/__tests__/CategoryListMounted.spec.js`, `src/views/tags/__tests__/TagListMounted.spec.js`, `src/views/files/__tests__/FileListMounted.spec.js`, `src/views/comments/__tests__/CommentListMounted.spec.js`, `src/api/__tests__/auth.spec.js`, `src/views/user/__tests__/ProfileMounted.spec.js`: focused red/green regressions.

### Task 1: Add failing pagination, race, delete-lock, and avatar tests

- [x] Assert CategoryList and TagList send `page` and `pageSize`, and search/reset set page 1.
- [x] Assert a slow older response cannot replace a newer taxonomy, comment, or file response and cannot clear the newer request’s loading state.
- [x] Assert FileList keeps `name` and `type` when changing pages and resets to page 1 for a new search.
- [x] Assert row and batch deletes share pending IDs while an unrelated row remains actionable.
- [x] Assert `uploadAvatar` returns `{ url }` for both top-level and wrapped backend data and Profile uses the canonical result.
- [x] Run only these focused suites and confirm the new assertions fail for the current implementation.

### Task 2: Implement minimal list and lock fixes

- [x] Add page params and page-one resets to taxonomy handlers; gate each loader’s commits and `finally` by request generation.
- [x] Route FileList through one loader that chooses `searchFiles` when filters are active, includes current filters on pagination, and gates all commits/finally blocks by generation.
- [x] Add the same request-generation guard to CommentList.
- [x] Claim IDs in the existing delete set before row or batch requests, skip IDs already claimed by another delete path, and release only IDs claimed by that operation.
- [x] Run focused suites and confirm green.

### Task 3: Implement avatar API-boundary normalization

- [x] Add `uploadAvatar(file)` in `src/api/auth.js` using FormData and normalize top-level or `{ data: ... }` payloads to a canonical `{ url }` result while preserving useful fields.
- [x] Use Profile’s custom upload callback to call `uploadAvatar`, pass its canonical result to the UI callback, and retain failure feedback.
- [x] Run auth/profile focused suites and confirm green.

### Task 4: Verify and commit

- [x] Run focused red/green commands, then `npm run test:ci`, `npm run build`, and `git diff --check`.
- [x] Review the final diff for only the requested files and no dependency/backend changes.
- [ ] Commit as `fix: harden admin pagination and races` and report the resulting SHA/status.
