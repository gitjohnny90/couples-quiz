# Phase 12: Prompt Flow & Cork Board Reveal - Research

**Researched:** 2026-04-01
**Domain:** Per-section photo answering flow, partner completion detection, cork board reveal with signed URLs
**Confidence:** HIGH

---

## Summary

Phase 12 is the execution layer of the Daily Photo Challenge — the two pages that sit between the hub (Phase 11) and the journal (Phase 13). The prompt flow page walks one player through 3 photo captures sequentially, persisting each result to both Supabase Storage and the `responses` table as a per-player JSONB answers object. The cork board reveal page loads both partners' stored photo paths, fetches signed URLs in parallel, and renders them side by side on a cork board styled identically to `VisionTab`.

The key architectural decision is **per-player storage**: the shared `player_id: 'shared'` row tracks hub-level state (which section is in progress, which are completed). Each player's 3 photo answers live in a separate row: `player_id: 'player1'` and `player_id: 'player2'`, both under `pack_id: 'daily-photo-challenge'`. Partner completion detection (GATE-04) is determined by reading both per-player rows and checking that the current section's 3 prompts are all present in both.

The cork board reveal uses VisionTab's established visual treatment exactly: cork background (`background: '#C4956A'`, `border: '3px solid #A07A52'`), polaroid frames (`background: '#fff'`, `padding: '6px 6px 22px'`), push pins (`PIN_COLORS` array), and slight rotation per slot (`rotate: -4deg / +3deg / -6deg`). The `TornPaperCaption` component from Phase 10 renders captions below each photo in read-only mode, color-coded by player (coral for player1, blue for player2).

Signed URLs are fetched in parallel using `Promise.all` over the 6 paths (3 prompts × 2 players). The `getPhotoUrl` utility from `src/utils/photoUtils.js` already handles this. URLs expire in 1 hour (default); the reveal page is read-only so no re-upload needed.

**Primary recommendation:** Store per-player photo data (paths + captions) in separate `responses` rows per player under `pack_id: 'daily-photo-challenge'`. Write section completion to the shared row only when all 3 prompts are saved. Use `useRealtimeSync` on the shared row to detect partner completion and auto-navigate from waiting screen to reveal.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GATE-04 | Both partners must complete a section before the cork board reveals | Detect by reading both player rows for the current sectionId and verifying all 3 prompt paths are present; navigate to reveal only when both are complete |
| DISP-01 | Per-section cork board shows both partners' 3 photos side by side after completion | Reveal page renders 3 cork boards (one per prompt), each showing player1 and player2 polaroids; signed URLs fetched via `getPhotoUrl` |
| DISP-02 | Cork board uses the same visual style as the Us tab vision board | Exact VisionTab cork styles: `#C4956A` background, `3px solid #A07A52` border, white polaroid frames, `vision-board-cork` CSS class, push pins, slot rotations |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.4 | Component rendering | Already in project |
| @supabase/supabase-js | 2.101.1 | DB reads/writes and Storage signed URLs | Already in project |
| framer-motion | 12.38.0 | Page entrance animation | Already in project — used on all hub pages |
| react-router-dom | 7.13.1 | Routing with `:sessionId/:sectionId` params | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None new needed | — | — | All utilities already built in Phase 10/11 |

**Installation:** No new packages. All dependencies are already in `package.json`.

---

## Architecture Patterns

### Recommended Project Structure — new files for this phase

```
src/
└── pages/
    ├── DailyPhotoSectionPage.jsx    # Prompt flow (3 sequential prompts)
    └── DailyPhotoRevealPage.jsx     # Cork board reveal (3 boards, both players)
```

Modified files:
```
src/App.jsx    # Add 2 new lazy routes
```

Note: `src/utils/sessionUtils.js` already has both new routes registered for `isTabActive` and `getDocumentTitle` — Phase 11 Plan 02 added those entries (`/daily-photo-section`, `/daily-photo-reveal`). No changes needed there.

### Pattern 1: Per-Player Data Shape

**What:** Each player writes their own row to `responses` with `pack_id: 'daily-photo-challenge'` and `player_id: 'player1'` or `'player2'`. The `answers` JSONB holds a map of `sectionId` to an array of 3 per-prompt objects.

**Rationale:** The shared row (Phase 11) tracks hub state — which section is in progress, completion timestamps. Per-player photo data lives in per-player rows because each player's answers are independent (captured at different times) and must be readable by both players for the reveal. The existing RLS policies already allow session members to SELECT per-player rows for their session.

