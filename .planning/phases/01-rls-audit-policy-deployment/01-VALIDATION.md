---
phase: 1
slug: rls-audit-policy-deployment
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual SQL verification + browser testing (no test runner configured) |
| **Config file** | none — no test runner in project |
| **Quick run command** | `npm run build` (build check only) |
| **Full suite command** | `npm run build && npm run preview` |
| **Estimated runtime** | ~10 seconds (build) |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Build + manual Supabase SQL verification
- **Before `/gsd:verify-work`:** Full build must succeed, manual RLS verification complete
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | SEC-01 | manual/sql | `SELECT * FROM pg_policies` | N/A | ⬜ pending |
| 01-01-02 | 01 | 1 | SEC-02 | manual/sql | Check `(SELECT auth.uid())` in policies | N/A | ⬜ pending |
| 01-01-03 | 01 | 1 | SEC-03 | manual/sql | Verify both-partner access on sessions | N/A | ⬜ pending |
| 01-01-04 | 01 | 1 | SEC-05 | manual/sql | `BEGIN; ALTER TABLE...; CREATE POLICY...; COMMIT;` | N/A | ⬜ pending |
| 01-02-01 | 02 | 1 | SEC-04 | manual | Verify no Storage buckets need policies (drawings in JSONB) | N/A | ⬜ pending |
| 01-02-02 | 02 | 1 | SEC-06 | manual/browser | Two-window realtime test after RLS enabled | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. RLS policies are pure SQL deployed via Supabase SQL Editor. No test framework installation needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Cross-session data isolation | SEC-01 | Requires two different auth sessions hitting Supabase REST API | Sign in as User A, attempt to read User B's session data via direct API call |
| Both-partner read access | SEC-03 | Requires two authenticated browsers on same session | Sign in as player1 in browser A, player2 in browser B, verify both see same data |
| Realtime after RLS | SEC-06 | Requires live WebSocket observation | Open two browsers, enable RLS, verify realtime events still arrive |
| Storage bucket access | SEC-04 | Confirmed no-op — drawings stored as base64 in JSONB | Verify no Supabase Storage API calls exist in codebase |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
