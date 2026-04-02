---
phase: 10-storage-photo-capture
verified: 2026-04-01T00:00:00Z
status: human_needed
score: 4/4 must-haves verified
re_verification: false
human_verification:
  - test: "Camera trigger opens device camera"
    expected: "Tapping 'Take Photo' on a real mobile device (or DevTools mobile emulation) opens the native camera via the capture='environment' attribute"
    why_human: "The capture attribute behavior is device-dependent and cannot be verified by static code analysis or a headless build check"
  - test: "Caption input does not cause page scroll on mobile"
    expected: "When the caption input receives focus and the software keyboard appears, the page pushes up naturally without an unwanted scroll jump"
    why_human: "Scroll behavior on keyboard appearance is a live browser/OS interaction that grep cannot confirm"
  - test: "Polaroid frame visual matches VisionTab exactly"
    expected: "After selecting a photo, the preview appears inside a white polaroid frame with correct padding (6px 6px 22px) and shadow — visually indistinguishable from VisionTab cork board slots"
    why_human: "Visual fidelity requires a sighted check in a browser"
  - test: "Torn-paper bottom edge renders on TornPaperCaption"
    expected: "The .torn-edge div at the bottom of TornPaperCaption shows the mask-image torn edge pattern from index.css — not a flat line"
    why_human: "CSS mask-image rendering must be verified visually in a browser"
  - test: "Photo uploads successfully to Supabase Storage"
    expected: "After selecting a photo and tapping 'Add this photo', the upload completes, onPhotoSubmit fires with a valid storage path, and no error message is shown"
    why_human: "Requires the daily-photos bucket to be created in the Supabase project (the migration SQL exists but must be executed manually) and a live network call to Storage"
---

# Phase 10: Storage & Photo Capture Verification Report

**Phase Goal:** Users can take or upload a photo, add a caption, and have it stored securely in Supabase Storage
**Verified:** 2026-04-01
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can tap a button to open their device camera and take a photo to answer a prompt | ? HUMAN | `capture="environment"` present on first `<input type="file">` in PhotoCaptureInput.jsx line 215. Actual device behavior requires human test. |
| 2 | User can tap a button to select a photo from their device gallery to answer a prompt | ✓ VERIFIED | Second `<input type="file" accept="image/*">` (no capture) present on line 224. Hidden input wrapped in `.btn.btn-secondary` label. |
| 3 | User can type a short caption below their photo in a torn-paper style display without the page scrolling | ✓ VERIFIED (automation) / ? HUMAN (scroll) | `<input type="text" height:40 maxLength={80}>` in TornPaperCaption.jsx. `.torn-edge` class applied. Height is 40px (single line, no scroll possible from content). No-scroll guarantee during keyboard appearance needs human verification. |
| 4 | Submitted photos are stored in a Supabase Storage bucket scoped to the user's session (not accessible to other sessions) | ✓ VERIFIED | `uploadPhoto` in photoUtils.js calls `supabase.storage.from('daily-photos').upload(path, blob, { upsert: true })` with path `${sessionId}/${playerId}/...`. Migration SQL has 4 RLS policies (SELECT/INSERT/UPDATE/DELETE) all checking `(storage.foldername(name))[1]` against session_id from `user_sessions`. Bucket marked `public: false`. |

