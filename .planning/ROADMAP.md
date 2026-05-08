# Roadmap: The Us Quiz

## Milestones

- ✅ **v1.0 Polish & Security** — Phases 1-4 (shipped 2026-03-12)
- ✅ **v1.1 Audit Remediation** — Phases 5-9 (shipped 2026-03-15)
- ✅ **v1.2 Daily Photo Challenge** — Phases 10-13 (feature-complete 2026-04-05)
- 🚧 **v2.0 Capacitor Native Wrap** — Phases 14-19 (in progress)

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

<details>
<summary>✅ v1.2 Daily Photo Challenge (Phases 10-13) — FEATURE-COMPLETE 2026-04-05</summary>

- [x] **Phase 10: Storage & Photo Capture** (2/2 plans) — completed 2026-04-02
- [x] **Phase 11: Content, Section Hub & Time-Gating** (2/2 plans)
- [x] **Phase 12: Prompt Flow & Cork Board Reveal** (2/2 plans) — completed 2026-04-05
- [x] **Phase 13: Journal Integration** (1/1 plan) — completed 2026-04-05

</details>

### 🚧 v2.0 Capacitor Native Wrap (In Progress)

**Milestone Goal:** Wrap the existing React + Vite web app as native iOS and Android apps with push notifications, native capabilities (camera, haptics, deep links, share sheet), and submit to App Store + Google Play.

- [ ] **Phase 14: Capacitor Install & Platform Setup** - Install Capacitor 6+, configure iOS + Android platforms, bundled-asset build pipeline, status bar + safe-area, build docs
- [ ] **Phase 15: WebView Integration Validation** - Verify auth session persistence, Supabase realtime WebSockets, and app lifecycle handling on both platforms
- [ ] **Phase 16: Native Capabilities** - Native camera + gallery picker, Universal Links + Android App Links, haptic feedback, native share sheet
- [ ] **Phase 17: Push Notifications** - Supabase-triggered push for 5 partner-action events, permission pre-prompt, notification deep-linking, quiet hours + on/off toggle
- [ ] **Phase 18: Brand Assets** - App icons and splash screens for both platforms in notebook aesthetic
- [ ] **Phase 19: Store Listings & Submission** - App Store Connect + Google Play Console listings, privacy labels, privacy policy, developer accounts, TestFlight + Internal Testing submission

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
- [x] 11-02-PLAN.md — DailyPhotosHubPage, VaultPage entry card, App.jsx route wiring

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
- [x] 12-01-PLAN.md — Gating helper, route wiring, pageGuides, and DailyPhotoSectionPage (prompt flow + waiting)
- [x] 12-02-PLAN.md — DailyPhotoRevealPage (cork board reveal with polaroids and captions)

### Phase 13: Journal Integration
**Goal**: Users can review all completed Daily Photo Challenge sections from the Journal page, organized by theme
**Depends on**: Phase 12
**Requirements**: JRNL-01, JRNL-02
**Success Criteria** (what must be TRUE):
  1. The Journal page has a new tab labeled for Daily Photo Challenge that is visible alongside existing tabs
  2. The journal tab displays every completed section with its photos organized by theme name
  3. Tapping a completed section in the journal opens or shows that section's photos (does not allow re-answering)
**Plans**: 1 plan
Plans:
- [x] 13-01-PLAN.md — Extend JournalPage with photos tab (fetch, filter, empty state, card list, navigation)

### Phase 14: Capacitor Install & Platform Setup
**Goal**: The app builds as a native IPA and APK with web assets bundled — no remote URL load — and both platforms are configured with signing, build docs, and correct status bar / safe-area handling
**Depends on**: Phase 13
**Requirements**: NATIVE-01, NATIVE-02, NATIVE-03, NATIVE-04, NATIVE-08, NCAP-07
**Notes**: iOS builds require macOS. Android builds are cross-platform. Bundled assets (NATIVE-04) directly mitigates Apple Section 4.2 "thin wrapper" rejection risk — must be confirmed before submission.
**Success Criteria** (what must be TRUE):
  1. Running `npm run build && npx cap sync` followed by one command opens a working app in Xcode and in Android Studio without manual file copying
  2. The installed iOS app loads from bundled assets (no network request to theusquiz.com for the initial HTML/JS/CSS)
  3. The installed Android app loads from bundled assets under the same condition
  4. On notched iPhones and modern Android devices, no UI element is clipped behind the status bar or home indicator; the warm paper background extends into safe areas
  5. Build instructions in the repo README (or a BUILDING.md) let a developer reproduce both builds from a clean checkout
