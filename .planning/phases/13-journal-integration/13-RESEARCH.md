# Phase 13: Journal Integration - Research

**Researched:** 2026-04-04
**Domain:** React page integration — adding a 5th tab to the existing JournalPage that surfaces completed Daily Photo Challenge sections
**Confidence:** HIGH

## Summary

Phase 13 is a pure integration phase. Every piece of infrastructure required already exists from Phases 10–12:

- The data shape for completed sections is locked (`pack_id='daily-photo-section'`, one row per player with `answers.photos[]` and `answers.completedAt`).
- The hub-level "which sections are complete" state is already written by the prompt flow page to `pack_id='daily-photo-challenge'`, `player_id='shared'`, `answers.completedSections` — keyed by `sectionId` with ISO timestamps.
- A read-only reveal page already exists at `/daily-photo-reveal/:sessionId/:sectionId` that handles signed URL fetching, loading, error, and partial-completion states. Phase 13 does NOT need to build a viewer — it just needs to navigate to the existing route.
- `JournalPage.jsx` has an established 4-tab pattern (quizzes, deep dive, drawings, books) with a well-factored button row, AnimatePresence tab body, and per-tab fetch/transform helpers. Phase 13 adds a 5th tab that mirrors the "books" tab's structural simplicity (list of cards → tap to open detail).

**Primary recommendation:** Add a `'photos'` tab to the existing tab switcher in `JournalPage.jsx`, fetch the `daily-photo-challenge` shared row once in the existing `fetchAll` `useEffect`, filter `photoSections` by `completedSections` keys, render one card per completed section (emoji + title + completion date), and make each card navigate to `/daily-photo-reveal/:sessionId/:sectionId`. No new component, no new route, no new data shape.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| JRNL-01 | Journal page has a dedicated tab for Daily Photo Challenge photos | Covered by extending the existing tab switcher array in `JournalPage.jsx` line 222: `[['mc', 'quizzes'], ['dd', 'deep dive'], ['drawings', 'drawings'], ['books', 'books'], ['photos', 'photos']]`. Tab button styles are already data-driven — no new styles needed. |
| JRNL-02 | Journal tab displays all completed section photos organized by theme | Covered by reading `responses` where `pack_id='daily-photo-challenge'` and `player_id='shared'`, iterating `answers.completedSections` keys, cross-referencing `photoSections` from `src/data/photoSections.js` for theme emoji/title, and rendering one card per completed section. Tapping a card navigates to the existing read-only reveal route `/daily-photo-reveal/:sessionId/:sectionId`. |
</phase_requirements>

## Current JournalPage Structure (reference)

File: `src/pages/JournalPage.jsx` (876 lines)

### Tab wiring (lines 221–240)

```jsx
const [activeTab, setActiveTab] = useState('mc')
// ...
<div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
  {[['mc', 'quizzes'], ['dd', 'deep dive'], ['drawings', 'drawings'], ['books', 'books']].map(([key, label]) => (
    <button
      key={key}
      onClick={() => { setActiveTab(key); setExpandedItem(null) }}
      style={{
        flex: 1, padding: '10px 0', borderRadius: '6px 6px 0 0',
        border: `1.5px solid ${activeTab === key ? 'var(--border-pencil-dark)' : 'var(--border-pencil)'}`,
        borderBottom: activeTab === key ? '2px solid var(--bg-paper)' : '1.5px solid var(--border-pencil)',
        fontFamily: 'var(--font-hand)', fontWeight: activeTab === key ? 700 : 500,
        fontSize: '0.95rem', cursor: 'pointer',
        background: activeTab === key ? 'var(--bg-paper)' : 'var(--bg-card)',
        color: activeTab === key ? 'var(--accent-coral)' : 'var(--text-secondary)',
        ...
      }}
    >
      {label}
    </button>
  ))}
</div>
```

Adding a 5th tab is a one-line change to the array. Tab body rendering uses `AnimatePresence` with `activeTab === 'key'` guards (lines 247–835).

### Data fetching pattern (lines 101–118)

