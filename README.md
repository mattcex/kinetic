# Kinetic

Kinetic is a strength-training log. It records working sets for weighted and bodyweight exercises, estimates one-rep max, detects personal records and visualises progress over time. It also tracks body weight and measurements and derives the physique indices most relevant to people who train. All data is stored on the device.

It ships in three forms:

| | iOS app | Web app | Android app |
|---|---|---|---|
| Location | `Kinetic/`, `Kinetic.xcodeproj` | `docs/` | `android/` |
| Runs on | iOS 17.0 or later | Any current browser, including Safari on iOS 15 or later | Android 7.0 (API 24) or later |
| Stack | Swift, SwiftUI, Swift Charts | HTML, CSS and JavaScript, with no build step or dependencies | The web app bundled in a native WebView shell (Java) |
| Storage | JSON file in the app's Documents directory | `localStorage` in the browser | `localStorage` inside the app |
| Features | Weighted exercises, overview, activity calendar, charts | Everything described below | Same as the web app |

The web and Android apps are the actively developed versions. The native iOS app covers weighted-exercise logging only. It does not have bodyweight exercises, custom categories or the body and physique screen.

The interface language is Polish.

## Android app

**Download:** [kinetic.apk](https://github.com/mattcex/kinetic/releases/download/android/kinetic.apk) from the [Android release](https://github.com/mattcex/kinetic/releases/tag/android).

### Installing
1. Open the download link on the phone.
2. Open `kinetic.apk`. If Android asks, allow your browser to install apps.

The app works fully offline. Its interface is the web app from `docs/`, packaged into the APK at build time, so both always match. The Android shell adds:
- **Back handling:** the system Back gesture closes an open sheet, then returns to the overview.
- **Backups:** copying a backup code uses the system clipboard, and sharing a backup opens the Android share sheet.
- **Restoring:** a backup file is picked with the system file picker.
- **Layout:** the content stays clear of the status bar, navigation bar, display cutout and keyboard.

### Builds and signing
The [Android APK](.github/workflows/android.yml) workflow runs on every push to `main` that changes `android/` or `docs/`. It builds a release APK with Gradle and replaces the `android` release. Each build uses the workflow run number as its `versionCode`, so a new APK installs over the previous one and keeps the app's data.

APKs are signed with `android/signing/kinetic-sideload.p12`, a key committed to the repository for sideloaded builds, so the signature stays the same from one build to the next. Because the key is public, it is not suitable for store distribution. To sign with a private key, set `KINETIC_KEYSTORE_FILE`, `KINETIC_KEYSTORE_PASSWORD`, `KINETIC_KEY_ALIAS` and `KINETIC_KEY_PASSWORD` in the build environment.

To build locally, you need JDK 17, the Android SDK and Gradle 8.11:

```bash
gradle --project-dir android assembleRelease
```

## Web app

The web app is published with GitHub Pages at **https://mattcex.github.io/kinetic/**.

### Installing on iPhone
1. Open the link in Safari.
2. Tap **Share**, then **Add to Home Screen**.

Kinetic then opens full screen like an app. It works offline because a service worker caches it.

### Storage and backups
- Data is saved after every change in the browser's local storage.
- An app added to the Home Screen has its own storage, separate from Safari. Add it to the Home Screen before you start logging.
- Under **Settings → Kopia zapasowa** you can copy a backup code (`KNT1:…`) or save a backup file. Restoring either one moves the data to another device or browser, or recovers it after website data has been cleared.
- No data is sent to a server.

### Running locally

```bash
python -m http.server 8781 --directory docs
```

Then open http://localhost:8781.

## Features

### Exercises
- Every exercise has a name, a category and a type, and all three can be edited later.
- **Categories:**
  - Built in: chest, back, legs, glutes, shoulders, arms, core and other.
  - Custom categories can be created from the exercise form and removed under Settings. Exercises in a removed category move to "other".
- **Types:**
  - **Weighted:** the load is the weight on the bar or machine.
  - **Bodyweight**, such as push-ups or pull-ups: you log repetitions, and optionally added weight for weighted dips or pull-ups.
- A list of common lifts, including bodyweight ones, can be picked to fill in the form.

### Logging
- A set entry records:
  - weight in kg (added weight for bodyweight exercises), typed in directly or adjusted in 2.5 kg steps or quick steps of 5 kg and 10 kg
  - repetitions (1–100, or 1–300 for bodyweight) and sets (1–20)
  - the date, which cannot be in the future
- The entry form starts with the values of the previous entry for the same exercise.
- An entry that beats every earlier score for its exercise is marked as a personal record and shown with an animation. The score is defined under [Calculations](#calculations).

### Overview
- Training volume for the current week (Monday to Sunday), with the percentage change against the previous week.
- A weekly goal of 2–7 training days, shown as a progress ring.
- Streak of consecutive weeks with at least one session, the total number of sessions, and personal records from the last 30 days.
- A physique summary: body weight, body fat and FFMI.
- A 26-week activity calendar. Each day is shaded on five levels relative to the day with the most sets in the period. Tapping a day shows its sets and volume.
- An exercise list sorted by most recent activity. Each row shows the best weight, or the best repetitions for bodyweight exercises, with a sparkline of the last 12 sessions and the change across them.

### Exercise detail
- A progress chart per training day for one of three metrics. Weighted exercises use estimated 1RM, top weight or volume. Bodyweight exercises use most repetitions in a set, total repetitions or added weight.
- Time ranges of 1 month, 3 months, 6 months, 1 year or all time. Dragging across the chart shows the value for a single day.
- Summary figures and the full history, with personal records marked and a delete button on each entry.

### Body and physique
- **Profile:** sex and height, which several formulas need.
- **Measurements:** dated entries for body weight, waist, neck, hips, shoulders and an optional body-fat percentage from another method. Each entry stores only the fields you fill in, and a second entry on the same day updates the first.
- **Weight chart:** shows the change over the selected range.
- **Indices:** each shows its value and an indicative rating. They are body fat, FFMI, lean body mass, the V ratio, waist-to-height and waist-to-hip; see [Calculations](#calculations).
- **Relative strength:** best estimated 1RM divided by body weight for each weighted exercise.
- **DOTS:** shown when squat, bench press and deadlift are logged. The three lifts are recognised by exercise name.

### Data management
- A deterministic 26-week sample dataset, including bodyweight exercises and measurements, can be loaded to try the app.
- All data can be erased under Settings.

## Calculations

| Metric | Definition |
|---|---|
| Load | Weighted: the logged weight. Bodyweight: latest body weight plus added weight |
| Volume | `load × reps × sets`, summed per day or per week |
| Estimated 1RM | Epley formula: `weight × (1 + reps / 30)`; equals `weight` when `reps = 1` |
| Personal-record score | Estimated 1RM of the load. Bodyweight exercises assume 70 kg until a body weight is logged, so their records still rank by repetitions and added weight |
| Session | A calendar day with at least one logged entry |
| Weekly streak | Consecutive weeks (Monday-based) with at least one session. The current week counts only after it has a session. |
| Body fat (US Navy) | Men: `495 / (1.0324 − 0.19077·log10(waist − neck) + 0.15456·log10(height)) − 450`. Women: `495 / (1.29579 − 0.35004·log10(waist + hips − neck) + 0.221·log10(height)) − 450`. All in cm. Uses the more recent of this estimate or a manually entered value |
| Lean body mass | `weight × (1 − body fat)` |
| FFMI | `lean mass / height²` (m), normalised to 1.8 m: `FFMI + 6.1 × (1.8 − height)` |
| V ratio | `shoulder circumference / waist`; 1.618 is the "golden ratio" ideal |
| Waist-to-height | `waist / height`; below 0.5 is the common health target |
| Waist-to-hip | `waist / hips`; WHO thresholds are 0.90 for men and 0.85 for women |
| Relative strength | `best estimated 1RM / body weight` |
| DOTS | `total × 500 / (a + b·bw + c·bw² + d·bw³ + e·bw⁴)` with the published sex-specific DOTS coefficients, where total is squat + bench + deadlift as estimated 1RM |

Ratings are indicative. Body-fat ranges follow the American Council on Exercise. FFMI ranges follow Kouri et al. (1995), with lower thresholds for women.

## Data and privacy

The native app stores its data in a single JSON file, `kinetic-data.json`, in its Documents directory. It writes the file atomically after every change. The web app keeps the same data in `localStorage`.

Neither version sends data to a server, and neither has accounts, analytics or tracking. The web app only downloads its own files from GitHub Pages.

## Project structure

```
docs/                       Web app (GitHub Pages): index.html, app.js, styles.css, sw.js, manifest
android/                    Android app: Gradle project, WebView shell, launcher icons, signing key
Kinetic.xcodeproj           Xcode project (single app target, shared scheme)
Kinetic/
  App/                      App entry point and navigation
  Model/                    Data types, persistence (Store), sample data
  Design/                   Theme, shared components, background
  Views/                    Screens, activity calendar, charts, entry sheets
  Resources/                Asset catalog (app icon, accent colour)
.github/workflows/          CI build workflows (ios-builder)
builder.json                ios-builder configuration
```

The project uses a file-system synchronized group for `Kinetic/`. Files added to that folder are picked up by Xcode without editing the project file. Opening it requires Xcode 16 or later.

## Building

### With Xcode

1. Open `Kinetic.xcodeproj`.
2. Under **Signing & Capabilities**, select a development team. A free Personal Team (any Apple ID) is enough to run the app on your own device.
3. If Xcode reports that the bundle identifier `app.kinetic.strength` is unavailable, change it to one of your own, such as `com.yourname.kinetic`.
4. Select a simulator or a connected iPhone, then choose **Product → Run**.

With a free Personal Team, an installed build is valid for 7 days. After that, run it from Xcode again. Reinstalling keeps the app's data.

### Without a Mac

This repository is set up for [ios-builder](https://github.com/MobAI-App/ios-builder), which builds on GitHub Actions macOS runners:

```bash
builder auth github
builder ios build            # unsigned IPA in ./dist/
```

On the runner, the workflow builds the `Kinetic` scheme of `Kinetic.xcodeproj`.

The resulting IPA is unsigned. To install it on a device, sign it with one of these:
- your own development or ad-hoc profile (`builder signing setup`)
- a re-signing tool that uses an Apple ID
