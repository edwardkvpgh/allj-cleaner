# Security & Privacy Cleanup — Tomorrow's First Job

**Created:** 2026-06-22  
**Product:** EDdys Cleaner (EDdys Inc)  
**Status:** Planned — start here tomorrow  
**Context:** v0.1 covers disk junk (temp, recycle bin, Chrome/Edge cache, clipboard). It does **not** yet cover the browsing traces users expect when securing a shared PC or improving privacy after a session.

---

## Goal

Add optional, user-controlled cleanup for **browser session & privacy data** — without turning EDdys Cleaner into a reckless “wipe everything” tool.

**Design principles for tomorrow:**

1. **Preview before delete** — same trust model as existing categories.
2. **Opt-in per category** — user picks what to clear (especially passwords).
3. **Browser must be closed** — reuse blocking-app flow where needed.
4. **Safe paths only** — whitelist known profile locations; never touch unrelated user files.
5. **Saved passwords stay off by default** — optional advanced toggle only if we add it at all.

---

## Gap checklist (from analysis)

| # | Gap | Why it matters | v0.1 | Tomorrow target |
|---|-----|----------------|------|-----------------|
| 1 | **Cookies** | Active login sessions survive cache-only cleanup | ❌ | ✅ Add category |
| 2 | **Browsing history** | URLs visited remain visible in browser | ❌ | ✅ Add category |
| 3 | **Download history** | Browser still lists what was downloaded | ❌ | ✅ Add category |
| 4 | **Downloads folder** | Actual files from the web may still be on disk | ❌ | ✅ Add category (with strong warning) |
| 5 | **Local storage / IndexedDB** | Site data persists after cache clear | ❌ | ✅ Add category |
| 6 | **DNS cache flush** | Recent domain lookups can linger at OS level | ❌ | ✅ Add action |
| 7 | **Windows thumbnail cache** | Visual traces of files/images | ❌ (v0.2 noted) | ✅ Add category |
| 8 | **Windows prefetch** | App launch / usage traces | ❌ | 🔲 Evaluate (admin may be required) |
| 9 | **Kill sessions / log out on shared PC** | Cache clear ≠ signed out | ❌ | ✅ Via cookies + optional “secure exit” preset |
| 10 | **Hide browsing history** | Privacy on shared machines | ❌ | ✅ Via history category + preset |

### Intentionally excluded by default

| Item | Default | Notes |
|------|---------|-------|
| **Saved passwords** | ❌ Do not clear | Good default. Only consider an explicit advanced opt-in with scary confirmation. |
| **Bookmarks** | ❌ Do not clear | User data, not security junk. |
| **Extensions** | ❌ Do not clear | Out of scope unless compromised-device mode is added later. |

---

## Proposed UI: “Secure exit” preset (shared PC)

One-click preset that selects **safe privacy categories** (not passwords):

- [ ] Cookies (all profiles)
- [ ] Browsing history
- [ ] Download history (browser metadata)
- [ ] Local storage / IndexedDB / Session storage
- [ ] Chrome cache (existing)
- [ ] Edge cache (existing)
- [ ] Clipboard (existing)
- [ ] DNS cache flush
- [ ] Optional: Downloads folder *(unchecked by default — destructive)*

Show banner: *“You will be signed out of websites. Saved passwords are not removed unless you enable Advanced.”*

---

## Technical notes per category

### 1. Cookies (Chrome / Edge)

- **Paths (Chromium):** `%LocalAppData%\Google\Chrome\User Data\<Profile>\Cookies` (and network\Cookies on newer builds), same pattern for Edge under `Microsoft\Edge`.
- **Caveat:** SQLite DB locked while browser is open — require close or use same blocking-app flow.
- **Done when:** Scan shows size/count; clean removes file or triggers browser-safe clear; user is logged out of sites.

### 2. Browsing history

- **Paths:** `<Profile>\History` (Chromium SQLite).
- **Also consider:** `Top Sites`, `Visited Links`, `Favicons` (optional sub-option).
- **Done when:** History UI in browser is empty after clean + browser restart.

### 3. Download history (browser)

- **Paths:** `<Profile>\History` (downloads table) — may share DB with history; document coupling.
- **Done when:** `edge://downloads` / `chrome://downloads` list is cleared.

