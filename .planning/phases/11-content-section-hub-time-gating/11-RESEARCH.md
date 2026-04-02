# Phase 11: Content, Section Hub & Time-Gating - Research

**Researched:** 2026-04-01
**Domain:** Static content data, Supabase state tracking, time-gating logic, React routing and nav extension
**Confidence:** HIGH

---

## Summary

Phase 11 introduces the Daily Photo Challenge hub and its 15 themed sections. This is primarily a data-modeling and routing problem — the interesting technical work is: (1) designing the static sections data file to follow existing patterns, (2) deciding where completion/lock state is persisted, and (3) implementing time-gating logic that is timezone-aware and correct across midnight.

The static content (15 sections, 3 prompts each) belongs in `src/data/photoSections.js`, following the exact shape of `deepDiveDecks.js` — named export, array of objects with `id`, `title`, `emoji`, and `prompts[]`. Section IDs become the `sectionId` path segment used by Phase 10's `uploadPhoto` utility, so slugs must be stable and URL-safe.

For state tracking, the `responses` table is the right home — it is already used for tic-tac-toe and heartline game state with a dedicated `pack_id` and `player_id: 'shared'`. A single row per session with `pack_id: 'daily-photo-challenge'` and `player_id: 'shared'` stores a JSONB object mapping section IDs to completion timestamps, which is sufficient for all of GATE-01 through GATE-03. No new table is needed.

The hub page lives at `/daily-photos/:sessionId` and navigates into it from a new VaultPage card. The route belongs to the quizzes tab group — `isTabActive` and `getDocumentTitle` in `sessionUtils.js` need one-line additions each.

**Primary recommendation:** Store section state as JSONB in the `responses` table (shared row), derive all lock/unlock logic client-side from stored timestamps, and keep the 6am boundary calculation in a pure utility function that is independently testable.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CONT-01 | 15 themed sections with 3 photo prompts each | Static data file `src/data/photoSections.js` — 15 section objects, each with a `prompts` array of length 3 |
| CONT-02 | First prompt in every section is "What are you up to?" | Hard rule enforced in data — `prompts[0].text` is always the same string across all 15 sections |
| CONT-03 | Last prompt is a funny/unhinged question matching the theme | Hard rule enforced in data — `prompts[2]` is theme-specific humor; see section catalog below |
| CONT-04 | Themes cover a variety of subjects | 15 sections span food, travel, date night, morning/evening, nostalgia, nature, seasons, etc. |
| GATE-01 | Completing a section freezes all sections until 6am next day | `completedAt` timestamp stored; `isGloballyFrozen(state)` pure function checks if now < next6am(completedAt) |
| GATE-02 | After 6am unlock, all remaining sections are available | Same function returns false after 6am; hub renders all incomplete sections as selectable |
| GATE-03 | Once a user picks a section, all others lock until it is finished | `inProgressSectionId` stored in JSONB state; hub disables all other cards while truthy |
| DISP-03 | Hub page shows all 15 sections with completion status and lock state | `DailyPhotosHubPage` renders 15 cards with visual state badges derived from `state` |
| NAV-01 | Daily Photo Challenge accessible from quizzes tab in bottom nav | New card in `VaultPage`, new route `/daily-photos/:sessionId` registered under quizzes tab group in `isTabActive` |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.4 | Component rendering | Already in project |
| @supabase/supabase-js | 2.101.1 | DB reads/writes for state | Already in project |
| framer-motion | 12.38.0 | Card entrance animations | Already in project — used in VaultPage, all hub pages |
| react-router-dom | 7.13.1 | Routing | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | 4.0.18 | Unit tests for pure logic | Time-gating boundary functions must be unit tested |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| responses table (shared row) | New `daily_photo_state` table | New table requires migration + RLS policy; responses already has session-scoped INSERT/UPDATE/SELECT RLS working. Single shared row is simpler for a hub-level state object |
| Client-side 6am logic | Server-side function / DB trigger | Server-side adds deployment complexity. 6am logic is simple pure function; client-side is fine since it only gates navigation, not data access |
| localStorage for in-progress state | Supabase only | localStorage wouldn't sync to partner's device; Supabase is required for any state visible to both players |

