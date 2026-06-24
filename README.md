# EDdys Cleaner

Disk detox for the chronically online. Scan and clean temp files, browser caches, and your Recycle Bin — with a full preview before anything gets yeeted.

**Version:** v0.2 (privacy preview) · **Platform:** Windows 10/11 · **License:** [MIT — free](./LICENSE.md)

---

## What it does

EDdys Cleaner is a standalone desktop app that finds junk on your PC, shows you exactly what can be removed, and cleans only what you pick.

| Category | What it cleans |
|----------|----------------|
| User Temp Files | `%TEMP%` and local temp clutter |
| Recycle Bin | Items you "deleted" but didn't yeet |
| Chrome Cache | Browser cache (all profiles) |
| Edge Cache | Browser cache (all profiles) |
| Clipboard | Copied text and Win+V history when possible |
| Thumbnail Cache | Explorer `thumbcache_*.db` and `iconcache_*.db` (delete-on-reboot if locked) |
| **Privacy & sessions** *(opt-in)* | |
| Chrome — Cookies & Sessions | Site logins + tab/session restore (passwords **not** removed) |
| Chrome — History & Downloads List | URLs and browser download list |
| Chrome — Site Storage | Local storage, IndexedDB, session storage |
| Edge — (same three) | Same privacy categories for Microsoft Edge |
| Brave — (same three) | Same privacy categories for Brave *(when installed)* |
| Firefox — (same three) | Same privacy categories for Firefox *(when installed)* |
| **Misc** *(opt-in)* | |
| Downloads Folder | Files in `%USERPROFILE%\Downloads` — confirmation required |
| DNS Cache | Flushes Windows DNS resolver cache (`ipconfig /flushdns`) |

**Secure exit** — one-click preset selects every **Privacy & sessions** item (browser sign-out only; never Downloads or DNS).

**Also includes:** blocking-app detection with confirmation before force close, partial-clean reporting, and delete-on-restart for locked files.

Privacy and misc categories are **not** auto-selected on scan — pick them manually when needed. See [SECURITY-PRIVACY-ROADMAP.md](./docs/SECURITY-PRIVACY-ROADMAP.md).

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

Full stack details: **[TECH-STACK.md](./docs/TECH-STACK.md)** · Product roadmap: **[INITIAL-PROPOSAL.md](./docs/INITIAL-PROPOSAL.md)**

---

## Roadmap

| Version | Focus | Status |
|---------|-------|--------|
| **v0.1** | Temp, Recycle Bin, Chrome/Edge cache, clipboard, preview UI, blocking-app force-close | ✅ Shipped |
| **v0.2** | Firefox/Brave cache, thumbnail & app caches (Teams, Discord, Spotify), **Privacy & sessions**, Secure exit, Misc (Downloads, DNS), sectioned scan UI | ✅ **Current** |
| **v0.3** | System tray, scheduled cleaning, admin mode (system caches), settings & exclusions, expandable error log, AppData discovery ([Phase 5](./docs/SECURITY-PRIVACY-ROADMAP.md)) | 🔲 Planned |
| **v0.4** | PI (Performance) tune-up ([roadmap](./docs/PERFORMANCE-TOOL-ROADMAP.md)), macOS/Linux, smart clean rules, portable edition, code signing | 🔲 Future |

**Note:** Older docs grouped Firefox/Brave caches with tray, scheduler, and admin mode under “v0.2.” Those ship targets are split above: **privacy and expanded disk junk are v0.2 (current)**; **tray, scheduler, and admin mode move to v0.3.**

Detail: [INITIAL-PROPOSAL.md](./docs/INITIAL-PROPOSAL.md) · Privacy: [SECURITY-PRIVACY-ROADMAP.md](./docs/SECURITY-PRIVACY-ROADMAP.md) · Performance: [PERFORMANCE-TOOL-ROADMAP.md](./docs/PERFORMANCE-TOOL-ROADMAP.md) · Future: [FUTURE-TODO-LIST.md](./docs/FUTURE-TODO-LIST.md)

---

## Launcher Files (Windows)

