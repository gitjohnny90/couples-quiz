-- Migration: backfill legacy PYP data from responses to predict_partner
-- Phase 2: PYP Data Migration & Cleanup
-- Run via Supabase SQL editor (postgres role, bypasses RLS)
-- Idempotent: safe to run multiple times

BEGIN;

INSERT INTO predict_partner (
  session_id,
  pack_id,
  player_id,
  question_index,
  own_answer,
  prediction,
  prediction_correct,
  completed_at
)
SELECT
  r.session_id,
  r.pack_id,
  r.player_id,
  idx AS question_index,
  (r.answers -> 'responses' -> idx ->> 'ownAnswer')  AS own_answer,
  (r.answers -> 'responses' -> idx ->> 'prediction') AS prediction,
  CASE
    WHEN (r.answers -> 'partnerPredictionMarks' -> idx) = 'null'::jsonb THEN NULL
    WHEN (r.answers -> 'partnerPredictionMarks' -> idx)::text = 'true'  THEN true
    WHEN (r.answers -> 'partnerPredictionMarks' -> idx)::text = 'false' THEN false
    ELSE NULL
  END AS prediction_correct,
  (r.answers ->> 'completedAt')::timestamptz AS completed_at
FROM responses r,
     generate_series(0, 2) AS idx
WHERE r.pack_id LIKE 'predict-pack-%'
  AND r.answers -> 'responses' IS NOT NULL
  AND (r.answers -> 'responses' -> idx) IS NOT NULL
ON CONFLICT (session_id, pack_id, player_id, question_index)
DO NOTHING;

COMMIT;
