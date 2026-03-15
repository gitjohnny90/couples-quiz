---
phase: 05-rls-hardening
plan: 02
subsystem: database
tags: [supabase, rls, sessions, race-condition, security]

# Dependency graph
requires:
  - phase: 05-rls-hardening
    provides: Previous RLS policies already deployed on all tables
provides:
  - Atomic player2 slot claim preventing race-condition double-joins
  - Full-session UI rejection without access bypass in JoinPage
  - SUPERSEDED markers on all stale SQL files with allow-all policies
affects: [join-flow, session-creation, supabase-rls]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Conditional UPDATE with .is('player2_user_id', null) for atomic slot claim"
    - "Check returned data array length (not .single()) to detect zero-row UPDATE"

key-files:
  created: []
  modified:
    - src/pages/JoinPage.jsx
    - src/pages/HomePage.jsx
    - src/utils/sessionUtils.js
    - supabase-schema.sql
    - supabase-shared-items.sql
    - supabase-deep-dive.sql

key-decisions:
  - "Use .select() + array length check instead of .single() on conditional UPDATEs — .single() throws on zero rows requiring try/catch, array check is cleaner"
  - "resolveJoinState checks player2_user_id in addition to player2_name — covers edge case where user_id set but name still null"
  - "JoinPage alreadyJoined removes all access bypass — full sessions show error + go-home only, no session context set"
  - "supabase-deep-dive.sql also had allow-all policy, so all three files required SUPERSEDED markers"

patterns-established:
  - "Atomic slot claim: .update().eq('id', sessionId).is('player2_user_id', null).select() — zero rows = race lost"
  - "Race fallback: HomePage falls back to autoCreate(); JoinPage shows refresh error"

requirements-completed: [SEC-09, SEC-10, SEC-08]

# Metrics
duration: 15min
completed: 2026-03-15
---

# Phase 5 Plan 2: Atomic Join + SQL Archive Summary

**Conditional UPDATE with player2_user_id IS NULL guard closes race-condition double-join; JoinPage full-session bypass removed; three stale allow-all SQL files marked SUPERSEDED**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-15T06:14:00Z
- **Completed:** 2026-03-15T06:29:28Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Both join paths (JoinPage and HomePage autoJoin) now use atomic conditional UPDATE that only succeeds if player2_user_id IS NULL — eliminates race-condition double-join
- JoinPage alreadyJoined block no longer offers "open the notebook anyway" button — full sessions show error message and "go home" only, with no session context set
- resolveJoinState updated to treat player2_user_id as a full-session signal (covers edge where user_id set but name is still null)
- supabase-schema.sql, supabase-shared-items.sql, and supabase-deep-dive.sql all have prominent SUPERSEDED headers — no unmarked allow-all SQL remains

## Task Commits

Each task was committed atomically:

1. **Task 1: Make join flow atomic and reject full sessions** - `a9e900e` (feat)
2. **Task 2: Archive stale SQL files with superseded markers** - `cb05a6e` (chore)

## Files Created/Modified
- `src/pages/JoinPage.jsx` - Atomic join guard, full-session rejection without bypass, player2_user_id in select
- `src/pages/HomePage.jsx` - Atomic join guard in autoJoin, race-lost fallback to autoCreate
- `src/utils/sessionUtils.js` - resolveJoinState checks player2_user_id for full-session detection
- `supabase-schema.sql` - SUPERSEDED marker added (had allow-all on sessions/responses/profiles)
- `supabase-shared-items.sql` - SUPERSEDED marker added (had allow-all on shared_items)
- `supabase-deep-dive.sql` - SUPERSEDED marker added (had allow-all on deep_dive_responses)

## Decisions Made
- Used `.select()` + array length check instead of `.single()` on conditional UPDATEs — cleaner than try/catch for zero-row case
- JoinPage race error shows "refresh to see the current state" since the session data may now be valid (partner just joined)
- HomePage race error shows "we started a fresh one for you" + calls autoCreate() to keep the user unblocked

## Deviations from Plan

None - plan executed exactly as written. supabase-deep-dive.sql did contain an allow-all policy (as the plan noted "needs checking"), so the marker was applied to all three files as instructed.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Atomic join protection complete; sessions table race vulnerability closed
- Stale SQL files clearly marked — no footgun risk from accidental re-execution
- Ready for remaining Phase 5 hardening tasks

---
*Phase: 05-rls-hardening*
*Completed: 2026-03-15*
