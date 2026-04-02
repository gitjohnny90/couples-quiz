# Roadmap: The Us Quiz

## Milestones

- ✅ **v1.0 Polish & Security** — Phases 1-4 (shipped 2026-03-12)
- ✅ **v1.1 Audit Remediation** — Phases 5-9 (shipped 2026-03-15)
- 🚧 **v1.2 Daily Photo Challenge** — Phases 10-13 (in progress)

## Phases

<details>
<summary>✅ v1.0 Polish & Security (Phases 1-4) — SHIPPED 2026-03-12</summary>

- [x] **Phase 1: RLS Audit & Policy Deployment** (2/2 plans)
- [x] **Phase 2: PYP Data Migration & Cleanup** (1/1 plan) — completed 2026-03-11
- [x] **Phase 3: Polling Fallback Standardization** (2/2 plans)
- [x] **Phase 4: Quiz Bug Fixes & Code Cleanup** (3/3 plans) — completed 2026-03-12

</details>

<details>
<summary>✅ v1.1 Audit Remediation (Phases 5-9) — SHIPPED 2026-03-15</summary>

- [x] **Phase 5: RLS Hardening** (2/2 plans) — completed 2026-03-15
- [x] **Phase 6: Bug Fixes** (5/5 plans) — completed 2026-03-15
- [x] **Phase 7: Accessibility** (2/2 plans) — completed 2026-03-15
- [x] **Phase 8: Quality** (2/2 plans) — completed 2026-03-15
- [x] **Phase 9: useCallback Hook Compliance** (1/1 plan) — completed 2026-03-15

</details>

### 🚧 v1.2 Daily Photo Challenge (In Progress)

**Milestone Goal:** A time-gated photo challenge where couples answer 3 daily prompts with photos and captions, unlocking one section per day across 15 themed days.

- [ ] **Phase 10: Storage & Photo Capture** - Supabase Storage bucket, photo upload/camera component with caption
- [ ] **Phase 11: Content, Section Hub & Time-Gating** - 15 themed sections data, hub page with lock/unlock state and nav entry point
- [ ] **Phase 12: Prompt Flow & Cork Board Reveal** - Per-section answering flow, partner wait state, and side-by-side cork board reveal
- [ ] **Phase 13: Journal Integration** - Dedicated photo tab in Journal showing completed sections by theme

## Phase Details

### Phase 10: Storage & Photo Capture
**Goal**: Users can take or upload a photo, add a caption, and have it stored securely in Supabase Storage
**Depends on**: Nothing (first phase of milestone — existing auth/session infrastructure already in place)
**Requirements**: PHOTO-01, PHOTO-02, PHOTO-03, PHOTO-04
**Success Criteria** (what must be TRUE):
  1. User can tap a button to open their device camera and take a photo to answer a prompt
  2. User can tap a button to select a photo from their device gallery to answer a prompt
  3. User can type a short caption below their photo in a torn-paper style display without the page scrolling
  4. Submitted photos are stored in a Supabase Storage bucket scoped to the user's session (not accessible to other sessions)
**Plans**: 2 plans
Plans:
- [x] 10-01-PLAN.md — Supabase Storage bucket, RLS policies, and photoUtils.js utility module
- [x] 10-02-PLAN.md — PhotoCaptureInput and TornPaperCaption UI components

### Phase 11: Content, Section Hub & Time-Gating
**Goal**: Users can browse all 15 themed sections, see each section's lock/unlock state, and the app enforces one-section-per-day time-gating
**Depends on**: Phase 10
**Requirements**: CONT-01, CONT-02, CONT-03, CONT-04, GATE-01, GATE-02, GATE-03, DISP-03, NAV-01
**Success Criteria** (what must be TRUE):
  1. Daily Photo Challenge is accessible from a card or entry point in the quizzes tab of the bottom nav
  2. The section hub page displays all 15 themed sections with a visible completion status and lock/unlock state for each
  3. Each section contains exactly 3 prompts — the first is always "What are you up to?" and the last is a theme-matched funny/unhinged question
  4. After completing a section, all sections show as frozen and no new section can be started until after 6am the next day
  5. After the 6am unlock, all remaining sections are selectable; once the user picks one, all others lock until it is finished
**Plans**: 2 plans
Plans:
- [x] 11-01-PLAN.md — Static data (15 sections) + time-gating utility functions with TDD
- [ ] 11-02-PLAN.md — DailyPhotosHubPage, VaultPage entry card, App.jsx route wiring

### Phase 12: Prompt Flow & Cork Board Reveal
**Goal**: Users can work through a section's 3 prompts one at a time and see both partners' photos side by side on a cork board after both finish
**Depends on**: Phase 11
**Requirements**: GATE-04, DISP-01, DISP-02
**Success Criteria** (what must be TRUE):
  1. User can submit a photo + caption for each of the 3 prompts in a section sequentially
  2. After submitting all 3 prompts, the user sees a waiting screen if their partner has not yet finished that section
  3. Once both partners have completed the section, the reveal page shows 3 cork boards (one per question) — each board displays both partners' photos for that prompt
  4. Below each cork board, torn-paper captions show player 1's caption on top (coral) and player 2's below (blue)
  5. The cork boards use the same visual treatment (pinned cards, paper style) as the vision board in the Us tab
**Plans**: 2 plans
Plans:
- [ ] 12-01-PLAN.md — Gating helper, route wiring, pageGuides, and DailyPhotoSectionPage (prompt flow + waiting)
- [ ] 12-02-PLAN.md — DailyPhotoRevealPage (cork board reveal with polaroids and captions)

### Phase 13: Journal Integration
**Goal**: Users can review all completed Daily Photo Challenge sections from the Journal page, organized by theme
**Depends on**: Phase 12
**Requirements**: JRNL-01, JRNL-02
**Success Criteria** (what must be TRUE):
  1. The Journal page has a new tab labeled for Daily Photo Challenge that is visible alongside existing tabs
  2. The journal tab displays every completed section with its photos organized by theme name
  3. Tapping a completed section in the journal opens or shows that section's photos (does not allow re-answering)
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. RLS Audit & Policy Deployment | v1.0 | 2/2 | Complete | 2026-03-12 |
| 2. PYP Data Migration & Cleanup | v1.0 | 1/1 | Complete | 2026-03-11 |
| 3. Polling Fallback Standardization | v1.0 | 2/2 | Complete | 2026-03-12 |
| 4. Quiz Bug Fixes & Code Cleanup | v1.0 | 3/3 | Complete | 2026-03-12 |
| 5. RLS Hardening | v1.1 | 2/2 | Complete | 2026-03-15 |
| 6. Bug Fixes | v1.1 | 5/5 | Complete | 2026-03-15 |
| 7. Accessibility | v1.1 | 2/2 | Complete | 2026-03-15 |
| 8. Quality | v1.1 | 2/2 | Complete | 2026-03-15 |
| 9. useCallback Hook Compliance | v1.1 | 1/1 | Complete | 2026-03-15 |
| 10. Storage & Photo Capture | v1.2 | 2/2 | Complete (human verify pending) | 2026-04-02 |
| 11. Content, Section Hub & Time-Gating | v1.2 | 1/2 | In progress | - |
| 12. Prompt Flow & Cork Board Reveal | v1.2 | 0/2 | Not started | - |
| 13. Journal Integration | v1.2 | 0/? | Not started | - |
