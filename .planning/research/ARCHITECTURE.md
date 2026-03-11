# Architecture Patterns

**Domain:** Couples quiz app polish & security milestone
**Researched:** 2026-03-10

---

## Existing Architecture Summary

The app is a React 19 SPA backed by Supabase. All pages follow the same structural pattern:

1. Load data on mount via `useEffect` + `supabase.from(...).select()`
2. Subscribe to realtime changes via `supabase.channel(...).on('postgres_changes', ...)`
3. Poll as a fallback via `setInterval` in a second `useEffect`
4. Unsubscribe in cleanup: `return () => { supabase.removeChannel(channel); clearInterval(interval) }`

Session identity (`sessionId`, `playerId`, `playerName`) comes from `SessionContext` in `App.jsx`, backed by `localStorage`. Auth comes from `AuthContext` in `src/contexts/AuthContext.jsx`. The two are distinct — the session layer sits on top of the auth layer.

---

## Recommended Architecture for This Milestone

### Component Boundaries (Unchanged)

No new components or route changes are required. All work is within existing pages or at the database/security layer.

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `AuthContext` | Supabase auth session, sign in/out | All pages via `RequireAuth` |
| `SessionContext` (App.jsx) | sessionId, playerName, playerId | All feature pages via `useContext` |
| Feature pages | Data fetch + realtime + render | Supabase directly |
| `useReactions` hook | Reaction fetch + realtime | `reactions` table |
| Supabase RLS policies | Row-level access control | All table reads/writes |

### Data Flow (Unchanged)

```
User action
  → page handler (e.g. handleSubmitAnswer)
  → supabase.from(table).upsert(...)
  → realtime fires postgres_changes on partner's client
  → partner's fetchX() runs
  → state updates, UI re-renders

Fallback path:
  → setInterval(fetchX, 5000) catches missed realtime events
```

---

## Pattern 1: Polling + Realtime Coexistence

**What it is:** Two `useEffect` hooks running in parallel — one for realtime subscription, one for `setInterval` polling. Both call the same `fetchX` function. Realtime fires fast; polling catches dropped WebSocket connections.

**Current state:** Implemented consistently in `PredictPartnerPage`, `HotTakesPage`, `FinishSentencePage`, `DeepDiveDeckPage`, and `ResultsPage`. Partially or absent in other pages.

**The pattern (verified in existing code):**

```javascript
// 1. Define fetch function (stable reference with useCallback where needed)
const fetchAll = useCallback(async () => {
  const { data } = await supabase.from('table').select('*').eq('session_id', sessionId)
  if (data) setMyState(data)
}, [sessionId])

// 2. Initial load
useEffect(() => { fetchAll() }, [fetchAll])

// 3. Realtime subscription
useEffect(() => {
  const channel = supabase
    .channel(`feature-${sessionId}`)
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'table',
      filter: `session_id=eq.${sessionId}`,
    }, () => fetchAll())
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}, [sessionId, fetchAll])

// 4. Polling fallback — only when waiting for partner
useEffect(() => {
  if (notWaiting) return   // skip polling when not needed
  const interval = setInterval(fetchAll, 5000)
  return () => clearInterval(interval)
}, [fetchAll, screenState])
```

**Key decisions already made in existing pages:**
- `HotTakesPage` polls only on `group-done` and `results` screens (not during voting)
- `DeepDiveDeckPage` polls only during `PHASE.WAITING`
- `ResultsPage` polls only when `responses.length < 2`
- `FinishSentencePage` polls on all screens except `reveal`
- `PredictPartnerPage` always polls at 5s interval

**Pages missing polling fallbacks (to add):** Need to audit — likely candidates are `DrawPage`, `TicTacToePage`, `LoveNoteHuntPage`, `StudyTogetherPage`, `VisionPage`, `DeepDiveDeckPage` (already has it).

**Confidence:** HIGH — verified directly from source.

---

## Pattern 2: RLS Policy Structure

**What it is:** Supabase Row Level Security constrains what each authenticated user can read and write. The app's identity model is: one Supabase `auth.uid()` per user → one row in `user_sessions` linking them to a `session_id` and `player_id`.

**The RLS access pattern for all tables:**

Every meaningful table has `session_id` as the coupling key. The authenticated user should only be able to touch rows where their `session_id` matches a session they belong to (recorded in `user_sessions`).

**Standard policy template:**

