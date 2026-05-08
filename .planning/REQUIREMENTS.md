# Requirements: The Us Quiz — v2.0 Capacitor Native Wrap

**Defined:** 2026-05-08
**Core Value:** Partners can connect and learn about each other through shared interactive experiences that update live for both players

> Prior milestones (v1.0 / v1.1 / v1.2) are recorded as Validated requirements in PROJECT.md and as completed milestones in MILESTONES.md. This document covers v2.0 only.

## v2.0 Requirements

Requirements for the v2.0 milestone — wrapping the existing web app as native iOS and Android apps with push notifications, native capabilities, and App Store / Google Play submission. Each maps to roadmap phases.

### Native Wrap

- [ ] **NATIVE-01**: Capacitor 6+ installed and configured for the existing React + Vite project
- [ ] **NATIVE-02**: iOS platform configured (Xcode project, Info.plist, signing capabilities)
- [ ] **NATIVE-03**: Android platform configured (Android Studio project, AndroidManifest.xml, signing keystore)
- [ ] **NATIVE-04**: Web build bundles into native IPA/APK assets (no remote URL load)
- [ ] **NATIVE-05**: App lifecycle handling — backgrounding mid-game (Heart Line, Tic-Tac-Toe) preserves state via existing Supabase persistence
- [ ] **NATIVE-06**: Supabase auth session persists across app cold launches in WebView
- [ ] **NATIVE-07**: Supabase realtime WebSockets work through WebView on both iOS and Android
- [ ] **NATIVE-08**: Build documentation in repo for both platforms (one-command build for each)

### Push Notifications

- [ ] **PUSH-01**: User grants push permission on first app launch with friendly pre-prompt explaining why
- [ ] **PUSH-02**: User receives notification when partner finishes a quiz, Hot Takes group, PYP pack, or Finish My Sentence round
- [ ] **PUSH-03**: User receives notification when partner sends a Love Note Hunt round
- [ ] **PUSH-04**: User receives notification when partner drops a Miss U Heart
- [ ] **PUSH-05**: User receives notification when partner completes a Daily Photo section
- [ ] **PUSH-06**: User receives notification when partner reacts to one of their answers or drawings
- [ ] **PUSH-07**: User can toggle all notifications on/off in app settings
- [ ] **PUSH-08**: User can configure a quiet-hours window (default 10pm-8am local time) where notifications are silenced
- [ ] **PUSH-09**: Tapping a notification deep-links to the relevant page (the quiz that was finished, the love notes round, etc.)

### Native Capabilities

- [ ] **NCAP-01**: User can pick photo from camera roll (gallery) for Daily Photos via native picker
- [ ] **NCAP-02**: User can capture photo with native camera UX (not browser file input) for Daily Photos
- [ ] **NCAP-03**: Universal Links — tapping a `theusquiz.com/join/LOVE-XXXX` URL opens the installed iOS app to the join flow
- [ ] **NCAP-04**: Android App Links equivalent — same behavior on Android
- [ ] **NCAP-05**: Haptic feedback on Heart Line heart drop, Miss U Heart receive, partner reaction receive
- [ ] **NCAP-06**: Native share sheet for Daily Photo cork-board reveal (replaces Web Share API on native)
- [ ] **NCAP-07**: Status bar styling matches paper aesthetic; safe-area insets respected on notched devices

### App Store Submission

- [ ] **STORE-01**: App icon designed in notebook aesthetic, all required iOS sizes (1024px master + auto-scaling)
- [ ] **STORE-02**: App icon for Android (adaptive icon: foreground + background layers, monochrome variant for themed icons)
- [ ] **STORE-03**: Splash screens for iOS (multiple aspect ratios) matching warm paper aesthetic
- [ ] **STORE-04**: Splash screens for Android (vector drawable)
- [ ] **STORE-05**: App Store Connect listing — name, subtitle, description, keywords, screenshots (5 sizes minimum)
- [ ] **STORE-06**: Google Play Console listing — short + long description, feature graphic, screenshots
- [ ] **STORE-07**: Privacy nutrition labels (iOS) accurately reflect Supabase data collection
- [ ] **STORE-08**: Privacy policy and terms of service published at theusquiz.com
- [ ] **STORE-09**: Apple Developer account active ($99/yr) with team configured
- [ ] **STORE-10**: Google Play Developer account active ($25 one-time) with team configured
- [ ] **STORE-11**: Both apps submitted, pass review, published to TestFlight + Internal Testing track
- [ ] **STORE-12**: Versioning strategy documented: native app version follows web app version (both bumped together for releases that ship native changes)

