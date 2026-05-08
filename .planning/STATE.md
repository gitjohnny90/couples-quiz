---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Capacitor Native Wrap
status: defining_requirements
stopped_at: Defining requirements for v2.0 — Capacitor Native Wrap
last_updated: "2026-05-08T05:00:00Z"
last_activity: 2026-05-08 — v2.0 milestone started, requirements drafted
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-08)

**Core value:** Partners can connect and learn about each other through shared interactive experiences that update live for both players
**Current focus:** v2.0 Capacitor Native Wrap — defining requirements

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-05-08 — Milestone v2.0 started

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting v2.0:

- Wrap existing React + Vite web app via Capacitor (DEC-005); no PWA bridge, no native rewrite
- Quality gate drives timeline, not calendar dates (DEC-011) — pre-v2.0 hygiene complete on `main` 2026-05-07 (commits 65b41e5, 5f7e39d, c997477)
- Bundle web assets into IPA/APK, no remote-loaded WebView — Apple Section 4.2 risk + cold-launch performance
- Fixed push notification event set (5 partner-action types) with global on/off + quiet hours — no per-event toggles in v2.0
- Both iOS and Android platforms in v2.0 (not iOS-first)
- Home screen widget deferred to v2.1 to keep v2.0 scope focused on wrap + push + native capabilities
- Native capabilities included: camera/camera-roll, Universal Links / App Links, haptics, native share sheet, status-bar/safe-area handling

### Pending Todos

None — requirements defined, awaiting roadmap creation.

### Blockers/Concerns

- Apple Developer account ($99/yr) and Google Play Console account ($25 one-time) need to be set up before submission phases — these are operational prerequisites, not technical blockers
- iOS build requires macOS; Android build is cross-platform. Build pipeline needs to be designed in early phase
- ~4 fake-email test users from 2026-05-07 sweep runs still in production Supabase — cleanup before App Store privacy nutrition validation

## Session Continuity

Last session: 2026-05-08T05:00:00Z
Stopped at: Requirements approved, awaiting roadmap creation
Resume file: None
