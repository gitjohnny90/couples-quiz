# The Us Quiz

## What This Is

A couples quiz app where one partner creates a session and the other joins via a shared invite link. Partners answer quizzes, play games, write love notes, draw together, and explore deep conversation prompts — all synced in real time. Built with React 19, Vite 7, and Supabase.

## Core Value

Partners can connect and learn about each other through shared interactive experiences that update live for both players.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ Email/password auth with invite codes — v0
- ✓ Session creation and partner joining via LOVE-XXXX codes — v0
- ✓ Quiz packs with answer comparison and results — v0
- ✓ Deep dive conversation decks — v0
- ✓ Drawing canvas with partner sharing — v0
- ✓ Predict Your Partner (4 series x 4 packs x 3 questions) — v0
- ✓ Finish My Sentence rounds — v0
- ✓ Hot Takes voting and defenses — v0
- ✓ Love Note Hunt game — v0
- ✓ Tic-Tac-Toe multiplayer — v0
- ✓ Movie/watch guide lists — v0
- ✓ Personality tests and profiles — v0
- ✓ Vision board, dreams, and milestones — v0
- ✓ Study Together shared reading with reflections — v0
- ✓ Journal aggregating activity across features — v0
- ✓ Emoji reactions on answers and drawings — v0
- ✓ Miss You heart nudge — v0
- ✓ Realtime subscriptions for live partner updates — v0
- ✓ Password reset via email — v0
- ✓ RLS player_id write enforcement on all feature tables — v1.1
- ✓ Atomic player2 join (race condition eliminated) — v1.1
- ✓ JoinPage full-session rejection — v1.1
- ✓ Stale bootstrap SQL files marked as superseded — v1.1
- ✓ finish_sentence/hot_takes RLS type fix — v1.1
- ✓ Share URLs display real session IDs — v1.1
- ✓ VisionTab and PredictPartner stale closure fixes — v1.1
- ✓ Optimized queries (no select('*') on large JSONB) — v1.1
- ✓ Keyboard accessibility for interactive cards (5 pages) — v1.1
- ✓ PageGuide dialog accessibility (focus trap, Escape) — v1.1
- ✓ Form label associations (AuthPage, WaitlistPage) — v1.1
- ✓ VisionTab state-driven CSS (no DOM mutations) — v1.1
- ✓ Custom hooks: useRealtimeSync, useSessionSetup — v1.1
- ✓ useCallback compliance for all useRealtimeSync consumers — v1.1
- ✓ Daily photo prompt sections (15 themes × 3 questions) — v1.2
- ✓ PhotoCaptureInput component with native file input + image compression — v1.2
- ✓ Daily Photos hub + section + cork-board reveal pages — v1.2
- ✓ 6am-local-time gating between sections — v1.2
- ✓ Supabase Storage bucket with per-session RLS for photo uploads — v1.2
- ✓ Journal photos tab aggregating completed sections — v1.2
- ✓ Heart Line couples Connect Four (post-v1.2) — 2026-03-28
- ✓ Code splitting via React.lazy + Vite vendor chunks (post-v1.2) — 2026-05-07
- ✓ npm audit + dependency hygiene (post-v1.2) — 2026-05-07
- ✓ Multiplayer concurrency fixes (Heart Line/Tic-Tac-Toe race, Love Note Hunt phase guard) — 2026-05-07

### Active

<!-- Current scope. Building toward these. -->

**Current Milestone: v2.0 Capacitor Native Wrap**

**Goal:** Wrap the existing web app as native iOS and Android apps with push notifications, native capabilities (camera, haptics, deep links, share sheet), App Store + Google Play submission.

**Target features:**
- Capacitor 6+ integration with bundled assets (no remote-loaded WebView)
- iOS + Android platform configuration with build pipeline
- Push notifications via `@capacitor/push-notifications` for 5 partner-action event types
- Notification controls: master on/off + configurable quiet-hours window
- Native camera + camera-roll integration for Daily Photos
- Universal Links / App Links so invite-code URLs deep-link into the installed app
- Haptic feedback on Heart Line, Miss U Heart receive, partner reactions
- Native share sheet for Daily Photo cork-board reveals
- Status bar styling + safe-area handling for notched devices
- App icons + splash screens in notebook aesthetic for both platforms
- App Store Connect + Google Play Console listings with privacy nutrition labels
- Submission to TestFlight + Internal Testing track

