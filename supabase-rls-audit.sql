-- ============================================================
-- supabase-rls-audit.sql
-- Run this BEFORE supabase-rls-indexes.sql or supabase-rls-policies.sql
--
-- Purpose: Snapshot the current RLS state of all public tables.
-- Run in the Supabase SQL Editor (it runs as postgres superuser,
-- so it bypasses RLS and shows the true policy state).
--
-- What to look for:
--   - Tables with rowsecurity = true already → check pg_policies below
--     for any stale or conflicting policies that must be DROPped before
--     running supabase-rls-policies.sql (or the CREATE POLICY will fail
--     with "policy already exists").
--   - Tables with rowsecurity = false → these are unprotected and will
--     be secured by supabase-rls-policies.sql.
--   - forcerowsecurity = true → superuser queries are also policy-gated
--     (uncommon; usually false for Supabase projects).
-- ============================================================


-- ============================================================
-- Query 1: RLS status for all public tables
-- ============================================================
-- Shows which tables currently have RLS enabled.
-- rowsecurity = true means RLS is on (queries return empty if no policy exists).
-- rowsecurity = false means the table is currently open to all authenticated users.
SELECT
  schemaname,
  tablename,
  rowsecurity,
  forcerowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;


-- ============================================================
-- Query 2: Existing RLS policies on public tables
-- ============================================================
-- Shows every policy currently deployed. Review this before running
-- supabase-rls-policies.sql.
--
-- If any policy names match what supabase-rls-policies.sql will create
-- (e.g., "partners access own session"), you must DROP them first:
--   DROP POLICY "partners access own session" ON public.<table_name>;
--
-- cmd values: r = SELECT, a = INSERT, w = UPDATE, d = DELETE, * = ALL
-- qual = USING clause (applied to existing rows)
-- with_check = WITH CHECK clause (applied to new/updated rows)
SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;


-- ============================================================
-- Query 3: Existing indexes on session_id and user_id columns
-- ============================================================
-- Shows which performance indexes already exist.
-- supabase-rls-indexes.sql uses CREATE INDEX IF NOT EXISTS, so duplicate
-- runs are safe. Use this query to verify indexes after deployment.
--
-- Expected after running supabase-rls-indexes.sql:
--   - idx_user_sessions_user_id
--   - idx_user_sessions_session_id
--   - idx_<table>_session_id for each of the 9 feature tables
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    indexname LIKE '%session_id%'
    OR indexname LIKE '%user_id%'
  )
ORDER BY tablename, indexname;
