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

`AuthContext` (in `src/contexts/AuthContext.jsx`) wraps the app with Supabase Auth (email + password). Exports `user`, `loading`, `authEvent`, `signUp`, `signIn`, `signOut`, `resetPasswordForEmail`. All routes except `/auth` and `/reset-password` are wrapped in `<RequireAuth>` which redirects unauthenticated users to the sign-in page. The auth page (`src/pages/AuthPage.jsx`) has sign-in/sign-up/forgot-password modes, and a show/hide password button using monkey emojis (🐵 show / 🙈 hide). Password reset uses `resetPasswordForEmail()` → Supabase email → `/reset-password` page (`src/pages/ResetPasswordPage.jsx`) which detects recovery via URL hash (`type=recovery`) and lets the user set a new password.

### Session & Identity

`SessionContext` (in `App.jsx`) holds `sessionId`, `playerName`, and `playerId`, persisted to localStorage. Partners join via an invite code (`LOVE-XXXX`) generated on session creation. The `user_sessions` table links Supabase auth users to sessions so they can resume on login. Legacy sessions (pre-auth) are auto-claimed when a user signs in.

### Routing

All routes defined in `App.jsx`. `/auth` and `/reset-password` are public; all others require authentication. Four nav tabs map to route groups:
- **home** → `/` (HomePage — session creation/join via invite code)
- **quizzes** → `/vault/:id`, `/quiz/:id/:packId`, `/results/:id/:packId`, `/deep-dive/:id`, `/deep-dive/:id/:deckId`, `/quiz-packs/:id`
- **fun stuff** → `/fun/:id`, `/draw/:id`, `/movies/:id`, `/tictactoe/:id`, `/love-notes/:id`, `/watch-guide/:id`
- **us** → `/profiles/:id` (hub page with links to sub-pages), `/personality/:id` (edit/compare personality tests), `/vision/:id` (north star + vision board tab, dreams + sky + milestones tab), `/journal/:id` (four tabs: quizzes, deep dive, drawings, books), `/study/:id` (Study Together — shared reading + reflections)

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
| `shared_items` | Movie lists | `session_id`, `type`, `title`, `status`, ratings |
| `love_note_games` | Love Note Hunt game state | `session_id`, `player_id`, `notes` (JSONB), `note_cells` (JSONB) |
| `love_note_guesses` | Love Note Hunt guesses | `game_id`, `player_id`, `cell_index` |
| `reactions` | Emoji reactions to answers | `session_id`, `player_id`, `target_type`, `target_id`, `reaction` |

All tables use `player_id` as `'player1'` or `'player2'` (tic-tac-toe uses `'game'`, study-together and vision use `'shared'` for shared state). Auth user IDs stored in `sessions` and `user_sessions`.

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
- `src/components/SpinningWheel.jsx` — SVG genre wheel used by Movies page. Titles rendered via `<textPath>` along each slice's midline (flipped for bottom half so text is never upside-down). CSS transition spin animation with cubic-bezier easing; auto-scrolls to result card after landing.
- `src/components/ReactionPopup.jsx` — floating emoji picker (❤️ 😂 🔥) that appears on long-press. Uses framer-motion spring animations, fixed-position backdrop, smart positioning above/below the target. Highlights your current selection (coral border) and shows a blue dot on partner's pick.
- `src/components/ReactionBadge.jsx` — bare emoji(s) positioned at the bottom-right edge of an answer/drawing box, hanging halfway off the corner (`position: absolute; bottom: -10; right: -6`). Parent must have `position: relative; overflow: visible`. Pop animation (spring: stiffness 500, damping 12) only fires for real-time arrivals, not pre-existing reactions on page load (800ms mount delay via ref). Shows one or two emojis (yours + partner's) with slight overlap when both exist.
- `src/components/ReactionPicker.jsx` — re-export barrel for ReactionPopup, ReactionBadge, and useLongPress.
- `src/components/MissYouHeart.jsx` — absolute-positioned candy conversation heart ("MISS U") in top-right corner (scrolls with page, does not follow viewport). Tapping sends a nudge to partner via `responses` table (`pack_id: 'nudge'`). Partner sees a toast notification in real time. 30-second cooldown between sends. Rendered in `App.jsx` alongside `BottomNav`. Parent `.app` div has `position: relative` for positioning context.

### Hooks

- `src/hooks/useLongPress.js` — detects press-and-hold gestures (500ms). Returns pointer event handlers to spread onto any element. Suppresses click after long-press so existing `onClick` handlers (like card fold/unfold) still work.

## Key Patterns

- **Supabase queries**: `useEffect` with `supabase.from(table).select()` / `.upsert()` / `.insert()`
- **Realtime**: `supabase.channel(name).on('postgres_changes', ...).subscribe()` — always unsubscribe in cleanup
- **Reactions**: `useReactions(sessionId, targetType)` hook in `src/utils/reactions.js` manages fetch, toggle, and realtime subscription for emoji reactions. Target types: `'quiz'`, `'drawing'`, `'love_note'`, `'deep_dive'`. Each individual answer/drawing is its own reaction target — long-press on a specific answer box opens `ReactionPopup`, and `ReactionBadge` displays at that answer's bottom-right edge. TargetId formats: `${packId}:${questionId}:player1` (quiz), `${packId}:player1` (drawing). Toggle behavior: same emoji = remove, different emoji = switch, none = create.
- **Tic-Tac-Toe**: Multiplayer via Supabase — game state stored in `responses` table with `pack_id: 'tictactoe'` and `player_id: 'game'`. Each player can only place their own color heart (`player1` = coral, `player2` = blue) and must wait for partner's turn. Uses realtime subscription + 3s polling fallback for sync.
- **Study Together**: `src/pages/StudyTogetherPage.jsx` — three shelves (Personal Growth 🌳, Marriage & Couples 💕, Faith & Christian 🕊️). Books stored in `responses` table with `pack_id: 'study-together'`, `player_id: 'shared'`, JSONB `answers.books` array. Four status stages: want → reading → finished → reflected. Each partner writes guided reflections (4 prompts + freeform) when a book is finished; status auto-sets to `reflected` when both partners have saved reflections. Reflections color-coded by player (coral/blue). Finished books also appear in the Journal's "books" tab (`JournalPage.jsx`).
- **No component library**: all UI is custom JSX with inline styles
- **Error handling**: Most pages use an `error` state variable with user-visible feedback (inline `<p>` or banner). Some use `setTimeout` for auto-dismiss after 3 seconds.
- **Dynamic page titles**: `useDocumentTitle()` hook in `App.jsx` sets `document.title` based on the current route.
- **Accessibility**: Bottom nav uses `aria-label`, `aria-current`; quiz options use `aria-pressed`; Love Note Hunt grid uses `role="gridcell"` with keyboard support.
- **localStorage keys**: `sessionId`, `playerName`, `playerId`, plus feature-specific keys like movie vetoes

## Dev Preview Bypass

Set `VITE_DEV_BYPASS_AUTH=true` in `.env` to bypass Supabase auth during local dev/preview. This is double-gated: requires both `import.meta.env.DEV` (Vite dev mode only) and the env var, so it's dead code in production builds. When active:
- `AuthContext` provides a mock user and skips Supabase auth initialization
- `SessionContext` defaults to `sessionId: "preview"`, `playerName: "Preview"`, `playerId: "player1"` when no localStorage values exist
- All authenticated pages render with their layouts and empty data states

## Environment Variables

Required in `.env` (prefixed with `VITE_` for Vite):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_DEV_BYPASS_AUTH` — optional, set to `true` for dev preview auth bypass (see above)
