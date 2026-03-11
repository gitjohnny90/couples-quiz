# Technology Stack

**Project:** The Us Quiz — v1.0 Polish & Security Milestone
**Researched:** 2026-03-10
**Research scope:** Additions only — RLS policies, polling fallbacks, data migration, bug fixes

---

## What Does NOT Change

This milestone is hardening, not feature addition. The following are validated and must not change:

| Layer | Current | Status |
|-------|---------|--------|
| Frontend | React 19 + Vite 7 + React Router DOM 7 | Locked |
| Backend | Supabase (auth, realtime, DB, storage) | Locked |
| Animation | Framer Motion | Locked |
| Language | Pure JavaScript (no TypeScript) | Locked |
| Styling | Inline styles + CSS custom properties | Locked |
| Deployment | Vercel with SPA rewrites | Locked |

---

## Milestone-Specific Stack Additions

### No new npm packages needed

All four work areas (RLS, polling, migration, bug fixes) are achievable with what is already installed. The milestone is SQL policy configuration, query patterns, and React hook discipline — not new dependencies.

---

## Area 1: Supabase Row Level Security

### The Core Problem

The `sessions` table stores `player1_user_id` and `player2_user_id` (Supabase auth UIDs). All feature tables store `session_id`. RLS must allow both partners to access their shared data while blocking all other users.

**Confidence: HIGH** — based on official Supabase RLS documentation and community discussions.

### The Pattern: Subquery via user_sessions

The app already has a `user_sessions` table that links `user_id` → `session_id`. This is the join point for all RLS policies. Use a subquery (not a direct join) in policies, which Postgres can cache per statement.

```sql
-- Template for any table keyed by session_id
CREATE POLICY "Partners can access their session data"
ON public.<table_name>
FOR ALL
USING (
  session_id IN (
    SELECT session_id FROM user_sessions
    WHERE user_id = (SELECT auth.uid())
  )
);
```

**Why this exact form:**
- `(SELECT auth.uid())` — wrapping `auth.uid()` in a subselect triggers Postgres's initPlan optimization, caching the result once per statement instead of evaluating it for every row. The Supabase performance docs confirm this provides over 100x improvement on large tables.
- `session_id IN (SELECT ...)` — subquery style avoids JOIN complexity in the USING clause. Supabase docs explicitly recommend rewriting join-based policies as IN/ANY subqueries for performance.
- Uses `user_sessions` as the single source of truth for "who belongs to which session" — consistent with how the app already handles session resumption.

### Alternative: Direct sessions table check

For tables that don't have a `session_id` column (e.g., `sessions` itself), use:

```sql
CREATE POLICY "Users can read their own session"
ON public.sessions
FOR SELECT
USING (
  player1_user_id = (SELECT auth.uid())
  OR player2_user_id = (SELECT auth.uid())
);
```

### Required Indexes

Add these if not already present — RLS subqueries hit these on every request:

```sql
-- Speeds up the user_sessions subquery in every policy
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id
  ON user_sessions(user_id);

-- Speeds up session_id lookups on every feature table
-- (run per-table as needed)
CREATE INDEX IF NOT EXISTS idx_responses_session_id
  ON responses(session_id);

CREATE INDEX IF NOT EXISTS idx_predict_partner_session_id
  ON predict_partner(session_id);

-- etc. for each table
```

### Table-by-table RLS strategy

| Table | Key columns | Policy approach |
|-------|-------------|-----------------|
| `sessions` | `player1_user_id`, `player2_user_id` | Direct auth.uid() check on both columns |
| `user_sessions` | `user_id` | `user_id = (SELECT auth.uid())` |
| `responses` | `session_id` | Subquery via user_sessions |
| `profiles` | `session_id` | Subquery via user_sessions |
| `deep_dive_responses` | `session_id` | Subquery via user_sessions |
| `shared_items` | `session_id` | Subquery via user_sessions |
| `love_note_games` | `session_id` | Subquery via user_sessions |
| `love_note_guesses` | via `game_id` | Subquery via love_note_games → user_sessions |
| `reactions` | `session_id` | Subquery via user_sessions |
| `predict_partner` | `session_id` | Subquery via user_sessions |
| `finish_sentence` | `session_id` | Subquery via user_sessions |
| `hot_takes` | `session_id` | Subquery via user_sessions |

`love_note_guesses` requires a two-hop join because it links to `game_id` rather than `session_id` directly. Use a nested subquery:

```sql
CREATE POLICY "Partners can access love note guesses"
ON public.love_note_guesses
FOR ALL
USING (
  game_id IN (
    SELECT id FROM love_note_games
    WHERE session_id IN (
      SELECT session_id FROM user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
  )
);
```

### RLS Policy Operations (INSERT vs SELECT vs UPDATE)

For most tables, a single `FOR ALL` policy with USING and WITH CHECK set to the same subquery is correct. The exceptions:

- **`user_sessions`**: Users should only read and insert their own row, not update or delete others'. Use `FOR SELECT` and `FOR INSERT` separately.
- **`reactions`**: Players should only modify their own reactions but read both. Use separate INSERT/UPDATE/DELETE policies filtered by `player_id` matching the claimed identity, and a broader SELECT policy.

