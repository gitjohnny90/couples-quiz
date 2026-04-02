---
phase: 11-content-section-hub-time-gating
plan: 02
subsystem: daily-photo-challenge
tags: [ui, hub-page, time-gating, routing, vault]
dependency_graph:
  requires: [11-01 (photoSections.js, photoGating.js, pageGuides.js, sessionUtils.js)]
  provides: [DailyPhotosHubPage, /daily-photos/:sessionId route, VaultPage Daily Photos card]
  affects: [src/App.jsx, src/pages/VaultPage.jsx]
tech_stack:
  added: []
  patterns: [useRealtimeSync hook, useSessionSetup hook, fresh-fetch-before-write, framer-motion stagger]
key_files:
  created:
    - src/pages/DailyPhotosHubPage.jsx
  modified:
    - src/App.jsx
    - src/pages/VaultPage.jsx
decisions:
  - "Used motionDiv interactiveProps spread pattern to cleanly separate locked vs clickable card attributes"
  - "Hover state managed via hoveredId state (not CSS class) to avoid adding new CSS — consistent with no-CSS-in-JS rule"
  - "DEFAULT_STATE constant defined inline (not imported) since it is only needed in this file"
metrics:
  duration: "6 minutes"
  completed: "2026-04-02"
  tasks_completed: 1
  tasks_total: 2
  files_created: 1
  files_modified: 2
---

# Phase 11 Plan 02: Section Hub & Routing Summary

Daily Photos hub page with 15 state-driven section cards, VaultPage entry card, and lazy route — wired to photoGating.js for live lock/unlock state.

## What Was Built

### Task 1: DailyPhotosHubPage, App.jsx route, VaultPage entry card

**`src/pages/DailyPhotosHubPage.jsx`** (382 lines) — hub page featuring:
- `useSessionSetup` + `useRealtimeSync` for live data sync between partners
- `fetchState` with `useCallback([sessionId])` wrapping and mountedRef guard
- 15 section cards rendered from `photoSections` static data
- `getSectionStatus()` + `STATUS_CONFIG` map drives all visual states (stripe color, background, title color, emoji opacity, clickability)
- Card states: `available` (coral stripe, clickable), `in-progress` (coral stripe + pill badge), `completed` (sage stripe + checkmark badge), `locked-frozen` (pencil stripe + padlock, "unlocks at 6am" sub-text), `locked-in-progress` (pencil stripe + padlock)
- `handlePickSection()` uses fresh-fetch-before-write pattern (GATE-03) then navigates to `/daily-photo-section/:sessionId/:sectionId` (Phase 12 stub)
- Gate banner with mustard styling when `isGloballyFrozen(state)` is true, framer-motion slide-in
- Completion summary: "N of 15 sections complete" with sage-colored N
- Card rotations: alternating ±0.25/0.3deg, locked = none, completed = 0.15deg
- Framer-motion stagger at `delay: index * 0.04`
- Full accessibility: `role="button"`, `tabIndex={0}`, `onKeyDown` for interactive cards; `aria-disabled="true"` for locked cards; `role="status"` on gate banner
- `PageGuide pageKey="dailyPhotos"` onboarding tooltip
- Loading state: "loading your photo challenge..." (Patrick Hand 1.25rem, text-secondary, paddingTop 64)
- Error state: auto-dismisses after 3 seconds

**`src/App.jsx`** changes:
- Added `const DailyPhotosHubPage = lazy(() => import('./pages/DailyPhotosHubPage'))` after HotTakesPage
- Added `<Route path="/daily-photos/:sessionId" element={<RequireAuth><DailyPhotosHubPage /></RequireAuth>} />` after hot-takes route

**`src/pages/VaultPage.jsx`** changes:
- `photoCompletedCount` state added, populated from `responses` table query on `pack_id: 'daily-photo-challenge'`, `player_id: 'shared'`
- Daily Photos card added at bottom (delay 0.6) with 3-state right indicator:
  - Never started: "start photos →" (Patrick Hand 1rem, text-light)
  - In progress (1-14): "{N}/15" / "sections" (Caveat 1.25rem 700 coral / Patrick Hand 0.875rem)
  - All done (15): "15/15" / "done" (Caveat 1.25rem 700 sage / Patrick Hand 0.875rem)

### Task 2: Human Verification — PENDING

Checkpoint awaits human verification. Build passes. The hub page renders in the production bundle as `DailyPhotosHubPage-DhtoJXw8.js` (12.64 kB / 4.09 kB gzip).

**Verification steps (for human):**
1. Run `npm run dev` → open http://127.0.0.1:5173
2. Sign in → quizzes tab → verify "Daily Photos" card appears with camera emoji
3. Tap card → navigates to `/daily-photos/{sessionId}`
4. Verify hub: heading, subtitle, "0 of 15 sections complete", 15 cards
5. Tap any card → navigates to `/daily-photo-section/{sessionId}/{sectionId}` (404 expected — Phase 12)
6. Back → tapped section shows "In Progress" pill, others show locked
7. (?) help icon shows "Daily Photos" page guide on first visit
8. Quizzes tab in bottom nav highlighted while on hub page

## Verification

- `npm run build` — passes in 4.84s, DailyPhotosHubPage emitted as separate chunk
- DailyPhotosHubPage.jsx: 382 lines (min_lines: 150 — passes)
- All key_links verified in source:
  - `import { getSectionStatus, isGloballyFrozen } from '../utils/photoGating'` — present
  - `import photoSections from '../data/photoSections'` — present
  - `.from('responses').select('answers').eq('pack_id', 'daily-photo-challenge')` — present
  - `navigate.*daily-photos` in VaultPage — present
  - `lazy(() => import('./pages/DailyPhotosHubPage'))` in App.jsx — present

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

## Self-Check: PASSED

| Item | Status |
|------|--------|
| src/pages/DailyPhotosHubPage.jsx | FOUND |
| src/App.jsx (updated) | FOUND |
| src/pages/VaultPage.jsx (updated) | FOUND |
| 11-02-SUMMARY.md | FOUND |
| commit 11a1e26 (Task 1) | FOUND |