Single `useEffect` on mount fetches everything in parallel via `Promise.all`. Loads:
- `responses` (all rows, filtered client-side into `mcResponses`, `drawResponses`, `bookEntries`)
- `deep_dive_responses`

The new photos tab should hook into this same `useEffect` — no second effect needed. The `responses` query already fetches all rows for the session, so we can extract the `daily-photo-challenge` shared row from `mcRes.data` directly (it won't match any quiz pack filter currently in use).

**Existing extraction pattern (line 111) for reference:**
```jsx
const studyRow = allResponses.find(r => r.pack_id === 'study-together' && r.player_id === 'shared')
setBookEntries(studyRow?.answers?.books?.filter(b => b.status === 'finished' || b.status === 'reflected') || [])
```

### Tab body pattern (books tab is the closest analog — lines 711–835)

The books tab is the simplest of the four existing tabs and the best template for photos:
1. Stats sticky-note (optional — can skip for photos tab)
2. Empty state (`.glass` card + emoji + CTA button)
3. List of cards — `motion.div` with `.glass` class, alternating rotation, expandable via `expandedItem` state
4. Each card has a header row (emoji + title + meta) and an expandable detail body

**For photos, we deviate from books in one key way:** books expand inline (accordion) to show reflections; photos should NOT expand inline. Tapping a photo card navigates to `/daily-photo-reveal/:sessionId/:sectionId` to reuse the existing cork board viewer. This is simpler than books and matches how the hub page already routes completed sections.

### Currently filtered-out pack IDs

Line 110 filters `mcResponses`: `!r.pack_id?.startsWith(DRAW_PACK_PREFIX) && r.pack_id !== 'study-together'`.

**Important:** `daily-photo-challenge` and `daily-photo-section` rows will leak into the `mcResponses` state unless filtered. Extend the filter to exclude them:
```js
.filter(r => !r.pack_id?.startsWith(DRAW_PACK_PREFIX)
          && r.pack_id !== 'study-together'
          && r.pack_id !== 'daily-photo-challenge'
          && r.pack_id !== 'daily-photo-section')
```
If this isn't done, the quizzes tab will attempt to render photo challenge rows as quiz packs (they'll be filtered out by the `quizPacks.filter` lookup, so it's harmless in practice, but cleaner to exclude explicitly).

## Data Shapes (verified from Phase 12)

### Shared gate state — read this to know which sections are done

```
table:      responses
session_id: {sessionId}
pack_id:    'daily-photo-challenge'
player_id:  'shared'
answers: {
  completedSections: {
    'morning-routine': '2026-04-01T09:00:00Z',
    'date-night':      '2026-04-02T20:15:00Z',
    // ... one key per completed section, value is ISO completion timestamp
  },
  inProgressSectionId: null | 'section-id',
  lastCompletedAt:     ISO timestamp | null
}
```

**This is the ONLY row Phase 13 needs to read** to determine which sections to show. It already exists for every session that has started the Daily Photo Challenge (created by the hub page on first pick).

### Per-player photo rows — Phase 13 does NOT need to read these directly

The reveal page already handles loading these when navigated to:

```
table:      responses
pack_id:    'daily-photo-section'
player_id:  'player1' | 'player2'
answers: {
  sectionId: 'morning-routine',
  photos: [
    { promptIndex: 0, path: '{sessionId}/{playerId}/{sectionId}_0.jpg', caption: '...' },
    { promptIndex: 1, path: '...', caption: '...' },
    { promptIndex: 2, path: '...', caption: '...' }
  ],
  completedAt: ISO timestamp
}
```

**Caveat on `pack_id`:** the existing row stores all sections the player has ever completed? **No** — inspecting Phase 12 code (DailyPhotoRevealPage lines 59–72) shows each `player_id` row is queried via `.maybeSingle()` with only `pack_id='daily-photo-section'`. Phase 12 upserts with conflict on `(session_id, pack_id, player_id)`, which means there is only ONE row per player — each new section completion overwrites the previous photos. **The per-player row only holds the most recent section's photos.**

This has an important implication: **for older completed sections, the signed URLs may succeed (Storage paths still exist), but the per-player row in the DB will only reflect the MOST RECENT section.** When Phase 13 navigates to the reveal page for an older section, the reveal page's existing completion check will FAIL (because `answers.sectionId` won't match the URL `:sectionId`).

