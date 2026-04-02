---
phase: 10
plan: 01
subsystem: storage
tags: [supabase-storage, photo-upload, rls, utils]
dependency_graph:
  requires: []
  provides: [daily-photos bucket SQL, photoUtils.js module]
  affects: [Phase 10 Plan 02 (PhotoCaptureInput UI component)]
tech_stack:
  added: [Supabase Storage (first bucket in app)]
  patterns: [session-scoped storage RLS via foldername(), supabase-as-param utility pattern]
key_files:
  created:
    - supabase/migrations/10-photo-storage-bucket.sql
    - src/utils/photoUtils.js
  modified: []
decisions:
  - "supabase client passed as parameter to photoUtils functions (not imported) for testability and no circular deps"
  - "upsert: true in uploadPhoto so retake/replace works without a separate delete step"
  - "compressImage returns Blob (not base64 data URL) — required for Supabase Storage upload API"
  - "maxWidth 800 (not 400 like VisionTab) per UI-SPEC requirement"
metrics:
  duration: 76s
  tasks_completed: 2
  files_created: 2
  files_modified: 0
  completed_date: 2026-04-02
---

# Phase 10 Plan 01: Storage & Photo Capture Infrastructure Summary

**One-liner:** Supabase Storage `daily-photos` bucket with 4 session-scoped RLS policies, plus a `photoUtils.js` module with compress-to-Blob, Storage upload (upsert), signed URL, and local preview helpers.

---

## What Was Built

### Task 1: `supabase/migrations/10-photo-storage-bucket.sql`

The app's first Supabase Storage bucket. All previous media (vision board images, drawings) was stored as base64 JSONB; this bucket stores actual files.

- Bucket `daily-photos`: private (`public: false`), 5 MB limit, JPEG/PNG/WebP only
- Storage path convention: `{session_id}/{player_id}/{section_id}_{prompt_index}.jpg`
- 4 RLS policies on `storage.objects` all scoped to `bucket_id = 'daily-photos'`:
  - SELECT: any session member reads all session photos (`foldername(name)[1]` = session_id)
  - INSERT: session member uploads only to own player_id folder (`foldername(name)[2]` = player_id)
  - UPDATE: session member replaces only own player_id folder photos
  - DELETE: session member deletes only own player_id folder photos
- All policies use `(SELECT auth.uid())` subquery form for Postgres initPlan caching

### Task 2: `src/utils/photoUtils.js`

Five exported functions, supabase client passed as a parameter (not imported):

| Function | Purpose |
|----------|---------|
| `compressImage(file, maxWidth=800)` | Canvas compress to JPEG Blob at max 800px |
| `uploadPhoto(supabase, sessionId, playerId, sectionId, promptIndex, file)` | Compress + upsert to Storage, returns `{ path, error }` |
| `getPhotoUrl(supabase, path, expiresIn=3600)` | Create signed URL (1h default), returns Supabase response |
| `createPreviewUrl(file)` | `URL.createObjectURL` for instant local preview |
| `revokePreviewUrl(url)` | `URL.revokeObjectURL` for cleanup, safe on null/non-blob URLs |

---

## Commits

| Task | Commit | Message |
|------|--------|---------|
| Task 1 | a4ae000 | feat(10-01): create daily-photos storage bucket and RLS migration SQL |
| Task 2 | 4c27a3e | feat(10-01): add photoUtils.js with compress, upload, and URL helpers |

---

## Verification Results

- `grep -c "CREATE POLICY" 10-photo-storage-bucket.sql` → **4** (pass)
- `grep -c "export" photoUtils.js` → **5** (pass)
- No direct `import { supabase }` in photoUtils.js (pass)
- `npm run build` → **success** (pass)

---

## Deviations from Plan

None — plan executed exactly as written. The migration SQL file was already partially created (untracked in git from prior work); it matched the plan spec exactly, so no changes were needed.

---

## Self-Check: PASSED

- [x] `supabase/migrations/10-photo-storage-bucket.sql` exists — FOUND
- [x] `src/utils/photoUtils.js` exists — FOUND
- [x] commit a4ae000 exists
- [x] commit 4c27a3e exists
- [x] Build passes
