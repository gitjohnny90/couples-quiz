# Project Research Summary

**Project:** The Us Quiz — v1.0 Polish & Security Milestone
**Domain:** Live Supabase SPA hardening — RLS, polling fallbacks, data migration, bug fixes
**Researched:** 2026-03-10
**Confidence:** HIGH

## Executive Summary

This milestone is a hardening pass on an already-functional couples quiz app. No new features, game modes, or npm packages are introduced. The four work areas — Row Level Security, polling fallbacks, Predict Your Partner migration cleanup, and quiz bug fixes — are independent enough to be tackled in parallel but have a clear dependency ordering that reduces risk: data migration should run before RLS is enforced, RLS must be in place before the app can be considered secure, and quiz bug fixes are isolated client-side changes that can land last against a now-secured database.

The recommended approach is surgery, not renovation. The existing architecture (React 19 SPA + Supabase realtime + `useCallback`-stabilized polling fallbacks) is sound and already implemented correctly on most pages. The gaps are narrow and well-understood: several pages are missing `removeChannel + clearInterval` paired cleanup, RLS policies have not been systematically applied across all 12 feature tables, and QuizPage has no realtime or polling because it is submit-only — the reported bugs there are likely in the submit or button-state logic, not in data sync.

The key risk is RLS deployment. Enabling RLS on a table without simultaneously deploying a SELECT policy causes every client query to silently return zero rows — play testers see blank data with no error. This must be prevented by deploying `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` and the companion policy as a single SQL transaction, never as separate dashboard clicks. A secondary risk is that RLS also filters Supabase Realtime `postgres_changes` events — after adding policies, realtime must be explicitly validated from two browser windows as both partners.

## Key Findings

### Recommended Stack

No stack changes. All technologies are locked for this milestone. No new npm packages are needed. All work areas are achievable through SQL policy configuration, Supabase dashboard operations, and React hook discipline within the existing codebase.

**Core technologies (locked):**
- React 19 + Vite 7 + React Router DOM 7: frontend SPA — stable, not upgrading mid-milestone
- Supabase (auth, realtime, DB): backend — RLS is the primary target; realtime WebSocket has no built-in fallback, which is why polling is required
- Framer Motion: animations — untouched
- Vercel: deployment — untouched

**RLS implementation tool:** Supabase SQL Editor (raw SQL) — safer than JS client for migrations; runs as postgres role and bypasses RLS, enabling verification during the migration window.

### Expected Features

**Must have (table stakes for this milestone):**
- Polling fallback on all interactive pages — realtime silently drops on mobile background tabs; pattern exists on most pages but gaps remain in `DrawResultsPage` and `DeepDiveDeckPage` cleanup
- RLS enabled on every table — 12 tables require policies; currently unverified across all tables; high risk if any are unprotected
- Predict Your Partner reads/writes exclusively from `predict_partner` table — migration is done per commit 4982f6a; this milestone verifies no dual-write or dead code remains
- Quiz section bug fixes — QuizPage is submit-only with no realtime; bugs are likely in button/submit state logic, not sync

**Should have (quality improvements):**
- Conditional polling (stop when data is complete) — follows `ResultsPage` pattern; reduces unnecessary DB reads
- Paired `removeChannel + clearInterval` cleanup in every page — currently inconsistent; standardize to prevent channel leaks
- Error states visible on quiz save failures — `QuizPage` already has `setError` plumbing; ensure it propagates correctly

**Defer (explicitly out of scope):**
- Any new features or game modes
- Visual or UX changes
- New database tables or schema changes beyond what migration requires
- React Suspense or Error Boundaries

### Architecture Approach

The existing four-step page pattern (load on mount, subscribe to realtime, poll as fallback, clean up on unmount) is the correct and established architecture for this app. No new components or routes are needed. All work happens either within existing page files or at the Supabase database/policy layer. The `user_sessions` table is the critical join point: every RLS policy on every feature table routes through it (`session_id IN (SELECT session_id FROM user_sessions WHERE user_id = auth.uid())`), making it the single source of truth for session membership.

**Major components (unchanged, roles clarified):**
1. `AuthContext` — Supabase auth session; unchanged; guards all routes via `RequireAuth`
2. `SessionContext` (App.jsx) — `sessionId`, `playerName`, `playerId` from localStorage; unchanged; consumed by all feature pages
3. Feature pages (src/pages/) — individual data fetch + realtime + render; polling fallbacks are the target of this milestone's client-side work
4. Supabase RLS policies — row-level access control; the primary target of the security phase; scoped through `user_sessions` join
5. `user_sessions` table — the keystone join table; requires `idx_user_sessions_user_id` index to avoid full table scans per RLS policy evaluation

**Build order (dependency-driven):**
1. RLS audit (understand current state) → 2. PYP migration (run before strict RLS blocks it) → 3. RLS deployment (all tables, atomically) → 4. Polling fallback standardization → 5. Quiz bug fixes

### Critical Pitfalls

1. **RLS enabled without simultaneous policy = silent empty data** — deploy `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` and the SELECT policy as a single SQL statement, never separately; verify from the browser (not Supabase SQL Editor, which bypasses RLS as postgres superuser)

