# Domain Pitfalls

**Domain:** Live Supabase app hardening — RLS, polling fallbacks, data migration
**Researched:** 2026-03-10
**Confidence:** HIGH (RLS/realtime from official docs + codebase inspection), MEDIUM (migration patterns from community sources)

---

## Critical Pitfalls

Mistakes that cause data loss, security holes, or user-facing breakage.

---

### Pitfall 1: RLS Enabled on a Table Without Adding Policies — Silent Empty Results

**What goes wrong:** Enabling RLS on a table without creating at least one policy causes every query from the anon/authenticated client to return zero rows silently. No error. The page just renders empty. Users think the app is broken.

**Why it happens:** Postgres treats "no policy = no access" when RLS is on. The Supabase dashboard's "Enable RLS" toggle does this immediately in production.

**Consequences for this app:** Every page that reads from `sessions`, `responses`, `profiles`, `deep_dive_responses`, `hot_takes`, `finish_sentence`, `predict_partner`, etc. will return empty data the moment RLS is toggled on with no policies in place. Play testers will see blank quiz results, empty game states, lost drawings.

**Prevention:** Never toggle RLS on a table without simultaneously deploying the SELECT policy for it. Do these as a single SQL migration, not as two separate dashboard clicks. Pattern for this app's tables:

```sql
-- Enable + policy together
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "session members read" ON responses
  FOR SELECT TO authenticated
  USING (
    session_id IN (
      SELECT session_id FROM user_sessions WHERE user_id = auth.uid()
    )
  );
```

**Detection:** After enabling, immediately run a SELECT from a browser network tab (not the Supabase SQL Editor). The SQL Editor runs as postgres superuser and bypasses RLS — it will always return data even when the client would see nothing.

**Phase:** RLS audit phase. Each table needs enable + policies deployed atomically.

---

### Pitfall 2: RLS Blocks Realtime `postgres_changes` Events Silently

**What goes wrong:** When RLS is enabled on a table, Supabase Realtime checks policies before delivering `postgres_changes` events to each subscriber. If the authenticated user's policy doesn't allow them to read the changed row, the event is silently dropped — no error, the subscription appears to work, but changes never arrive.

**Why it happens:** Realtime performs a per-event security check. It assumes the subscriber's JWT identity and runs an internal read query. If the RLS policy evaluates false, the event is filtered at the server before sending.

**Consequences for this app:** Every page uses `postgres_changes` for live partner sync (ResultsPage, FinishSentencePage, PredictPartnerPage, HotTakesPage, TicTacToePage, etc.). After RLS is added, if policies are too restrictive or missing columns Realtime needs, partner updates stop appearing in real time. The polling fallback will still work (every 5 seconds), but the real-time experience breaks.

**Prevention:**
1. Write RLS SELECT policies before testing realtime — they are interdependent.
2. The policy must cover the exact rows that Realtime will try to verify. For this app, that means session-scoped policies via `user_sessions` join.
3. After adding RLS, explicitly test realtime from two browser windows logged in as both partners, not just data fetching.

**Detection:** Open two browser sessions. Make one partner submit data. Watch the other partner's UI. If it updates within 5 seconds (polling) but not within 1 second (realtime), the realtime check is silently failing.

**Phase:** RLS audit phase — must test realtime delivery for every table after policies are added.

---

### Pitfall 3: The `sessions` Table RLS Policy Breaks Partner Data Access

**What goes wrong:** The `sessions` table is queried by almost every page in this app (`fetchAll`, `fetchGame`, `fetchPartner`). If the RLS SELECT policy is written to match only `player1_user_id = auth.uid()`, then player2 cannot read the session row. Every page that calls `supabase.from('sessions').select('*').eq('id', sessionId)` returns null for the second partner.

**Why it happens:** This is the most natural mistake when writing a sessions policy. The developer writes `player1_user_id = auth.uid()` and tests as player1. Everything works. Player2 tests and gets null session data everywhere.

