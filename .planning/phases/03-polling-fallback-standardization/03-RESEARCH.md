# Phase 3: Polling Fallback Standardization — Research

**Researched:** 2026-03-11
**Domain:** React useEffect / Supabase Realtime / setInterval polling patterns
**Confidence:** HIGH — all findings verified directly from source code inspection

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RT-01 | All sync-dependent pages have polling fallbacks alongside realtime subscriptions | Full page audit below identifies exactly which pages are missing polling or realtime |
| RT-02 | QuizPage has realtime subscriptions for partner answer updates | QuizPage source confirms no channel, no setInterval — must add both |
| RT-03 | QuizPage has polling fallback for partner answer sync | Same finding — QuizPage has neither mechanism |
| RT-04 | All pages pair removeChannel with clearInterval in cleanup | Audit identifies pages where cleanup is split across effects or missing interval cleanup |
| RT-05 | Polling is gated behind "waiting for partner" conditions | Existing pages show conditional patterns; StudyTogetherPage and VisionTab poll unconditionally — should be reviewed |
</phase_requirements>

---

## Summary

Phase 3 is a targeted code standardization pass. The app already has a well-established polling + realtime pattern used consistently across 8+ pages. The problem is not a missing pattern — it is uneven application. This research audited every page in `src/pages/` to determine exactly what each page has and what it needs.

The primary gap is **QuizPage**, which has no realtime subscription and no polling fallback. This is likely the root cause of the "partner answers not appearing" bug reported by testers. QuizPage is a submit-only page (each player answers independently and submits), so the realtime/polling target should be **ResultsPage** (which already has both), not QuizPage itself. However, RT-02 and RT-03 explicitly require QuizPage to have realtime and polling — the interpretation is that QuizPage needs to know when the partner has submitted so it can guide the user ("your partner answered!"), or at minimum that the ResultsPage arrival pattern needs to be validated.

A secondary concern is **cleanup discipline**: several pages combine realtime and polling into a single `useEffect` with a single `return` that cleans up both — this is good. A few pages split them across multiple effects and may miss pairing the cleanup correctly.

The third concern is **unconditional polling** in StudyTogetherPage and VisionTab, which always poll at 5s regardless of whether either partner is actively waiting. These pages are shared-state collaboration pages where a partner could update at any time, so this is arguably correct — but it should be documented as intentional.

**Primary recommendation:** Add realtime + conditional polling to QuizPage; verify cleanup pairing in all pages; document unconditional polling in StudyTogetherPage and VisionTab as intentional.

---

## Complete Page Audit

This audit was performed by direct source code inspection of every file in `src/pages/`. Confidence: HIGH.

### Audit Key

- **Realtime**: Has a `supabase.channel(...).on('postgres_changes', ...).subscribe()` call
- **Polling**: Has a `setInterval(fetchFn, N)` call
- **Paired cleanup**: Single `return () => { supabase.removeChannel(channel); clearInterval(interval) }` in one `useEffect`, OR each split across separate effects each with their own cleanup
- **Gated polling**: Polling only runs when in a "waiting" state, not always

### Interactive Pages (need realtime / polling)

