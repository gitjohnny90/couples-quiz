-- ============================================================
-- supabase-rls-indexes.sql
-- Run this AFTER supabase-rls-audit.sql and BEFORE supabase-rls-policies.sql
--
-- Purpose: Create performance indexes that support the RLS subquery pattern.
--
-- The RLS policies in supabase-rls-policies.sql use the following subquery
-- on every authenticated request:
--
--   session_id IN (
--     SELECT session_id FROM user_sessions
--     WHERE user_id = (SELECT auth.uid())
--   )
--
-- Without indexes, Postgres performs sequential scans on user_sessions for
-- every row evaluated by the policy. These indexes convert those scans into
-- fast index lookups, which is critical for tables with many rows.
--
-- All statements use CREATE INDEX IF NOT EXISTS for idempotency — safe to
-- re-run without error if indexes already exist (e.g., from a previous run).
--
-- Total: 11 indexes
--   2 on user_sessions (user_id lookup + session_id join)
--   9 on feature tables (session_id column used in USING/WITH CHECK clauses)
-- ============================================================


-- ============================================================
-- user_sessions indexes
-- These two indexes support the core subquery in every session-scoped policy:
--   WHERE user_id = (SELECT auth.uid())   → idx_user_sessions_user_id
--   SELECT session_id FROM user_sessions  → idx_user_sessions_session_id
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id
  ON public.user_sessions (user_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id
  ON public.user_sessions (session_id);


-- ============================================================
-- Feature table session_id indexes
-- One index per table. Each supports the IN subquery in the USING and
-- WITH CHECK clauses of that table's policy.
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_responses_session_id
  ON public.responses (session_id);

CREATE INDEX IF NOT EXISTS idx_profiles_session_id
  ON public.profiles (session_id);

CREATE INDEX IF NOT EXISTS idx_deep_dive_responses_session_id
  ON public.deep_dive_responses (session_id);

CREATE INDEX IF NOT EXISTS idx_shared_items_session_id
  ON public.shared_items (session_id);

CREATE INDEX IF NOT EXISTS idx_love_notes_session_id
  ON public.love_notes (session_id);

CREATE INDEX IF NOT EXISTS idx_reactions_session_id
  ON public.reactions (session_id);

CREATE INDEX IF NOT EXISTS idx_predict_partner_session_id
  ON public.predict_partner (session_id);

CREATE INDEX IF NOT EXISTS idx_finish_sentence_session_id
  ON public.finish_sentence (session_id);

CREATE INDEX IF NOT EXISTS idx_hot_takes_session_id
  ON public.hot_takes (session_id);