2. **RLS also silently blocks Realtime `postgres_changes` events** — after adding policies to any table, explicitly test realtime delivery from two browser windows logged in as both partners; polling fallback will mask the failure (updates arrive every 5s instead of instantly)

3. **`sessions` table policy written for player1 only breaks player2 everywhere** — the policy must use `player1_user_id = auth.uid() OR player2_user_id = auth.uid()`; test explicitly as player2 before marking RLS phase complete

4. **INSERT/UPDATE RLS policies missing `WITH CHECK` allow cross-session data injection** — `USING` only filters reads; `WITH CHECK` validates the values being written; every write policy needs both

5. **PYP migration window: in-flight writes go to `responses`, reads come from `predict_partner`** — treat migration as a coordinated deploy; run migration SQL and confirm zero remaining `responses` rows with `pack_id LIKE 'predict-%'` before the deploy window closes; use `ON CONFLICT DO NOTHING` to make the migration idempotent

## Implications for Roadmap

Based on combined research, four phases in strict dependency order:

### Phase 1: RLS Audit and Policy Deployment

**Rationale:** Security must come before the app is considered hardened. Running the data migration before RLS is live means the migration SQL executes as postgres superuser without policy interference. RLS is the foundational change everything else rests on.

**Delivers:** All 12 feature tables protected; both partners can access only their own session data; no cross-session data leakage possible via REST API.

**Addresses:** RLS table stakes requirement; CVE-2025-48757 class of misconfiguration.