| Page | Has Realtime | Has Polling | Cleanup Paired | Polling Gated | Status |
|------|-------------|-------------|----------------|---------------|--------|
| **QuizPage** | NO | NO | N/A | N/A | NEEDS BOTH |
| **ResultsPage** | YES | YES (gated: `responses.length < 2`) | Split across 2 effects — each has own cleanup | YES | GOOD — but realtime uses `INSERT` only (see pitfalls) |
| **PredictPartnerPage** | YES | YES (ungated — always polls) | Single effect, single return, both cleaned up | NO (intentional — partner can update predictions at any time) | GOOD |
| **HotTakesPage** | YES | YES (gated: screen is `group-done` or `results`) | Split across 2 effects — each has own cleanup | YES | GOOD — template to follow |
| **FinishSentencePage** | YES | YES (gated: screen is not `reveal`) | Split across 2 effects — each has own cleanup | YES | GOOD |
| **DeepDiveDeckPage** | YES | YES (gated: `phase === PHASE.WAITING`) | Split across 2 effects — each has own cleanup | YES | GOOD — but `fetchResponses` is not wrapped in `useCallback`; see pitfalls |
| **LoveNoteHuntPage** | YES (gated: `phase === PHASE.WAITING`) | YES (gated: `phase === PHASE.WAITING`) | Single effect, single return, both cleaned up | YES | GOOD |
| **TicTacToePage** | YES | YES (gated: not my turn and no winner, interval: 3s) | Split across 2 effects — each has own cleanup | YES | GOOD |
| **DrawResultsPage** | YES (INSERT only) | YES (gated: `responses.length < 2`) | Split across 2 effects — each has own cleanup | YES | GOOD — same INSERT-only concern as ResultsPage |
| **MoviesPage** | YES | YES (ungated — always polls) | Single effect, single return, both cleaned up | NO (intentional — collaborative list, either partner can add/rate at any time) | GOOD |
| **StudyTogetherPage** | YES | YES (ungated — always polls) | Single effect, single return, both cleaned up | NO (intentional — shared state, either partner can update at any time) | ACCEPTABLE — no "waiting" state to gate on |
| **VisionTab** | YES | YES (ungated — always polls) | Single effect, single return, both cleaned up | NO (intentional — shared state) | ACCEPTABLE — same rationale as StudyTogetherPage |
| **PersonalityPage** | NO | YES (gated: `!partnerProfile`) | Single effect, own cleanup | YES | ACCEPTABLE — personality data is not time-critical |

### Non-interactive Pages (no realtime/polling needed)

| Page | Has Realtime | Has Polling | Notes |
|------|-------------|-------------|-------|
| VaultPage | NO | NO | Correct — shows list of quiz packs, no live sync needed |
| JournalPage | NO | NO | Correct — aggregated read-only view |
| ProfilesPage | NO | NO | Correct — hub page with static links |
| QuizPacksPage | NO | NO | Correct — pack selection screen |
| DeepDivePage | NO | NO | Correct — deck selection screen |
| FunStuffPage | NO | NO | Correct — fun stuff hub |
| WatchGuidePage | NO | NO | Correct — static content or read-once |
| VisionPage | NO | NO | Correct — shell that renders VisionTab (which has realtime + polling) |
| AuthPage | NO | NO | Correct — auth only |
| ResetPasswordPage | NO | NO | Correct — auth only |
| HomePage | NO | NO | Correct — auto-redirector |
| JoinPage | NO | NO | Correct — one-time join flow |

---

## Standard Stack

### The Established Pattern (no new packages needed)

All work is within existing React patterns and Supabase JS SDK. No new npm packages.

```bash
# No installation needed — verify existing setup only
npm list @supabase/supabase-js
# Expected: 2.x.x
```

### Core Pattern: useCallback + Split Effects

The app's canonical pattern, established in HotTakesPage and used across most pages:

```javascript
// 1. Stable fetch function — useCallback prevents stale closures
const fetchAll = useCallback(async () => {
  const { data } = await supabase.from('table').select('*').eq('session_id', sessionId)
  if (data) setState(data)
}, [sessionId])

// 2. Initial load
useEffect(() => { fetchAll() }, [fetchAll])

// 3. Realtime subscription (runs always)
useEffect(() => {
  const channel = supabase
    .channel(`feature-${sessionId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'table_name',
      filter: `session_id=eq.${sessionId}`,
    }, () => fetchAll())
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}, [sessionId, fetchAll])

