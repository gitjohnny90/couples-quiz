---
phase: 12-prompt-flow-cork-board-reveal
plan: "01"
subsystem: daily-photos
tags: [photo-capture, prompt-flow, realtime, tdd, routing]
dependency_graph:
  requires:
    - 11-02 (DailyPhotosHubPage, photoSections, PhotoCaptureInput, photoGating.js)
    - 10-storage-photo-capture (PhotoCaptureInput, photoUtils.js)
  provides:
    - isSectionCompleteForPlayer helper (src/utils/photoGating.js)
    - DailyPhotoSectionPage (prompt flow + waiting screen)
    - Route /daily-photo-section/:sessionId/:sectionId
    - Route /daily-photo-reveal/:sessionId/:sectionId (placeholder)
  affects:
    - src/App.jsx (2 new lazy routes)
    - src/data/pageGuides.js (2 new entries)
tech_stack:
  added: []
  patterns:
    - TDD (RED-GREEN) for isSectionCompleteForPlayer
    - useRealtimeSync + useSessionSetup hooks
    - AnimatePresence mode="wait" for prompt slide transitions
    - Fresh-fetch-before-write pattern for race-condition safety
key_files:
  created:
    - src/pages/DailyPhotoSectionPage.jsx (399 lines)
    - src/pages/DailyPhotoRevealPage.jsx (placeholder)
  modified:
    - src/utils/photoGating.js (added isSectionCompleteForPlayer)
    - src/utils/photoGating.test.js (added 7 test cases)
    - src/App.jsx (2 lazy imports + 2 routes)
    - src/data/pageGuides.js (2 entries)
decisions:
  - "Used pack_id='daily-photo-section' per UI-SPEC (not 'daily-photo-challenge' from plan interfaces block)"
  - "Completion checked via completedAt field first, then photos array fallback for robustness"
  - "buildPlayerAnswersShape helper bridges UI-SPEC photo shape to isSectionCompleteForPlayer shape"
metrics:
  duration: "4 minutes"
  completed_date: "2026-04-02"
  tasks: 3
  files: 6
---

# Phase 12 Plan 01: Prompt Flow & Route Wiring Summary

**One-liner:** Sequential 3-prompt photo capture page with AnimatePresence transitions, partner-completion polling via useRealtimeSync, and auto-navigation to reveal.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Add isSectionCompleteForPlayer + unit tests | fcc7abc | photoGating.js, photoGating.test.js |
| 2 | Route wiring + pageGuides entries | 26de404 | App.jsx, pageGuides.js, DailyPhotoRevealPage.jsx (placeholder) |
| 3 | Build DailyPhotoSectionPage | 71d61d7 | DailyPhotoSectionPage.jsx |

## What Was Built

### isSectionCompleteForPlayer (Task 1)

New export in `src/utils/photoGating.js`. Checks that `playerAnswers[sectionId]` is an array of length >= 3 where every element is non-null with a truthy `.path`. Written TDD: 7 failing tests committed first, then implementation. All 33 photoGating tests pass.

### Route Wiring (Task 2)

Two new lazy routes in App.jsx:
- `/daily-photo-section/:sessionId/:sectionId` → `DailyPhotoSectionPage`
- `/daily-photo-reveal/:sessionId/:sectionId` → `DailyPhotoRevealPage` (placeholder)

Two pageGuides entries: `dailyPhotoSection` and `dailyPhotoReveal`.

### DailyPhotoSectionPage (Task 3)

Full prompt flow page (399 lines):
- Mount effect fetches existing player row and resumes at correct `currentPromptIndex`
- `savePromptAnswer` fresh-fetches before writing to prevent data overwrites
- `handlePhotoSubmit` advances index or transitions to waiting screen
- `markSectionCompleteInSharedState` updates shared gate row (`daily-photo-challenge`) with `completedSections` and `lastCompletedAt`
- `checkBothComplete` (useCallback) fetches both player rows in parallel, detects when both have `completedAt`, calls markSectionComplete then navigates to reveal
- `useRealtimeSync` with `pollingEnabled: screen === 'waiting'` polls for partner
- AnimatePresence `mode="wait"` with left-right slide between prompts
- Waiting screen: `.glass` container, `role="status"`, partner name, check-back button
- Section-not-found error with back link
- Typography: only 0.875rem, 1rem, 1.25rem used (no banned fractionals)

## Data Shape Decision

The UI-SPEC specifies `pack_id='daily-photo-section'` with `answers: { sectionId, photos: [{promptIndex, path, caption}], completedAt }`. The plan's interfaces block showed a different shape (`pack_id='daily-photo-challenge'`, `answers[sectionId]`). UI-SPEC was used as the authoritative contract.

A `buildPlayerAnswersShape` helper bridges the UI-SPEC photos array into the `{ [sectionId]: [entry0, entry1, entry2] }` shape that `isSectionCompleteForPlayer` expects.

## Deviations from Plan

### Auto-fixed Issues

None — plan executed as written. One minor clarification applied:

**[Rule 1 - Data Shape] Used UI-SPEC pack_id over plan interfaces block**
- **Found during:** Task 3
- **Issue:** Plan interfaces block specified `pack_id='daily-photo-challenge'` and `answers[sectionId]` array shape; UI-SPEC specified `pack_id='daily-photo-section'` with `answers.photos` array
- **Fix:** Used UI-SPEC shape as authoritative contract; added `buildPlayerAnswersShape` bridge for `isSectionCompleteForPlayer` calls
- **Files modified:** src/pages/DailyPhotoSectionPage.jsx
- **Commit:** 71d61d7

## Verification Results

- `npm test -- photoGating`: 33/33 pass including all 7 new isSectionCompleteForPlayer tests
- `npm run build`: succeeds, DailyPhotoSectionPage and DailyPhotoRevealPage appear as separate lazy chunks

## Self-Check: PASSED

- [x] `src/utils/photoGating.js` — FOUND (isSectionCompleteForPlayer exported)
- [x] `src/utils/photoGating.test.js` — FOUND (7 new test cases)
- [x] `src/pages/DailyPhotoSectionPage.jsx` — FOUND (399 lines, contains PhotoCaptureInput, useRealtimeSync, isSectionCompleteForPlayer)
- [x] `src/pages/DailyPhotoRevealPage.jsx` — FOUND (placeholder)
- [x] `src/App.jsx` — FOUND (DailyPhotoSectionPage lazy import + route)
- [x] fcc7abc — FOUND in git log
- [x] 26de404 — FOUND in git log
- [x] 71d61d7 — FOUND in git log
