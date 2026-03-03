# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Vite dev server on 127.0.0.1:5173
npm run build     # Production build
npm run preview   # Preview production build
```

No test runner or linter is configured.

## Tech Stack

- **React 19** + **Vite 7** + **React Router DOM 7** (client-side SPA)
- **Supabase** for database, realtime subscriptions, and storage (no auth — uses anon key)
- **Framer Motion** for animations
- **Pure JavaScript** — no TypeScript
- Deployed on **Vercel** with SPA rewrites (`vercel.json`)

## Architecture

**The Us Quiz** is a couples quiz app. One partner creates a session, the other joins via a shared link. All routes include a `:sessionId` param.

### Session & Identity

`SessionContext` (in `App.jsx`) holds `sessionId` and `playerName`, persisted to localStorage. `playerId` (`'player1'` or `'player2'`) is also in localStorage. The `RequireName` wrapper redirects to `/` if no name is set.

### Routing

All routes defined in `App.jsx`. Four nav tabs map to route groups:
- **home** → `/` (HomePage — session creation/name entry)
- **quizzes** → `/vault/:id`, `/quiz/:id/:packId`, `/results/:id/:packId`, `/deep-dive/:id`, `/quiz-packs/:id`
- **fun stuff** → `/fun/:id`, `/draw/:id`, `/movies/:id`, `/books/:id`, `/tictactoe/:id`, `/watch-guide/:id`
- **us** → `/profiles/:id` (personality profiles + vision board via tab param), `/journal/:id`

### Data Flow

- **Static content** (quiz questions, deep dive decks, drawing prompts, genres) lives in `src/data/*.js` files — not in the database.
- **User data** (answers, profiles, shared items, drawings, dreams) goes to Supabase tables: `sessions`, `responses`, `profiles`, `deep_dive_responses`, `shared_items`.
- **Realtime**: Many pages subscribe to Supabase realtime channels (`postgres_changes`) so partner updates appear live without refresh.

### Supabase Tables

| Table | Purpose | Key columns |
|-------|---------|-------------|
| `sessions` | One row per couple | `player1_name`, `player2_name` |
| `responses` | Quiz answers & drawings | `session_id`, `pack_id`, `player_id`, `answers` (JSONB) |
| `profiles` | Personality test data | `session_id`, `player_id`, `profile_data` (JSONB) |
| `deep_dive_responses` | Open-ended answers | `session_id`, `deck_id`, `question_id`, `answer` |
| `shared_items` | Movie/book lists | `session_id`, `type`, `title`, `status`, ratings |

All tables use `player_id` as `'player1'` or `'player2'` (not auth-based).

## Styling

**No Tailwind, no CSS-in-JS** — uses inline styles and CSS custom properties in `src/index.css`.

The visual theme is a hand-drawn notebook:
- Warm paper background (`--bg-paper: #FFF8F0`) with ruled lines and a red margin
- Fonts: **Caveat** (headings), **Patrick Hand** (body), **Inter** (UI)
- Cards have "tape mark" pseudo-elements and slight rotations
- CSS variables for the color palette: `--accent-coral`, `--accent-sage`, `--accent-blue`, `--accent-mustard`
- Mobile-first single-column layout throughout

### Doodles

`src/components/Doodles.jsx` exports SVG components (DoodleHeart, DoodleStar, DoodleArrow, DoodleFlower, etc.) plus a `PageDoodles` default export that scatters decorative doodles in page margins. All doodle SVGs use `pointer-events: none` and `position: absolute`.

## Key Patterns

- **Supabase queries**: `useEffect` with `supabase.from(table).select()` / `.upsert()` / `.insert()`
- **Realtime**: `supabase.channel(name).on('postgres_changes', ...).subscribe()` — always unsubscribe in cleanup
- **No component library**: all UI is custom JSX with inline styles
- **localStorage keys**: `sessionId`, `playerName`, `playerId`, plus feature-specific keys like movie vetoes

## Environment Variables

Required in `.env` (prefixed with `VITE_` for Vite):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
