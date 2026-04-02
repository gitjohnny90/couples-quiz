---
phase: 10
plan: 02
subsystem: photo-capture-ui
tags: [react-component, photo-upload, polaroid, torn-paper, accessibility]
dependency_graph:
  requires: [photoUtils.js (Plan 01), daily-photos bucket (Plan 01)]
  provides: [PhotoCaptureInput component, TornPaperCaption component]
  affects: [Phase 12 (prompt flow page that consumes PhotoCaptureInput)]
tech_stack:
  added: []
  patterns: [controlled-input component, blob URL preview + revoke lifecycle, hidden file input triggered by label]
key_files:
  created:
    - src/components/PhotoCaptureInput.jsx
    - src/components/TornPaperCaption.jsx
  modified: []
decisions:
  - "Idle/selected states rendered as two separate return branches (not conditional JSX blocks) for clarity"
  - "useEffect cleanup revokes previewUrl on unmount — prevents memory leak from blob URLs"
  - "Both file inputs get refs so handleRemove can reset them via .value='', allowing re-selection of same file"
  - "Component is fully controlled (no internal routing) — parent page decides what to do after onPhotoSubmit fires"
metrics:
  duration: 79s
  tasks_completed: 2
  tasks_pending_verification: 1
  files_created: 2
  files_modified: 0
  completed_date: 2026-04-02
---

# Phase 10 Plan 02: Photo Capture UI Components Summary

**One-liner:** Two reusable components — PhotoCaptureInput (camera/gallery triggers, polaroid preview, upload flow) and TornPaperCaption (torn-paper styled caption input) — per the 10-UI-SPEC design contract.

---

## What Was Built

### Task 1: `src/components/TornPaperCaption.jsx`

Controlled caption input rendered as a torn-paper strip, intended to sit directly below a polaroid photo frame.

- Single-line `<input type="text">` — max 80 chars, Caveat font 0.8rem centered
- Accessible: `<label htmlFor="photo-caption">` paired with `id="photo-caption"`
- Fixed 40px height — no scrolling (satisfies PHOTO-03)
- Character count display at bottom-right in Patrick Hand 0.75rem
- Bottom edge uses `.torn-edge` CSS class from `src/index.css` (mask-image SVG pattern)
- Props: `value`, `onChange`, `maxLength` (default 80), `disabled`

### Task 2: `src/components/PhotoCaptureInput.jsx`

Fully reusable photo capture component with two render states:

**Idle state (no photo selected):**
- Prompt text above
- Dashed-border empty area with "No photo yet" heading and descriptive copy
- "Take Photo" trigger (`capture="environment"`) and "Choose from Gallery" trigger (no capture)
- Both are `<label>` elements wrapping hidden `<input type="file">` — `.btn .btn-secondary` styled, 44px min-height touch targets

**Photo-selected state:**
- Prompt text above
- Polaroid frame: `background: #fff`, `padding: 6px 6px 22px`, `boxShadow: 2px 3px 8px rgba(0,0,0,0.18)`, `borderRadius: 1` — matches VisionTab CorkBoardSlot exactly
- Remove button: 18x18 circle at top-right corner, `aria-label="Remove photo"`, `rgba(0,0,0,0.5)` background
- Photo preview: `<img>` with `alt={caption || 'your photo'}`
- TornPaperCaption below polaroid (80-char limit)
- "Add this photo" submit button (`.btn .btn-primary`), shows "Saving..." during upload at 0.6 opacity
- Inline error display below submit button

**Upload flow:**
- Calls `uploadPhoto(supabase, sessionId, playerId, sectionId, promptIndex, selectedFile)` from `photoUtils.js`
- On success: fires `onPhotoSubmit(path, caption)` — parent decides next step
- On error: sets error state, displays inline message
- Blob URL revoked in `useEffect` cleanup to prevent memory leaks

---

## Commits

| Task | Commit | Message |
|------|--------|---------|
| Task 1 | f760d1a | feat(10-02): create TornPaperCaption component |
| Task 2 | 3eaae18 | feat(10-02): create PhotoCaptureInput component |

---

## Verification Results

- `npm run build` after Task 1: success
- `npm run build` after Task 2: success
- Task 3 (checkpoint:human-verify): PENDING — requires human visual verification in browser

---

## Deviations from Plan

None — plan executed exactly as written. Both components match the UI-SPEC design contract (polaroid frame, torn-paper caption, copy, accessibility attributes, touch targets).

---

## Task 3 — Checkpoint PENDING

**Task 3** (`checkpoint:human-verify`) was NOT executed by this agent per instructions. This is a visual browser verification step.

**What to verify:**
1. Open http://127.0.0.1:5173 (run `npm run dev` first)
2. Navigate to a page where PhotoCaptureInput is rendered with dummy props
3. Verify idle state: dashed border area + "No photo yet" + two buttons
4. Click "Choose from Gallery" — file picker should open
5. Select a photo — polaroid frame appears with preview
6. TornPaperCaption shows below with placeholder "add a caption..." and "0/80" count
7. Type a caption — character count updates, max 80 chars
8. Remove button (x) in top-right corner clears photo and returns to idle state
9. "Add this photo" button uses coral/primary styling
10. On mobile/DevTools: "Take Photo" opens camera

**To create a test harness**, render PhotoCaptureInput on any existing page or create a temporary test route with dummy props like:
```jsx
<PhotoCaptureInput
  prompt="Share a photo of something that made you smile today"
  onPhotoSubmit={(path, caption) => console.log('Submitted:', path, caption)}
  sessionId="preview"
  playerId="player1"
  sectionId="morning"
  promptIndex={0}
/>
```

**Resume signal:** Type "approved" or describe issues to fix.

---

## Self-Check: PASSED

- [x] `src/components/TornPaperCaption.jsx` exists — FOUND
- [x] `src/components/PhotoCaptureInput.jsx` exists — FOUND
- [x] commit f760d1a exists
- [x] commit 3eaae18 exists
- [x] Build passes after both tasks
