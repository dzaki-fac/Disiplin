# Disiplin

> A minimalist focus timer built for deep work.

Disiplin is a desktop focus timer for the Pomodoro technique, plain timers, and
stopwatch-style tracking. It records every finished session, organizes your tasks
into weekly buckets, and turns your history into charts, a monthly calendar, and a
yearly heatmap — all stored locally on your machine.

Built with Electron, React, and TypeScript.

## Features

- **Three timer modes**
  - **Pomodoro** — alternating focus / short break / long break cycles with
    configurable durations and long-break intervals.
  - **Timer** — a countdown timer with a custom duration.
  - **Stopwatch** — count up without a preset duration.
  - Auto-start between focus and break stages, optional UI sounds, and a
    progress ring around the clock.
- **Task planning**
  - Tasks organized into weekly buckets (4 weeks rolling).
  - Add, edit, complete, and delete tasks; drag to reorder; attach a session to
    any task.
- **History**
  - A full log of every completed session with duration, task, and timestamp.
  - **Export / import** your session history as JSON to back it up or move it
    between machines.
- **Statistics**
  - Summary cards: total focus time, today's minutes, current streak, sessions today.
  - **7-day chart** comparing this week against last week, with an average line.
  - **Monthly calendar** heat map.
  - **Yearly heatmap** with a 2-hour color scale (up to 6+ hours).
  - Top sessions breakdown.
- **Pixel Blast background**
  - A lightweight, animated WebGL pixel background (Three.js + postprocessing)
    rendered behind the UI, with ripple effects on click.
- **Custom window chrome** with native window controls and a clean titlebar.

## Screenshots

### Fokus

![Fokus](screenshots/Screenshot%202026-08-15%20170753.png)

### Tugas

![Tugas](screenshots/Screenshot%202026-08-15%20170746.png)

### Riwayat

![Riwayat](screenshots/Screenshot%202026-08-15%20170707.png)

### Statistik

![Statistik atas](screenshots/Screenshot%202026-08-15%20170658.png)

![Statistik bawah](screenshots/Screenshot%202026-08-15%20170639.png)

## Tech Stack

| Layer     | Technology                                            |
| --------- | ----------------------------------------------------- |
| Runtime   | [Electron](https://www.electronjs.org/)               |
| UI        | [React](https://react.dev/) 19                        |
| Language  | [TypeScript](https://www.typescriptlang.org/)         |
| Build     | [electron-vite](https://electron-vite.org/) + Vite 7  |
| Charts    | [Recharts](https://recharts.org/)                     |
| Effects   | [Three.js](https://threejs.org/) + [postprocessing](https://github.com/pmndrs/postprocessing) |
| Animation | [Motion](https://motion.dev/)                         |
| Packaging | [electron-builder](https://www.electron.build/)       |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- A package manager — [pnpm](https://pnpm.io/) is recommended (a `pnpm-lock.yaml`
  is committed), but npm works too.

### Install

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

Runs the app with hot module reload (electron-vite dev server + Electron).

### Build

```bash
# Typecheck + production build (output to out/)
pnpm build

# Platform installers
pnpm build:win     # Windows (NSIS installer)
pnpm build:mac     # macOS (DMG)
pnpm build:linux   # Linux (AppImage / snap / deb)

# Unpacked build without an installer
pnpm build:unpack
```

## Project Structure

```
├── build/                    # Build resources (icons, entitlements, installer assets)
├── resources/                # Bundled resources (app icon)
├── src/
│   ├── main/                 # Electron main process (window, IPC, data access)
│   │   └── index.ts
│   ├── preload/              # Preload scripts (context bridge, IPC surface)
│   └── renderer/             # React UI
│       └── src/
│           ├── components/   # Views, charts, backgrounds, icons
│           │   ├── TimerView.tsx
│           │   ├── TasksView.tsx
│           │   ├── HistoryView.tsx
│           │   ├── StatsView.tsx
│           │   ├── WeekAreaChart.tsx   # 7-day comparison chart
│           │   ├── MonthCalendar.tsx   # monthly calendar heat map
│           │   ├── Heatmap.tsx         # yearly heatmap
│           │   └── PixelBlast.tsx      # WebGL pixel background
│           ├── lib/          # State store, persistence, helpers
│           ├── assets/       # Global styles
│           └── App.tsx
├── electron-builder.yml      # electron-builder configuration
└── electron.vite.config.ts   # electron-vite configuration
```

## Data & Privacy

All data lives **locally** in the renderer's `localStorage` — no accounts, no
cloud sync, nothing leaves your machine. Use the **export** button in the History
view to back up your sessions as a JSON file or import it on another device.

## Useful Commands

| Command                 | Description                                  |
| ----------------------- | -------------------------------------------- |
| `pnpm dev`              | Start the app in development mode            |
| `pnpm start`            | Preview the production build                 |
| `pnpm typecheck`        | Type-check main, preload, and renderer code  |
| `pnpm lint`             | Run ESLint (with prettier rules)             |
| `pnpm format`           | Format all source files with Prettier        |
| `pnpm build`            | Typecheck and build for production           |
| `pnpm build:win`        | Build the Windows installer                  |

## Roadmap

- [ ] Desktop notifications when a focus or break stage ends
- [ ] Global timer visibility (always-on-top mini window / tray)
- [ ] Session tagging & filtering in history
- [ ] Export statistics as CSV/PNG
- [ ] Auto-updates

## License

MIT
