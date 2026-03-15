# Requirements: The Us Quiz — v1.1 Audit Remediation

**Defined:** 2026-03-14
**Core Value:** Partners can connect and learn about each other through shared interactive experiences that update live for both players

## v1.1 Requirements

Requirements for audit remediation. Fixes security vulnerabilities, bugs, and quality issues from independent Codex audit.

### Security

- [x] **SEC-07**: User can only write rows with their own player_id (RLS enforces player_id matches auth user via sessions table lookup)
- [x] **SEC-08**: Stale bootstrap SQL files with open policies are removed or clearly marked as superseded
- [x] **SEC-09**: Player2 join is atomic — two simultaneous join attempts cannot both claim the slot (conditional UPDATE)
- [x] **SEC-10**: JoinPage rejects access when session is full (no "open notebook anyway" bypass)
- [x] **SEC-11**: finish_sentence and hot_takes RLS policies use correct column types (no text/uuid mismatch)

### Bugs

- [x] **BUG-01**: ResultsPage and DrawResultsPage display the actual session ID in the share URL, not literal braces
- [x] **BUG-02**: VisionTab caption autosave uses current board state, not stale closure data
- [x] **BUG-03**: PredictPartnerPage post-save check uses fresh response data, not stale allResponses
- [x] **BUG-04**: Polling queries fetch only needed columns instead of select('*') for rows with large JSONB/base64

### Accessibility

- [x] **A11Y-01**: Interactive cards on VaultPage, HotTakesPage, VisionTab, StudyTogetherPage, and ResultsPage have button semantics, focus handling, and keyboard activation
- [x] **A11Y-02**: PageGuide overlay has role="dialog", focus trap, Escape-to-close, and focus restoration
- [x] **A11Y-03**: Form controls on AuthPage and WaitlistPage have proper label associations

### Quality

- [x] **QUAL-01**: VisionTab DOM style mutations replaced with state-driven CSS
- [x] **QUAL-02**: Large page components have clearer separation of concerns (light-touch extraction of hooks/helpers, not full rewrite)
- [x] **TEST-01**: Stale /books route tests in sessionUtils.test.js are fixed or removed to match current routing
- [ ] **QUAL-03**: Fetch functions passed to useRealtimeSync are wrapped in useCallback so polling intervals don't reset on every render

## v1.0 Requirements (Completed)

### Security (v1.0)
- [x] **SEC-01**: RLS on all 12 tables — Complete
- [x] **SEC-02**: Optimized auth.uid() subqueries — Complete
- [x] **SEC-03**: Both partners can read shared sessions — Complete
- [x] **SEC-04**: Storage access control — Complete
- [x] **SEC-05**: Atomic RLS deploy — Complete
- [ ] **SEC-06**: Realtime works after RLS — Pending

### Data Migration (v1.0)
- [ ] **MIG-01**: PYP data backfilled — Pending
- [ ] **MIG-02**: Dead PYP code removed — Pending
- [ ] **MIG-03**: Idempotent migration — Pending

### Realtime (v1.0)
- [x] **RT-01** through **RT-05**: All complete

### Quiz Fixes (v1.0)
- [x] **QUIZ-01** through **QUIZ-05**: All complete

### Code Cleanup (v1.0)
- [x] **CLN-01** through **CLN-03**: All complete

## v1.2 Requirements (Deferred)

### Native App
- **APP-01**: Capacitor wrap for iOS/Android distribution
- **APP-02**: Push notifications via native APIs
- **APP-03**: App Store and Play Store submission

## Out of Scope

| Feature | Reason |
|---------|--------|
| Full component rewrites | Light-touch only — extracting hooks/helpers, not rewriting page architecture |
| New features or game modes | This milestone is audit remediation only |
| UI redesign | Visual theme stays as-is |
| Comprehensive test suite | Fix stale tests only; full coverage is a future milestone |
| TypeScript migration | Out of scope for all milestones |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEC-07 | Phase 5 | Complete |
| SEC-08 | Phase 5 | Complete |
| SEC-09 | Phase 5 | Complete |
| SEC-10 | Phase 5 | Complete |
| SEC-11 | Phase 5 | Complete |
| BUG-01 | Phase 6 | Complete |
| BUG-02 | Phase 6 | Complete |
| BUG-03 | Phase 6 | Complete |
| BUG-04 | Phase 6 | Complete |
| A11Y-01 | Phase 7 | Complete |
| A11Y-02 | Phase 7 | Complete |
| A11Y-03 | Phase 7 | Complete |
| QUAL-01 | Phase 8 | Complete |
| QUAL-02 | Phase 8 | Complete |
| TEST-01 | Phase 8 | Complete |
| QUAL-03 | Phase 9 | Pending |

**Coverage:**
- v1.1 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0

---
*Requirements defined: 2026-03-14*
*Last updated: 2026-03-15 after roadmap creation*