**See "Open Questions" below — this is a cross-phase concern the planner must address.**

## Query Strategy

Single query, reuse the existing `fetchAll` effect:

```js
const dailyPhotoRow = allResponses.find(
  r => r.pack_id === 'daily-photo-challenge' && r.player_id === 'shared'
)
const completedSectionsMap = dailyPhotoRow?.answers?.completedSections ?? {}
setCompletedPhotoSections(completedSectionsMap)
```

Then derive the card list client-side:

```js
const completedPhotoCards = Object.entries(completedSectionsMap)
  .map(([sectionId, completedAt]) => {
    const section = photoSections.find(s => s.id === sectionId)
    if (!section) return null  // defensive: handle deleted sections
    return {
      id: sectionId,
      title: section.title,
      emoji: section.emoji,
      description: section.description,
      completedAt,
    }
  })
  .filter(Boolean)
  .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))  // newest first
```

## Card Display Pattern

Follow the books tab card structure (`JournalPage.jsx` lines 759–790), but simpler — no accordion, no expandable detail. Tap navigates to reveal page.

```jsx
<motion.div
  key={card.id}
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: i * 0.05 }}
  className="glass"
  style={{ overflow: 'hidden', transform: `rotate(${i % 2 === 0 ? -0.3 : 0.3}deg)`, cursor: 'pointer' }}
  role="button"
  tabIndex={0}
  onClick={() => navigate(`/daily-photo-reveal/${sessionId}/${card.id}`)}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      navigate(`/daily-photo-reveal/${sessionId}/${card.id}`)
    }
  }}
  aria-label={`View photos from ${card.title}`}
>
  <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
    <span style={{ fontSize: '1.4rem' }}>{card.emoji}</span>
    <div style={{ flex: 1 }}>
      <h3 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
        {card.title}
      </h3>
      <p style={{ fontSize: '0.8rem', color: 'var(--accent-sage)', fontFamily: 'var(--font-hand)' }}>
        completed {new Date(card.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </p>
    </div>
    <span style={{ fontSize: '1rem', color: 'var(--text-light)' }}>→</span>
  </div>
</motion.div>
```

**Accessibility note:** Matches the pattern from CLAUDE.md "Interactive cards on VaultPage, HotTakesPage, VisionTab, StudyTogetherPage, and ResultsPage have `role='button'`, `tabIndex={0}`, `onKeyDown`, and `aria-label`".

## Empty State

Follow books tab empty state pattern (lines 738–750):

```jsx
<div className="glass" style={{ padding: 28, textAlign: 'center', transform: 'rotate(0.3deg)' }}>
  <p style={{ fontSize: '1.5rem', marginBottom: 8 }}>📸</p>
  <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
    no photo sections completed yet
  </p>
  <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: 4, fontStyle: 'italic' }}>
    finish a photo section together to see it here
  </p>
  <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate(`/daily-photos/${sessionId}`)}>
    take photos →
  </button>
</div>
```

## Navigation to Reveal Page (Read-Only Review)

The existing route `/daily-photo-reveal/:sessionId/:sectionId` is already read-only:
- `DailyPhotoRevealPage.jsx` does not expose any re-answer UI
- It fetches both player rows, builds bridge shape, checks completeness, fetches signed URLs
- On failure it shows "Photos aren't ready yet" + back link (back link currently navigates to `/daily-photos/:sessionId` — acceptable from Journal entry too, since it lands the user on the hub)

**No modifications to the reveal page are required for Phase 13 to satisfy JRNL-02's "tapping a completed section shows that section's photos (does not allow re-answering)" success criterion** — assuming the open question about per-player row persistence is resolved (see below).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Photo viewer with captions | A new photo grid or lightbox | Existing `/daily-photo-reveal/:sessionId/:sectionId` route | Already handles signed URL fetch, loading, error states, cork board visual, torn paper captions, both players side-by-side |
| Completion-state fetch | A dedicated photo journal query or second `useEffect` | Extend existing `fetchAll` in `JournalPage.jsx` to extract `daily-photo-challenge` shared row | One round trip already made; filter-in-place |
| Tab switcher | Custom tab component | Extend the inline tab array at line 222 | Existing button styles are fully data-driven |
| Section metadata (emoji/title) | Duplicating section definitions | Import `photoSections` from `src/data/photoSections.js` | Already the canonical source used by hub, prompt flow, and reveal pages |
| Read-only "don't allow re-answer" guard | New component or permission check | Reveal page is inherently read-only | No edit UI exists there |

