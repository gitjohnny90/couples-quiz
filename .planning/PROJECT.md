# The Us Quiz

## What This Is

A couples quiz app where one partner creates a session and the other joins via a shared invite link. Partners answer quizzes, play games, write love notes, draw together, and explore deep conversation prompts — all synced in real time. Built with React 19, Vite 7, and Supabase.

## Core Value

Partners can connect and learn about each other through shared interactive experiences that update live for both players.

## Current Milestone: v1.1 Audit Remediation

**Goal:** Fix all security vulnerabilities, bugs, and quality issues surfaced by an independent code audit (OpenAI Codex, 2026-03-14). Prioritize security fixes, then bugs, then quality improvements.

**Target features:**
- RLS player_id enforcement (prevent partner impersonation)
- Remove stale open-policy bootstrap SQL files
- Join flow race condition fix (atomic player2 claim)
- Remove JoinPage full-session privacy bypass
- Fix finish_sentence/hot_takes RLS type mismatch
- Fix fake join URLs and stale closure bugs
- Optimize wasteful select('*') queries
- Keyboard and modal accessibility improvements
- Fix 2 stale book route test failures

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

### Active

<!-- Current scope. Building toward these. -->

- [ ] RLS player_id write enforcement across all feature tables
- [ ] Remove stale open-policy bootstrap SQL
- [ ] Atomic player2 join (race condition fix)
- [ ] Remove JoinPage full-session bypass
- [ ] Fix finish_sentence/hot_takes RLS type mismatch
- [ ] Fix fake join URL display on results pages
- [ ] Fix stale closure bugs (VisionTab, PredictPartnerPage)
- [ ] Optimize select('*') queries to fetch only needed columns
- [ ] Keyboard accessibility for interactive cards
- [ ] Modal/overlay accessibility (dialog role, focus trap, Escape)
- [ ] Fix 2 stale book route tests

### Out of Scope

- Native app (Capacitor wrap) — deferred to v1.2+
- New features or game modes — this milestone is audit remediation only
- UI redesign — visual theme stays as-is
- Full component refactoring — light touch only on maintainability (finding 11)

## Context

- App is deployed on Vercel with SPA rewrites
- Play testers actively using the app — changes must not break existing sessions
- Most reported issues centered on the quiz section: buttons not working, pages not progressing, needing reloads to see partner answers, data mix-ups
- RLS is partially configured — some tables have policies, others don't
- Predict Your Partner currently stores data in the generic `responses` table but has a dedicated `predict_partner` table ready

## Constraints

- **Tech stack**: React 19 + Vite 7 + Supabase — no changes
- **No downtime**: Play testers are active, migrations must be non-breaking
- **No TypeScript**: Project uses pure JavaScript
- **Styling**: Inline styles + CSS custom properties, no Tailwind or CSS-in-JS

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Polling fallbacks alongside realtime (not replacing) | Realtime is primary, polling catches dropped connections | — Pending |
| Migrate PYP data to dedicated table | Generic responses table doesn't fit the per-question data model | — Pending |
| Full RLS audit before native app milestone | Security must be solid before wider distribution | — Pending |

---
*Last updated: 2026-03-14 after milestone v1.1 initialization*
