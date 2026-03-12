---
phase: 03-polling-fallback-standardization
plan: 01
subsystem: ui
tags: [react, supabase, realtime, polling, useCallback]

# Dependency graph
requires:
  - phase: 01-rls-audit-policy-deployment
    provides: RLS policies on responses table enabling correct row-level data filtering
provides:
  - QuizPage realtime subscription + polling for partner answer detection
  - ResultsPage fixed realtime event filter (event: '*') + useCallback-wrapped fetch
  - DrawResultsPage fixed realtime event filter (event: '*') + useCallback-wrapped fetch
affects: [04-quiz-bug-fixes]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Split-effect pattern: initial load, realtime subscription, and polling in separate useEffect hooks"
    - "useCallback-wrapped fetch functions to prevent stale closures in polling/realtime callbacks"
    - "event: '*' instead of event: 'INSERT' for realtime to catch pre-existing rows"
    - "Polling gated on condition (partnerAnswered, responses.length) with cleanup on unmount"

key-files:
  created: []
  modified:
    - src/pages/QuizPage.jsx
    - src/pages/ResultsPage.jsx
    - src/pages/DrawResultsPage.jsx

key-decisions:
  - "Use event: '*' on realtime subscriptions so rows that arrived before page load still trigger callbacks via UPDATE events or when subscription reconnects"
  - "QuizPage partner detection sets a boolean only — never touches user's own answer state"
  - "Polling gated on absence of desired data (partnerAnswered=false, responses.length<2) so it self-terminates when condition is met"

patterns-established:
  - "Canonical polling pattern: useCallback fetch + separate initial/realtime/polling effects, all with cleanup"

requirements-completed: [RT-01, RT-02, RT-03]

# Metrics
duration: 7min
completed: 2026-03-12
---

# Phase 3 Plan 01: Polling Fallback Standardization Summary

**Realtime fix for quiz, results, and drawing pages: event: '*' filter replaces INSERT-only on results pages, plus new partner-detection realtime+polling on QuizPage**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-12T01:37:46Z
- **Completed:** 2026-03-12T01:44:30Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- QuizPage now detects when partner has already submitted via realtime subscription + 5s polling fallback, with a subtle "your person already answered this one!" indicator
- ResultsPage realtime subscription changed from `event: 'INSERT'` to `event: '*'` so existing partner rows (loaded before current player arrives) trigger the callback correctly
- DrawResultsPage same fix plus useCallback wrapping, split-effect pattern, and corrected polling deps on both pages

## Task Commits

1. **Task 1: Add realtime + polling to QuizPage** - `baaaf95` (feat)
2. **Task 2: Fix ResultsPage and DrawResultsPage realtime filters** - `373a7ca` (fix)

## Files Created/Modified

- `src/pages/QuizPage.jsx` - Added useCallback fetchPartnerResponse, realtime channel, polling fallback, UI indicator
- `src/pages/ResultsPage.jsx` - useCallback-wrapped fetchResponses, event: '*', split effects, fixed polling deps
- `src/pages/DrawResultsPage.jsx` - useCallback-wrapped fetchResponses, event: '*', split effects, fixed polling deps

## Decisions Made

- Used `event: '*'` instead of `event: 'INSERT'` — the critical fix. INSERT-only realtime misses partner data that already exists in the DB when the current player loads the page. `*` catches INSERT, UPDATE, and DELETE events.
- QuizPage polling stops (returns early) once `partnerAnswered` is true — no wasted polling once goal is achieved.
- Realtime channel naming follows existing convention: `quiz-{sessionId}-{packId}`.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All three pages now follow the canonical split-effect realtime+polling pattern
- RT-01, RT-02, RT-03 requirements satisfied
- Ready for Phase 4 (quiz bug fixes) which depends on stable realtime infrastructure

---
*Phase: 03-polling-fallback-standardization*
*Completed: 2026-03-12*
