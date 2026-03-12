---
phase: 01-rls-audit-policy-deployment
verified: 2026-03-11T00:00:00Z
status: gaps_found
score: 4/6 truths verified
re_verification: false
gaps:
  - truth: "Both partners can read and write all feature data for their shared session"
    status: failed
    reason: "The sessions table policy in supabase-rls-fix.sql uses a user_sessions join subquery for both USING and WITH CHECK. This means inserting a new sessions row requires a user_sessions row to already exist — but autoCreate() in HomePage.jsx inserts into sessions FIRST (line 214), then user_sessions (line 227). autoJoin() updates sessions (line 181) before inserting user_sessions (line 191). Legacy claim also updates sessions before user_sessions upsert. All three onboarding flows would fail the WITH CHECK on the sessions INSERT/UPDATE."
    artifacts:
      - path: "supabase-rls-fix.sql"
        issue: "sessions FOR ALL policy uses user_sessions join in WITH CHECK — blocks session creation/join because user_sessions row doesn't exist yet when sessions is written"
      - path: "src/pages/HomePage.jsx"
        issue: "autoCreate (line 214) and autoJoin (line 181) write to sessions before creating user_sessions row — violates the deployed sessions policy"
    missing:
      - "sessions INSERT policy should use player1_user_id = (SELECT auth.uid()) as the WITH CHECK condition, not the user_sessions join subquery (matches original supabase-rls-policies.sql design)"
      - "sessions UPDATE policy for player2 joining should allow update when player1_user_id matches the invite_code lookup result — or the join flow needs reordering"

  - truth: "Realtime subscriptions deliver partner updates after RLS is enabled"
    status: failed
    reason: "SEC-06 was explicitly flagged as untestable via API in the 01-02 SUMMARY. No browser-based verification was performed. This is a blocking requirement that cannot be verified programmatically."
    artifacts: []
    missing:
      - "Human browser verification: two authenticated sessions, one submits data, other confirms realtime delivery within 2 seconds"

human_verification:
  - test: "New couple onboarding — create a fresh account and pair with a partner"
    expected: "Player 1 can sign up, create a session, and share the invite code. Player 2 can sign up with the invite code and join. Both are redirected to the vault. No errors on any page."
    why_human: "The sessions table policy in supabase-rls-fix.sql may block new session creation because it requires a user_sessions row before allowing sessions INSERT — this cannot be verified without actually creating a new Supabase auth user and running the onboarding flow."

  - test: "Realtime partner updates (SEC-06)"
    expected: "In Browser A (Player 1), submit a quiz answer. In Browser B (Player 2), the answer appears within 2 seconds without refreshing. If it takes 3-5 seconds, realtime may be broken and polling fallback is catching it."
    why_human: "Realtime event delivery requires two authenticated WebSocket connections to a live Supabase project. Cannot be verified via REST API or SQL inspection."
---

# Phase 1: RLS Audit & Policy Deployment — Verification Report

**Phase Goal:** Users can only access data belonging to their own session — no cross-session data leakage via the Supabase REST API
**Verified:** 2026-03-11
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | RLS is enabled on all 11 tables in the Supabase project | VERIFIED | Tables already had RLS enabled prior to Phase 1; supabase-rls-fix.sql dropped "Allow all" policies and replaced with session-scoped policies. Deployment confirmed via Management API. |
| 2 | Both partners can read and write all feature data for their shared session | FAILED | The sessions table policy in supabase-rls-fix.sql uses a user_sessions join for WITH CHECK, blocking new session INSERT/UPDATE before user_sessions row exists. All three onboarding flows (autoCreate, autoJoin, legacy claim) write to sessions before user_sessions. |
| 3 | Neither partner can read data from a different couple's session | VERIFIED | 01-02 SUMMARY confirms anonymous API returns 0 rows and cross-session isolation was verified: User 992a cannot read other sessions. Core session_id subquery pattern is correct. |
| 4 | Drawing data in responses table is protected (SEC-04 covered) | VERIFIED | App stores drawings as base64 in responses.answers JSONB (confirmed in DrawPage.jsx line 68-77). No Supabase Storage buckets used. The responses table RLS policy covers SEC-04. |
| 5 | Performance indexes deployed for RLS subquery optimization (SEC-02) | VERIFIED | supabase-rls-fix.sql creates 11 indexes (idx_user_sessions_user_id, idx_user_sessions_session_id, plus session_id indexes on all 9 feature tables). All auth.uid() calls wrapped as (SELECT auth.uid()). No bare auth.uid() found. |
| 6 | Realtime subscriptions deliver partner updates after RLS is enabled | FAILED | 01-02 SUMMARY explicitly states: "Not testable via API — requires two authenticated browser sessions." No browser verification was performed. |