| File | When |
|------|------|
| **`start.bat`** | First time only — installs Node, Rust, npm packages |
| **`run.bat`** | Daily use — builds release if needed, then launches standalone app |
| **`build.bat`** | Once — builds a real `.exe` you can pin to desktop |
| **`clean.bat`** | Optional — free GBs from `src-tauri\target`. **K** keeps the **release** `allj-cleaner.exe` + `resources\` (needs `build.bat` once first); **F** deletes everything |

## `run.bat` vs `build.bat`

**`run.bat`** = **launch** the app  
**`build.bat`** = **create** the app as a standalone `.exe`

### `run.bat` — daily launcher

- Builds a **release** standalone app if none exists yet (first run takes a few minutes)
- Rebuilds when code changed or the release bundle is incomplete
- Then opens `allj-cleaner.exe` directly (no localhost / dev server)
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

## Version history

### v0.1 (shipped)

- User temp folder scan & clean
- Recycle Bin empty (Windows Shell API)
- Google Chrome & Microsoft Edge cache clean
- Clipboard clear
- Preview with per-category toggles
- Safe path validation (won't touch system folders)
- Partial clean / skipped file reporting
- Detect blocking apps → confirm → force close
- Delete locked files on next reboot
- `start.bat` / `run.bat` / `build.bat` / `clean.bat` launchers

### v0.2 (current)

Everything in v0.1, plus:

- Firefox & Brave browser cache
- Thumbnail cache (Explorer previews; delete-on-reboot if locked)
- App caches: Teams, Discord, Spotify
- **Privacy & sessions** — cookies, history & downloads list, site storage (Chrome, Edge, Brave, Firefox)
- **Secure exit** preset, **Quick clean**, **Misc** (Downloads folder + DNS flush)
- Disk / Privacy / Misc sections, opt-in privacy & misc by default
- **Per-category dependency detection** — Teams/Brave/etc. probed only when that category is selected; running-app badge on select; scoped yeet preflight (no generic pre-scan fallback on clean)
- **Downloads exclude** — confirm modal lists top-level folders/files (A–Z); check items to keep; delete the rest

---

## Project docs

All documentation lives in the [`docs/`](./docs/) folder. This index is maintained per [`.cursor/skills/docs/SKILL.md`](./.cursor/skills/docs/SKILL.md) — use **`/docs`** in chat when adding or updating documentation.

| Document | Contents | Status |
|----------|----------|--------|
| [INITIAL-PROPOSAL.md](./docs/INITIAL-PROPOSAL.md) | Original product proposal, architecture overview, version roadmap v0.1–v0.4 | 📖 Reference |
| [TECH-STACK.md](./docs/TECH-STACK.md) | Full tech stack (Tauri, React, Rust, tooling) and purpose of each component | 📖 Reference |
| [SECURITY-PRIVACY-ROADMAP.md](./docs/SECURITY-PRIVACY-ROADMAP.md) | Privacy & sessions, Secure exit, DNS, Misc, Phase 5 AppData discovery — implementation guide | ✅ Shipped (v0.2) |
| [PERFORMANCE-TOOL-ROADMAP.md](./docs/PERFORMANCE-TOOL-ROADMAP.md) | PI (Performance) menu — startup apps, background apps, outdated apps/drivers | 🔲 Future |
| [FUTURE-TODO-LIST.md](./docs/FUTURE-TODO-LIST.md) | Planned: **Downloads picker** (v0.2.x); shipped: **per-category dependency detection**; unified bookmark, password, and extension managers (post v0.3+) | 🔲 Planned |
| [GITHUB-FIRST-PUSH.md](./docs/GITHUB-FIRST-PUSH.md) | Repo owner: first-time git init and initial push to GitHub | 📖 Reference |
| [GITHUB-TEAM-ONBOARDING.md](./docs/GITHUB-TEAM-ONBOARDING.md) | New teammate: clone, dev setup, pull, branch, commit, first push | 📖 Reference |
| [LICENSE.md](./LICENSE.md) | MIT License — free to use, modify, and distribute | 📖 Reference |

---

## License

EDdys Cleaner is **free** to use, modify, and distribute under the [MIT License](./LICENSE.md).
