# Phase 2: PYP Data Migration & Cleanup - Research

**Researched:** 2026-03-11
**Domain:** SQL data backfill, dead-code audit, idempotent migration
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MIG-01 | Legacy Predict Your Partner data is backfilled from responses to predict_partner table | JSONB shape fully confirmed from git history; backfill SQL can be written precisely |
| MIG-02 | Dead code paths referencing old PYP storage in responses table are removed | Codebase grep confirms zero remaining references; dead code is already absent |
| MIG-03 | Migration uses ON CONFLICT DO NOTHING for idempotent reruns | predict_partner table has a unique constraint on (session_id, pack_id, player_id, question_index); ON CONFLICT DO NOTHING is directly applicable |
</phase_requirements>

---

## Summary

Phase 2 has an unusually clear scope because a large portion of the work was already completed in commit 4982f6a (Migrate Predict Your Partner to dedicated predict_partner table). That commit updated `PredictPartnerPage.jsx` and `VaultPage.jsx` to read/write exclusively from the `predict_partner` table. A codebase scan confirms no remaining references to PYP data in the `responses` table anywhere in the frontend code.

The remaining work is two discrete tasks: write and run a SQL backfill that copies any historical PYP rows from `responses` into `predict_partner`, then verify the dead code removal is complete (it already is, but this must be formally confirmed and documented). There are no React code changes required for this phase.

The exact JSONB shape of the legacy `responses.answers` blob has been recovered from git history and is fully known. The migration SQL can be written precisely without a preliminary inspection step. Each legacy row stored `{ responses: [{ownAnswer, prediction}, ...], partnerPredictionMarks: [null|bool, null|bool, null|bool], completedAt: "ISO string" }` with one row per player per pack.

**Primary recommendation:** Write one idempotent SQL migration file; verify against `predict_partner` row counts; confirm dead code is absent with a codebase grep; phase is complete.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| PostgreSQL (via Supabase SQL editor) | 15.x (Supabase managed) | Run the backfill migration | Raw SQL runs as postgres role, bypasses RLS, atomic transaction |
| Supabase dashboard | N/A | Verify row counts and spot-check data after migration | Direct DB visibility without app layer |

### No npm packages needed

This phase has zero frontend code changes. No new libraries are required.

---

## Architecture Patterns

### Pattern 1: Non-Destructive SQL Backfill with ON CONFLICT DO NOTHING

**What:** Copy and transform rows from `responses` into `predict_partner` without deleting the source rows. Use `ON CONFLICT DO NOTHING` so the script is safe to run multiple times.

**When to use:** Any data migration where (a) the target table has a unique constraint, (b) active users may be present, and (c) you want rollback safety by preserving the source rows.

**The exact legacy JSONB shape (confirmed from git history of commit 4982f6a~1):**

Each legacy row in `responses` for a PYP pack looked like:
- `session_id`: UUID
- `pack_id`: `'predict-pack-1'` through `'predict-pack-16'`
- `player_id`: `'player1'` or `'player2'`
- `player_name`: string (not needed in new table)
- `answers`: JSONB with this exact structure:
  ```json
  {
    "responses": [
      { "ownAnswer": "...", "prediction": "..." },
      { "ownAnswer": "...", "prediction": "..." },
      { "ownAnswer": "...", "prediction": "..." }
    ],
    "partnerPredictionMarks": [true, false, null],
    "completedAt": "2026-01-15T10:30:00.000Z"
  }
  ```

**The migration SQL:**

```sql
-- Idempotent backfill: responses (JSONB) → predict_partner (normalized rows)
-- Safe to run multiple times. Does not delete source rows.
-- Run via Supabase SQL editor as postgres role (bypasses RLS).

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
```

**Key details:**
- `generate_series(0, 2)` produces indices 0, 1, 2 (matching `question_index` in the new table — zero-based)
- The `partnerPredictionMarks` JSONB array contains JSON `null`, JSON `true`, or JSON `false` — the CASE statement handles all three
- `ON CONFLICT DO NOTHING` relies on the unique constraint `(session_id, pack_id, player_id, question_index)` which already exists on `predict_partner`
- Running this twice is safe: second run inserts zero rows, returns no errors

**Verification queries to run after backfill:**

```sql
-- Count legacy rows to migrate
SELECT COUNT(*) AS legacy_row_count
FROM responses
WHERE pack_id LIKE 'predict-pack-%';

-- Count resulting predict_partner rows (should be 3x legacy_row_count if all had 3 responses)
SELECT COUNT(*) AS new_row_count
FROM predict_partner;

-- Spot-check: verify a known session's data
SELECT session_id, pack_id, player_id, question_index, own_answer, prediction, prediction_correct, completed_at
FROM predict_partner
ORDER BY session_id, pack_id, player_id, question_index
LIMIT 30;

-- Confirm idempotency: run migration again, should show 0 rows affected
-- (run the full INSERT ... ON CONFLICT DO NOTHING again)
```

