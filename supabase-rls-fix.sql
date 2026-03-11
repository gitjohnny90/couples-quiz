-- ============================================================
-- supabase-rls-fix.sql
--
-- Current state: All 11 tables have RLS enabled BUT each has an
-- "Allow all" policy (qual = true) alongside the proper session-scoped
-- policy. The "Allow all" policies negate all security.
--
-- This script:
--   1. Creates missing performance indexes
--   2. Drops ALL existing policies (both "Allow all" and old session policies)
--   3. Re-creates proper session-scoped policies with (SELECT auth.uid()) optimization
-- ============================================================

-- ============================================================
-- STEP 1: Performance Indexes
-- ============================================================

-- Critical for RLS subquery performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON public.user_sessions (session_id);

-- Feature table session_id indexes (some may already exist via unique constraints)
CREATE INDEX IF NOT EXISTS idx_responses_session_id ON public.responses (session_id);
CREATE INDEX IF NOT EXISTS idx_profiles_session_id ON public.profiles (session_id);
CREATE INDEX IF NOT EXISTS idx_deep_dive_responses_session_id ON public.deep_dive_responses (session_id);
CREATE INDEX IF NOT EXISTS idx_shared_items_session_id ON public.shared_items (session_id);
CREATE INDEX IF NOT EXISTS idx_love_notes_session_id ON public.love_notes (session_id);
CREATE INDEX IF NOT EXISTS idx_reactions_session_id ON public.reactions (session_id);
CREATE INDEX IF NOT EXISTS idx_predict_partner_session_id ON public.predict_partner (session_id);
CREATE INDEX IF NOT EXISTS idx_finish_sentence_session_id ON public.finish_sentence (session_id);
CREATE INDEX IF NOT EXISTS idx_hot_takes_session_id ON public.hot_takes (session_id);

-- ============================================================
-- STEP 2: Drop ALL existing policies (clean slate)
-- ============================================================

-- deep_dive_responses
DROP POLICY IF EXISTS "Allow all access to deep_dive_responses" ON public.deep_dive_responses;
DROP POLICY IF EXISTS "Users access own session data" ON public.deep_dive_responses;

-- finish_sentence
DROP POLICY IF EXISTS "Allow all for now" ON public.finish_sentence;
DROP POLICY IF EXISTS "Users access own session data" ON public.finish_sentence;

-- hot_takes
DROP POLICY IF EXISTS "Allow all for now" ON public.hot_takes;
DROP POLICY IF EXISTS "Users access own session data" ON public.hot_takes;

-- love_notes
DROP POLICY IF EXISTS "Allow all" ON public.love_notes;
DROP POLICY IF EXISTS "Users access own session data" ON public.love_notes;

-- predict_partner
DROP POLICY IF EXISTS "Allow all for now" ON public.predict_partner;
DROP POLICY IF EXISTS "Users access own session data" ON public.predict_partner;

-- profiles
DROP POLICY IF EXISTS "Allow all access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users access own session data" ON public.profiles;

-- reactions
DROP POLICY IF EXISTS "Allow all" ON public.reactions;
DROP POLICY IF EXISTS "Users access own session data" ON public.reactions;

-- responses
DROP POLICY IF EXISTS "Allow all access to responses" ON public.responses;
DROP POLICY IF EXISTS "Users access own session data" ON public.responses;

-- sessions
DROP POLICY IF EXISTS "Allow all access to sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users access own session data" ON public.sessions;

-- shared_items
DROP POLICY IF EXISTS "Allow all access to shared_items" ON public.shared_items;
DROP POLICY IF EXISTS "Users access own session data" ON public.shared_items;

-- user_sessions
DROP POLICY IF EXISTS "Users can manage their own session links" ON public.user_sessions;

-- ============================================================
-- STEP 3: Create proper policies with (SELECT auth.uid()) optimization
-- ============================================================

-- user_sessions: users access their own rows only
CREATE POLICY "users_own_links"
  ON public.user_sessions FOR ALL
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- sessions: both partners access via user_sessions join (uses id, not session_id)
CREATE POLICY "partners_access_session"
  ON public.sessions FOR ALL
  USING (id::text IN (SELECT session_id::text FROM user_sessions WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (id::text IN (SELECT session_id::text FROM user_sessions WHERE user_id = (SELECT auth.uid())));

-- Pattern: session_id IN (user's sessions) — applies to 9 feature tables
CREATE POLICY "partners_access_data"
  ON public.responses FOR ALL
  USING (session_id::text IN (SELECT session_id::text FROM user_sessions WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (session_id::text IN (SELECT session_id::text FROM user_sessions WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "partners_access_data"
  ON public.profiles FOR ALL
  USING (session_id::text IN (SELECT session_id::text FROM user_sessions WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (session_id::text IN (SELECT session_id::text FROM user_sessions WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "partners_access_data"
  ON public.deep_dive_responses FOR ALL
  USING (session_id::text IN (SELECT session_id::text FROM user_sessions WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (session_id::text IN (SELECT session_id::text FROM user_sessions WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "partners_access_data"
  ON public.shared_items FOR ALL
  USING (session_id::text IN (SELECT session_id::text FROM user_sessions WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (session_id::text IN (SELECT session_id::text FROM user_sessions WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "partners_access_data"
  ON public.love_notes FOR ALL
  USING (session_id::text IN (SELECT session_id::text FROM user_sessions WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (session_id::text IN (SELECT session_id::text FROM user_sessions WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "partners_access_data"
  ON public.reactions FOR ALL
  USING (session_id::text IN (SELECT session_id::text FROM user_sessions WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (session_id::text IN (SELECT session_id::text FROM user_sessions WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "partners_access_data"
  ON public.predict_partner FOR ALL
  USING (session_id::text IN (SELECT session_id::text FROM user_sessions WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (session_id::text IN (SELECT session_id::text FROM user_sessions WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "partners_access_data"
  ON public.finish_sentence FOR ALL
  USING (session_id IN (SELECT session_id::text FROM user_sessions WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (session_id IN (SELECT session_id::text FROM user_sessions WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "partners_access_data"
  ON public.hot_takes FOR ALL
  USING (session_id IN (SELECT session_id::text FROM user_sessions WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (session_id IN (SELECT session_id::text FROM user_sessions WHERE user_id = (SELECT auth.uid())));
