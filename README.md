# EDdys Cleaner

Disk detox for the chronically online. Scan and clean temp files, browser caches, and your Recycle Bin — with a full preview before anything gets yeeted.

**Version:** MVP v0.1 · **Platform:** Windows 10/11 · **License:** [MIT — free](./LICENSE.md)

---

## What it does

EDdys Cleaner is a standalone desktop app that finds junk on your PC, shows you exactly what can be removed, and cleans only what you pick.

| Category | What it cleans |
|----------|----------------|
| User Temp Files | `%TEMP%` and local temp clutter |
| Recycle Bin | Items you "deleted" but didn't yeet |
| Chrome Cache | Browser cache (all profiles) |
| Edge Cache | Browser cache (all profiles) |

**Also includes:** blocking-app detection with confirmation before force close, partial-clean reporting, and delete-on-restart for locked files.

---

## Action Buttons

After you scan, three buttons appear at the bottom of the app:

### **yeet selected**
**Delete the junk you picked.**

- Only cleans categories you have **checked/selected** (e.g. User Temp, Recycle Bin, Edge cache)
- Runs the clean after you confirm (and may ask to close blocking apps first)
- “Yeet” = slang for throwing something away — here, deleting temp/cache files

### **rescan**
**Scan your PC again.**

- Runs a fresh scan without going back to the home screen
- Updates sizes and item counts (useful after closing apps or cleaning something)
- Keeps you on the results screen

### **start over**
**Go back to the beginning.**

- Clears scan results, selections, and the clean summary
- Returns to the first screen (“your disk is lowkey bloated” + **scan my storage**)
- Use when you want a full reset

### Quick comparison

| Button | What it does |
|--------|----------------|
| **yeet selected** | Clean what you selected |
| **rescan** | Check disk again for junk |
| **start over** | Back to home screen |

**Typical flow:** Scan → pick categories → **yeet selected** → if stuff remains → **rescan** → **yeet selected** again. Use **start over** when you want to begin from scratch.

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| UI | React 19 + TypeScript + Tailwind CSS |
| Motion & icons | Framer Motion + Lucide React |
| Desktop shell | Tauri 2 |
| Core engine | Rust |
| Windows integration | Shell API, Restart Manager, delete-on-reboot |

Full architecture and roadmap: **[PROPOSAL.md](./PROPOSAL.md)**

---

## Roadmap

| Version | Focus | Status |
|---------|-------|--------|
| **v0.1 MVP** | Temp, Recycle Bin, Chrome/Edge, preview UI, app force-close | ✅ **Current** |
| **v0.2** | Firefox, Brave, thumbnail/app caches, tray, scheduler, admin mode | 🔲 Planned |
| **v0.3** | macOS/Linux, smart rules, portable edition, code signing | 🔲 Future |

See [PROPOSAL.md](./PROPOSAL.md) for the full feature list per version.

---

## Launcher Files (Windows)

| File | When |
|------|------|
| **`start.bat`** | First time only — installs Node, Rust, npm packages |
| **`run.bat`** | Daily use — double-click this instead |
| **`build.bat`** | Once — builds a real `.exe` you can pin to desktop |

## `run.bat` vs `build.bat`

**`run.bat`** = **launch** the app  
**`build.bat`** = **create** the app as a standalone `.exe`

### `run.bat` — daily launcher

- Starts EDdys Cleaner so you can use it
- If you already built the app, it opens the `.exe` directly (fast)
- If not, it runs **dev mode** (`npm run tauri dev`) — may compile first, needs Node/Rust in the background
- Use this **every time** you want to open the app

### `build.bat` — one-time packager

