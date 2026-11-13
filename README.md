# Kinetic

Kinetic is a strength-training log for iPhone. It records working sets per exercise, estimates one-rep max, detects personal records and visualises progress over time. All data is stored on the device.

- **Platform:** iOS 17.0 or later, iPhone, portrait
- **Stack:** Swift, SwiftUI, Swift Charts. There are no third-party dependencies.
- **Interface language:** Polish

## Features

### Logging
- Exercises have a name and a muscle group. The seven groups are chest, back, legs, shoulders, arms, core and other. A list of common lifts can be picked to fill in the form.
- A set entry records:
  - weight in kg, typed in directly or adjusted in 2.5 kg steps or quick steps of 5 kg and 10 kg
  - repetitions (1–50) and sets (1–20)
  - the date, which cannot be in the future
- The entry form starts with the values of the previous entry for the same exercise.
- An entry that beats every earlier estimated 1RM for its exercise is marked as a personal record and confirmed with haptic feedback.

### Overview
- Training volume for the current week (Monday to Sunday), with the percentage change against the previous week.
- A weekly goal of 2–7 training days, shown as a progress ring.
- Streak of consecutive weeks with at least one session, the total number of sessions, and personal records from the last 30 days.
- A 26-week activity calendar. Each day is shaded on five levels relative to the highest-volume day in the period. Tapping a day shows its date and volume.
- An exercise list sorted by most recent activity. Each row shows the heaviest weight, a sparkline of the last 12 sessions and the change across them.

### Exercise detail
- A progress chart for one of three metrics per training day: estimated 1RM, top weight or total volume.
- Time ranges of 1 month, 3 months, 6 months, 1 year or all time. Dragging across the chart shows the value for a single day.
- Summary figures: best estimated 1RM, heaviest weight, number of sessions and lifetime volume.
- Full history, with personal records marked. A long press on an entry deletes it.

### Data management
- A deterministic 26-week sample dataset can be loaded to try the app.
- All data can be erased from the overview menu.

## Calculations

| Metric | Definition |
|---|---|
| Volume | `weight × reps × sets`, summed per day or per week |
| Estimated 1RM | Epley formula: `weight × (1 + reps / 30)`; equals `weight` when `reps = 1` |
| Personal record | An entry whose estimated 1RM is higher than every earlier entry for the same exercise |
| Session | A calendar day with at least one logged entry |
| Weekly streak | Consecutive weeks (Monday-based) with at least one session. The current week counts only after it has a session. |

## Data and privacy

The app stores its data in a single JSON file, `kinetic-data.json`, in its Documents directory. It writes the file atomically after every change.

Kinetic makes no network requests and has no accounts, analytics or tracking.

## Project structure

```
project.yml                 XcodeGen specification (target, settings, scheme)
Kinetic/
  App/                      App entry point and navigation
  Model/                    Data types, persistence (Store), sample data
  Design/                   Theme, shared components, background
  Views/                    Screens, activity calendar, charts, entry sheets
  Resources/                Asset catalog (app icon, accent colour)
.github/workflows/          CI build workflows (ios-builder)
builder.json                ios-builder configuration
```

The Xcode project is generated from `project.yml` and is not tracked in git.

## Building

### With a Mac

```bash
brew install xcodegen
xcodegen generate
open Kinetic.xcodeproj
```

To run on a device, select a development team under *Signing & Capabilities*. You may also need to change the bundle identifier `app.kinetic.strength` to one your team owns.

### Without a Mac

This repository is set up for [ios-builder](https://github.com/MobAI-App/ios-builder), which builds on GitHub Actions macOS runners:

```bash
builder auth github
builder ios build            # unsigned IPA in ./dist/
```

On the runner, the workflow generates the Xcode project with XcodeGen and builds the `Kinetic` scheme.

The resulting IPA is unsigned. To install it on a device, sign it with one of these:
- your own development or ad-hoc profile (`builder signing setup`)
- a re-signing tool that uses an Apple ID
