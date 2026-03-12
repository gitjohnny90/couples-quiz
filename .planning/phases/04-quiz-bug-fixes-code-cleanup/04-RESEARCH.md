# Phase 4: Quiz Bug Fixes & Code Cleanup — Research

**Researched:** 2026-03-11
**Domain:** React state management, Supabase realtime, async cleanup patterns
**Confidence:** HIGH — all findings verified directly from source files

---

## Summary

Phase 4 fixes the remaining quiz reliability bugs and cleans up code patterns across feature pages. The work divides cleanly into two tracks: (1) quiz-specific bugs in QuizPage and ResultsPage, and (2) cross-cutting cleanup patterns (isMounted refs and channel naming) that apply to all pages.

The most impactful fixes are QUIZ-04 (missing `setSessionId` sync in QuizPage and ResultsPage) and CLN-01 (no isMounted protection anywhere in the codebase). QUIZ-03 is already complete — ResultsPage already uses `event: '*'` as of Phase 3. Channel naming (CLN-02) is low-risk given the current session model but should be verified for React StrictMode double-mount behavior.

React StrictMode is active (`main.jsx` wraps the app in `<React.StrictMode>`), which means effects run twice in development. This amplifies any issues with channel registration and unmounted state updates.

**Primary recommendation:** Fix QUIZ-04 first (sessionId sync) as it underlies both QUIZ-01 and QUIZ-05. Then add isMounted cleanup (CLN-01) to pages with async fetches. Audit channel names last as they are lowest risk.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| QUIZ-01 | Quiz buttons respond correctly to taps (no stuck/dead button states) | `submitted` flag logic is correct; most likely root cause is stale `sessionId` causing save failures that leave `submitted = true` without recovery. Fix QUIZ-04 first. |
| QUIZ-02 | Quiz pages progress to next question/results without manual reload | `navigate()` is inside `try` block. If the save throws, `setSubmitted(false)` resets. Real risk: if `sessionId` is undefined at save time, the upsert silently returns an error, triggering the catch — but the error message appears and submitted resets. Flow is correct; QUIZ-04 stale sessionId is likely the trigger. |
| QUIZ-03 | ResultsPage realtime filter changed from INSERT to * (catches existing partner data) | **ALREADY DONE in Phase 3.** ResultsPage line 55: `event: '*'`. No work needed here — just mark complete. |
| QUIZ-04 | QuizPage syncs sessionId from URL params consistently | QuizPage does NOT call `setSessionId(sessionId)` from URL params. 7 other pages do. ResultsPage also missing this. Add `useEffect(() => { if (sessionId) setSessionId(sessionId) }, [sessionId])` to both pages. |
| QUIZ-05 | Partner answers display correctly without data mix-ups | ResultsPage `p1 = responses.find(r => r.player_id === 'player1')` is purely positional, not context-dependent. If `playerId` context is stale (stale sessionId), the partner/own labeling could be off. Fixing QUIZ-04 resolves this transitively. |
| CLN-01 | Async state operations guarded with isMounted refs to prevent memory leaks | Zero isMounted usage exists in any page or hook. Every `async function` inside `useEffect` sets state after `await` without mount checks. React StrictMode double-mounts make this observable in dev. Standard pattern: `let mounted = true` at top of effect, check before state setters, set `mounted = false` in cleanup. |
| CLN-02 | Realtime channel names are unique per page instance (no collisions) | All channel names already include `sessionId`. Current names are unique within a session. React StrictMode causes double-mount in dev — Supabase deduplicates same-name channels internally, so this is not a runtime bug. However, if the same page mounts twice (e.g., dev HMR edge case), two subscriptions will exist. Adding a `useRef` UUID suffix ensures true per-instance uniqueness. |
| CLN-03 | General code cleanup pass across feature pages | Scope: remove dead `console.error` leaves, ensure error states are reset before retry, verify consistent import ordering. Low effort. |
</phase_requirements>

---

## Standard Stack

### Core (already in use — no new installs needed)

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| React | 19 | Component lifecycle, hooks | `useRef` for isMounted pattern |
| react-router-dom | 7 | `useParams`, `useNavigate` | sessionId comes from URL params |
| Supabase JS | current | realtime channels, db queries | `removeChannel` in cleanup |

