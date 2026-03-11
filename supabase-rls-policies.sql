-- ============================================================
-- supabase-rls-policies.sql
-- Run this LAST — after supabase-rls-audit.sql and supabase-rls-indexes.sql
--
-- Purpose: Enable Row Level Security and deploy access policies
-- atomically for all 11 tables in the couples quiz app.
--
-- Run order:
--   1. supabase-rls-audit.sql   — snapshot existing RLS state; DROP any
--                                  stale policies whose names conflict with
--                                  the ones below before proceeding
--   2. supabase-rls-indexes.sql — create performance indexes for subqueries
--   3. supabase-rls-policies.sql (this file) — enable RLS + deploy policies
--
-- Atomicity (SEC-05):
--   Each table's ENABLE and CREATE POLICY statements are wrapped in a
--   BEGIN/COMMIT block. This means RLS is never enabled on a table without
--   its policy already in place — no window of "RLS on, policy missing"
--   that would cause authenticated queries to return empty rows silently.
--
-- Performance (SEC-02):
--   All auth.uid() calls are written as (SELECT auth.uid()) to trigger
--   Postgres's initPlan optimization. This evaluates the subquery once per
--   statement rather than once per row, giving 100x+ improvement on large
--   tables per Supabase performance documentation.
--
-- SEC-04 note:
--   Drawing data is protected by the responses table policy below.
--   The app stores drawings as base64 PNG inside responses.answers JSONB
--   (DrawPage.jsx: supabase.from('responses').upsert({answers: {drawing: ...}})).
--   No Supabase Storage buckets exist in this project — SEC-04 is fully
--   addressed by the responses table RLS policy.
--
-- Tables covered (11 total):
--   user_sessions, sessions, responses, profiles, deep_dive_responses,
--   shared_items, love_notes, reactions, predict_partner, finish_sentence,
--   hot_takes
-- ============================================================


-- ============================================================
-- Section 1: user_sessions table (Pattern 3 — own rows only)
-- Deployed FIRST because all session-scoped policies on other tables
-- depend on user_sessions being queryable by authenticated users.
-- Without this policy in place, the subquery in every other table's
-- USING clause would return empty, locking out all data.
-- ============================================================
BEGIN;

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can read their own link row (needed for session resume on login)
CREATE POLICY "users read own link"
ON public.user_sessions
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- Users can insert their own link row (on session join/create)
CREATE POLICY "users insert own link"
ON public.user_sessions
FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

-- No UPDATE or DELETE: user_sessions rows are written once on join

COMMIT;


-- ============================================================
-- Section 2: sessions table (Pattern 2 — both player UIDs)
-- The sessions table stores player1_user_id and player2_user_id directly
-- rather than a session_id foreign key, so the policy checks those columns.
-- Both partners must be able to read/update the shared session row or they
-- cannot see each other's names and status (SEC-03).
-- ============================================================
BEGIN;

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Both partners can read their shared session row
CREATE POLICY "both partners read session"
ON public.sessions
FOR SELECT
TO authenticated
USING (
  player1_user_id = (SELECT auth.uid())
  OR player2_user_id = (SELECT auth.uid())
);

-- Only player1 creates the session row (player2 joins via invite code)
CREATE POLICY "player1 inserts session"
ON public.sessions
FOR INSERT
TO authenticated
WITH CHECK (
  player1_user_id = (SELECT auth.uid())
);

-- Both partners can update session metadata (e.g., player2 sets their name)
CREATE POLICY "partners update session"
ON public.sessions
FOR UPDATE
TO authenticated
USING (
  player1_user_id = (SELECT auth.uid())
  OR player2_user_id = (SELECT auth.uid())
)
WITH CHECK (
  player1_user_id = (SELECT auth.uid())
  OR player2_user_id = (SELECT auth.uid())
);

-- No DELETE: sessions are permanent records

COMMIT;


-- ============================================================
-- Section 3: Standard session-scoped tables (Pattern 1 — FOR ALL)
-- Applies to all feature tables that carry session_id as their coupling key.
-- A single FOR ALL policy covers SELECT, INSERT, UPDATE, and DELETE in one
-- statement. The IN subquery through user_sessions is the single source of
-- truth for session membership.
--
-- Tables: responses, profiles, deep_dive_responses, shared_items, love_notes,
--         predict_partner, finish_sentence, hot_takes
-- ============================================================

