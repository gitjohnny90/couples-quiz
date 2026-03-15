---
phase: 06-bug-fixes
plan: 02
subsystem: ui
tags: [react, supabase, stale-closure, performance, polling]

# Dependency graph
requires:
  - phase: 06-bug-fixes
    provides: Plan 01 share URL fix
provides:
  - VisionTab caption autosave using dataRef pattern to avoid stale closure
  - PredictPartnerPage post-save navigation using fresh fetch return value
  - Explicit column selects on all 17 polling/fetch call sites (no more select(*))
affects: [any future work touching polling pages or VisionTab/PredictPartnerPage]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "dataRef pattern: useRef(data) + useEffect(() => { dataRef.current = data }, [data]) for reading latest state inside setTimeout callbacks"
    - "Return-value pattern: async data-fetch functions return fetched data so callers can use it directly without waiting for setState"
    - "Explicit column selects: all Supabase queries specify only columns the component accesses, eliminating base64/JSONB bandwidth waste"

key-files:
  created: []
  modified:
    - src/pages/VisionTab.jsx
    - src/pages/PredictPartnerPage.jsx
    - src/pages/ResultsPage.jsx
    - src/pages/DrawResultsPage.jsx
    - src/pages/StudyTogetherPage.jsx
    - src/pages/HotTakesPage.jsx
    - src/pages/FinishSentencePage.jsx
    - src/pages/PersonalityPage.jsx
    - src/pages/LoveNoteHuntPage.jsx
    - src/pages/MoviesPage.jsx
    - src/pages/TicTacToePage.jsx
    - src/pages/VaultPage.jsx
    - src/pages/JournalPage.jsx
    - src/pages/QuizPacksPage.jsx
    - src/pages/DeepDivePage.jsx
    - src/pages/DeepDiveDeckPage.jsx
    - src/utils/reactions.js

key-decisions:
  - "dataRef pattern chosen over useCallback refactor for caption autosave — simpler, fewer render cycles, same correctness guarantee"
  - "fetchResponses returns mapped data so caller uses it directly — avoids async setState race without restructuring the function"
  - "LoveNoteHuntPage love_notes select extended to include grid_position and message (not in plan spec but required by component)"

patterns-established:
  - "dataRef pattern: when a debounced setTimeout needs current state, track it via useRef synced with useEffect"
  - "Fetch-return pattern: data-fetching useCallbacks return their data so post-save code can act on fresh values immediately"

requirements-completed: [BUG-02, BUG-03, BUG-04]

# Metrics
duration: 10min
completed: 2026-03-15
---

# Phase 06 Plan 02: Bug Fixes (Stale Closures + Select Optimization) Summary

**dataRef pattern fixes VisionTab caption overwrite bug; fetchResponses return value fixes PredictPartnerPage stuck-waiting bug; all 17 select('*') calls replaced with explicit column lists to eliminate unnecessary base64/JSONB bandwidth on poll cycles**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-15T15:01:54Z
- **Completed:** 2026-03-15T15:12:00Z
- **Tasks:** 2
- **Files modified:** 17

## Accomplishments

- Fixed VisionTab caption autosave stale closure — captions no longer overwrite each other when editing multiple polaroids quickly (BUG-02)
- Fixed PredictPartnerPage post-save navigation — transitions to reveal screen immediately when partner is already done, without waiting for next poll cycle (BUG-03)
- Eliminated all `select('*')` calls across 16 page components and 1 utility file — responses table queries no longer transmit base64 drawing data or full JSONB on every 5-second poll (BUG-04)

## Task Commits

1. **Task 1: Fix stale closure in VisionTab and PredictPartnerPage** - `c02f5f9` (fix)
2. **Task 2: Replace select('*') with explicit column lists** - `cf16e34` (fix)

## Files Created/Modified

- `src/pages/VisionTab.jsx` - Added dataRef + sync effect; handleBoardCaption and handleNorthStarChange read dataRef.current inside timeouts; fetchData select('answers') only
- `src/pages/PredictPartnerPage.jsx` - fetchResponses returns mapped data; post-save uses freshData return value; select switched to explicit column list
- `src/pages/ResultsPage.jsx` - responses: select('player_id, player_name, answers')
- `src/pages/DrawResultsPage.jsx` - responses: select('player_id, player_name, answers')
- `src/pages/StudyTogetherPage.jsx` - responses: select('answers')
- `src/pages/HotTakesPage.jsx` - sessions: select('player1_name, player2_name'); hot_takes: select('player_id, statement_id, vote, defense')
- `src/pages/FinishSentencePage.jsx` - sessions: select('player1_name, player2_name'); finish_sentence: select('round, player_id, sentence_starter, sentence_finish') on both queries
- `src/pages/PersonalityPage.jsx` - sessions: select('player1_name, player2_name'); profiles: select('player_id, profile_data')
- `src/pages/LoveNoteHuntPage.jsx` - love_notes: select with grid_position and message added; responses: select('player_id, answers')
- `src/pages/MoviesPage.jsx` - sessions: select('player1_name, player2_name'); shared_items: explicit list including source column
- `src/pages/TicTacToePage.jsx` - responses: select('player_id, answers')
- `src/pages/VaultPage.jsx` - sessions: select('id, player1_name, player2_name, invite_code'); responses + deep_dive_responses: explicit column lists
- `src/pages/JournalPage.jsx` - responses + deep_dive_responses: explicit column lists
- `src/pages/QuizPacksPage.jsx` - responses: select('pack_id, player_id, answers')
- `src/pages/DeepDivePage.jsx` - deep_dive_responses: select('deck_id, question_id, player_id, answer')
- `src/pages/DeepDiveDeckPage.jsx` - deep_dive_responses: select('question_id, player_id, player_name, answer')
- `src/utils/reactions.js` - reactions: select('id, player_id, target_id, reaction') for fetch; select('id, reaction') for toggle lookup

## Decisions Made

- dataRef pattern (useRef + useEffect sync) chosen for VisionTab over refactoring handleBoardCaption as useCallback — simpler, avoids adding deps to callback chain
- fetchResponses returns the mapped data object directly, letting the post-save block use it without any architectural change to the function signature beyond adding `return mapped`
- LoveNoteHuntPage love_notes select extended to include `grid_position, message` beyond the plan spec, since the component accesses these fields in resumeGame and fetchPartnerNotes — caught during column analysis per plan instructions

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] LoveNoteHuntPage love_notes column list extended with grid_position and message**
- **Found during:** Task 2 (Replace select(*) with explicit column lists)
- **Issue:** Plan spec for LoveNoteHuntPage listed `round, player_id, notes, note_cells` but component accesses `n.grid_position` and `n.message` from these rows in `resumeGame` and `fetchPartnerNotes` — omitting them would cause runtime data access failures
- **Fix:** Added `grid_position, message` to both love_notes select calls
- **Files modified:** src/pages/LoveNoteHuntPage.jsx
- **Verification:** Build passes; no undefined access
- **Committed in:** cf16e34 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug prevention during column analysis)
**Impact on plan:** Necessary correction, no scope creep.

## Issues Encountered

None - both tasks executed cleanly. Build passed after each task.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 6 Bug Fixes complete (2/2 plans done)
- All 3 bug requirements addressed: BUG-02 (stale closure autosave), BUG-03 (stale closure post-save nav), BUG-04 (unbounded selects)
- Ready for Phase 7 or further work

---
*Phase: 06-bug-fixes*
*Completed: 2026-03-15*