### No new dependencies required for this phase.

---

## Architecture Patterns

### Pattern 1: sessionId Sync from URL Params

**What:** All pages that receive `sessionId` via URL params should call `setSessionId(sessionId)` in a `useEffect`. This writes the value back to `SessionContext` and `localStorage`, ensuring context and URL stay in sync.

**When to use:** Every page that reads `sessionId` from `useParams()`.

**Reference (from PredictPartnerPage.jsx line 39-41):**
```javascript
// Source: src/pages/PredictPartnerPage.jsx
useEffect(() => {
  if (sessionId) setSessionId(sessionId)
}, [sessionId])
```

**Pages confirmed missing this pattern:**
- `QuizPage.jsx` — reads `sessionId` from `useParams()` but never syncs back
- `ResultsPage.jsx` — reads `sessionId` from `useParams()` but never syncs back

**Pages confirmed to have this pattern:** VaultPage, StudyTogetherPage, PredictPartnerPage, LoveNoteHuntPage, FunStuffPage, MoviesPage.

**Why it matters:** If a user navigates directly to `/quiz/:sessionId/:packId` without going through HomePage first (e.g., from a link, or after a page reload), `SessionContext.sessionId` may be null or stale. The `useParams()` sessionId is correct but `context.sessionId` is what gets passed to Supabase queries. Without the sync, saves fail with a null session_id.

---

### Pattern 2: isMounted Ref for Async State Updates

**What:** Place a `let mounted = true` sentinel at the start of a `useEffect`, guard all `setState` calls that run after `await`, and set `mounted = false` in the cleanup.

**When to use:** Any `useEffect` that performs an async fetch and then calls `setState`. All fetch effects in all pages qualify.

**Standard pattern:**
```javascript
// Source: React documentation — verified pattern
useEffect(() => {
  let mounted = true
  const load = async () => {
    const { data } = await supabase.from('table').select('*').eq('session_id', sessionId)
    if (mounted && data) setMyState(data)
    if (mounted) setLoading(false)
  }
  load()
  return () => { mounted = false }
}, [sessionId])
```

**For useCallback-wrapped fetch functions** (used with polling + realtime), the isMounted ref must be a `useRef` instead of a local `let`, since the callback outlives the effect:

```javascript
const mountedRef = useRef(true)

useEffect(() => {
  mountedRef.current = true
  return () => { mountedRef.current = false }
}, [])

const fetchAll = useCallback(async () => {
  const { data } = await supabase.from('table').select('*').eq('session_id', sessionId)
  if (mountedRef.current && data) setMyState(data)
}, [sessionId])
```

**Note on scope:** CLN-01 says "async state operations guarded with isMounted refs." Given the volume of pages, the planner should scope this to the pages that are most likely to cause visible warnings:
- Pages with slow async operations (multiple awaits)
- Pages users navigate away from quickly (QuizPage after submission triggers navigate)
- The fix for QuizPage is highest priority since `navigate` fires while the save is in progress

---

### Pattern 3: Unique Realtime Channel Names

**What:** Supabase channels are identified by name. If two subscriptions use the same name in the same JS process, Supabase reuses the socket for both — which means double callbacks. React StrictMode's double-mount effect causes exactly this in development.

**Current state:** Channel names follow `feature-${sessionId}` or `feature-${sessionId}-${resourceId}`. These are deterministic (not instance-unique). In a single-user session this is harmless at runtime, but dev StrictMode causes observable double-firing.

**Current channel names (all pages):**

| Page | Channel Name | Unique Across Re-mounts? |
|------|-------------|--------------------------|
| QuizPage | `quiz-${sessionId}-${packId}` | No (StrictMode) |
| ResultsPage | `responses-${sessionId}-${packId}` | No (StrictMode) |
| HotTakesPage | `hot-takes-${sessionId}` | No (StrictMode) |
| FinishSentencePage | `finish-sentence-${sessionId}` | No (StrictMode) |
| LoveNoteHuntPage | `love-notes-${sessionId}-r${round}` | No (StrictMode) |
| MoviesPage | `shared-items-movies-${sessionId}` | No (StrictMode) |
| PredictPartnerPage | `predict-${sessionId}` | No (StrictMode) |
| TicTacToePage | `tictactoe-${sessionId}` | No (StrictMode) |
| VisionTab | `vision-${sessionId}` | No (StrictMode) |
| StudyTogetherPage | `study-${sessionId}` | No (StrictMode) |
| DeepDiveDeckPage | `deep-dive-${sessionId}-${deckId}` | No (StrictMode) |
| DrawResultsPage | `draw-${sessionId}-${promptId\|'legacy'}` | No (StrictMode) |
| reactions.js | `reactions-${sessionId}-${targetType}` | No (StrictMode) |
| MissYouHeart | `nudge-${sessionId}` | No (StrictMode) |