### Out of Scope

- Home screen widget — deferred to v2.1 (substantial scope, ship wrap first)
- PWA / service worker — Capacitor covers home-screen need, no PWA bridge needed
- Background sync of offline-drafted love notes/answers — defer to v2.1 if requested
- Biometric auth (Face ID / fingerprint) — low value relative to effort
- App Clips / Instant Apps — separate scope, defer
- iPad-specific layout / Apple Pencil support — niche, defer
- Per-event push notification preferences — v2.0 ships fixed event set; granular toggles are v2.1
- Capacitor Live Updates / OTA — bundled assets for v2.0; add OTA only if release cadence becomes painful
- New features or game modes — v2.0 is wrap-and-ship, not new functionality
- UI redesign — visual theme stays as-is
- TypeScript migration — not planned

## Context

- **Codebase:** 16,575 LOC JavaScript (React 19 + Vite 7 + Supabase)
- **Deployed:** Vercel with SPA rewrites
- **Users:** Play testers actively using the app
- **Security:** RLS fully enforced on all 12 tables with per-operation policies; player_id write enforcement prevents impersonation
- **Quality:** Custom hooks (useRealtimeSync, useSessionSetup) established as standard patterns; all interactive pages use useCallback-wrapped fetch functions
- **Accessibility:** Keyboard navigation on all interactive cards; PageGuide dialogs with focus trap; form labels on auth pages
- **Known gaps:** Nyquist validation files missing for v1.1 phases (no VALIDATION.md); v1.0 phases 1 & 3 marked in-progress in roadmap (work was done outside GSD tracking)

## Constraints

- **Tech stack**: React 19 + Vite 7 + Supabase — no changes
- **No downtime**: Play testers are active, migrations must be non-breaking
- **No TypeScript**: Project uses pure JavaScript
- **Styling**: Inline styles + CSS custom properties, no Tailwind or CSS-in-JS

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Polling fallbacks alongside realtime (not replacing) | Realtime is primary, polling catches dropped connections | ✓ Good — all pages recover within 5s |
| Migrate PYP data to dedicated table | Generic responses table doesn't fit the per-question data model | ✓ Good — clean separation |
| Full RLS audit before native app milestone | Security must be solid before wider distribution | ✓ Good — 16/16 requirements satisfied |
| Per-operation RLS policies (not FOR ALL) | Allows player_id enforcement on writes while keeping reads session-scoped | ✓ Good — prevents impersonation without breaking reads |
| Atomic conditional UPDATE for player2 join | Eliminates race condition; cleaner than try/catch | ✓ Good — no double-joins possible |
| dataRef pattern for VisionTab autosave | useRef synced via useEffect; setTimeout reads current, not stale closure | ✓ Good — caption input responsive |
| Local useState in CorkBoardSlot | Shields caption input from parent re-renders; syncs on blur | ✓ Good — no more glitchy typing |
| Belt-and-suspenders invite code (localStorage + user_metadata) | Covers same-device and cross-device email confirmation flows | ✓ Good — works on all paths |
| useRealtimeSync + useSessionSetup as standard hooks | Reduces boilerplate; enforces consistent patterns across pages | ✓ Good — adopted by 3 largest pages |
| CSS class hover instead of DOM mutations | React state drives styles; no direct .style access | ✓ Good — cleaner, more predictable |
| Capacitor over PWA-only or full native rewrite (DEC-005) | PWA can't push on iOS reliably; native rewrite would mean rebuilding everything | — Pending v2.0 |
| Quality gate, not calendar dates, drives App Store submission (DEC-011) | Sloppy launch kills first impressions and risks Apple rejection | — Pending v2.0 |
| Bundle web assets into IPA/APK rather than remote-load WebView | Apple Section 4.2 rejects "thin wrappers"; cold-launch + offline matter | — Pending v2.0 |
| Fixed push event set + global on/off + quiet hours (no per-event toggles) | Avoids settings-page bloat; per-event preferences are v2.1 if asked | — Pending v2.0 |
| Defer home screen widget to v2.1 | Substantial separate platform-specific work; ship wrap + push first | ✓ Good — keeps v2.0 focused |

---
*Last updated: 2026-05-08 after v2.0 milestone start*
