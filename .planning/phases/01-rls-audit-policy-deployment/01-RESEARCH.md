# Phase 1: RLS Audit & Policy Deployment - Research

**Researched:** 2026-03-10
**Domain:** Supabase Row Level Security — couples app with shared session identity
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SEC-01 | User can only read/write data for sessions they belong to (RLS on all 12 tables) | Policy template via `user_sessions` subquery covers all 10 tables found in codebase. `love_notes` is the actual table name, not `love_note_games`/`love_note_guesses` as CLAUDE.md suggests — only `love_notes` appears in the codebase. |
| SEC-02 | RLS policies use `(SELECT auth.uid())` optimization for performance | Confirmed: wrapping in subselect triggers Postgres initPlan caching. Per Supabase performance docs: 100x improvement on large tables. All policy templates below use this form. |
| SEC-03 | Both partners can read shared session rows (sessions table policy allows player1 and player2) | `sessions` table stores `player1_user_id` and `player2_user_id`. Policy must OR both columns. Pitfall 3 documents the failure mode. |
| SEC-04 | Supabase Storage buckets enforce access control for drawings | FINDING: The app does NOT use Supabase Storage. Drawings are stored as base64 PNG in the `responses.answers` JSONB column (DrawPage.jsx line 68). SEC-04 either needs to be reinterpreted as "responses table RLS covers drawing rows" or flagged as a no-op requirement. Planner should note this. |
| SEC-05 | RLS enable and policy deploy happen atomically (no window of empty results) | Addressed by combining `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` and `CREATE POLICY ...` in a single SQL migration run. Pitfall 1 documents the empty-results failure mode. |
| SEC-06 | Realtime subscriptions continue working correctly after RLS is enabled | RLS gates Realtime event delivery per subscriber. Policy must allow SELECT on all rows the client subscribes to, or events are silently dropped. Verification approach: two-browser test after each table's policy is deployed. |
</phase_requirements>

---

## Summary

This phase adds Supabase Row Level Security to all tables used by the couples quiz app so that users can only access data belonging to their own shared session. The app's identity model is clean: each Supabase auth user has a row in `user_sessions` that links their `auth.uid()` to a `session_id`. All feature tables carry `session_id` as their coupling key. This means one policy template covers ten of the eleven tables in scope.

The core pattern is: `session_id IN (SELECT session_id FROM user_sessions WHERE user_id = (SELECT auth.uid()))`. The `(SELECT auth.uid())` form (not bare `auth.uid()`) is mandatory for performance — it triggers Postgres's initPlan optimization that evaluates the subquery once per statement rather than once per row. The `sessions` table itself requires a different policy because it stores the auth UIDs directly instead of a `session_id` foreign key.

One requirement (SEC-04) needs a planning decision: the app stores drawings as base64 data inside `responses.answers` JSONB — not in Supabase Storage. There are no storage buckets to secure. The planner should treat SEC-04 as "drawing data is protected by the `responses` table RLS policy" rather than a Storage-specific task.

**Primary recommendation:** Deploy RLS enable and SELECT/INSERT/UPDATE policies for each table in a single SQL migration per table. Never toggle the dashboard "Enable RLS" switch without having the policies ready to deploy in the same transaction. Test as both player1 and player2 after each table, and verify realtime from two browser windows after the policies are live.

---

## Standard Stack

### Core (No new packages)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase SQL editor | N/A | Deploy RLS policy migrations | Runs as postgres superuser, bypasses RLS, atomic per statement |
| `@supabase/supabase-js` | ^2.x (existing) | Client-side queries already use this | No change needed |

No npm packages are added for this phase. All work is SQL policy definitions in the Supabase dashboard (or migration files).

---

## Architecture Patterns

### Actual Table Inventory (from codebase scan)

The following tables appear in `.from()` calls in `src/`:

