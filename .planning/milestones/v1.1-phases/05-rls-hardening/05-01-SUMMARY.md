---
phase: 05-rls-hardening
plan: "01"
subsystem: database
tags: [rls, postgres, supabase, security, sql]

requires: []
provides:
  - Per-operation RLS policies with player_id ownership enforcement on all 9 feature tables
  - Type-correct session_id::text cast on finish_sentence and hot_takes policies
  - Migration file supabase/migrations/05-player-id-rls.sql replacing FOR ALL policies
affects: [06-bug-fixes, 07-accessibility, 08-quality]

tech-stack:
  added: []
  patterns:
    - "Player-id resolution via subquery: SELECT us.player_id FROM user_sessions us WHERE us.user_id = (SELECT auth.uid()) AND us.session_id = table.session_id"
    - "Per-operation RLS (SELECT/INSERT/UPDATE/DELETE) instead of FOR ALL — enables write-ownership without blocking reads"
    - "Special-case shared rows (player_id IN ('game', 'shared')) allowed by both partners"
    - "added_by column (shared_items) enforced on INSERT only; UPDATE/DELETE use session membership"

key-files:
  created:
    - supabase/migrations/05-player-id-rls.sql
  modified:
    - supabase-rls-fix.sql

key-decisions:
  - "Use per-operation policies (not FOR ALL) so SELECT remains session-scoped while INSERT/UPDATE add player_id enforcement"
  - "responses table allows player_id IN ('game', 'shared') so both partners can write tic-tac-toe and study-together shared-state rows"
  - "shared_items enforces added_by only on INSERT; either partner may UPDATE/DELETE (rating/status changes are collaborative)"
  - "reactions replaces both old policy sets (supabase-rls-fix.sql FOR ALL + supabase-rls-policies.sql per-op) with new player_id-enforced policies"

patterns-established:
  - "Player-id ownership subquery: SELECT us.player_id FROM public.user_sessions us WHERE us.user_id = (SELECT auth.uid()) AND us.session_id::text = table.session_id::text"
  - "All session_id comparisons use ::text cast on both sides to avoid uuid/text type errors"

requirements-completed: [SEC-07, SEC-11]

duration: 8min
completed: 2026-03-15
---

# Phase 5 Plan 01: Player-id RLS Enforcement Summary

**Per-operation RLS policies with player_id ownership added to all 9 feature tables via SQL migration, closing the cross-player write vulnerability and fixing uuid/text type errors on finish_sentence and hot_takes**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-15T06:27:50Z
- **Completed:** 2026-03-15T06:35:50Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created `supabase/migrations/05-player-id-rls.sql` with 36 CREATE POLICY statements (4 per table, 9 tables) replacing the old FOR ALL `partners_access_data` policies
- Player_id enforcement subquery prevents either partner from writing rows as the other (SEC-07)
- Fixed finish_sentence and hot_takes `session_id::text` type cast mismatch that caused deployment errors (SEC-11)
- Special cases handled correctly: `responses` allows `player_id IN ('game', 'shared')` for shared-state rows; `shared_items` enforces `added_by` on INSERT only

## Task Commits

Each task was committed atomically:

1. **Task 1: Write player_id RLS migration SQL** - `7453c80` (feat)
2. **Task 2: Update supabase-rls-fix.sql with superseded marker** - `e379a0a` (chore)

**Plan metadata:** (final docs commit — see below)

## Files Created/Modified

- `supabase/migrations/05-player-id-rls.sql` - 36 per-operation RLS policies enforcing player_id ownership on all 9 feature tables
- `supabase-rls-fix.sql` - Added SUPERSEDED header at top; original SQL preserved for reference

## Decisions Made

- Used per-operation policies (SELECT / INSERT / UPDATE / DELETE) instead of FOR ALL so SELECT remains session-scoped only while INSERT/UPDATE add player_id enforcement — partners still read each other's data normally
- `responses` table allows `player_id IN ('game', 'shared')` so both partners can write tic-tac-toe game state and study-together shared reading records
- `shared_items` enforces `added_by = user's player_id` on INSERT, but UPDATE/DELETE use session membership only — either partner can update movie status or ratings
- `reactions` drops both old policy sets (FOR ALL from supabase-rls-fix.sql + per-operation from supabase-rls-policies.sql) and recreates with full player_id enforcement
- All `session_id` comparisons use `::text` cast on both sides consistently to prevent uuid/text type mismatch

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

This migration must be run against the Supabase database. Copy the SQL from `supabase/migrations/05-player-id-rls.sql` and run it in the Supabase SQL Editor (Dashboard > SQL Editor).

Run order: This file is self-contained. It drops the old `partners_access_data` policies and the old reactions policies before creating the new ones. Run it once.

## Next Phase Readiness

- Player_id enforcement migration is written and ready to deploy to Supabase
- Phase 5 Plan 02 (atomic join) is already committed (a9e900e) — both plans in this phase are complete
- RLS hardening phase complete; ready to move to Phase 6 (bug fixes)

---
*Phase: 05-rls-hardening*
*Completed: 2026-03-15*