**Key insight:** Phase 13 is about *wiring*, not *building*. Every success criterion is satisfied by plumbing existing components together. If the plan for this phase has more than ~100 lines of net-new JSX, it's over-engineered.

## Common Pitfalls

### Pitfall 1: Not filtering photo challenge rows from `mcResponses`
**What goes wrong:** `daily-photo-challenge` and `daily-photo-section` rows end up in `mcResponses` state.
**Why it happens:** The existing filter at line 110 only excludes `DRAW_PACK_PREFIX` and `study-together`.
**How to avoid:** Extend the filter to exclude both photo pack IDs.
**Warning signs:** Strange keys in React console warnings or the quizzes tab list counts being off.

### Pitfall 2: Expecting `expandedItem` to work with photo cards
**What goes wrong:** Developer adds expand-on-tap (like books/quizzes/deep-dive) and then realizes photos need to navigate away.
**Why it happens:** Copy-paste from books tab.
**How to avoid:** Photos cards navigate directly. Do not call `setExpandedItem`.

### Pitfall 3: Using `navigate` inside `setActiveTab` handler
**What goes wrong:** Tab click triggers navigation unexpectedly.
**Why it happens:** Confusing tab click with card click.
**How to avoid:** Tab button only calls `setActiveTab('photos'); setExpandedItem(null)`. Navigation happens on card click only.

### Pitfall 4: Not handling sections whose ID no longer exists in `photoSections.js`
**What goes wrong:** A section ID is present in `completedSections` but was removed from `photoSections.js` (theoretical future cleanup).
**Why it happens:** `photoSections.find(s => s.id === sectionId)` returns `undefined`, crashes on `.title`.
**How to avoid:** The `.map(...).filter(Boolean)` pattern shown in the query strategy above defends against this. Section IDs are documented as "NEVER rename after launch" in the data file header — low risk but cheap insurance.

### Pitfall 5: Playing with tab sizing / responsive overflow
**What goes wrong:** Adding a 5th tab to `flex: 1` buttons makes each tab narrower — "deep dive" label may wrap or truncate on small screens.
**Why it happens:** Mobile-first layout with 4 equal-width tabs worked; 5 squeezes each to ~20% width.
**How to avoid:** Test on narrow viewport (360px width). If labels wrap, consider shortening labels — e.g. `'deep dive'` → `'deep'`, `'drawings'` → `'draw'`, new tab `'photos'`. Discuss with planner before changing existing labels; may prefer a shorter label for the new tab only (e.g. `'photos'` is already short).

## Code Examples

### Extending the tab switcher (exact insertion point)

```jsx
// JournalPage.jsx line 222 — change FROM:
{[['mc', 'quizzes'], ['dd', 'deep dive'], ['drawings', 'drawings'], ['books', 'books']].map(([key, label]) => (

// TO:
{[['mc', 'quizzes'], ['dd', 'deep dive'], ['drawings', 'drawings'], ['books', 'books'], ['photos', 'photos']].map(([key, label]) => (
```

### Extending the `fetchAll` effect

```jsx
// Inside existing useEffect (line 101), after setBookEntries(...):
const photoChallengeRow = allResponses.find(
  r => r.pack_id === 'daily-photo-challenge' && r.player_id === 'shared'
)
setCompletedPhotoSections(photoChallengeRow?.answers?.completedSections ?? {})
```

### Deriving photo cards

```jsx
// Near line 190 (alongside other getCompletedX helpers):
const getCompletedPhotoSections = () => {
  return Object.entries(completedPhotoSections)
    .map(([sectionId, completedAt]) => {
      const section = photoSections.find(s => s.id === sectionId)
      if (!section) return null
      return { id: sectionId, title: section.title, emoji: section.emoji, description: section.description, completedAt }
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
}
const completedPhotoCards = loading ? [] : getCompletedPhotoSections()
```