**Avoids:** Silent empty data (deploy enable + policy atomically); player2 lockout (OR both user_id columns on sessions); realtime filtering (test realtime after each table's policy is deployed); cross-session injection (WITH CHECK on all write policies); multiple-policy performance hit (one combined OR policy per table).

**Key work:**
- Add `idx_user_sessions_user_id` and per-table `session_id` indexes first
- Write and deploy SQL migration file covering all 13 tables
- Validate from browser as both player1 and player2
- Validate realtime delivery from two browser windows after each table

**Research flag:** No additional research needed — patterns are high-confidence from official Supabase docs.

### Phase 2: Predict Your Partner Migration Cleanup

**Rationale:** Data migration must happen before RLS is enforced on `predict_partner` (so the migration SQL runs without policy interference). However, it is documented here after Phase 1 because the code cleanup (removing dead references to `responses` for PYP pack IDs) is a code change that can be validated after RLS is live and the app is confirmed working.

**Delivers:** `predict_partner` table is the sole data store for PYP; no dead code paths reading `responses` for PYP data; old orphan rows in `responses` confirmed harmless and documented for future cleanup.

**Addresses:** PYP migration cleanup table stakes item; confirms commit 4982f6a is complete end-to-end.

**Avoids:** Duplicate rows (use `ON CONFLICT (session_id, pack_id, player_id, question_index) DO NOTHING`); data loss during migration window (run migration before code deploy; verify COUNT); in-flight write conflicts (coordinated deploy timing).

**Key work:**
- Inspect `responses WHERE pack_id LIKE 'predict-%'` to confirm actual JSONB shape
- Run idempotent backfill SQL if any historical rows remain
- Audit `PredictPartnerPage.jsx` for any remaining `responses` references
- Confirm `predict_partner` row counts post-migration

**Research flag:** No additional research needed — migration is largely complete; this is verification and cleanup.

### Phase 3: Polling Fallback Standardization

**Rationale:** Pure client-side enhancement with no DB dependency. Benefits from being tested against the final secured database to confirm RLS does not interfere with polling queries.

**Delivers:** Every interactive page has a 5s polling fallback alongside realtime; paired `removeChannel + clearInterval` cleanup is consistent across all pages; no channel leaks on navigation.

**Addresses:** Polling fallback table stakes; `DrawResultsPage` and `DeepDiveDeckPage` cleanup gaps; stale-closure risk on any new polling `useEffect`.

**Avoids:** Stale closure (use `useCallback` with `sessionId` in deps, following `HotTakesPage` pattern); over-fetching (gate polling behind "waiting for partner" condition, following `ResultsPage` pattern); unmounted-component state updates (add `active` ref guard in polling functions); channel name collision on undefined sessionId (guard: `if (!sessionId) return` before `supabase.channel(...)`).

**Key work:**
- Audit all pages against the scope inventory table in FEATURES.md
- For pages needing polling: add `useCallback`-wrapped fetch + `setInterval` + cleanup
- Standardize `removeChannel + clearInterval` pairing in every existing subscription
- Add conditional polling guards where missing

**Research flag:** No additional research needed — pattern is well-established in existing codebase.

### Phase 4: Quiz Bug Fixes

**Rationale:** Highest user pain, but isolated to quiz pages with no DB schema changes. Comes last so it is validated against the now-secured, stable database. Quiz bugs are most likely in submit logic and button state, not in data sync (QuizPage is submit-only with no realtime).

**Delivers:** Quiz submission is reliable; buttons respond correctly; error states are visible on network failure; ResultsPage realtime filter covers all event types.

**Addresses:** Quiz bug fixes table stakes; QuizPage submit-state flow; ResultsPage INSERT-only realtime filter gap.

**Avoids:** isMounted-state-update-on-unmount (add `isMounted` ref guard in QuizPage async handlers); ResultsPage polling stopping too early (poll until both player IDs represented, not just count >= 2); channel name reuse (verify channel name uniqueness per component).

**Key work:**
- Audit QuizPage submit flow: `sessionId` sync from URL params, `submitted` state reset on error, save error visibility
- Change ResultsPage realtime filter from `INSERT` to `*` to catch updates
- Verify polling gate logic catches the case where one response loads before realtime subscribes

**Research flag:** No additional research needed — issues are identified from direct code inspection.

### Phase Ordering Rationale

- RLS before migration: ensures migration SQL runs as postgres superuser without interference; also ensures RLS is live before the app handles real production traffic
- Migration before quiz fixes: database must be stable before validating quiz submission behavior end-to-end
- Polling before quiz fixes: ensures partner-sync infrastructure is solid before debugging quiz-specific submission flows
- Quiz fixes last: lowest DB coupling; safest to land last when everything else is confirmed working

### Research Flags

Phases needing deeper research during planning: none — all four phases have high-confidence patterns from official documentation and direct codebase inspection.

Phases with standard, established patterns (skip research-phase):
- **Phase 1 (RLS):** Official Supabase docs cover exact policy syntax; `user_sessions`-join pattern is app-specific but straightforward
- **Phase 2 (Migration):** SQL backfill pattern is standard; main unknown is actual JSONB shape in `responses` (inspect before writing migration)
- **Phase 3 (Polling):** Pattern already implemented correctly in 5+ pages; pure replication
- **Phase 4 (Quiz fixes):** Issues identified from source; fixes are targeted and localized

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies locked; no new dependencies; verified from codebase |
| Features | HIGH | Scope inventory built from direct page-by-page code audit |
| Architecture | HIGH | Patterns verified from source files; RLS policy structure inferred from app code (actual existing policies not yet audited) |
| Pitfalls | HIGH | RLS and realtime pitfalls from official Supabase docs; migration pitfalls from community sources + codebase review |

**Overall confidence:** HIGH

### Gaps to Address

- **Actual existing RLS policy state:** The research confirmed what policies _should_ look like but did not audit what is currently deployed in the Supabase dashboard. Phase 1 must begin with a dashboard audit (Security Advisors + Table Editor) to identify which tables already have RLS enabled and which policies exist.
- **Actual JSONB shape of legacy PYP responses:** STACK.md and ARCHITECTURE.md note that the migration SQL template must be adapted to the actual field names stored in `responses.answers` for PYP pack IDs. Run `SELECT answers FROM responses WHERE pack_id LIKE 'predict-%' LIMIT 5` before writing the migration.
- **Pages with unknown polling status:** STACK.md flags `DeepDiveDeckPage`, `LoveNoteHuntPage`, `DrawPage`, `StudyTogetherPage`, and `MissYouHeart` as needing polling audits. FEATURES.md scope inventory partially resolves this — most have polling, but `removeChannel` cleanup needs verification in several.

## Sources

### Primary (HIGH confidence)
- [Supabase RLS Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) — policy syntax, USING vs WITH CHECK, FOR ALL vs per-operation
- [Supabase RLS Performance and Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) — `(SELECT auth.uid())` initPlan optimization, subquery vs join
- [Supabase Realtime Postgres Changes with RLS](https://supabase.com/blog/realtime-row-level-security-in-postgresql) — realtime event filtering by RLS policy
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime) — WebSocket-only architecture, no built-in fallback
- [Supabase Performance and Security Advisors](https://supabase.com/docs/guides/database/database-advisors) — multiple permissive policies detection
- [React stale closures with setInterval — overreacted.io](https://overreacted.io/making-setinterval-declarative-with-react-hooks/) — `useCallback` pattern for stable interval callbacks
- Codebase inspection: `src/pages/` (all feature pages), `src/App.jsx`, `src/contexts/AuthContext.jsx`, `src/utils/reactions.js`, `.planning/PROJECT.md`, `CLAUDE.md`

### Secondary (MEDIUM confidence)
- [Supabase Realtime silent disconnections](https://supabase.com/docs/guides/troubleshooting/realtime-handling-silent-disconnections-in-backgrounded-applications-592794) — background tab heartbeat drops
- [Supabase auto-reconnect discussion #27513](https://github.com/orgs/supabase/discussions/27513) — community-confirmed reconnect behavior
- [Supabase concurrent writes discussion #30334](https://github.com/orgs/supabase/discussions/30334) — migration race condition patterns
- [RLS via another table — Supabase Discussion #18761](https://github.com/orgs/supabase/discussions/18761) — IN subquery recommendation over JOIN

### Tertiary (MEDIUM-LOW confidence)
- [CVE-2025-48757 / RLS misconfiguration risk](https://vibeappscanner.com/supabase-row-level-security) — single source; motivates RLS priority but not relied upon for technical decisions

---
*Research completed: 2026-03-10*
*Ready for roadmap: yes*