**Installation:** No new packages needed. All dependencies are already in `package.json`.

---

## Architecture Patterns

### Recommended Project Structure — new files for this phase

```
src/
├── data/
│   └── photoSections.js      # 15 sections — id, title, emoji, color, prompts[]
├── pages/
│   └── DailyPhotosHubPage.jsx # Hub listing all 15 sections with lock state
└── utils/
    └── photoGating.js        # Pure time-gating functions (independently testable)
```

Modified files:
```
src/App.jsx                   # Add route + lazy import
src/pages/VaultPage.jsx       # Add entry card
src/utils/sessionUtils.js     # Add /daily-photos to isTabActive + getDocumentTitle
```

### Pattern 1: Static Data File — photoSections.js

**What:** Named export array of section objects following the deepDiveDecks.js shape.
**When to use:** All static content in this codebase lives in `src/data/` — never in the database.

```javascript
// src/data/photoSections.js
// Source: deepDiveDecks.js pattern

const photoSections = [
  {
    id: 'morning-routine',     // URL-safe slug, used as sectionId in Storage paths
    title: 'Morning Routine',
    emoji: '☀️',
    color: '#E88D7A',           // accent-coral for first section; vary per section
    prompts: [
      { index: 0, text: 'What are you up to?' },
      { index: 1, text: 'Show us your morning drink of choice' },
      { index: 2, text: 'What does your morning face actually look like right now? No edits.' },
    ],
  },
  // ... 14 more
]

export default photoSections
```

**Critical constraint:** `id` must be stable and match the `sectionId` used in Phase 10's Storage path `{sessionId}/{playerId}/{sectionId}_{promptIndex}.jpg`. Never rename IDs after launch.

### Pattern 2: State Persistence — responses table shared row

**What:** One row per session with `pack_id: 'daily-photo-challenge'` and `player_id: 'shared'`. The `answers` JSONB column holds all hub state.
**When to use:** When state must be visible to both partners and no per-question granularity is needed at the DB level.

```javascript
// Shape of answers JSONB
{
  completedSections: {
    'morning-routine': '2026-04-01T14:32:00.000Z',  // ISO timestamp of completion
    'date-night': '2026-03-31T19:15:00.000Z',
  },
  inProgressSectionId: null,   // or 'morning-routine' while a section is active
  lastCompletedAt: '2026-04-01T14:32:00.000Z',  // most recent completion (for GATE-01 check)
}
```

**Read pattern:**
```javascript
// Source: responses table pattern from VaultPage.jsx / TicTacToePage
const { data } = await supabase
  .from('responses')
  .select('answers')
  .eq('session_id', sessionId)
  .eq('pack_id', 'daily-photo-challenge')
  .eq('player_id', 'shared')
  .maybeSingle()

const state = data?.answers ?? { completedSections: {}, inProgressSectionId: null, lastCompletedAt: null }
```

**Write pattern (upsert to avoid insert/update branches):**
```javascript
await supabase
  .from('responses')
  .upsert({
    session_id: sessionId,
    pack_id: 'daily-photo-challenge',
    player_id: 'shared',
    answers: newState,
  }, { onConflict: 'session_id,pack_id,player_id' })
```

### Pattern 3: Time-Gating Logic — photoGating.js

**What:** Pure functions that derive lock state from stored timestamps and the current time. No side effects — fully unit-testable.
**When to use:** All GATE-01 / GATE-02 decisions flow through these functions.