```javascript
// Per-player answers shape — player1's row
{
  "morning-routine": [
    { path: "session123/player1/morning-routine_0.jpg", caption: "coffee time" },
    { path: "session123/player1/morning-routine_1.jpg", caption: ""             },
    { path: "session123/player1/morning-routine_2.jpg", caption: "chaos face"   },
  ],
  "date-night": [
    { path: "session123/player1/date-night_0.jpg", caption: "fancy" },
    // ...
  ]
}
```

**Read pattern:**
```javascript
// Fetch my row
const { data: myRow } = await supabase
  .from('responses')
  .select('answers')
  .eq('session_id', sessionId)
  .eq('pack_id', 'daily-photo-challenge')
  .eq('player_id', playerId)
  .maybeSingle()

const myAnswers = myRow?.answers ?? {}
const mySectionPhotos = myAnswers[sectionId] ?? [null, null, null]
```

**Write pattern (upsert with fresh-fetch merge — critical):**
```javascript
// Always fetch fresh before writing to avoid overwriting partner's concurrent writes
// or your own other sections' data
async function savePromptAnswer(sectionId, promptIndex, path, caption) {
  const { data: fresh } = await supabase
    .from('responses')
    .select('answers')
    .eq('session_id', sessionId)
    .eq('pack_id', 'daily-photo-challenge')
    .eq('player_id', playerId)
    .maybeSingle()

  const currentAnswers = fresh?.answers ?? {}
  const currentSection = currentAnswers[sectionId] ?? [null, null, null]
  const updatedSection = [...currentSection]
  updatedSection[promptIndex] = { path, caption }

  const newAnswers = { ...currentAnswers, [sectionId]: updatedSection }

  await supabase
    .from('responses')
    .upsert({
      session_id: sessionId,
      pack_id: 'daily-photo-challenge',
      player_id: playerId,
      answers: newAnswers,
    }, { onConflict: 'session_id,pack_id,player_id' })
}
```

### Pattern 2: Section Completion Detection (GATE-04)

**What:** A section is "complete for a player" when all 3 prompt entries for that `sectionId` are non-null in their per-player row. Both partners complete = cork board reveals.

**Detecting my completion:** After saving prompt index 2, check if all 3 entries in `myAnswers[sectionId]` are non-null.

**Detecting partner completion:** On the waiting screen, poll/subscribe to the `responses` table. When the partner's row updates, re-fetch and check their section answers.

**Marking shared state complete:** When my completion is detected AND partner is already done (or when waiting and partner finishes), write to the shared row:
```javascript
// Update shared state to mark section complete and clear inProgressSectionId
const newSharedState = {
  ...currentSharedState,
  inProgressSectionId: null,
  completedSections: {
    ...currentSharedState.completedSections,
    [sectionId]: new Date().toISOString(),
  },
  lastCompletedAt: new Date().toISOString(),
}
await supabase
  .from('responses')
  .upsert({
    session_id: sessionId,
    pack_id: 'daily-photo-challenge',
    player_id: 'shared',
    answers: newSharedState,
  }, { onConflict: 'session_id,pack_id,player_id' })
```

**Important:** Only one player should trigger the shared row write. A safe approach: the first player to finish saves their answers and then polls for partner completion. When both are detected as done, either player who notices can write the shared state (the upsert is idempotent — if both write simultaneously the last write wins but both are writing the same `completedSections[sectionId]` key, so data is equivalent). The shared row write is safe to do from both players.

**Helper function (add to photoGating.js):**
```javascript
/**
 * Returns true if a player has completed all 3 prompts for a section.
 *
 * @param {object} playerAnswers - answers JSONB from per-player row
 * @param {string} sectionId
 * @returns {boolean}
 */
export function isSectionCompleteForPlayer(playerAnswers, sectionId) {
  const photos = playerAnswers?.[sectionId]
  if (!Array.isArray(photos) || photos.length < 3) return false
  return photos.every(p => p !== null && p?.path)
}
```

### Pattern 3: Prompt Flow Page (DailyPhotoSectionPage)

**What:** Single page at `/daily-photo-section/:sessionId/:sectionId` that walks one player through 3 prompts sequentially. Uses `PhotoCaptureInput` (already built in Phase 10) for each prompt.

**Screen states:**
1. `prompt-0` / `prompt-1` / `prompt-2` — show current prompt's `PhotoCaptureInput`
2. `waiting` — player has submitted all 3; partner has not yet finished
3. Navigate to `/daily-photo-reveal/:sessionId/:sectionId` — both done