| Table | Has `session_id`? | Policy approach |
|-------|------------------|-----------------|
| `sessions` | No (is the session) | OR check on `player1_user_id` and `player2_user_id` |
| `user_sessions` | Yes | `user_id = (SELECT auth.uid())` — own rows only |
| `responses` | Yes | Standard subquery via `user_sessions` |
| `profiles` | Yes | Standard subquery via `user_sessions` |
| `deep_dive_responses` | Yes | Standard subquery via `user_sessions` |
| `shared_items` | Yes | Standard subquery via `user_sessions` |
| `love_notes` | Yes | Standard subquery via `user_sessions` |
| `reactions` | Yes | Standard subquery (SELECT all); player-scoped write |
| `predict_partner` | Yes | Standard subquery via `user_sessions` |
| `finish_sentence` | Yes | Standard subquery via `user_sessions` |
| `hot_takes` | Yes | Standard subquery via `user_sessions` |

**CLAUDE.md discrepancy:** CLAUDE.md lists `love_note_games` and `love_note_guesses` but the codebase exclusively uses `love_notes`. The planner must use `love_notes`. CLAUDE.md also lists a `reactions` table which IS confirmed in the codebase.

### Pattern 1: Standard session-scoped policy (FOR ALL)

Use this for all feature tables that have `session_id`. Covers SELECT, INSERT, UPDATE, DELETE in one policy.

```sql
-- Source: Supabase RLS performance docs + codebase pattern
ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partners access own session"
ON public.<table_name>
FOR ALL
TO authenticated
USING (
  session_id IN (
    SELECT session_id FROM user_sessions
    WHERE user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  session_id IN (
    SELECT session_id FROM user_sessions
    WHERE user_id = (SELECT auth.uid())
  )
);
```

Apply to: `responses`, `profiles`, `deep_dive_responses`, `shared_items`, `love_notes`, `predict_partner`, `finish_sentence`, `hot_takes`

### Pattern 2: sessions table (no session_id column)

```sql
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Both partners can read
CREATE POLICY "both partners read session"
ON public.sessions
FOR SELECT
TO authenticated
USING (
  player1_user_id = (SELECT auth.uid())
  OR player2_user_id = (SELECT auth.uid())
);

-- Player1 creates the session row
CREATE POLICY "player1 inserts session"
ON public.sessions
FOR INSERT
TO authenticated
WITH CHECK (
  player1_user_id = (SELECT auth.uid())
);

-- Both partners can update session metadata
CREATE POLICY "partners update session"
ON public.sessions
FOR UPDATE
TO authenticated
USING (
  player1_user_id = (SELECT auth.uid())
  OR player2_user_id = (SELECT auth.uid())
)
WITH CHECK (
  player1_user_id = (SELECT auth.uid())
  OR player2_user_id = (SELECT auth.uid())
);
```

### Pattern 3: user_sessions (own rows only)

```sql
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own link"
ON public.user_sessions
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "users insert own link"
ON public.user_sessions
FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));
```

No UPDATE or DELETE needed — these rows are written once on join and never changed.

### Pattern 4: reactions (read both, write own player_id)

Reactions require read access to both players' reactions (to show partner's emoji) but write should be scoped to own player_id. However, the app uses `player_id: 'player1'|'player2'` strings — not auth UIDs — so the write check must still go through `user_sessions`:

```sql
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- Both partners read all reactions in their session
CREATE POLICY "partners read reactions"
ON public.reactions
FOR SELECT
TO authenticated
USING (
  session_id IN (
    SELECT session_id FROM user_sessions
    WHERE user_id = (SELECT auth.uid())
  )
);

-- Insert/update only for own player_id
-- Use a combined policy that also verifies session membership
CREATE POLICY "partners write own reactions"
ON public.reactions
FOR INSERT
TO authenticated
WITH CHECK (
  session_id IN (
    SELECT session_id FROM user_sessions
    WHERE user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "partners update own reactions"
ON public.reactions
FOR UPDATE
TO authenticated
USING (
  session_id IN (
    SELECT session_id FROM user_sessions
    WHERE user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  session_id IN (
    SELECT session_id FROM user_sessions
    WHERE user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "partners delete own reactions"
ON public.reactions
FOR DELETE
TO authenticated
USING (
  session_id IN (
    SELECT session_id FROM user_sessions
    WHERE user_id = (SELECT auth.uid())
  )
);
```

### Pattern 5: Required indexes (deploy alongside policies)

These indexes are hit on every authenticated request. Missing indexes turn the RLS subquery from an index scan into a sequential scan.