```javascript
// src/utils/photoGating.js

/**
 * Returns the Date representing 6:00:00 AM on the calendar day
 * AFTER the given timestamp, in local time.
 *
 * @param {string|Date} completedAt - ISO timestamp or Date of section completion
 * @returns {Date}
 */
export function next6amAfter(completedAt) {
  const d = new Date(completedAt)
  const next = new Date(d)
  next.setDate(next.getDate() + 1)
  next.setHours(6, 0, 0, 0)
  return next
}

/**
 * Returns true if the global freeze is still active
 * (i.e. a section was completed and it's not yet 6am the next day).
 *
 * @param {object} state - The answers JSONB from the DB
 * @param {Date} [now] - Injectable "now" for testing (default: new Date())
 * @returns {boolean}
 */
export function isGloballyFrozen(state, now = new Date()) {
  if (!state?.lastCompletedAt) return false
  return now < next6amAfter(state.lastCompletedAt)
}

/**
 * Returns the ISO string of when the global freeze lifts, or null if not frozen.
 *
 * @param {object} state
 * @param {Date} [now]
 * @returns {string|null}
 */
export function frozenUntil(state, now = new Date()) {
  if (!isGloballyFrozen(state, now)) return null
  return next6amAfter(state.lastCompletedAt).toISOString()
}

/**
 * Returns the lock/availability status for a single section.
 *
 * @param {string} sectionId
 * @param {object} state - The answers JSONB
 * @param {Date} [now]
 * @returns {'completed'|'in-progress'|'available'|'locked-in-progress'|'locked-frozen'}
 */
export function getSectionStatus(sectionId, state, now = new Date()) {
  const completed = state?.completedSections ?? {}
  const inProgress = state?.inProgressSectionId ?? null

  if (completed[sectionId]) return 'completed'
  if (inProgress === sectionId) return 'in-progress'
  if (isGloballyFrozen(state, now)) return 'locked-frozen'
  if (inProgress && inProgress !== sectionId) return 'locked-in-progress'
  return 'available'
}
```

**Injectable `now` parameter is the key design decision** — it makes all boundary conditions unit-testable without mocking `Date`. This pattern is used in the test files already present in this codebase (see `sessionUtils.test.js`).

### Pattern 4: Hub Page Structure

**What:** `DailyPhotosHubPage` follows the VaultPage/DeepDivePage structure — `useSessionSetup` for identity, `useRealtimeSync` for live state updates between partners.
**When to use:** Any page that reads shared Supabase state between partners.

```javascript
// src/pages/DailyPhotosHubPage.jsx — structural sketch

import useSessionSetup from '../hooks/useSessionSetup'
import useRealtimeSync from '../hooks/useRealtimeSync'
import photoSections from '../data/photoSections'
import { getSectionStatus, isGloballyFrozen, frozenUntil } from '../utils/photoGating'

export default function DailyPhotosHubPage() {
  const { sessionId, playerId, mountedRef } = useSessionSetup()
  const [state, setState] = useState({ completedSections: {}, inProgressSectionId: null, lastCompletedAt: null })

  const fetchState = useCallback(async () => {
    const { data } = await supabase
      .from('responses')
      .select('answers')
      .eq('session_id', sessionId)
      .eq('pack_id', 'daily-photo-challenge')
      .eq('player_id', 'shared')
      .maybeSingle()
    if (!mountedRef.current) return
    setState(data?.answers ?? { completedSections: {}, inProgressSectionId: null, lastCompletedAt: null })
  }, [sessionId])

  useRealtimeSync({
    table: 'responses',
    sessionId,
    onUpdate: fetchState,
    channelPrefix: 'daily-photos-hub',
  })

  // Render 15 section cards with status derived from getSectionStatus()
}
```

### Pattern 5: VaultPage Entry Card

**What:** New card added to the VaultPage `flex column` using the exact same glass card pattern as existing cards (motion.div, role="button", tabIndex, onKeyDown).

```javascript
// New card — follows the existing VaultPage card pattern
<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.6 }}
  className="glass"
  role="button"
  tabIndex={0}
  aria-label="Daily Photo Challenge — daily themed prompts you both capture with photos"
  style={{ padding: 18, cursor: 'pointer', transform: 'rotate(0.2deg)' }}
  onClick={() => navigate(`/daily-photos/${sessionId}`)}
  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/daily-photos/${sessionId}`) } }}
>
  {/* icon + title + description + completion count */}
</motion.div>
```

The completion count badge displays `X/15 done` once any section is complete.

### Pattern 6: Route Registration

**What:** Lazy import + route in App.jsx, plus two additions in sessionUtils.js.

```javascript
// App.jsx
const DailyPhotosHubPage = lazy(() => import('./pages/DailyPhotosHubPage'))