**Prompt progression logic:**
```javascript
// On mount: fetch my existing answers to determine resume state
// (user may have submitted prompt 0 and returned to hub before submitting 1 & 2)
useEffect(() => {
  const fetchMyProgress = async () => {
    const { data } = await supabase
      .from('responses')
      .select('answers')
      .eq('session_id', sessionId)
      .eq('pack_id', 'daily-photo-challenge')
      .eq('player_id', playerId)
      .maybeSingle()
    const myAnswers = data?.answers ?? {}
    const sectionPhotos = myAnswers[sectionId] ?? [null, null, null]
    // Find first unanswered prompt index
    const nextIndex = sectionPhotos.findIndex(p => p === null || !p?.path)
    if (nextIndex === -1) {
      setScreen('waiting') // all 3 done — go to waiting
    } else {
      setCurrentPromptIndex(nextIndex)
      setScreen('prompting')
    }
  }
  fetchMyProgress()
}, [sessionId, sectionId, playerId])
```

**onPhotoSubmit callback for PhotoCaptureInput:**
```javascript
const handlePhotoSubmit = async (path, caption) => {
  await savePromptAnswer(sectionId, currentPromptIndex, path, caption)
  if (currentPromptIndex < 2) {
    setCurrentPromptIndex(prev => prev + 1)
  } else {
    // All 3 done — check if partner is also done
    setScreen('waiting')
    checkBothComplete()
  }
}
```

**Waiting screen polling:**

Use `useRealtimeSync` on `responses` table. On each update, fetch both players' rows and check `isSectionCompleteForPlayer` for both. When both are true, write shared completion state and navigate to reveal.

```javascript
const checkBothComplete = useCallback(async () => {
  const [myRow, partnerRow] = await Promise.all([
    supabase.from('responses').select('answers')
      .eq('session_id', sessionId).eq('pack_id', 'daily-photo-challenge')
      .eq('player_id', playerId).maybeSingle(),
    supabase.from('responses').select('answers')
      .eq('session_id', sessionId).eq('pack_id', 'daily-photo-challenge')
      .eq('player_id', partnerId).maybeSingle(),
  ])
  if (!mountedRef.current) return
  const myDone = isSectionCompleteForPlayer(myRow.data?.answers, sectionId)
  const partnerDone = isSectionCompleteForPlayer(partnerRow.data?.answers, sectionId)
  if (myDone && partnerDone) {
    await markSectionComplete()
    navigate(`/daily-photo-reveal/${sessionId}/${sectionId}`)
  }
}, [sessionId, sectionId, playerId, partnerId])

useRealtimeSync({
  table: 'responses',
  sessionId,
  onUpdate: checkBothComplete,
  channelPrefix: 'daily-photo-section',
  pollingEnabled: screen === 'waiting',
})
```

### Pattern 4: Cork Board Reveal Page (DailyPhotoRevealPage)

**What:** Page at `/daily-photo-reveal/:sessionId/:sectionId` that shows 3 cork boards. Each board has two polaroid slots (player1 left, player2 right) with torn-paper captions below.

**Data loading:** Fetch both players' per-player rows. Derive all 6 Storage paths. Fetch all 6 signed URLs in parallel using `Promise.all`. Render when all URLs are resolved.

```javascript
useEffect(() => {
  const loadPhotos = async () => {
    const [p1Row, p2Row] = await Promise.all([
      supabase.from('responses').select('answers')
        .eq('session_id', sessionId).eq('pack_id', 'daily-photo-challenge')
        .eq('player_id', 'player1').maybeSingle(),
      supabase.from('responses').select('answers')
        .eq('session_id', sessionId).eq('pack_id', 'daily-photo-challenge')
        .eq('player_id', 'player2').maybeSingle(),
    ])

    const p1Photos = p1Row.data?.answers?.[sectionId] ?? []
    const p2Photos = p2Row.data?.answers?.[sectionId] ?? []

    // Fetch all 6 signed URLs in parallel
    const urlRequests = [0, 1, 2].flatMap(i => [
      p1Photos[i]?.path ? getPhotoUrl(supabase, p1Photos[i].path) : Promise.resolve({ data: null }),
      p2Photos[i]?.path ? getPhotoUrl(supabase, p2Photos[i].path) : Promise.resolve({ data: null }),
    ])
    const results = await Promise.all(urlRequests)

    if (!mountedRef.current) return

    // Reconstruct: results[0,1] = prompt0 player1/player2, results[2,3] = prompt1, etc.
    const boards = [0, 1, 2].map(i => ({
      prompt: section.prompts[i].text,
      player1: { url: results[i * 2].data?.signedUrl ?? null,     caption: p1Photos[i]?.caption ?? '' },
      player2: { url: results[i * 2 + 1].data?.signedUrl ?? null, caption: p2Photos[i]?.caption ?? '' },
    }))
    setBoards(boards)
    setLoading(false)
  }
  loadPhotos()
}, [sessionId, sectionId])
```

