-- Verification queries for PYP backfill migration
-- Run each SELECT individually in Supabase SQL editor

-- 1. Count legacy source rows
SELECT COUNT(*) AS legacy_rows_in_responses
FROM responses
WHERE pack_id LIKE 'predict-pack-%';

-- 2. Count migrated rows (expect up to 3x legacy rows)
SELECT COUNT(*) AS rows_in_predict_partner
FROM predict_partner;

-- 3. Breakdown by pack for gap detection
SELECT pack_id, player_id, COUNT(*) AS question_rows
FROM predict_partner
GROUP BY pack_id, player_id
ORDER BY pack_id, player_id;

-- 4. Verify prediction_correct distribution is sane
SELECT
  prediction_correct,
  COUNT(*) AS count
FROM predict_partner
GROUP BY prediction_correct;
