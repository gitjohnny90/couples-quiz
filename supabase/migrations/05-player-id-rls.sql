-- ============================================================
-- supabase/migrations/05-player-id-rls.sql
--
-- Purpose: Add player_id enforcement to RLS policies on all 9 feature tables.
--
-- What this migration does:
--   1. Drops the existing "partners_access_data" FOR ALL policies from
--      supabase-rls-fix.sql on all 9 feature tables.
--   2. Also drops the per-operation policies on reactions from
--      supabase-rls-policies.sql.
--   3. Re-creates per-operation policies (SELECT / INSERT / UPDATE / DELETE)
--      where INSERT and UPDATE WITH CHECK enforce BOTH session membership
--      AND player_id ownership so neither partner can write rows as the other.
--   4. Fixes the finish_sentence and hot_takes type mismatch: the old FOR ALL
--      policy used bare session_id (uuid) on the left side of IN (... ::text),
--      causing a type error. All new policies use session_id::text consistently.
--
-- Player-id resolution:
--   The user's player_id ('player1' or 'player2') is resolved by joining
--   user_sessions on (user_id, session_id):
--
--     player_id = (
--       SELECT us.player_id FROM public.user_sessions us
--       WHERE us.user_id = (SELECT auth.uid())
--         AND us.session_id = <table>.session_id
--     )
--
-- Special cases:
--   responses   — player_id may also be 'game' (tic-tac-toe) or 'shared'
--                 (study-together). Both partners may write these rows.
--   shared_items — uses added_by instead of player_id for INSERT ownership.
--                  UPDATE/DELETE allow both partners (either can rate a movie).
--   reactions   — already had per-operation policies; replaced with player_id
--                 enforcement on INSERT/UPDATE.
--
-- Performance:
--   All auth.uid() calls use (SELECT auth.uid()) for Postgres initPlan caching.
--
-- Supersedes: supabase-rls-fix.sql policies for these 9 tables
-- ============================================================


-- ============================================================
-- 1. responses
--    Special case: player_id can be 'game' or 'shared' (shared state rows)
--    Both partners must write those rows, so INSERT/UPDATE allow them via OR.
-- ============================================================
BEGIN;

DROP POLICY IF EXISTS "partners_access_data" ON public.responses;