**Cork board visual (exact VisionTab styles):**
```javascript
// Cork board container — identical to VisionTab
<div style={{
  position: 'relative',
  background: '#C4956A',
  backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.06) 0%, transparent 50%)',
  borderRadius: 4,
  padding: '14px 10px',
  border: '3px solid #A07A52',
  boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.15)',
  minHeight: 180,
  className: 'vision-board-cork',  // existing CSS class — hides scrollbar
}}>
  <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start', padding: '10px 6px', gap: 10 }}>
    {/* Player1 slot — rotate: -4deg */}
    {/* Player2 slot — rotate: +3deg */}
  </div>
</div>
```

**Polaroid slot (read-only, no remove button):**
```javascript
// Each slot — adapted from CorkBoardSlot (VisionTab), no file input or remove button
<div style={{
  position: 'relative',
  transform: `rotate(${rotate}deg)`,
  marginTop: marginTop,
  flex: '1 1 0',
  maxWidth: 140,
}}>
  {/* Push pin */}
  <div style={{
    width: 14, height: 14, borderRadius: '50%',
    background: `radial-gradient(circle at 40% 35%, ${pinColor}, ${pinColor}88)`,
    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
    margin: '0 auto -7px', position: 'relative', zIndex: 10,
  }} />

  {/* Polaroid frame */}
  <div style={{
    background: '#fff',
    padding: '6px 6px 22px',
    boxShadow: '2px 3px 8px rgba(0,0,0,0.18)',
    borderRadius: 1,
    position: 'relative',
  }}>
    <img src={signedUrl} alt={caption || playerName} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 1 }} />
    {/* Player name label below photo */}
    <p style={{
      fontFamily: 'Caveat, cursive',
      fontSize: '0.75rem',
      textAlign: 'center',
      color: playerColor,  // coral for player1, blue for player2
      marginTop: 4,
      position: 'absolute',
      bottom: 4,
      left: 0,
      right: 0,
    }}>
      {playerName}
    </p>
  </div>
</div>
```

**Torn-paper captions below each cork board:** Use a static (non-editable) version of `TornPaperCaption` or plain styled `<div>`. Since `TornPaperCaption` wraps an `<input>`, the reveal should use a plain div styled similarly but read-only. Both captions stack vertically below the board — player1 caption on top (coral label), player2 below (blue label).

```javascript
// Below each cork board
<div style={{ marginTop: 8 }}>
  {/* Player1 caption */}
  {board.player1.caption && (
    <div style={{
      background: '#fff',
      border: '1.5px solid var(--border-pencil)',
      padding: '6px 10px',
      fontFamily: 'Caveat, cursive',
      fontSize: '0.875rem',
      color: 'var(--text-secondary)',
      position: 'relative',
    }}>
      <span style={{ fontFamily: 'var(--font-hand)', fontSize: '0.7rem', color: '#E88D7A', fontWeight: 600 }}>
        {player1Name}:&nbsp;
      </span>
      {board.player1.caption}
      <div className="torn-edge" />
    </div>
  )}
  {/* Player2 caption — same structure, color: '#7EB8D8' */}
</div>
```

### Pattern 5: Route Registration

**What:** Two new lazy routes added to App.jsx. Both follow the existing RequireAuth + lazy pattern.

```javascript
// App.jsx — add these lazy imports alongside DailyPhotosHubPage
const DailyPhotoSectionPage = lazy(() => import('./pages/DailyPhotoSectionPage'))
const DailyPhotoRevealPage  = lazy(() => import('./pages/DailyPhotoRevealPage'))

// Inside <Routes> — add after the existing /daily-photos route
<Route path="/daily-photo-section/:sessionId/:sectionId" element={<RequireAuth><DailyPhotoSectionPage /></RequireAuth>} />
<Route path="/daily-photo-reveal/:sessionId/:sectionId"  element={<RequireAuth><DailyPhotoRevealPage  /></RequireAuth>} />
```

**Note:** `sessionUtils.js` already has these paths registered in both `isTabActive` (vault tab group) and `getDocumentTitle` — Phase 11 Plan 02 added them. Zero changes needed there.

### Pattern 6: Navigation Back to Hub

**From prompt flow page:** Back button or "back to hub" link at the top navigates to `/daily-photos/:sessionId`. The `inProgressSectionId` remains set in the shared row so the section stays "in progress" on the hub.

**From reveal page:** Primary CTA is "back to daily photos" — navigates to hub. Reveal page is also accessible from the hub directly when `getSectionStatus(sectionId, state) === 'completed'`.

### Anti-Patterns to Avoid

