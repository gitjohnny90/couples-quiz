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

`AuthContext` (in `src/contexts/AuthContext.jsx`) wraps the app with Supabase Auth (email + password). Exports `user`, `loading`, `authEvent`, `signUp`, `signIn`, `signOut`, `resetPasswordForEmail`. All routes except `/auth` and `/reset-password` are wrapped in `<RequireAuth>` which redirects unauthenticated users to the sign-in page. The auth page (`src/pages/AuthPage.jsx`) has sign-in/sign-up/forgot-password modes, and a show/hide password button using monkey emojis. Sign-up includes an optional invite code field — if provided, the code is stored in `localStorage` as `pendingInviteCode` (persists through email confirmation). Password reset uses `resetPasswordForEmail()` → Supabase email → `/reset-password` page (`src/pages/ResetPasswordPage.jsx`) which detects recovery via URL hash (`type=recovery`) and lets the user set a new password.

### Session & Identity

`SessionContext` (in `App.jsx`) holds `sessionId`, `playerName`, and `playerId`, persisted to localStorage. Sessions are auto-created on first sign-in: if a `pendingInviteCode` exists in localStorage, the user auto-joins their partner's session as player2; otherwise a new session is auto-created with a `LOVE-XXXX` invite code and the user becomes player1. The `user_sessions` table links Supabase auth users to sessions so they can resume on login. Legacy sessions (pre-auth) are auto-claimed when a user signs in. The home page (`/`) acts as an auto-setup redirector — users with existing sessions are sent straight to the vault. `playerName` is sourced from the `sessions` table (authoritative) rather than auth metadata to avoid name mismatches. Pages that display player names (PredictPartner, DeepDive, etc.) also fetch names directly from the session DB record via a `sessionMyName` state variable.

### Routing

All routes defined in `App.jsx`. `/auth` and `/reset-password` are public; all others require authentication. Four nav tabs map to route groups:
- **home** → `/` (HomePage — auto-setup redirector, sends to vault)
- **quizzes** → `/vault/:id`, `/quiz/:id/:packId`, `/results/:id/:packId`, `/deep-dive/:id`, `/deep-dive/:id/:deckId`, `/predict-partner/:id`, `/quiz-packs/:id`, `/finish-sentence/:id`, `/hot-takes/:id`
- **fun stuff** → `/fun/:id`, `/draw/:id`, `/movies/:id`, `/tictactoe/:id`, `/love-notes/:id`, `/watch-guide/:id`
- **us** → `/profiles/:id` (hub page with links to sub-pages), `/personality/:id` (edit/compare personality tests), `/vision/:id` (north star + vision board tab, dreams + sky + milestones tab), `/journal/:id` (four tabs: quizzes, deep dive, drawings, books), `/study/:id` (Study Together — shared reading + reflections)

### Data Flow

- **Static content** (quiz questions, deep dive decks, drawing prompts, genres) lives in `src/data/*.js` files — not in the database.
- **User data** (answers, profiles, shared items, drawings, dreams) goes to Supabase tables: `sessions`, `responses`, `profiles`, `deep_dive_responses`, `shared_items`, `predict_partner`, `finish_sentence`, `hot_takes`, `love_notes`, `reactions`.
- **Realtime + Polling**: All interactive pages subscribe to Supabase realtime channels (`postgres_changes`, `event: '*'`) AND have a paired 5-second polling fallback. Polling is gated on waiting states (not during active input or after data is complete). Both are cleaned up on unmount.

### Supabase Tables

| Table | Purpose | Key columns |
|-------|---------|-------------|
| `sessions` | One row per couple | `player1_name`, `player2_name`, `invite_code`, `player1_user_id`, `player2_user_id` |
| `user_sessions` | Links auth users to sessions | `user_id`, `session_id`, `player_id` |
| `responses` | Quiz answers, drawings, & tic-tac-toe game state | `session_id`, `pack_id`, `player_id`, `answers` (JSONB) |
| `profiles` | Personality test data | `session_id`, `player_id`, `profile_data` (JSONB) |
| `deep_dive_responses` | Open-ended answers | `session_id`, `deck_id`, `question_id`, `player_id`, `player_name`, `answer` |
| `shared_items` | Movie lists | `session_id`, `type`, `title`, `status`, ratings |
| `love_notes` | Love Note Hunt rounds (notes, cells, guesses) | `session_id`, `round`, `player_id`, `notes` (JSONB), `note_cells` (JSONB) |
| `reactions` | Emoji reactions to answers | `session_id`, `player_id`, `target_type`, `target_id`, `reaction` |
| `predict_partner` | Predict Your Partner answers (dedicated table) | `session_id`, `player_id`, `pack_id`, `question_index`, `own_answer`, `prediction`, `prediction_correct`, `completed_at` |
| `finish_sentence` | Finish My Sentence rounds | `session_id`, `round`, `player_id`, `sentence_starter`, `sentence_finish` |
| `hot_takes` | Hot Takes votes & defenses | `session_id`, `player_id`, `statement_id`, `vote`, `defense` |