### Pattern 2: Dead Code Audit via Grep

**What:** Confirm no production code references `responses` table for PYP pack IDs.

**Current state (confirmed by codebase scan on 2026-03-11):**

The grep for `predict.partner|predict-pack|predictPartner|predict_partner` across all `.jsx` files shows:
- `PredictPartnerPage.jsx` — queries `predict_partner` table only. No reference to `responses`.
- `VaultPage.jsx` — queries `predict_partner` table for completion count. No reference to `responses` for PYP packs.
- `App.jsx` — only a route definition, no data queries.

The grep for `from('responses')` across all source files shows these files use the `responses` table: `MissYouHeart.jsx`, `DrawPage.jsx`, `DrawResultsPage.jsx`, `FunStuffPage.jsx`, `JournalPage.jsx`, `LoveNoteHuntPage.jsx`, `VisionTab.jsx`, `QuizPacksPage.jsx`, `TicTacToePage.jsx`, `StudyTogetherPage.jsx`, `ResultsPage.jsx`, `VaultPage.jsx`. None of these filter for `pack_id LIKE 'predict-pack-%'` — they all use the `responses` table for their own legitimate purposes (quiz answers, drawings, tic-tac-toe, nudge, vision board, study-together, love notes).

**MIG-02 is already satisfied.** The dead code was removed in commit 4982f6a. The task for this phase is to verify that fact formally and document it.

**Grep command to confirm (run during plan execution):**
```bash
grep -r "predict-pack\|predict_partner.*responses\|responses.*predict" src/ --include="*.jsx" --include="*.js"
```
Expected result: zero matches for any file querying `responses` filtered to predict packs.

### Pack IDs in scope for migration

16 pack IDs exist in `src/data/predictPartnerQuestions.js`:
`predict-pack-1` through `predict-pack-16`

The SQL `WHERE pack_id LIKE 'predict-pack-%'` correctly captures all of them. No hardcoded list is needed in the SQL.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Idempotent migration | Custom "check if migrated" flag logic | `ON CONFLICT DO NOTHING` with unique constraint | Postgres handles this atomically with no custom bookkeeping |
| JSONB array iteration | Application-side JS loop to insert rows | `generate_series(0, 2)` in SQL | Single transaction, no round trips, runs in DB without RLS interference |
| Migration verification | App-layer code to count records | SQL `SELECT COUNT(*)` queries in Supabase dashboard | Direct and authoritative; no RLS complications |

---

## Common Pitfalls

### Pitfall 1: Off-by-one in question_index

**What goes wrong:** Using `generate_series(1, 3)` instead of `generate_series(0, 2)` produces question_index values 1, 2, 3 instead of 0, 1, 2. The new `predict_partner` table stores 0-based indices (confirmed: `PredictPartnerPage.jsx` inserts with `question_index: idx` where `idx` is the array index starting at 0).

**How to avoid:** Use `generate_series(0, 2)` and access the JSONB array with `-> idx` directly.

