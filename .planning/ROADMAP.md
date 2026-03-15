# Roadmap: The Us Quiz

## Milestones

- ✅ **v1.0 Polish & Security** - Phases 1-4 (shipped 2026-03-12)
- 🚧 **v1.1 Audit Remediation** - Phases 5-8 (in progress)

## Phases

<details>
<summary>✅ v1.0 Polish & Security (Phases 1-4) - SHIPPED 2026-03-12</summary>

### Phase 1: RLS Audit & Policy Deployment
**Goal**: Users can only access data belonging to their own session — no cross-session data leakage via the Supabase REST API
**Depends on**: Nothing (first phase)
**Requirements**: SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, SEC-06
**Success Criteria** (what must be TRUE):
  1. Both partners can read and write all feature data for their shared session when logged in
  2. Neither partner can read or write data belonging to a different couple's session (verified via direct API call)
  3. Player2 can access every page and see the same data as Player1 (no player1-only policy bugs)
  4. Realtime subscriptions continue delivering partner updates after RLS is enabled (verified from two browser windows)
  5. Supabase Storage buckets for drawings enforce access control
**Plans**: 2 plans

Plans:
- [ ] 01-01-PLAN.md — Write RLS audit, index, and policy SQL migration files
- [ ] 01-02-PLAN.md — Deploy SQL migrations to Supabase and verify RLS enforcement

### Phase 2: PYP Data Migration & Cleanup
**Goal**: Predict Your Partner reads exclusively from the dedicated predict_partner table with no legacy code paths remaining
**Depends on**: Phase 1
**Requirements**: MIG-01, MIG-02, MIG-03
**Success Criteria** (what must be TRUE):
  1. All historical Predict Your Partner answers are accessible in the app (no data lost from pre-migration sessions)
  2. No code in the codebase references the responses table for PYP pack IDs
  3. Running the migration SQL a second time produces no errors and no duplicate rows
**Plans**: 1 plan

Plans:
- [x] 02-01-PLAN.md — Deploy PYP backfill migration, verify data integrity and dead code absence

### Phase 3: Polling Fallback Standardization
**Goal**: Every interactive page recovers from dropped realtime connections within 5 seconds via polling fallback
**Depends on**: Phase 1
**Requirements**: RT-01, RT-02, RT-03, RT-04, RT-05
**Success Criteria** (what must be TRUE):
  1. QuizPage has realtime subscriptions so partner answers appear without manual reload
  2. Every page that subscribes to realtime also has a paired polling fallback at 5s intervals
  3. Navigating away from any page cleanly tears down both the realtime channel and polling interval (no channel leaks)
  4. Polling only runs when the page is in a "waiting for partner" state (not during active input or after data is complete)
**Plans**: 2 plans

Plans:
- [ ] 03-01-PLAN.md — Add realtime + polling to QuizPage, fix ResultsPage/DrawResultsPage INSERT-only filters
- [ ] 03-02-PLAN.md — Fix DeepDiveDeckPage useCallback/deps, audit RT-04/RT-05 compliance across all pages

### Phase 4: Quiz Bug Fixes & Code Cleanup
**Goal**: Quiz submission is reliable and code patterns are consistent across all feature pages
**Depends on**: Phase 2, Phase 3
**Requirements**: QUIZ-01, QUIZ-02, QUIZ-03, QUIZ-04, QUIZ-05, CLN-01, CLN-02, CLN-03
**Success Criteria** (what must be TRUE):
  1. Tapping a quiz answer button always registers the selection (no stuck or dead button states)
  2. Completing the last question in a quiz pack automatically navigates to the results page without manual reload
  3. ResultsPage shows partner answers as soon as they exist (whether submitted before or after the user arrives)
  4. Async state operations across feature pages are guarded with isMounted refs (no React warnings on navigation)
  5. Realtime channel names are unique per page instance (no cross-session event leaks)
**Plans**: 3 plans

Plans:
- [ ] 04-01-PLAN.md — Fix QuizPage and ResultsPage: sessionId sync, isMounted guards, unique channels
- [ ] 04-02-PLAN.md — Add isMounted guards and unique channels to 5 polling pages
- [ ] 04-03-PLAN.md — Add isMounted guards and unique channels to remaining pages + CLN-03 cleanup

</details>

### 🚧 v1.1 Audit Remediation (In Progress)

**Milestone Goal:** Fix all security vulnerabilities, bugs, and quality issues surfaced by the independent Codex audit (2026-03-14). Prioritize security, then bugs, then accessibility, then quality.

