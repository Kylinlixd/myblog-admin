# Task 4 Workflow Test Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add mounted regression coverage for the Task 4 content-workspace behaviors identified during spec review, with only minimal production fixes when a test exposes a real defect.

**Architecture:** Reuse the existing Jest, Vue Test Utils, API mocks, router mocks, and component stubs. Extend the dynamic-list, dashboard, editor, file-selector, and workspace-style suites at their current boundaries; do not introduce new dependencies or redesign page code.

**Tech Stack:** Vue 3, Vue Test Utils, Jest, Ant Design Vue stubs, existing API mocks.

---

## File map

- `src/views/dynamics/__tests__/DynamicListMountedInteractions.spec.js`: mounted list normalization, empty-state routing, pending batch controls, and contained table wrapper assertions.
- `src/views/dashboard/__tests__/DashboardMountedStates.spec.js`: error-state layout preservation.
- `src/views/dynamics/__tests__/DynamicEditMountedInteractions.spec.js`: mounted draft restore/autosave/clear and taxonomy refresh/selection.
- `src/views/dynamics/__tests__/DynamicEditFileSelector.spec.js`: confirmation refreshes file data.
- `src/styles/__tests__/adminWorkspace.spec.js`: contained table horizontal-scroll rule regression.
- `docs/superpowers/plans/2026-08-08-admin-frontend-polish-task4-test-coverage.md`: this execution plan.

## Task 1: Extend dynamic-list mounted coverage

- [x] Add a slot-aware table stub and assert normalized media URLs, category, like count, and fallback title render.
- [x] Prove the empty-state create button calls the mocked router with `/dashboard/dynamics/create`.
- [x] Assert batch delete exposes both disabled and loading state while its promise is pending.
- [x] Assert the table remains inside `.content-table-scroll`.
- [x] Run the focused suite and investigate any real failure.

## Task 2: Extend dashboard and editor mounted coverage

- [x] Assert dashboard request errors retain intro, metric rail, and operations-panel layout.
- [x] Mount the editor with a stored draft, verify restoration, advance fake timers to verify autosave, and verify successful save clears storage.
- [x] Assert category and tag creation refetches its collection and selects the new item.
- [x] Run the focused suites and fix only a directly related defect if required.

## Task 3: Extend file-selector and style regressions

- [x] Assert file-selector confirmation updates the editor selection and triggers a fresh file-list request.
- [x] Assert the shared contained table wrapper has horizontal scrolling and does not leak overflow to the page surface.
- [x] Run all focused tests.

## Task 4: Verify and commit

- [x] Run `npm run test:ci`.
- [x] Run `npm run build`.
- [x] Inspect `git diff --check` and the final diff.
- [x] Commit with `test: cover content workspace workflows`.