- **Writing all 3 captions at once at the end:** Save each prompt's path + caption immediately on `onPhotoSubmit`. Don't batch. If the user closes the app mid-flow, progress is preserved.
- **Storing photo data URL (base64) in the DB:** All photos go to Supabase Storage; only the path string goes in the `answers` JSONB. Vision board uses base64 — this is the old pattern and the reason the `daily-photos` Storage bucket was built.
- **Using `player_id: 'shared'` for per-player photo answers:** Shared row is for hub state (lock/unlock). Individual answers need separate rows per player so each player can write independently without overwriting the other.
- **Fetching signed URLs sequentially:** Use `Promise.all` for all 6 URLs — sequential fetches would be 6x slower.
- **Not handling missing photos gracefully:** On the reveal, a player may have only submitted 2 of 3 prompts if data is corrupted. Render a placeholder ("photo missing") rather than crashing on a null URL.
- **Re-fetching signed URLs on every render:** Signed URLs are valid for 1 hour. Fetch once on mount, store in state. Don't regenerate on every render cycle.
- **Allowing re-answering from the reveal page:** Reveal is read-only. The hub shows completed sections as clickable (navigate to reveal), not as re-answerable. Make this clear in the page's data flow — no `PhotoCaptureInput` on the reveal page.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Photo capture + preview + upload | Custom file input + canvas | `PhotoCaptureInput` from Phase 10 | Already handles camera/gallery triggers, preview, caption, upload via `uploadPhoto`, error states |
| Caption display below photo | New component | `TornPaperCaption` (static/read-only) or plain styled div | TornPaperCaption already has the torn-edge class wired; for reveal use plain div with same styles |
| Cork board visual | Custom CSS | Exact VisionTab styles: `#C4956A`, `border: 3px solid #A07A52`, polaroid frame, `.vision-board-cork` class, `.vision-pin` CSS | Copy exact values — don't re-derive. DISP-02 requires identical visual treatment |
| Signed URL generation | Custom Storage call | `getPhotoUrl(supabase, path, expiresIn)` from `src/utils/photoUtils.js` | Already wraps `createSignedUrl`, returns standard Supabase response shape |
| Realtime + polling | Manual subscription | `useRealtimeSync` hook | Handles cleanup, unique channel names, polling interval |
| Session + names + URL sync | Manual useParams/useContext | `useSessionSetup` hook | Returns sessionId, playerId, partnerId, playerName, partnerName, mountedRef — all needed here |
| Section completion logic | Inline boolean check | `isSectionCompleteForPlayer` (add to photoGating.js) | Centralizes the definition; reused by Section page and Reveal page |

**Key insight:** The polaroid frame + push pin is not a component in this codebase — it's inline JSX inside `CorkBoardSlot` in VisionTab. The reveal page must replicate these exact styles rather than importing from VisionTab (which is a full page, not a component library). Extract the styles from the source as constants.

---

## Common Pitfalls

### Pitfall 1: Per-Player Row RLS Rejection
**What goes wrong:** Writing `player_id: 'player1'` from a player2 session (or vice versa) fails RLS.
**Why it happens:** The `05-player-id-rls.sql` policy on `responses` INSERT/UPDATE requires `player_id` to match the authenticated user's actual role in the session.
**How to avoid:** Always use `playerId` from context/`useSessionSetup`, never hardcode `'player1'`. The `playerId` from context is the auth user's actual role.
**Warning signs:** Upsert returns no error but data never appears; or PGRST301 in browser console.

### Pitfall 2: Stale Signed URLs on Reveal Page Revisit
**What goes wrong:** User visits reveal, leaves, returns 2 hours later — signed URLs have expired. Images show as broken.
**Why it happens:** `getPhotoUrl` defaults to `expiresIn: 3600` (1 hour). Stored in component state — not refreshed on re-mount.
**How to avoid:** Fetch fresh signed URLs on every mount of the reveal page. Don't cache in localStorage or sessionStorage. 1-hour expiry is fine since the fetch happens on mount.
**Warning signs:** Broken image icons on reveal page for returning users.

### Pitfall 3: Concurrent Save Race on Per-Player Row
**What goes wrong:** User submits prompt 0, then immediately prompt 1 before the first upsert resolves. The second upsert fetches "fresh" state that still shows only null,null,null for the section — overwrites the first save.
**Why it happens:** Two upserts racing when the user submits quickly.
**How to avoid:** Disable the "Add this photo" submit button while the previous save is in progress (the `uploading` state in `PhotoCaptureInput` already does this — ensure `onPhotoSubmit` callback awaits the full save cycle before `setCurrentPromptIndex` advances).
**Warning signs:** Prompt 0's photo disappears after prompt 1 is saved.