#### Phase 5: RLS Hardening
**Goal**: The database rejects any attempt to write data as another player or to claim a session slot twice
**Depends on**: Phase 4
**Requirements**: SEC-07, SEC-08, SEC-09, SEC-10, SEC-11
**Success Criteria** (what must be TRUE):
  1. A logged-in user cannot insert a row with another player's player_id into any feature table (Supabase rejects the write)
  2. Two simultaneous join attempts on the same session cannot both succeed — only one player2 slot is claimed
  3. A user visiting a full session's JoinPage is shown a "session full" error, not given access to the session
  4. finish_sentence and hot_takes RLS policies enforce session membership without type errors
  5. No SQL files with open "allow all" policies remain active in the repo without clear superseded markers
**Plans**: 2 plans

Plans:
- [x] 05-01-PLAN.md — Add player_id RLS policies to all 9 feature tables and fix finish_sentence/hot_takes type mismatch
- [x] 05-02-PLAN.md — Atomic player2 join (conditional UPDATE), JoinPage full-session rejection, archive stale SQL files

#### Phase 6: Bug Fixes
**Goal**: Share URLs work correctly and no page reads stale closure data when auto-saving or evaluating results
**Depends on**: Phase 5
**Requirements**: BUG-01, BUG-02, BUG-03, BUG-04
**Success Criteria** (what must be TRUE):
  1. Copying the share URL from ResultsPage or DrawResultsPage produces a valid link containing the real session ID
  2. Editing a vision board image caption and waiting for autosave writes the current caption text, not a stale previous value
  3. After saving answers in PredictPartnerPage, the completion check reads fresh data from the database
  4. Polling queries on pages with large JSONB or base64 columns request only the columns they need (no select('*') on those tables)
**Plans**: 5 plans

Plans:
- [x] 06-01-PLAN.md — Fix fake join URLs in ResultsPage and DrawResultsPage
- [x] 06-02-PLAN.md — Fix stale closure in VisionTab autosave and PredictPartnerPage post-save check; optimize select queries
- [ ] 06-03-PLAN.md — Replace share-link waiting screens with session-aware two-state display (gap closure)
- [ ] 06-04-PLAN.md — Fix VisionTab caption input glitchiness with local state in CorkBoardSlot (gap closure)
- [ ] 06-05-PLAN.md — Persist invite code in user metadata and add manual join recovery (gap closure)

#### Phase 7: Accessibility
**Goal**: Keyboard users and assistive technology users can operate all interactive elements and modal overlays
**Depends on**: Phase 6
**Requirements**: A11Y-01, A11Y-02, A11Y-03
**Success Criteria** (what must be TRUE):
  1. Interactive cards on VaultPage, HotTakesPage, VisionTab, StudyTogetherPage, and ResultsPage are reachable and activatable via keyboard Tab and Enter/Space
  2. The PageGuide overlay announces itself as a dialog, traps focus while open, and closes on Escape with focus restored to the trigger button
  3. Every form field on AuthPage and WaitlistPage has a visible label that screen readers associate with the input
**Plans**: 2 plans

Plans:
- [ ] 07-01-PLAN.md — Add button semantics and keyboard handlers to interactive cards across 5 pages
- [ ] 07-02-PLAN.md — Add dialog role, focus trap, and Escape handling to PageGuide; add label associations to AuthPage and WaitlistPage forms

#### Phase 8: Quality
**Goal**: VisionTab renders without direct DOM mutation and the test suite passes with no stale route references
**Depends on**: Phase 7
**Requirements**: QUAL-01, QUAL-02, TEST-01
**Success Criteria** (what must be TRUE):
  1. VisionTab caption styles are driven by React state, with no direct style mutations on DOM nodes
  2. Large page components have at least one extracted custom hook or helper module that reduces their line count
  3. The test suite runs with zero failures (stale /books route tests are fixed or removed)
**Plans**: 2 plans

Plans:
- [ ] 08-01-PLAN.md — Replace VisionTab DOM mutations with state-driven CSS; fix or remove stale /books route tests
- [ ] 08-02-PLAN.md — Light-touch extraction of hooks/helpers from large page components

## Progress

**Execution Order:**
v1.0 Phases complete: 2, 4 (done) — 1, 3 in progress
v1.1 Phases execute in order: 5 → 6 → 7 → 8

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. RLS Audit & Policy Deployment | v1.0 | 1/2 | In Progress | - |
| 2. PYP Data Migration & Cleanup | v1.0 | 1/1 | Complete | 2026-03-11 |
| 3. Polling Fallback Standardization | v1.0 | 1/2 | In Progress | - |
| 4. Quiz Bug Fixes & Code Cleanup | v1.0 | 3/3 | Complete | 2026-03-12 |
| 5. RLS Hardening | v1.1 | 2/2 | Complete | 2026-03-15 |
| 6. Bug Fixes | 5/5 | Complete   | 2026-03-15 | - |
| 7. Accessibility | v1.1 | 0/2 | Not started | - |
| 8. Quality | v1.1 | 0/2 | Not started | - |