**Recommended fix — useRef UUID suffix:**
```javascript
// Source: React/Supabase community pattern
const channelId = useRef(`quiz-${sessionId}-${packId}-${Math.random().toString(36).slice(2, 8)}`)

useEffect(() => {
  const channel = supabase
    .channel(channelId.current)
    .on('postgres_changes', { ... }, handler)
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}, [sessionId, packId, fetchAll])
```

**Scope decision for planner:** Applying this to all 14 channel locations is high effort for low runtime impact. Prioritize the quiz pages (QUIZ-01/02 scope) and document the pattern for others.

---

### Pattern 4: QuizPage handleNext — Submitted State Safety

**Current flow (verified from source):**
```
handleNext() called
  → setSubmitted(true)       // disables all buttons
  → await supabase.upsert()
  → if error: throw saveErr  // caught by catch block
    → setError(msg)
    → setSubmitted(false)    // re-enables buttons
  → if ok: navigate(...)     // leaves page
```

**The risk:** Between `setSubmitted(true)` and either `navigate` or `setSubmitted(false)`, the component may unmount (user taps "back" in browser). The `setSubmitted(false)` in the catch block then fires on an unmounted component. This is the React warning CLN-01 addresses.

**The fix:** Add isMounted check in the catch block of `handleNext`:
```javascript
const handleNext = async () => {
  if (!hasCurrentAnswer) return
  if (isLastQuestion) {
    setSubmitted(true)
    setError('')
    try {
      const { error: saveErr } = await supabase.from('responses').upsert(...)
      if (saveErr) throw saveErr
      navigate(`/results/${sessionId}/${packId}`)
    } catch (err) {
      console.error("oops, couldn't save:", err)
      if (mountedRef.current) {
        setError("couldn't save your answers — try again")
        setSubmitted(false)
      }
    }
  } else {
    setDirection(1)
    setCurrentQ((prev) => prev + 1)
  }
}
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Unmount detection | Custom event bus or global flag | `useRef` + effect cleanup (`let mounted = true`) | Standard React pattern, no library needed |
| Channel deduplication | Manual channel registry | Supabase client handles this; just use unique names via `useRef` | Supabase JS deduplicates same-name channels automatically |
| sessionId validation | URL parser or custom hook | Simple `useEffect(() => { if (sessionId) setSessionId(sessionId) }, [sessionId])` | Already the established pattern in 6 other pages |

---

## Common Pitfalls

### Pitfall 1: QUIZ-03 Is Already Done

**What goes wrong:** Treating QUIZ-03 as pending work.
**Why it happens:** REQUIREMENTS.md shows it as `[ ]` but Phase 3 (03-01-PLAN.md) changed `ResultsPage` `event: 'INSERT'` → `event: '*'`. The code at line 55 of `ResultsPage.jsx` already has `event: '*'`.
**How to avoid:** Mark QUIZ-03 complete at the start of the phase. Don't re-implement it.
**Verification:** `ResultsPage.jsx` line 55: `event: '*', schema: 'public', table: 'responses'`.

---

### Pitfall 2: isMounted Ref vs. Local Let

**What goes wrong:** Using `let mounted = true` inside an effect that also creates a `useCallback`-based fetch. The `useCallback` outlives the effect — if it fires from a polling interval or realtime event after unmount, `mounted` is already `false` but the callback can't see it (it's a local variable in a closed scope that's gone).
**Why it happens:** `let mounted` is closure-scoped. A `useCallback` defined outside the effect has its own closure and doesn't share the local `mounted` variable.
**How to avoid:** For pages that use `useCallback` fetch functions (all the polling pages), use `useRef`:
```javascript
const mountedRef = useRef(true)
useEffect(() => { return () => { mountedRef.current = false } }, [])
const fetchAll = useCallback(async () => {
  const { data } = await supabase...
  if (mountedRef.current && data) setMyState(data)
}, [sessionId])
```

---

### Pitfall 3: Forgetting ResultsPage Also Needs sessionId Sync

**What goes wrong:** Fixing QuizPage's missing `setSessionId` but leaving ResultsPage with the same gap.
**Why it happens:** The bug report is about quiz buttons and navigation (QuizPage), so ResultsPage gets overlooked.
**How to avoid:** Both pages are in the same user flow (`/quiz/:sessionId/:packId` → `/results/:sessionId/:packId`) and both read `sessionId` from params without syncing to context.

---

### Pitfall 4: Channel Cleanup and useCallback Deps

**What goes wrong:** Adding a channel ref via `useRef` for uniqueness, then accidentally putting the ref itself in the `useEffect` dependency array.
**Why it happens:** ESLint exhaustive-deps rule may flag `channelId.current` reads.
**How to avoid:** `useRef` values are stable references — never include them in dependency arrays. The channel name is computed once on mount and doesn't change.

---

## Code Examples

### sessionId Sync Pattern (canonical reference)

```javascript
// Source: src/pages/PredictPartnerPage.jsx line 39-41
const { sessionId } = useParams()
const { setSessionId, playerName, playerId } = useContext(SessionContext)