### Pitfall 4: Back-Navigation Losing Progress
**What goes wrong:** User submits prompt 0, taps browser back, returns to hub, taps section again — starts from prompt 0 again.
**Why it happens:** Prompt flow page doesn't check existing answers on mount; always starts at index 0.
**How to avoid:** On mount, fetch my per-player row and find the first null entry in `sectionPhotos`. If all 3 are present, go to waiting/reveal directly. This is Pattern 3's mount logic.
**Warning signs:** Users report re-uploading the same photo after navigating away.

### Pitfall 5: Both Players Writing Shared Completion Simultaneously
**What goes wrong:** Both players finish their last prompt within seconds of each other. Both detect the other is done, both write the shared row with slightly different timestamps. The state is equivalent but the `lastCompletedAt` differs.
**Why it happens:** The `checkBothComplete` function writes the shared row.
**How to avoid:** This is acceptable — the JSONB write is idempotent for `completedSections[sectionId]` presence (both write the section as completed, just with different timestamps). The `lastCompletedAt` discrepancy is at most a few seconds, which doesn't affect the 6am gate. No additional locking needed.
**Warning signs:** None — this edge case is safe.

### Pitfall 6: Reveal Page Accessed Before Both Players Finish
**What goes wrong:** User navigates directly to `/daily-photo-reveal/:sessionId/:sectionId` before partner finishes. Partner's photos aren't in Storage yet.
**Why it happens:** Direct URL access or stale navigation.
**How to avoid:** On reveal page mount, check both players' row completeness. If either player's section is incomplete, redirect to the section flow page or hub. A graceful fallback (show placeholder for missing photos) is also acceptable.
**Warning signs:** Broken images or undefined path errors on reveal.

---

## Code Examples

### Storage Path Convention (from Phase 10)
```javascript
// Path format set by uploadPhoto in photoUtils.js:
// {sessionId}/{playerId}/{sectionId}_{promptIndex}.jpg
// Example:
"abc123/player1/morning-routine_0.jpg"
"abc123/player1/morning-routine_1.jpg"
"abc123/player1/morning-routine_2.jpg"
"abc123/player2/morning-routine_0.jpg"
// etc.
```

### Complete Prompt Flow Page Structure
```javascript
// src/pages/DailyPhotoSectionPage.jsx
import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useSessionSetup from '../hooks/useSessionSetup'
import useRealtimeSync from '../hooks/useRealtimeSync'
import { supabase } from '../lib/supabase'
import PhotoCaptureInput from '../components/PhotoCaptureInput'
import photoSections from '../data/photoSections'
import { isSectionCompleteForPlayer } from '../utils/photoGating'

export default function DailyPhotoSectionPage() {
  const { sectionId } = useParams()
  const { sessionId, playerId, partnerId, sessionMyName, partnerName, mountedRef } = useSessionSetup()
  const navigate = useNavigate()

  const section = photoSections.find(s => s.id === sectionId)

  const [currentPromptIndex, setCurrentPromptIndex] = useState(0)
  const [screen, setScreen] = useState('loading') // 'loading' | 'prompting' | 'waiting'

  // On mount: resume from existing answers
  useEffect(() => {
    if (!sessionId || !playerId) return
    const loadProgress = async () => {
      const { data } = await supabase
        .from('responses').select('answers')
        .eq('session_id', sessionId).eq('pack_id', 'daily-photo-challenge')
        .eq('player_id', playerId).maybeSingle()
      if (!mountedRef.current) return
      const photos = data?.answers?.[sectionId] ?? [null, null, null]
      const nextIndex = photos.findIndex(p => !p?.path)
      if (nextIndex === -1) {
        setScreen('waiting')
      } else {
        setCurrentPromptIndex(nextIndex)
        setScreen('prompting')
      }
    }
    loadProgress()
  }, [sessionId, playerId, sectionId])

  // Save one prompt answer (fetch-merge-upsert)
  const savePromptAnswer = async (path, caption) => {
    const { data: fresh } = await supabase
      .from('responses').select('answers')
      .eq('session_id', sessionId).eq('pack_id', 'daily-photo-challenge')
      .eq('player_id', playerId).maybeSingle()
    const current = fresh?.answers ?? {}
    const sectionPhotos = current[sectionId] ?? [null, null, null]
    const updated = [...sectionPhotos]
    updated[currentPromptIndex] = { path, caption }
    await supabase.from('responses').upsert({
      session_id: sessionId, pack_id: 'daily-photo-challenge',
      player_id: playerId, answers: { ...current, [sectionId]: updated },
    }, { onConflict: 'session_id,pack_id,player_id' })
  }

  const handlePhotoSubmit = async (path, caption) => {
    await savePromptAnswer(path, caption)
    if (currentPromptIndex < 2) {
      setCurrentPromptIndex(prev => prev + 1)
    } else {
      setScreen('waiting')
    }
  }

  // Check completion for both players
  const checkBothComplete = useCallback(async () => {
    if (!sessionId || screen !== 'waiting') return
    const [myRow, partnerRow] = await Promise.all([
      supabase.from('responses').select('answers').eq('session_id', sessionId)
        .eq('pack_id', 'daily-photo-challenge').eq('player_id', playerId).maybeSingle(),
      supabase.from('responses').select('answers').eq('session_id', sessionId)
        .eq('pack_id', 'daily-photo-challenge').eq('player_id', partnerId).maybeSingle(),
    ])
    if (!mountedRef.current) return
    const myDone = isSectionCompleteForPlayer(myRow.data?.answers, sectionId)
    const partnerDone = isSectionCompleteForPlayer(partnerRow.data?.answers, sectionId)
    if (myDone && partnerDone) {
      await markSectionCompleteInSharedState()
      navigate(`/daily-photo-reveal/${sessionId}/${sectionId}`)
    }
  }, [sessionId, sectionId, playerId, partnerId, screen])

  useRealtimeSync({
    table: 'responses', sessionId, onUpdate: checkBothComplete,
    channelPrefix: 'daily-photo-section',
    pollingEnabled: screen === 'waiting',
  })

  // Render: loading → prompt cards → waiting screen
}
```