**Consequences for this app:** Player2's name never populates, partner names show as "your person" everywhere, all session-scoped queries that depend on the session row silently fail.

**Prevention:** The SELECT policy on `sessions` must allow both players to read their shared row:

```sql
CREATE POLICY "both partners read session" ON sessions
  FOR SELECT TO authenticated
  USING (
    player1_user_id = auth.uid() OR player2_user_id = auth.uid()
  );
```

Similarly, INSERT must allow creating a session as player1. UPDATE must allow both partners to update their own `_user_id` column and the shared fields.

**Detection:** Log in as player2. Navigate to any page. If partner names are missing or the page shows loading state indefinitely, the sessions policy is too restrictive.

**Phase:** RLS audit phase. Test explicitly as both player1 and player2.

---

### Pitfall 4: Predict Your Partner Migration Leaves Orphaned Old Data Active

**What goes wrong:** The `predict_partner` table exists and the new code reads from it, but old data still lives in the `responses` table with `pack_id` values like `predict-*`. If the migration SQL copies data to `predict_partner` but doesn't remove or ignore the old rows, a rollback or partial re-run creates duplicate rows. Worse, if any user is mid-session during migration (actively answering questions), the in-flight write goes to `responses` while the migrated reads come from `predict_partner` — that player's just-submitted answers vanish.

**Why it happens:** Migrations that copy rows between tables have a window during which both the old and new code paths might be active simultaneously.

**Consequences for this app:** Players lose their Predict Your Partner answers. The pack appears incomplete ("in-progress") when it was actually finished. Score reveals show wrong data.

**Prevention:**
1. Migration must be a single SQL transaction: copy rows, then mark old rows with a sentinel or delete them.
2. The app code must be deployed immediately after (or in the same deploy) as the migration runs. There should be no window where old code reads `responses` for PYP and new code reads `predict_partner` for different users.
3. Run the migration in off-peak hours (nights/weekends) to minimize users mid-session.
4. Verify the migration with a COUNT check: `SELECT COUNT(*) FROM responses WHERE pack_id LIKE 'predict-%'` should be 0 after migration and before deploying new code.

**Detection:** After migration, check `responses` for any remaining PYP rows. Check `predict_partner` row count matches expectation.

**Phase:** Data migration phase — must be planned as a coordinated deploy, not just a SQL run.

---

### Pitfall 5: Migration SQL Runs Twice on Re-deploy and Duplicates Rows

**What goes wrong:** Supabase migrations (via CLI or manual SQL) are not automatically idempotent. If the copy-data migration is `INSERT INTO predict_partner SELECT ... FROM responses WHERE pack_id LIKE 'predict-%'` with no conflict handling, running it twice creates duplicate rows. `predict_partner` has a unique constraint on `(session_id, pack_id, player_id, question_index)`, which means the second run throws a unique violation error — but any rows that inserted before hitting the conflict are partially written.

**Why it happens:** Manual SQL in the Supabase dashboard has no migration tracking. It's easy to re-run to "check if it worked."

**Consequences for this app:** Partial duplicate inserts before the constraint violation. Debug session is confusing because some question_index values have duplicates and others don't.

**Prevention:** Write migration SQL as `INSERT INTO predict_partner ... ON CONFLICT (session_id, pack_id, player_id, question_index) DO NOTHING`. This makes it idempotent — safe to run multiple times.

**Detection:** `SELECT session_id, pack_id, player_id, question_index, COUNT(*) FROM predict_partner GROUP BY 1,2,3,4 HAVING COUNT(*) > 1` — should return zero rows.

**Phase:** Data migration phase.

---

## Moderate Pitfalls

---

### Pitfall 6: Stale Closure in `setInterval` Polling — Reads Stale `sessionId` or `playerId`

