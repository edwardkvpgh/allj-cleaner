# EDdys Cleaner — Project Proposal

A standalone desktop application for scanning and cleaning browser caches, OS temporary files, and other reclaimable disk space on Windows (with optional cross-platform expansion later).

**Current release:** MVP v0.1

---

## Executive Summary

**EDdys Cleaner** is a system cleanup utility that helps users free disk space by safely removing temporary and cache files from browsers, the operating system, and common applications.

**Approach:** Standalone desktop application — not a browser-only web app. Cleaning system and browser caches requires deep filesystem access and, for some operations, elevated permissions that a web browser cannot provide.

**Stack:** **Tauri 2 + React + TypeScript + Rust**

---

## Problem Statement

Over time, computers accumulate large amounts of temporary data:

- Browser caches (Chrome, Edge, Firefox, Brave, etc.)
- OS temp folders (`%TEMP%`, `C:\Windows\Temp`)
- Thumbnail and icon caches
- Application caches (Teams, Discord, Spotify, etc.)
- Recycle Bin contents
- Optional advanced items (Windows Update cache, old logs) requiring admin rights

Users need a **safe, transparent tool** that shows what will be deleted, how much space will be freed, and lets them choose what to clean.

---

## Web App vs Standalone

| Approach | Suitability | Notes |
|----------|-------------|-------|
| **Browser-only web app** | Not suitable | Sandboxed; cannot access browser profile folders, system temp paths, or elevated locations |
| **Standalone desktop app** | **Recommended** | Full filesystem access, UAC elevation when needed, tray icon, scheduling, offline use |
| **Hybrid (local agent + web UI)** | Possible but unnecessary | Adds complexity; a desktop shell with embedded UI is simpler |

**Conclusion:** A standalone desktop app is the correct architecture for this requirement.

---

## Technology Stack

### Primary (chosen)

| Layer | Technology | Purpose |
|-------|------------|---------|
| **UI Framework** | React 18+ | Component-based scan/clean interface |
| **Language (frontend)** | TypeScript | Type safety, maintainability |
| **Styling** | Tailwind CSS | Modern, consistent Gen Z aesthetic |
| **Motion** | Framer Motion | Animations and transitions |
| **Icons** | Lucide React | UI icons |
| **Desktop shell** | Tauri 2 | Native window, small binary, system integration |
| **Core engine** | Rust | Fast parallel scanning, safe file operations |
| **IPC** | Tauri commands / events | Bridge between UI and Rust backend |
| **Packaging** | Tauri bundler | `.msi` / `.exe` Windows installer |
| **Windows APIs** | windows-sys | Restart Manager, recycle bin, delete-on-reboot |

### Alternative stacks (not used)

| Stack | Best for |
|-------|----------|
| **C# .NET 8 + WinUI 3** | Windows-only, deep OS integration |
| **Electron + TypeScript** | Fastest JS-only MVP; larger install size |

---

## Application Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Desktop UI (React)                    │
│  Dashboard · Scan Results · Category Toggles · Logs   │
└─────────────────────────┬───────────────────────────────┘
                          │ Tauri IPC