// 4. Polling fallback — gated behind waiting condition
useEffect(() => {
  if (!isWaiting) return
  const interval = setInterval(fetchAll, 5000)
  return () => clearInterval(interval)
}, [fetchAll, isWaiting])
```

**Why split across effects (not combined):** Keeps realtime subscription lifecycle separate from polling lifecycle. Polling needs to re-run (teardown + setup) when `isWaiting` changes; realtime does not. If combined, changing `isWaiting` would tear down and re-subscribe the realtime channel unnecessarily.

### Alternative: Combined Pattern (acceptable for always-on pages)

When both realtime and polling are always active (MoviesPage, StudyTogetherPage, VisionTab), combining them is simpler:

```javascript
useEffect(() => {
  fetchData()
  const channel = supabase.channel(...).on(..., () => fetchData()).subscribe()
  const interval = setInterval(fetchData, 5000)
  return () => { supabase.removeChannel(channel); clearInterval(interval) }
}, [sessionId])
```

This is correct when no gating is needed. Do not change these pages to split patterns.

---

## Architecture Patterns

### QuizPage — What to Add

QuizPage is submit-only: each player answers 5 questions and upserts a single row to `responses`. There is no "waiting for partner" screen within QuizPage — after submitting, the player navigates to ResultsPage.

RT-02 and RT-03 requirements mean QuizPage needs realtime + polling, but the purpose must be clarified:

**Option A (narrow):** Add realtime subscription to QuizPage so that if the partner has already submitted before the current player arrives, the "done!" button or some indicator shows "your partner already answered." This is useful UX but not strictly a sync requirement — QuizPage is sequential, not simultaneous.

**Option B (correct interpretation):** RT-02/RT-03 mean ResultsPage, which is the "waiting for partner" screen after quiz submission. ResultsPage already has both. The planner should verify that ResultsPage's existing implementation fully satisfies RT-02 and RT-03, or if QuizPage genuinely needs a subscription.

**Recommendation for planner:** RT-02 and RT-03 are best satisfied by confirming ResultsPage's realtime + polling is correct, plus adding a lightweight realtime subscription to QuizPage to detect if a partner's response already exists (enabling a "your partner answered first!" indicator or auto-advance). The subscription in QuizPage should be minimal and gated — not a continuous poll.

**Minimal QuizPage addition (if required):**

```javascript
// In QuizPage — check if partner already answered when landing on the page
const fetchPartnerResponse = useCallback(async () => {
  const { data } = await supabase
    .from('responses')
    .select('player_id')
    .eq('session_id', sessionId)
    .eq('pack_id', packId)
    .neq('player_id', playerId)
  if (data && data.length > 0) setPartnerAnswered(true)
}, [sessionId, packId, playerId])