```sql
-- READ: can see rows for sessions you belong to
CREATE POLICY "players can read own session data"
ON public.TABLE_NAME FOR SELECT
USING (
  session_id IN (
    SELECT session_id FROM user_sessions WHERE user_id = auth.uid()
  )
);

-- WRITE: can insert/update rows for sessions you belong to
CREATE POLICY "players can write own session data"
ON public.TABLE_NAME FOR INSERT
WITH CHECK (
  session_id IN (
    SELECT session_id FROM user_sessions WHERE user_id = auth.uid()
  )
);
```

**Table-specific nuances:**

| Table | Special consideration |
|-------|----------------------|
| `sessions` | player1 writes on create; both players need SELECT; only own player fields writable on UPDATE |
| `user_sessions` | insert on join; SELECT own rows only |
| `responses` | player_id scoping — only write your own player_id |
| `predict_partner` | player_id scoping on write; both players need SELECT for reveal |
| `finish_sentence` | both players need SELECT for reveal screen |
| `hot_takes` | both players need SELECT for results |
| `reactions` | both players need SELECT (to show partner's reactions); only write own player_id |
| `love_note_games` | player-scoped writes; both need SELECT |
| `love_note_guesses` | only write own player_id |
| `deep_dive_responses` | both need SELECT for reveal |
| `shared_items` | both players write shared items; scoped to session |
| `profiles` | player-scoped write; both need SELECT for comparison |

**Important:** Because the app uses `player_id: 'shared'` or `player_id: 'game'` for some rows (TicTacToe, Vision, Study Together), RLS policies must accommodate these special player_id values. Policies should use session-scoped access checks, not strict player_id matching, for those tables.

**Confidence:** MEDIUM — policy structure inferred from app code; actual existing policies not audited from source.

---

## Pattern 3: PYP Migration (responses → predict_partner)

**What it is:** Predict Your Partner data was migrated from the generic `responses` table to the dedicated `predict_partner` table. The page (`PredictPartnerPage.jsx`) already reads/writes from `predict_partner` exclusively. The migration concern is: old data in the `responses` table with `pack_id` matching PYP pack IDs.

**Current state of the page (verified):**
- All reads: `supabase.from('predict_partner').select('*').eq('session_id', sessionId)`
- All writes: `supabase.from('predict_partner').upsert(rows, { onConflict: 'session_id,pack_id,player_id,question_index' })`
- No reference to `responses` table remains in `PredictPartnerPage.jsx`

**Migration architecture:**

The `responses` table rows for PYP had a different data shape: `answers` was a JSONB blob containing all questions' data at once. The `predict_partner` table has one row per question with `own_answer`, `prediction`, `prediction_correct`, `question_index` columns.

The migration approach must be:
1. **Non-destructive first pass:** copy/transform old `responses` rows into `predict_partner` without deleting originals
2. **Verify:** confirm the new rows display correctly in the app
3. **Cleanup pass:** delete the old `responses` rows for PYP pack IDs (deferred until confirmed)

**Pack IDs to migrate (from PYP data files):** These are the `pack_id` values used by PYP packs stored as responses. Need to enumerate from `src/data/predictPartnerQuestions.js`.

**No code changes are needed** — the page already uses the new table. The migration is purely a SQL/data operation.

**Confidence:** HIGH — verified from `PredictPartnerPage.jsx` source.

---

## Pattern 4: Quiz Bug Fix Architecture

**What it is:** The quiz section has reported bugs around button responsiveness, progression, and data integrity. Based on the source code:

`QuizPage.jsx` is notably simpler than the multiplayer feature pages:
- No realtime subscription
- No polling
- Saves all answers at the end only (single upsert on last question)
- Uses local state (`answers` object keyed by question ID)
- `submitted` boolean guards double-submission

**Observed structural issues:**

1. **No useEffect for sessionId sync.** Other pages call `setSessionId(sessionId)` from URL params in a `useEffect`. `QuizPage.jsx` does not. This could cause `sessionId` to be stale if the user lands directly on a quiz URL.

2. **`submitted` state not reset on error.** If `setSubmitted(true)` runs and then the save throws, `setSubmitted(false)` is called but only after the error. This is correct. However, the navigation to `/results/...` happens inside the try block — if Supabase returns an error object (not throws), the `throw saveErr` line handles it correctly.

3. **ResultsPage polling is conditional on `responses.length`.** It stops polling once both responses are loaded. This is the correct pattern.

4. **ResultsPage realtime only subscribes to `INSERT` events** (not `*`). If a partner's response already exists (e.g. they answered before you), the realtime subscription won't trigger for their pre-existing row. The polling fallback covers this gap.

**Confidence:** HIGH — verified from source.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Polling without screen-gating

**What:** Running `setInterval` on every screen, including active input screens where the user is typing.

**Why bad:** Unnecessary network calls; potential state resets mid-input if fetch overwrites local state.

**Instead:** Gate polling behind a condition — only when the user is on a "waiting" screen or "results" screen where partner data is needed. See `HotTakesPage` implementation as the reference.

---

### Anti-Pattern 2: Broad RLS policies by player_id only

**What:** Writing RLS policies that check `player_id = auth.uid()` directly.

**Why bad:** The app uses string player IDs (`'player1'`, `'player2'`), not UUIDs. `auth.uid()` returns a UUID. These will never match.

**Instead:** Always scope RLS through `user_sessions`: `session_id IN (SELECT session_id FROM user_sessions WHERE user_id = auth.uid())`.

---

### Anti-Pattern 3: Hard-deleting PYP responses before verification

**What:** Running `DELETE FROM responses WHERE pack_id IN (pyp_pack_ids)` immediately.

**Why bad:** Play testers are active. If the migration transform has bugs, old data is gone.

**Instead:** Keep old rows until the new table is confirmed correct. Add a `migrated_at` timestamp or use a soft-delete flag on the old rows.

---

### Anti-Pattern 4: Separate fetch functions for realtime vs polling

**What:** Writing one fetch function for the realtime callback and another for the polling interval.

**Why bad:** State update logic diverges; bugs in one path don't appear in the other.

**Instead:** A single `fetchX` function (stabilized with `useCallback`) called by both the realtime handler and the polling interval. This is the pattern already established in `HotTakesPage` and `PredictPartnerPage`.

---

## Integration Points

### New vs Modified

**Modified (not new):**

| File | Change type | What changes |
|------|-------------|--------------|
| `src/pages/QuizPage.jsx` | Bug fix | Add `useEffect` to sync `sessionId` from URL params; audit `submitted` state flow |
| `src/pages/ResultsPage.jsx` | Bug fix | Change realtime filter from `INSERT` to `*`; verify polling gate logic |
| Pages missing polling | Enhancement | Add 5s polling fallback where absent (audit needed) |
| Supabase dashboard / SQL editor | New policies | RLS policies for all tables |

**New (pure addition):**

| Item | What it is |
|------|-----------|
| SQL migration script | Transform `responses` rows → `predict_partner` rows |
| RLS policy SQL file | Audit + create policies for all 13 tables |

**No new React components are needed for this milestone.**

---

## Build Order

Dependency order matters here:

1. **RLS audit first** — understand current state before writing new policies. Running the app without RLS allows data verification during migration.

2. **PYP migration second** — data-only change, no code changes. Do this before enabling strict RLS on `predict_partner`, so the migration script can run without being blocked by policies.

3. **RLS policy deployment third** — after migration is verified. Apply to all tables. Test that the app still works with policies enforced.

4. **Polling fallbacks fourth** — pure client-side enhancement, no DB dependency. Can be done in parallel with RLS work but should be validated end-to-end after RLS is live.

5. **Quiz bug fixes last** — isolated to quiz pages, no DB schema changes. Validate against the now-secured database.

**Rationale for this order:**
- Migration needs to run against the live DB without RLS interference
- RLS must be correct before the app is considered "hardened"
- Polling fallbacks are independent but benefit from being tested against the final secured state
- Quiz fixes are the highest-risk change for active play testers and should come after DB work is stable

---

## Scalability Considerations

This milestone is not adding scale, but the patterns matter for current active testers:

| Concern | Current approach | Risk |
|---------|-----------------|------|
| Realtime connection drops | 5s polling fallback | Low — polling catches all gaps |
| RLS migration causing lockouts | Policy testing required | Medium — test in dev/staging before prod |
| PYP migration data loss | Non-destructive copy-first | Low — old rows preserved until verified |
| Double polling (realtime + interval both firing) | Both call same `fetchX` | None — idempotent reads |

---

## Sources

- `src/pages/PredictPartnerPage.jsx` — verified polling + realtime pattern, new table usage
- `src/pages/HotTakesPage.jsx` — verified screen-gated polling pattern
- `src/pages/FinishSentencePage.jsx` — verified polling + realtime pattern
- `src/pages/DeepDiveDeckPage.jsx` — verified phase-gated polling pattern
- `src/pages/ResultsPage.jsx` — verified INSERT-only realtime + polling gate
- `src/pages/QuizPage.jsx` — identified missing sessionId sync, no realtime
- `src/utils/reactions.js` — verified useReactions hook pattern
- `src/App.jsx` — verified SessionContext shape, RequireAuth guard
- `.planning/PROJECT.md` — milestone scope and constraints
- `CLAUDE.md` — table schema, tech stack, architecture overview