┌─────────────────────────▼───────────────────────────────┐
│                   Rust Core Engine                       │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Scanner  │→ │ Safety Filter │→ │ Delete Engine    │  │
│  └──────────┘  └──────────────┘  └──────────────────┘  │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Path     │  │ Process      │  │ Recycle Bin      │  │
│  │ Registry │  │ Manager      │  │ (Shell API)      │  │
│  └──────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│              Filesystem (Windows paths)                  │
└─────────────────────────────────────────────────────────┘
```

### Core modules

| Module | File | Role |
|--------|------|------|
| Path registry | `paths.rs` | Known cache/temp locations per browser and OS |
| Scanner | `scanner.rs` | Parallel directory walk, size aggregation |
| Safety filter | `safety.rs` | Whitelist paths; block system-critical dirs |
| Cleaner | `cleaner.rs` | Safe deletion, before/after stats |
| Recycle Bin | `recycle_bin.rs` | Windows Shell API scan & empty |
| Process manager | `process_manager.rs` | Detect & force-close blocking apps |
| Reboot delete | `reboot_delete.rs` | Queue locked files for delete on restart |

---

## Development Roadmap

### Version 0.1 — MVP (current)

**Status: shipped**

| Feature | Status |
|---------|--------|
| Tauri 2 + React + TypeScript scaffold | ✅ Done |
| User temp folder scan & clean | ✅ Done |
| Recycle Bin scan & empty (Shell API) | ✅ Done |
| Google Chrome cache clean | ✅ Done |
| Microsoft Edge cache clean | ✅ Done |
| Scan → preview → selective clean UI | ✅ Done |
| Gen Z trendy dark UI | ✅ Done |
| Safe path validation | ✅ Done |
| Before/after clean stats | ✅ Done |
| Partial clean reporting (skipped locked files) | ✅ Done |
| Delete locked files on next reboot | ✅ Done |
| Detect blocking apps + user confirmation + force close | ✅ Done |
| `start.bat` / `run.bat` / `build.bat` launchers | ✅ Done |
| Windows `.exe` / installer build | ✅ Done |

### Version 0.2 — Enhanced

**Status: planned**

| Feature | Status |
|---------|--------|
| Firefox cache clean | ✅ Shipped |
| Brave cache clean | ✅ Shipped |
| Thumbnail cache clean | ✅ Shipped |
| Common app caches (Teams, Discord, Spotify) | ✅ Shipped |

### Version 0.3 — Pending (Optional)

**Status: pending / optional**

| Feature | Status |
|---------|--------|
| System tray icon | 🔲 Planned |
| Scheduled automatic cleaning | 🔲 Planned |
| Admin-mode for Windows system caches | 🔲 Planned |
| Settings: exclusions, defaults, Recycle Bin preference | 🔲 Planned |
| Expandable error log in UI | 🔲 Planned |

### Version 0.4 — Pending (future)

**Status: optional / future**

| Feature | Status |
|---------|--------|
| macOS support via Tauri | 🔲 Future |
| Linux support via Tauri | 🔲 Future |
| “Smart clean” rules (e.g. files older than 30 days) | 🔲 Future |
| Cloud sync of **preferences only** (not user files) | 🔲 Future |
| Portable (no-install) edition | 🔲 Future |
| Code signing for distribution | 🔲 Future |

---

## Scan Categories

### MVP (v0.1)

| Category | Examples | Admin required |
|----------|----------|----------------|
| User temp | `%TEMP%`, `%LOCALAPPDATA%\Temp` | No |
| Recycle Bin | All drives | No |
| Chrome cache | Cache, Code Cache, GPUCache (all profiles) | No |
| Edge cache | Cache, Code Cache, GPUCache (all profiles) | No |

### Planned (v0.2+)

| Category | Examples | Admin required |
|----------|----------|----------------|
| System temp | `C:\Windows\Temp` | Often yes |
| Thumbnail cache | `thumbcache_*.db` | No |
| Firefox / Brave cache | Browser profile caches | No |
| App caches | Teams, Discord, Spotify | No |
| Windows Update cache | `SoftwareDistribution\Download` | Yes |

---

## User-Facing Capabilities

### MVP

- **Scan** — Discover cleanable items without deleting
- **Preview** — File count and size per category
- **Selective clean** — Toggle categories on/off
- **Honest results** — Full / partial / failed clean banners
- **Blocking app detection** — Modal with app list before force close
- **Space summary** — Total junk found with per-category breakdown

### Safety requirements

- Never delete without explicit user confirmation
- Never touch `System32`, user Documents, or protected system paths
- Queue locked files for reboot instead of failing silently
- Never force-close system processes (Explorer, svchost, etc.)
- Request admin elevation only when required (v0.2+)

---

## Project Structure

```
EDdys-Cleaner/
├── src/                    # React frontend
│   ├── components/         # UI components, modals
│   ├── types.ts
│   └── utils/
├── src-tauri/              # Rust backend
│   └── src/
│       ├── scanner.rs
│       ├── cleaner.rs
│       ├── paths.rs
│       ├── safety.rs
│       ├── recycle_bin.rs
│       ├── process_manager.rs
│       └── reboot_delete.rs
├── start.bat               # First-time setup + launch
├── run.bat                 # Daily launcher
├── build.bat               # Build standalone .exe
├── PROPOSAL.md             # This document
├── README.md               # User guide
└── LICENSE.md              # MIT License
```

---

## Non-Goals

- Registry cleaning (high risk)
- Driver / DLL cleanup
- One-click clean without preview
- Cloud-hosted web dashboard
- Cleaning network drives without explicit user selection

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Accidental deletion | Preview + safety filter + user confirmation |
| Browser data loss | Only target cache folders; never touch passwords/bookmarks |
| Files in use | Retry, skip, queue for reboot, offer app force-close |
| False “clean” message | Before/after scan diff; partial success UI |
| Unsigned binary blocked | Code signing in v0.3 |

---

## Success Criteria

| Criteria | MVP target |
|----------|------------|
| Accurate size estimates per category | ✅ |
| Selective clean without data loss | ✅ |
| Runs on Windows 10/11 without admin (standard ops) | ✅ |
| Installer size under 20 MB | ✅ Target |
| Scan completes in under 60 seconds (typical PC) | ✅ |

---

## Summary

| Decision | Choice |
|----------|--------|
| **Product type** | Standalone desktop application |
| **Primary stack** | Tauri 2 + React + TypeScript + Rust |
| **Target OS (v0.1)** | Windows 10 / 11 |
| **Current version** | MVP v0.1 |
| **License** | MIT (free) |

---

*Document version: 2.0 — restored and updated to reflect shipped MVP*
