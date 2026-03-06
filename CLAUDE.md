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
- **Supabase** for database, realtime subscriptions, storage, and auth (email/password)
- **Framer Motion** for animations
- **Pure JavaScript** — no TypeScript
- Deployed on **Vercel** with SPA rewrites (`vercel.json`)

## Architecture

**The Us Quiz** is a couples quiz app. One partner creates a session, the other joins via a shared link. All routes include a `:sessionId` param.

### Authentication

`AuthContext` (in `src/contexts/AuthContext.jsx`) wraps the app with Supabase Auth (email + password). Exports `user`, `loading`, `signUp`, `signIn`, `signOut`. All routes except `/auth` are wrapped in `<RequireAuth>` which redirects unauthenticated users to the sign-in page.

### Session & Identity

`SessionContext` (in `App.jsx`) holds `sessionId`, `playerName`, and `playerId`, persisted to localStorage. Partners join via an invite code (`LOVE-XXXX`) generated on session creation. The `user_sessions` table links Supabase auth users to sessions so they can resume on login. Legacy sessions (pre-auth) are auto-claimed when a user signs in.

### Routing

All routes defined in `App.jsx`. `/auth` is public; all others require authentication. Four nav tabs map to route groups:
- **home** → `/` (HomePage — session creation/join via invite code)
- **quizzes** → `/vault/:id`, `/quiz/:id/:packId`, `/results/:id/:packId`, `/deep-dive/:id`, `/deep-dive/:id/:deckId`, `/quiz-packs/:id`
- **fun stuff** → `/fun/:id`, `/draw/:id`, `/movies/:id`, `/books/:id`, `/tictactoe/:id`, `/love-notes/:id`, `/watch-guide/:id`
- **us** → `/profiles/:id` (personality profiles + vision board via tab param), `/journal/:id`

### Data Flow

- **Static content** (quiz questions, deep dive decks, drawing prompts, genres) lives in `src/data/*.js` files — not in the database.
- **User data** (answers, profiles, shared items, drawings, dreams) goes to Supabase tables: `sessions`, `responses`, `profiles`, `deep_dive_responses`, `shared_items`.
- **Realtime**: Many pages subscribe to Supabase realtime channels (`postgres_changes`) so partner updates appear live without refresh.

### Supabase Tables

| Table | Purpose | Key columns |
|-------|---------|-------------|
| `sessions` | One row per couple | `player1_name`, `player2_name`, `invite_code`, `player1_user_id`, `player2_user_id` |
| `user_sessions` | Links auth users to sessions | `user_id`, `session_id`, `player_id` |
| `responses` | Quiz answers, drawings, & tic-tac-toe game state | `session_id`, `pack_id`, `player_id`, `answers` (JSONB) |
| `profiles` | Personality test data | `session_id`, `player_id`, `profile_data` (JSONB) |
| `deep_dive_responses` | Open-ended answers | `session_id`, `deck_id`, `question_id`, `answer` |
| `shared_items` | Movie/book lists | `session_id`, `type`, `title`, `status`, ratings |
| `love_note_games` | Love Note Hunt game state | `session_id`, `player_id`, `notes` (JSONB), `note_cells` (JSONB) |
| `love_note_guesses` | Love Note Hunt guesses | `game_id`, `player_id`, `cell_index` |
| `reactions` | Emoji reactions to answers | `session_id`, `player_id`, `target_type`, `target_id`, `reaction` |

All tables use `player_id` as `'player1'` or `'player2'` (tic-tac-toe uses `'game'` for shared state). Auth user IDs stored in `sessions` and `user_sessions`.

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

### Components

- `src/components/Doodles.jsx` — decorative SVG doodles (see Doodles section above)
- `src/components/DrawingCanvas.jsx` — reusable canvas with color picker, eraser, undo/clear. Uses pointer events and `globalCompositeOperation` for erasing. Exports drawing as PNG data URL via `onDrawingChange` callback.
- `src/components/SpinningWheel.jsx` — SVG genre wheel used by Movies and Books pages. Titles rendered via `<textPath>` along each slice's midline (flipped for bottom half so text is never upside-down). CSS transition spin animation with cubic-bezier easing; auto-scrolls to result card after landing.
- `src/components/ReactionPopup.jsx` — floating emoji picker (❤️ 😂 🔥) that appears on long-press. Uses framer-motion spring animations, fixed-position backdrop, smart positioning above/below the target card.
- `src/components/ReactionBadge.jsx` — small inline pills showing existing reactions (coral for yours, blue for partner's). Returns null if no reactions.
- `src/components/ReactionPicker.jsx` — re-export barrel for ReactionPopup, ReactionBadge, and useLongPress.

### Hooks

- `src/hooks/useLongPress.js` — detects press-and-hold gestures (500ms). Returns pointer event handlers to spread onto any element. Suppresses click after long-press so existing `onClick` handlers (like card fold/unfold) still work.

## Key Patterns

- **Supabase queries**: `useEffect` with `supabase.from(table).select()` / `.upsert()` / `.insert()`
- **Realtime**: `supabase.channel(name).on('postgres_changes', ...).subscribe()` — always unsubscribe in cleanup
- **Reactions**: `useReactions(sessionId, targetType)` hook in `src/utils/reactions.js` manages fetch, toggle, and realtime subscription for emoji reactions. Target types: `'quiz'`, `'drawing'`, `'love_note'`, `'deep_dive'`. Long-press on answer cards triggers `ReactionPopup`; existing reactions display via `ReactionBadge`.
- **Tic-Tac-Toe**: Multiplayer via Supabase — game state stored in `responses` table with `pack_id: 'tictactoe'` and `player_id: 'game'`. Each player can only place their own color heart (`player1` = coral, `player2` = blue) and must wait for partner's turn. Uses realtime subscription + 3s polling fallback for sync.
- **No component library**: all UI is custom JSX with inline styles
- **Error handling**: Most pages use an `error` state variable with user-visible feedback (inline `<p>` or banner). Some use `setTimeout` for auto-dismiss after 3 seconds.
- **Dynamic page titles**: `useDocumentTitle()` hook in `App.jsx` sets `document.title` based on the current route.
- **Accessibility**: Bottom nav uses `aria-label`, `aria-current`; quiz options use `aria-pressed`; Love Note Hunt grid uses `role="gridcell"` with keyboard support.
- **localStorage keys**: `sessionId`, `playerName`, `playerId`, plus feature-specific keys like movie vetoes

## Environment Variables

Required in `.env` (prefixed with `VITE_` for Vite):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
