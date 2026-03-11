---
phase: 01-rls-audit-policy-deployment
plan: 01
subsystem: database
tags: [supabase, rls, postgres, security, sql]

# Dependency graph
requires: []
provides:
  - "supabase-rls-audit.sql: pre-deployment diagnostic queries for pg_tables, pg_policies, pg_indexes"
  - "supabase-rls-indexes.sql: 11 performance indexes for RLS subquery pattern"
  - "supabase-rls-policies.sql: atomic RLS enable + policies for all 11 tables"
affects:
  - "02-polling-fix (reads same 11 tables — RLS must be in place first)"
  - "03-pyp-migration (inserts into responses table — covered by responses policy)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "RLS subquery: session_id IN (SELECT session_id FROM user_sessions WHERE user_id = (SELECT auth.uid()))"
    - "(SELECT auth.uid()) wrapper for initPlan optimization on every policy"
    - "BEGIN/COMMIT per table for atomic ENABLE + CREATE POLICY (no empty-data window)"
    - "FOR ALL single policy per feature table (avoids multiple permissive policies lint warning)"
    - "Separate per-operation policies for reactions table (read-all, write-session)"

key-files:
  created:
    - "supabase-rls-audit.sql"
    - "supabase-rls-indexes.sql"
    - "supabase-rls-policies.sql"
  modified: []

key-decisions:
  - "love_notes is the correct table name (not love_note_games/love_note_guesses) — confirmed by codebase scan in RESEARCH.md"
  - "SEC-04 is addressed by responses table policy — app stores drawings as base64 in responses.answers JSONB, no Supabase Storage buckets exist"
  - "user_sessions policy deployed first as it is a dependency for all session-scoped subqueries"
  - "reactions table gets 4 separate policies (SELECT/INSERT/UPDATE/DELETE) rather than FOR ALL, because read-all vs write-session semantics differ"

patterns-established:
  - "Pattern 1 (FOR ALL): responses, profiles, deep_dive_responses, shared_items, love_notes, predict_partner, finish_sentence, hot_takes"
  - "Pattern 2 (OR both UIDs): sessions table with player1_user_id OR player2_user_id"
  - "Pattern 3 (own rows): user_sessions with user_id = (SELECT auth.uid())"
  - "Pattern 4 (split read/write): reactions with separate per-operation policies"

requirements-completed: [SEC-01, SEC-02, SEC-03, SEC-04, SEC-05]

# Metrics
duration: 2min
completed: 2026-03-11
---

# Phase 1 Plan 1: RLS Audit & Policy Deployment Summary

**Three ready-to-run SQL files securing all 11 Supabase tables with session-scoped RLS using (SELECT auth.uid()) optimization and atomic BEGIN/COMMIT deployment**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-11T05:13:47Z
- **Completed:** 2026-03-11T05:16:27Z
- **Tasks:** 2 of 2
- **Files modified:** 3 (all new)

## Accomplishments

- Created audit file with 3 diagnostic queries to snapshot current RLS state before deployment
- Created index file with 11 idempotent CREATE INDEX IF NOT EXISTS statements (2 for user_sessions lookup chains + 9 for feature table session_id columns)
- Created atomic policy file enabling RLS and deploying correct policies for all 11 tables — user_sessions, sessions, responses, profiles, deep_dive_responses, shared_items, love_notes, reactions, predict_partner, finish_sentence, hot_takes

## Task Commits

Each task was committed atomically:

1. **Task 1: Create RLS audit and index SQL files** - `c960290` (feat)
2. **Task 2: Create atomic RLS policy deployment SQL** - `3dba5d3` (feat)

**Plan metadata:** _(final docs commit follows)_

## Files Created/Modified

- `supabase-rls-audit.sql` - Pre-deployment diagnostic: pg_tables (rowsecurity status), pg_policies (existing policies to DROP), pg_indexes (index inventory)
- `supabase-rls-indexes.sql` - 11 performance indexes supporting the RLS subquery on user_sessions.user_id, user_sessions.session_id, and session_id on all 9 feature tables
- `supabase-rls-policies.sql` - Full atomic RLS deployment: 11 ENABLE statements, 11 BEGIN/COMMIT blocks, 20 policies total across all tables, all auth.uid() wrapped in (SELECT ...), all INSERT/UPDATE have WITH CHECK

## Decisions Made

- **love_notes table name:** CLAUDE.md lists love_note_games/love_note_guesses but codebase scan in RESEARCH.md confirmed the actual table is love_notes. Used love_notes throughout.
- **SEC-04 treatment:** No Supabase Storage buckets exist. Drawing data lives in responses.answers JSONB. SEC-04 is fully addressed by the responses table RLS policy — documented in policy file header and at file end.
- **user_sessions deployed first:** All session-scoped policies depend on user_sessions being readable. Deploying it first ensures the subquery works before any other table's policy is evaluated.
- **reactions split policies vs FOR ALL:** reactions needs both partners to read all reactions (see each other's emojis) but write access is session-scoped. FOR ALL would not allow expressing this distinction, so 4 separate per-operation policies were used.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. All verification checks passed on first attempt:
- 11 ENABLE ROW LEVEL SECURITY statements confirmed
- 11 matched BEGIN/COMMIT blocks confirmed
- Zero bare auth.uid() calls found
- npm run build passed (SQL files have no effect on Vite build)

## User Setup Required

**External database requires manual execution.** To deploy RLS:

1. Open Supabase dashboard > SQL Editor
2. Run `supabase-rls-audit.sql` — review output; DROP any stale policies if they conflict
3. Run `supabase-rls-indexes.sql` — creates performance indexes (safe to re-run)
4. Run `supabase-rls-policies.sql` — enables RLS and deploys all 11 policies atomically

After deployment, verify from two browser windows (not the SQL editor — it bypasses RLS):
- Player2 can read session row and see partner name (SEC-03)
- GET request with foreign session JWT returns empty array (SEC-01)
- Realtime events still arrive within 2 seconds (SEC-06)

## Next Phase Readiness

- All three SQL files are ready for user to execute in Supabase SQL Editor
- Phase 1 Plan 2 (if any) can proceed independently — plan 01 artifacts are self-contained
- Phase 2 (polling fix) can begin after RLS is deployed and verified, but the code changes are independent of RLS state

## Self-Check: PASSED

- supabase-rls-audit.sql: FOUND
- supabase-rls-indexes.sql: FOUND
- supabase-rls-policies.sql: FOUND
- .planning/phases/01-rls-audit-policy-deployment/01-01-SUMMARY.md: FOUND
- Commit c960290 (Task 1): FOUND
- Commit 3dba5d3 (Task 2): FOUND

---
*Phase: 01-rls-audit-policy-deployment*
*Completed: 2026-03-11*
