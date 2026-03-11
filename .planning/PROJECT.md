# The Us Quiz

## What This Is

A couples quiz app where one partner creates a session and the other joins via a shared invite link. Partners answer quizzes, play games, write love notes, draw together, and explore deep conversation prompts — all synced in real time. Built with React 19, Vite 7, and Supabase.

## Core Value

Partners can connect and learn about each other through shared interactive experiences that update live for both players.

## Current Milestone: v1.0 Polish & Security

**Goal:** Harden the existing app — fix quiz flow bugs, migrate Predict Your Partner data, add polling fallbacks alongside realtime, full RLS audit, and general code cleanup. No new features.

**Target features:**
- Predict Your Partner table migration (responses → predict_partner)
- Polling fallbacks everywhere (backup for realtime subscriptions)
- RLS security audit (full coverage across all tables)
- Quiz section bug fixes (buttons, progression, realtime, data integrity)
- General code cleanup

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

- [ ] Predict Your Partner data migration to dedicated table
- [ ] Polling fallbacks alongside all realtime subscriptions
- [ ] RLS policies on all Supabase tables
- [ ] Quiz section bug fixes (buttons, progression, data integrity)
- [ ] General code cleanup and hardening

### Out of Scope

- Native app (Capacitor wrap) — deferred to v1.1
- New features or game modes — this milestone is polish only
- UI redesign — visual theme stays as-is

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
*Last updated: 2026-03-10 after milestone v1.0 initialization*
