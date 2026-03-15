---
status: diagnosed
phase: 06-bug-fixes
source: [06-01-SUMMARY.md, 06-02-SUMMARY.md]
started: 2026-03-15T15:30:00Z
updated: 2026-03-15T15:55:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

[testing complete]

## Tests

### 1. Share URL on ResultsPage
expected: Complete a quiz with your partner. On the results/waiting screen, the displayed share link shows a valid URL containing your real session ID. Tap "Copy Link" — the clipboard contents should be identical to the displayed text.
result: issue
reported: "why would there be a join link for a results page? instead of a join link it should be just the code if their partner hasnt joined and a waiting on your partner message if their partner did join but just needs to do the test"
severity: major

### 2. Share URL on DrawResultsPage
expected: Complete a drawing prompt. On the draw results/waiting screen, the displayed share link shows a valid URL with your real session ID. Tap "Copy Link" — clipboard contents match the displayed link exactly.
result: issue
reported: "Same issue as test 1 — waiting screen shows a /join/ URL instead of just the invite code or a waiting message depending on partner status"
severity: major

### 3. VisionTab Caption Autosave (rapid edits)
expected: Open the Vision page's vision board tab. Edit the caption on one polaroid, then quickly switch to a different polaroid and edit its caption. Both captions should save correctly — the second edit should NOT overwrite the first.
result: issue
reported: "it is glitchy you start to type and some letters disappear or dont type"
severity: major

### 4. PredictPartnerPage Immediate Transition
expected: In Predict Your Partner, have your partner finish their answers for a pack first. When you submit your own answers, the screen should immediately transition to the reveal/results — no need to wait for the next poll cycle or refresh.
result: issue
reported: "some how my partners session intertwined with her login and its not connected to mine anymore. it shows two different play testers."
severity: blocker

## Summary

total: 4
passed: 0
issues: 4
pending: 0
skipped: 0

## Gaps

- truth: "Waiting screen shows appropriate content based on partner status — invite code if partner hasn't joined, 'waiting on partner' message if partner joined but hasn't completed the quiz"
  status: failed
  reason: "User reported: why would there be a join link for a results page? instead of a join link it should be just the code if their partner hasnt joined and a waiting on your partner message if their partner did join but just needs to do the test"
  severity: major
  test: 1
  root_cause: "Waiting screen uses single condition (responses.length < 2) with no session data fetch. Never distinguishes 'partner not joined' vs 'partner joined but hasn't answered'. Shows raw /join/{UUID} URL unconditionally — no sessions table query for player2_name/player2_user_id/invite_code."
  artifacts:
    - path: "src/pages/ResultsPage.jsx"
      issue: "Line 109: shareUrl built from raw UUID. Lines 139-173: waiting block shows share link unconditionally, no session fetch."
  missing:
    - "Fetch sessions table for player2_name, player2_user_id, invite_code"
    - "Two waiting sub-states: no partner → show invite code (LOVE-XXXX); partner joined → show 'waiting on your partner' only"
  debug_session: ""
- truth: "DrawResultsPage waiting screen shows appropriate content based on partner status — invite code if partner hasn't joined, 'waiting on partner' message if partner joined but hasn't completed the drawing"
  status: failed
  reason: "User reported: Same issue as test 1 — waiting screen shows a /join/ URL instead of just the invite code or a waiting message depending on partner status"
  severity: major
  test: 2
  root_cause: "Same as test 1 — DrawResultsPage has identical unconditional share link pattern with no session data fetch."
  artifacts:
    - path: "src/pages/DrawResultsPage.jsx"
      issue: "Line 94: shareUrl from UUID. Lines 119-176: same unconditional waiting block."
  missing:
    - "Same fix as test 1 — fetch session, two waiting sub-states"
  debug_session: ""
- truth: "VisionTab caption editing is smooth — typing in polaroid captions works without letters disappearing or dropping input"
  status: failed
  reason: "User reported: it is glitchy you start to type and some letters disappear or dont type"
  severity: major
  test: 3
  root_cause: "Caption input is controlled (value={item.caption} from parent data state). 5s polling fetchData() calls setData() with DB value, resetting the input mid-keystroke. The 800ms autosave debounce means DB hasn't been written yet when polling fires, so fetchData() snaps the input back to the stale DB value. The dataRef fix solved the stale closure in the debounce callback but did NOT protect the displayed input from being overwritten by concurrent fetches."
  artifacts:
    - path: "src/pages/VisionTab.jsx"
      issue: "Lines 66-80: fetchData() calls setData() unconditionally with DB value. Lines 99-102: 5s polling with no gate. Lines 933-945: controlled input in CorkBoardSlot derives value from parent data.board."
  missing:
    - "Give CorkBoardSlot local caption state, initialized from item.caption"
    - "On onChange: update local state only (immune to parent re-renders)"
    - "On onBlur or debounce: propagate to parent and trigger DB write"
    - "Sync parent→local only when input is not focused"
  debug_session: ""
- truth: "Partners remain connected to the same session — both players see each other's data correctly"
  status: failed
  reason: "User reported: some how my partners session intertwined with her login and its not connected to mine anymore. it shows two different play testers."
  severity: blocker
  test: 4
  root_cause: "pendingInviteCode is stored only in localStorage. When email confirmation link opens in a new tab/device/context, localStorage is different and the code is gone. HomePage falls through to autoCreate() — silently creating a new solo session for player2 instead of joining player1's session. The user_sessions row then permanently links player2 to the wrong session."
  artifacts:
    - path: "src/pages/AuthPage.jsx"
      issue: "Lines 42-52: pendingInviteCode written to localStorage before signup, lost if confirmation opens in different context"
    - path: "src/pages/HomePage.jsx"
      issue: "Lines 137-144: if pendingInviteCode absent, silently falls through to autoCreate()"
    - path: "src/contexts/AuthContext.jsx"
      issue: "Line 73: signOut clears pendingInviteCode, no recovery path"
  missing:
    - "Persist invite code server-side (user metadata or pending_joins table) so it survives context switches"
    - "Add 'join with code' recovery option when user_sessions is empty"
    - "Show warning instead of silently creating new session when no invite code found"
  debug_session: ""