### Cork Board Visual Constants (from VisionTab — exact values)
```javascript
// Pin colors — matches VisionTab PIN_COLORS
const PIN_COLORS = ['#E55', '#E8B84C', '#5B8FC7']

// Slot rotations for 3 boards — same as BOARD_SLOTS in VisionTab
const BOARD_SLOT_ROTATIONS = [-4, 3, -6]  // degrees
const BOARD_SLOT_MARGIN_TOPS = [12, 4, 14] // px

// Player colors — from CLAUDE.md
const PLAYER_COLORS = {
  player1: '#E88D7A', // coral
  player2: '#7EB8D8', // blue
}

// Cork background — exact VisionTab values
const CORK_STYLE = {
  background: '#C4956A',
  backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.06) 0%, transparent 50%)',
  borderRadius: 4,
  padding: '14px 10px',
  border: '3px solid #A07A52',
  boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.15)',
  minHeight: 180,
}

// Polaroid frame — exact VisionTab values
const POLAROID_STYLE = {
  background: '#fff',
  padding: '6px 6px 22px',
  boxShadow: '2px 3px 8px rgba(0,0,0,0.18)',
  borderRadius: 1,
  position: 'relative',
}
```

### Parallel Signed URL Fetch
```javascript
// Source: photoUtils.getPhotoUrl wraps supabase.storage.from('daily-photos').createSignedUrl
import { getPhotoUrl } from '../utils/photoUtils'

const urlPairs = await Promise.all(
  [0, 1, 2].map(async (i) => {
    const [r1, r2] = await Promise.all([
      p1Photos[i]?.path ? getPhotoUrl(supabase, p1Photos[i].path) : Promise.resolve({ data: null }),
      p2Photos[i]?.path ? getPhotoUrl(supabase, p2Photos[i].path) : Promise.resolve({ data: null }),
    ])
    return {
      player1Url: r1.data?.signedUrl ?? null,
      player2Url: r2.data?.signedUrl ?? null,
    }
  })
)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Base64 images in JSONB (VisionTab) | Storage bucket + path in JSONB | Phase 10 | Scalable, no 1MB DB row limits, proper CDN delivery |
| Manual realtime + polling | `useRealtimeSync` hook | v1.1 | Consistent cleanup, polling interval control, no duplicate channels |
| Global state reads (`select('*')`) | Explicit column selection | v1.1 | Avoids reading all JSONB on fetches |

**Deprecated/outdated:**
- Base64 vision board pattern: do NOT copy the `compressAndUpload → dataUrl → DB` pattern from VisionTab. For this phase, always use `uploadPhoto → Storage path → DB`.

---

## Open Questions

1. **Progress bar or step indicator during prompt flow**
   - What we know: Success criteria say "sequentially" — no UX detail specified for the step indicator.
   - What's unclear: Should there be a "1 of 3" counter or visual progress strip?
   - Recommendation: Show a simple "prompt 1 of 3", "prompt 2 of 3" text label above `PhotoCaptureInput`. Low cost, high clarity. Planner can make this a single-line addition.

2. **Waiting screen copy**
   - What we know: "User sees a waiting screen if their partner has not yet finished that section" (success criteria).
   - What's unclear: Does the waiting screen show the user's own submitted photos as a preview?
   - Recommendation: Show a simple "waiting for [partnerName]..." message without previewing own photos. Previewing would require fetching own signed URLs which adds complexity. Keep it simple — the reveal is the payoff moment.

3. **What if a player navigates away mid-section and partner completes?**
   - What we know: `inProgressSectionId` stays set in shared row while either player hasn't finished.
   - What's unclear: If player1 finishes and navigates away, then player2 finishes, does the reveal open automatically?
   - Recommendation: Reveal auto-navigation only happens on the prompt flow page (waiting screen). If player1 navigated away, they see the section as "in progress" on the hub (since shared state still has `inProgressSectionId` set — Phase 11's `getSectionStatus` returns 'in-progress'). Tapping it re-enters the section flow page, which detects all 3 prompts are saved, immediately enters `waiting` state, runs `checkBothComplete`, detects partner is done, marks complete, navigates to reveal. This works without any special-casing.

4. **Prompt text display on cork boards**
   - What we know: DISP-01 says "both partners' photos side by side" but doesn't specify showing the prompt text on the cork board.
   - Recommendation: Show the prompt text as a small header above each cork board (e.g., "Prompt: What are you up to?"). This gives context when reviewing. Planner should decide layout.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest (already installed from Phase 11) |
| Config file | none — vitest reads from `package.json` `"test": "vitest run"` |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GATE-04 | `isSectionCompleteForPlayer` returns false when any prompt is null | unit | `npm test -- photoGating` | ❌ Wave 0 |
| GATE-04 | `isSectionCompleteForPlayer` returns true when all 3 prompts have paths | unit | `npm test -- photoGating` | ❌ Wave 0 |
| GATE-04 | `isSectionCompleteForPlayer` returns false for empty answers object | unit | `npm test -- photoGating` | ❌ Wave 0 |
| DISP-01 | Reveal page fetches both players' rows (integration smoke) | manual | n/a — render test | manual only |
| DISP-02 | Cork board uses correct hex values (#C4956A background) | manual | n/a — visual | manual only |

**Note on DISP-01 and DISP-02:** These are visual/integration requirements. The unit tests cover the data-layer logic (`isSectionCompleteForPlayer`). The visual correctness is verified by Playwright or manual QA.

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/utils/photoGating.test.js` — add `isSectionCompleteForPlayer` test cases (file may exist from Phase 11; add new describe block)