### The photos tab body (full JSX)

```jsx
{activeTab === 'photos' && (
  <motion.div key="photos" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }}>
    {completedPhotoCards.length === 0 ? (
      <div className="glass" style={{ padding: 28, textAlign: 'center', transform: 'rotate(0.3deg)' }}>
        <p style={{ fontSize: '1.5rem', marginBottom: 8 }}>📸</p>
        <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
          no photo sections completed yet
        </p>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: 4, fontStyle: 'italic' }}>
          finish a photo section together to see it here
        </p>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate(`/daily-photos/${sessionId}`)}>
          take photos →
        </button>
      </div>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {completedPhotoCards.map((card, i) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass"
            style={{ transform: `rotate(${i % 2 === 0 ? -0.3 : 0.3}deg)`, cursor: 'pointer' }}
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/daily-photo-reveal/${sessionId}/${card.id}`)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                navigate(`/daily-photo-reveal/${sessionId}/${card.id}`)
              }
            }}
            aria-label={`View photos from ${card.title}`}
          >
            <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '1.4rem' }}>{card.emoji}</span>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {card.title}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--accent-sage)', fontFamily: 'var(--font-hand)' }}>
                  completed {new Date(card.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
              <span style={{ fontSize: '1rem', color: 'var(--text-light)' }}>→</span>
            </div>
          </motion.div>
        ))}
      </div>
    )}
  </motion.div>
)}
```

## Open Questions

### 1. **Per-player row persistence across multiple completed sections** (CRITICAL — affects whether this phase can succeed as-is)

**What we know:** Phase 12 upserts per-player photo answers to a single row per player (unique on `session_id, pack_id, player_id`). The row holds `{ sectionId, photos[3], completedAt }`. Each new section completion OVERWRITES the previous row's `sectionId`, `photos`, and `completedAt`.

**What's unclear:** When a user completes section A, then section B, what happens when the Journal navigates back to section A's reveal page? The per-player row now has `answers.sectionId === 'B'`, so the reveal page's `buildBridgeShape` keys by `[sectionId]` (URL param 'A') but the photos belong to B. `isSectionCompleteForPlayer` will likely return false → user sees "Photos aren't ready yet" even though section A is in `completedSections`.

**Evidence from code (`DailyPhotoRevealPage.jsx` lines 83–98):**
```js
const buildBridgeShape = (answers) => {
  if (!answers?.photos) return null
  const byIndex = [null, null, null]
  for (const photo of answers.photos) {
    if (photo.promptIndex >= 0 && photo.promptIndex <= 2) {
      byIndex[photo.promptIndex] = { path: photo.path, caption: photo.caption ?? '' }
    }
  }
  return { [sectionId]: byIndex }  // keys by URL sectionId regardless of answers.sectionId mismatch
}
```

The bridge shape silently relabels the photos under the URL `sectionId`, so `isSectionCompleteForPlayer` would pass... BUT the photos being shown would actually be from the wrong (most recent) section. **This is a latent bug** not a Journal bug — it means the reveal page currently only works for the single most-recently-completed section.

**Recommendation:** The Phase 13 planner MUST investigate this before building the tab:
- **Option A (correct fix, requires schema change):** Change per-player storage to an array of section completions, e.g. `answers.sections[{ sectionId, photos, completedAt }]`, and update Phase 12 upsert logic to append/replace by sectionId. The reveal page then finds the matching section in the array.
- **Option B (alternate key, no schema change):** Use a composite `pack_id` like `'daily-photo-section:morning-routine'` per section. The player still has one row per section, unique constraint already handles it. Requires updating Phase 12 writes and the reveal page query.
- **Option C (descope):** Journal tab only shows the most recently completed section. Unacceptable per JRNL-02 ("all completed section photos").
- **Option D (verify first):** Open a real session, complete two sections back-to-back, navigate to the older one's reveal URL, and confirm whether the bug reproduces. If it does NOT reproduce (i.e. Phase 12 already stores per-section rows somehow the research missed), proceed with Phase 13 as described. If it does, escalate to the user before planning.

**Who decides:** This is a user-facing product decision with schema implications. The planner should raise this open question during `/gsd:discuss-phase` or immediately in planning.

### 2. **Tab label length / mobile layout**
- What we know: 4 tabs of `flex: 1` fit on a 360px viewport.
- What's unclear: 5 tabs shrink each to ~72px wide — will "deep dive" wrap or get cut off?
- Recommendation: Visual check on mobile viewport during implementation. Shortening labels is low-cost if needed.

### 3. **Stats sticky-note for photos tab**
- What we know: All 4 existing tabs have a stats sticky-note at top showing counts (e.g., "3 quizzes done").
- What's unclear: Does the photos tab need one? E.g., "3 of 15 sections complete" (which already appears on the hub page).
- Recommendation: Include for visual consistency with the other tabs. Numbers: `completedCount` and `15 - completedCount` left to do, or `completedCount` and total reactions if reactions are later added. Planner's call.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | none configured — CLAUDE.md: "No test runner or linter is configured" |
| Config file | none |
| Quick run command | manual — `npm run dev` + visual verification |
| Full suite command | manual — full journal tab walk-through |
| Phase gate | human verification via `/gsd:verify-work` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| JRNL-01 | 5th tab "photos" visible alongside quizzes/deep dive/drawings/books | manual-only | npm run dev → visit `/journal/:sessionId` | n/a |
| JRNL-02 | Tab lists all completed sections from `completedSections`, each tapping navigates to read-only reveal | manual-only | complete 2+ sections → visit journal photos tab → tap each card | n/a |

**Justification for manual-only:** No test framework exists in the repo. Phase 13 is a pure UI integration phase with no new pure functions to unit-test. All success criteria are visual/navigational and verified during `/gsd:verify-work` or by running the Playwright MCP against a live dev session.

### Sampling Rate
- **Per task commit:** visual check in `npm run dev`
- **Per phase gate:** complete two different sections on a real session, open journal, tap each photo card, verify reveal page shows correct section's photos
- **Cross-verification:** confirm filter additions in `mcResponses` don't break quizzes tab display

### Wave 0 Gaps
None — no test infrastructure to add. The open question about per-player row persistence is a pre-implementation investigation task (manual reproduction in a dev session), not a test gap.

## Sources

### Primary (HIGH confidence)
- `src/pages/JournalPage.jsx` (lines 1–876) — complete tab pattern, fetch pattern, card rendering pattern
- `src/pages/DailyPhotosHubPage.jsx` — shared gate state query pattern, `completedSections` shape
- `src/pages/DailyPhotoRevealPage.jsx` — read-only reveal route, bridge shape logic, latent per-player row issue
- `src/data/photoSections.js` — section metadata (15 sections, id/title/emoji/description/prompts)
- `.planning/phases/12-prompt-flow-cork-board-reveal/12-UI-SPEC.md` — data shape contract (lines 388–422)
- `.planning/REQUIREMENTS.md` — JRNL-01, JRNL-02 requirement text
- `.planning/ROADMAP.md` — Phase 13 goal and success criteria
- `CLAUDE.md` — project conventions (no TypeScript, inline styles, accessibility patterns, realtime+polling, useRealtimeSync, useSessionSetup)

### Secondary (MEDIUM confidence)
- None — Phase 13 is entirely internal integration; no external docs needed.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- JournalPage tab pattern: HIGH — read entire file, pattern is explicit and repeatable
- Data shapes: HIGH — verified in both Phase 12 UI-SPEC and the live DailyPhotoRevealPage source
- Card display pattern: HIGH — direct adaptation of books tab card
- Navigation to reveal page: HIGH — route exists, is read-only, already used by hub
- Per-player row persistence issue: HIGH (finding) — the code clearly upserts on a single composite key; MEDIUM (product impact) — requires a real-session reproduction to confirm user-visible behavior

**Research date:** 2026-04-04
**Valid until:** 2026-05-04 (30 days — stable integration work on an established codebase)