**Score:** 4/4 truths verified (3 fully automated, 1 has device-dependent component)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/utils/photoUtils.js` | compress + upload + URL helpers | ✓ VERIFIED | 112 lines. Exports 5 functions: `compressImage`, `uploadPhoto`, `getPhotoUrl`, `createPreviewUrl`, `revokePreviewUrl`. No direct supabase import (passed as parameter). |
| `supabase/migrations/10-photo-storage-bucket.sql` | Bucket + 4 RLS policies | ✓ VERIFIED | 99 lines. `INSERT INTO storage.buckets` with `public: false`, 5MB limit, JPEG/PNG/WebP. Exactly 4 `CREATE POLICY` statements. All use `(SELECT auth.uid())` subquery form. |
| `src/components/PhotoCaptureInput.jsx` | Reusable capture component | ✓ VERIFIED | 233 lines (exceeds 80-line minimum). Imports `uploadPhoto`, `createPreviewUrl`, `revokePreviewUrl` from photoUtils and `TornPaperCaption`. Both file inputs present. `aria-label="Remove photo"`, `alt={caption || 'your photo'}`, polaroid styles match spec. |
| `src/components/TornPaperCaption.jsx` | Torn-paper caption input | ✓ VERIFIED | 70 lines (exceeds 30-line minimum). `htmlFor`/`id="photo-caption"` pair, `className="torn-edge"`, `height: 40`, character count `{value.length}/{maxLength}`, `placeholder="add a caption..."`. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `PhotoCaptureInput.jsx` | `src/utils/photoUtils.js` | `import { uploadPhoto, createPreviewUrl, revokePreviewUrl }` | ✓ WIRED | Line 14: `import { uploadPhoto, createPreviewUrl, revokePreviewUrl } from '../utils/photoUtils'`. All three are called in handlers and useEffect cleanup. |
| `PhotoCaptureInput.jsx` | `TornPaperCaption.jsx` | `import TornPaperCaption` | ✓ WIRED | Line 15: `import TornPaperCaption from './TornPaperCaption'`. Rendered at line 142 inside photo-selected state with `value`, `onChange`, `disabled` props. |
| `TornPaperCaption.jsx` | `src/index.css` | `.torn-edge` CSS class | ✓ WIRED | Line 67: `<div className="torn-edge" />`. `.torn-edge` is defined in index.css at line 508 with mask-image SVG pattern. |
| `photoUtils.js` | `supabase.storage.from('daily-photos')` | `uploadPhoto` function | ✓ WIRED | Lines 62-67: `supabase.storage.from('daily-photos').upload(path, blob, { contentType: 'image/jpeg', upsert: true })`. |
| `10-photo-storage-bucket.sql` | `user_sessions` table | RLS policy subquery | ✓ WIRED | All 4 policies query `user_sessions WHERE user_id = (SELECT auth.uid())` to enforce session-scoped access. |
| `PhotoCaptureInput.jsx` | page/router | `onPhotoSubmit` callback | ✓ VERIFIED (design) | Component is intentionally unrouted — calls `onPhotoSubmit(path, caption)` on success. Consumer (Phase 12 prompt flow) not yet built; this is expected and by design. |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| PHOTO-01 | 10-02-PLAN.md | User can take a photo with device camera | ? HUMAN | `capture="environment"` present, device behavior unverifiable programmatically |
| PHOTO-02 | 10-02-PLAN.md | User can upload from gallery | ✓ SATISFIED | Gallery input present and wired |
| PHOTO-03 | 10-02-PLAN.md | Caption: torn-paper style, no scrolling | ✓ SATISFIED | Single-line input, 40px height, `.torn-edge` class |
| PHOTO-04 | 10-01-PLAN.md | Photos stored in session-scoped Supabase Storage bucket | ✓ SATISFIED | Bucket SQL + RLS policies + `uploadPhoto` function verified |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `PhotoCaptureInput.jsx` | 203 | Empty state body says "Tap **below**..." but UI-SPEC says "Tap **above**..." | ℹ️ Info | Minor copy deviation — the plan's own render spec used "Tap below" (which matches the spatial reality: buttons are below the dashed area), while UI-SPEC used "Tap above". No functional impact. |
| `supabase/migrations/10-photo-storage-bucket.sql` | — | Migration SQL exists on disk but has NOT been applied to the Supabase project (untracked file, no evidence of execution) | ⚠️ Warning | PHOTO-04 is satisfied in code but the bucket and RLS policies do not exist in the live database until this migration is executed. Actual uploads will fail until then. |

No stub implementations, no console.log-only handlers, no TODO/FIXME comments, no empty returns.

---

### Human Verification Required

#### 1. Camera trigger opens device camera

**Test:** On a real mobile device or Chrome DevTools with mobile emulation, navigate to a page rendering `<PhotoCaptureInput>` and tap "Take Photo."
**Expected:** The native camera app or camera interface opens (not the file gallery).
**Why human:** `capture="environment"` behavior is OS/browser-dependent and cannot be confirmed by static analysis.

#### 2. Caption input does not cause page scroll

**Test:** Select a photo so the caption input appears, tap the caption field, and observe keyboard appearance on a mobile device or emulator.
**Expected:** The view adjusts upward so the caption input remains visible — no erratic scroll or layout jump.
**Why human:** Scroll-on-keyboard behavior is a live runtime interaction.

#### 3. Polaroid frame visual matches VisionTab

**Test:** Select a photo in the component. Compare the polaroid frame appearance to a vision board slot in `/vision/:id`.
**Expected:** Both show a white frame, consistent padding, and the same drop shadow. They should look like they come from the same design system.
**Why human:** Visual fidelity requires a sighted check.

#### 4. Torn-paper bottom edge renders on TornPaperCaption

**Test:** Select a photo so TornPaperCaption appears. Inspect the bottom edge of the caption strip.
**Expected:** The bottom edge shows a torn/ragged paper texture (from the `.torn-edge` mask-image), not a flat border.
**Why human:** CSS mask-image SVG rendering must be checked visually.

#### 5. Photo uploads successfully to Supabase Storage (requires migration execution)

**Test:** Execute `supabase/migrations/10-photo-storage-bucket.sql` against the Supabase project. Then select a photo and submit it. Inspect Supabase Storage dashboard.
**Expected:** The file appears at `{session_id}/{player_id}/{sectionId}_{promptIndex}.jpg` in the `daily-photos` bucket. No error message shows in the component.
**Why human:** Requires manual migration execution and a live authenticated upload session.

---

### Gaps Summary

No functional gaps found. All four artifacts exist, are substantive (not stubs), and are wired correctly. Build passes clean.

One outstanding operational item: the `supabase/migrations/10-photo-storage-bucket.sql` migration file is ready but has not yet been applied to the live Supabase project. Until it is executed, uploads will return a "bucket not found" error. This is not a code gap — it is a deployment step.

The phase goal is architecturally complete. Human verification is needed for camera trigger behavior, scroll behavior on keyboard appearance, and a live upload end-to-end test (gated on migration execution).

---

_Verified: 2026-04-01_
_Verifier: Claude (gsd-verifier)_
