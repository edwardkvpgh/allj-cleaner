# Future TODO List

**Created:** 2026-06-23  
**Last updated:** 2026-06-23  
**Product:** EDdys Cleaner (EDdys Inc)  
**Status:** Planned items — not implemented (see each section)

Planned features not yet in the app. Shipped work lives in [SECURITY-PRIVACY-ROADMAP.md](./SECURITY-PRIVACY-ROADMAP.md) and README version history.

---

## Index

| # | Feature | Target | Priority | Section |
|---|---------|--------|----------|---------|
| 1 | **Downloads picker / exclude** — list top-level items; delete all except kept | v0.2.x | ✅ Shipped (exclude) | [§1](#1-downloads-picker-misc) |
| 2 | **Per-category dependency detection** — scoped running-app checks | v0.2.x | ✅ Shipped | [§2](#2-per-category-dependency-detection-shipped) |
| 3 | **Unified bookmark manager** (4 browsers) | Post v0.3+ | P1 | [§3](#3-unified-browser-managers) |
| 4 | **Unified extension list** (read-only) | Post v0.3+ | P2 | [§3](#3-unified-browser-managers) |
| 5 | **Unified password manager** | Post v0.3+ | P3 | [§3](#3-unified-browser-managers) |

---

## 1. Downloads picker (Misc)

**Status:** ✅ Exclude mode shipped (v0.2.x) · 🔲 Include-only picker deferred  
**Target:** v0.2.x (Misc → Downloads folder)  
**Context:** Confirm modal supports **exclude** — default delete all top-level items; user can expand **exclude files / folders**, check items to **keep** (folders A–Z, then files A–Z). **Yes, clean downloads** removes everything else. Include-only picker (select what to delete, default nothing) remains optional future UX.

### Goal

Replace wipe-all Downloads flow with:

1. List **files and folders** (top-level children of Downloads) in a modal  
2. User **selects** items to remove  
3. **Remove selected** deletes only those paths (permanent delete, not Recycle Bin)  
4. Misc remains **opt-in**; folder selected = delete folder + all contents inside  

### v0.2 scope (shippable)

| In v0.2.x | Defer later |
|-----------|-------------|
| Top-level items only (`read_dir` on Downloads) | Full recursive tree UI |
| Flat checkbox list (name, file/folder icon, size) | Search, filter, virtualized list |
| Select all / deselect all | Recycle Bin instead of permanent delete |
| Default: **nothing selected** (safest) | Remember last selection |
| Reuse `QuickCleanModal` selection pattern | Deep nested per-file picker inside subfolders |

### UX flow

```text
Scan → user checks Misc → Downloads folder → Yeet
     → Downloads picker modal
         • Load list (spinner)
         • Checkboxes per file/folder
         • Selected count + selected size
         • Browse in Explorer (existing)
         • Cancel | Remove selected (N)
     → Clean selected paths + any other yeet categories
     → Results banner (partial / locked files as today)
```

**Product choice:** v0.2 ships **picker-only** (no separate “remove all” button) unless product asks for both.

### Backend plan

| Task | Detail |
|------|--------|
| Type | `DownloadEntry { path, name, is_dir, size_bytes, file_count }` |
| Command | `list_downloads_entries()` → `Vec<DownloadEntry>` |
| Root | `paths::downloads_folder_paths()` / `dirs::download_dir()` |
| Delete | `clean_downloads_paths(paths: Vec<String>)` — reuse `clean_entry` / safety roots |
| Validation | Every path must be under canonical Downloads root |

**Files:** `paths.rs`, `scanner.rs`, `cleaner.rs`, `lib.rs`, `models.rs`

### Frontend plan

| Task | Detail |
|------|--------|
| Component | Extend `DownloadsConfirmModal.tsx` or new `DownloadsPickerModal.tsx` |
| Pattern | `QuickCleanModal` — checkbox list + `SectionSelectionBar` |
| App | `App.tsx` — yeet with `downloads_folder` opens picker; pass selected paths to clean |
| Warnings | Folder row: “Removes this folder and everything inside” |

**Files:** `DownloadsConfirmModal.tsx` / picker, `App.tsx`, `types.ts`

### Safety (unchanged)

- Downloads root only — reject path escape in Rust  
- Permanent delete — state clearly in modal  
- Never Secure exit / Quick clean  
- Locked files → skip / reboot queue (existing behavior)  

### Testing checklist

- [ ] Select subset — only those items removed  
- [ ] Select folder — folder + contents gone; siblings remain  
- [ ] Select nothing — confirm disabled  
- [ ] Select all top-level — equivalent to current wipe-all behavior  
- [ ] Downloads + disk junk in same yeet — both work  
- [ ] Open file in Downloads — partial clean reported  
- [ ] Tampered path in IPC — rejected server-side  

### Effort (rough)

| Area | Time |
|------|------|
| Rust list + selective delete | 0.5–1 day |
| Picker modal + App wiring | 0.5–1 day |
| Test + docs | 0.5 day |
| **Total** | **~1.5–2.5 days** |

### Session kickoff

> *“Implement FUTURE-TODO-LIST §1 — Downloads picker (top-level list, select, delete selected only).”*

---

## 2. Per-category dependency detection (shipped)

**Status:** ✅ Shipped (v0.2.x)  
**Context:** Before yeet, each category now probes **only its related processes** (e.g. Teams Cache → `Teams` / `ms-teams`, Brave Cache → `brave`). User temp keeps the broad interference list. Closeable apps → blocking modal; protected-only → advisory modal.

### Dependency map

| Category IDs | Processes probed |
|--------------|------------------|
| `chrome_cache`, `chrome_*` privacy | `chrome` |
| `edge_cache`, `edge_*` privacy | `msedge` (+ `msedgewebview2` advisory) |
| `firefox_cache`, `firefox_*` privacy | `firefox` |
| `brave_cache`, `brave_*` privacy | `brave` |
| `teams_cache` | `Teams`, `ms-teams` |
| `discord_cache` | `Discord` |
| `spotify_cache` | `Spotify` |
| `user_temp` | Broad temp interference list (unchanged) |
| Recycle Bin, Clipboard, DNS, Thumbnail, Downloads | None |

### UX

| Trigger | Behavior |
|---------|----------|
| **Select category** | Debounced badge: “Brave running” when applicable |
| **Yeet** | Scoped preflight → close modal, advisory modal, or proceed |
| **Scan** | Generic pre-scan unchanged (scan accuracy) |

### Files

| Layer | Path |
|-------|------|
| Dependency map | `src-tauri/src/paths.rs` — `category_dependency_process_names` |
| Probes | `src-tauri/src/process_manager.rs` |
| Preflight | `src/utils/dependencies.ts` |
| UI | `App.tsx`, `CategoryCard.tsx`, `TempCleanPrompt.tsx` |

---

## 3. Unified browser managers

**Status:** 🔲 Planned — not implemented  
**Target:** Post v0.3+ (Advanced browser data — separate from disk clean & privacy yeet)

**Context:** Users may want **one place** to review saved passwords, bookmarks, and extensions across **Chrome, Edge, Brave, and Firefox** — and delete items **one at a time**. Today EDdys Cleaner **does not** touch passwords, bookmarks, or extensions (`safety.rs` denylist; see [SECURITY-PRIVACY-ROADMAP.md](./SECURITY-PRIVACY-ROADMAP.md)).

### Goal

Add optional **Advanced → Browser data** area (working title) with three unified views:

| Manager | User value |
|---------|------------|
| **Unified bookmark manager** | See all bookmarks from 4 browsers in one list; delete individually |
| **Unified password manager** | See saved logins from 4 browsers in one list; delete individually |
| **Unified extension manager** | See installed extensions per browser; disable/remove where possible |

**Not a replacement** for built-in browser settings — an **aggregator** over on-disk profile data.

---

## Relationship to current product

| Today | These managers |
|-------|----------------|
| Disk junk / cache delete | User **data** (bookmarks, vault, extensions) |
| Privacy = cookies/history/storage | Passwords **explicitly never cleared** |
| Preview → yeet files | Read DB/JSON → list → edit/delete row |
| `safety.rs` blocks `Login Data`, `Bookmarks`, `Extensions\` | Must **override by design** for chosen actions only |

**Positioning if built:** Opt-in **advanced** tools — never in Quick clean, Secure exit, or default scan selection.

---

## Cross-browser reality

One UI, **multiple backends**:

| Browser | Profiles | Chromium-shared? |
|---------|----------|------------------|
| Chrome | `%LocalAppData%\Google\Chrome\User Data\` | — |
| Edge | `%LocalAppData%\Microsoft\Edge\User Data\` | Same file layout as Chrome |
| Brave | `%LocalAppData%\BraveSoftware\Brave-Browser\User Data\` | Same file layout as Chrome |
| Firefox | `%AppData%\Mozilla\Firefox\Profiles\` via `profiles.ini` | Different layout |

**Adapters needed:** ~2 engines (Chromium family + Firefox), × multiple profiles each.

---

## 1. Unified bookmark manager

### Feasibility: **Moderate — best candidate of the three**

| Browser | Storage | Read | Delete one |
|---------|---------|------|------------|
| Chrome / Edge / Brave | `Bookmarks` JSON (tree) | Parse JSON, flatten for UI | Edit tree, write file |
| Firefox | `places.sqlite` (`moz_bookmarks`, …) | SQLite query | Delete/update rows |

### Unified list fields (target)

- Browser name + icon  
- Profile name  
- Title, URL, folder path  
- Actions: **Delete** (with confirm)

### Requirements

- Browser **fully closed** (same blocking-app flow as privacy clean)  
- Handle **sync** — browser may re-import after edit  
- Never bulk-delete without explicit “select all” + second confirm  

### Effort (rough)

| Area | Effort |
|------|--------|
| Chromium bookmark parser | Medium |
| Firefox SQLite reader | Medium |
| Unified React list + delete confirm | Medium |
| **Total** | **Medium** (most realistic v1 of this doc) |

### Done when

- Scan detects installed browsers + profiles  
- User sees merged bookmark list with filters (by browser)  
- Delete one bookmark updates only that browser’s store  
- README documents sync/limitations  

---

## 2. Unified password manager

### Feasibility: **Possible — high effort & high risk**

| Browser | Storage | Encryption |
|---------|---------|------------|
| Chrome / Edge / Brave | `Login Data` (SQLite) | **Windows DPAPI** (`os_crypt`) |
| Firefox | `logins.json` + `key4.db` | **NSS** (Firefox crypto) |

### What “unified manager” means

- Enumerate all profiles → decrypt on **same Windows user account**  
- Show: site URL, username, browser, profile (password masked; reveal on click optional)  
- **Delete one** = remove row from SQLite / JSON — browser closed  

### Challenges

| Issue | Detail |
|--------|--------|
| **Two crypto stacks** | DPAPI (Rust `windows` crate) vs NSS / Firefox decrypt |
| **Security** | Decrypted secrets in app memory — vault-grade handling required |
| **Trust** | App may be flagged like credential-recovery tools if mishandled |
| **No public API** | Read raw files; breaks if browser changes format |
| **Locked DB** | Browser open → read/delete fails |
| **Policy** | [SECURITY-PRIVACY-ROADMAP.md](./SECURITY-PRIVACY-ROADMAP.md) — passwords **never** in v0.2; needs explicit redesign |

### Effort (rough)

| Area | Effort |
|------|--------|
| Chromium Login Data read + DPAPI decrypt | High |
| Firefox logins decrypt | High |
| Secure UI (mask, reveal, no logging) | Medium |
| Per-row delete with DB integrity | High |
| **Total** | **Very high** |

### Done when

- List shows logins from all installed browsers/profiles  
- Delete one login with double confirm + “browser must be closed” gate  
- No passwords in logs, crash reports, or clipboard by default  
- Legal/copy: not marketed as antivirus; user owns risk  

### Recommendation

**Defer until bookmark manager proves the “unified adapter” pattern.** Consider **read-only export/view** before delete. Prefer pointing users to each browser’s password settings unless product direction explicitly accepts vault liability.

---

## 3. Unified extension manager

### Feasibility: **Partial — different problem than bookmarks/passwords**

| Goal | Possible? | Notes |
|------|-----------|--------|
| **List installed extensions** per browser | Yes | Read `Extensions\` manifests / browser prefs |
| **Extension cache / storage cleanup** | Yes | Separate from uninstall — closer to disk junk |
| **Uninstall one extension** | Hard | Browser-specific; not file-delete only |
| **One unified “remove extension” API** | No | No cross-browser standard |

### Chromium (Chrome / Edge / Brave)

- Extensions under `<Profile>\Extensions\<id>\`  
- Enabled/disabled state in `Preferences` / `Secure Preferences` JSON  
- True uninstall = update preferences + remove folder — **fragile**  

### Firefox

- `extensions.json`, `addons.json`, profile extensions folder  
- Different model from Chromium  

### Unified list fields (target)

- Browser, profile, extension name, ID, enabled/disabled  
- Actions: **Open in browser settings** (link-out) and/or **Disable** (advanced, risky)  

### Recommendation

| Scope | Verdict |
|-------|---------|
| **Unified extension list (read-only)** | Reasonable future feature |
| **Disable/uninstall from EDdys** | **Poor fit** — use browser extension pages |
| **Extension cache clean** | Could stay under **Disk junk** as optional category later |

### Effort (rough)

| Area | Effort |
|------|--------|
| List extensions (4 browsers) | Medium–High |
| Safe disable/uninstall | Very high, ongoing maintenance |
| **Total (list only)** | **Medium–High** |

---

## Comparison summary

| Manager | Unified UI? | Same backend? | Feasible? | Fit for EDdys? | Priority |
|---------|-------------|---------------|-----------|----------------|----------|
| **Bookmarks** | Yes | No (JSON + SQLite) | ✅ Moderate | Good (advanced) | **P1** |
| **Passwords** | Yes | No (DPAPI + NSS) | ⚠️ Hard | Risky | **P3** |
| **Extensions** | Partial list | No | ⚠️ Partial | List yes; uninstall no | **P2** (read-only) |

---

## Phased delivery (proposed)

> **Prerequisite:** Stable v0.3+; privacy/disk flows unchanged; explicit product sign-off for touching denylisted paths.

### Phase A — Unified bookmark manager — P1

- [ ] Chromium bookmark adapter (Chrome, Edge, Brave)  
- [ ] Firefox `places.sqlite` adapter  
- [ ] Unified list UI + filter by browser  
- [ ] Delete one + confirm; browser-closed check  
- [ ] Never in Secure exit / Quick clean  

### Phase B — Unified extension list (read-only) — P2

- [ ] List installed extensions per browser/profile  
- [ ] Link-out to `chrome://extensions`, `about:addons`, etc.  
- [ ] Optional: extension **cache** clean under Disk junk (separate item)  

### Phase C — Unified password manager — P3

- [ ] Chromium Login Data + DPAPI decrypt (read)  
- [ ] Firefox logins decrypt (read)  
- [ ] Masked list UI + delete one with double confirm  
- [ ] Security review; update denylist logic for explicit user actions only  

---

## Design principles (all three)

1. **Opt-in only** — separate menu; nothing pre-selected on scan  
2. **Browser closed** — blocking-app flow mandatory  
3. **Delete one-by-one** — no silent bulk wipe  
4. **Denylist awareness** — only touch paths required for the chosen action  
5. **Honest limits** — sync, multiple profiles, “not official browser UI”  
6. **Never** bundle into Secure exit or password-preserving privacy preset  

---

## What NOT to do

- Auto-delete all passwords/bookmarks/extensions  
- Hidden password clearing in privacy yeet  
- SQLite row-level history-only edits without full browser support  
- Store decrypted passwords on disk or in cloud  
- Market as a full password manager replacement  

---

## Files likely to change (when implemented)

| Area | Files |
|------|-------|
| Chromium adapters | `src-tauri/src/browser/chromium_bookmarks.rs`, `chromium_passwords.rs`, `chromium_extensions.rs` *(new)* |
| Firefox adapters | `src-tauri/src/browser/firefox_*.rs` *(new)* |
| Safety / denylist | `src-tauri/src/safety.rs` — scoped exceptions for user-initiated deletes |
| IPC | `src-tauri/src/lib.rs` |
| UI | `src/App.tsx`, new `BrowserDataHub` / manager components |
| Docs | `README.md`, [SECURITY-PRIVACY-ROADMAP.md](./SECURITY-PRIVACY-ROADMAP.md) |

---

## Session kickoff commands

| Item | Say in chat |
|------|-------------|
| §1 Downloads picker | *“Implement FUTURE-TODO-LIST §1 — Downloads picker (top-level list, select, delete selected only).”* |
| §2 Phase A — Bookmarks | *“Implement FUTURE-TODO-LIST §2 Phase A — unified bookmark manager for Chrome, Edge, Brave, Firefox.”* |
| §2 Phase B — Extensions | *“Implement FUTURE-TODO-LIST §2 Phase B — read-only unified extension list + link-out.”* |
| §2 Phase C — Passwords | *“Implement FUTURE-TODO-LIST §2 Phase C — unified password manager (advanced, opt-in only).”* |

---

## References

- Downloads today: `paths.rs` → `downloads_folder_paths()`, `cleaner.rs` → `clean_paths`  
- Current denylist: `src-tauri/src/safety.rs`  
- Profile paths: `src-tauri/src/paths.rs`  
- Privacy / Misc: [SECURITY-PRIVACY-ROADMAP.md](./SECURITY-PRIVACY-ROADMAP.md)  
- Product versions: [INITIAL-PROPOSAL.md](./INITIAL-PROPOSAL.md)  

---

*Reviewed 2026-06-23 — added §1 Downloads picker (v0.2.x); §2 unified browser managers (post v0.3+).*
