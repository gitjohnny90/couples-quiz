---
phase: 11-content-section-hub-time-gating
plan: 01
subsystem: daily-photo-challenge
tags: [data, utility, tdd, time-gating, routing]
dependency_graph:
  requires: []
  provides: [photoSections data, photoGating pure functions, route registration, pageGuide entry]
  affects: [sessionUtils.js, pageGuides.js]
tech_stack:
  added: []
  patterns: [TDD red-green cycle, injectable-now pure functions, static data file pattern]
key_files:
  created:
    - src/data/photoSections.js
    - src/data/photoSections.test.js
    - src/utils/photoGating.js
    - src/utils/photoGating.test.js
  modified:
    - src/utils/sessionUtils.js
    - src/data/pageGuides.js
decisions:
  - "Used UI-SPEC section table as authoritative source for the 15 section IDs, titles, emojis, and prompt texts — RESEARCH.md had a slightly different section list"
  - "Section IDs follow UI-SPEC table (morning-routine, current-meal, etc.) not RESEARCH.md table (morning-routine, date-night, food-mood, etc.)"
  - "Added prominent warning comment in photoSections.js that IDs are permanent keys — cannot be renamed after launch"
  - "next6amAfter always advances to the NEXT calendar day (d+1 then setHours 6am) — correct for all cases including completion just before 6am"
metrics:
  duration: "8 minutes"
  completed: "2026-04-02"
  tasks_completed: 2
  tasks_total: 2
  files_created: 4
  files_modified: 2
  tests_added: 34
  tests_total: 183
---

# Phase 11 Plan 01: Static Data & Time-Gating Utility Summary

15 themed sections with 3 prompts each and pure 6am-boundary time-gating functions, fully TDD-covered with injectable clock.

## What Was Built

### Task 1: photoSections.js + photoGating.js (TDD)

**`src/data/photoSections.js`** — 15 static section objects exported as default array:
- Sections cover: morning routine, meals, vibes, spaces, outdoors, date night, pets/plants, self-care, work, travel, cooking, getting ready, weekends, new things, end of day
- Each section: `{ id, title, emoji, description, prompts: [{ id, text }, ...] }`
- `prompts[0].text` is always `"What are you up to?"` (CONT-02)
- `prompts[2].text` is a funny/unhinged theme-matched question (CONT-03)
- Prompt IDs follow `{sectionId}-{n}` pattern (e.g. `morning-routine-1`)
- Warning comment at top: IDs are permanent Storage path keys, never rename

**`src/utils/photoGating.js`** — 4 pure exported functions:
- `next6amAfter(completedAt)` — returns Date of 6:00:00am on the day AFTER completedAt, in local time
- `isGloballyFrozen(state, now?)` — true when `now < next6amAfter(lastCompletedAt)`
- `frozenUntil(state, now?)` — returns ISO string of unlock time or null
- `getSectionStatus(sectionId, state, now?)` — returns `'completed' | 'in-progress' | 'available' | 'locked-in-progress' | 'locked-frozen'`

**State shape convention** (JSONB in `responses.answers`):
```
{ completedSections: { [sectionId]: isoTimestamp }, inProgressSectionId: string|null, lastCompletedAt: string|null }
```

**TDD coverage:** 34 tests across 2 files, including all boundary conditions:
- Null/empty state → not frozen
- Completed at 2pm, now 11pm → frozen
- Completed at 11pm, now 5:59am next day → frozen
- Completed at 2pm, now 7am next day → not frozen
- Exactly 6am next day → unfrozen (boundary is `<` not `<=`)
- All 5 `getSectionStatus` return values covered

### Task 2: Route registration and page guide

**`src/utils/sessionUtils.js`** updates:
- `getDocumentTitle`: new check before `/quiz-packs` returns `'Daily Photo Challenge — The Us Quiz'` for `/daily-photos`, `/daily-photo-section`, `/daily-photo-reveal`
- `isTabActive` vault group: 3 new `pathname.startsWith` entries for the same 3 route prefixes

**`src/data/pageGuides.js`** update:
- Added `dailyPhotos` entry after `home` with 3 onboarding lines matching UI-SPEC copywriting contract exactly

## Verification

- `npx vitest run` — 183/183 tests pass (8 test files, 34 new tests)
- `npm run build` — production build succeeds in 5.13s

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Content discrepancy] Used UI-SPEC section table instead of RESEARCH.md catalog**
- **Found during:** Task 1 GREEN phase
- **Issue:** RESEARCH.md (section "Content: 15 Themed Sections") lists different section IDs and prompts than the UI-SPEC table. The plan directs using the UI-SPEC table exactly.
- **Fix:** Followed UI-SPEC table (morning-routine, current-meal, right-now-vibes, your-space, outside-right-now, date-night, pet-or-plant, self-care-day, working-on-it, travel-mode, cooking-or-ordering, getting-ready, weekend-energy, something-new, end-of-day) as the authoritative source per plan instruction: "Default export of 15 section objects following the UI-SPEC table exactly"
- **Files modified:** `src/data/photoSections.js`
- **Commit:** 7f2c66c

## Self-Check: PASSED

All claimed artifacts exist and all commits are present in git history.

| Item | Status |
|------|--------|
| src/data/photoSections.js | FOUND |
| src/utils/photoGating.js | FOUND |
| src/data/photoSections.test.js | FOUND |
| src/utils/photoGating.test.js | FOUND |
| 11-01-SUMMARY.md | FOUND |
| commit 7f2c66c (Task 1) | FOUND |
| commit dd15e75 (Task 2) | FOUND |