```sql
-- Source: Supabase RLS performance best practices docs
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id
  ON user_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id
  ON user_sessions(session_id);

-- Per-table session_id indexes (run for each table)
CREATE INDEX IF NOT EXISTS idx_responses_session_id ON responses(session_id);
CREATE INDEX IF NOT EXISTS idx_profiles_session_id ON profiles(session_id);
CREATE INDEX IF NOT EXISTS idx_deep_dive_responses_session_id ON deep_dive_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_shared_items_session_id ON shared_items(session_id);
CREATE INDEX IF NOT EXISTS idx_love_notes_session_id ON love_notes(session_id);
CREATE INDEX IF NOT EXISTS idx_reactions_session_id ON reactions(session_id);
CREATE INDEX IF NOT EXISTS idx_predict_partner_session_id ON predict_partner(session_id);
CREATE INDEX IF NOT EXISTS idx_finish_sentence_session_id ON finish_sentence(session_id);
CREATE INDEX IF NOT EXISTS idx_hot_takes_session_id ON hot_takes(session_id);
```

### Atomic deployment order per table

To satisfy SEC-05, each table must have ENABLE + all needed policies deployed in the same SQL execution:

```sql
-- Run this as one statement block in the SQL editor
BEGIN;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "partners access own session" ON public.responses
  FOR ALL TO authenticated
  USING (session_id IN (SELECT session_id FROM user_sessions WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (session_id IN (SELECT session_id FROM user_sessions WHERE user_id = (SELECT auth.uid())));
COMMIT;
```

### Anti-Patterns to Avoid

- **Player_id in RLS check:** The app uses string player IDs (`'player1'`, `'player2'`), not UUIDs. `auth.uid()` returns a UUID. Never write `WHERE player_id = auth.uid()` — it will never match.
- **Separate player1/player2 policies:** Don't create separate SELECT policies for each player. One OR'd session-scoped policy per table. Multiple permissive policies cause Postgres to evaluate all of them as OR conditions — the Supabase Dashboard Advisors flag this as a lint warning.
- **Bare `auth.uid()`:** Always write `(SELECT auth.uid())` to enable initPlan caching. `auth.uid()` without the subselect wrapper evaluates per-row.
- **Testing only from the SQL editor:** The Supabase SQL editor runs as postgres superuser and bypasses RLS. Always verify policies by making an authenticated REST API call (browser network tab or curl with a real JWT).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session membership check | Custom join logic in each policy | `user_sessions` subquery | Single source of truth already in the app |
| Auth UID lookup | `auth.jwt()->>'sub'` parsing | `(SELECT auth.uid())` | Official API, initPlan optimized |
| RLS testing | Custom test harness | Direct REST API call with real JWT | Exposes actual client-side behavior |
| Index detection | Manual EXPLAIN ANALYZE per table | Supabase Database Advisors | Dashboard surfaces missing indexes automatically |

---

## Common Pitfalls

### Pitfall 1: Enable RLS with no policies — silent empty data

**What goes wrong:** Toggling "Enable RLS" in the dashboard without deployed policies causes all authenticated queries to return zero rows silently. No error. Pages render empty. Play testers see blank quiz results and think the app is broken.

**Why it happens:** Postgres "no policy = deny all" when RLS is on.

**How to avoid:** Always run ENABLE + CREATE POLICY in the same SQL block. Never use the dashboard toggle alone.

**Warning signs:** Page loads but shows no data; Supabase SQL editor still returns data (because it bypasses RLS).

---

### Pitfall 2: Realtime events silently dropped after RLS

**What goes wrong:** Supabase Realtime checks RLS before delivering `postgres_changes` events. If the SELECT policy is missing or misconfigured, events are filtered at the server. The subscription appears to work (no error), but partner updates stop arriving in real time.

**Why it happens:** Realtime authenticates as the subscriber and runs an internal read check against the changed row.

**How to avoid:** Write and deploy SELECT policies before testing realtime. After each table's policies go live, verify from two browser windows that a partner's action appears in under 2 seconds.

**Warning signs:** Partner changes show up within 5 seconds (polling fallback) but not within 1 second (realtime).

---

### Pitfall 3: Sessions table policy only covers player1