**Score:** 4/6 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase-rls-audit.sql` | Pre-deployment diagnostic queries | VERIFIED | Contains 3 queries: pg_tables (rowsecurity), pg_policies (existing policies), pg_indexes (index inventory). Substantive and correct. |
| `supabase-rls-indexes.sql` | Performance indexes on all tables | VERIFIED | 11 CREATE INDEX IF NOT EXISTS statements. All expected tables covered. Idempotent. |
| `supabase-rls-policies.sql` | Atomic RLS enable + policies (original plan) | VERIFIED (reference only) | Well-formed with BEGIN/COMMIT blocks and correct player1/player2_user_id sessions INSERT policy. Superseded by supabase-rls-fix.sql due to pre-existing policies. |
| `supabase-rls-fix.sql` | Actually-deployed migration | PARTIAL | 11 correct session-scoped policies with (SELECT auth.uid()) optimization. Sessions table policy has a bootstrap flaw in WITH CHECK. No BEGIN/COMMIT wrappers. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| supabase-rls-fix.sql policies | user_sessions table | subquery in USING/WITH CHECK | WIRED | All 9 feature tables use `session_id IN (SELECT session_id FROM user_sessions WHERE user_id = (SELECT auth.uid()))` |
| supabase-rls-fix.sql sessions policy | auth.uid() | user_sessions join | PARTIAL | USING clause works for existing sessions. WITH CHECK requires user_sessions row to pre-exist — breaks new session creation |
| supabase-rls-fix.sql reactions policy | session isolation | FOR ALL with session_id subquery | PARTIAL | Both partners can read all session reactions (correct). However, FOR ALL also allows one partner to delete the other's reactions via direct API call — app-level player_id filter is bypassable |
| App queries (HomePage.jsx) | sessions table | supabase.from('sessions').insert/.update | NOT VERIFIED | Cannot confirm app onboarding works with the deployed sessions policy without live browser test |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SEC-01 | 01-01, 01-02 | User can only read/write data for sessions they belong to (RLS on all 11 tables) | PARTIAL | Cross-session isolation verified via API. Session creation/join may be blocked by sessions policy bootstrap issue — needs human verification. |
| SEC-02 | 01-01, 01-02 | RLS policies use `(SELECT auth.uid())` optimization | VERIFIED | grep of supabase-rls-fix.sql finds 24 instances of `(SELECT auth.uid())`, zero bare `auth.uid()` calls. |
| SEC-03 | 01-01, 01-02 | Both partners can read shared session rows | VERIFIED (read) / UNCERTAIN (write) | Both partners confirmed to see same 12 responses in shared session. Sessions read via user_sessions join is correct. Write (join flow) is uncertain due to bootstrap concern. |
| SEC-04 | 01-01, 01-02 | Supabase Storage buckets enforce access control for drawings | VERIFIED (reinterpreted) | No Storage buckets exist. DrawPage.jsx stores drawings as base64 in responses.answers JSONB. Responses table policy covers this. Documented in supabase-rls-fix.sql header and supabase-rls-policies.sql footer. |
| SEC-05 | 01-01, 01-02 | RLS enable and policy deploy happen atomically | PARTIAL | Tables already had RLS enabled, so the ENABLE window concern doesn't apply here. supabase-rls-fix.sql has no BEGIN/COMMIT — a DROP->CREATE window exists between dropping "Allow all" and creating new policies. In practice, this window is sub-second and the Supabase Management API may execute atomically. No active security gap detected. |
| SEC-06 | 01-02 | Realtime subscriptions continue working correctly after RLS is enabled | UNVERIFIED | Explicitly flagged as untestable via API in 01-02 SUMMARY. Requires two-browser live test. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `supabase-rls-fix.sql` | 92-94 | sessions FOR ALL policy WITH CHECK uses user_sessions join | Blocker | New couple onboarding (session creation and partner join) requires writing sessions before user_sessions exists — policy rejects the write |
| `supabase-rls-fix.sql` | 122-125 | reactions FOR ALL allows cross-partner DELETE/UPDATE | Warning | A user could delete their partner's emoji reactions via direct API call, bypassing the app-level player_id filter in reactions.js |
| `supabase-rls-fix.sql` | (all) | No BEGIN/COMMIT transaction wrappers | Info | DROP->CREATE not atomic; sub-second empty-result window exists but is benign given the context |

### Human Verification Required

#### 1. New Couple Onboarding Test

**Test:** Create a brand new Supabase auth account. Complete sign-up, confirm email. On first login, observe whether the vault loads (session was created). Then in a separate incognito browser, create a second new account, paste the invite code, and complete the join flow.

**Expected:** Both accounts end up in the vault with both player names visible. No auth or permission errors in the browser console.

**Why human:** The sessions INSERT policy in supabase-rls-fix.sql uses a user_sessions join subquery for WITH CHECK. If the policy rejects the INSERT (because user_sessions doesn't exist yet), `autoCreate()` would throw an error on line 222 and the user would see "couldn't set up your session." This cannot be verified without a live Supabase project and a fresh account.

#### 2. Realtime Partner Update Test (SEC-06)

**Test:** Open the app in Browser A (Player 1). Open the same session in Browser B (Player 2). In Browser A, navigate to a quiz and submit an answer.

**Expected:** The answer appears in Browser B within 2 seconds without any manual refresh. If it takes 3-5 seconds, realtime is broken and the polling fallback is catching it.

**Why human:** Realtime event delivery requires authenticated WebSocket connections to a live Supabase project. The RLS policy must allow SELECT on the changed rows for the subscriber to receive the event. Cannot be tested via REST API or SQL file inspection.

### Gaps Summary

Two gaps block full goal achievement:

**Gap 1 — Sessions bootstrap flaw (blocker):** `supabase-rls-fix.sql` deploys a `FOR ALL` policy on the sessions table that gates both reads and writes through a `user_sessions` join. This is correct for reads (both partners already have user_sessions rows). However, for writes, the `WITH CHECK` clause checks `id IN (SELECT session_id FROM user_sessions WHERE ...)` — but when `autoCreate()` runs, the sessions row is inserted *before* the corresponding user_sessions row is created. The policy would reject this INSERT. The original `supabase-rls-policies.sql` had the correct design: a separate INSERT policy using `player1_user_id = (SELECT auth.uid())` that doesn't depend on user_sessions. The fix SQL simplified to a single `FOR ALL` policy but introduced this ordering dependency. The app may be broken for new user registration.

**Gap 2 — SEC-06 unverified (human required):** Realtime delivery after RLS was never tested in a browser. The 01-02 summary explicitly acknowledged this. The phase goal includes ensuring the app "works for both partners" — realtime is load-bearing for the couples experience (quiz sync, drawing sync, etc.).

---

_Verified: 2026-03-11_
_Verifier: Claude (gsd-verifier)_