All tables use `player_id` as `'player1'` or `'player2'` (tic-tac-toe uses `'game'`, study-together and vision use `'shared'` for shared state). Auth user IDs stored in `sessions` and `user_sessions`.

### Row Level Security (RLS)

All 11 tables have RLS enabled with proper session-scoped policies. No "Allow all" policies exist. No Supabase Storage buckets are used (drawings are base64 in JSONB). Policy SQL is in `supabase-rls-fix.sql`.

- **`user_sessions`**: `FOR ALL` — `user_id = (SELECT auth.uid())`
- **`sessions`**: 4 per-operation policies to handle bootstrap (before `user_sessions` row exists):
  - SELECT: via `user_sessions` lookup OR direct `player1_user_id`/`player2_user_id` match OR open sessions (invite code with no player2, or legacy unclaimed)
  - INSERT: `player1_user_id = auth.uid()`
  - UPDATE: linked partners OR direct player match OR open join slot (`player2_user_id IS NULL AND player2_name IS NULL`)
  - DELETE: blocked (`USING (false)`)
- **9 feature tables** (`responses`, `profiles`, `deep_dive_responses`, `shared_items`, `love_notes`, `reactions`, `predict_partner`, `finish_sentence`, `hot_takes`): `FOR ALL` — `session_id IN (SELECT session_id FROM user_sessions WHERE user_id = (SELECT auth.uid()))`

All policies use `(SELECT auth.uid())` (subquery form) for Postgres initPlan caching optimization. Performance indexes exist on `user_sessions(user_id)`, `user_sessions(session_id)`, and `session_id` columns on all feature tables.

## Styling

**No Tailwind, no CSS-in-JS** — uses inline styles and CSS custom properties in `src/index.css`.

The visual theme is a hand-drawn notebook:
- Warm paper background (`--bg-paper: #FFF8F0`) with ruled lines and a red margin
- Fonts: **Caveat** (headings), **Patrick Hand** (body), **Inter** (UI)
- Cards have "tape mark" pseudo-elements and slight rotations
- CSS variables for the color palette: `--accent-coral`, `--accent-sage`, `--accent-blue`, `--accent-mustard`
- Player colors: player1 = coral (`#E88D7A`), player2 = blue (`#7EB8D8`) — always by player ID, not by "mine/theirs" perspective
- Mobile-first single-column layout throughout

### Doodles

`src/components/Doodles.jsx` exports SVG components (DoodleHeart, DoodleStar, DoodleArrow, DoodleFlower, etc.) plus a `PageDoodles` default export that scatters decorative doodles in page margins. All doodle SVGs use `pointer-events: none` and `position: absolute`.

### Components

