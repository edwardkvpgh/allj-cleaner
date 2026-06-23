# PI (Performance) — Roadmap

**Created:** 2026-06-23  
**Last updated:** 2026-06-23  
**Product:** EDdys Cleaner (EDdys Inc)  
**Target release:** Post v0.2 — after disk, privacy, and Phase 5 (AppData discovery)  
**Status:** Planned — not implemented  
**Repo:** [edwardkvpgh/allj-cleaner](https://github.com/edwardkvpgh/allj-cleaner)

**Context:** Users may expect PC Manager–style features (startup apps, outdated software, drivers, background tasks) alongside disk cleanup. This document captures feasibility, scope, and a phased plan for a separate **PI (Performance)** area — distinct from **Disk junk**, **Privacy & sessions**, and **Misc**.

**Reference UI:** Windows PC Manager–style rows with issue counts (e.g. 7 startup apps, 20 background tasks) and expandable detail per category.

---

## Goal

Add an optional **PI (Performance)** menu for **system tune-up suggestions** — without turning EDdys Cleaner into a full PC Manager, driver updater, or antivirus product.

**Positioning:** Advisory tune-up and user-confirmed actions — **not** one-click “fix my PC,” **not** in-app driver installation, **not** a replacement for Windows Update or winget.

### Design principles

1. **Separate from yeet** — PI actions do not use the disk `clean_selected` pipeline; performance ≠ delete files.
2. **Preview before change** — show what will be disabled, closed, or opened externally.
3. **Opt-in per item** — nothing auto-applied; no “fix all 34 issues” without review.
4. **Advisory first** — prefer list + user confirm over automated “unnecessary” judgment.
5. **Extend `process_manager` safely** — reuse protected-process denylist; never kill Shell, Search Indexer, or core Windows services.
6. **Link-out where appropriate** — outdated apps/drivers defer to Windows Update, winget, or Store instead of in-app installers.
7. **Honest limits** — document heuristics; issue counts are suggestions, not guarantees.

---

## Fit with the tool today

| Today (disk / privacy) | PI (Performance) |
|------------------------|------------------|
| File and cache cleanup | System behavior tuning |
| Whitelisted paths (`paths.rs`, `safety.rs`) | Registry, startup, processes, OS policies |
| `process_manager` unlocks files for **clean** | Would **change how Windows runs** |
| Scan → size_bytes → yeet | Scan → **issue counts** → disable / close / open Settings |
| Sections: Disk junk, Privacy, Misc | New top-level section: **PI (Performance)** |

EDdys Cleaner is documented as **disk + privacy hygiene** (`SECURITY-PRIVACY-ROADMAP.md`, `INITIAL-PROPOSAL.md`). PI is a **major scope expansion** — ship only after curated disk junk, privacy flows, and Phase 5 AppData discovery are stable.

---

## Gap checklist

| # | Feature | User benefit | Today | Target phase |
|---|---------|--------------|-------|--------------|
| 1 | **Unnecessary startup apps** | Faster boot, fewer background launches | ❌ | Phase 1 |
| 2 | **Unnecessary background apps** | Free RAM/CPU; fewer locked temp files | ⚠️ Partial *(blocking list for clean only)* | Phase 1 |
| 3 | **Outdated apps** | Security patches, bug fixes | ❌ | Phase 2 *(awareness / link-out)* |
| 4 | **Outdated drivers** | Hardware stability, security | ❌ | Phase 3 *(defer or link-out only)* |

### Intentionally excluded (unless explicitly redesigned)

| Item | Default | Notes |
|------|---------|-------|
| **In-app driver installation** | ❌ Never | High brick risk; admin; support burden |
| **Silent “fix all”** | ❌ Never | User must confirm each category |
| **Antivirus / malware scan** | ❌ Out of scope | Different product category |
| **Registry “cleaner” sweeps** | ❌ Out of scope | High false-positive risk |
| **Killing protected system processes** | ❌ Never | Extend existing `process_manager` protections |
| **PI in Secure exit preset** | ❌ Never | Performance ≠ shared-PC privacy |

---

## Feasibility summary

| PI option | List / scan | Safe one-click fix | Fit for EDdys Cleaner | Suggested PI scope |
|-----------|-------------|--------------------|------------------------|-------------------|
| **Startup apps** | ✅ Moderate | ⚠️ Risky | Medium | Show entries; user disables selected |
| **Background apps** | ✅ Good | ⚠️ Partial | Medium–high | Extend process list; close only on confirm |
| **Outdated apps** | ⚠️ Partial | ❌ Hard | Low | Link to winget / Store / Windows Update |
| **Outdated drivers** | ⚠️ Partial | ❌ Very risky | Very low | Skip or “open Windows Update” only |

---

## Feature analysis

### 1. Unnecessary startup apps — Phase 1

**What it needs**

- Read startup entries: registry `Run` / `RunOnce` (HKCU, HKLM), Startup folder, Task Scheduler, some Store apps.
- Classify “unnecessary” via heuristics or curated guidance (not a universal truth).
- Fix: disable entry (registry value, scheduled task, or deep-link to app settings).

**Feasibility**

| Level | Verdict |
|-------|---------|
| Enumerate + show in UI | ✅ Moderate — standard Windows APIs from Rust |
| User disables selected items | ✅ Feasible with confirmation |
| Auto “fix all 7” without review | ❌ Not recommended |

**Challenges**

- No universal “unnecessary” — disabling wrong entry breaks sync, GPU tools, security software.
- Some entries require administrator rights.
- UX differs from disk categories (issue count, not gigabytes).

**Done when:** User sees startup list with source (registry / folder / task); can disable selected items with clear warning; no silent bulk disable.

---

### 2. Unnecessary background apps — Phase 1

**What it needs**

- List running / background processes (overlap with `process_manager.rs` for temp clean).
- Optional: CPU/RAM heuristics for “heavy” optional apps.
- “Sleep” = end user process, efficiency mode, or open Windows background-app settings — app-specific.

**Feasibility**

| Level | Verdict |
|-------|---------|
| “Apps using resources” advisory list | ✅ High — extend existing process detection |
| “Close optional background apps” on confirm | ⚠️ Moderate — stricter protected-process list |
| True PC Manager “sleep 20 tasks” | ❌ Hard — needs per-app Windows background APIs |

**Challenges**

- Protected list must grow (Shell, Search, Widgets, Phone Link, etc. — see `InterferenceAppList.tsx`).
- Killing Discord/Teams ≠ permanent sleep; apps may restart.
- Issue counts are heuristic unless tied to clear rules (e.g. “non-system process using >X MB RAM”).

**Done when:** PI shows optional background apps with resource hints; user confirms before close; protected processes never offered for termination.

---

### 3. Outdated apps — Phase 2

**What it needs**

- Installed software enumeration (registry `Uninstall` keys, `winget list`, Store apps where possible).
- Version comparison against winget manifests, vendor APIs, or maintained database.
- Update action: download/run installer — network, admin, signing.

**Feasibility**

| Level | Verdict |
|-------|---------|
| “Might be outdated” via winget compare | ⚠️ Moderate — depends on winget availability |
| In-app “Update now” | ❌ Hard — becomes an updater product |
| Match Windows PC Manager depth | ❌ Very hard without large proprietary data |

**Challenges**

- Portable, enterprise, and side-loaded apps missing from registry.
- False “outdated” undermines security messaging.
- Ongoing maintenance (versions change daily).

**Recommended scope:** Read-only or soft advisory — **“Check for updates”** opens winget, Microsoft Store, or **Settings → Windows Update → Advanced options**. No in-app installer in v1.

**Done when:** User sees optional outdated-app hints where winget/registry allows; primary action is link-out; README states limitations.

---

### 4. Outdated drivers — Phase 3 (minimal)

**What it needs**

- Enumerate drivers (WMI `Win32_PnPSignedDriver`, SetupAPI).
- Compare to Windows Update catalog or vendor DB.
- Install driver packages — admin, reboot, hardware risk.

**Feasibility**

| Level | Verdict |
|-------|---------|
| Read-only “driver may be old” | ⚠️ Possible with WMI |
| In-app driver update | ❌ Not recommended for a disk cleaner |
| Safe default | Link to **Settings → Windows Update → Advanced → Optional updates** or Device Manager |

**Challenges**

- Driver updates can brick network/GPU/display; high support liability.
- Competes with Windows Update and OEM utilities.
- Often requires admin and reboot.

**Recommended scope:** **Omit from PI v1** or single row: *“Check optional driver updates in Windows”* with deep link — no in-app install.

**Done when:** Documented limitation or one link-out row; no automated driver deployment.

---

## UI: PI (Performance) menu

PI is **not** another disk-junk collapsible with `size_bytes`. It is a **fourth main area** (after Disk junk, Privacy & sessions, Misc):

```text
Scan results
├── Disk junk          (bytes, yeet)
├── Privacy & sessions (opt-in, secure exit)
├── Misc               (downloads, DNS)
└── PI (Performance)   (issue counts, tune-up actions)
```

| Disk junk | PI (Performance) |
|-----------|-------------------|
| Categories with **size_bytes** | **Issue counts** (e.g. 7, 6, 20) |
| Yeet = delete files | Actions = disable startup, close process, open Update |
| `clean_selected` IPC | New Tauri commands per action type |
| Misc-style opt-in | **All advisory** — nothing selected by default |

**Row pattern (reference):**

| Category | Example copy | Issues |
|----------|--------------|--------|
| Unnecessary startup apps | Turn off background startup apps to reduce boot time. | 7 |
| Outdated apps | Update apps to avoid security risks to your PC. | 7 |
| Outdated drivers | Update drivers to avoid security risks to your PC. | 6 |
| Unnecessary background apps | Put background tasks to sleep for a faster PC. | 20 |

Each row expands to a detail list with per-item toggles and confirm — not a single mega-button.

**Naming:** **PI (Performance)** is acceptable; consider subtitle **“PC tune-up”** so users do not confuse it with disk clean.

---

## Architecture — extend, don’t rebuild

```text
Today                          PI (future)
──────                         ───────────
process_manager.rs  → blockers for clean   + optional background / resource list
paths.rs / cleaner  → file delete          + unchanged for PI
App.tsx             → 3 scan sections        + PI (Performance) section + new modals
lib.rs              → scan_all, clean_*     + startup_scan, disable_startup, list_background, …
```

### Action types in the engine

| Type | Examples | How it works |
|------|----------|--------------|
| **Enumerate** | Startup entries, processes, installed apps | Rust scan → JSON to UI |
| **User confirm + mutate** | Disable startup, close optional process | Tauri command with explicit IDs |
| **Link-out** | Windows Update, winget, Device Manager | `opener` plugin or `explorer` / `start ms-settings:` |

---

## Phased delivery

> **Prerequisite:** Complete `SECURITY-PRIVACY-ROADMAP.md` Phase 5 (AppData discovery) before starting PI Phase 1.

### Phase 1 — Startup + background apps — P0

| Feature | Handling |
|---------|----------|
| **Startup apps** | Scan registry / Startup folder / selected tasks; list with source; disable on confirm |
| **Background apps** | Extend `process_manager`; resource hints; close on confirm; protected denylist |

**Done when:** PI section shows two expandable categories; no auto-fix; no protected process kills.

---

### Phase 2 — Outdated apps (awareness) — P1

| Feature | Handling |
|---------|----------|
| **Outdated apps** | winget/registry compare where possible; link-out to update; no in-app installer |

**Done when:** Advisory list or “check updates” action; README documents false-negative/positive cases.

---

### Phase 3 — Drivers (minimal) — P2

| Feature | Handling |
|---------|----------|
| **Outdated drivers** | Omit **or** single “Open optional driver updates in Windows” link |

**Done when:** No in-app driver install; limitation documented.

---

### Phase 4 (Final) — Polish — P3

| Feature | Handling |
|---------|----------|
| **Issue count tuning** | Document heuristics; avoid scary inflated numbers |
| **Settings integration** | Optional defaults (e.g. hide PI section) |
| **Telemetry-free** | No cloud “PC health score” unless preferences sync is explicitly designed |

---

## Known limitations (document in README)

- **PI ≠ disk clean** — disabling startup does not free space shown in Disk junk.
- **“Unnecessary” is heuristic** — user judgment required; false positives possible.
- **Outdated app/driver detection** is incomplete without enterprise-scale update databases.
- **Background “sleep”** may not persist; apps can restart automatically.
- **Not a substitute** for Windows Security, OEM update tools, or professional IT policy.

---

## Manual test checklist

### Phase 1

- [ ] PI section visible after scan; separate from Disk junk / Privacy / Misc
- [ ] Startup list matches Task Manager → Startup (spot-check)
- [ ] Disabling a startup entry requires confirmation; undo path documented or reversible where possible
- [ ] Background list never offers Shell Experience Host, Search Indexer, or other protected processes
- [ ] Closing an optional app from PI does not break disk yeet flow

### Phase 2

- [ ] Outdated-app hints do not crash when winget is missing
- [ ] Link-out opens correct Windows Update / Store / winget surface
- [ ] No in-app silent upgrades

### Phase 3

- [ ] Driver row is link-out only or hidden; no driver package download from EDdys Cleaner

---

## Files likely to change

| Area | Files |
|------|-------|
| Startup scan / disable | `src-tauri/src/startup.rs` *(new)* |
| Background / resources | `src-tauri/src/process_manager.rs` |
| IPC | `src-tauri/src/lib.rs` |
| PI UI section | `src/App.tsx`, `src/components/PerformanceSection.tsx` *(new)*, row/detail components |
| Types | `src/types.ts` |
| Protected process copy | `src/components/InterferenceAppList.tsx` |
| Docs | `README.md`, `docs/INITIAL-PROPOSAL.md` |

---

## What NOT to do in PI v1

- In-app driver installation or silent driver downloads
- “Fix all issues” without per-category review
- Auto-disable startup entries on first scan
- Market as antivirus or “full PC optimization suite”
- Merge PI actions into Secure exit or default disk yeet
- Registry-wide “cleaner” sweeps

---

## Product recommendation

| Approach | Recommendation |
|----------|----------------|
| **Full Windows PC Manager clone** (all four with auto-fix) | **Not feasible** for a small team without becoming a different product |
| **PI as advisory menu** | **Feasible** as post–Phase 5 work — startup + background first |
| **Outdated apps** | Phase 2 — link-out only |
| **Outdated drivers** | Phase 3 — omit or Windows Update link only |

**Practical PI v1 ship set:**

1. Startup apps — scan + disable with confirmation  
2. Background apps — optional close list (extend `process_manager`)  
3. Outdated apps — “Check updates” → winget / Windows Update  
4. Drivers — omit or single Windows Update link  

---

## References

- Disk / privacy scope: `docs/SECURITY-PRIVACY-ROADMAP.md`
- Architecture baseline: `docs/INITIAL-PROPOSAL.md`
- Process detection today: `src-tauri/src/process_manager.rs`
- Protected process UX: `src/components/InterferenceAppList.tsx`
- Tech stack: `docs/TECH-STACK.md`

---

## Session kickoff commands

| Phase | Say in chat |
|-------|-------------|
| Phase 1 | *“Implement PERFORMANCE-TOOL-ROADMAP Phase 1 — PI startup apps + background apps UI and backend.”* |
| Phase 2 | *“Implement PERFORMANCE-TOOL-ROADMAP Phase 2 — outdated apps awareness + link-out.”* |
| Phase 3 | *“Implement PERFORMANCE-TOOL-ROADMAP Phase 3 — drivers link-out or documented skip.”* |
| Phase 4 (Final) | *“Implement PERFORMANCE-TOOL-ROADMAP Phase 4 — PI polish and README limitations.”* |

---

*Reviewed 2026-06-23 — feasibility, phased plan, and separation from disk/privacy yeet flow incorporated.*
