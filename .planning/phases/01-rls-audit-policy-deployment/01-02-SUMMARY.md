---
plan: 01-02
phase: 01-rls-audit-policy-deployment
status: complete
started: 2026-03-11
completed: 2026-03-11
duration: ~5 min
---

# Plan 01-02 Summary: Deploy RLS & Verify Enforcement

## What Was Done

### Task 1: Deploy SQL migrations
- **Discovery:** Audit via Management API revealed all 11 tables already had RLS enabled, BUT each had an "Allow all" policy (`qual = true`) alongside the proper session-scoped policy
- **Root cause:** PERMISSIVE policies use OR logic — the "Allow all" policies negated all security
- **Fix:** Created `supabase-rls-fix.sql` that drops all 22 existing policies (11 "Allow all" + 11 old session policies) and re-creates 11 proper policies with `(SELECT auth.uid())` optimization
- **Deployed:** Via Supabase Management API (`POST /v1/projects/{ref}/database/query`)

### Task 2: Verify RLS enforcement
- **Anonymous API test:** Returns 0 rows ✅ (RLS blocks unauthenticated access)
- **Cross-session isolation:** User 992a sees own session but NOT other sessions ✅
- **Both-partner access (SEC-03):** Both player1 and player2 see the same 12 responses in their shared session ✅
- **Performance indexes:** 11 indexes created for `user_sessions.user_id`, `user_sessions.session_id`, and all feature table `session_id` columns

## Deviation from Plan

- **Original plan assumed manual Supabase Dashboard deployment** — instead used Supabase Management API via CLI token for fully automated deployment
- **Existing policies were different than expected** — research assumed no policies existed, but all tables had dual policies (proper + "Allow all"). The fix was a DROP + recreate rather than fresh creation
- **supabase-rls-fix.sql replaces supabase-rls-policies.sql** as the deployed migration — the original file was written for a clean-slate scenario

## Self-Check

- [x] All tasks executed
- [x] Committed: `9909863` feat(01-02): deploy RLS fix
- [x] Anonymous API returns 0 rows
- [x] Cross-session isolation verified
- [x] Both-partner access verified
- [x] `(SELECT auth.uid())` optimization in deployed policies

## Key Files

### Created
- `supabase-rls-fix.sql` — The actually-deployed migration (drops Allow-All, creates optimized policies)

### Not Modified (from Plan 01-01, still useful as reference)
- `supabase-rls-audit.sql` — Audit queries
- `supabase-rls-indexes.sql` — Index creation (indexes were included in fix SQL)
- `supabase-rls-policies.sql` — Original policies (superseded by fix SQL)

## Open Items

- **Realtime verification (SEC-06):** Not testable via API — requires two authenticated browser sessions. Should be verified during user testing.
- **Legacy sessions with null user_ids:** Some old sessions have no `player1_user_id`/`player2_user_id`. These are inaccessible via RLS until users sign in and auto-claim triggers. This is correct behavior.