### 4. Downloads folder

- **Path:** `%USERPROFILE%\Downloads`
- **Caveat:** High risk — user documents, installers, work files. **Unchecked by default.** Require confirmation modal listing file count + size.
- **Done when:** Only runs when explicitly selected; never part of default “yeet selected”.

### 5. Local storage / IndexedDB / Session storage

- **Paths (Chromium):** `<Profile>\Local Storage\`, `<Profile>\IndexedDB\`, `<Profile>\Session Storage\`
- **Done when:** Site-specific data dirs removed or emptied per profile.

### 6. DNS cache flush

- **Action:** `ipconfig /flushdns` (no admin for standard user cache).
- **Done when:** New Tauri command runs flush; success/failure reported in clean summary.
- **UI:** Small category or bundled inside “Secure exit” preset.

### 7. Windows thumbnail cache

- **Paths:** `%LocalAppData%\Microsoft\Windows\Explorer\thumbcache_*.db`, `iconcache_*.db`
- **Caveat:** Explorer may lock files — may need Explorer restart warning (do **not** force-kill Shell Experience Host).
- **Done when:** Thumbnail DBs cleared or scheduled for delete-on-reboot.

### 8. Windows prefetch (evaluate)

- **Path:** `C:\Windows\Prefetch\`
- **Caveat:** Often requires administrator; system telemetry, not just browser.
- **Tomorrow:** Spike only — document yes/no before implementing.

---

## Browser coverage tomorrow

| Browser | Priority | Notes |
|---------|----------|-------|
| Google Chrome | P0 | Same User Data layout as today’s cache clean |
| Microsoft Edge | P0 | Same |
| Firefox | P1 | Different profile paths — follow v0.2 plan |
| Brave | P1 | Chromium-based — may reuse Chrome logic |

---

## Suggested implementation order (tomorrow session)

1. **Read this file** + skim `paths.rs`, `cleaner.rs`, `process_manager.rs`.
2. **Extend `paths.rs`** with new category IDs and safe path resolvers.
3. **Add scan/clean logic** for Chromium cookies, history, storage (Chrome + Edge).
4. **Add `flush_dns` command** in Rust; wire to UI category.
5. **Add thumbnail cache** category with Explorer-lock handling.
6. **Add “Secure exit” preset** in React (pre-selects privacy categories).
7. **Update README + PROPOSAL** with new categories and warnings.
8. **Manual test checklist** on a shared-PC scenario (see below).

---

## Manual test checklist (after implementation)

- [ ] Scan shows new categories with non-zero sizes after normal browsing.
- [ ] Clean with browser **closed** — cookies/history actually gone in browser.
- [ ] Clean with browser **open** — graceful partial clean or clear error (no crash).
- [ ] “Secure exit” does **not** select Downloads folder or passwords by default.
- [ ] DNS flush reports success in clean summary.
- [ ] Thumbnail clean does not black out desktop (no Shell Experience kill).
- [ ] Saved passwords still work after standard secure exit.

---

## Files likely to change

| Area | Files |
|------|-------|
| Categories & paths | `src-tauri/src/paths.rs` |
| Scan / clean engine | `src-tauri/src/cleaner.rs`, `src-tauri/src/scanner.rs` |
| DNS / system actions | new `src-tauri/src/system_clean.rs` (or similar) |
| IPC | `src-tauri/src/lib.rs` |
| UI categories & preset | `src/App.tsx`, new or updated components |
| Types | `src/types.ts` |
| Docs | `README.md`, `PROPOSAL.md` |

---

## References

- Current v0.1 categories: `README.md` → “What it does”
- Browser cache-only paths today: `src-tauri/src/paths.rs` → `browser_cache_paths()`
- v0.2 roadmap (Firefox, Brave, thumbnails): `PROPOSAL.md`

---

## Open questions for tomorrow (decide at start)

1. Single **“Browser privacy”** mega-category vs separate toggles per data type?
2. Include **Firefox** on day one or Chrome/Edge only?
3. **Downloads folder** — ship tomorrow or defer (recommended: defer default, ship optional)?
4. **Prefetch** — skip unless admin mode exists?

---

*Start tomorrow’s session with: “Implement SECURITY-PRIVACY-ROADMAP.md — step 1.”*