**Warning sign:** After migration, PYP reveal screens show blank answers (because `question_index` mismatches cause the frontend's `pd.responses[row.question_index]` assignment to land at wrong array positions).

### Pitfall 2: JSONB null vs SQL NULL for partnerPredictionMarks

**What goes wrong:** JSON `null` inside a JSONB array is not the same as SQL `NULL`. Casting `(r.answers -> 'partnerPredictionMarks' -> idx)` directly to boolean will fail or produce wrong results for JSON nulls.

**How to avoid:** Use the CASE statement shown in the migration SQL above. JSON `null` serializes as the text `null`, JSON `true` as `true`, JSON `false` as `false`.

**Warning sign:** `prediction_correct` column shows `false` for all entries that should be `null` (unanswered marks).

### Pitfall 3: Running migration with RLS active

**What goes wrong:** If RLS is enabled on `responses` or `predict_partner` before the migration runs, the SQL editor (running as postgres role) is not affected — postgres superuser bypasses RLS. This is not a pitfall. However, running the migration through the JS Supabase client would be blocked by RLS policies.

**How to avoid:** Always run the migration SQL via Supabase SQL editor or migration file (postgres role). Never use the JS client for this backfill.

### Pitfall 4: Assuming there are no legacy rows to migrate

**What goes wrong:** The app has active play testers who used PYP before commit 4982f6a (2026-03-07). Those sessions have data in the `responses` table that the app can no longer display. Assuming the migration is unnecessary because the code is already updated would silently lose historical data.

**How to avoid:** Always run the backfill SQL and verify counts, even if you believe the number of legacy rows is small. The whole point of MIG-01 is to ensure no historical data is lost.

### Pitfall 5: Deleting responses rows prematurely

**What goes wrong:** Dropping old `responses` rows before verifying the migration is correct makes rollback impossible.

**How to avoid:** Leave `responses` rows with `pack_id LIKE 'predict-pack-%'` in place for this milestone. They are orphaned data that the app no longer reads — harmless, and preservable until the milestone is confirmed stable.

---

## Code Examples

### Full migration SQL file

```sql
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
```

### Verification queries

```sql
-- 1. Count source rows
SELECT COUNT(*) AS legacy_rows_in_responses
FROM responses
WHERE pack_id LIKE 'predict-pack-%';

-- 2. Count migrated rows (expect up to 3x source rows, fewer if some packs incomplete)
SELECT COUNT(*) AS rows_in_predict_partner
FROM predict_partner;

-- 3. Break down by pack to spot any gaps
SELECT pack_id, player_id, COUNT(*) AS question_rows
FROM predict_partner
GROUP BY pack_id, player_id
ORDER BY pack_id, player_id;

-- 4. Verify prediction_correct values are sane (no unexpected false for unscored packs)
SELECT
  prediction_correct,
  COUNT(*) AS count
FROM predict_partner
GROUP BY prediction_correct;
-- Expected: mostly NULL (unscored), some true/false (scored packs)
```

### Dead code grep verification

```bash
# Run from repo root — should produce zero output if MIG-02 is satisfied
grep -rn "responses.*predict-pack\|predict-pack.*responses" src/
grep -rn "pack_id.*predict-pack" src/ --include="*.jsx" --include="*.js"
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PYP stored as JSONB blob in generic `responses` table | One row per question in dedicated `predict_partner` table | Commit 4982f6a (2026-03-07) | Enables simple column-level updates (prediction_correct), proper RLS, clean queries |
| `handleMarkPrediction` did read-mutate-write of entire JSONB | Single-row UPDATE on `predict_partner` | Commit 4982f6a | Eliminates race condition between partners marking simultaneously |

---

## Open Questions

None. All information needed to write the plan is confirmed by codebase inspection and git history.

The only runtime unknown is: **how many legacy rows exist in the `responses` table for PYP packs?** This cannot be known without querying the live database. However, the migration SQL handles any number of rows correctly (including zero). The planner should include a verification step to confirm the count after running the backfill.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None configured (CLAUDE.md: "No test runner or linter is configured") |
| Config file | none |
| Quick run command | n/a |
| Full suite command | n/a |

No automated test framework is available. Validation for this phase is entirely SQL-query-based and manual.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MIG-01 | Legacy PYP data backfilled without loss | manual (SQL query) | `SELECT COUNT(*) FROM predict_partner` in Supabase dashboard | n/a |
| MIG-02 | No code references responses for PYP pack IDs | manual (grep) | `grep -rn "predict-pack" src/` | n/a |
| MIG-03 | Migration SQL runs twice without errors or duplicates | manual (SQL re-run) | Re-run migration SQL, verify 0 rows affected | n/a |

### Sampling Rate

- No automated test suite exists for this project.
- Validation is by SQL verification queries and manual grep, executed during plan task execution.

### Wave 0 Gaps

None — no test infrastructure gaps to fill because no test framework is in use. Validation is entirely via SQL queries run in the Supabase dashboard.

---

## Sources

### Primary (HIGH confidence)

- `src/pages/PredictPartnerPage.jsx` (current) — confirmed: all reads/writes use `predict_partner` table, no `responses` reference
- `src/pages/VaultPage.jsx` (current) — confirmed: PYP completion count uses `predict_partner`, not `responses`
- `git show 4982f6a~1:src/pages/PredictPartnerPage.jsx` — exact JSONB shape of legacy `responses.answers` confirmed from pre-migration code
- `git show 4982f6a --stat` — confirmed which files were changed in the migration commit
- `src/data/predictPartnerQuestions.js` — 16 pack IDs confirmed: `predict-pack-1` through `predict-pack-16`
- CLAUDE.md — table schema, `predict_partner` columns confirmed: `session_id, pack_id, player_id, question_index, own_answer, prediction, prediction_correct, completed_at`
- Codebase grep `from('responses')` across all src files — confirmed no PYP-specific `responses` queries remain

### Secondary (MEDIUM confidence)

- `.planning/research/STACK.md` — migration strategy and non-destructive approach documented in prior research
- `.planning/research/ARCHITECTURE.md` — JSONB shape description in Pattern 3 (now confirmed by git inspection)

---

## Metadata

**Confidence breakdown:**
- JSONB shape of legacy data: HIGH — recovered from git history of pre-migration commit
- Dead code status (MIG-02): HIGH — confirmed by direct codebase grep
- Migration SQL correctness: HIGH — derived from known JSONB structure and confirmed unique constraint
- Idempotency (MIG-03): HIGH — `ON CONFLICT DO NOTHING` is standard Postgres, constraint exists on table

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (stable — no active changes expected to PYP data model)