// Inside <Routes>
<Route path="/daily-photos/:sessionId" element={<RequireAuth><DailyPhotosHubPage /></RequireAuth>} />
```

```javascript
// sessionUtils.js — isTabActive, vault group
if (base === '/vault') {
  return pathname.startsWith('/vault') ||
    pathname.startsWith('/quiz') ||
    // ... existing entries ...
    pathname.startsWith('/daily-photos')   // ADD THIS LINE
}

// sessionUtils.js — getDocumentTitle
if (pathname.startsWith('/daily-photos')) return 'Daily Photo Challenge — The Us Quiz'
```

### Anti-Patterns to Avoid

- **Using `new Date().getTimezoneOffset()` for the 6am boundary without testing:** The boundary must be in local time (what the user's clock shows), not UTC. `new Date()` in JS gives local time context — `setHours(6, 0, 0, 0)` on a local Date object is correct. Don't convert to UTC before the comparison.
- **Storing state in localStorage only:** Hub state (completed sections, in-progress) must be in Supabase so both partners see the same lock state. The partner who didn't start the section needs to know it's locked.
- **`player_id: 'player1'` for hub state:** Use `player_id: 'shared'` (same as tic-tac-toe, heartline, study-together) because this is shared couple state, not per-player state. The existing RLS policies already allow both players to write to `player_id: 'shared'` rows.
- **`select('*')` on responses:** Follow CLAUDE.md rule — always specify explicit columns. Use `.select('answers')`.
- **Race condition on concurrent upsert:** Two partners rapidly completing actions simultaneously could corrupt the shared JSONB. Use a fresh DB fetch before writing state updates — the same `handleSaveReflection` pattern from `StudyTogetherPage.jsx`: fetch fresh data, merge changes, then upsert.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Realtime + polling for hub state | Custom subscription code | `useRealtimeSync` hook | Already battle-tested, handles cleanup, unique channel names |
| Session/player name resolution | Direct context reads | `useSessionSetup` hook | Handles URL sync, mountedRef, name fetching — all in one |
| Section completion badge logic | Custom status string derivation | `getSectionStatus()` from photoGating.js | Centralizes all GATE logic so hub and future Phase 12 flow page share the same truth |
| Photo upload | New upload code | `uploadPhoto` from `src/utils/photoUtils.js` (Phase 10) | Already written, tested, compressed, upsert-safe |

**Key insight:** The state machine for lock/freeze is deceptively tricky around midnight boundaries and edge cases (user completes section at 5:59am — unlocks 1 minute later). Isolating it in `photoGating.js` with injectable `now` makes it safe to test exhaustively.

---

## Common Pitfalls

### Pitfall 1: 6am Boundary in Wrong Timezone
**What goes wrong:** Using UTC dates for the 6am unlock. A user who completes a section at 11pm UTC (but 7pm local) would see unlocked sections the next morning because UTC 6am already passed.
**Why it happens:** JS `new Date()` is UTC internally but `setHours()` operates in local time — confusion arises when developers mix the two.
**How to avoid:** Always compute next6am using `.setHours(6, 0, 0, 0)` on a local Date. Never convert to UTC before the comparison.
**Warning signs:** Unit tests pass but real-device behavior differs for users in non-UTC timezones.

### Pitfall 2: Stale State on Concurrent Write
**What goes wrong:** Both partners are using the app at the same time. Partner 1 marks section as started; Partner 2 simultaneously writes a different state — last write wins and one change is lost.
**Why it happens:** Upsert replaces the entire JSONB `answers` column without reading first.
**How to avoid:** Always fetch fresh state from DB before writing any update (identical to StudyTogetherPage `handleSaveReflection` pattern). Fetch → merge → upsert.
**Warning signs:** Completed sections disappearing from the hub after a partner interaction.

### Pitfall 3: Section IDs Changing After Launch
**What goes wrong:** A section ID in `photoSections.js` is renamed. Existing Storage objects at `{sessionId}/{playerId}/{oldId}_{n}.jpg` become unreachable. Completed entries in the JSONB `completedSections` map no longer match any section in the array.
**Why it happens:** IDs look like casual strings during development.
**How to avoid:** Treat `id` values in `photoSections.js` as permanent keys from the moment they're merged. Add a comment in the file explicitly warning against renaming.
**Warning signs:** Photos not loading for completed sections; completed count mismatch.

### Pitfall 4: responses Table RLS Rejecting 'shared' player_id
**What goes wrong:** Upsert to `responses` with `player_id: 'shared'` fails silently or throws RLS error.
**Why it happens:** Developer assumes only 'player1'/'player2' are valid.
**How to avoid:** Per CLAUDE.md, the existing `05-player-id-rls.sql` migration explicitly allows `player_id IN ('game', 'shared')` for both partners on INSERT/UPDATE. Verify the deployed policy covers 'shared' before testing — the existing game rows (tic-tac-toe, heartline, study-together) all write `player_id: 'shared'` successfully.
**Warning signs:** `PGRST301` or silent no-op on upsert for the hub state row.

### Pitfall 5: Delay animation indices colliding with existing VaultPage cards
**What goes wrong:** New Daily Photo card uses `transition={{ delay: 0.6 }}` but a future card is added and delays accumulate — all cards feel slow.
**Why it happens:** Hardcoded delay values in VaultPage.
**How to avoid:** Use the next sequential delay (current cards go 0.1→0.5, new card uses 0.6). Note for Phase 12/13: if more vault cards are added, they should continue incrementing.

---

## Content: 15 Themed Sections

All 15 sections follow CONT-01 through CONT-03. Each section's `prompts[0].text` is **always** `'What are you up to?'`. Each `prompts[2]` is unhinged/funny and theme-matched.

| # | id | title | emoji | Mid Prompt (index 1) | Unhinged Final (index 2) |
|---|-----|-------|-------|----------------------|--------------------------|
| 1 | `morning-routine` | Morning Routine | ☀️ | Show us your morning drink situation | What does your actual morning face look like right now? No filters. |
| 2 | `date-night` | Date Night | 🕯️ | Show us where you're going or what you're wearing | Rate your partner's outfit out of 10 and explain in public |
| 3 | `food-mood` | Food Mood | 🍕 | What's the most beautiful thing you've eaten recently? | Show us your fridge right now and defend what's in it |
| 4 | `on-the-move` | On the Move | 🚗 | Where are you headed or where did you just come from? | Show us your current transportation situation (yes, including the inside of your car) |
| 5 | `cozy-night-in` | Cozy Night In | 🛋️ | What's your current cozy setup? | Show us your snack situation and be honest about the portion size |
| 6 | `nature-fix` | Nature Fix | 🌿 | What piece of nature are you near right now? | Find the weirdest plant, bug, or rock nearby and give it a name |
| 7 | `weekend-energy` | Weekend Energy | 🎉 | Show us what your weekend actually looks like (be honest) | At what point did the weekend derail from your plans? Document it. |
| 8 | `throwback` | Throwback | 📼 | Find something nearby that gives you nostalgia | Show us the most embarrassing thing from your past you still have |
| 9 | `work-mode` | Work Mode | 💻 | Show us your current workspace setup | Show us the most chaotic corner of your work situation |
| 10 | `golden-hour` | Golden Hour | 🌅 | Show us the light around you right now | Take the most dramatic sunset (or ceiling light) photo you possibly can |
| 11 | `grocery-run` | Grocery Run | 🛒 | What did you just buy or what do you need to buy? | Show us the most questionable food decision you made at the store |
| 12 | `pet-and-plant` | Pets & Plants | 🌱 | Introduce us to your pet or plant (or wish you had one) | Recreate your pet's resting face — or your own if you have no pet |
| 13 | `adventure-day` | Adventure Day | 🗺️ | Where did the day take you? | Show us the moment the adventure went slightly wrong |
| 14 | `rainy-day` | Rainy Day | 🌧️ | What are you doing to survive the indoor day? | Show us your current blanket situation and defend your nest |
| 15 | `local-love` | Local Love | 📍 | Show us something cool about where you live | Find the most "this is definitely our town" thing and photograph it |

---

## Code Examples

### Time-Gating Unit Test Pattern
```javascript
// src/utils/photoGating.test.js
import { describe, it, expect } from 'vitest'
import { isGloballyFrozen, next6amAfter, getSectionStatus } from './photoGating'