useEffect(() => {
  if (sessionId) setSessionId(sessionId)
}, [sessionId])
```

### isMounted with useRef (for useCallback pages)

```javascript
// Source: React documentation pattern — for pages using useCallback fetch
const mountedRef = useRef(true)
useEffect(() => {
  mountedRef.current = true
  return () => { mountedRef.current = false }
}, [])

const fetchAll = useCallback(async () => {
  const { data, error } = await supabase
    .from('table').select('*').eq('session_id', sessionId)
  if (!mountedRef.current) return
  if (!error && data) setMyState(data)
  setLoading(false)
}, [sessionId])
```

### isMounted with local let (for simple one-off effects)

```javascript
// Source: React documentation — for simple fetch effects without useCallback
useEffect(() => {
  let mounted = true
  const load = async () => {
    const { data } = await supabase.from('sessions').select('*').eq('id', sessionId).single()
    if (mounted && data) setSession(data)
    if (mounted) setLoading(false)
  }
  load()
  return () => { mounted = false }
}, [sessionId])
```

### Unique Channel Name Pattern

```javascript
// Computed once on mount, stable across re-renders
const channelId = useRef(`quiz-${sessionId}-${packId}-${Math.random().toString(36).slice(2, 8)}`)

useEffect(() => {
  const channel = supabase
    .channel(channelId.current)
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'responses',
      filter: `session_id=eq.${sessionId}`,
    }, () => fetchAll())
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}, [sessionId, packId, fetchAll])
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `event: 'INSERT'` in ResultsPage | `event: '*'` | Phase 3 (03-01) | Catches pre-existing rows — QUIZ-03 is done |
| No polling in QuizPage | Polling + realtime added | Phase 3 (03-01) | Partner submission detected without reload |
| No `useCallback` on fetch functions | `useCallback` on all polling fetch functions | Phase 3 | Stable dep array, no stale closures |

**Already done (do not redo):**
- QUIZ-03: ResultsPage `event: '*'` — confirmed in source
- RT-01 through RT-05: All polling + realtime patterns verified complete in Phase 3

---

## Open Questions

1. **CLN-02 scope — how many pages to fix?**
   - What we know: 14 channel locations, all are deterministic names, none are truly collision-prone in production
   - What's unclear: The requirement says "per page instance" — does this mean all pages, or just the quiz pages where QUIZ-01/02 bugs were reported?
   - Recommendation: Fix QuizPage + ResultsPage as part of the quiz bug track. Document the pattern. Optionally sweep remaining pages in CLN-03.

2. **CLN-01 scope — full sweep or targeted?**
   - What we know: Zero isMounted usage anywhere in the codebase; every page has async fetch effects
   - What's unclear: Whether the intent is all pages or just the ones with React warning observations
   - Recommendation: Prioritize pages with navigation-on-completion (QuizPage, DeepDiveDeckPage, FinishSentencePage). Full sweep in CLN-03 cleanup pass.