**What goes wrong:** When `setInterval(fetchAll, 5000)` is set up in a `useEffect`, the `fetchAll` function captured at the time the interval was created closes over the values of `sessionId` and `playerId` at that moment. If those values change (e.g., user navigates to a different session), the interval keeps calling the old `fetchAll` with the old session ID.

**Why it happens:** JavaScript closures capture variable references at creation time. `setInterval` with a non-reactive callback is a classic stale closure trap.

**Consequences for this app:** The polling fallback silently fetches data from the wrong session after navigation. No error visible to user. FinishSentencePage and HotTakesPage currently include `sessionId` in their polling `useEffect` dependencies, which is correct — but any new polling added that omits `sessionId` from deps will stale-close.

**Prevention:** Every `useEffect` that sets up a `setInterval` must list all values read inside the callback in the dependency array. Or extract the fetch function with `useCallback` and include it in the interval effect's dependencies, as HotTakesPage already does. Pattern to follow:

```js
const fetchAll = useCallback(async () => {
  // reads sessionId from closure — safe because useCallback lists it
}, [sessionId])

useEffect(() => {
  const interval = setInterval(fetchAll, 5000)
  return () => clearInterval(interval)
}, [fetchAll]) // fetchAll reference changes when sessionId changes
```

**Detection:** Navigate between two different sessions in the same tab. Open network tab. Verify polling requests go to the current session's ID, not a stale one.

**Phase:** Polling fallback phase — applies to every new polling useEffect added.

---

### Pitfall 7: Polling and Realtime Both Call `fetchAll` — Double Fetch on Every Realtime Event

**What goes wrong:** When realtime and polling are both active simultaneously, every realtime event triggers `fetchAll`, and polling triggers it again 5 seconds later. On busy screens (TicTacToe, ResultsPage), rapid partner moves generate multiple realtime events per second, each causing a full refetch. The polling compounds this.

**Why it happens:** The pattern `on('postgres_changes', () => fetchAll())` + `setInterval(fetchAll, 5000)` with no deduplication creates additive fetching.

**Consequences for this app:** Excessive Supabase read calls. Free tier has row read limits. On ResultsPage, both players loading simultaneously with polling triggers 12+ fetches per minute from 2 clients = 24+ reads/minute for the results query alone.

**Prevention:**
- Polling interval should be a true fallback, active only when realtime is unreliable (e.g., only while waiting for partner response). ResultsPage already does this correctly: `if (responses.length >= 2) return` stops polling once data is complete.
- Consider the pattern: start polling, stop polling when realtime confirms delivery, or stop polling after data is complete.
- Avoid polling on screens where realtime events are frequent (TicTacToe active game board).

**Detection:** Monitor Supabase dashboard's "API requests" counter. A single session active on two devices should not exceed ~10 requests/minute under normal use.

**Phase:** Polling fallback phase.

---

### Pitfall 8: RLS INSERT Policy Without `WITH CHECK` Allows Cross-Session Data Injection

**What goes wrong:** An INSERT policy written as `USING (session_id IN (...))` without a `WITH CHECK` clause lets a malicious client insert a row with any `session_id` value — the USING clause only filters rows for SELECT, not the values being written.

**Why it happens:** Developers often write policies with only a USING expression and assume it covers writes. Postgres RLS has separate USING (filter read access) and WITH CHECK (validate write values) clauses.

**Consequences for this app:** A user could write quiz answers, drawings, or love notes into another couple's session by constructing a direct API call with an arbitrary `session_id`.

**Prevention:** All INSERT and UPDATE policies must include `WITH CHECK`:

```sql
CREATE POLICY "insert own session" ON responses
  FOR INSERT TO authenticated
  WITH CHECK (
    session_id IN (
      SELECT session_id FROM user_sessions WHERE user_id = auth.uid()
    )
  );
```

**Detection:** Using the Supabase REST API directly (e.g., via curl with a valid JWT), attempt to insert a row with a session_id the user doesn't belong to. Should get a policy violation error, not a success.