// No polling here — partner answering doesn't affect the quiz flow
// They each answer independently; ResultsPage handles the reveal
```

### ResultsPage — Known Issues

ResultsPage already has realtime + polling but has two subtle issues flagged in previous research:

1. **Realtime filter is `INSERT` only** — if the partner's row already exists when the current player arrives at ResultsPage (submitted before you), the realtime `INSERT` event will never fire. The 5s polling fallback catches this. To make it fully robust, change `event: 'INSERT'` to `event: '*'`.

2. **Polling gate is `responses.length < 2`** — this correctly stops polling once both responses are loaded. The polling `useEffect` depends on `responses.length` in its deps, so when the state updates, the effect re-runs and returns early, clearing the interval. This is correct.

3. **`fetchResponses` is not wrapped in `useCallback`** — it is defined as a plain `async` function inside the component. The realtime callback and polling closure both capture stale versions. In practice this does not cause issues because `sessionId` and `packId` from `useParams()` are stable, but it should be wrapped for correctness.

### DeepDiveDeckPage — Known Issues

`fetchResponses` is defined as a plain `async` function (not `useCallback`). The polling `useEffect` at line 103-116 has `[phase]` as its only dependency — this means when `phase` changes, the polling effect re-runs correctly. But the realtime callback at line 82-86 calls `fetchResponses()` directly, capturing the function at subscription time. Since `sessionId` and `deckId` from `useParams()` are stable, this does not cause session switching bugs. However, it is inconsistent with the `useCallback` pattern.

The polling effect at line 116 depends only on `[phase]` but calls `fetchResponses()` which reads `sessionId`, `deckId`, and `deck` from closure. These values are stable (from params), so there is no bug — but a strict lint would flag it.

### FinishSentencePage — Known Issues

`fetchAll` is defined as a plain `async` function, NOT `useCallback`. The polling `useEffect` at lines 53-58 depends on `[sessionId, playerId, screen]`. The realtime effect at lines 61-72 depends on `[sessionId, playerId]`. Both call `fetchAll` directly. Because `sessionId` and `playerId` are stable throughout the page lifetime, stale closures are not a bug — but the pattern is inconsistent.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Debounced polling | Custom debounce + interval logic | Gate polling with `if (!condition) return` at effect start | Existing pattern is simpler and sufficient |
| Reconnection logic | Custom WebSocket reconnect | Supabase JS client handles reconnection; polling covers the gap | Adding custom reconnect is redundant |
| AbortController for fetch cancellation | Manual `AbortController` per fetch | `let active = true; if (!active) return` ref guard | AbortController adds complexity; active ref is sufficient for this use case |
| Shared polling context | Global setInterval in a React context | Per-page `useEffect` intervals | Global polling creates cross-page state leaks; per-page is isolated and correct |

---

## Common Pitfalls

### Pitfall 1: Stale Closure in Polling without useCallback

**What goes wrong:** If `fetchAll` is defined inside the component without `useCallback`, the `setInterval` callback captures the version of `fetchAll` from the first render. If `sessionId` changes (navigation), the interval keeps fetching the old session.

**For this phase:** `sessionId` comes from `useParams()` and does not change within a page's lifetime (navigation creates a new page instance). So stale closures on `sessionId` do not cause bugs in practice. However, any new polling useEffect must list dependencies correctly or use `useCallback`.

**Prevention:** Use `useCallback` for any fetch function that setInterval calls. List `sessionId` in the `useCallback` dependency array.

### Pitfall 2: Removing a Channel That Was Never Subscribed

**What goes wrong:** If the realtime `useEffect` fires and the effect cleanup runs before `.subscribe()` resolves (React Strict Mode double-invocation in dev), `supabase.removeChannel(channel)` is called on a channel in `SUBSCRIBING` state.

**Impact:** Low — Supabase handles this gracefully. The polling fallback covers any missed events. No action needed.

### Pitfall 3: Polling Runs During Active Input

**What goes wrong:** If `setInterval(fetchAll, 5000)` runs while the user is typing an answer, the fetch may overwrite local state (e.g., clearing a textarea's value if `fetchAll` resets that state).

**Prevention:** Gate polling behind a "waiting" state. Pages where the user is actively inputting (QuizPage answering, FinishSentencePage `write` screen) should not have unconditional polling. FinishSentencePage correctly gates on `screen !== 'reveal'` — but this still polls during `write`, `wait-for-partner-starter`, and `finish` screens. Since those screens don't overwrite text input state (fetchAll updates `myStarter` and `partnerStarter`, not the input fields), this is acceptable.

### Pitfall 4: INSERT-only Realtime Event Filter

**What goes wrong:** `event: 'INSERT'` on ResultsPage and DrawResultsPage means if the partner submitted before the current player arrived, the existing row does not trigger a realtime event. The polling fallback covers this, but the ideal fix is to change to `event: '*'`.

**Prevention:** Use `event: '*'` for all realtime subscriptions unless there is a specific reason to filter to INSERT only (there is none in this codebase).

### Pitfall 5: Channel Name with Undefined sessionId

**What goes wrong:** If `supabase.channel('feature-undefined')` is called before `sessionId` is available, two users with no session get the same channel name and leak each other's events.

**Prevention:** `sessionId` comes from `useParams()` which is synchronously available in React Router v6/v7. This is not a risk for the current codebase. Guard with `if (!sessionId) return` in any new effect to be safe.

### Pitfall 6: DeepDiveDeckPage Polling Effect Dep Array

**Current code (line 116):**
```javascript
}, [phase])
```

The polling interval calls `fetchResponses()` which reads `sessionId`, `deckId`, `playerId`, and `deck` from the component closure. These are all stable (from params/context), so no bug exists. But a thorough RT-04 compliance pass should note this inconsistency.

---

## Code Examples

### Template: Screen-Gated Polling (from HotTakesPage — verified)

```javascript
// Source: src/pages/HotTakesPage.jsx lines 57-93

const fetchAll = useCallback(async () => {
  try {
    const { data: sessionData } = await supabase
      .from('sessions').select('*').eq('id', sessionId).single()
    if (sessionData) setSession(sessionData)
    const { data: votes, error: vErr } = await supabase
      .from('hot_takes').select('*').eq('session_id', sessionId)
    if (vErr) throw vErr
    setAllVotes(votes || [])
  } catch (err) {
    setError('something went wrong loading takes')
  }
  setLoading(false)
}, [sessionId])

useEffect(() => { fetchAll() }, [fetchAll])

// Polling — only on waiting/results screens
useEffect(() => {
  if (screen !== 'group-done' && screen !== 'results') return
  const interval = setInterval(fetchAll, 5000)
  return () => clearInterval(interval)
}, [fetchAll, screen])

// Realtime — always subscribed
useEffect(() => {
  const channel = supabase
    .channel(`hot-takes-${sessionId}`)
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'hot_takes',
      filter: `session_id=eq.${sessionId}`,
    }, () => fetchAll())
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}, [sessionId, fetchAll])
```

### Template: Combined Always-On (from StudyTogetherPage — verified)

```javascript
// Source: src/pages/StudyTogetherPage.jsx lines 112-129

