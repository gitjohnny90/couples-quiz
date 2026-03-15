# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.1 — Audit Remediation

**Shipped:** 2026-03-15
**Phases:** 5 | **Plans:** 12 | **Tasks:** 22

### What Was Built
- RLS player_id write enforcement on all 9 feature tables (prevents partner impersonation)
- Atomic player2 join eliminating race-condition double-joins
- Fixed share URLs, stale closure bugs, optimized heavy JSONB queries
- Cross-device invite code persistence + manual join recovery UI
- Keyboard accessibility for interactive cards across 5 pages + PageGuide dialog
- Custom hooks (useRealtimeSync, useSessionSetup) and useCallback compliance

### What Worked
- Audit-driven prioritization (security > bugs > accessibility > quality) provided clear phase ordering
- Single-day execution: all 5 phases planned and executed in one session
- Gap closure cycle worked well: milestone audit surfaced useCallback gap -> Phase 9 created to close it -> verified clean
- Codex audit report as input gave concrete, actionable findings with line-number precision

### What Was Inefficient
- v1.0 phases 1 & 3 were completed outside GSD tracking, leaving roadmap checkboxes inconsistent
- Nyquist validation files missing for all v1.1 phases — research was disabled, so no VALIDATION.md generated
- SUMMARY one-liner extraction returned null for all 12 summaries — frontmatter format may not match expected schema

### Patterns Established
- Per-operation RLS policies (separate SELECT/INSERT/UPDATE) as standard for tables needing write-level enforcement
- `useRealtimeSync` + `useSessionSetup` as standard hooks for new interactive pages
- `useCallback` wrapping for all fetch functions passed as callbacks to hooks
- Interactive div accessibility: `role="button"` + `tabIndex={0}` + `onKeyDown(Enter/Space)` + `aria-label`

### Key Lessons
1. Independent code audits surface issues that internal reviews miss — worth running before each distribution milestone
2. Gap closure phases (decimal or sequential) are lightweight and effective when the gap is well-scoped
3. Single-day milestones are feasible when requirements are pre-defined and scope is bounded (remediation, not new features)

### Cost Observations
- Model mix: ~30% opus (orchestration), ~70% sonnet (execution/verification)
- Sessions: 2 (plan+execute Phase 9, then complete-milestone)
- Notable: 12 plans executed in ~62 minutes total agent time — sonnet handled all execution efficiently

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 4 | 8 | Established GSD workflow, first milestone |
| v1.1 | 5 | 12 | Audit-driven scope, gap closure cycle, custom hooks |

### Top Lessons (Verified Across Milestones)

1. Security before features — RLS must be solid before wider distribution
2. Polling + realtime is the right architecture — provides resilience without complexity
3. Custom hooks reduce boilerplate and enforce patterns across pages