**Phase:** RLS audit phase.

---

### Pitfall 9: Multiple Permissive Policies on the Same Table Create Performance Issues

**What goes wrong:** If multiple SELECT policies are created on the same table (e.g., one for player1, one for player2, one for shared rows), Postgres evaluates ALL of them for each row as OR conditions. With 3 permissive policies, every query does 3x the work per row.

**Why it happens:** Developers add policies incrementally — one for "owns row", another for "partner owns row", another for legacy access — rather than combining into a single policy.

**Consequences for this app:** The `responses` table is queried heavily and holds quiz, drawing, tic-tac-toe, and study-together data. Multiple permissive policies on it cause full table scans on every fetch.

**Prevention:** Combine related conditions into a single policy using OR:

```sql
CREATE POLICY "session members" ON responses
  FOR SELECT TO authenticated
  USING (
    session_id IN (
      SELECT session_id FROM user_sessions WHERE user_id = auth.uid()
    )
  );
```

One policy, one index scan. Do not create separate policies for player1 and player2 — they share the same session.

**Detection:** Supabase's Database Advisors (Dashboard > Advisors) will flag "multiple permissive policies" on the same table.

**Phase:** RLS audit phase — review policy count per table before finalizing.

---

### Pitfall 10: Missing Index on `session_id` in Policy Subquery Causes Full Table Scan

**What goes wrong:** RLS policies that join to `user_sessions` (`session_id IN (SELECT session_id FROM user_sessions WHERE user_id = auth.uid())`) run this subquery for every row evaluated. Without an index on `user_sessions(user_id)`, this is a sequential scan of user_sessions per row.

**Why it happens:** Tables created in the Supabase dashboard don't automatically add indexes on foreign key columns.

**Consequences for this app:** Queries that should complete in 2ms take 50ms+ as session count grows. Not critical now with testers, but will become the first performance cliff.

**Prevention:** Add indexes on the columns used in RLS policy subqueries:

```sql
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
```

**Detection:** Use `EXPLAIN ANALYZE` from Supabase SQL Editor on a query that would be filtered by the RLS policy (disable RLS on your SQL Editor session temporarily, then manually add the WHERE clause equivalent and check the plan).

**Phase:** RLS audit phase — add indexes alongside policies.

---

## Minor Pitfalls

---

### Pitfall 11: Polling Interval Stays Active After Page Unmount

**What goes wrong:** If a polling `useEffect` doesn't return a cleanup function, or the cleanup only clears the interval but the component is unmounting while a `fetchAll` async call is in flight, React will warn about "setState on unmounted component" and the response may attempt to update state that no longer exists.

**Why it happens:** Async functions started before unmount complete after unmount. `clearInterval` stops new calls but can't cancel in-flight ones.

**Prevention:** Use an `isMounted` ref guard or `AbortController` in polling fetch functions:

```js
useEffect(() => {
  let active = true
  const poll = async () => {
    const data = await fetchAll()
    if (!active) return
    setData(data)
  }
  const interval = setInterval(poll, 5000)
  return () => { active = false; clearInterval(interval) }
}, [sessionId])
```

**Detection:** Navigate away from a page quickly during a loading state. Check console for "Can't perform a React state update on an unmounted component" warnings.

**Phase:** Polling fallback phase.

---

### Pitfall 12: Realtime Channel Name Collision Between Sessions

**What goes wrong:** If two users open the app in the same browser (different tabs) with different sessionIds, and both create a channel named `finish-sentence-${sessionId}` — this is fine. But if `sessionId` is ever undefined at the time `supabase.channel(...)` is called, both tabs create a channel named `finish-sentence-undefined` and receive each other's events.

**Why it happens:** `sessionId` is loaded from `localStorage` on mount, but `useParams()` may not have populated `sessionId` before the realtime effect fires.

**Consequences for this app:** Two different couples receiving each other's realtime events. Rare, but catastrophic for privacy.