## v2.1 Requirements

Deferred to a future release. Tracked but not in v2.0 roadmap.

### Home Screen Widget

- **WIDGET-01**: iOS widget (small + medium sizes) showing partner's most recent action
- **WIDGET-02**: Android widget equivalent with same content
- **WIDGET-03**: Widget tap deep-links to the relevant page in the app
- **WIDGET-04**: Widget refreshes content at most every 15 minutes (iOS budget) without burning battery

### Push Notification Granularity

- **PUSH-EXT-01**: Per-event push notification preferences (toggle each of the 5 event types independently)
- **PUSH-EXT-02**: Push notification grouping / threading by partner action type

### Other deferred

- **OFFLINE-01**: Background sync of offline-drafted love notes and answers (Capacitor Background Sync)
- **OTA-01**: Capacitor Live Updates / OTA mechanism for JS-only updates without App Store resubmission

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| PWA / service worker bridge | Capacitor covers home-screen need; PWA adds maintenance without value |
| Biometric auth (Face ID / fingerprint) | Low value relative to effort; couples app, not banking |
| App Clips / Instant Apps | Separate scope and flow; defer until install friction is proven a problem |
| iPad-specific layout / Apple Pencil support | Niche audience; phone-first product |
| Remote-loaded WebView (load from theusquiz.com) | Apple Section 4.2 rejection risk; cold-launch performance worse |
| TypeScript migration | Codebase is pure JS by design |
| New features or game modes in v2.0 | v2.0 is wrap-and-ship, not new functionality |
| UI redesign | Visual theme stays as-is |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| NATIVE-01 | TBD | Pending |
| NATIVE-02 | TBD | Pending |
| NATIVE-03 | TBD | Pending |
| NATIVE-04 | TBD | Pending |
| NATIVE-05 | TBD | Pending |
| NATIVE-06 | TBD | Pending |
| NATIVE-07 | TBD | Pending |
| NATIVE-08 | TBD | Pending |
| PUSH-01 | TBD | Pending |
| PUSH-02 | TBD | Pending |
| PUSH-03 | TBD | Pending |
| PUSH-04 | TBD | Pending |
| PUSH-05 | TBD | Pending |
| PUSH-06 | TBD | Pending |
| PUSH-07 | TBD | Pending |
| PUSH-08 | TBD | Pending |
| PUSH-09 | TBD | Pending |
| NCAP-01 | TBD | Pending |
| NCAP-02 | TBD | Pending |
| NCAP-03 | TBD | Pending |
| NCAP-04 | TBD | Pending |
| NCAP-05 | TBD | Pending |
| NCAP-06 | TBD | Pending |
| NCAP-07 | TBD | Pending |
| STORE-01 | TBD | Pending |
| STORE-02 | TBD | Pending |
| STORE-03 | TBD | Pending |
| STORE-04 | TBD | Pending |
| STORE-05 | TBD | Pending |
| STORE-06 | TBD | Pending |
| STORE-07 | TBD | Pending |
| STORE-08 | TBD | Pending |
| STORE-09 | TBD | Pending |
| STORE-10 | TBD | Pending |
| STORE-11 | TBD | Pending |
| STORE-12 | TBD | Pending |

**Coverage:**
- v2.0 requirements: 36 total
- Mapped to phases: 0 (awaiting roadmap)
- Unmapped: 36 ⚠️

---
*Requirements defined: 2026-05-08*
*Last updated: 2026-05-08 after initial definition*
