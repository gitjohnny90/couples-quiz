---
phase: 06-bug-fixes
plan: 03
subsystem: ui
tags: [react, supabase, waiting-screen, session]

# Dependency graph
requires:
  - phase: 06-bug-fixes
    provides: Bug fixes for share link and stale closure issues (06-01, 06-02)
provides:
  - Session-aware two-state waiting screens on ResultsPage and DrawResultsPage
  - Invite code display (LOVE-XXXX) when partner hasn't joined
  - Clean "waiting on partner" message when partner has joined but hasn't completed
affects: [06-bug-fixes, ui-uat]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Session fetch on waiting screen: query sessions table for player2_name/player2_user_id/invite_code to distinguish no-partner vs partner-joined states"

key-files:
  created: []
  modified:
    - src/pages/ResultsPage.jsx
    - src/pages/DrawResultsPage.jsx

key-decisions:
  - "Two sub-states on waiting screen: sub-state A shows invite code when player2_name and player2_user_id are both null; sub-state B shows plain waiting message when either is set"
  - "copyCode replaces copyLink — copies invite code string directly instead of a /join/ URL"

patterns-established:
  - "Waiting screen session fetch: separate useEffect on mount, mountedRef guard, sets sessionInfo state used for conditional rendering"

requirements-completed: [BUG-01]

# Metrics
duration: 2min
completed: 2026-03-15
---

# Phase 06 Plan 03: Session-Aware Waiting Screens Summary

**Replaced /join/ URL share links on ResultsPage and DrawResultsPage with session-aware two-state waiting screens showing invite code or plain waiting message**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-15T16:26:04Z
- **Completed:** 2026-03-15T16:28:07Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- ResultsPage waiting screen now shows LOVE-XXXX invite code + copy button when partner hasn't joined, or plain "waiting" message when partner has joined but hasn't answered
- DrawResultsPage waiting screen applies the same two-state pattern; "draw another" button preserved in both sub-states
- No /join/ URL appears anywhere on either waiting screen

## Task Commits

Each task was committed atomically:

1. **Task 1: Session-aware waiting screen on ResultsPage** - `3df4e3a` (feat)
2. **Task 2: Session-aware waiting screen on DrawResultsPage** - `e94cd06` (feat)

**Plan metadata:** (docs commit — see final_commit below)

## Files Created/Modified
- `src/pages/ResultsPage.jsx` - Added sessionInfo state, session fetch useEffect, two sub-states in waiting block, removed shareUrl/copyLink
- `src/pages/DrawResultsPage.jsx` - Same changes as ResultsPage; preserved "draw another" button in both sub-states

## Decisions Made
- Two sub-states distinguish "partner hasn't joined" (show invite code) vs "partner joined but hasn't completed" (show plain message). Detection uses `player2_name || player2_user_id` so either field triggers sub-state B.
- Copied invite code instead of URL — users shouldn't see raw /join/ links anywhere in the results flow.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Gap BUG-01 closed: waiting screens on ResultsPage and DrawResultsPage no longer show confusing /join/ URLs
- Both files verified: `from('sessions')` query present, no `/join/` reference, `invite_code` referenced
- Build passes clean

## Self-Check: PASSED

- FOUND: src/pages/ResultsPage.jsx
- FOUND: src/pages/DrawResultsPage.jsx
- FOUND: .planning/phases/06-bug-fixes/06-03-SUMMARY.md
- FOUND: commit 3df4e3a (feat: session-aware waiting screen on ResultsPage)
- FOUND: commit e94cd06 (feat: session-aware waiting screen on DrawResultsPage)

---
*Phase: 06-bug-fixes*
*Completed: 2026-03-15*