### Do NOT use user_metadata in RLS

Avoid `auth.jwt() -> 'user_metadata'` in policies. The Supabase docs explicitly warn that `user_metadata` can be modified by the authenticated user, making it unsuitable for security decisions.

---

## Area 2: Polling Fallbacks Alongside Realtime

### The Core Problem

Supabase Realtime uses WebSocket exclusively (no built-in long-polling fallback). Dropped connections, mobile background states, and React Strict Mode double-invocation all cause subscriptions to silently fail. The app already has polling in some pages (5s interval) but not consistently across all pages.

**Confidence: HIGH** — observed directly in existing code (ResultsPage, PredictPartnerPage, FinishSentencePage, HotTakesPage already implement this pattern) and confirmed by Supabase realtime architecture docs.

### The Standard Pattern (already used in the app)

```javascript
// Pattern already used by ResultsPage, PredictPartnerPage, HotTakesPage
useEffect(() => {
  fetchData()

  const channel = supabase
    .channel(`feature-${sessionId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'table_name',
      filter: `session_id=eq.${sessionId}`,
    }, () => fetchData())
    .subscribe()

  const interval = setInterval(fetchData, 5000)

  return () => {
    supabase.removeChannel(channel)
    clearInterval(interval)
  }
}, [sessionId])
```

**Why 5000ms:** Short enough to feel responsive (partner action appears within 5s), long enough to avoid hammering Supabase free tier limits. This interval is already established in existing code — keep it consistent.

### Stale Closure Fix

Realtime callbacks close over the `fetchData` reference at subscription time. If `fetchData` is defined inside the component (not wrapped in `useCallback`), the callback will reference a stale version. Two safe approaches:

**Option A — useCallback (used by HotTakesPage):**
```javascript
const fetchAll = useCallback(async () => {
  // fetch logic
}, [sessionId])

useEffect(() => {
  fetchAll()
  const channel = supabase.channel(...).on(..., () => fetchAll()).subscribe()
  const interval = setInterval(fetchAll, 5000)
  return () => { supabase.removeChannel(channel); clearInterval(interval) }
}, [fetchAll]) // fetchAll in deps — changes when sessionId changes
```

**Option B — ref pattern (simpler for functions defined outside useCallback):**
```javascript
const fetchRef = useRef(fetchData)
useEffect(() => { fetchRef.current = fetchData })

useEffect(() => {
  const channel = supabase.channel(...).on(..., () => fetchRef.current()).subscribe()
  // ...
}, [sessionId])
```

Option A (useCallback) is already the app's established pattern in HotTakesPage and should be the standard going forward. It is cleaner and avoids the manual ref sync.

### Pages Missing Polling Fallback (to audit)

Based on code review:

| Page | Has Realtime | Has Polling | Needs Polling Added |
|------|-------------|-------------|---------------------|
| ResultsPage | YES | YES (conditional on responses < 2) | Verify coverage |
| PredictPartnerPage | YES | YES (5s always) | OK |
| FinishSentencePage | YES | YES (5s, skips reveal) | OK |
| HotTakesPage | YES | YES (conditional on screen) | OK |
| TicTacToePage | YES (realtime + 3s poll) | YES | OK |
| DeepDiveDeckPage | Likely | Unknown | Audit needed |
| LoveNoteHuntPage | Likely | Unknown | Audit needed |
| DrawPage / DrawResultsPage | Likely | Unknown | Audit needed |
| StudyTogetherPage | Likely | Unknown | Audit needed |
| MissYouHeart | YES | Unknown | Audit needed |

### Conditional Polling

Some pages (ResultsPage, HotTakesPage) only poll on specific screens or conditions. This is correct — avoid polling when the user is in a state that doesn't need live updates (e.g., actively filling out a form where no partner updates are expected).

### React Strict Mode Note

React 18+ Strict Mode double-invokes effects in development. This causes the cleanup to fire and immediately re-run, which can put a Supabase channel in CLOSED state before it ever reaches SUBSCRIBED. This is a dev-only issue that disappears in production. The fix is to verify `supabase.removeChannel` is called in cleanup — which the app already does. The polling fallback mitigates this entirely.

---

## Area 3: Data Migration — Predict Your Partner

### The Core Problem

Predict Your Partner was originally built on the generic `responses` table with JSONB `answers`. It has since been migrated to the dedicated `predict_partner` table (visible in PredictPartnerPage.jsx which queries `predict_partner` directly). The task is to copy any historical data that still lives in `responses` to `predict_partner` without breaking active sessions.

**Confidence: HIGH** — the code already reads from `predict_partner`. This is a data backfill, not a schema change.

### Migration Strategy: Non-Destructive Backfill

The `predict_partner` table has a unique constraint on `(session_id, pack_id, player_id, question_index)`. INSERT ... ON CONFLICT DO NOTHING is safe to run multiple times.

```sql
-- Step 1: Inspect what's in responses for predict-partner packs
-- (run this first to understand the existing JSONB shape)
SELECT session_id, pack_id, player_id, answers
FROM responses
WHERE pack_id LIKE 'predict-%'
LIMIT 10;