-- SELECT: session membership only (both partners read all session data)
CREATE POLICY "responses_select"
  ON public.responses FOR SELECT
  USING (
    session_id::text IN (
      SELECT session_id::text FROM public.user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- INSERT: must belong to session AND write as own player_id
--         OR writing a shared-state row (game / shared)
CREATE POLICY "responses_insert"
  ON public.responses FOR INSERT
  WITH CHECK (
    session_id::text IN (
      SELECT session_id::text FROM public.user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
    AND (
      player_id = (
        SELECT us.player_id FROM public.user_sessions us
        WHERE us.user_id = (SELECT auth.uid())
          AND us.session_id::text = responses.session_id::text
      )
      OR player_id IN ('game', 'shared')
    )
  );

-- UPDATE: same enforcement as INSERT
CREATE POLICY "responses_update"
  ON public.responses FOR UPDATE
  USING (
    session_id::text IN (
      SELECT session_id::text FROM public.user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
    AND (
      player_id = (
        SELECT us.player_id FROM public.user_sessions us
        WHERE us.user_id = (SELECT auth.uid())
          AND us.session_id::text = responses.session_id::text
      )
      OR player_id IN ('game', 'shared')
    )
  )
  WITH CHECK (
    session_id::text IN (
      SELECT session_id::text FROM public.user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
    AND (
      player_id = (
        SELECT us.player_id FROM public.user_sessions us
        WHERE us.user_id = (SELECT auth.uid())
          AND us.session_id::text = responses.session_id::text
      )
      OR player_id IN ('game', 'shared')
    )
  );

-- DELETE: session membership + own player_id (or shared state)
CREATE POLICY "responses_delete"
  ON public.responses FOR DELETE
  USING (
    session_id::text IN (
      SELECT session_id::text FROM public.user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
    AND (
      player_id = (
        SELECT us.player_id FROM public.user_sessions us
        WHERE us.user_id = (SELECT auth.uid())
          AND us.session_id::text = responses.session_id::text
      )
      OR player_id IN ('game', 'shared')
    )
  );

COMMIT;


-- ============================================================
-- 2. profiles
-- ============================================================
BEGIN;

DROP POLICY IF EXISTS "partners_access_data" ON public.profiles;

CREATE POLICY "profiles_select"
  ON public.profiles FOR SELECT
  USING (
    session_id::text IN (
      SELECT session_id::text FROM public.user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "profiles_insert"
  ON public.profiles FOR INSERT
  WITH CHECK (
    session_id::text IN (
      SELECT session_id::text FROM public.user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
    AND player_id = (
      SELECT us.player_id FROM public.user_sessions us
      WHERE us.user_id = (SELECT auth.uid())
        AND us.session_id::text = profiles.session_id::text
    )
  );

CREATE POLICY "profiles_update"
  ON public.profiles FOR UPDATE
  USING (
    session_id::text IN (
      SELECT session_id::text FROM public.user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
    AND player_id = (
      SELECT us.player_id FROM public.user_sessions us
      WHERE us.user_id = (SELECT auth.uid())
        AND us.session_id::text = profiles.session_id::text
    )
  )
  WITH CHECK (
    session_id::text IN (
      SELECT session_id::text FROM public.user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
    AND player_id = (
      SELECT us.player_id FROM public.user_sessions us
      WHERE us.user_id = (SELECT auth.uid())
        AND us.session_id::text = profiles.session_id::text
    )
  );

CREATE POLICY "profiles_delete"
  ON public.profiles FOR DELETE
  USING (
    session_id::text IN (
      SELECT session_id::text FROM public.user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
    AND player_id = (
      SELECT us.player_id FROM public.user_sessions us
      WHERE us.user_id = (SELECT auth.uid())
        AND us.session_id::text = profiles.session_id::text
    )
  );

COMMIT;


-- ============================================================
-- 3. deep_dive_responses
-- ============================================================
BEGIN;

DROP POLICY IF EXISTS "partners_access_data" ON public.deep_dive_responses;

CREATE POLICY "deep_dive_responses_select"
  ON public.deep_dive_responses FOR SELECT
  USING (
    session_id::text IN (
      SELECT session_id::text FROM public.user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "deep_dive_responses_insert"
  ON public.deep_dive_responses FOR INSERT
  WITH CHECK (
    session_id::text IN (
      SELECT session_id::text FROM public.user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
    AND player_id = (
      SELECT us.player_id FROM public.user_sessions us
      WHERE us.user_id = (SELECT auth.uid())
        AND us.session_id::text = deep_dive_responses.session_id::text
    )
  );

CREATE POLICY "deep_dive_responses_update"
  ON public.deep_dive_responses FOR UPDATE
  USING (
    session_id::text IN (
      SELECT session_id::text FROM public.user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
    AND player_id = (
      SELECT us.player_id FROM public.user_sessions us
      WHERE us.user_id = (SELECT auth.uid())
        AND us.session_id::text = deep_dive_responses.session_id::text
    )
  )
  WITH CHECK (
    session_id::text IN (
      SELECT session_id::text FROM public.user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
    AND player_id = (
      SELECT us.player_id FROM public.user_sessions us
      WHERE us.user_id = (SELECT auth.uid())
        AND us.session_id::text = deep_dive_responses.session_id::text
    )
  );

CREATE POLICY "deep_dive_responses_delete"
  ON public.deep_dive_responses FOR DELETE
  USING (
    session_id::text IN (
      SELECT session_id::text FROM public.user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
    AND player_id = (
      SELECT us.player_id FROM public.user_sessions us
      WHERE us.user_id = (SELECT auth.uid())
        AND us.session_id::text = deep_dive_responses.session_id::text
    )
  );

COMMIT;


-- ============================================================
-- 4. shared_items
--    Special case: uses added_by instead of player_id.
--    INSERT: added_by must match the user's player_id.
--    UPDATE/DELETE: session membership only — either partner can
--    update status/ratings on movies the other person added.
-- ============================================================
BEGIN;

DROP POLICY IF EXISTS "partners_access_data" ON public.shared_items;

CREATE POLICY "shared_items_select"
  ON public.shared_items FOR SELECT
  USING (
    session_id::text IN (
      SELECT session_id::text FROM public.user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- INSERT: added_by must match the authenticated user's player_id
CREATE POLICY "shared_items_insert"
  ON public.shared_items FOR INSERT
  WITH CHECK (
    session_id::text IN (
      SELECT session_id::text FROM public.user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
    AND added_by = (
      SELECT us.player_id FROM public.user_sessions us
      WHERE us.user_id = (SELECT auth.uid())
        AND us.session_id::text = shared_items.session_id::text
    )
  );

-- UPDATE: session membership only (either partner can rate/update status)
CREATE POLICY "shared_items_update"
  ON public.shared_items FOR UPDATE
  USING (
    session_id::text IN (
      SELECT session_id::text FROM public.user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    session_id::text IN (
      SELECT session_id::text FROM public.user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- DELETE: session membership only (either partner can remove)
CREATE POLICY "shared_items_delete"
  ON public.shared_items FOR DELETE
  USING (
    session_id::text IN (
      SELECT session_id::text FROM public.user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
  );

COMMIT;


-- ============================================================
-- 5. love_notes
-- ============================================================
BEGIN;

DROP POLICY IF EXISTS "partners_access_data" ON public.love_notes;

CREATE POLICY "love_notes_select"
  ON public.love_notes FOR SELECT
  USING (
    session_id::text IN (
      SELECT session_id::text FROM public.user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "love_notes_insert"
  ON public.love_notes FOR INSERT
  WITH CHECK (
    session_id::text IN (
      SELECT session_id::text FROM public.user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
    AND player_id = (
      SELECT us.player_id FROM public.user_sessions us
      WHERE us.user_id = (SELECT auth.uid())
        AND us.session_id::text = love_notes.session_id::text
    )
  );

CREATE POLICY "love_notes_update"
  ON public.love_notes FOR UPDATE
  USING (
    session_id::text IN (
      SELECT session_id::text FROM public.user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
    AND player_id = (
      SELECT us.player_id FROM public.user_sessions us
      WHERE us.user_id = (SELECT auth.uid())
        AND us.session_id::text = love_notes.session_id::text
    )
  )
  WITH CHECK (
    session_id::text IN (
      SELECT session_id::text FROM public.user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
    AND player_id = (
      SELECT us.player_id FROM public.user_sessions us
      WHERE us.user_id = (SELECT auth.uid())
        AND us.session_id::text = love_notes.session_id::text
    )
  );

CREATE POLICY "love_notes_delete"
  ON public.love_notes FOR DELETE
  USING (
    session_id::text IN (
      SELECT session_id::text FROM public.user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
    AND player_id = (
      SELECT us.player_id FROM public.user_sessions us
      WHERE us.user_id = (SELECT auth.uid())
        AND us.session_id::text = love_notes.session_id::text
    )
  );

COMMIT;


-- ============================================================
-- 6. reactions
--    Drop old per-operation policies from supabase-rls-policies.sql
--    and the FOR ALL policy from supabase-rls-fix.sql, then recreate
--    with player_id enforcement on INSERT/UPDATE.
-- ============================================================
BEGIN;

DROP POLICY IF EXISTS "partners_access_data"       ON public.reactions;
DROP POLICY IF EXISTS "partners read reactions"     ON public.reactions;
DROP POLICY IF EXISTS "partners write own reactions" ON public.reactions;
DROP POLICY IF EXISTS "partners update own reactions" ON public.reactions;
DROP POLICY IF EXISTS "partners delete own reactions" ON public.reactions;

-- SELECT: session membership (both partners see all reactions)
CREATE POLICY "reactions_select"
  ON public.reactions FOR SELECT
  USING (
    session_id::text IN (
      SELECT session_id::text FROM public.user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- INSERT: session membership + player_id ownership
CREATE POLICY "reactions_insert"
  ON public.reactions FOR INSERT
  WITH CHECK (
    session_id::text IN (
      SELECT session_id::text FROM public.user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
    AND player_id = (
      SELECT us.player_id FROM public.user_sessions us
      WHERE us.user_id = (SELECT auth.uid())
        AND us.session_id::text = reactions.session_id::text
    )
  );

-- UPDATE: session membership + player_id ownership (toggle/switch emoji)
CREATE POLICY "reactions_update"
  ON public.reactions FOR UPDATE
  USING (
    session_id::text IN (
      SELECT session_id::text FROM public.user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
    AND player_id = (
      SELECT us.player_id FROM public.user_sessions us
      WHERE us.user_id = (SELECT auth.uid())
        AND us.session_id::text = reactions.session_id::text
    )
  )
  WITH CHECK (
    session_id::text IN (
      SELECT session_id::text FROM public.user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
    AND player_id = (
      SELECT us.player_id FROM public.user_sessions us
      WHERE us.user_id = (SELECT auth.uid())
        AND us.session_id::text = reactions.session_id::text
    )
  );

-- DELETE: session membership + player_id (can only remove own reactions)
CREATE POLICY "reactions_delete"
  ON public.reactions FOR DELETE
  USING (
    session_id::text IN (
      SELECT session_id::text FROM public.user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
    AND player_id = (
      SELECT us.player_id FROM public.user_sessions us
      WHERE us.user_id = (SELECT auth.uid())
        AND us.session_id::text = reactions.session_id::text
    )
  );

COMMIT;


-- ============================================================
-- 7. predict_partner
-- ============================================================
BEGIN;

DROP POLICY IF EXISTS "partners_access_data" ON public.predict_partner;

CREATE POLICY "predict_partner_select"
  ON public.predict_partner FOR SELECT
  USING (
    session_id::text IN (
      SELECT session_id::text FROM public.user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "predict_partner_insert"
  ON public.predict_partner FOR INSERT
  WITH CHECK (
    session_id::text IN (
      SELECT session_id::text FROM public.user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
    AND player_id = (
      SELECT us.player_id FROM public.user_sessions us
      WHERE us.user_id = (SELECT auth.uid())
        AND us.session_id::text = predict_partner.session_id::text
    )
  );

CREATE POLICY "predict_partner_update"
  ON public.predict_partner FOR UPDATE
  USING (
    session_id::text IN (
      SELECT session_id::text FROM public.user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
    AND player_id = (
      SELECT us.player_id FROM public.user_sessions us
      WHERE us.user_id = (SELECT auth.uid())
        AND us.session_id::text = predict_partner.session_id::text
    )
  )
  WITH CHECK (
    session_id::text IN (
      SELECT session_id::text FROM public.user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
    AND player_id = (
      SELECT us.player_id FROM public.user_sessions us
      WHERE us.user_id = (SELECT auth.uid())
        AND us.session_id::text = predict_partner.session_id::text
    )
  );

CREATE POLICY "predict_partner_delete"
  ON public.predict_partner FOR DELETE
  USING (
    session_id::text IN (
      SELECT session_id::text FROM public.user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
    AND player_id = (
      SELECT us.player_id FROM public.user_sessions us
      WHERE us.user_id = (SELECT auth.uid())
        AND us.session_id::text = predict_partner.session_id::text
    )
  );

COMMIT;


-- ============================================================
-- 8. finish_sentence
--    Type fix (SEC-11): old policy used bare session_id (uuid) on the
--    left side of IN (SELECT session_id::text ...) causing a type error.
--    All clauses here use session_id::text consistently.
-- ============================================================
BEGIN;

DROP POLICY IF EXISTS "partners_access_data" ON public.finish_sentence;

CREATE POLICY "finish_sentence_select"
  ON public.finish_sentence FOR SELECT
  USING (
    session_id::text IN (
      SELECT session_id::text FROM public.user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "finish_sentence_insert"
  ON public.finish_sentence FOR INSERT
  WITH CHECK (
    session_id::text IN (
      SELECT session_id::text FROM public.user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
    AND player_id = (
      SELECT us.player_id FROM public.user_sessions us
      WHERE us.user_id = (SELECT auth.uid())
        AND us.session_id::text = finish_sentence.session_id::text
    )
  );

CREATE POLICY "finish_sentence_update"
  ON public.finish_sentence FOR UPDATE
  USING (
    session_id::text IN (
      SELECT session_id::text FROM public.user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
    AND player_id = (
      SELECT us.player_id FROM public.user_sessions us
      WHERE us.user_id = (SELECT auth.uid())
        AND us.session_id::text = finish_sentence.session_id::text
    )
  )
  WITH CHECK (
    session_id::text IN (
      SELECT session_id::text FROM public.user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
    AND player_id = (
      SELECT us.player_id FROM public.user_sessions us
      WHERE us.user_id = (SELECT auth.uid())
        AND us.session_id::text = finish_sentence.session_id::text
    )
  );

CREATE POLICY "finish_sentence_delete"
  ON public.finish_sentence FOR DELETE
  USING (
    session_id::text IN (
      SELECT session_id::text FROM public.user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
    AND player_id = (
      SELECT us.player_id FROM public.user_sessions us
      WHERE us.user_id = (SELECT auth.uid())
        AND us.session_id::text = finish_sentence.session_id::text
    )
  );

COMMIT;


-- ============================================================
-- 9. hot_takes
--    Type fix (SEC-11): same uuid/text mismatch as finish_sentence.
--    All clauses use session_id::text consistently.
-- ============================================================
BEGIN;

DROP POLICY IF EXISTS "partners_access_data" ON public.hot_takes;

CREATE POLICY "hot_takes_select"
  ON public.hot_takes FOR SELECT
  USING (
    session_id::text IN (
      SELECT session_id::text FROM public.user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "hot_takes_insert"
  ON public.hot_takes FOR INSERT
  WITH CHECK (
    session_id::text IN (
      SELECT session_id::text FROM public.user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
    AND player_id = (
      SELECT us.player_id FROM public.user_sessions us
      WHERE us.user_id = (SELECT auth.uid())
        AND us.session_id::text = hot_takes.session_id::text
    )
  );

CREATE POLICY "hot_takes_update"
  ON public.hot_takes FOR UPDATE
  USING (
    session_id::text IN (
      SELECT session_id::text FROM public.user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
    AND player_id = (
      SELECT us.player_id FROM public.user_sessions us
      WHERE us.user_id = (SELECT auth.uid())
        AND us.session_id::text = hot_takes.session_id::text
    )
  )
  WITH CHECK (
    session_id::text IN (
      SELECT session_id::text FROM public.user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
    AND player_id = (
      SELECT us.player_id FROM public.user_sessions us
      WHERE us.user_id = (SELECT auth.uid())
        AND us.session_id::text = hot_takes.session_id::text
    )
  );

CREATE POLICY "hot_takes_delete"
  ON public.hot_takes FOR DELETE
  USING (
    session_id::text IN (
      SELECT session_id::text FROM public.user_sessions
      WHERE user_id = (SELECT auth.uid())
    )
    AND player_id = (
      SELECT us.player_id FROM public.user_sessions us
      WHERE us.user_id = (SELECT auth.uid())
        AND us.session_id::text = hot_takes.session_id::text
    )
  );

COMMIT;