-- responses table
-- Note: SEC-04 — drawing data stored as base64 in answers JSONB is fully
-- protected by this policy (no Supabase Storage buckets exist in this project)
BEGIN;

ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partners access own session"
ON public.responses
FOR ALL
TO authenticated
USING (
  session_id IN (
    SELECT session_id FROM public.user_sessions
    WHERE user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  session_id IN (
    SELECT session_id FROM public.user_sessions
    WHERE user_id = (SELECT auth.uid())
  )
);

COMMIT;


-- profiles table
BEGIN;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partners access own session"
ON public.profiles
FOR ALL
TO authenticated
USING (
  session_id IN (
    SELECT session_id FROM public.user_sessions
    WHERE user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  session_id IN (
    SELECT session_id FROM public.user_sessions
    WHERE user_id = (SELECT auth.uid())
  )
);

COMMIT;


-- deep_dive_responses table
BEGIN;

ALTER TABLE public.deep_dive_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partners access own session"
ON public.deep_dive_responses
FOR ALL
TO authenticated
USING (
  session_id IN (
    SELECT session_id FROM public.user_sessions
    WHERE user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  session_id IN (
    SELECT session_id FROM public.user_sessions
    WHERE user_id = (SELECT auth.uid())
  )
);

COMMIT;


-- shared_items table
BEGIN;

ALTER TABLE public.shared_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partners access own session"
ON public.shared_items
FOR ALL
TO authenticated
USING (
  session_id IN (
    SELECT session_id FROM public.user_sessions
    WHERE user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  session_id IN (
    SELECT session_id FROM public.user_sessions
    WHERE user_id = (SELECT auth.uid())
  )
);

COMMIT;


-- love_notes table
-- Note: Table name is love_notes (not love_note_games/love_note_guesses —
-- confirmed from LoveNoteHuntPage.jsx codebase scan)
BEGIN;

ALTER TABLE public.love_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partners access own session"
ON public.love_notes
FOR ALL
TO authenticated
USING (
  session_id IN (
    SELECT session_id FROM public.user_sessions
    WHERE user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  session_id IN (
    SELECT session_id FROM public.user_sessions
    WHERE user_id = (SELECT auth.uid())
  )
);

COMMIT;


-- predict_partner table
BEGIN;

ALTER TABLE public.predict_partner ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partners access own session"
ON public.predict_partner
FOR ALL
TO authenticated
USING (
  session_id IN (
    SELECT session_id FROM public.user_sessions
    WHERE user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  session_id IN (
    SELECT session_id FROM public.user_sessions
    WHERE user_id = (SELECT auth.uid())
  )
);

COMMIT;


-- finish_sentence table
BEGIN;

ALTER TABLE public.finish_sentence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partners access own session"
ON public.finish_sentence
FOR ALL
TO authenticated
USING (
  session_id IN (
    SELECT session_id FROM public.user_sessions
    WHERE user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  session_id IN (
    SELECT session_id FROM public.user_sessions
    WHERE user_id = (SELECT auth.uid())
  )
);

COMMIT;


-- hot_takes table
BEGIN;

ALTER TABLE public.hot_takes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partners access own session"
ON public.hot_takes
FOR ALL
TO authenticated
USING (
  session_id IN (
    SELECT session_id FROM public.user_sessions
    WHERE user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  session_id IN (
    SELECT session_id FROM public.user_sessions
    WHERE user_id = (SELECT auth.uid())
  )
);

COMMIT;


-- ============================================================
-- Section 4: reactions table (Pattern 4 — separate per-operation policies)
-- Reactions require both partners to read all reactions in their session
-- (each player sees the other's emoji). Write operations are session-scoped
-- through user_sessions — player_id strings ('player1'/'player2') cannot be
-- compared to auth.uid() UUIDs, so session membership is the write gate.
-- ============================================================
BEGIN;

ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- Both partners read all reactions in their shared session
CREATE POLICY "partners read reactions"
ON public.reactions
FOR SELECT
TO authenticated
USING (
  session_id IN (
    SELECT session_id FROM public.user_sessions
    WHERE user_id = (SELECT auth.uid())
  )
);

-- Partners insert reactions for their own session
CREATE POLICY "partners write own reactions"
ON public.reactions
FOR INSERT
TO authenticated
WITH CHECK (
  session_id IN (
    SELECT session_id FROM public.user_sessions
    WHERE user_id = (SELECT auth.uid())
  )
);

-- Partners update their own reactions (toggle/switch emoji)
CREATE POLICY "partners update own reactions"
ON public.reactions
FOR UPDATE
TO authenticated
USING (
  session_id IN (
    SELECT session_id FROM public.user_sessions
    WHERE user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  session_id IN (
    SELECT session_id FROM public.user_sessions
    WHERE user_id = (SELECT auth.uid())
  )
);

-- Partners delete their own reactions (remove emoji)
CREATE POLICY "partners delete own reactions"
ON public.reactions
FOR DELETE
TO authenticated
USING (
  session_id IN (
    SELECT session_id FROM public.user_sessions
    WHERE user_id = (SELECT auth.uid())
  )
);

COMMIT;


-- ============================================================
-- SEC-04 confirmation (end of file)
-- Drawing data is protected by the responses table policy above.
-- The app stores drawings as base64 PNG data inside responses.answers JSONB
-- (DrawPage.jsx: supabase.from('responses').upsert({answers: {drawing: drawingData}})).
-- No Supabase Storage buckets exist in this project, so no bucket-level
-- access control is needed. The responses table RLS policy above fully
-- satisfies SEC-04.
-- ============================================================