**Plans**: TBD

### Phase 15: WebView Integration Validation
**Goal**: A user's Supabase auth session survives cold launches, realtime WebSockets function normally through the WebView, and backgrounding mid-game loses no game state
**Depends on**: Phase 14
**Requirements**: NATIVE-05, NATIVE-06, NATIVE-07
**Notes**: This phase is validation-heavy — the criteria must be tested on physical devices (or Xcode Simulator + Android Emulator as a minimum). Real device testing on iOS requires macOS.
**Success Criteria** (what must be TRUE):
  1. A user who is signed in, force-quits the app, and reopens it lands on the correct page without being sent to the sign-in screen
  2. Two devices playing Heart Line or Tic-Tac-Toe in the native app see each other's moves in real time with no additional configuration (WebSockets work through WebView on both platforms)
  3. A user who backgrounds the app during a Heart Line game and returns after 2+ minutes finds the board in the same state as when they left (persisted via Supabase, no local-only state lost)
**Plans**: TBD

### Phase 16: Native Capabilities
**Goal**: Users can capture or pick photos with native UX, invite-code URLs open the installed app, taps and interactions produce haptic feedback, and Daily Photo reveals can be shared via the native share sheet
**Depends on**: Phase 14
**Requirements**: NCAP-01, NCAP-02, NCAP-03, NCAP-04, NCAP-05, NCAP-06
**Notes**: Phase 16 can run in parallel with Phase 15 (both depend only on Phase 14), but should be sequenced after 15 in practice to avoid splitting attention. Universal Links (NCAP-03) require an apple-app-site-association file hosted at theusquiz.com and entitlements in the Xcode project. Android App Links (NCAP-04) require a .well-known/assetlinks.json file and intent filters in AndroidManifest.xml.
**Success Criteria** (what must be TRUE):
  1. On the Daily Photos section page, tapping "Take Photo" opens the native iOS/Android camera (not the browser file input), captures a photo, and returns it to the app ready to submit
  2. Tapping a `theusquiz.com/join/LOVE-XXXX` link on an iOS device with the app installed opens The Us Quiz app directly to the join flow rather than Safari
  3. Tapping the same link on Android opens the app to the join flow rather than Chrome
  4. Dropping a heart in Heart Line, receiving a Miss U Heart, and receiving a partner reaction each produce a distinct haptic pulse (no silent interactions)
  5. Tapping "Share" on a Daily Photo cork board reveal opens the native iOS/Android share sheet with the image ready to send
**Plans**: TBD

