---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Capacitor Native Wrap
status: ready_to_execute
stopped_at: Phase 14 planned (2 plans, both PASS) — ready to execute 14-01 (Android-only, no Apple Dev needed)
last_updated: "2026-05-12T12:00:00Z"
last_activity: 2026-05-12 — Phase 14 RESEARCH + 14-01-PLAN + 14-02-PLAN written and verified
progress:
  total_phases: 6
  completed_phases: 0
  total_plans: 2
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-08)

**Core value:** Partners can connect and learn about each other through shared interactive experiences that update live for both players
**Current focus:** v2.0 Capacitor Native Wrap — Phase 14 ready to plan

## Current Position

Phase: 14 of 19 (Capacitor Install & Platform Setup)
Plan: 14-01 ready to execute (Android local build); 14-02 gated on Wave-0 prereqs (Codemagic + Apple Dev)
Status: Planned — verification PASS on both plans
Last activity: 2026-05-12 — 14-RESEARCH.md + 14-01-PLAN.md + 14-02-PLAN.md written and verified

Progress: [░░░░░░░░░░] 0% (2/TBD plans drafted, 0 executed)

## Performance Metrics

**Velocity:**
- Total plans completed: 0 (v2.0)
- Average duration: —
- Total execution time: —

*Updated after each plan completion*

## Accumulated Context

### Decisions

- Wrap via Capacitor 6+ (DEC-005); no PWA bridge, no native rewrite
- Bundle web assets into IPA/APK — no remote-loaded WebView (Apple 4.2 mitigation)
- Fixed push event set (5 types) + global on/off + quiet hours; no per-event toggles in v2.0
- Both iOS and Android in v2.0 (not iOS-first)
- Home screen widget deferred to v2.1
- Push notification service design choice (Edge Function vs pg trigger vs OneSignal) deferred to Phase 17 plan

### Pending Todos

- Clean fake-email test users from production Supabase before STORE-07 privacy validation (Phase 19)
- **Apple Developer Program enrollment** ($99/yr) — REQUIRED before Phase 15 can validate iOS on real device; 24-48hr approval window so enroll early
- **Codemagic free account** — REQUIRED before Phase 14 can produce an iOS IPA; sign up at codemagic.io and connect the GitHub repo
- Google Play Developer ($25 one-time) — DEFERRED until actual Play Store submission (Phase 19). For testing, Android APKs are sideloaded directly to testers without an account.

### Recent fixes since milestone setup

- 2026-05-10: `/reset-password` silent-redirect bug fixed (commit 66354b1) — expired recovery links now show a clear error state with "get a new reset link" button instead of dumping users at /auth with no explanation. Discovered during admin password reset for a real user who got stranded in exactly that flow.
- 2026-05-11: Three Deep Dive fixes pushed (1959797, ac5c743, 736a064) — reactions row id missing from fetch, long-press blocking vertical scroll (10 sites), false unsaved-answers prompt after submission.
- 2026-05-12: Phase 14 planned. RESEARCH.md picks Capacitor 8.3.4, locks `base: './'` + no `server.url` for NATIVE-04. 14-01-PLAN covers install + both platforms + Android keystore (Android-only path, no Apple Dev required). 14-02-PLAN covers safe-area CSS, status bar, codemagic.yaml, BUILDING.md (Wave-0-gated on Codemagic + Apple Dev enrollment).

### Blockers/Concerns

- iOS builds require macOS — Phase 14 and any phase touching iOS must run on Mac
- Developer accounts (Apple + Google) are operational prerequisites blocking Phase 19; enroll early
- ~4 fake-email test users in production Supabase — clean before privacy nutrition label validation

## Session Continuity

Last session: 2026-05-12T12:00:00Z
Stopped at: Phase 14 planning artifacts produced and verified. Plan 14-01 can start immediately on Android (no Apple Dev account needed). Plan 14-02 waits on Codemagic + Apple Developer enrollment (both currently blocked: Apple "can't be set up at this time" needs phone call to Apple Dev Support; Codemagic GitHub App needs repo access granted via github.com/settings/installations).
Resume file: .planning/phases/14-capacitor-install-platform-setup/14-01-PLAN.md
