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
- Deployed on **Vercel** at **theusquiz.com** with SPA rewrites and domain redirect (`vercel.json`)

## Architecture

**The Us Quiz** is a couples quiz app. One partner creates a session, the other joins via a shared link. All routes include a `:sessionId` param.

### Authentication

`AuthContext` (in `src/contexts/AuthContext.jsx`) wraps the app with Supabase Auth (email + password). Exports `user`, `loading`, `authEvent`, `signUp`, `signIn`, `signOut`, `resetPasswordForEmail`. All routes except `/auth` and `/reset-password` are wrapped in `<RequireAuth>` which redirects unauthenticated users to the sign-in page. The auth page (`src/pages/AuthPage.jsx`) has sign-in/sign-up/forgot-password modes, and a show/hide password button using monkey emojis. Sign-up includes an optional invite code field — if provided, the code is stored in both `localStorage` as `pendingInviteCode` AND in Supabase `user_metadata.invite_code` (belt-and-suspenders: localStorage for same-device, user_metadata for cross-device email confirmation). After use, the metadata field is cleared via `updateUser({ data: { invite_code: null } })`. Password reset uses `resetPasswordForEmail()` → Supabase email → `/reset-password` page (`src/pages/ResetPasswordPage.jsx`) which detects recovery via URL hash (`type=recovery`) and lets the user set a new password. Auth form fields have proper `htmlFor`/`id` label associations for screen reader accessibility.

### Session & Identity

`SessionContext` (in `App.jsx`) holds `sessionId`, `playerName`, and `playerId`, persisted to localStorage. Sessions are auto-created on first sign-in: if a `pendingInviteCode` exists in localStorage or `user_metadata.invite_code`, the user auto-joins their partner's session as player2; otherwise the user sees a manual join/create UI — they can enter an invite code to join, or create a new session with a `LOVE-XXXX` invite code as player1. The `user_sessions` table links Supabase auth users to sessions so they can resume on login. Legacy sessions (pre-auth) are auto-claimed when a user signs in. The home page (`/`) acts as an auto-setup redirector — users with existing sessions are sent straight to the vault. Player2 join uses an atomic conditional UPDATE (`WHERE player2_user_id IS NULL`) to prevent race-condition double-joins — only one user can claim the slot. `playerName` is sourced from the `sessions` table (authoritative) rather than auth metadata to avoid name mismatches. Pages that display player names (PredictPartner, DeepDive, etc.) also fetch names directly from the session DB record via a `sessionMyName` state variable (or via the `useSessionSetup` hook).

## Command Center Brain (Read + Write Access)