describe('isGloballyFrozen', () => {
  it('returns false if no section has been completed', () => {
    const state = { completedSections: {}, inProgressSectionId: null, lastCompletedAt: null }
    expect(isGloballyFrozen(state)).toBe(false)
  })

  it('returns true if completed today before 6am tomorrow', () => {
    const completedAt = new Date()
    completedAt.setHours(14, 0, 0, 0)   // completed at 2pm
    const nowBeforeCutoff = new Date(completedAt)
    nowBeforeCutoff.setHours(23, 0, 0, 0)  // now is 11pm same day
    const state = { lastCompletedAt: completedAt.toISOString() }
    expect(isGloballyFrozen(state, nowBeforeCutoff)).toBe(true)
  })

  it('returns false after 6am the next day', () => {
    const completedAt = new Date()
    completedAt.setHours(14, 0, 0, 0)
    const nowAfterCutoff = new Date(completedAt)
    nowAfterCutoff.setDate(nowAfterCutoff.getDate() + 1)
    nowAfterCutoff.setHours(7, 0, 0, 0)   // 7am next day
    const state = { lastCompletedAt: completedAt.toISOString() }
    expect(isGloballyFrozen(state, nowAfterCutoff)).toBe(false)
  })
})
```

### Section Status Card Visual States
```javascript
// In DailyPhotosHubPage — mapping status to visual treatment
const STATUS_CONFIG = {
  'completed':            { label: 'done',        labelColor: 'var(--accent-sage)',     clickable: false },
  'in-progress':          { label: 'in progress', labelColor: 'var(--accent-mustard)',  clickable: true  },
  'available':            { label: 'pick this',   labelColor: 'var(--accent-coral)',    clickable: true  },
  'locked-frozen':        { label: 'unlocks 6am', labelColor: 'var(--text-light)',      clickable: false },
  'locked-in-progress':   { label: 'locked',      labelColor: 'var(--text-light)',      clickable: false },
}
```

### Upsert with Fresh-Fetch Pattern
```javascript
// In DailyPhotosHubPage — GATE-03: lock other sections when one is picked
async function handlePickSection(sectionId) {
  // 1. Fetch fresh state first to avoid race conditions
  const { data: fresh } = await supabase
    .from('responses')
    .select('answers')
    .eq('session_id', sessionId)
    .eq('pack_id', 'daily-photo-challenge')
    .eq('player_id', 'shared')
    .maybeSingle()

  const currentState = fresh?.answers ?? { completedSections: {}, inProgressSectionId: null, lastCompletedAt: null }

  // 2. Guard: don't overwrite if already in progress
  if (currentState.inProgressSectionId) return

  const newState = { ...currentState, inProgressSectionId: sectionId }

  // 3. Upsert merged state
  await supabase
    .from('responses')
    .upsert({
      session_id: sessionId,
      pack_id: 'daily-photo-challenge',
      player_id: 'shared',
      answers: newState,
    }, { onConflict: 'session_id,pack_id,player_id' })
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate DB table per feature | Reuse `responses` table with pack_id namespace | v1.0 | Faster feature shipping, no new RLS migrations |
| Manual realtime subscription per page | `useRealtimeSync` hook | v1.1 | Consistent cleanup, polling fallback, no duplicate channels |
| Global state reads | Explicit column selection | v1.1 | Avoids reading large JSONB base64 on every fetch |

---

## Open Questions

1. **Phase 12 API contract for `inProgressSectionId`**
   - What we know: Phase 12 (Prompt Flow) will navigate into a section and needs to know which section is active and mark it complete.
   - What's unclear: Does Phase 12 write `lastCompletedAt` + clear `inProgressSectionId`, or does Phase 11 hub handle that on return?
   - Recommendation: Phase 12 writes completion (it knows when all 3 prompts are submitted). Phase 11's hub reads this on mount and re-renders. Design the state shape and write functions in `photoGating.js` now so Phase 12 can import them. Document the expected upsert payload in Phase 11 plan so the planner can note the interface.

2. **Section ordering / randomization**
   - What we know: Requirements don't specify whether sections should appear in a fixed order or randomized.
   - What's unclear: Is the same section always first (morning-routine)? Or is order random per couple?
   - Recommendation: Fixed order matching the data array. Randomization adds complexity without clear benefit and makes the Journal (Phase 13) harder to organize.

3. **What happens after all 15 sections are completed?**
   - What we know: GATE-01/02/03 govern the in-progress state, but there's no requirement for a post-completion state.
   - What's unclear: Does the hub show an "all done" empty state? Can sections be redone?
   - Recommendation: Show all 15 as 'completed' with a congratulatory message. Redoing is out of scope per REQUIREMENTS.md. Phase 11 plan should acknowledge this edge case and choose a simple static message.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.0.18 |
| Config file | none — vitest reads from `package.json` `"test": "vitest run"` |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GATE-01 | `isGloballyFrozen` returns true after completion before 6am | unit | `npm test -- photoGating` | ❌ Wave 0 |
| GATE-01 | `isGloballyFrozen` returns false before any completion | unit | `npm test -- photoGating` | ❌ Wave 0 |
| GATE-02 | `isGloballyFrozen` returns false after 6am next day | unit | `npm test -- photoGating` | ❌ Wave 0 |
| GATE-03 | `getSectionStatus` returns 'locked-in-progress' for non-active sections | unit | `npm test -- photoGating` | ❌ Wave 0 |
| CONT-01 | `photoSections` exports exactly 15 items | unit | `npm test -- photoSections` | ❌ Wave 0 |
| CONT-01 | Each section has exactly 3 prompts | unit | `npm test -- photoSections` | ❌ Wave 0 |
| CONT-02 | First prompt of every section is 'What are you up to?' | unit | `npm test -- photoSections` | ❌ Wave 0 |
| NAV-01 | `isTabActive` returns true for `/daily-photos/...` under vault tab | unit | `npm test -- sessionUtils` | ❌ Wave 0 (extend existing file) |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/utils/photoGating.test.js` — covers GATE-01, GATE-02, GATE-03 boundary logic
- [ ] `src/data/photoSections.test.js` — covers CONT-01, CONT-02, CONT-03 data integrity
- [ ] `src/utils/sessionUtils.test.js` — extend existing file with `/daily-photos` isTabActive tests (file exists, add cases)

---

## Sources

### Primary (HIGH confidence)
- Direct codebase reading — `src/App.jsx`, `src/pages/VaultPage.jsx`, `src/utils/sessionUtils.js`, `src/hooks/useRealtimeSync.js`, `src/hooks/useSessionSetup.js`, `src/data/deepDiveDecks.js`, `src/data/hotTakesStatements.js`, `supabase/migrations/10-photo-storage-bucket.sql`, `src/utils/photoUtils.js`, `src/components/PhotoCaptureInput.jsx`
- CLAUDE.md — RLS policy documentation for `player_id: 'shared'` allowance
- `package.json` — verified dependency versions against npm registry

### Secondary (MEDIUM confidence)
- Codebase pattern analysis — StudyTogetherPage `handleSaveReflection` fresh-fetch-before-write pattern inferred as the correct approach for concurrent upserts

### Tertiary (LOW confidence)
- 6am boundary timezone behavior — documented based on JS `Date` spec (setHours operates on local time); recommend unit test coverage to validate in actual runtime environment

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages already in project, versions verified from package.json
- Architecture: HIGH — directly derived from existing patterns in codebase; no new libraries or approaches
- Content (15 sections): HIGH — hand-crafted to spec requirements; can be adjusted by planner
- Time-gating logic: HIGH — pure function pattern with injectable clock is standard; JS Date timezone behavior is MEDIUM and must be covered by unit tests
- Pitfalls: HIGH — derived from direct codebase reading and known JS/Supabase patterns

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (stable stack; only risk is Supabase API changes)