- `src/components/Doodles.jsx` — decorative SVG doodles (see Doodles section above)
- `src/components/DrawingCanvas.jsx` — reusable canvas with color picker, eraser, undo/clear. Uses pointer events and `globalCompositeOperation` for erasing. Exports drawing as PNG data URL via `onDrawingChange` callback.
- `src/components/SpinningWheel.jsx` — SVG genre wheel used by Movies page. Titles rendered via `<textPath>` along each slice's midline (flipped for bottom half so text is never upside-down). CSS transition spin animation with cubic-bezier easing; auto-scrolls to result card after landing.
- `src/components/ReactionPopup.jsx` — floating emoji picker that appears on long-press. Uses framer-motion spring animations, fixed-position backdrop, smart positioning above/below the target. Highlights your current selection (coral border) and shows a blue dot on partner's pick.
- `src/components/ReactionBadge.jsx` — bare emoji(s) positioned at the bottom-right edge of an answer/drawing box, hanging halfway off the corner (`position: absolute; bottom: -10; right: -6`). Parent must have `position: relative; overflow: visible`. Pop animation (spring: stiffness 500, damping 12) only fires for real-time arrivals, not pre-existing reactions on page load (800ms mount delay via ref). Shows one or two emojis (yours + partner's) with slight overlap when both exist.
- `src/components/ReactionPicker.jsx` — re-export barrel for ReactionPopup, ReactionBadge, and useLongPress.
- `src/components/MissYouHeart.jsx` — absolute-positioned candy conversation heart ("MISS U") in top-right corner (scrolls with page, does not follow viewport). Tapping sends a nudge to partner via `responses` table (`pack_id: 'nudge'`). Partner sees a toast notification in real time. 30-second cooldown between sends. Rendered in `App.jsx` alongside `BottomNav`. Parent `.app` div has `position: relative` for positioning context.

### Hooks

- `src/hooks/useLongPress.js` — detects press-and-hold gestures (500ms). Returns pointer event handlers to spread onto any element. Suppresses click after long-press so existing `onClick` handlers (like card fold/unfold) still work.

## Key Patterns

### Realtime + Polling (standardized in v1.0)

Every interactive page follows this pattern:

1. **`useCallback`-wrapped fetch function** with `[sessionId, ...]` deps — prevents stale closures
2. **Realtime subscription** using `event: '*'` (not `'INSERT'`) to catch all change types
3. **Polling fallback** at 5-second intervals, gated on waiting states
4. **`mountedRef` guard** (`useRef(true)` with cleanup) — checked after every `await` to prevent state updates on unmounted components
5. **Unique channel names** via `useRef` with random suffix (`Math.random().toString(36).slice(2, 8)`) — prevents duplicate subscriptions in React StrictMode
6. **Cleanup**: both `supabase.removeChannel(channel)` and `clearInterval(interval)` in effect cleanups

```javascript
// Standard pattern (see any interactive page for full example)
const mountedRef = useRef(true)
const channelId = useRef(`page-name-${sessionId}-${Math.random().toString(36).slice(2, 8)}`)

useEffect(() => {
  mountedRef.current = true
  return () => { mountedRef.current = false }
}, [])

const fetchData = useCallback(async () => {
  const { data } = await supabase.from('table').select('*').eq('session_id', sessionId)
  if (!mountedRef.current) return
  setData(data)
}, [sessionId])

// Realtime
useEffect(() => {
  const channel = supabase.channel(channelId.current)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'table',
      filter: `session_id=eq.${sessionId}` }, () => fetchData())
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}, [sessionId, fetchData])

// Polling fallback (gated on waiting state)
useEffect(() => {
  if (screen === 'results') return
  const interval = setInterval(fetchData, 5000)
  return () => clearInterval(interval)
}, [fetchData, screen])
```

### SessionId Sync

All pages with `:sessionId` URL param sync it to SessionContext on mount. This ensures direct URL navigation works correctly:

```javascript
const { sessionId } = useParams()
const { setSessionId } = useContext(SessionContext)
useEffect(() => { if (sessionId) setSessionId(sessionId) }, [sessionId])
```

### Other Patterns

- **Supabase queries**: `useEffect` with `supabase.from(table).select()` / `.upsert()` / `.insert()`
- **Reactions**: `useReactions(sessionId, targetType)` hook in `src/utils/reactions.js` manages fetch, toggle, and realtime subscription for emoji reactions. Target types: `'quiz'`, `'drawing'`, `'love_note'`, `'deep_dive'`. Each individual answer/drawing is its own reaction target — long-press on a specific answer box opens `ReactionPopup`, and `ReactionBadge` displays at that answer's bottom-right edge. TargetId formats: `${packId}:${questionId}:player1` (quiz), `${packId}:player1` (drawing). Toggle behavior: same emoji = remove, different emoji = switch, none = create.
- **Tic-Tac-Toe**: Multiplayer via Supabase — game state stored in `responses` table with `pack_id: 'tictactoe'` and `player_id: 'game'`. Each player can only place their own color heart (`player1` = coral, `player2` = blue) and must wait for partner's turn. Uses realtime subscription + 3s polling fallback for sync.
- **Study Together**: `src/pages/StudyTogetherPage.jsx` — three shelves (Personal Growth, Marriage & Couples, Christian). Books stored in `responses` table with `pack_id: 'study-together'`, `player_id: 'shared'`, JSONB `answers.books` array. Four status stages: want → reading → finished → reflected. Each partner writes guided reflections (4 prompts + freeform) when a book is finished; status auto-sets to `reflected` when both partners have saved reflections. Reflections are shown as a unified questionnaire with color-coded inputs per player (coral/blue). `handleSaveReflection` does a fresh DB fetch before merging to prevent race conditions when both partners save close together. Auto-fix in `fetchData` corrects stale "finished" books that have both reflections to "reflected". Finished books also appear in the Journal's "books" tab (`JournalPage.jsx`).
- **Predict Your Partner**: `src/pages/PredictPartnerPage.jsx` — 4 series x 4 packs x 3 questions (48 total). Each player answers for themselves AND predicts partner's answer. Data stored in `predict_partner` table with one row per question (3 per pack per player). Columns: `own_answer`, `prediction`, `prediction_correct` (nullable boolean, marked during reveal), `completed_at`. Unique on `(session_id, pack_id, player_id, question_index)`. During reveal, each player marks whether partner's predictions about them were correct (checkmark/X) via single-row updates. Score summary shows progressively as marks come in (not hidden until all marked). Score labels from 0/6 to 6/6. Questions in `src/data/predictPartnerQuestions.js`. Uses realtime + 5s polling. Player names sourced from session table (not context) via `sessionMyName` state.
- **Finish My Sentence**: `src/pages/FinishSentencePage.jsx` — each player writes a sentence starter for their partner to finish. Flow: write → wait-for-partner-starter → finish → wait-for-partner-finish → reveal. Data stored in `finish_sentence` table with round-based grouping (2 rows per round, one per player's starter). 15 suggestion chips in `src/data/sentenceStarters.js`. Character limits: 80 for starters, 150 for finishes. Auto-appends "..." to starters. Color-coded reveal (starter in writer's color, finish in finisher's color). Archive section shows past completed rounds. Uses realtime + 5s polling.
- **Hot Takes**: `src/pages/HotTakesPage.jsx` — 50 bold statements across 3 categories (Relationship, Spicy, Unhinged) in 10 groups of 5. Statements in `src/data/hotTakesStatements.js`. Fully async flow: each player votes (agree/disagree) on all 5 statements in a group at their own pace — no waiting between statements. After voting all 5, shows "waiting for partner" or results if partner already finished. Results screen shows all 5 with score (X/5 agreed + label), per-statement badges, both votes, and inline expandable defense writing for disagreements (150 chars, optional). 4 screens: `categories`, `statement` (auto-advance), `group-done` (waiting), `results` (combined reveal + defense + summary). Running total stats across all completed groups. Data stored in `hot_takes` table with per-player-per-statement rows, nullable `defense` column. Uses realtime + 5s polling on waiting/results screens. `useCallback` for `fetchAll` memoization.
- **Deep Dive colors**: Player colors in `DeepDiveDeckPage.jsx` are assigned by `player_id` (player1 = coral, player2 = blue), not by mine/theirs perspective. This ensures colors are consistent regardless of which player is viewing.
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

## Milestone History

### v1.0 — Polish & Security (completed 2026-03-12)
- **Phase 1**: RLS policies deployed on all 11 tables (removed "Allow all" policies, added session-scoped access with per-operation policies on `sessions` for bootstrap flows)
- **Phase 2**: Predict Your Partner data migration verified (dedicated `predict_partner` table with per-question rows, zero legacy rows in `responses`)
- **Phase 3**: Polling fallbacks standardized on all interactive pages (realtime `event: '*'` + 5s polling + `useCallback` fetch functions + cleanup)
- **Phase 4**: Quiz bug fixes (sessionId sync, mountedRef guards, unique channel names via `useRef` with random suffix)
- **QA bug triage** (3 tester reports, 65+ findings triaged):
  - Fixed: Deep Dive player colors now assigned by `player_id` not mine/theirs perspective
  - Fixed: Player names sourced from session DB (`sessionMyName` state) instead of auth metadata
  - Fixed: PYP score summary shows progressively as marks come in (not hidden until all 6 judged)
  - Fixed: Draw Together `.drawing-reveal-name` CSS overflow/truncation handling
  - Fixed: `setSessionId(sessionId)` sync added to all 22 routed pages (was only on 9)
  - Not relevant: Home tab blank page (old build), Random card modal (already fixed), Miss You Heart feedback (already working)
