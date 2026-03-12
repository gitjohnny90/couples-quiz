---
phase: 3
slug: polling-fallback-standardization
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Build check + grep audit + manual browser testing (no test runner) |
| **Config file** | none |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build` + manual two-browser realtime test |
| **Estimated runtime** | ~10 seconds (build) |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Build + manual realtime verification
- **Before `/gsd:verify-work`:** Full build green, two-browser test complete
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | RT-02, RT-03 | automated | `npm run build` | N/A | ⬜ pending |
| 03-01-02 | 01 | 1 | RT-01 | automated | `npm run build` + grep for removeChannel | N/A | ⬜ pending |
| 03-02-01 | 02 | 1 | RT-04 | automated/grep | `grep -l "removeChannel\|clearInterval" src/pages/*.jsx` | N/A | ⬜ pending |
| 03-02-02 | 02 | 1 | RT-01, RT-05 | manual/browser | Two-browser realtime test | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. Changes are React hook additions to existing page files.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Partner answers appear on QuizPage without reload | RT-02 | Requires two authenticated browsers | Open quiz in two browsers, one answers, other should see update |
| Polling recovers from dropped connection | RT-01 | Requires simulating connection drop | Open page, disable network briefly, re-enable, verify data syncs within 5s |
| Cleanup on navigation | RT-04 | Requires navigating away and checking for leaks | Navigate away from quiz, check console for channel/interval errors |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
