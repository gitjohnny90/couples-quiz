-- ============================================================
-- supabase/migrations/10-photo-storage-bucket.sql
--
-- Purpose: Create the 'daily-photos' Supabase Storage bucket and
--          session-scoped RLS policies for the Daily Photo Challenge.
--
-- This is the app's first Supabase Storage bucket. All previous media
-- (vision board images, drawings) was stored as base64 in JSONB columns.
-- Photos are stored as actual files in Storage for efficiency.
--
-- Storage path convention:
--   {session_id}/{player_id}/{section_id}_{prompt_index}.jpg
--
--   Examples:
--     abc123/player1/morning_0.jpg
--     abc123/player2/morning_0.jpg
--     abc123/player1/evening_2.jpg
--
--   This path structure enables session-scoped RLS via foldername() matching:
--     - (storage.foldername(name))[1] = session_id  (folder depth 1)
--     - (storage.foldername(name))[2] = player_id   (folder depth 2)
--
-- RLS summary:
--   SELECT  — any session member can read all photos in their session
--   INSERT  — session member can only upload to their own player_id folder
--   UPDATE  — session member can only replace photos in their own player_id folder
--   DELETE  — session member can only delete photos in their own player_id folder
--
-- All policies use (SELECT auth.uid()) subquery form for Postgres initPlan caching.
-- ============================================================


-- ============================================================
-- 1. Bucket creation
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'daily-photos',
  'daily-photos',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);


-- ============================================================
-- 2. RLS policies on storage.objects
--    All policies are scoped to bucket_id = 'daily-photos'
-- ============================================================

-- SELECT: any session member can view all photos in their session
CREATE POLICY "Session members can view photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'daily-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT session_id::text FROM user_sessions WHERE user_id = (SELECT auth.uid())
  )
);

-- INSERT: session member can only upload to their own player_id subfolder
CREATE POLICY "Session members can upload own photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'daily-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT session_id::text FROM user_sessions WHERE user_id = (SELECT auth.uid())
  )
  AND (storage.foldername(name))[2] IN (
    SELECT player_id FROM user_sessions WHERE user_id = (SELECT auth.uid())
  )
);

-- UPDATE: session member can only replace photos in their own player_id subfolder
CREATE POLICY "Players can update own photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'daily-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT session_id::text FROM user_sessions WHERE user_id = (SELECT auth.uid())
  )
  AND (storage.foldername(name))[2] IN (
    SELECT player_id FROM user_sessions WHERE user_id = (SELECT auth.uid())
  )
);

-- DELETE: session member can only delete photos in their own player_id subfolder
CREATE POLICY "Players can delete own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'daily-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT session_id::text FROM user_sessions WHERE user_id = (SELECT auth.uid())
  )
  AND (storage.foldername(name))[2] IN (
    SELECT player_id FROM user_sessions WHERE user_id = (SELECT auth.uid())
  )
);