The Command Center brain is an Obsidian vault at `C:\My Vaults\CommandCenter\` that serves as the central knowledge base across all of John's projects. You have access to it.

**Read:** When you need context on strategy, decisions, positioning, pricing, or anything cross-project, check the brain:
- `C:\My Vaults\CommandCenter\wiki\` — Compiled knowledge pages (concepts, people-and-tools, overviews, frameworks)
- `C:\My Vaults\CommandCenter\reports\decisions\` — All strategic decisions (DEC-001 through DEC-036+)
- `C:\My Vaults\CommandCenter\reports\priorities.md` — Current priority stack
- `C:\My Vaults\CommandCenter\index.md` — Master catalog of all wiki pages

**Write:** After every `git push`, write a brief report to:
C:\My Vaults\CommandCenter\reports\team\build-YYYY-MM-DD.md

If a report for today already exists, append to it — don't overwrite.

Each entry should include:
- Timestamp
- What was pushed (files changed, features added/fixed)
- Any decisions made during the session
- Current status (what's working, what's next)
- Any blockers or issues encountered

Keep it concise — the CEO session reads these for a quick briefing, not a novel.

### Routing

All routes defined in `App.jsx`. `/auth`, `/reset-password`, and `/waitlist` are public; all others require authentication. **Code splitting**: Only 3 critical-path pages (AuthPage, HomePage, VaultPage) are eagerly imported; all other 22 pages use `React.lazy()` with a `<Suspense>` fallback ("flipping to that page..."). This produces ~32 JS chunks instead of one monolithic bundle. Four nav tabs map to route groups:
- **home** → `/` (HomePage — auto-setup redirector, sends to vault)
- **quizzes** → `/vault/:id`, `/quiz/:id/:packId`, `/results/:id/:packId`, `/deep-dive/:id`, `/deep-dive/:id/:deckId`, `/predict-partner/:id`, `/quiz-packs/:id`, `/finish-sentence/:id`, `/hot-takes/:id`
- **fun stuff** → `/fun/:id`, `/draw/:id`, `/draw-results/:id/:promptId`, `/movies/:id`, `/tictactoe/:id`, `/heartline/:id`, `/love-notes/:id`, `/watch-guide/:id`
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
| `waitlist` | App Store email waitlist | `email` (unique), `source` (nullable, from `?src=` param), `created_at` |

All tables use `player_id` as `'player1'` or `'player2'` (tic-tac-toe uses `'game'`, study-together and vision use `'shared'` for shared state). Auth user IDs stored in `sessions` and `user_sessions`.

### Row Level Security (RLS)

All 12 tables have RLS enabled with proper session-scoped policies. No "Allow all" policies exist. No Supabase Storage buckets are used (drawings are base64 in JSONB). Policy SQL is in `supabase-rls-fix.sql` (core tables), `supabase-waitlist.sql` (waitlist), and `supabase/migrations/05-player-id-rls.sql` (per-operation write policies). Stale bootstrap SQL files (`supabase-schema.sql`, `supabase-shared-items.sql`, `supabase-deep-dive.sql`) are marked SUPERSEDED — do not execute.

- **`user_sessions`**: `FOR ALL` — `user_id = (SELECT auth.uid())`
- **`sessions`**: 4 per-operation policies to handle bootstrap (before `user_sessions` row exists):
  - SELECT: via `user_sessions` lookup OR direct `player1_user_id`/`player2_user_id` match OR open sessions (invite code with no player2, or legacy unclaimed)
  - INSERT: `player1_user_id = auth.uid()`
  - UPDATE: linked partners OR direct player match OR open join slot (`player2_user_id IS NULL AND player2_name IS NULL`)
  - DELETE: blocked (`USING (false)`)
- **9 feature tables** (`responses`, `profiles`, `deep_dive_responses`, `shared_items`, `love_notes`, `reactions`, `predict_partner`, `finish_sentence`, `hot_takes`):
  - SELECT: `session_id IN (SELECT session_id FROM user_sessions WHERE user_id = (SELECT auth.uid()))` (session-scoped reads)
  - INSERT/UPDATE: session membership check AND `player_id` must match the authenticated user's role in that session (via subquery to `user_sessions`). Special cases: `'game'`, `'shared'` player_id values are allowed for both partners (tic-tac-toe, study-together, vision board).
  - DELETE: session membership check (same as SELECT)
- **`waitlist`**: `FOR INSERT` only — `WITH CHECK (true)`. No SELECT/UPDATE/DELETE policies. Data only accessible from Supabase Dashboard or service role key.

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
- `src/components/PageGuide.jsx` — first-visit onboarding tooltip system. Shows a friendly overlay explaining what the current page does on first visit (tracked in localStorage `pageGuideSeen`). After dismissal, collapses into a persistent (?) button fixed in the top-left corner (top-right is reserved for MissYouHeart). Content defined in `src/data/pageGuides.js` with a `pageKey` per page. Integrated into all 22 authenticated pages via `<PageGuide pageKey="..." />`. Overlay uses `role="dialog"`, `aria-modal="true"`, focus trap (tabIndex=-1 on content div, gotIt button as sole tab stop), Escape-to-close, and focus restoration to trigger button on dismissal.
- `src/components/AppWaitlistPrompt.jsx` — post-activity email capture card for App Store waitlist. Shows once after a user's first completed activity (tracked via `completedActivityCount` + `waitlistPromptDismissed` in localStorage). Accepts `activityCount` prop so it re-checks visibility when the count changes (fixes timing bug where mount-time check ran before the count was incremented). Exports `trackActivityCompletion()` which pages call from their results useEffect — the returned count is passed as the prop. Integrated into 5 results pages: ResultsPage, DrawResultsPage, FinishSentencePage, PredictPartnerPage, HotTakesPage.

### Hooks

- `src/hooks/useLongPress.js` — detects press-and-hold gestures (500ms). Returns pointer event handlers to spread onto any element. Suppresses click after long-press so existing `onClick` handlers (like card fold/unfold) still work.
- `src/hooks/useRealtimeSync.js` — reusable hook encapsulating the realtime subscription + polling fallback pattern. Accepts `{ table, sessionId, onUpdate, channelPrefix, pollingEnabled, pollingInterval }`. The `onUpdate` callback **must** be wrapped in `useCallback` by the caller to keep polling intervals and realtime channels stable. Creates a unique channel name via `useRef` with random suffix; cleans up both channel and interval on unmount.
- `src/hooks/useSessionSetup.js` — reusable hook encapsulating sessionId URL sync, mountedRef lifecycle, and player/partner name fetching from the sessions table. Returns `{ sessionId, playerId, playerName, partnerId, partnerName, sessionMyName, mountedRef }`. Used by the three largest pages (PredictPartnerPage, LoveNoteHuntPage, StudyTogetherPage).

## Key Patterns

### Realtime + Polling (standardized in v1.0, hooks added in v1.1)

**Preferred approach (v1.1+):** Use `useRealtimeSync` hook + `useSessionSetup` hook:

```javascript
import useSessionSetup from '../hooks/useSessionSetup'
import useRealtimeSync from '../hooks/useRealtimeSync'

