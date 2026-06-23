# EDdys Cleaner — Tech Stack

**Product:** EDdys Cleaner (ALLJ-Cleaner)  
**Platform:** Windows 10 / 11 desktop  
**Architecture:** Tauri 2 hybrid app — React UI + Rust system engine

This document lists the technologies used to build the application and what each one is responsible for.

---

## Architecture at a glance

```text
┌─────────────────────────────────────────────────────────┐
│  React UI (TypeScript)                                  │
│  Vite · Tailwind · Framer Motion · Lucide               │
│  invoke() → Tauri commands                              │
└──────────────────────────┬──────────────────────────────┘
                           │ IPC (Tauri 2)
┌──────────────────────────▼──────────────────────────────┐
│  Rust backend (src-tauri/)                              │
│  Scan · clean · process control · Windows APIs          │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│  Windows OS — filesystem, Shell, clipboard, DNS, etc.   │
└─────────────────────────────────────────────────────────┘
```

The UI never touches the filesystem directly. All scan/clean work runs in Rust and is exposed to the frontend through typed Tauri commands.

---

## Desktop shell

| Technology | Version | Purpose |
|------------|---------|---------|
| **Tauri** | 2.x | Wraps the web UI in a native Windows window, bundles the app, and provides secure IPC between frontend and Rust. |
| **@tauri-apps/api** | 2.x | Frontend SDK — `invoke()` for Rust commands, window APIs for the custom title bar (drag, minimize, maximize, close). |
| **@tauri-apps/cli** | 2.x | Dev and release tooling (`tauri dev`, `tauri build`). |
| **tauri-plugin-opener** | 2.x | Opens external URLs/files in the user’s default app when needed. |
| **Microsoft WebView2** | (runtime) | Renders the React UI inside the native window. Usually pre-installed on Windows 10/11; required for the packaged `.exe`. |

**Why Tauri (vs Electron):** Smaller binaries, Rust for performance-sensitive file work, and a clear boundary between UI and system code.

---

## Frontend (UI layer)

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.x | Component-based UI — scan results, category cards, modals (quick clean, secure exit, blocking apps), footer actions. |
| **TypeScript** | 5.8.x | Static typing for categories, clean results, app phases, and Tauri command payloads. |
| **Vite** | 7.x | Fast dev server (port `1420`), production bundling, HMR during `tauri dev`. |
| **@vitejs/plugin-react** | 4.x | JSX/TSX transform and React Fast Refresh. |
| **Tailwind CSS** | 3.4.x | Utility-first styling — dark theme, neon accents, glass cards, responsive layout. |
| **PostCSS** | 8.x | CSS pipeline for Tailwind. |
| **Autoprefixer** | 10.x | Vendor prefixes for broader CSS compatibility. |
| **Framer Motion** | 12.x | Screen transitions, button micro-interactions, category card entrance animations. |
| **lucide-react** | 0.54x | Icon set (scan, trash, shield, expand/collapse, window controls, etc.). |

### Fonts (Google Fonts)

| Font | Role |
|------|------|
| **Outfit** | Display headings, buttons, section labels |
| **Space Grotesk** | Body text and numeric values in size summaries |

Loaded in `index.html`; mapped in `tailwind.config.js` as `font-display` and `font-body`.

### Key frontend modules

| Path | Purpose |
|------|---------|
| `src/App.tsx` | Main flow: scan → results → clean, section state, modals |
| `src/utils/categories.ts` | Disk / privacy / misc partitioning, selection helpers, secure-exit preset |
| `src/utils/clean.ts` | Post-clean banner messaging |
| `src/components/*` | Reusable UI — `CategoryCard`, `CollapsibleScanSection`, modals, custom `WindowTitleBar` |

---

## Backend (Rust engine)

| Technology | Version | Purpose |
|------------|---------|---------|
| **Rust** | 2021 edition | Core cleaner — filesystem scan/delete, Windows integration, safety checks. |
| **serde** | 1.x | Serialize/deserialize structs sent to the UI (`ScanCategory`, `CleanResult`, etc.). |
| **serde_json** | 1.x | JSON support for Serde (Tauri IPC payloads). |
| **walkdir** | 2.x | Recursive directory walking for size/file-count scans. |
| **dirs** | 6.x | Resolve standard Windows user paths (`%TEMP%`, `%USERPROFILE%`, browser profile roots). |
| **windows-sys** | 0.59 | Low-level Windows API bindings — file system, Restart Manager, clipboard, window messages. |

### Rust modules (`src-tauri/src/`)

