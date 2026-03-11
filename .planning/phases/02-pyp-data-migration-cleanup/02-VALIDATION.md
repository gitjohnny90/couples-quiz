---
phase: 2
slug: pyp-data-migration-cleanup
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | SQL verification + grep audit (no test runner) |
| **Config file** | none |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build` + SQL count verification |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Build + verify migration counts in Supabase
- **Before `/gsd:verify-work`:** Full build green, migration counts match
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | MIG-01, MIG-03 | manual/sql | Compare row counts pre/post migration | N/A | ⬜ pending |
| 02-01-02 | 01 | 1 | MIG-02 | automated/grep | `grep -r "predict-pack" src/ --include="*.jsx" -l` | N/A | ⬜ pending |
| 02-01-03 | 01 | 1 | MIG-03 | manual/sql | Run migration SQL twice, verify no errors/duplicates | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. Migration is pure SQL. Dead code check is grep-based.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Historical PYP answers accessible | MIG-01 | Requires opening app and checking old PYP data renders | Open PredictPartnerPage for a session with pre-migration data, verify answers display |
| Idempotent re-run | MIG-03 | Requires running SQL twice and checking counts | Run migration SQL, note count, run again, verify same count and no errors |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
