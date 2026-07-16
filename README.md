# 🌱 Bloom

**Read more, focus better — and watch your garden grow.**

Bloom is a cross-platform (iOS + Android) reading app that turns focused reading
into a living garden. Log reading sessions, track real metrics (session length,
pages, time-per-page), and keep a streak alive to make your garden bloom. Skip
too many days and it starts to wither.

This repository contains the **Phase 1 prototype**: import a PDF, read it with
live session tracking, review your reading history, and watch a garden that
grows and withers based on your activity.

---

## What's in the prototype

- **📚 Library** — import a PDF from your device; it's copied into app storage.
- **📖 Reader** — a paged PDF viewer with a live session HUD (current page,
  active time, pages read).
- **⏱ Honest session tracking** — active reading time only. The clock pauses
  when the app is backgrounded or left idle on a page, so metrics reflect real
  reading. Per-page dwell time is recorded for each page you visit.
- **🌸 The Garden** — a home screen with an **illustrated, animated** plant
  (SVG) whose growth stage is derived from your cumulative sessions and streak.
  It sways gently, pops when it advances a stage, and wilts after a few inactive
  days.
- **📊 History** — every completed session with duration, pages, and average
  time-per-page.
- **🔔 Reminders** — local daily reading reminders and a "your garden is about
  to wither" warning, configurable in **Settings** (no account/network needed).

Everything is stored **locally** in SQLite — no account, no network required.

### Deliberately deferred (see Roadmap)

EPUB & article import, cloud accounts/sync, and **app-locking** (locking
Instagram/YouTube/etc. until you've read). App-locking is a substantial native
feature gated by platform APIs — details in the Roadmap below.

---

## Tech stack

| Concern        | Choice                                              |
| -------------- | --------------------------------------------------- |
| Framework      | Expo (dev client) + React Native + TypeScript       |
| Navigation     | Expo Router                                         |
| Database       | SQLite via `expo-sqlite` + Drizzle ORM              |
| PDF rendering  | `react-native-pdf`                                  |
| State          | Local component state + Zustand (installed for growth) |

> **Dev client, not Expo Go.** Bloom uses native modules (`react-native-pdf`),
> so it runs in a custom dev client build — not the Expo Go sandbox.

---

## Quickstart (local)

Prerequisites: **Node 22+**, and for device builds either **Android Studio**
(Android) or **Xcode on macOS** (iOS).

```bash
npm install            # .npmrc pins legacy-peer-deps for Expo's dep tree
npm run typecheck      # optional: verify the TypeScript

# Build + run the dev client on a device/emulator:
npm run android        # expo run:android
npm run ios            # expo run:ios   (macOS + Xcode only)
```

`expo run:*` performs a native prebuild the first time (generates the
`android/` and `ios/` folders) and installs the dev client on your
device/emulator. After that, `npm start` just serves the JS.

> 💡 A **Makefile** wraps these commands — run `make help` to see all targets
> (`make android`, `make ios`, `make start`, `make typecheck`, `make clean`, …).

---

## Quickstart (Docker)

The container runs the **Metro dev server**; your device/emulator runs the
native dev-client build and connects to it over your LAN.

```bash
# Point Metro at your machine's LAN IP so a physical device can reach it:
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.42 docker compose up --build
```

Then launch the Bloom dev client on your device — it connects to Metro at
`http://<your-lan-ip>:8081`.

There is also a **VS Code dev container** (`.devcontainer/`) that provisions
Node 22 and installs dependencies for a consistent editing/tooling environment.

### ⚠️ iOS builds and containers

A Linux container **cannot build the iOS app** — Apple requires macOS + Xcode.
The container serves the JS bundle just fine, but the *native* iOS dev client
must be built on a Mac or via **[EAS Build](https://docs.expo.dev/build/introduction/)**
(Expo's cloud build service). Android builds can be containerized by mounting an
Android SDK; the default image ships the dev server only.

---

## Project structure

```
app/                      # Expo Router routes
├─ _layout.tsx            # root stack; initializes the database
├─ (tabs)/
│  ├─ _layout.tsx         # Garden / Library / History tabs
│  ├─ index.tsx           # 🌸 Garden home
│  ├─ library.tsx         # 📚 documents + import
│  ├─ history.tsx         # 📊 session history
│  └─ settings.tsx        # 🔔 reminder toggle + time
└─ reader/[id].tsx        # 📖 PDF reader + session HUD

src/
├─ config.ts              # garden & session tuning knobs (one place)
├─ theme.ts               # colors / spacing / radius
├─ db/
│  ├─ schema.ts           # Drizzle schema: documents, sessions, page_events, preferences
│  ├─ client.ts           # SQLite open + table bootstrap
│  └─ repo.ts             # queries + reading summary + streak logic
├─ features/
│  ├─ reading/
│  │  ├─ useSessionTracker.ts  # active-time + per-page dwell tracking
│  │  └─ import.ts             # PDF picker + persistent copy
│  ├─ garden/garden.ts         # growth-stage + wither computation (pure)
│  ├─ notifications/notifications.ts  # local reminders + wither warning
│  └─ settings/preferences.ts  # persisted user preferences
├─ components/            # Screen, Button, StatTile, Garden, GardenPlant (SVG)
└─ lib/                   # id + time helpers
```

## Tuning the feel

All the behavioural knobs live in [`src/config.ts`](src/config.ts):

- `GARDEN_CONFIG.stageThresholds` — sessions needed to reach each growth stage.
- `GARDEN_CONFIG.witherAfterDays` — inactive days before the garden wilts.
- `SESSION_CONFIG.idleTimeoutMs` — how long without interaction counts as
  "walked away" (default 5 min).

---

## Roadmap

| Phase | Scope                                                                 |
| ----- | --------------------------------------------------------------------- |
| **1** ✅ | PDF reading, session metrics, garden bloom/wither, history            |
| **2** ✅ | Illustrated / animated garden stages; local notifications & streak reminders |
| **3**   | **App-locking** — see below                                            |
| **4**   | EPUB + article (reader-mode) import; cloud accounts & sync             |

### On app-locking (Phase 3)

Locking other apps until reading goals are met is real but platform-gated:

- **iOS** — the only sanctioned path is Apple's **Screen Time / Family Controls**
  framework (`FamilyControls`, `ManagedSettings`, `DeviceActivity`), which
  "shields" apps the user picks. It requires a **special entitlement requested
  from Apple**, doesn't run in the simulator, and needs a native module.
- **Android** — detect a blocked app opening via `UsageStatsManager` /
  an `AccessibilityService` and cover it with an overlay
  (`SYSTEM_ALERT_WINDOW`). These are sensitive permissions with strict Play
  Store review.

Both require native code beyond the JS layer, which is why the stack uses the
Expo dev-client (native-module capable) rather than Expo Go.

---

## License

Apache 2.0 — see [LICENSE](LICENSE).
