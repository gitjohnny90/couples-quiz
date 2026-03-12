# Requirements: The Us Quiz — v1.0 Polish & Security

**Defined:** 2026-03-10
**Core Value:** Partners can connect and learn about each other through shared interactive experiences that update live for both players

## v1.0 Requirements

Requirements for this polish & security milestone. No new features — hardening only.

### Security

- [x] **SEC-01**: User can only read/write data for sessions they belong to (RLS on all 12 tables)
- [x] **SEC-02**: RLS policies use `(SELECT auth.uid())` optimization for performance
- [x] **SEC-03**: Both partners can read shared session rows (sessions table policy allows player1 and player2)
- [x] **SEC-04**: Supabase Storage buckets enforce access control for drawings
- [x] **SEC-05**: RLS enable and policy deploy happen atomically (no window of empty results)
- [ ] **SEC-06**: Realtime subscriptions continue working correctly after RLS is enabled

### Data Migration

- [ ] **MIG-01**: Legacy Predict Your Partner data is backfilled from responses to predict_partner table
- [ ] **MIG-02**: Dead code paths referencing old PYP storage in responses table are removed
- [ ] **MIG-03**: Migration uses ON CONFLICT DO NOTHING for idempotent reruns

### Realtime Reliability

- [x] **RT-01**: All sync-dependent pages have polling fallbacks alongside realtime subscriptions
- [x] **RT-02**: QuizPage has realtime subscriptions for partner answer updates
- [x] **RT-03**: QuizPage has polling fallback for partner answer sync
- [x] **RT-04**: All pages pair removeChannel with clearInterval in cleanup
- [x] **RT-05**: Polling is gated behind "waiting for partner" conditions (not polling when unnecessary)

### Quiz Bug Fixes

- [x] **QUIZ-01**: Quiz buttons respond correctly to taps (no stuck/dead button states)
- [x] **QUIZ-02**: Quiz pages progress to next question/results without manual reload
- [x] **QUIZ-03**: ResultsPage realtime filter changed from INSERT to * (catches existing partner data)
- [x] **QUIZ-04**: QuizPage syncs sessionId from URL params consistently
- [x] **QUIZ-05**: Partner answers display correctly without data mix-ups

### Code Cleanup

- [x] **CLN-01**: Async state operations guarded with isMounted refs to prevent memory leaks
- [x] **CLN-02**: Realtime channel names are unique per page instance (no collisions)
- [x] **CLN-03**: General code cleanup pass across feature pages

## v1.1 Requirements (Deferred)

### Native App

- **NAT-01**: App wrapped with Capacitor for iOS and Android
- **NAT-02**: Push notifications via native APIs
- **NAT-03**: App Store and Play Store submission

## Out of Scope

| Feature | Reason |
|---------|--------|
| Native app (Capacitor) | Deferred to v1.1 — security must be solid first |
| New features or game modes | This milestone is polish only |
| UI redesign | Visual theme stays as-is |
| TypeScript migration | Out of scope for all milestones |
| Push notifications | Requires native app, deferred |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEC-01 | Phase 1 | Complete |
| SEC-02 | Phase 1 | Complete |
| SEC-03 | Phase 1 | Complete |
| SEC-04 | Phase 1 | Complete |
| SEC-05 | Phase 1 | Complete |
| SEC-06 | Phase 1 | Pending |
| MIG-01 | Phase 2 | Pending |
| MIG-02 | Phase 2 | Pending |
| MIG-03 | Phase 2 | Pending |
| RT-01 | Phase 3 | Complete |
| RT-02 | Phase 3 | Complete |
| RT-03 | Phase 3 | Complete |
| RT-04 | Phase 3 | Complete |
| RT-05 | Phase 3 | Complete |
| QUIZ-01 | Phase 4 | Complete |
| QUIZ-02 | Phase 4 | Complete |
| QUIZ-03 | Phase 4 | Complete |
| QUIZ-04 | Phase 4 | Complete |
| QUIZ-05 | Phase 4 | Complete |
| CLN-01 | Phase 4 | Complete |
| CLN-02 | Phase 4 | Complete |
| CLN-03 | Phase 4 | Complete |

**Coverage:**
- v1.0 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0

---
*Requirements defined: 2026-03-10*
*Last updated: 2026-03-10 after roadmap creation*