---

## Sources

### Primary (HIGH confidence)
- Direct codebase reading:
  - `src/pages/VisionTab.jsx` — CorkBoardSlot component (lines 850–976), BOARD_SLOTS, PIN_COLORS, CORK_STYLE values
  - `src/components/PhotoCaptureInput.jsx` — full component interface, props contract
  - `src/components/TornPaperCaption.jsx` — component interface, torn-edge class
  - `src/utils/photoUtils.js` — `uploadPhoto`, `getPhotoUrl`, path convention
  - `src/utils/photoGating.js` — existing pure functions, state shape
  - `src/pages/DailyPhotosHubPage.jsx` — shared row state shape, upsert pattern
  - `src/hooks/useRealtimeSync.js` — hook interface
  - `src/hooks/useSessionSetup.js` — hook interface, returns partnerId
  - `src/App.jsx` — existing lazy route pattern
  - `src/utils/sessionUtils.js` — confirmed `/daily-photo-section` and `/daily-photo-reveal` already registered
  - `.planning/phases/10-storage-photo-capture/10-01-SUMMARY.md` — storage path format, RLS policy details
  - `.planning/phases/11-content-section-hub-time-gating/11-RESEARCH.md` — state shape, pattern inventory
  - `src/index.css` — `.vision-board-cork`, `.torn-edge`, `.vision-pin`, `.vision-pin--disabled` classes confirmed

### Secondary (MEDIUM confidence)
- Concurrent upsert safety: derived from CLAUDE.md documentation of `handleSaveReflection` fresh-fetch-before-write pattern (StudyTogetherPage)
- RLS player_id matching: derived from CLAUDE.md documentation of `05-player-id-rls.sql`

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages already in project, verified from package.json and package-lock.json
- Architecture (data shape): HIGH — directly derived from existing patterns in codebase; VisionTab, responses table, photoUtils all fully read
- Cork board styles: HIGH — exact values read from VisionTab.jsx and index.css source
- Per-player JSONB shape: HIGH — follows same pattern as other per-player tables (responses with explicit player_id)
- Completion detection (GATE-04): HIGH — clear boolean check on 3-element array completeness
- Concurrent write safety: MEDIUM — fresh-fetch pattern is established but not tested at high concurrency
- Signed URL expiry handling: MEDIUM — 1h default is correct behavior; expiry-on-revisit edge case is common but not destructive

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (stable stack)