useEffect(() => {
  const channel = supabase
    .channel(`study-${sessionId}`)
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'responses',
      filter: `session_id=eq.${sessionId}`,
    }, (payload) => {
      if (payload.new && payload.new.pack_id === PACK_ID) {
        fetchData()
      }
    })
    .subscribe()
  const interval = setInterval(fetchData, 5000)
  return () => { supabase.removeChannel(channel); clearInterval(interval) }
}, [sessionId])
```

### Template: Phase-Gated (from LoveNoteHuntPage — verified)

```javascript
// Source: src/pages/LoveNoteHuntPage.jsx lines 136-167

useEffect(() => {
  if (phase !== PHASE.WAITING) return  // early return = no subscription, no cleanup needed

  const channel = supabase
    .channel(`love-notes-${sessionId}-r${round}`)
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'love_notes',
      filter: `session_id=eq.${sessionId}`,
    }, async () => {
      const notes = await fetchPartnerNotes()
      if (notes.length >= NOTES_REQUIRED) setPhase(PHASE.HUNTING)
    })
    .subscribe()

  const interval = setInterval(async () => {
    const notes = await fetchPartnerNotes()
    if (notes.length >= NOTES_REQUIRED) setPhase(PHASE.HUNTING)
  }, 5000)

  return () => {
    supabase.removeChannel(channel)
    clearInterval(interval)
  }
}, [phase, sessionId, round])
```

Note: This pattern gates both realtime AND polling behind `phase === PHASE.WAITING`. When phase changes to `HUNTING`, the effect cleanup fires, removing both the channel and interval. This is the cleanest pattern — both mechanisms live in the same effect.

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| Single INSERT filter on realtime | `event: '*'` | ResultsPage and DrawResultsPage still use INSERT — should update |
| Plain function in setInterval | `useCallback` with sessionId in deps | HotTakesPage adopted this; others use plain functions but are safe due to stable params |
| Polling unconditionally | Screen/phase gating | Most pages gate correctly; StudyTogetherPage and VisionTab intentionally always-on |

---

## What Pages Actually Need Changing

This is the definitive list based on source code inspection:

### Must Change (RT-01 through RT-05)

| Page | Change Required | Complexity |
|------|-----------------|-----------|
| **QuizPage** | Add realtime subscription + conditional polling (or confirm ResultsPage fully satisfies RT-02/RT-03) | Medium |
| **ResultsPage** | Change `event: 'INSERT'` to `event: '*'`; wrap `fetchResponses` in `useCallback` | Low |
| **DrawResultsPage** | Change `event: 'INSERT'` to `event: '*'` | Low |
| **DeepDiveDeckPage** | Wrap `fetchResponses` in `useCallback`; add it to polling effect's dep array | Low |

### Acceptable As-Is (RT-04 compliance confirmed)

| Page | Cleanup Status | Notes |
|------|---------------|-------|
| HotTakesPage | 2 effects, each with own cleanup | Correct |
| FinishSentencePage | 2 effects, each with own cleanup | Correct |
| PredictPartnerPage | Single effect, cleans both | Correct |
| LoveNoteHuntPage | Single effect (phase-gated), cleans both | Correct |
| TicTacToePage | 2 effects, each with own cleanup | Correct |
| MoviesPage | Single effect, cleans both | Correct |
| StudyTogetherPage | Single effect, cleans both | Correct |
| VisionTab | Single effect, cleans both | Correct |
| PersonalityPage | No realtime; polling effect has cleanup | Correct |

### No Changes Needed

VaultPage, JournalPage, ProfilesPage, QuizPacksPage, DeepDivePage, FunStuffPage, WatchGuidePage, VisionPage (shell), AuthPage, ResetPasswordPage, HomePage, JoinPage.

---

## RT-05 Assessment: Polling Gating

Requirement: "Polling only runs when the page is in a 'waiting for partner' state (not during active input or after data is complete)."

| Page | Polling Condition | RT-05 Compliant? |
|------|-----------------|-----------------|
| ResultsPage | `responses.length < 2` | YES |
| HotTakesPage | screen is `group-done` or `results` | YES |
| FinishSentencePage | screen is not `reveal` | MOSTLY — still polls during active input screens, but polling does not overwrite input state |
| DeepDiveDeckPage | `phase === PHASE.WAITING` | YES |
| LoveNoteHuntPage | `phase === PHASE.WAITING` | YES |
| TicTacToePage | `!isMyTurn && !winner` | YES |
| DrawResultsPage | `responses.length < 2` | YES |
| PredictPartnerPage | Always polls | ACCEPTABLE — partner prediction marks can arrive at any time; treating as always-collaborative |
| PersonalityPage | `!partnerProfile` | YES |
| MoviesPage | Always polls | ACCEPTABLE — collaborative list, no "waiting" state |
| StudyTogetherPage | Always polls | ACCEPTABLE — shared data, either partner can update at any time |
| VisionTab | Always polls | ACCEPTABLE — same rationale |

**Summary:** RT-05 is substantially satisfied. No page has polling that creates user-facing issues. The always-on pages (PredictPartnerPage, MoviesPage, StudyTogetherPage, VisionTab) poll unconditionally because they model continuous collaboration, not sequential partner-waiting. This is intentional and correct.

---

## Open Questions

1. **QuizPage interpretation of RT-02/RT-03**
   - What we know: QuizPage is submit-only; ResultsPage is the waiting screen
   - What's unclear: Whether RT-02/RT-03 mean "add realtime to QuizPage" or "verify ResultsPage's realtime covers the partner-answer-visibility requirement"
   - Recommendation: Planner should treat RT-02/RT-03 as requiring QuizPage to have a realtime subscription that detects when the partner has submitted (to enable "partner answered!" status or auto-navigate to results). This is minimal scope — a single `on('postgres_changes')` subscription, no polling needed inside QuizPage itself since the user is actively answering.

2. **FinishSentencePage polling during active input screens**
   - What we know: Polls on `write`, `wait-for-partner-starter`, `finish` screens (not `reveal`)
   - What's unclear: Whether polling during `write` or `finish` (active typing) violates RT-05
   - Recommendation: No change needed. `fetchAll` updates `myStarter`/`partnerStarter` state, not the user's text input. No overwrite risk.

---

## Sources

### Primary (HIGH confidence — direct source inspection)

All findings based on direct read of:
- `src/pages/QuizPage.jsx` — no realtime, no polling, confirmed
- `src/pages/ResultsPage.jsx` — realtime (INSERT only) + gated polling, confirmed
- `src/pages/HotTakesPage.jsx` — useCallback + screen-gated polling + realtime, confirmed
- `src/pages/FinishSentencePage.jsx` — realtime + polling (skips reveal), confirmed
- `src/pages/PredictPartnerPage.jsx` — realtime + always-on polling, confirmed
- `src/pages/DeepDiveDeckPage.jsx` — realtime + phase-gated polling, confirmed
- `src/pages/LoveNoteHuntPage.jsx` — phase-gated realtime + polling in one effect, confirmed
- `src/pages/TicTacToePage.jsx` — realtime + turn-gated polling (3s), confirmed
- `src/pages/DrawResultsPage.jsx` — realtime (INSERT only) + gated polling, confirmed
- `src/pages/MoviesPage.jsx` — realtime + always-on polling, combined cleanup, confirmed
- `src/pages/StudyTogetherPage.jsx` — realtime + always-on polling, combined cleanup, confirmed
- `src/pages/VisionTab.jsx` — realtime + always-on polling, combined cleanup, confirmed
- `src/pages/PersonalityPage.jsx` — no realtime, polling gated on `!partnerProfile`, confirmed
- All non-interactive pages — confirmed no realtime/polling

### Secondary (HIGH confidence — prior phase research)

- `.planning/research/STACK.md` — polling pattern documentation, pitfalls
- `.planning/research/ARCHITECTURE.md` — pattern templates verified against source

---

## Metadata

**Confidence breakdown:**
- Page audit: HIGH — direct source inspection of all 26 page files
- Architecture patterns: HIGH — verified from existing working code
- Pitfalls: HIGH — based on actual code patterns observed, not speculation
- QuizPage interpretation: MEDIUM — RT-02/RT-03 requirement wording is ambiguous; planner must decide scope

**Research date:** 2026-03-11
**Valid until:** 2026-04-10 (stable patterns; no breaking changes expected)
