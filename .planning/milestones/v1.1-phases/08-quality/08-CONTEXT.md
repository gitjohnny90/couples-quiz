# Phase 8: Quality - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix direct DOM mutations in VisionTab, lightly extract hooks/helpers from the largest page components, and fix stale route references in the test suite. No full rewrites — light-touch only per project constraints.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion

User deferred all decisions to Claude. The three requirements are well-defined by the audit:

**QUAL-01 — VisionTab DOM mutations:**
- 4 instances of `onMouseEnter/Leave` setting `.style.transform` directly (lines 335-336, 888-889 of VisionTab.jsx)
- Replace with CSS `:hover` pseudo-class or React state — Claude chooses the simplest approach
- These are hover-scale effects on buttons, not caption-related

**QUAL-02 — Hook/helper extraction:**
- Target the largest pages: PredictPartnerPage (885 lines), LoveNoteHuntPage (863), StudyTogetherPage (780)
- Extract reusable logic (data fetching, realtime subscriptions, game state) into custom hooks
- Light-touch: reduce line count and improve separation of concerns, not a full rewrite
- No existing custom hooks extracted from pages yet (only `useLongPress` in hooks dir)

**TEST-01 — Stale /books route tests:**
- `sessionUtils.test.js` line 57 references `/books/abc` → should be `/study/abc`
- `isTabActive` test at line 139-141 tests `/books` route → update to `/study`
- The `getDocumentTitle` function already handles `/study` correctly (returns 'Study Together — The Us Quiz')
- Check if `isTabActive` in sessionUtils.js comment (line 52) also references `/books` → update comment too

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User explicitly chose "you decide all."

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useLongPress` hook (`src/hooks/useLongPress.js`): only existing custom hook — establishes the pattern for new hooks
- Standard realtime+polling pattern (documented in CLAUDE.md): consistent across all interactive pages, good extraction candidate

### Established Patterns
- `useCallback`-wrapped fetch functions with `[sessionId]` deps — used on every interactive page
- `mountedRef` guard pattern — standard across all pages
- Unique channel names via `useRef` with random suffix — standard across all pages
- Inline styles throughout — VisionTab DOM fix should use CSS or React state, not introduce a new pattern

### Integration Points
- `sessionUtils.js`: Contains `getDocumentTitle` and `isTabActive` functions tested by the stale tests
- `src/hooks/` directory: Where new extracted hooks should go
- VisionTab.jsx: Self-contained component, DOM fix is localized

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-quality*
*Context gathered: 2026-03-15*