| Module | Purpose |
|--------|---------|
| `lib.rs` | Tauri app entry, `scan_all` / `clean_selected` commands, category availability rules |
| `paths.rs` | Category definitions, path resolvers (Chrome, Edge, Firefox, Brave, Downloads, etc.) |
| `scanner.rs` | Walk paths and aggregate `size_bytes` + `file_count` |
| `cleaner.rs` | Delete selected categories, partial-clean reporting, special actions (DNS) |
| `safety.rs` | Denylist / path guards so cleaning never targets system-critical locations |
| `process_manager.rs` | Detect locking apps (browsers, Teams, etc.), Restart Manager, optional force-close |
| `recycle_bin.rs` | Empty Recycle Bin via Windows Shell API |
| `clipboard.rs` | Clear clipboard / Win+V history where possible |
| `system_clean.rs` | DNS flush via `ipconfig /flushdns` (no admin for standard user cache) |
| `reboot_delete.rs` | Queue locked files (e.g. thumbnail cache) for delete on next restart |
| `single_instance.rs` | Prevent multiple app instances |
| `models.rs` | Shared structs: `ScanCategory`, `CleanResult`, `LockingApp`, … |

### Tauri commands (IPC surface)

| Command | Purpose |
|---------|---------|
| `scan_all` | Scan every category; return sizes and availability |
| `clean_selected` | Delete/action on user-selected category IDs |
| `get_pre_scan_apps` | Apps that may interfere before a scan |
| `get_locking_apps` / `get_interference_apps` | Apps blocking clean targets |
| `force_close_apps` | Close selected processes before retrying clean |

---

## Build, packaging & dev tooling

| Tool | Purpose |
|------|---------|
| **Node.js** | Runs npm scripts, Vite, and Tauri CLI |
| **npm** | Dependency management (`package.json`, `package-lock.json`) |
| **Cargo** | Rust dependency management and compilation (`Cargo.toml`, `Cargo.lock`) |
| **Visual Studio C++ Build Tools** | Required on Windows to compile Rust/Tauri native code (first-time setup) |
| **NSIS** (via Tauri bundle) | Produces `EDdys Cleaner_*_x64-setup.exe` Windows installer |
| **WiX / MSI** (optional Tauri target) | Alternative Windows installer format when enabled |

### npm scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite dev server only |
| `npm run build` | Typecheck + production frontend build → `dist/` |
| `npm run tauri dev` | Full app in development (Vite + Rust, hot reload on UI) |
| `npm run tauri build` | Release binary + Windows installer |

### Project config files

| File | Purpose |
|------|---------|
| `tauri.conf.json` | Window size, frameless custom title bar, bundle icons, build hooks |
| `vite.config.ts` | Port `1420`, Tauri-friendly HMR, ignore `src-tauri` from file watcher |
| `tailwind.config.js` | Theme colors (`void`, `neon-*`), fonts, custom shadows/animations |
| `tsconfig.json` | TypeScript compiler options |

---

## Windows integration summary

| Area | How it’s implemented |
|------|----------------------|
| **User temp / app caches** | `walkdir` + path rules in `paths.rs` |
| **Recycle Bin** | Shell API (`recycle_bin.rs`) |
| **Browser data** | Profile path detection + file deletion (Chromium + Firefox) |
| **Clipboard** | Win32 clipboard APIs (`clipboard.rs`) |
| **DNS cache** | `ipconfig /flushdns` subprocess (`system_clean.rs`) |
| **Locked files** | Restart Manager + delete-on-reboot queue |
| **Blocking apps** | Process enumeration + optional force-close |

---

## What we intentionally do *not* use

| Omitted | Reason |
|---------|--------|
| **Electron** | Tauri chosen for smaller footprint and Rust backend |
| **Database (SQLite, etc.)** | No persistent user data store; scan results live in memory |
| **Cloud / backend API** | Fully offline, local-only cleaner |
| **Antivirus / kernel drivers** | User-mode file cleanup only |

---

## Related docs

| Document | Contents |
|----------|----------|
| [README.md](../README.md) | User-facing features and run instructions |
| [INITIAL-PROPOSAL.md](./INITIAL-PROPOSAL.md) | Original product proposal and roadmap |
| [SECURITY-PRIVACY-ROADMAP.md](./SECURITY-PRIVACY-ROADMAP.md) | Privacy categories and phased implementation |
| [GITHUB-FIRST-PUSH.md](./GITHUB-FIRST-PUSH.md) | Repo setup and git workflow |

---

*Last updated for v0.2 (privacy preview). Package version in `package.json` / `Cargo.toml` may still read `0.1.0` until the next formal release bump.*