const { sessionId, playerId, playerName, partnerName, sessionMyName, mountedRef } = useSessionSetup()

const fetchData = useCallback(async () => {
  const { data } = await supabase.from('table').select('col1, col2').eq('session_id', sessionId)
  if (!mountedRef.current) return
  setData(data)
}, [sessionId])

useRealtimeSync({
  table: 'table',
  sessionId,
  onUpdate: fetchData,        // MUST be useCallback-wrapped
  channelPrefix: 'page-name',
  pollingEnabled: screen !== 'results',  // gate on waiting state
})
```

**CRITICAL:** The `onUpdate` callback passed to `useRealtimeSync` **must** be wrapped in `useCallback` with correct dependencies (typically `[sessionId]`). Without this, the polling interval and realtime channel tear down and recreate on every parent render. `supabase`, `mountedRef`, and state setters are stable refs/primitives — they don't need to be in the dep array.

**Manual pattern (legacy pages):** Some pages still use the manual approach:

1. **`useCallback`-wrapped fetch function** with `[sessionId, ...]` deps — prevents stale closures
2. **Realtime subscription** using `event: '*'` (not `'INSERT'`) to catch all change types
3. **Polling fallback** at 5-second intervals, gated on waiting states
4. **`mountedRef` guard** (`useRef(true)` with cleanup) — checked after every `await` to prevent state updates on unmounted components
5. **Unique channel names** via `useRef` with random suffix (`Math.random().toString(36).slice(2, 8)`) — prevents duplicate subscriptions in React StrictMode
6. **Cleanup**: both `supabase.removeChannel(channel)` and `clearInterval(interval)` in effect cleanups

**Query optimization:** All Supabase queries specify explicit columns (e.g., `.select('id, session_id, answers')`) — never use `select('*')` on tables with large JSONB or base64 columns.

### SessionId Sync

All pages with `:sessionId` URL param sync it to SessionContext on mount. This ensures direct URL navigation works correctly. Pages using `useSessionSetup()` get this automatically. Pages not using the hook do it manually:

```javascript
const { sessionId } = useParams()
const { setSessionId } = useContext(SessionContext)
useEffect(() => { if (sessionId) setSessionId(sessionId) }, [sessionId])
```

### Other Patterns

- **Supabase queries**: `useEffect` with `supabase.from(table).select()` / `.upsert()` / `.insert()`
- **Reactions**: `useReactions(sessionId, targetType)` hook in `src/utils/reactions.js` manages fetch, toggle, and realtime subscription for emoji reactions. Target types: `'quiz'`, `'drawing'`, `'love_note'`, `'deep_dive'`. Each individual answer/drawing is its own reaction target — long-press on a specific answer box opens `ReactionPopup`, and `ReactionBadge` displays at that answer's bottom-right edge. TargetId formats: `${packId}:${questionId}:player1` (quiz), `${packId}:player1` (drawing). Toggle behavior: same emoji = remove, different emoji = switch, none = create.
- **Tic-Tac-Toe**: Multiplayer via Supabase — game state stored in `responses` table with `pack_id: 'tictactoe'` and `player_id: 'game'`. Each player can only place their own color heart (`player1` = coral, `player2` = blue) and must wait for partner's turn. Uses realtime subscription + 3s polling fallback for sync.
- **Heart Line**: `src/pages/HeartLinePage.jsx` — couples Connect Four on a 7×6 grid. Hearts drop with gravity animation into the lowest available row. Player1 gets filled hearts (coral), player2 gets filled hearts (blue). Game state stored in `responses` table with `pack_id: 'heartline'`, `player_id: 'game'`. Win detection checks horizontal, vertical, and both diagonals for 4-in-a-row. Winning cells get a glow animation. Same realtime + 3s polling pattern as Tic-Tac-Toe.
- **Study Together**: `src/pages/StudyTogetherPage.jsx` — three shelves (Personal Growth, Marriage & Couples, Christian). Books stored in `responses` table with `pack_id: 'study-together'`, `player_id: 'shared'`, JSONB `answers.books` array. Four status stages: want → reading → finished → reflected. Each partner writes guided reflections (4 prompts + freeform) when a book is finished; status auto-sets to `reflected` when both partners have saved reflections. Reflections are shown as a unified questionnaire with color-coded inputs per player (coral/blue). `handleSaveReflection` does a fresh DB fetch before merging to prevent race conditions when both partners save close together. Auto-fix in `fetchData` corrects stale "finished" books that have both reflections to "reflected". Finished books also appear in the Journal's "books" tab (`JournalPage.jsx`).
- **Predict Your Partner**: `src/pages/PredictPartnerPage.jsx` — 4 series x 4 packs x 3 questions (48 total). Each player answers for themselves AND predicts partner's answer. Data stored in `predict_partner` table with one row per question (3 per pack per player). Columns: `own_answer`, `prediction`, `prediction_correct` (nullable boolean, marked during reveal), `completed_at`. Unique on `(session_id, pack_id, player_id, question_index)`. During reveal, each player marks whether partner's predictions about them were correct (checkmark/X) via single-row updates. Score summary shows progressively as marks come in (not hidden until all marked). Score labels from 0/6 to 6/6. Questions in `src/data/predictPartnerQuestions.js`. Uses realtime + 5s polling. Player names sourced from session table (not context) via `sessionMyName` state.
- **Finish My Sentence**: `src/pages/FinishSentencePage.jsx` — each player writes a sentence starter for their partner to finish. Flow: write → wait-for-partner-starter → finish → wait-for-partner-finish → reveal. Data stored in `finish_sentence` table with round-based grouping (2 rows per round, one per player's starter). 15 suggestion chips in `src/data/sentenceStarters.js`. Character limits: 80 for starters, 150 for finishes. Auto-appends "..." to starters. Color-coded reveal (starter in writer's color, finish in finisher's color). Archive section shows past completed rounds. Uses realtime + 5s polling.
- **Hot Takes**: `src/pages/HotTakesPage.jsx` — 50 bold statements across 3 categories (Relationship, Spicy, Unhinged) in 10 groups of 5. Statements in `src/data/hotTakesStatements.js`. Fully async flow: each player votes (agree/disagree) on all 5 statements in a group at their own pace — no waiting between statements. After voting all 5, shows "waiting for partner" or results if partner already finished. Results screen shows all 5 with score (X/5 agreed + label), per-statement badges, both votes, and inline expandable defense writing for disagreements (150 chars, optional). 4 screens: `categories`, `statement` (auto-advance), `group-done` (waiting), `results` (combined reveal + defense + summary). Running total stats across all completed groups. Data stored in `hot_takes` table with per-player-per-statement rows, nullable `defense` column. Uses realtime + 5s polling on waiting/results screens. `useCallback` for `fetchAll` memoization.
- **Deep Dive colors**: Player colors in `DeepDiveDeckPage.jsx` are assigned by `player_id` (player1 = coral, player2 = blue), not by mine/theirs perspective. This ensures colors are consistent regardless of which player is viewing.
- **No component library**: all UI is custom JSX with inline styles
- **Error handling**: Most pages use an `error` state variable with user-visible feedback (inline `<p>` or banner). Some use `setTimeout` for auto-dismiss after 3 seconds.
- **Dynamic page titles**: `useDocumentTitle()` hook in `App.jsx` sets `document.title` based on the current route.
- **Accessibility**: Bottom nav uses `aria-label`, `aria-current`; quiz options use `aria-pressed`; Love Note Hunt grid uses `role="gridcell"` with keyboard support. Interactive cards on VaultPage, HotTakesPage, VisionTab, StudyTogetherPage, and ResultsPage have `role="button"`, `tabIndex={0}`, `onKeyDown` (Enter/Space), and `aria-label` or `aria-expanded`. PageGuide uses `role="dialog"` with focus trap and Escape-to-close. AuthPage and WaitlistPage forms use `htmlFor`/`id` label associations.
- **Waitlist**: `src/pages/WaitlistPage.jsx` — public standalone page at `/waitlist` (no auth required) for App Store email capture. Describes The Us Quiz, what the native app adds, and has an email form. Accepts `?src=` URL param for campaign attribution (e.g., `?src=reddit-longdistance`). Stored in `waitlist.source` column. Duplicate emails handled gracefully via Postgres unique constraint (23505 → show success). Submit logic in `src/utils/waitlist.js`.
- **localStorage keys**: `sessionId`, `playerName`, `playerId`, `pageGuideSeen` (object tracking first-visit tooltips), `completedActivityCount`, `waitlistPromptDismissed`, plus feature-specific keys like movie vetoes

## Google Workspace CLI (`gws`)

The `gws` command-line tool is installed and authenticated (johnallen982429@gmail.com). Use it for any Google Workspace tasks — creating docs, reading/writing sheets, etc. No browser needed.

**Common commands:**
- `gws drive files list --params '{"pageSize": 10}'`
- `gws docs documents get --params '{"documentId": "ID"}'`
- `gws sheets spreadsheets values get --params '{"spreadsheetId": "ID", "range": "Sheet1"}'`
- `gws schema <service.resource.method>` — discover any API method's parameters

## MCP Servers (Global — available automatically)

- **Vercel MCP** — Manage deployments, check logs, search Vercel docs. First use requires browser OAuth.
- **Supabase MCP** — Query database, manage tables, generate migrations directly. First use requires browser OAuth. For dev/testing only, not production data.
- **Playwright MCP** — Browser automation via accessibility tree. Test user flows, verify UI, debug pages. No auth needed.

## Skills (Global — available automatically)

- **`/frontend-design`** — Forces deliberate design choices before writing UI code. Bans generic fonts (Inter, Roboto, Arial), enforces a specific visual direction. Use when building or polishing UI.
- **`/skill-creator`** — Build, test, and iterate on custom Claude Code skills. Four modes: Create, Eval, Improve, Benchmark.
- **`/de-ai-ify`** — Remove AI-generated jargon and restore human voice to text.
- **`/voice-extractor`** — Extract and document someone's authentic writing voice from samples.
- 100+ business, marketing, and engineering skills also installed (see skills-and-cli-inventory.md in us-quiz-CEO)

## Deployment & Domain

Production domain is **theusquiz.com** (via Vercel). `vercel.json` contains:
- **Domain redirect**: All `couples-quiz*.vercel.app` URLs permanently redirect (301) to `www.theusquiz.com`
- **SPA rewrite**: `/(.*) → /` so client-side routing works on all paths

## Dev Preview Bypass

Set `VITE_DEV_BYPASS_AUTH=true` in `.env` to bypass Supabase auth during local dev/preview. This is double-gated: requires both `import.meta.env.DEV` (Vite dev mode only) and the env var, so it's dead code in production builds. When active:
- `AuthContext` provides a mock user and skips Supabase auth initialization
- `SessionContext` defaults to `sessionId: "preview"`, `playerName: "Preview"`, `playerId: "player1"` when no localStorage values exist
- All authenticated pages render with their layouts and empty data states

## Test Sweeps

Two Playwright-based sweep scripts live in `.claude/sweep/` (gitignored — they create real Supabase auth users and write to production tables, so they're not part of the build pipeline):

- **`sweep.mjs`** — single-player smoke sweep. Walks all 29 routes under `VITE_DEV_BYPASS_AUTH=true` against `npm run dev`, captures console errors, page errors, and network 4xx per route. Output: `.claude/sweep/sweep-results.json` + per-route screenshots. Use to catch lazy-chunk load failures, route-render regressions, and React component errors.
- **`two-player.mjs`** — seven-phase multiplayer sweep. Drives two browser contexts in parallel against `npm run preview` (production build, no dev-bypass) with real Supabase auth using fake `@example.test` emails. Phases: P1 sign-up → P2 sign-up + auto-join via invite code → vault renders for both → Heart Line bidirectional realtime → Love Notes mount → Hot Takes group with disagreement → Love Note Hunt full setup-and-handshake round → TicTacToe simultaneous-mount race regression check. Use before any major refactor that touches realtime, RLS, or session bootstrapping — and before kicking off the Capacitor native wrap.

The methodology, selector patterns, and 4xx triage rules are documented in `wiki/concepts/Two-Player Sweep Methodology.md` in the Command Center vault. First-time setup on a new machine needs `npx playwright install chromium` since `playwright` is a devDependency but its browser binary isn't downloaded by `npm install` alone.

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

### Post-v1.0 — Soft Launch Prep (2026-03-12)
- **Onboarding tooltips**: `PageGuide` component with first-visit overlays on all 22 pages. Persistent (?) help button. Content in `src/data/pageGuides.js`. Tracks visits in localStorage.
- **Email waitlist**: Supabase `waitlist` table (insert-only RLS). Post-activity prompt on 5 results pages (shows once after first completed activity). Standalone `/waitlist` public page for community sharing. `?src=` URL param for campaign attribution.

### v1.1 — Audit Remediation (completed 2026-03-15)
Independent Codex audit (2026-03-14) surfaced security vulnerabilities, bugs, and quality issues. All 16 findings addressed across 5 phases:
- **Phase 5 (RLS Hardening)**: Per-operation write policies on all 9 feature tables enforce `player_id` matches auth user. Atomic player2 join via conditional UPDATE prevents race-condition double-joins. JoinPage rejects full sessions. Stale bootstrap SQL files marked SUPERSEDED. `finish_sentence`/`hot_takes` RLS type mismatch fixed.
- **Phase 6 (Bug Fixes)**: Share URLs use real session IDs. VisionTab caption autosave uses `dataRef` pattern (no stale closures). PredictPartner post-save reads fresh DB data. All `select('*')` replaced with explicit columns across 17 query sites. CorkBoardSlot manages local caption state to prevent input glitchiness. Invite code persisted in `user_metadata` for cross-device join. Manual join recovery UI when no invite code found. Results waiting screens show LOVE-XXXX invite code or plain waiting message (session-aware two-state).
- **Phase 7 (Accessibility)**: Keyboard button semantics (`role="button"`, `tabIndex={0}`, Enter/Space) on interactive cards across 5 pages. PageGuide dialog with `aria-modal`, focus trap, Escape-to-close. `htmlFor`/`id` label associations on AuthPage and WaitlistPage.
- **Phase 8 (Quality)**: VisionTab hover uses CSS `.vision-pin` class instead of DOM `style.transform` mutations. Stale `/books` route tests fixed (route renamed to `/study`, moved from fun-stuff to us tab). Custom hooks extracted: `useRealtimeSync` (realtime + polling) and `useSessionSetup` (session sync + names + mountedRef). Adopted by 3 largest pages.
- **Phase 9 (useCallback Compliance)**: `fetchResponses` (PredictPartnerPage) and `fetchData` (StudyTogetherPage) wrapped in `useCallback([sessionId])` so `useRealtimeSync` polling intervals stay stable.

### Post-v1.1 — Features & Performance (2026-03-28)
- **Content overhaul**: 19 rewrites, 10 cuts, 60 new pieces across all content types (quiz packs, deep dive decks, predict partner, hot takes, sentence starters, drawing prompts, love notes). Two new quiz packs (Long Distance Round, Money Talks), four new deep dive decks, three new predict partner packs, two new hot takes groups.
- **Heart Line**: Couples Connect Four game (`HeartLinePage.jsx`). 7×6 grid, gravity drop animation, 4-in-a-row win detection (horizontal/vertical/diagonal), glow on winning cells. Multiplayer via Supabase realtime + 3s polling. Game state in `responses` table (`pack_id: 'heartline'`, `player_id: 'game'`).
- **Code splitting**: 22 pages lazy-loaded via `React.lazy()` + `<Suspense>`. Only AuthPage, HomePage, VaultPage eagerly imported. Produces ~32 JS chunks.
- **Domain redirect**: Old `couples-quiz*.vercel.app` URLs permanently redirect to `www.theusquiz.com` via `vercel.json`.
- **FinishSentencePage perf**: Parallelized `fetchAll` queries with `Promise.all`. Eliminated 2 extra DB queries in `handleSubmitStarter` by using local state for round determination (4-query waterfall → 1 insert + 1 refresh).