### Phase 17: Push Notifications
**Goal**: Both partners receive timely push notifications for all 5 partner-action event types, tapping a notification navigates to the correct in-app page, and users can toggle notifications off or set quiet hours
**Depends on**: Phase 14
**Requirements**: PUSH-01, PUSH-02, PUSH-03, PUSH-04, PUSH-05, PUSH-06, PUSH-07, PUSH-08, PUSH-09
**Notes**: Push delivery requires a server-side trigger (Supabase Edge Function or a pg trigger + webhook) to call the push notification service (FCM for Android, APNs for iOS via a service such as OneSignal or direct APNs). The design choice — Edge Function vs pg trigger vs third-party service — is the first decision in this phase's plan. Apple and Google require push notification entitlements to be configured in both platform projects (done in Phase 14 if chosen early, or added here). Quiet hours are implemented client-side (suppress display) OR server-side (suppress send) — design choice belongs in the plan.
**Success Criteria** (what must be TRUE):
  1. On first app launch, the user sees a friendly explanation of why notifications are useful before the OS permission dialog appears; granting permission saves their push token
  2. When partner finishes a quiz, Hot Takes group, PYP pack, Finish My Sentence round, Love Note Hunt round, or sends a Miss U Heart, the other partner receives a push notification within 30 seconds on a locked or backgrounded device
  3. When partner completes a Daily Photo section or reacts to an answer/drawing, the other partner receives a push notification within 30 seconds
  4. Tapping a push notification opens the app and navigates to the relevant page (e.g., tapping "Partner finished Hot Takes: Spicy Group 2" opens HotTakesPage to that group's results)
  5. A "Notifications" toggle in the app settings page turns all push notifications on and off without requiring the user to visit iOS/Android system settings
  6. A quiet-hours window (default 10pm–8am) can be set; notifications received during the window are not delivered until the window ends or are silently dropped
**Plans**: TBD

### Phase 18: Brand Assets
**Goal**: Both platforms have complete, correctly-sized app icons and splash screens in the notebook aesthetic, ready for Xcode and Android Studio without manual resizing
**Depends on**: Phase 14
**Requirements**: STORE-01, STORE-02, STORE-03, STORE-04
**Notes**: Phase 18 can run in parallel with Phases 15–17 since it is design work, not code integration. It must be complete before Phase 19 (submission). iOS requires a 1024px master icon plus auto-generated sizes; Android requires adaptive icon layers (foreground + background + monochrome variant). Capacitor's `@capacitor/assets` CLI can generate all required sizes from master artwork.
**Success Criteria** (what must be TRUE):
  1. The iOS app displays the correct notebook-aesthetic icon on the home screen in all device display sizes (small, standard, large) with no pixel blurriness or clipping
  2. The Android app displays an adaptive icon that renders correctly on round, squircle, and square icon masks; the monochrome variant is readable on themed icon backgrounds
  3. Launching the iOS app from a cold start shows a warm-paper splash screen that matches the app's visual theme before the WebView loads
  4. Launching the Android app from a cold start shows the equivalent splash screen with no white flash
**Plans**: TBD

### Phase 19: Store Listings & Submission
**Goal**: Both apps have complete store listings, all legal and privacy requirements are met, developer accounts are active, and both apps are live on TestFlight and the Google Play Internal Testing track
**Depends on**: Phases 15, 16, 17, 18 (all prior v2.0 phases)
**Requirements**: STORE-05, STORE-06, STORE-07, STORE-08, STORE-09, STORE-10, STORE-11, STORE-12
**Notes**: Apple Developer Program ($99/yr) and Google Play Developer ($25 one-time) are operational prerequisites — both accounts must be active before this phase begins; delays in account approval are a real-world blocker. Privacy nutrition labels (STORE-07) must accurately reflect Supabase data collection (email, session data, user-generated content) — inaccuracy is grounds for rejection. Fake-email test users from the 2026-05-07 sweep (noted in STATE.md blockers) should be cleaned from the production Supabase before privacy validation.
**Success Criteria** (what must be TRUE):
  1. The App Store Connect listing has a name, subtitle, description, keywords, and at least 5 screenshots at required sizes; the listing accurately describes The Us Quiz
  2. The Google Play Console listing has a short description, long description, feature graphic, and screenshots; the listing is complete enough to publish
  3. The iOS privacy nutrition label accurately declares all data types collected (email address, usage data, user content) and their purposes
  4. A privacy policy and terms of service are published at a public URL on theusquiz.com and linked from both store listings
  5. The iOS app is live on TestFlight and accessible to at least one external tester
  6. The Android app is live on the Google Play Internal Testing track and accessible to at least one internal tester
  7. The version numbering strategy is documented: native app version and web app version are bumped together for releases that include native changes
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
| 10. Storage & Photo Capture | v1.2 | 2/2 | Complete | 2026-04-02 |
| 11. Content, Section Hub & Time-Gating | v1.2 | 2/2 | Complete | 2026-04-05 |
| 12. Prompt Flow & Cork Board Reveal | v1.2 | 2/2 | Complete | 2026-04-05 |
| 13. Journal Integration | v1.2 | 1/1 | Complete | 2026-04-05 |
| 14. Capacitor Install & Platform Setup | v2.0 | 0/TBD | Not started | - |
| 15. WebView Integration Validation | v2.0 | 0/TBD | Not started | - |
| 16. Native Capabilities | v2.0 | 0/TBD | Not started | - |
| 17. Push Notifications | v2.0 | 0/TBD | Not started | - |
| 18. Brand Assets | v2.0 | 0/TBD | Not started | - |
| 19. Store Listings & Submission | v2.0 | 0/TBD | Not started | - |