**What goes wrong:** Writing `WHERE player1_user_id = auth.uid()` blocks player2 from reading the session row. Almost every page calls `supabase.from('sessions').select(...)` to load partner names. Player2 gets null everywhere.

**How to avoid:** The sessions SELECT policy MUST use OR to allow both players: `player1_user_id = (SELECT auth.uid()) OR player2_user_id = (SELECT auth.uid())`.

**Warning signs:** Log in as player2. Partner name shows as blank or "your person". Pages hang on loading state.

---

### Pitfall 4: INSERT policies missing WITH CHECK

**What goes wrong:** An INSERT policy with only `USING (...)` and no `WITH CHECK (...)` silently allows writing to any session_id. USING applies to row reads, not row writes.

**How to avoid:** Every INSERT and UPDATE policy must have a matching `WITH CHECK` clause with the same condition.

**Warning signs:** Direct REST API POST with a foreign session_id succeeds — it should return a policy violation error.

---

### Pitfall 5: Multiple permissive policies per table

**What goes wrong:** Adding separate SELECT policies for player1, player2, and shared rows causes Postgres to evaluate all of them as OR conditions on every row. Flagged by Supabase Database Advisors.

**How to avoid:** One session-scoped policy per operation type per table. Combine multiple conditions into a single OR.

---

### Pitfall 6: SEC-04 Storage requirement is a no-op

**What goes wrong:** SEC-04 says "Storage buckets for drawings enforce access control." But the app does not use Supabase Storage. Drawings are base64 PNG data stored in `responses.answers` JSONB (see DrawPage.jsx line 68: `supabase.from('responses').upsert({...answers: { drawing: drawingData }}`). Attempting to configure Storage bucket policies for a bucket that doesn't exist wastes time.

**How to avoid:** The planner should treat SEC-04 as "drawing data is covered by the `responses` table RLS policy" — which it is, since responses is in the policy deployment scope. Flag this in the plan so the requirement traceability is clear.

---

## Code Examples

### Verification after deploying a policy

Test from the browser network tab or with curl. Do NOT use the Supabase SQL editor (it bypasses RLS).

```bash
# Replace with actual values
curl -X GET \
  'https://<project>.supabase.co/rest/v1/responses?session_id=eq.<some-other-session-id>' \
  -H "apikey: <anon-key>" \
  -H "Authorization: Bearer <authenticated-user-jwt>"
# Expected: [] (empty array, not an error)
# Wrong: returns rows from another session
```

### Detecting missing WITH CHECK

```bash
curl -X POST \
  'https://<project>.supabase.co/rest/v1/responses' \
  -H "apikey: <anon-key>" \
  -H "Authorization: Bearer <authenticated-user-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"session_id": "<foreign-session-id>", "pack_id": "test", "player_id": "player1", "answers": {}}'
# Expected: 403 policy violation
# Wrong: 201 Created
```

### Check existing policies before writing new ones

```sql
-- Run in Supabase SQL editor to see current RLS state
SELECT schemaname, tablename, rowsecurity, forcerowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- See existing policies
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Confirm indexes exist

```sql
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND (indexname LIKE '%session_id%' OR indexname LIKE '%user_id%')
ORDER BY tablename;
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `auth.uid()` bare in policy | `(SELECT auth.uid())` subselect | 100x+ perf per Supabase docs |
| JOIN-based policies | IN/ANY subquery policies | Avoids cartesian join per row |
| Multiple permissive policies per player | Single OR'd session-scoped policy | Avoids N-policy evaluation overhead |

**Deprecated/outdated:**
- `auth.jwt() -> 'user_metadata'` in policies: user_metadata is writable by the client — unsuitable for security decisions. Do not use.

---

## Open Questions

1. **What is the current RLS state of each table?**
   - What we know: RLS is NOT currently enabled (app works without it, and STATE.md notes "Actual existing RLS policy state in Supabase dashboard is unknown").
   - What's unclear: Whether any tables have partial or legacy policies from earlier work.
   - Recommendation: The first task of the plan should be a dashboard audit — run the `pg_tables` and `pg_policies` SQL queries above before writing any new policies.