- Compiles the full **release** version of the app
- Creates a standalone file: `src-tauri\target\release\allj-cleaner.exe`
- Also creates an installer in: `src-tauri\target\release\bundle\`
- Takes a few minutes; run **once** (or again after code changes)
- After that, you can pin the `.exe` to desktop/taskbar and open it like any normal app

### At a glance

| | `run.bat` | `build.bat` |
|---|-----------|-------------|
| **Like** | Press Play | Burn a DVD |
| **Purpose** | Open the app now | Package the app for reuse |
| **How often** | Every day | Once (or after updates) |
| **Needs terminal?** | Sometimes (dev mode) | Yes, while building |
| **Result** | App window opens | `.exe` file on disk |

**Typical flow:**

1. `start.bat` — first-time setup
2. `build.bat` — once, to get the `.exe`
3. `run.bat` — or just double-click the `.exe` from then on

---

## Quick Start (Windows)

### First time

```bat
start.bat
```

### Every day after that

```bat
run.bat
```

### Standalone app (no terminal, fastest)

```bat
build.bat
```

Then open or pin:

`src-tauri\target\release\allj-cleaner.exe`

Or install from: `src-tauri\target\release\bundle\`

---

`start.bat` will (first time only):

1. Verify **Node.js** is installed
2. Install **Rust** via rustup if missing
3. Run **`npm install`**
4. Launch the app with **`npm run tauri dev`**

> **First run:** Rust compilation can take a few minutes. You may also need [Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (select *Desktop development with C++*).

## Manual Setup

```bat
npm install
npm run tauri dev
```

## Build Installer

```bat
npm run tauri build
```

Output: `src-tauri/target/release/bundle/`

---

## Shipping / Distribution

**Just the `.exe`** — or better, the **installer** from `bundle\`. Do **not** ship the whole `release` folder.

### What to ship

| What | Ship it? | Notes |
|------|----------|-------|
| **`allj-cleaner.exe`** | ✅ Yes (portable) | Single file; double-click to run |
| **`bundle\nsis\...-setup.exe`** | ✅ **Best for users** | Proper installer (Start Menu, uninstall) |
| **`bundle\msi\....msi`** | ✅ Yes (optional) | For IT / enterprise installs |
| **Entire `release\` folder** | ❌ **No** | Build junk — `deps\`, `.rlib`, fingerprints, etc. |

### Why not the whole `release` folder?

`target\release\` is a **compiler output directory**, not a portable app folder. Most of it is Rust build artifacts, intermediate installer files, and thousands of files users don't need. Only a few files matter for distribution.

### Recommended options

**Option 1 — Installer (best for shipping to others)**

After `build.bat`, give users:

```
src-tauri\target\release\bundle\nsis\EDdys Cleaner_0.1.0_x64-setup.exe
```

**Option 2 — Portable single file**

```
src-tauri\target\release\allj-cleaner.exe
```

Works on its own. Recipient needs **Windows 10/11** with **WebView2** (usually already installed).

---

## Tips for Better Cleaning Results

Windows often locks temp files while apps are running. If you see **partially yeeted** or **files skipped (in use)**, try this:

1. **Close heavy apps before cleaning** — Edge, Chrome, Cursor, Discord, games
2. **Use the blocking-apps prompt** — when shown, confirm to close apps and yeet
3. **Yeet one category at a time** — not everything at once
4. **Rescan → yeet again** — after closing apps
5. **Restart your PC** — clears queued locked files; then scan & clean again

### What to expect

| Situation | Result |
|-----------|--------|
| Apps closed | Most or all temp files removed |
| Apps still running | Partial clean — some files skipped |
| After restart | Locked files often gone |

---

## MVP Features (v0.1)

- User temp folder scan & clean
- Recycle Bin empty (Windows Shell API)
- Google Chrome & Microsoft Edge cache clean
- Preview with per-category toggles
- Safe path validation (won't touch system folders)
- Partial clean / skipped file reporting
- Detect blocking apps → confirm → force close
- Delete locked files on next reboot
- `start.bat` / `run.bat` / `build.bat` launchers

---

## Project Docs

| Document | Contents |
|----------|----------|
| [PROPOSAL.md](./PROPOSAL.md) | Full proposal, architecture, v0.1 / v0.2 / v0.3 roadmap |
| [LICENSE.md](./LICENSE.md) | MIT License — free to use |

---

## License

EDdys Cleaner is **free** to use, modify, and distribute under the [MIT License](./LICENSE.md).
