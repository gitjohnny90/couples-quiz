---
phase: 06-bug-fixes
plan: 05
subsystem: auth
tags: [supabase, auth, user-metadata, cross-device, invite-code, session-join]

# Dependency graph
requires:
  - phase: 06-bug-fixes
    provides: base bug-fix context for session and auth flows
provides:
  - invite code persisted in Supabase user_metadata so cross-device email confirmation can find it
  - manual join recovery UI when no invite code is found (prevents silent solo session creation)
affects: [auth, session-setup, onboarding, homepage]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Belt-and-suspenders invite code: localStorage for same-device, user_metadata for cross-device"
    - "One-time-use metadata: updateUser({ data: { invite_code: null } }) after consuming"
    - "Show join/create choice UI instead of silent fallback to autoCreate()"

key-files:
  created: []
  modified:
    - src/contexts/AuthContext.jsx
    - src/pages/AuthPage.jsx
    - src/pages/HomePage.jsx

key-decisions:
  - "Belt-and-suspenders invite code storage: localStorage (same-device, fast) + user_metadata (cross-device, survives email confirmation in different browser)"
  - "Manual join UI replaces silent autoCreate() when no code found — user explicitly chooses join or create"
  - "invite_code cleared from user_metadata after first use via supabase.auth.updateUser to prevent stale joins on re-login"

patterns-established:
  - "User metadata as cross-device persistence for ephemeral onboarding state"

requirements-completed: [BUG-01]

# Metrics
duration: 2min
completed: 2026-03-15
---

# Phase 06 Plan 05: Cross-Device Invite Code Fix Summary

**Invite code now persisted in Supabase user_metadata so partner joining from a different browser/device still lands in the correct session, with a manual recovery UI when no code is found**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-15T16:26:10Z
- **Completed:** 2026-03-15T16:28:04Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- `signUp()` in AuthContext now stores invite_code in user_metadata alongside display_name — survives cross-device email confirmation
- AuthPage passes invite code to signUp() so it's stored before email is confirmed
- HomePage reads `user?.user_metadata?.invite_code` as fallback when localStorage is empty
- Manual join recovery UI shown when no invite code found anywhere — user chooses "join their session" (with code input) or "create my own session"
- Silent `autoCreate()` fallback eliminated for new users with no code

## Task Commits

Each task was committed atomically:

1. **Task 1: Persist invite code in Supabase user metadata** - `464ab1c` (feat)
2. **Task 2: Read invite code from user_metadata and add manual join recovery** - `0bb7dcb` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/contexts/AuthContext.jsx` - signUp() signature extended with optional inviteCode param; stored in user_metadata when provided
- `src/pages/AuthPage.jsx` - passes inviteCode.trim() to signUp() call; localStorage write preserved as same-device fallback
- `src/pages/HomePage.jsx` - pendingCode falls back to user_metadata.invite_code; showJoinOption state + manual join UI added; autoCreate() no longer silent default

## Decisions Made
- Belt-and-suspenders approach: localStorage for same-device (faster, no async), user_metadata for cross-device (survives confirmation in new browser)
- Manual join UI shows when no code found — eliminates silent session creation that caused "intertwined sessions" bug
- invite_code cleared from user_metadata after first use (updateUser with null) to prevent stale joins on future sign-ins

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- BUG-01 (cross-device invite code loss) resolved
- Auth and session setup flow now handles both same-device and cross-device email confirmation correctly
- No blockers for remaining phase 06 plans

---
*Phase: 06-bug-fixes*
*Completed: 2026-03-15*