3. **QUIZ-01 root cause confirmation**
   - What we know: `submitted` flag logic is correct in code; `disabled={submitted}` on buttons
   - What's unclear: Is the "stuck button" caused by stale sessionId leading to save failure with slow recovery, or something in Framer Motion's AnimatePresence that eats pointer events?
   - Recommendation: Fix QUIZ-04 (sessionId sync) first. If QUIZ-01 reports persist after that, check `AnimatePresence mode="wait"` — during the exit animation, pointer events on the incoming question may be suppressed.

---

## Validation Architecture

No test runner is configured for this project (`CLAUDE.md`: "No test runner or linter is configured"). The `.planning/config.json` has no `workflow.nyquist_validation` key — treating as default (no framework configured means this section documents manual verification only).

### Manual Verification Steps (per requirement)

| Req ID | Behavior | Verification Method |
|--------|----------|-------------------|
| QUIZ-01 | Tap answer button, it selects immediately | Manual: open quiz, tap option, verify selection highlights without delay |
| QUIZ-02 | Answer last question, auto-navigate to results | Manual: complete all questions, verify auto-navigate without manual reload |
| QUIZ-03 | ResultsPage shows partner answers if they submitted first | Manual: partner submits first, then navigate to results — should show results immediately |
| QUIZ-04 | Direct URL navigation to quiz still works | Manual: open quiz URL directly in new tab, complete quiz, verify save succeeds |
| QUIZ-05 | Partner answers labeled correctly (not swapped) | Manual: player1 answers A, player2 answers B — verify results show correct attribution |
| CLN-01 | No React warnings on navigation away mid-save | Dev: open quiz, tap "done" then immediately navigate back — check console for unmount warnings |
| CLN-02 | No duplicate realtime events in console | Dev: open any page with realtime, check Supabase channel logs for duplicate subscriptions |
| CLN-03 | General code quality | Code review: no console.error leftovers, consistent patterns |

### Wave 0 Gaps
None — no test files needed; verification is manual per project configuration.

---

## Sources

### Primary (HIGH confidence)
- `src/pages/QuizPage.jsx` — verified missing `setSessionId` sync, `submitted` flag flow, channel name
- `src/pages/ResultsPage.jsx` — verified `event: '*'` already present (QUIZ-03 done), missing `setSessionId`
- `src/pages/PredictPartnerPage.jsx` — canonical reference for `setSessionId` sync pattern
- `src/pages/HotTakesPage.jsx` — canonical reference for screen-gated polling + useCallback pattern
- `src/pages/DrawResultsPage.jsx` — verified full RT + polling cleanup pattern
- `src/main.jsx` — confirmed `<React.StrictMode>` active (affects channel double-registration)
- `src/App.jsx` — verified `SessionContext` shape: `{ sessionId, setSessionId, playerName, playerId, ... }`
- `src/utils/reactions.js` — verified `useReactions` hook channel name pattern
- `.planning/REQUIREMENTS.md` — requirement definitions
- `.planning/STATE.md` — Phase 3 decisions that mark QUIZ-03 as done
- `CLAUDE.md` — tech stack, architecture, no test runner

### Secondary (MEDIUM confidence)
- React docs — `useRef` for isMounted pattern; standard approach confirmed by community
- Supabase docs — channel name deduplication behavior in Supabase JS client

---

## Metadata

**Confidence breakdown:**
- QUIZ-01 root cause: MEDIUM — likely stale sessionId but Framer Motion pointer events not ruled out
- QUIZ-02 fix: HIGH — sessionId sync resolves this
- QUIZ-03 status: HIGH — already fixed in Phase 3, confirmed in source
- QUIZ-04 fix: HIGH — missing `setSessionId` useEffect confirmed in source
- QUIZ-05 fix: HIGH — resolved transitively by QUIZ-04
- CLN-01 pattern: HIGH — useRef isMounted is the standard React approach
- CLN-02 pattern: HIGH — useRef UUID suffix is the standard per-instance approach
- CLN-03 scope: MEDIUM — requires code review pass to enumerate all cleanup items

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (stable patterns, no fast-moving dependencies)
