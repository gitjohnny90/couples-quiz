# Feature Landscape

**Domain:** Polish, security, and migration milestone for a real-time couples quiz SPA
**Researched:** 2026-03-10

---

## Table Stakes

Features users expect from this milestone. Missing = the milestone is incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Polling fallback on all interactive pages | Reported issue: users have to reload to see partner answers; realtime drops silently on mobile background tabs | Low | Pattern already exists on most pages; audit which pages are missing it |
| RLS enabled on every Supabase table | Industry baseline security; CVE-2025-48757 (Jan 2025) found 83% of exposed Supabase apps had RLS misconfigurations | Medium | RLS is partially in place; full audit means verifying every table has both RLS enabled AND correct policies |
| Predict Your Partner reads/writes from `predict_partner` table | Data already migrated per git log (commit 4982f6a); confirm legacy `responses` table path is fully removed | Low | Migration already done; this milestone ensures cleanup and no dual-write |
| Quiz section bug fixes — buttons, progression | Active user reports; most issues traced to QuizPage having no realtime or polling | Medium | QuizPage has no `channel` or `setInterval` — this is the most likely root cause of "stuck" states |
| Non-breaking changes for active testers | Play testers are in active sessions; any DB change must preserve existing rows | Low | Standard additive migration practice |

---

## Differentiators

Features beyond the minimum that add meaningful value to this hardening milestone.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Conditional polling (stop when complete) | Reduces unnecessary DB reads; pattern already used in ResultsPage (`if (responses.length >= 2) return`) | Low | Apply same guard to other pages — poll only while waiting for partner |
| `removeChannel` paired with `clearInterval` in every cleanup | Prevents channel leaks across React hot-reloads and navigation; already done inconsistently | Low | Some pages clean up both, others only one — standardize |
| RLS policies scoped to `session_id` via `user_sessions` join | Couples-specific access model: a user should only see data for their own session | Medium | Requires `auth.uid()` → `user_sessions` → `session_id` lookup in policy USING clause |
| Error states on quiz save/submit failures | Users see silent blank screens on network failures; visible error with retry is table stakes UX | Low | QuizPage already has `setError` plumbing; ensure it propagates correctly |

---

## Anti-Features

Features to explicitly NOT build in this milestone.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Replace realtime with polling-only | Realtime gives instant partner updates; polling-only introduces 5s lag | Keep realtime primary; polling is the safety net only |
| Aggressive polling on static pages (VaultPage, JournalPage) | These pages display historical data with no waiting-for-partner state; polling wastes DB connections | These pages do not need polling — read once on load is correct |
| Backfilling old `responses` rows into `predict_partner` | Data migration already complete per commit 4982f6a; re-running risks duplicates | Verify migration is done and remove the old `pack_id = 'predict-partner'` query path |
| RLS policies using `user_metadata` claims | User-controlled JWT metadata can be spoofed by authenticated users | Use `auth.uid()` + server-side `user_sessions` table join only |
| New features or game modes | This milestone is explicitly polish-only per PROJECT.md | Defer to v1.1 |
| Polling intervals shorter than 3-5 seconds | Excessive DB load, no meaningful UX improvement | TicTacToePage uses 3s (justified by turn-based nature); everything else should use 5s |

---

## Feature Dependencies

```
RLS audit → requires knowing every table (sessions, responses, profiles, deep_dive_responses,
            shared_items, love_note_games, love_note_guesses, reactions, predict_partner,
            finish_sentence, hot_takes, user_sessions)

Polling fallback audit → requires knowing which pages have a "waiting for partner" state
                       → pages without waiting state (VaultPage, JournalPage, ProfilesPage)
                         do NOT need polling

Quiz bug fixes → polling/realtime audit (QuizPage has neither — likely root cause)
              → QuizPage fix does not depend on RLS or migration

PYP migration cleanup → already done per codebase; this milestone = verify + remove dead code
                      → independent of all other work items
```

---

## Scope Inventory by Page

Compiled from codebase audit:

| Page | Has Realtime | Has Polling | Needs Attention |
|------|-------------|-------------|-----------------|
| QuizPage | No | No | Add polling at minimum; page is submit-only so realtime not needed, but polling not applicable either — bug is likely in button/submit logic |
| ResultsPage | Yes | Yes (stops at 2 responses) | Good pattern — verify INSERT filter is correct |
| PredictPartnerPage | Yes | Yes (5s) | Good; confirm old `responses` query path removed |
| FinishSentencePage | Yes | Yes (5s) | Good |
| HotTakesPage | Yes | Yes (5s) | Good |
| LoveNoteHuntPage | Yes | Yes (conditional) | Good |
| TicTacToePage | Yes | Yes (3s) | Good |
| MoviesPage | Yes | Yes (5s) | Good — both cleaned up together |
| StudyTogetherPage | Yes | Yes (5s) | Good |
| VisionTab | Yes | Yes (5s) | Good |
| DeepDiveDeckPage | Yes | Yes | Verify `removeChannel` is in cleanup |
| DrawResultsPage | Yes | Yes (5s) | Verify `removeChannel` is in cleanup — current code may only clear interval |
| PersonalityPage | No | Yes (5s) | Polling-only is acceptable here — personality data isn't time-critical |
| VaultPage | No | No | Correct — no waiting state |
| JournalPage | No | No | Correct — aggregated read-only view |
| ProfilesPage | No | No | Correct — no waiting state |

---

## RLS Audit Scope

All tables requiring RLS verification:

| Table | Risk Level | Correct Policy Shape |
|-------|------------|---------------------|
| `sessions` | HIGH | `auth.uid() = player1_user_id OR auth.uid() = player2_user_id` |
| `user_sessions` | HIGH | `auth.uid() = user_id` |
| `responses` | HIGH | User is in the session: join via `user_sessions` |
| `predict_partner` | HIGH | Same — session membership check |
| `profiles` | HIGH | Same — session membership check |
| `deep_dive_responses` | HIGH | Same — session membership check |
| `shared_items` | HIGH | Same — session membership check |
| `love_note_games` | HIGH | Same — session membership check |
| `love_note_guesses` | HIGH | Same — session membership check via `game_id` → `love_note_games` |
| `reactions` | MEDIUM | Same — session membership check |
| `finish_sentence` | HIGH | Same — session membership check |
| `hot_takes` | HIGH | Same — session membership check |

Key constraint: RLS policies must never hardcode user IDs. Always use `auth.uid()` at query time. The standard Supabase couples-app pattern is a subquery: `session_id IN (SELECT session_id FROM user_sessions WHERE user_id = auth.uid())`.

---

## Migration Scope

The Predict Your Partner migration is already complete (commit 4982f6a). The remaining work is:

1. Confirm PredictPartnerPage no longer queries `responses` table for PYP data
2. Remove any dead code referencing `pack_id = 'predict-partner'` in the responses table
3. Verify no other page accidentally reads PYP rows from `responses`
4. Ensure the `predict_partner` table has RLS policies (covered by RLS audit)

Non-breaking constraint: existing rows in `responses` with old PYP `pack_id` values should be left in place (harmless orphans) rather than deleted until all testers have naturally transitioned.

---

## MVP Recommendation

Prioritize in this order:

1. **Quiz section bug fixes** — highest user pain per PROJECT.md; QuizPage bug likely in submit/button logic since the page is submit-only (not waiting-for-partner)
2. **Polling fallback audit** — low effort, existing pattern; fill gaps in DrawResultsPage and DeepDiveDeckPage cleanup; confirm conditional polling guards are in place
3. **RLS audit** — medium effort; work table by table; use Supabase dashboard Security Advisors as starting point
4. **PYP migration cleanup** — verify and remove dead code; low risk since migration is done
5. **Code cleanup** — fold in with above; standardize `removeChannel + clearInterval` paired cleanup

Defer: Any visual or UX changes, new tables, new game modes.

---

## Sources

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime) — confirmed WebSocket-only, no automatic fallback
- [Supabase RLS Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) — `auth.uid()` patterns, policy syntax
- [Supabase Troubleshooting: Silent Disconnections](https://supabase.com/docs/guides/troubleshooting/realtime-handling-silent-disconnections-in-backgrounded-applications-592794) — confirms background tab heartbeat drops
- [Supabase Security Advisors](https://supabase.com/docs/guides/database/database-advisors) — automated RLS issue detection
- [Auto reconnect discussion #27513](https://github.com/orgs/supabase/discussions/27513) — community-confirmed reconnect behavior
- [CVE-2025-48757 / RLS misconfiguration risk](https://vibeappscanner.com/supabase-row-level-security) — MEDIUM confidence (WebSearch, single source)
- [Polling vs setInterval best practice](https://dev.to/igadii/think-twice-before-using-setinterval-for-api-polling-it-might-not-be-ideal-3n3) — prefer `setTimeout`-based polling to avoid queued calls; current codebase uses `setInterval` which is acceptable at 5s intervals with lightweight queries
- Codebase audit: direct inspection of all page files in `src/pages/` — HIGH confidence