-- Step 2: Backfill (adjust JSONB field names to match actual shape)
-- The old format stored answers as a JSONB object — inspect first (Step 1)
-- then adapt the extraction logic below to match the actual structure.
--
-- Example if old answers were stored as:
-- { "responses": [{"ownAnswer": "...", "prediction": "..."}], "completedAt": "..." }
INSERT INTO predict_partner (
  session_id, pack_id, player_id, question_index,
  own_answer, prediction, completed_at
)
SELECT
  r.session_id,
  r.pack_id,
  r.player_id,
  idx - 1 AS question_index,
  (r.answers -> 'responses' -> (idx - 1) ->> 'ownAnswer') AS own_answer,
  (r.answers -> 'responses' -> (idx - 1) ->> 'prediction') AS prediction,
  (r.answers ->> 'completedAt')::timestamptz AS completed_at
FROM responses r,
     generate_series(1, 3) AS idx
WHERE r.pack_id LIKE 'predict-%'
  AND r.answers -> 'responses' IS NOT NULL
  AND (r.answers -> 'responses' -> (idx - 1)) IS NOT NULL
ON CONFLICT (session_id, pack_id, player_id, question_index)
DO NOTHING;
```

**Critical:** Run Step 1 to inspect the actual JSONB structure before executing Step 2. The JSONB field names must match what the old code actually stored in `responses.answers`.

### Migration Order (non-breaking)

1. **Do NOT drop the responses rows** for predict packs yet — leave them in place.
2. Run the backfill INSERT.
3. Verify counts: `SELECT COUNT(*) FROM predict_partner` should be > 0.
4. Verify data: spot-check a known session in the Supabase dashboard.
5. Leave the old `responses` rows for the current milestone. Drop them in a later cleanup pass after confirming the app is stable.

### Why Not Use supabase-js for the Migration

Running the backfill as raw SQL via the Supabase SQL editor (or a migration file) is safer than scripting it through the JS client. Raw SQL runs as a single transaction, is atomic, and doesn't hit RLS policies when run as the postgres role.

---

## Area 4: Quiz Bug Fix Patterns

### Observed Pattern from Code Review

QuizPage.jsx currently sets `submitted = true` before the Supabase upsert, then resets it on error. This pattern risks a race condition: if the user navigates away during the save, the error handler fires on an unmounted component.

**Use an isMounted ref to guard async state updates:**
```javascript
useEffect(() => {
  let isMounted = true
  // ...async work...
  if (isMounted) setError('...')
  return () => { isMounted = false }
}, [])
```

### ResultsPage Polling Condition

ResultsPage polls only when `responses.length < 2`. This is correct for the two-player case but will stop polling too early if only one response is loaded (e.g., a race between fetch and subscription). Consider polling until both player IDs are represented, not just until count >= 2.

### Channel Name Uniqueness

Channel names must be unique per active subscription. The app uses patterns like `responses-${sessionId}-${packId}` — this is correct. Do not reuse channel names across different subscriptions in the same component; doing so causes the second subscription to silently shadow the first.

### No Suspense or Error Boundary Needed

The app's pattern of inline `error` state with visible user feedback is sufficient for this milestone. Do not introduce React Suspense or Error Boundaries — they require structural changes and are out of scope.

---

## Installation

No new packages to install for this milestone.

```bash
# Verify existing deps are current (informational only — do not upgrade during polish milestone)
npm list @supabase/supabase-js
# Expected: ^2.x.x
```

---

## What NOT to Change

| Area | Do Not Touch | Reason |
|------|-------------|--------|
| npm packages | No upgrades | Play testers are active; breaking changes are not acceptable |
| React version | Stay at 19 | No reason to upgrade mid-milestone |
| Supabase client | Stay at current version | Any upgrade risks realtime API changes |
| Auth flow | No changes | Email/password + invite codes are working |
| Session/localStorage | No changes | Breaking this breaks all active sessions |
| Styling system | No changes | Inline styles + CSS vars, not in scope |
| Data model | No new columns except what migration adds | Schema stability during active use |

---

## Sources

- [Row Level Security | Supabase Docs](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [RLS Performance and Best Practices | Supabase Docs](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv)
- [Subscribing to Database Changes | Supabase Docs](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes)
- [Can you use a join in a RLS policy? — Supabase Discussion #811](https://github.com/orgs/supabase/discussions/811)
- [Advanced RLS via another table — Supabase Discussion #18761](https://github.com/orgs/supabase/discussions/18761)
- [React Strict Mode + realtime-js Issue #169](https://github.com/supabase/realtime-js/issues/169)
- [Database Migrations | Supabase Docs](https://supabase.com/docs/guides/deployment/database-migrations)
- [Optimizing RLS Performance with Supabase | AntStack](https://www.antstack.com/blog/optimizing-rls-performance-with-supabase/)
- Codebase review: `src/pages/PredictPartnerPage.jsx`, `ResultsPage.jsx`, `HotTakesPage.jsx`, `FinishSentencePage.jsx`, `QuizPage.jsx`, `App.jsx`