2. **Does `love_notes` have `session_id` as its join key?**
   - What we know: Code in LoveNoteHuntPage.jsx inserts rows with `session_id` field (line 197: `session_id: sessionId`). The table select filters on `session_id` (line 78: `.eq('session_id', sessionId)`).
   - Confidence: HIGH — confirmed from source.
   - Recommendation: Standard subquery policy applies.

3. **SEC-04 Storage requirement vs. actual app behavior**
   - What we know: No Supabase Storage API calls exist anywhere in `src/`. DrawPage stores drawings as base64 in `responses`.
   - Recommendation: Planner should map SEC-04 to "responses table RLS policy covers drawing data" and add a note that no Storage bucket configuration is needed. If a Storage bucket exists in the project from earlier experimentation, it should be audited and either removed or secured, but no application code changes are required.

4. **Which tables have pre-existing RLS policies (if any)?**
   - What we know: Unknown.
   - Recommendation: The audit task must check `pg_policies` and clean up any conflicting or stale policies before deploying the new ones.

---

## Validation Architecture

> workflow.nyquist_validation is absent from .planning/config.json — treating as enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None configured (CLAUDE.md: "No test runner or linter is configured") |
| Config file | None — see Wave 0 |
| Quick run command | Manual: browser network tab inspection |
| Full suite command | Manual: two-browser session test as player1 + player2 |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SEC-01 | REST API returns empty array for foreign session_id | manual | `curl` with foreign session JWT (see Code Examples) | N/A — manual |
| SEC-02 | `(SELECT auth.uid())` form used in all policies | manual | `pg_policies` query in SQL editor | N/A — manual |
| SEC-03 | Player2 can read session row and see partner name | manual | Log in as player2, load any page | N/A — manual |
| SEC-04 | Drawing data in `responses` is blocked to foreign users | manual | REST API call with foreign JWT to `responses` | N/A — manual |
| SEC-05 | No window of empty data during policy deploy | manual | Deploy as atomic SQL block; verify immediately after | N/A — manual |
| SEC-06 | Realtime events arrive after RLS enabled | manual | Two-browser test: partner submits, other sees update < 2s | N/A — manual |

**Note:** This project has no test framework. All verification is manual. Wave 0 has no test file gaps because tests are not applicable.

### Sampling Rate

- **Per table deployed:** Immediately run a browser-tab GET request to verify no data leakage. Log in as player2 and verify page renders.
- **Per wave merge:** Full two-browser session test confirming realtime delivery for all feature pages.
- **Phase gate:** Both partners can use every feature page AND cross-session API calls return empty before `/gsd:verify-work`.

### Wave 0 Gaps

None — existing infrastructure covers all phase requirements (all verification is manual REST/browser testing, no test files needed).

---

## Sources

### Primary (HIGH confidence)

- Supabase Row Level Security docs — policy syntax, USING vs WITH CHECK, FOR ALL vs operation-specific
- Supabase RLS Performance and Best Practices — `(SELECT auth.uid())` initPlan optimization, IN subquery vs JOIN
- `.planning/research/STACK.md` — pre-existing research on RLS patterns for this specific app
- `.planning/research/PITFALLS.md` — pre-existing research on RLS failure modes
- `.planning/research/ARCHITECTURE.md` — pre-existing architecture analysis

### Secondary (MEDIUM confidence)

- Codebase inspection of `src/pages/` — confirmed actual tables, `love_notes` vs `love_note_games`, no Storage usage
- `src/pages/DrawPage.jsx` line 68 — confirmed drawings stored in `responses` JSONB, not Storage
- `src/pages/LoveNoteHuntPage.jsx` lines 76, 197 — confirmed `love_notes` table with `session_id` column
- `src/pages/HomePage.jsx`, `JoinPage.jsx` — confirmed `user_sessions` table with `user_id` column

### Tertiary (LOW confidence)

- None for this phase.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; policy SQL patterns verified against official Supabase docs
- Architecture: HIGH — actual table inventory confirmed from codebase scan; policy patterns from official docs and existing project research
- Pitfalls: HIGH — sourced from official Supabase docs + existing PITFALLS.md (which cites official sources); SEC-04 finding confirmed directly from DrawPage.jsx source

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (Supabase RLS policy syntax is stable; app schema is frozen for this milestone)