**Prevention:** Guard realtime effects: `if (!sessionId) return` before calling `supabase.channel(...)`. All current pages use `useParams()` for `sessionId` which is synchronously available — but any new useEffect using `sessionId` from context (which comes from localStorage) should guard against null.

**Detection:** Open app with no session in localStorage. Check if a channel named `*-undefined` appears in Supabase Realtime inspector.

**Phase:** Polling fallback phase — verify all new channel subscriptions guard against null sessionId.

---

### Pitfall 13: `fetchResponses` Captured in Realtime Callback vs. `fetchAll` in Polling — Two Different Functions

**What goes wrong:** In some pages (PredictPartnerPage), the realtime callback references `fetchResponses` while polling calls `fetchAll` (or vice versa). If one of these functions gets a bug fix applied only to the other, the two code paths diverge and the bug is only fixed for realtime or only for polling.

**Why it happens:** Functions that do similar things are written separately and drift over time.

**Prevention:** Each page should have exactly one canonical fetch function that both realtime and polling call. PredictPartnerPage's pattern of `fetchResponses` for both is correct. Avoid having separate "fetch for realtime trigger" and "fetch for polling" functions on the same page.

**Phase:** Polling fallback phase and general cleanup phase.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| RLS audit | Enable + no policy = silent empty data | Deploy RLS enable and SELECT policy in same SQL migration |
| RLS audit | `sessions` table policy too narrow for player2 | Test as both player1 and player2 before closing phase |
| RLS audit | Missing WITH CHECK on INSERT/UPDATE | Review every write policy for WITH CHECK clause |
| RLS audit | Realtime silently stops delivering after RLS added | Test realtime explicitly from two browser windows after each table's policy is added |
| RLS audit | Multiple permissive policies per table | Combine into single OR'd policy; check Supabase Advisors |
| Data migration | In-flight writes during migration window | Treat as coordinated deploy; run migration + code deploy atomically |
| Data migration | Non-idempotent migration SQL | Add ON CONFLICT DO NOTHING to all INSERT ... SELECT migrations |
| Data migration | Old responses rows not cleaned up | COUNT check on responses WHERE pack_id LIKE 'predict-%' after migration |
| Polling fallbacks | Stale closure on sessionId | List sessionId in useEffect deps or use useCallback pattern |
| Polling fallbacks | Over-fetching when realtime is working | Stop polling once data is complete (follow ResultsPage pattern) |
| Polling fallbacks | In-flight fetch after unmount | Add `active` ref guard in async polling functions |
| Bug fixes | QuizPage has no realtime subscription | Decide: add realtime to ResultsPage (already has it) vs. quiz submission; keep QuizPage submit-only |

---

## Sources

- [Supabase Row Level Security Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) — HIGH confidence
- [Supabase RLS Performance and Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) — HIGH confidence
- [Supabase Postgres Changes with RLS](https://supabase.com/blog/realtime-row-level-security-in-postgresql) — HIGH confidence
- [Supabase Realtime Postgres Changes Docs](https://supabase.com/docs/guides/realtime/postgres-changes) — HIGH confidence
- [Supabase Performance and Security Advisors](https://supabase.com/docs/guides/database/database-advisors?lint=0006_multiple_permissive_policies) — HIGH confidence
- [React stale closure with setInterval — overreacted.io](https://overreacted.io/making-setinterval-declarative-with-react-hooks/) — HIGH confidence
- [React stale closure patterns — dmitripavlutin.com](https://dmitripavlutin.com/react-hooks-stale-closures/) — MEDIUM confidence
- [Supabase concurrent writes discussion](https://github.com/orgs/supabase/discussions/30334) — MEDIUM confidence
- Codebase inspection of `src/pages/` (ResultsPage, FinishSentencePage, PredictPartnerPage, HotTakesPage, TicTacToePage) — HIGH confidence for app-specific patterns
