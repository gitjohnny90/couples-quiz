# Roadmap: The Us Quiz — v1.0 Polish & Security

## Overview

This milestone hardens an already-functional couples quiz app for active play testers. No new features. Four phases in strict dependency order: lock down data access with RLS policies across all 12 tables, clean up the Predict Your Partner data migration, standardize polling fallbacks alongside realtime subscriptions on every interactive page, then fix quiz section bugs and do a general code cleanup pass. Each phase builds on the stability established by the previous one, culminating in a secured, reliable app ready for wider distribution.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: RLS Audit & Policy Deployment** - Enable Row Level Security on all Supabase tables with correct policies for both partners
- [x] **Phase 2: PYP Data Migration & Cleanup** - Backfill legacy Predict Your Partner data and remove dead code paths
- [ ] **Phase 3: Polling Fallback Standardization** - Add 5s polling fallbacks alongside realtime on every interactive page
- [ ] **Phase 4: Quiz Bug Fixes & Code Cleanup** - Fix quiz submission/progression bugs and standardize code patterns

## Phase Details

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

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. RLS Audit & Policy Deployment | 1/2 | In Progress|  |
| 2. PYP Data Migration & Cleanup | 1/1 | Complete | 2026-03-11 |
| 3. Polling Fallback Standardization | 1/2 | In Progress|  |
| 4. Quiz Bug Fixes & Code Cleanup | 0/3 | Not started | - |
