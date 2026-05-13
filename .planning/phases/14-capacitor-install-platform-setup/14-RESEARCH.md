# Phase 14: Capacitor Install & Platform Setup - Research

**Researched:** 2026-05-12
**Domain:** Capacitor 8.x native wrap (iOS + Android), Vite build pipeline, mobile WebView asset bundling, status bar / safe-area handling, cloud CI for iOS (Codemagic), Windows-local for Android
**Confidence:** HIGH

---

## Summary

Phase 14 wraps the existing React + Vite SPA as a native iOS + Android app using **Capacitor 8.3.4** (the current major; the spec's "Capacitor 6+" floor is satisfied). The work is mostly orchestration: install the CLI, point Capacitor at `dist/`, add platforms, configure signing on each, ensure the bundled web build loads from `capacitor://` / `https://localhost` schemes (not from `theusquiz.com`), and make the warm-paper `#FFF8F0` aesthetic extend cleanly into the status bar and safe-area insets.

Two constraints shape every decision: **John has no Mac**, so iOS builds run on **Codemagic** (500 free macOS M2 min/mo); Android builds run locally on Windows via Android Studio + `keytool`. The Vite config needs one new line (`base: './'`), `index.html` needs `viewport-fit=cover` added, and `capacitor.config.json` must **omit `server.url`** in production so the WebView loads from the bundle — that one config decision is the Apple Section 4.2 "thin wrapper" mitigation in NATIVE-04.

The existing CSS already uses `env(safe-area-inset-bottom)` for the bottom nav, so safe-area work is mostly additive: handle top inset (status bar overlay), set Android `adjustMarginsForEdgeToEdge: 'auto'`, and call `StatusBar.setBackgroundColor({ color: '#FFF8F0' })` + `StatusBar.setStyle({ style: Style.Dark })` (dark icons on the light paper bg) at app boot.

**Primary recommendation:** Capacitor 8.x with `webDir: 'dist'`, no `server.url`, `vite.config.js` `base: './'`, `viewport-fit=cover` in `index.html`, `@capacitor/status-bar` for paper-color status bar, `adjustMarginsForEdgeToEdge: 'auto'` for Android edge-to-edge. iOS signing handled by Codemagic's automatic App Store Connect API key flow; Android keystore generated once on John's Windows box and never lost (back it up to the Command Center vault encrypted).

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NATIVE-01 | Capacitor 6+ installed and configured for React + Vite project | Install `@capacitor/core` + `@capacitor/cli` (dev), run `npx cap init`, generate `capacitor.config.json` with `appId: 'com.theusquiz.app'`, `appName: 'The Us Quiz'`, `webDir: 'dist'` |
| NATIVE-02 | iOS platform configured (Xcode project, Info.plist, signing capabilities) | `npm i @capacitor/ios`, `npx cap add ios`, generates `ios/App/App.xcodeproj`; signing handled by Codemagic via App Store Connect API key (no Mac required for build); Info.plist already gets `UIViewControllerBasedStatusBarAppearance` from Capacitor template |
| NATIVE-03 | Android platform configured (Android Studio project, AndroidManifest.xml, signing keystore) | `npm i @capacitor/android`, `npx cap add android`, generates `android/` Gradle project; `keytool` on Windows creates `release.keystore`; `android/keystore.properties` (gitignored) references it; `android/app/build.gradle` reads via `signingConfigs.release` block |
| NATIVE-04 | Web build bundles into native IPA/APK assets — no remote URL load | **Critical:** `server.url` must be ABSENT (or undefined) in `capacitor.config.json` for prod builds. `vite.config.js` `base: './'` makes asset paths relative so they resolve under `capacitor://` (iOS) and `https://localhost` (Android default `androidScheme: 'https'`). `npx cap sync` copies `dist/` into `ios/App/App/public/` and `android/app/src/main/assets/public/` |
| NATIVE-08 | Build documentation in repo (BUILDING.md, one-command build per platform) | New `BUILDING.md` at repo root: prerequisites, Android local build (`npm run build && npx cap sync android && npx cap open android`), iOS via Codemagic (`git push` triggers `codemagic.yaml` workflow), troubleshooting |
| NCAP-07 | Status bar styling matches paper aesthetic; safe-area insets respected on notched devices | `@capacitor/status-bar` plugin: `setBackgroundColor({ color: '#FFF8F0' })` + `setStyle({ style: Style.Dark })` for dark icons on light bg; `<meta viewport-fit=cover>` in `index.html`; add `padding-top: env(safe-area-inset-top)` to `.page` container; existing `padding-bottom: env(safe-area-inset-bottom)` on `.bottom-nav` already correct; Android: `adjustMarginsForEdgeToEdge: 'auto'` |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Web bundle (HTML/CSS/JS) | Browser / Client (WebView) | — | All React UI code runs unchanged inside the WebView; no SSR involved |
| Native shell | Native (iOS Swift / Android Java) | — | Capacitor-generated; do not edit by hand except for plist permissions and signing config |
| Build pipeline (Vite → dist) | Build-time | — | Same `npm run build`; only Vite `base: './'` changes |
| Asset bundling into IPA/APK | Native (Capacitor sync) | Build-time | `npx cap sync` copies `dist/` into `ios/App/App/public` and `android/app/src/main/assets/public` |
| iOS code signing | Cloud CI (Codemagic) | — | John has no Mac; App Store Connect API key handles certificate + provisioning profile fetch in CI |
| Android code signing | Local (Windows) | — | `keytool` + Gradle signing config; release builds locally in Android Studio |
| Status bar styling | Native plugin (`@capacitor/status-bar`) | Browser (CSS for content padding) | Native sets color/icons; CSS handles safe-area for content |
| Auth / data / realtime | API (Supabase) | Browser | Unchanged — already validated in v1.0–v1.2; Phase 15 will confirm WebSockets through WebView |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @capacitor/core | 8.3.4 | Native bridge runtime | Spec floor is 6+; 8.x is current stable major [VERIFIED: `npm view @capacitor/core version` 2026-05-12] |
| @capacitor/cli | 8.3.4 | `cap init`, `cap add`, `cap sync`, `cap open` commands | Required CLI peer of @capacitor/core [VERIFIED: npm registry] |
| @capacitor/ios | 8.3.4 | iOS platform (Xcode project scaffold) | Official iOS adapter [VERIFIED: npm registry] |
| @capacitor/android | 8.3.4 | Android platform (Gradle project scaffold) | Official Android adapter [VERIFIED: npm registry] |
| @capacitor/status-bar | 8.0.2 | Set status bar color + text style | Official plugin; NCAP-07 [VERIFIED: npm registry] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @capacitor/splash-screen | 8.0.1 | Splash screen on cold launch | **Defer to Phase 18 (Brand Assets).** Install hook is fine in Phase 14 but artwork comes later [VERIFIED: npm registry] |
| @capacitor/app | 8.1.0 | App lifecycle events (backgrounding) | **Defer to Phase 15.** Phase 14 only needs install if it's a peer dep — it's not [VERIFIED: npm registry] |
| @capacitor/assets | 3.0.5 | Generate icons + splash variants from master art | **Defer to Phase 18.** Tooling, not runtime [VERIFIED: npm registry] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Codemagic (iOS CI) | GitHub Actions macOS runner | GH macOS runners are $0.08/min for public repos free / private paid; Codemagic gives 500 free macOS M2 min/mo which is enough for ~20 builds; CI yaml is purpose-built for Capacitor [CITED: codemagic.io/pricing] |
| Codemagic (iOS CI) | Ionic Appflow | Appflow is more opinionated and pricier; Codemagic has direct Capacitor docs and a more flexible yaml [ASSUMED] |
| `@capacitor-community/safe-area` plugin | Native CSS `env(safe-area-inset-*)` | Plugin polyfills older Chromium (<140) that doesn't report insets correctly. Modern Android WebView (Chromium 140+) and iOS WKWebView handle `env()` natively. **Use native CSS unless tester finds gaps on old Android devices** [CITED: github.com/capacitor-community/safe-area] |
| `@capacitor-community/safe-area` plugin | `@capawesome/capacitor-android-edge-to-edge-support` | Capacitor 8's built-in `adjustMarginsForEdgeToEdge` config replaces the need for the Capawesome plugin on Android 15+ [CITED: capgo.app/blog/capacitor-edge-to-edge-display-native-config] |
| Manual iOS signing | Automatic signing via App Store Connect API key | Manual requires distributing a .p12 + provisioning profile; API key lets Codemagic generate/refresh as needed. **API key is the modern path** [CITED: blog.codemagic.io/app-store-connect-api-codemagic-cli-tools] |

**Installation:**
```bash
# Core + CLI (dev)
npm i @capacitor/core@^8.3.4
npm i -D @capacitor/cli@^8.3.4

# Init (interactive — confirm appId, appName, webDir=dist)
npx cap init "The Us Quiz" "com.theusquiz.app" --web-dir dist

# Platforms
npm i @capacitor/ios@^8.3.4 @capacitor/android@^8.3.4
npx cap add ios
npx cap add android

# Status bar plugin (NCAP-07)
npm i @capacitor/status-bar@^8.0.2

# After every web change:
npm run build && npx cap sync
```

**Version verification:** All versions verified via `npm view <pkg> version` on 2026-05-12. Capacitor follows the platform's monthly cadence; expect a 8.4.x release within 4–6 weeks but no breaking changes within a major.

---

## Architecture Patterns

### System Architecture Diagram

```
                         ┌─────────────────────────────────────────┐
                         │   Developer / CI                         │
                         │                                          │
   src/*.jsx, *.css ────►│  Vite build (npm run build)              │
                         │  ↓                                       │
                         │  dist/  (index.html, assets/*.js, *.css) │
                         │  ↓                                       │
                         │  npx cap sync                            │
                         │  ↓                                       │
                         │  ios/App/App/public/   ←─── copies ───┐ │
                         │  android/app/src/main/assets/public/  │ │
                         └─────────────────────────────────────────┘
                                          │
                  ┌───────────────────────┼──────────────────────┐
                  ▼                                              ▼
   ┌──────────────────────────────┐               ┌──────────────────────────────┐
   │  iOS build (Codemagic)        │               │  Android build (Local WIN)    │
   │                                │               │                                │
   │  codemagic.yaml triggers on   │               │  Android Studio opens         │
   │    git push                    │               │    android/ Gradle project    │
   │  fetches App Store Connect    │               │  reads keystore.properties    │
   │    cert via API key            │               │  Gradle assembleRelease       │
   │  xcode-project build-ipa       │               │    → app-release.apk/.aab     │
   │    → App.ipa artifact          │               │                                │
   └──────────────┬─────────────────┘               └──────────────┬─────────────────┘
                  │                                                  │
                  ▼                                                  ▼
   ┌──────────────────────────────┐               ┌──────────────────────────────┐
   │  iOS Installed App            │               │  Android Installed App        │
   │                                │               │                                │
   │  WKWebView loads               │               │  Android WebView loads        │
   │    capacitor://localhost/      │               │    https://localhost/          │
   │    index.html (BUNDLED)        │               │    index.html (BUNDLED)        │
   │                                │               │                                │
   │  Runs same React app           │               │  Runs same React app          │
   │  Calls Supabase HTTPS API      │               │  Calls Supabase HTTPS API     │
   │  Realtime WS to Supabase       │               │  Realtime WS to Supabase      │
   └──────────────────────────────┘               └──────────────────────────────┘
```

The flow that NATIVE-04 protects: **the IPA/APK contains the HTML/JS/CSS**. The WebView resolves `/assets/index.abc.js` relative to its origin scheme (`capacitor://localhost/` or `https://localhost/`), not over the network. The only network calls are to Supabase HTTPS and Supabase Realtime WebSockets — never back to `theusquiz.com`.

### Recommended Project Structure — files added/changed for this phase

```
couples-quiz/
├── capacitor.config.json         # NEW — appId, appName, webDir, plugins, ios/android config
├── codemagic.yaml                # NEW — iOS CI workflow with App Store Connect API
├── BUILDING.md                   # NEW — build docs for both platforms (NATIVE-08)
├── android/                      # NEW — generated by `npx cap add android`
│   ├── app/
│   │   ├── build.gradle          # MODIFY — add signingConfigs.release
│   │   └── src/main/
│   │       ├── AndroidManifest.xml  # AUTO — Capacitor scaffolds; only edit for permissions in Phase 16
│   │       └── assets/public/    # AUTO — npx cap sync target (gitignored or committed; see decision below)
│   ├── keystore.properties       # NEW + GITIGNORED — keystore path + passwords
│   └── release.keystore          # NEW + GITIGNORED + BACKED UP — RSA-2048 signing key
├── ios/                          # NEW — generated by `npx cap add ios`
│   └── App/
│       ├── App.xcodeproj/
│       └── App/
│           ├── Info.plist        # AUTO — add NSCameraUsageDescription etc. (Phase 16 needs these)
│           └── public/           # AUTO — npx cap sync target
├── index.html                    # MODIFY — viewport meta gains viewport-fit=cover
├── vite.config.js                # MODIFY — add `base: './'`
├── src/
│   ├── main.jsx                  # MODIFY — call StatusBar.setBackgroundColor + setStyle at boot
│   └── index.css                 # MODIFY — add safe-area-inset-top to .page; ensure html/body bg extends
├── .gitignore                    # MODIFY — add ios/App/Pods, ios/App/App/public,
│                                 #         android/app/build, android/.gradle, android/app/src/main/assets/public,
│                                 #         android/keystore.properties, android/release.keystore, *.ipa, *.apk
└── package.json                  # AUTO — npm scripts already work; can add convenience scripts (see below)
```

**Decision: commit native projects (`ios/`, `android/`)?**
Yes — commit them. They contain manually configured plist entries, Gradle signing config, and Universal Links setup (Phase 16). Treating them as build artifacts means Codemagic would have to re-add platforms on every build, which loses customizations. The Capacitor docs recommend committing them.

**Decision: commit synced public assets (`ios/App/App/public/`, `android/app/src/main/assets/public/`)?**
**No — gitignore them.** They are byte-for-byte copies of `dist/`. Codemagic and Android Studio run `npx cap sync` before building, which regenerates them. Committing them just creates merge conflicts.

### Pattern 1: capacitor.config.json (production-bundled, NATIVE-04)

```json
{
  "appId": "com.theusquiz.app",
  "appName": "The Us Quiz",
  "webDir": "dist",
  "android": {
    "adjustMarginsForEdgeToEdge": "auto"
  },
  "ios": {
    "contentInset": "always"
  },
  "plugins": {
    "StatusBar": {
      "style": "DARK",
      "backgroundColor": "#FFF8F0",
      "overlaysWebView": false
    }
  }
}
```

**Critical absences:**
- No `server.url` — must be omitted or `undefined` in production. If set to `https://www.theusquiz.com`, the app would load remotely (failing NATIVE-04 and likely triggering Apple Section 4.2 rejection).
- No `server.androidScheme` change — leave default `https` (which produces `https://localhost/` origin on Android). Custom schemes have routing limitations on Android WebView 117+ [CITED: capacitorjs.com/docs/config].

**StatusBar plugin config:**
- `style: "DARK"` means **dark text/icons** on a light background (counterintuitive naming; the style describes the text, not the bg). Paper bg is light → use Dark style.
- `backgroundColor: "#FFF8F0"` matches `--bg-paper`. On Android 16+ this option has no effect (edge-to-edge is enforced) [CITED: capacitorjs.com/docs/apis/status-bar] — handle that case with CSS bg color extending under the status bar instead.
- `overlaysWebView: false` keeps content below the status bar on Android < 16. On iOS this is controlled by the `ios.contentInset` config.

### Pattern 2: vite.config.js — relative base path

```javascript
// vite.config.js — add base, keep everything else
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',                       // ADD — required for Capacitor file:// / capacitor:// schemes
  plugins: [react()],
  server: { host: '127.0.0.1', port: 5173 },
  build: { /* existing manualChunks unchanged */ },
  test: { environment: 'jsdom', globals: true },
})
```

**Why `'./'` not `'/'`:** When Vite emits asset paths as `/assets/index.abc.js`, the browser resolves them against the origin. On `capacitor://localhost/`, `/assets/...` resolves to `capacitor://localhost/assets/...` which works on iOS WKWebView. But on some Android WebView versions / under `file://` fallback, root-absolute paths can fail to resolve. **Relative paths (`./assets/...`) work universally** [CITED: vite.dev/guide/build, "If you don't know the base path in advance, you may set a relative base path"].

This also keeps `npm run preview` and Vercel working — Vercel serves from `/` and relative paths resolve correctly against the page URL.

### Pattern 3: index.html — viewport-fit=cover

```html
<!-- index.html -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

**Why:** Without `viewport-fit=cover`, iOS WKWebView keeps the safe-area inset values at 0 (the browser leaves the notch area as a black bar). With `viewport-fit=cover`, the WebView extends edge-to-edge and `env(safe-area-inset-*)` returns real pixel values [CITED: capgo.app/blog/capacitor-edge-to-edge-display-native-config].

**Side effect for web:** Browsers ignore the option on non-notched devices, so this is safe to ship on the web too (Vercel deployment).

### Pattern 4: src/index.css — safe-area on .page container + bg extension

```css
/* Existing — already correct */
.bottom-nav {
  padding-bottom: env(safe-area-inset-bottom, 0px);  /* keeps nav above home indicator */
}

/* ADD — top safe area for notched devices */
.page {
  padding-top: calc(20px + env(safe-area-inset-top, 0px));   /* whatever the existing top padding is + inset */
  padding-left: calc(60px + env(safe-area-inset-left, 0px)); /* margin line + horizontal inset (landscape) */
  padding-right: env(safe-area-inset-right, 0px);
}

/* ADD — html/body bg extends into status bar area */
html, body {
  background-color: var(--bg-paper);   /* fills any area outside .page (status bar overlay zone) */
  /* Existing body{} ruled-lines background still applies */
}
```

**Why html bg matters:** When `overlaysWebView: true` (or on Android 16+ where it's forced), the WebView extends under the status bar. The status bar itself can be transparent, in which case the html background shows through. Setting `html { background-color: #FFF8F0 }` ensures paper color shows in that strip, even if the rule-line gradient on `body` doesn't extend that far up.

### Pattern 5: src/main.jsx — StatusBar at boot, gated for native only

```javascript
// src/main.jsx — additions
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'

async function configureNativeStatusBar() {
  if (!Capacitor.isNativePlatform()) return   // web stays untouched
  try {
    await StatusBar.setStyle({ style: Style.Dark })          // dark text on light bg
    await StatusBar.setBackgroundColor({ color: '#FFF8F0' }) // matches --bg-paper (Android < 16 only)
    await StatusBar.setOverlaysWebView({ overlay: false })   // keeps content below status bar
  } catch (err) {
    console.warn('StatusBar setup skipped:', err)
  }
}
configureNativeStatusBar()
```

**Gate on `Capacitor.isNativePlatform()`** so the same `main.jsx` works on web (Vercel) and native. On web, `StatusBar.*` calls would no-op or throw — the gate avoids both.

### Pattern 6: Android keystore generation (Windows, NATIVE-03)

```powershell
# Run once on John's Windows box from project root
# (keytool ships with the JDK — Android Studio installs JDK if missing)
keytool -genkeypair -v `
  -keystore android/release.keystore `
  -storetype PKCS12 `
  -alias theusquiz `
  -keyalg RSA `
  -keysize 2048 `
  -validity 10000

# Prompted for:
#   keystore password (record in 1Password / Bitwarden)
#   key password (use same as keystore for simplicity)
#   "What is your first and last name?" → John Allen
#   "Organizational unit?" → The Us Quiz
#   "Organization?" → The Us Quiz
#   "City / State / Country code?" → real values
```

```properties
# android/keystore.properties (GITIGNORED)
storeFile=../release.keystore
storePassword=YOUR_KEYSTORE_PASSWORD
keyAlias=theusquiz
keyPassword=YOUR_KEY_PASSWORD
```

```gradle
// android/app/build.gradle — additions inside android { } block
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
  keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
  // ... existing ...
  signingConfigs {
    release {
      if (keystorePropertiesFile.exists()) {
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
        storeFile file(keystoreProperties['storeFile'])
        storePassword keystoreProperties['storePassword']
      }
    }
  }
  buildTypes {
    release {
      signingConfig signingConfigs.release
      minifyEnabled false
    }
  }
}
```

**Back up the keystore.** Losing it means Google Play will reject all future updates (the new APK signature won't match). Recommendation: store an encrypted copy in `C:\My Vaults\CommandCenter\reports\secrets\` plus a backup elsewhere (cloud password manager attached file).

### Pattern 7: codemagic.yaml — iOS workflow with App Store Connect API

```yaml
# codemagic.yaml (repo root)
workflows:
  ios-capacitor-workflow:
    name: iOS Capacitor Build
    max_build_duration: 60
    instance_type: mac_mini_m2
    integrations:
      app_store_connect: theusquiz-ascapi    # name configured in Codemagic UI
    environment:
      ios_signing:
        distribution_type: app_store
        bundle_identifier: com.theusquiz.app
      vars:
        XCODE_WORKSPACE: "ios/App/App.xcworkspace"
        XCODE_SCHEME: "App"
        BUNDLE_ID: "com.theusquiz.app"
      node: 20
      xcode: latest
      cocoapods: default
    triggering:
      events:
        - push
      branch_patterns:
        - pattern: main
    scripts:
      - name: Install npm deps
        script: npm ci
      - name: Build web bundle
        script: npm run build
      - name: Capacitor sync
        script: npx cap sync ios
      - name: Install CocoaPods
        script: cd ios/App && pod install && cd -
      - name: Set up keychain + fetch signing files
        script: |
          keychain initialize
          app-store-connect fetch-signing-files "$BUNDLE_ID" \
            --type IOS_APP_STORE \
            --create
          keychain add-certificates
          xcode-project use-profiles
      - name: Build IPA
        script: |
          xcode-project build-ipa \
            --workspace "$XCODE_WORKSPACE" \
            --scheme "$XCODE_SCHEME"
    artifacts:
      - build/ios/ipa/*.ipa
      - /tmp/xcodebuild_logs/*.log
    publishing:
      app_store_connect:
        auth: integration
        submit_to_testflight: true
```

**Decisions encoded:**
- `instance_type: mac_mini_m2` — uses free tier (500 min/mo, M2 only) [CITED: codemagic.io/pricing]
- `triggering` on push to main — auto-builds after every merge; can be disabled or moved to manual until v2.0 is ready to ship to testers
- `submit_to_testflight: true` — every successful build lands in TestFlight automatically (Phase 19's job, but the wiring goes in now)
- `app-store-connect fetch-signing-files --create` — automatic provisioning profile creation if one doesn't exist [CITED: blog.codemagic.io/app-store-connect-api-codemagic-cli-tools]

**Codemagic UI setup (one-time, not yaml):**
1. App Store Connect → Users & Access → Integrations → App Store Connect API → create key with "App Manager" role → download .p8 file
2. Codemagic dashboard → Teams → Integrations → Apple Developer Portal → upload .p8 + issuer ID + key ID → name it `theusquiz-ascapi`
3. The yaml `integrations.app_store_connect: theusquiz-ascapi` then resolves to those credentials

### Pattern 8: npm scripts for convenience

```json
// package.json — additions to "scripts"
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "cap:sync": "npm run build && npx cap sync",
    "cap:android": "npm run cap:sync && npx cap open android",
    "cap:ios": "npm run cap:sync && npx cap open ios"
  }
}
```

`cap:android` is the "one command" for NATIVE-08 Android. iOS opening is moot since the build runs on Codemagic — the equivalent is `git push origin main`.

### Anti-Patterns to Avoid

- **Setting `server.url` in production capacitor.config.json:** Loads from `theusquiz.com`. Breaks NATIVE-04, triggers Apple Section 4.2 rejection, and means the installed app stops working if theusquiz.com goes down. Only use during dev with live-reload [CITED: capacitorjs.com/docs/config].
- **Vite `base: '/'` (default) without testing on device:** Root-absolute paths sometimes fail to resolve under iOS WKWebView's `capacitor://` scheme on edge cases. Use `'./'` to be safe [CITED: vite.dev/guide/build].
- **`Style.Light` for the status bar:** Counterintuitively means light TEXT on a dark bg — would make icons invisible on the paper bg. Use `Style.Dark` for dark text on light bg.
- **Forgetting `viewport-fit=cover`:** Without it, `env(safe-area-inset-*)` returns 0 on iOS notched devices, and the status bar area becomes a black bar.
- **Committing the keystore:** Anyone with the keystore can publish updates to the Play Store as if they were John. Always gitignore + back up out-of-band.
- **Letting CocoaPods not run on first sync:** `npx cap sync` does NOT run `pod install` — it only updates the Podfile. The Codemagic yaml explicitly runs `pod install` after sync.
- **Editing `android/app/src/main/assets/public/` or `ios/App/App/public/` by hand:** These are sync output. Any manual edits get blown away on the next `npx cap sync`. Always edit `src/` and re-sync.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Status bar styling | Native code in Swift/Java | `@capacitor/status-bar` | Official plugin handles platform diffs (Android 16 enforcement, iOS UIViewControllerBasedStatusBarAppearance) |
| Safe-area insets | Custom plugin to read insets | `env(safe-area-inset-*)` CSS + `viewport-fit=cover` | Modern WebView (iOS WKWebView, Android Chromium 140+) reports them natively |
| iOS code signing | Manual cert distribution | Codemagic `app-store-connect fetch-signing-files` | API key flow auto-refreshes; manual flow breaks every year on cert expiry |
| Android edge-to-edge | Custom MainActivity Java | `adjustMarginsForEdgeToEdge: 'auto'` in capacitor.config | Built into Capacitor 8.x; works on Android 15+ enforcement |
| Asset bundling | Manual file copies | `npx cap sync` | Handles index.html rewrites for native scheme, copies all `dist/` contents idempotently |
| Build automation | Custom Fastlane / xcodebuild scripts | `xcode-project` CLI in codemagic.yaml | Codemagic's wrapper handles signing + archiving + IPA export in one command |

**Key insight:** Capacitor 8 has absorbed most of what used to need third-party plugins (edge-to-edge, status bar, splash screen). The temptation in 2026 is to reach for community plugins from older Capacitor 5/6 era — **check version compatibility first**; many community plugins haven't updated for the Android 15+ edge-to-edge enforcement that Capacitor 8 handles natively.

---

## Runtime State Inventory

> Phase 14 is a build pipeline + config-add phase, not a rename or migration. Most categories are inapplicable.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — no DB schema changes in this phase | None |
| Live service config | None | None |
| OS-registered state | iOS: bundle identifier `com.theusquiz.app` registered with App Store Connect (Phase 19 prereq). Android: package name `com.theusquiz.app` registered with Google Play Console (Phase 19 prereq). | Reserve both identifiers when developer accounts are set up — but do NOT change the identifier after the first release |
| Secrets/env vars | New: Codemagic UI stores App Store Connect API .p8 key + issuer ID + key ID under integration name `theusquiz-ascapi`. New: `android/keystore.properties` holds keystore + key passwords (gitignored) | Document credential storage in BUILDING.md; back up keystore + password to Command Center vault |
| Build artifacts | New: `ios/App/App/public/` (gitignored, regenerated by `npx cap sync`). New: `android/app/src/main/assets/public/` (gitignored, regenerated). New: `*.ipa`, `*.apk`, `*.aab` (gitignored) | Add all to `.gitignore` in the same task as cap setup |

**The critical OS-registered state for v2.0:** the bundle identifier `com.theusquiz.app` is permanent. Choosing it badly (e.g., `com.couplesquiz.app` would conflict with prior project naming) is a one-shot decision. Recommendation in this research: `com.theusquiz.app` matches the production domain `theusquiz.com` and is unambiguous.

---

## Common Pitfalls

### Pitfall 1: Apple Section 4.2 "Minimum Functionality" Rejection
**What goes wrong:** App is rejected at review because it's "just a website wrapped in a WebView with no native functionality."
**Why it happens:** Apple aggressively rejects thin wrappers since 2017. A Capacitor app that loads from a remote URL and uses zero native capabilities looks identical to a glorified Safari bookmark.
**How to avoid:**
1. **NATIVE-04 (this phase):** Bundle assets locally. App must boot offline (initial HTML/JS/CSS). Reviewer's airplane-mode test passes.
2. **Phase 16:** Use real native plugins (native camera via `@capacitor/camera`, haptics via `@capacitor/haptics`, share sheet via `@capacitor/share`). These show up in the binary and demonstrate "native functionality."
3. **Phase 17:** Push notifications via APNs. Strong signal of native integration.
4. **App Store listing (Phase 19):** Describe the app as a couples connection app, not as a "mobile version of a website." Mention camera, push, haptics in the description.
**Warning signs:** Initial review rejection citing "4.2 - Minimum Functionality" or "Design - Spam." Mitigation is to respond with a screen recording showing native capabilities in action.

### Pitfall 2: Vite Base Path Breaking Asset Resolution
**What goes wrong:** App installs fine, white screen on launch. DevTools shows 404s for `/assets/index.abc.js`.
**Why it happens:** Default Vite `base: '/'` produces `<script src="/assets/index.abc.js">`. Under `capacitor://localhost/`, that resolves to `capacitor://localhost/assets/...` which usually works — but on some Android WebView versions or under `file://` fallback, the resolution fails silently.
**How to avoid:** Set `base: './'` in `vite.config.js`. Relative paths always resolve against the document URL, regardless of scheme.
**Warning signs:** App opens to a blank page. DevTools (chrome://inspect for Android, Safari Web Inspector for iOS) shows 404 net errors on JS/CSS.

### Pitfall 3: CORS / Mixed Content from capacitor:// Origin
**What goes wrong:** Supabase API calls or WebSocket connections fail with CORS errors in the native app even though they work on web.
**Why it happens:** The WebView origin is `capacitor://localhost` (iOS) or `https://localhost` (Android default). Supabase, by default, accepts requests from any origin on the same project — but custom Edge Functions or third-party APIs may not have `capacitor://` whitelisted.
**How to avoid:**
1. For Supabase REST + Realtime — works out of the box; both treat the anon key as the auth boundary, not Origin.
2. For Edge Functions (Phase 17 push) — add `capacitor://localhost` and `https://localhost` to allowed origins.
3. Mixed content: Capacitor 8 default `androidScheme: 'https'` avoids the http→https mixed-content trap. Keep it.
**Warning signs:** Phase 15 validation finds realtime channel disconnects or Edge Function 403s. Phase 14 will not detect this directly but the planner should note it for Phase 15 testing.

### Pitfall 4: Android Keystore Loss
**What goes wrong:** Keystore is lost (laptop drive failure, file deleted accidentally, password forgotten). Google Play rejects all future updates because the new APK has a different signature than the published one.
**Why it happens:** Single-source storage. No backup. Or password forgotten and not in a password manager.
**How to avoid:**
1. Immediately after generation: copy `release.keystore` to `C:\My Vaults\CommandCenter\reports\secrets\` (Obsidian vault) AND to 1Password/Bitwarden as an attachment.
2. Store passwords in a password manager. Never commit `keystore.properties` (gitignored).
3. Use Google Play App Signing — Google holds a master signing key and you upload with an "upload key." If you lose the upload key, you can request a new one and Google re-signs the binary. This is the production-grade safety net.
**Warning signs:** "Your APK was not signed with the same certificate as the previous version" error from Google Play Console.

### Pitfall 5: iOS Signing Certificate / Provisioning Profile Expiry
**What goes wrong:** A few months after first ship, Codemagic builds start failing with code signing errors.
**Why it happens:** iOS development certificates expire after 1 year; provisioning profiles tied to certificates expire with them. App Store Connect API keys also have a 1-year max if generated with that limit.
**How to avoid:**
1. Use the App Store Connect API key flow (not manual .p12 + profile). The API key lets Codemagic auto-refresh certs and profiles on every build.
2. Calendar reminder for API key rotation 30 days before its expiry (set at generation time in App Store Connect).
3. Document the rotation procedure in BUILDING.md so future-John remembers what to do.
**Warning signs:** Codemagic build log shows `Code signing is required for product type 'Application'` or `No matching certificates found.`

### Pitfall 6: Status Bar Style Inversion
**What goes wrong:** Status bar icons are invisible on the paper bg — looks like the area is blank.
**Why it happens:** `Style.Light` was chosen thinking "light theme." But `Style.Light` means LIGHT TEXT (used on dark backgrounds). For a light/paper bg, you want `Style.Dark` (dark text on light bg).
**How to avoid:** Memorize: the style describes the **text/icons**, not the background. Paper bg = dark icons = `Style.Dark`.
**Warning signs:** On iPhone notch area or Android status bar, the time/wifi/battery icons are not visible.

### Pitfall 7: Android 16+ Edge-to-Edge Surprises
**What goes wrong:** App tested fine on Android 14, ships to Play Store, user with Android 16 reports "buttons hidden behind home indicator" or "status bar overlaps content."
**Why it happens:** Android 16 enforces edge-to-edge system UI. `StatusBar.setBackgroundColor` and `setOverlaysWebView(false)` are no-ops on Android 16+. The status bar is always transparent; the WebView always extends edge-to-edge [CITED: capacitorjs.com/docs/apis/status-bar].
**How to avoid:**
1. Set `adjustMarginsForEdgeToEdge: 'auto'` in capacitor.config — Capacitor adds margins for Android 15+.
2. Use `env(safe-area-inset-*)` CSS for content positioning. Already in use for `.bottom-nav`; add to `.page`.
3. Make `html { background-color: #FFF8F0 }` so the transparent status bar shows the paper color through.
4. Test in Android Studio emulator with API 36 (Android 16) before submitting.
**Warning signs:** Bottom nav overlaps gesture bar; status bar area is white instead of paper color.

---

## Code Examples

### BUILDING.md outline (NATIVE-08)

```markdown
# Building The Us Quiz Native Apps

This doc covers building the iOS IPA and Android APK / AAB from a clean checkout.

## Prerequisites

### All platforms
- Node.js 20+ and npm 10+
- A clean clone of this repo on `main`
- `.env` set up with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### Android (local on Windows)
- Android Studio Hedgehog 2024.1+ (installs JDK 17 if missing)
- The release keystore at `android/release.keystore` (NOT in git — get from John's password manager)
- `android/keystore.properties` populated (template in this doc below)

### iOS (Codemagic cloud)
- Codemagic account with `theusquiz-ascapi` App Store Connect integration configured
- Push access to `main` (or whichever branch the workflow listens to)
- An Apple Developer account ($99/yr) with `com.theusquiz.app` bundle ID registered

## Quick reference

| Command | What it does |
|---------|--------------|
| `npm install` | Install deps |
| `npm run dev` | Vite dev server (web only) |
| `npm run build` | Build `dist/` |
| `npm run cap:sync` | Build + copy to native projects |
| `npm run cap:android` | Build + sync + open Android Studio |
| `npm run cap:ios` | Build + sync + open Xcode (Mac only — use Codemagic for actual build) |

## Android local build

1. `npm install`
2. `npm run cap:android` — opens Android Studio
3. In Android Studio: Build → Generate Signed Bundle / APK → choose APK → use existing keystore
4. Output: `android/app/build/outputs/apk/release/app-release.apk`

### Generating the keystore (one-time)

```powershell
keytool -genkeypair -v -keystore android/release.keystore -storetype PKCS12 -alias theusquiz -keyalg RSA -keysize 2048 -validity 10000
```

Create `android/keystore.properties` (gitignored):
```
storeFile=../release.keystore
storePassword=<your password>
keyAlias=theusquiz
keyPassword=<your password>
```

**Back up the keystore.** If it is lost, the app can never be updated on Google Play.

## iOS build via Codemagic

1. Push to `main` — `codemagic.yaml` triggers automatically
2. Watch the build at https://codemagic.io
3. Successful builds upload to TestFlight automatically
4. Install via TestFlight on a real iPhone

### Manual iOS build trigger

Codemagic UI → Recent builds → Start new build → ios-capacitor-workflow

### Code signing setup (one-time)

In App Store Connect: Users & Access → Integrations → App Store Connect API → create key with "App Manager" access. Download the .p8.

In Codemagic: Teams → Integrations → Apple Developer Portal → upload .p8 + issuer ID + key ID → name it `theusquiz-ascapi`.

## Troubleshooting

### "White screen on launch"
DevTools shows 404 on /assets/*.js. Check `vite.config.js` has `base: './'` and re-run `npm run cap:sync`.

### "Status bar icons invisible"
Wrong status bar style. Confirm `src/main.jsx` calls `StatusBar.setStyle({ style: Style.Dark })` (dark text on light bg).

### "Codemagic build fails: No matching certificates found"
App Store Connect API key expired or was revoked. Generate a new one and re-upload to Codemagic.

### "Google Play: signature mismatch"
You signed with a different keystore than the previous release. Restore the original keystore from backup or use Google Play App Signing to recover.

### "Android 16: bottom nav hidden behind home indicator"
Confirm `capacitor.config.json` has `android.adjustMarginsForEdgeToEdge: 'auto'`. Confirm `.bottom-nav` CSS has `padding-bottom: env(safe-area-inset-bottom)`.
```

### iOS Info.plist permission strings (Phase 16 reference — add now to save round trip)

When Phase 16 adds `@capacitor/camera`, Info.plist needs these three keys. Adding now means the Capacitor sync doesn't fail later:

```xml
<!-- ios/App/App/Info.plist additions (within top-level <dict>) -->
<key>NSCameraUsageDescription</key>
<string>The Us Quiz uses your camera so you can take photos for your Daily Photo Challenge prompts.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>The Us Quiz needs photo library access so you can pick existing photos to answer Daily Photo prompts.</string>

<key>NSPhotoLibraryAddUsageDescription</key>
<string>The Us Quiz saves photos you take to your photo library.</string>
```

[CITED: capacitorjs.com/docs/apis/camera] confirms all three are required when the camera plugin is installed.

### .gitignore additions

```gitignore
# Capacitor sync output (regenerated by `npx cap sync`)
ios/App/App/public/
android/app/src/main/assets/public/

# Native build outputs
ios/App/build/
ios/App/Pods/
ios/App/Podfile.lock          # debate: some teams commit, simpler to ignore
android/app/build/
android/.gradle/
android/build/
android/local.properties      # auto-generated SDK path on each machine

# Signing secrets
android/keystore.properties
android/release.keystore
*.p8
*.p12
*.mobileprovision

# Build artifacts
*.ipa
*.apk
*.aab
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Cordova plugins | Capacitor plugins | Capacitor 1.0 (2019) | Modern native APIs, TypeScript-first plugin model, smaller binary; Cordova plugins still work via compat layer but are legacy |
| Manual iOS code signing (.p12 + .mobileprovision) | App Store Connect API key (.p8) | ~2021 | API keys auto-refresh, no manual cert rotation, work in CI without password input |
| `@capacitor/safe-area` community plugin | Native `env(safe-area-inset-*)` CSS | Chromium 140 (Android), iOS 12+ (WKWebView) | One less plugin to install/update; modern WebViews report insets natively |
| `@capacitor-community/edge-to-edge` Android plugin | Built-in `adjustMarginsForEdgeToEdge` config | Capacitor 8 (2024) | Capacitor 8 handles Android 15+ edge-to-edge enforcement natively |
| Manual Xcode signing UI clicks | Codemagic `app-store-connect fetch-signing-files --create` | ~2022 | Build runs without a logged-in Mac; CI bot creates profiles on demand |
| Vite `base: '/'` works | Vite `base: './'` for Capacitor | Always (best practice) | Avoids edge-case 404s on certain Android WebView versions |

**Deprecated/outdated to avoid in 2026:**
- Capacitor 5 and older — pre-edge-to-edge handling, fewer plugin updates
- Ionic Appflow as iOS CI — Codemagic has clearer Capacitor docs and a more flexible yaml [ASSUMED — based on community traction; verify pricing if Appflow is reconsidered]
- React Native — different paradigm entirely; out of scope per REQUIREMENTS.md "TypeScript migration" exclusion (codebase is JS) and "wrap-and-ship" goal

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Bundle ID `com.theusquiz.app` is available on App Store Connect and Google Play | Architecture Patterns | If taken, must pick a new ID — small risk since `theusquiz` is the production domain |
| A2 | John will use Codemagic free tier (500 macOS M2 min/mo) | Standard Stack | If insufficient, upgrade to Pro ($28/mo) or buy minute packs |
| A3 | Codemagic is preferred over GitHub Actions macOS runners | Alternatives Considered | If John prefers GH Actions for consistency with existing repos, swap codemagic.yaml for `.github/workflows/ios.yml` — same App Store Connect API key flow works |
| A4 | Vite `base: './'` works under iOS WKWebView `capacitor://` scheme | Pattern 2 | Highly likely correct based on Capacitor + Vite community examples, but device test in Phase 15 will confirm |
| A5 | `@capacitor/status-bar` plugin install during Phase 14 (not deferred to Phase 18) | Standard Stack | Status bar styling is part of NCAP-07 (this phase), so the plugin must install now |
| A6 | Native projects (`ios/`, `android/`) get committed to git | Architecture Patterns | Some teams gitignore them and regenerate on build. Committing is the Capacitor team's official recommendation but adds repo size — confirm John's preference in discuss phase |
| A7 | Capacitor 8 will not have a breaking 9.x release before v2.0 ships | Standard Stack | Capacitor releases majors ~yearly; risk is low for the 4–8 week v2.0 window |

**Items needing user confirmation before plan starts:**
- A1 (bundle ID choice — check it's available in App Store Connect)
- A6 (commit native projects to git — yes/no)
- A3 (Codemagic vs GitHub Actions macOS — confirm preference)

---

## Open Questions

1. **Should iOS auto-build on every push to main?**
   - What we know: codemagic.yaml example above has `triggering: branch_patterns: main`.
   - What's unclear: This burns minutes (500/mo free tier — each build is ~10–15 min so that's ~33 builds/mo). May be overkill during development.
   - Recommendation: Start with manual trigger only. Switch to auto-on-tag (`tag_patterns: 'v*'`) when v2.0 ships. Plan should make this a one-line yaml change.

2. **When does the bundle identifier get reserved?**
   - What we know: Phase 19 covers App Store Connect + Google Play developer accounts and listings.
   - What's unclear: The bundle ID `com.theusquiz.app` should ideally be reserved in App Store Connect before Phase 14 starts, otherwise Codemagic fetch-signing-files will fail because the App doesn't exist yet.
   - Recommendation: Reserve the bundle ID in App Store Connect as a prereq to Phase 14, OR design the plan so first iOS build is local-only (Xcode simulator) and Codemagic configuration comes in Phase 19 after the App is registered.

3. **Does `@capacitor/splash-screen` install in Phase 14 or Phase 18?**
   - What we know: The plugin is needed for splash screen artwork (Phase 18 requirements STORE-03/04). Without it, Capacitor shows a default white splash.
   - What's unclear: Installing in Phase 14 means a generic blue Capacitor splash ships in test builds. Some teams find this confusing; others tolerate it.
   - Recommendation: Install the plugin in Phase 14 (it's a peer of @capacitor/core in modern Capacitor templates anyway), but defer artwork generation to Phase 18.

4. **What about `@capacitor/app` for backgrounding events?**
   - What we know: Phase 15 requirement NATIVE-05 covers app lifecycle (backgrounding mid-game preserves state).
   - What's unclear: The `@capacitor/app` plugin exposes `App.addListener('appStateChange', ...)`. Phase 15 plan will need it.
   - Recommendation: Install in Phase 14 alongside StatusBar so the dependency is in place. No code calls it until Phase 15 plans.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js 20+ | Vite, Capacitor CLI | ✓ (assumed) | — | — (required to develop the existing app already) |
| npm 10+ | Package management | ✓ (assumed) | — | yarn / pnpm — not recommended; package.json is npm-shaped |
| JDK 17+ | Android build via Gradle | ✓ (Android Studio installs) | — | Install Android Studio Hedgehog or newer |
| Android Studio | Open + build Android project locally | ✓ (assumed installed) | — | Command-line Gradle (`./gradlew assembleRelease` from `android/`) |
| `keytool` | Generate Android release keystore | ✓ (ships with JDK) | — | — |
| Xcode (Mac) | Local iOS build | ✗ | — | **Codemagic cloud CI** — primary path per project constraint |
| Apple Developer account | App Store Connect, real-device install | ⚠️ Not yet — Phase 19 prereq | — | Free Apple ID supports 7-day side-loading; insufficient for shipping |
| Google Play Developer account | Play Console, Internal Testing | ⚠️ Not yet — Phase 19 prereq | — | Side-load APK for local testing |
| Codemagic account | iOS cloud build | ✗ (assumed needs setup) | — | GitHub Actions macOS runner; Bitrise free tier |
| App Store Connect API key (.p8) | Codemagic signing | ✗ — generate at Phase 14 start | — | Manual cert + provisioning profile upload (deprecated) |

**Missing dependencies with no fallback:**
- Codemagic account — must be created before iOS workflow can run
- App Store Connect API key — must be generated before Codemagic can sign
- Apple Developer account (for actual TestFlight delivery, but not required for build success)

**Missing dependencies with fallback:**
- Xcode — Codemagic covers it. John never needs a Mac.

**Pre-Phase-14 setup tasks for John (could be Wave 0 of Plan 1):**
1. Create Codemagic account, link GitHub repo
2. Create App Store Connect API key (Users & Access → Integrations)
3. Upload .p8 to Codemagic, name integration `theusquiz-ascapi`
4. Reserve bundle ID `com.theusquiz.app` in App Store Connect (requires Apple Developer Program enrollment — covered in Phase 19 but ideally pulled forward)

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.0.18 (already in project) |
| Config file | `vite.config.js` `test:` block |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

**Note:** Phase 14 is largely **build + config**. Most validation is integration-level (does the app build, does it boot, does it load assets from bundle) — not unit-testable. The vitest tests we can write are limited to config sanity checks.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NATIVE-01 | `capacitor.config.json` exists with correct shape (appId, appName, webDir=dist) | unit (config check) | `npm test -- capacitor-config` | ❌ Wave 0 |
| NATIVE-01 | `vite.config.js` has `base: './'` | unit (config check) | `npm test -- vite-config` | ❌ Wave 0 |
| NATIVE-02 | `ios/App/App.xcodeproj/project.pbxproj` exists | smoke (fs.existsSync) | `npm test -- platforms-exist` | ❌ Wave 0 |
| NATIVE-03 | `android/app/build.gradle` exists and has signingConfigs.release block | smoke (fs.existsSync + grep) | `npm test -- platforms-exist` | ❌ Wave 0 |
| NATIVE-04 | `capacitor.config.json` does NOT contain `server.url` | unit (config check) | `npm test -- capacitor-config` | ❌ Wave 0 |
| NATIVE-04 | App loads from bundle on installed device (no network for HTML/JS/CSS) | **manual** — airplane mode test | n/a — physical device | manual UAT |
| NATIVE-08 | `BUILDING.md` exists at repo root with required sections | smoke (fs + grep) | `npm test -- building-doc` | ❌ Wave 0 |
| NCAP-07 | `index.html` has `viewport-fit=cover` | unit (file content check) | `npm test -- viewport-meta` | ❌ Wave 0 |
| NCAP-07 | `index.css` has safe-area padding on `.page` | unit (file content check) | `npm test -- safe-area-css` | ❌ Wave 0 |
| NCAP-07 | Status bar matches paper aesthetic on device | **manual** — visual inspection | n/a — physical device | manual UAT |

### Sampling Rate
- **Per task commit:** `npm test` (existing test suite + new config-shape tests)
- **Per wave merge:** `npm test` + a smoke `npm run build && npx cap sync` to confirm sync completes
- **Phase gate:** Full suite green + manual UAT on at least one iOS device (TestFlight) and one Android device (sideloaded APK) before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/native-config.test.js` — verifies capacitor.config.json shape (appId, appName, webDir, no server.url) and vite.config.js base
- [ ] `tests/platforms-exist.test.js` — verifies `ios/App/App.xcodeproj` and `android/app/build.gradle` exist after `npx cap add` (skipped in CI where platforms aren't synced)
- [ ] `tests/build-docs.test.js` — verifies BUILDING.md exists and has required sections (`## Prerequisites`, `## Android local build`, `## iOS build via Codemagic`)
- [ ] `tests/viewport-meta.test.js` — reads `index.html` and asserts `viewport-fit=cover` is present
- [ ] `tests/safe-area-css.test.js` — reads `src/index.css` and asserts safe-area-inset rules exist on `.page` and `.bottom-nav`
- [ ] Manual UAT checklist in 14-VERIFICATION.md: airplane-mode launch test (NATIVE-04), notched-device safe-area visual check (NCAP-07), Android Studio build + APK install (NATIVE-03), Codemagic build + TestFlight install (NATIVE-02)

---

## Security Domain

Phase 14 is build + config; minimal app-layer security work. The threats are around the build pipeline secrets, not the runtime app.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no (auth unchanged — Supabase already validated in v1.0) | — |
| V3 Session Management | no (session unchanged — Phase 15 validates persistence across cold launches) | — |
| V4 Access Control | no (RLS unchanged from v1.1) | — |
| V5 Input Validation | no | — |
| V6 Cryptography | yes — Android keystore RSA-2048, iOS code signing certs | Keystore: `keytool ... -keyalg RSA -keysize 2048`. iOS: ECDSA via App Store Connect API key (.p8) |
| V14 Configuration | yes | `server.url` ABSENT in production config; secrets via Codemagic env vars not committed; keystore + .p8 gitignored |

### Known Threat Patterns for native wrap + cloud CI

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Stolen Android keystore → adversary publishes malicious update | Tampering / Elevation | Keystore in password manager + offline backup; enable Google Play App Signing so Google holds master key |
| Stolen App Store Connect API key → adversary uploads malicious build to TestFlight | Tampering / Elevation | API key stored only in Codemagic UI, never in repo; rotate annually; revoke immediately if .p8 leaks |
| Bundle ID squatting in App Store | Spoofing | Reserve `com.theusquiz.app` in App Store Connect at start of Phase 14 |
| Mixed content / man-in-the-middle on remote-loaded WebView | Tampering | `server.url` absent → no remote load → no MITM surface for initial HTML/JS |
| Apple Section 4.2 rejection | Information Disclosure (review feedback can leak app shape to competitors) | Bundle assets locally; demonstrate native capabilities in Phase 16/17 |
| Keystore password in cleartext repo | Information Disclosure | `android/keystore.properties` gitignored; passwords in 1Password |

**No new RLS work in this phase** — Supabase tables are unchanged. The first new RLS work in v2.0 lands in Phase 17 (push notification tokens table).

---

## Sources

### Primary (HIGH confidence)
- [Capacitor Getting Started](https://capacitorjs.com/docs/getting-started) — install commands, init flow, current version (Capacitor 8)
- [Capacitor Configuration](https://capacitorjs.com/docs/config) — `server.url`, `server.androidScheme`, default schemes, when to omit `server.url`
- [Capacitor Status Bar plugin](https://capacitorjs.com/docs/apis/status-bar) — install, methods, Android 16+ enforcement notes, iOS UIViewControllerBasedStatusBarAppearance requirement
- [Capacitor Camera plugin](https://capacitorjs.com/docs/apis/camera) — Info.plist permission strings (Phase 16 reference, but install paths same)
- [Capacitor Deep Links guide](https://capacitorjs.com/docs/guides/deep-links) — Universal Links + App Links setup (Phase 16 reference)
- [Vite — Building for Production](https://vite.dev/guide/build) — relative base path (`base: './'`) behavior
- [Codemagic pricing](https://codemagic.io/pricing) — 500 free macOS M2 minutes/month, $0.095/min after
- npm registry verifications via `npm view <pkg> version` on 2026-05-12: @capacitor/core 8.3.4, @capacitor/cli 8.3.4, @capacitor/ios 8.3.4, @capacitor/android 8.3.4, @capacitor/status-bar 8.0.2, @capacitor/splash-screen 8.0.1, @capacitor/app 8.1.0, @capacitor/assets 3.0.5
- Direct codebase reading: `package.json`, `vite.config.js`, `index.html`, `src/index.css`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`

### Secondary (MEDIUM confidence)
- [Codemagic — App Store Connect API for iOS code signing](https://blog.codemagic.io/app-store-connect-api-codemagic-cli-tools/) — yaml structure, fetch-signing-files command
- [Codemagic — Building Ionic Capacitor Apps](https://docs.codemagic.io/yaml-quick-start/building-an-ionic-app/) — Capacitor-specific build script ordering (npm install → build → cap sync → pod install → build-ipa)
- [Codemagic — App Store Connect publishing](https://docs.codemagic.io/yaml-publishing/app-store-connect/) — publishing block, submit_to_testflight option
- [Capgo — Edge-to-Edge in Capacitor without plugins](https://capgo.app/blog/capacitor-edge-to-edge-display-native-config/) — `adjustMarginsForEdgeToEdge: 'auto'` config option
- [Capacitor Community Safe Area plugin README](https://github.com/capacitor-community/safe-area) — context for when native CSS `env()` is insufficient (Chromium < 140)

### Tertiary (LOW confidence — flag for validation in plans)
- Vite `base: './'` working correctly under iOS WKWebView `capacitor://` scheme — community examples support this but device test in Phase 15 confirms
- Codemagic > GitHub Actions macOS preference — both work for Capacitor; Codemagic has more purpose-built docs but GH Actions integrates better with existing repo workflows. Treat as A3 in Assumptions Log.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified against npm registry; Capacitor 8.x is current stable
- Architecture (config shape, file layout): HIGH — directly from official Capacitor + Vite docs
- iOS via Codemagic: MEDIUM-HIGH — yaml shape verified against Codemagic blog post; will need a first-build dry run to confirm
- Android keystore + Gradle signing: HIGH — standard pattern documented across Capacitor + Android developer docs
- Status bar + safe-area: MEDIUM-HIGH — modern WebView behavior reliable; Android 16+ edge-to-edge enforcement could surface device-specific quirks
- BUILDING.md outline: HIGH — derived directly from build steps verified above
- Common pitfalls: HIGH — all derived from documented behavior or official Apple/Google guidance

**Research date:** 2026-05-12
**Valid until:** 2026-06-12 (Capacitor 8.x is stable; risk is a Capacitor 9.0 release within the window — check `npm view @capacitor/core version` at plan start)
