# Security & Privacy Cleanup — Roadmap (v0.2)

**Created:** 2026-06-22  
**Last updated:** 2026-06-23 (Phase 5 — AppData discovery added)  
**Product:** EDdys Cleaner (EDdys Inc)  
**Target release:** v0.2 — Privacy & security cleanup  
**Status:** Phase 1–4 implemented — Phase 5 (Final) planned  
**Repo:** [edwardkvpgh/allj-cleaner](https://github.com/edwardkvpgh/allj-cleaner)

**Context:** v0.1 covers disk junk (user temp, recycle bin, Chrome/Edge cache, clipboard). It does **not** cover the browsing traces users expect when securing a shared PC or improving privacy after a session. This document is the implementation guide for v0.2 privacy work and aligns with `PROPOSAL.md` v0.2.

---

## Goal

Add optional, user-controlled cleanup for **browser session & privacy data** — without turning EDdys Cleaner into a reckless “wipe everything” tool.

**Positioning:** Privacy hygiene for shared PCs and disk cleanup — **not** antivirus, **not** a full security suite, **not** a replacement for incognito mode or disk encryption.

### Design principles

1. **Preview before delete** — same trust model as existing categories.
2. **Opt-in per category** — user picks what to clear.
3. **Browser must be closed** — scoped per-category dependency checks (only the relevant browser or app for selected rows); blocking-app modal or advisory before yeet.
4. **Safe paths only** — whitelist known profile locations; never touch unrelated user files.
5. **Hard denylist** — never delete password, bookmark, or extension data (enforced in `safety.rs`, not UI alone).
6. **Saved passwords stay off** — no password-clear category in v1; defer “advanced” toggle until explicit design review.
7. **No shell kills** — never force-close Shell Experience Host, Search Indexer, or other protected system processes.

---

## Gap checklist

| # | Gap | Why it matters | v0.1 | Target phase |
|---|-----|----------------|------|--------------|
| 1 | **Cookies** | Active login sessions survive cache-only cleanup | ❌ | Phase 1 |
| 2 | **Browsing history** | URLs visited remain visible in browser | ❌ | Phase 1 |
| 3 | **Download history (browser)** | Browser still lists what was downloaded | ❌ | Phase 1 *(same DB as history)* |
| 4 | **Local storage / IndexedDB** | Site data persists after cache clear | ❌ | Phase 1 |
| 5 | **Kill sessions / shared PC exit** | Cache clear ≠ signed out | ❌ | Phase 2 (Secure exit preset) |
| 6 | **DNS cache flush** | Recent domain lookups at OS level | ❌ | Phase 2 |
| 7 | **Windows thumbnail cache** | Visual traces of files/images | ❌ | Phase 3 ✅ |
| 8 | **Downloads folder** | Actual downloaded files on disk | ❌ | Phase 4 (optional, off by default) |
| 9 | **Firefox / Brave privacy** | Other browsers leave traces | ❌ | Phase 4 |
| 10 | **Windows prefetch** | App launch traces | ❌ | Phase 5 (admin mode) |
| 11 | **Discovered large AppData folders** | Reclaim space from unknown apps without a curated rule | ❌ | Phase 5 (opt-in discovery) |

### Intentionally excluded (all phases unless explicitly redesigned)

| Item | Default | Notes |
|------|---------|-------|
| **Saved passwords** (`Login Data`) | ❌ Never clear | Hard denylist in `safety.rs` |
| **Autofill / cards** (`Web Data`) | ❌ Never clear | Hard denylist |
| **Bookmarks** | ❌ Never clear | User data, not junk |
| **Extensions** | ❌ Never clear | Out of scope for v0.2 |
| **Prefetch** | ❌ Skip | Needs admin; low browsing-privacy value |

---

## Resolved decisions

| Question | Decision |
|----------|----------|
| Mega-category vs separate toggles? | **Separate toggles** in scan UI + **Secure exit** preset that selects the bundle |
| Firefox on day one? | **No** — Chrome + Edge first; Firefox in Phase 4 |
| Downloads folder? | **Optional category**, unchecked by default, **never** in Secure exit preset |
| Prefetch? | **Skip** until admin mode exists (`PROPOSAL.md` v0.2) |
| Download history vs browsing history? | **One backend** (`History` SQLite); UI may label “History & downloads list” honestly |
| Brave? | Phase 4 — reuse Chromium path logic |

---

## Architecture — extend, don’t rebuild

```text
Today                          v0.2
──────                         ────
paths.rs     → categories      + privacy category IDs + path resolvers
scanner.rs   → size/count      + same (folders + SQLite file sizes)
cleaner.rs   → delete files    + same + special actions (DNS)
safety.rs    → whitelist       + hard denylist (Login Data, Web Data, …)
process_manager → blockers     + require browser closed for privacy categories
recycle_bin / clipboard        + unchanged (special category pattern)
reboot_delete.rs               + thumbnail cache when Explorer locks files
App.tsx      → scan/yeet UI    + Privacy + Misc sections + Secure exit preset
```

### Category types in the engine

| Type | Examples | How it works |
|------|----------|--------------|
| **Path-based** | Cookies, history DB, Local Storage | Scan/clean whitelisted files/folders per profile |
| **Action-based** | DNS flush | Tauri command (`ipconfig /flushdns`); report in clean summary |
| **Special** (existing) | Recycle Bin, Clipboard | Keep dedicated modules in `recycle_bin.rs`, `clipboard.rs` |

---

## Phased delivery

> **Scope note:** All phases below are unlikely to fit in a single day. Implement and ship phase by phase.

### Phase 1 — Core browser privacy (Chrome + Edge) — P0 ✅ Shipped

**User-facing categories**

| UI category | Clears | Chromium paths (per profile under `User Data`) |
|-------------|--------|------------------------------------------------|
| Chrome — cookies & sessions | Site logins | `Cookies`, `Network\Cookies` |
| Chrome — history & downloads list | URLs + download metadata | `History`, `Top Sites`, `Visited Links`, `Favicons` (optional) |
| Chrome — site storage | Local site data | `Local Storage\`, `IndexedDB\`, `Session Storage\` |
| Edge — (same three) | Same | Under `%LocalAppData%\Microsoft\Edge\User Data\` |
| Chrome cache / Edge cache | *(existing v0.1)* | Unchanged |
| Clipboard | *(existing v0.1)* | Unchanged |

**Also clear for shared-PC exit (Phase 1 backend, preset in Phase 2):**

- `Sessions\`, `Last Session`, `Last Tabs`, `Current Session`, `Current Tabs` — prevents tabs restoring after “secure exit”

**Implementation steps**

1. Extend `paths.rs` with privacy category IDs and profile walkers (reuse `browser_cache_paths()` iteration pattern).
2. Extend `safety.rs` with hard denylist (see below).
3. Wire scan/clean through existing `scanner.rs` / `cleaner.rs`.
4. Trigger blocking-app flow when Chrome/Edge privacy categories are selected.
5. Add **“Privacy & sessions”** UI section in scan results (separate from “Disk junk”).
6. Per-category warnings: *“You will be signed out of websites.”*

**Done when:** Browser closed → cookies/history/storage gone; passwords still work; partial clean when browser open.

---

### Phase 2 — Secure exit preset + DNS — P0 ✅ Shipped

**Secure exit preset** — one-click selection of **Privacy & sessions** categories only:

- [x] Chrome cookies & sessions (all profiles)
- [x] Chrome history & downloads list
- [x] Chrome site storage
- [x] Edge — same three
- [x] Brave — same three *(when installed; Phase 4)*
- [x] Firefox — same three *(when installed; Phase 4)*
- [x] Session restore files (`Sessions\`, etc.) — cleaned with cookies/sessions
- [ ] Downloads folder — **Misc** section; never included
- [ ] DNS cache flush — **Misc** section; never included

**Banner before yeet:**  
*“You will be signed out of websites. Saved passwords, bookmarks, and extensions are not removed.”*

**DNS flush**

- New module: `src-tauri/src/system_clean.rs` (or similar)
- Command: `ipconfig /flushdns` (no admin for standard user DNS client cache)
- Surfaces success/failure in clean summary banner

**UX flow**

```text
Scan → "Secure exit" → review selections → yeet
              ↓
   blocking apps modal (if Chrome/Edge open)
              ↓
        clean + results banner
```

---

### Phase 3 — Thumbnail cache — P1 ✅ Shipped

- [x] **Paths:** `%LocalAppData%\Microsoft\Windows\Explorer\thumbcache_*.db`, `iconcache_*.db`
- [x] **Locks:** Explorer may hold files — existing `reboot_delete.rs` delete-on-reboot fallback
- [x] **Warning:** *“Thumbnails will rebuild; you may need to restart File Explorer.”*
- [x] **Never** force-close Shell Experience Host (Explorer remains protected in `process_manager.rs`)
- [x] **UI:** Disk junk section — not in Secure exit preset

---

### Phase 4 — Downloads + Brave/Firefox privacy — P2 ✅ Shipped

| Feature | Handling |
|---------|----------|
| **Downloads folder** | `%USERPROFILE%\Downloads` — optional toggle, extra confirmation modal (file count + size) |
| **Brave privacy categories** | Add **Brave cookies & sessions**, **Brave history & downloads list**, **Brave site storage** (reuse Chromium privacy path logic) |
| **Firefox privacy categories** | Add profile mapping via `profiles.ini`, then clear `cookies.sqlite`, `places.sqlite`, and `storage\` |

### Phase 5 (Final) — Deferred / advanced — P3

| Feature | Handling |
|---------|----------|
| **Discovered large folders in AppData** | Opt-in discovery scan — see below |
| **WebView2** | Document as known limitation or add later category for embedded app profiles |
| **Prefetch** | Defer to admin-mode milestone |

**Discovered large folders in AppData** *(opt-in discovery — not curated per-app rules)*

Heuristic scan of `%LOCALAPPDATA%` and `%APPDATA%` for **large folders** that look reclaimable (e.g. named `Cache`, `Code Cache`, `GPUCache`, `temp`, `logs`) — surfaced as **individual toggles**, not one mega-delete.

| Rule | Decision |
|------|----------|
| **UI placement** | New subsection under **Disk junk** (e.g. *“Discovered app data”*) or separate collapsible block — **never** in Secure exit |
| **Default** | **Nothing selected** — user must opt in per folder |
| **Threshold** | Only show folders above a minimum size (e.g. 50–100 MB; tune in implementation) |
| **Safety** | Reuse `safety.rs` denylist; never delete `Login Data`, bookmarks, extensions, or whole profile roots |
| **Scope** | Report size + path label; no delete without explicit per-folder toggle |
| **Not a substitute for** | Curated categories (Chrome, Teams, Discord, etc.) — those stay explicit in Phase 1–4 |

**Why Phase 5 (not earlier):** Broad AppData heuristics are higher risk and harder to explain than whitelist paths. Ship only after curated disk junk + privacy flows are stable.

**Done when:** Scan lists large discoverable folders with sizes; user can select and yeet individually; denylist blocks sensitive paths; README documents limitations.

---

## Hard denylist (`safety.rs`)

These paths/files must **never** be scanned or deleted, even if a bug mislabels a category:

| Path / file | Contains |
|-------------|----------|
| `Login Data` | Saved passwords |
| `Web Data` | Autofill, payment methods |
| `Account Web Data` | Account tokens |
| `Bookmarks` / `Bookmarks.bak` | Bookmarks |
| `Extensions\` | Installed extensions |
| `Preferences` | *(evaluate — may hold session prefs; do not delete whole file in v1)* |

---

## Technical notes per category

### Cookies (Chrome / Edge)

- **Paths:** `<Profile>\Cookies` and `<Profile>\Network\Cookies` (scan **both** — Chrome version dependent)
- **Caveat:** SQLite locked while browser open → blocking-app flow
- **Done when:** User logged out of sites after clean + browser restart

### Browsing history & download list

- **Paths:** `<Profile>\History` (single SQLite DB for URLs and download metadata)
- **UX:** One toggle — *“History & downloads list”* — honest about shared backend
- **Optional extras:** `Top Sites`, `Visited Links`, `Favicons`
- **Done when:** `chrome://history` and `chrome://downloads` empty after clean

### Site storage

- **Paths:** `<Profile>\Local Storage\`, `IndexedDB\`, `Session Storage\`
- **Done when:** Site data dirs removed per profile

### Session restore

- **Paths:** `<Profile>\Sessions\`, `Last Session`, `Last Tabs`, `Current Session`, `Current Tabs`
- **Why:** Without this, “secure exit” may reopen tabs on next browser launch
- **Include in:** Secure exit preset (Phase 2)

### Downloads folder

- **Path:** `%USERPROFILE%\Downloads`
- **Risk:** User documents, installers, work files
- **Rules:** Unchecked by default; never in Secure exit; confirmation modal required

### DNS cache

- **Action:** `ipconfig /flushdns`
- **Category type:** Action-based (not folder scan)

### Thumbnail cache

- **Paths:** Explorer `thumbcache_*.db`, `iconcache_*.db`
- **Caveat:** Explorer locks — reboot delete fallback; no Shell Experience kill

### Prefetch (deferred)

- **Path:** `C:\Windows\Prefetch\`
- **Caveat:** Admin; system-wide; low value for browsing privacy

### Discovered large folders in AppData (Phase 5)

- **Paths:** Walk `%LOCALAPPDATA%` and `%APPDATA%` under per-app subfolders; match conservative folder-name heuristics (`Cache`, `Code Cache`, `GPUCache`, `temp`, `logs`, etc.)
- **Category type:** Dynamic path-based — one scan result row per discovered folder (not a fixed `CATEGORIES` entry)
- **Risk:** May include non-cache data if heuristics are too broad; mitigated by opt-in toggles, size threshold, and hard denylist
- **Rules:** Unchecked by default; never in Secure exit; show full path (or app folder name) in preview
- **Done when:** User sees only folders above threshold; sensitive paths never offered; clean reports per-folder results

---

## Known limitations (document in README)

- **Edge WebView2** profiles (Teams, Widgets, etc.) are separate from main Edge — may retain sessions unless parent app is closed or WebView2 category added later.
- **Google account sign-in** in Chrome may persist at browser profile level even after cookie clean — user may need to sign out manually in browser settings for full account removal.
- **DNS flush** clears resolver cache only — not a VPN or hosts-file wipe.
- **Not a substitute** for browser “Clear all data”, full-disk wipe, or encryption.
- **Discovered AppData folders (Phase 5)** are heuristic — may miss some apps or surface folders that are not pure cache; always preview before yeet.

---

## User flows

### Flow A — Privacy clean (manual)

1. Scan → see **Disk junk**, **Privacy & sessions**, and **Misc** sections  
2. Check desired privacy categories  
3. Yeet selected → blocking modal if browser open  
4. Results banner reports freed space + sign-out notice  

### Flow B — Secure exit (shared PC)

1. Scan → tap **Secure exit**  
2. Review pre-checked items (Downloads **not** checked)  
3. Confirm banner → yeet → blocking flow if needed  
4. Next user does not see prior history/cookies in browser  

### Flow C — Disk-only (unchanged v0.1)

User selects only temp / recycle / cache — no behavior change from today.

---

## Manual test checklist

### Phase 1

- [ ] Scan shows privacy categories with non-zero sizes after normal browsing
- [ ] Clean with browser **closed** — cookies/history/storage gone in Chrome/Edge
- [ ] Clean with browser **open** — partial clean or clear errors; no crash
- [ ] Saved passwords still work after cookie/history clean
- [ ] Denylist: `Login Data` never appears in scannable paths

### Phase 2

- [ ] Secure exit pre-selects correct categories; Downloads folder **not** selected
- [ ] Secure exit banner text accurate
- [ ] DNS flush reports success/failure in clean summary
- [ ] Session tabs do not restore after secure exit + browser reopen

### Phase 3

- [ ] Thumbnail clean completes or schedules reboot delete
- [ ] No black screen / Shell Experience not killed

### Phase 4

- [x] Downloads folder requires explicit opt-in + confirmation
- [x] Brave privacy categories implemented (cookies, history/downloads list, site storage)
- [x] Firefox privacy categories implemented (`profiles.ini`, `cookies.sqlite`, `places.sqlite`, `storage\`)

### Phase 5 (Final)

- [ ] Discovered large AppData folders: scan, size threshold, per-folder toggles, opt-in only
- [ ] Discovered folders never in Secure exit; denylist blocks sensitive paths
- [ ] WebView2 handling documented or dedicated category implemented
- [ ] Prefetch remains deferred until admin-mode milestone

---

## Files likely to change

| Area | Files |
|------|-------|
| Categories & paths | `src-tauri/src/paths.rs` |
| Safety / denylist | `src-tauri/src/safety.rs` |
| Scan / clean engine | `src-tauri/src/cleaner.rs`, `src-tauri/src/scanner.rs` |
| AppData discovery (Phase 5) | `src-tauri/src/scanner.rs` or new `appdata_discovery.rs` *(heuristic large-folder scan)* |
| DNS / system actions | `src-tauri/src/system_clean.rs` *(new)* |
| Reboot delete | `src-tauri/src/reboot_delete.rs` *(thumbnails)* |
| Blocking apps | `src-tauri/src/process_manager.rs` |
| IPC | `src-tauri/src/lib.rs` |
| UI sections & preset | `src/App.tsx`, new/updated components |
| Types | `src/types.ts` |
| Docs | `README.md`, `PROPOSAL.md` |

---

## What NOT to do in v0.2

- Clear saved passwords (even as hidden opt-in)
- SQLite row-level editing (e.g. downloads-only without history)
- Prefetch without admin mode
- Auto-close protected Windows shell/search processes
- Market as antivirus or “full security cleanup”

---

## References

- v0.1 categories: `README.md` → “What it does” (note: clipboard exists in code)
- Cache paths today: `src-tauri/src/paths.rs` → `browser_cache_paths()`
- v0.2 broader plan: `PROPOSAL.md` → Version 0.2

---

## Session kickoff commands

| Phase | Say in chat |
|-------|-------------|
| Phase 1 | *“Implement SECURITY-PRIVACY-ROADMAP Phase 1 — Chrome/Edge privacy categories, denylist, UI section.”* |
| Phase 2 | *“Implement SECURITY-PRIVACY-ROADMAP Phase 2 — Secure exit preset + DNS flush.”* |
| Phase 3 | *“Implement SECURITY-PRIVACY-ROADMAP Phase 3 — thumbnail cache.”* |
| Phase 4 | *“Implement SECURITY-PRIVACY-ROADMAP Phase 4 — Downloads folder + Brave/Firefox privacy categories.”* |
| Phase 5 (Final) | *“Implement SECURITY-PRIVACY-ROADMAP Phase 5 (Final) — discovered large AppData folders + WebView2 handling + deferred prefetch/admin items.”* |

---

*Reviewed 2026-06-23 — phased plan, denylist, session restore, and UX decisions incorporated.*
