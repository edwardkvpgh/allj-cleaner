---
name: docs
description: >-
  Maintains EDdys Cleaner documentation in docs/ and the README Project docs
  table. Use when adding, renaming, or updating docs files, fixing README doc
  links, writing roadmaps/TODO docs, or when the user mentions /docs, project
  documentation, or FUTURE-TODO-LIST.md.
---

# EDdys Cleaner — Project docs (`/docs`)

## Scope

All product documentation lives in [`docs/`](../../docs/) except [`LICENSE.md`](../../LICENSE.md) (repo root).

The README **Project docs** section is the public index. Keep it in sync with files on disk.

## README Project docs table — required format

Use **three columns**:

| Document | Contents | Status |
|----------|----------|--------|

Rules:

1. **One row per file** — every `docs/*.md` plus root `LICENSE.md`.
2. **Link path** — `./docs/FILENAME.md` or `./LICENSE.md` (no broken links).
3. **Contents** — one sentence: *what it is* + *when to open it* (not a filename repeat).
4. **Status** — one of: `✅ Shipped` · `✅ Current` · `🔲 Planned` · `🔲 Future` · `📖 Reference`.
5. **Order** — product → shipped roadmaps → git guides → future/planned → license.
6. **On change** — add/update/remove the README row whenever a doc is created, renamed, or deleted.

Intro line above the table (keep or adapt):

```markdown
All documentation lives in the [`docs/`](./docs/) folder. Index maintained per [`.cursor/skills/docs/SKILL.md`](./.cursor/skills/docs/SKILL.md) — use **`/docs`** in chat when updating documentation.
```

## Document inventory (authoritative)

| File | Status | Contents (for README row) |
|------|--------|---------------------------|
| [INITIAL-PROPOSAL.md](../../docs/INITIAL-PROPOSAL.md) | 📖 Reference | Original product proposal, architecture, version roadmap v0.1–v0.4 |
| [TECH-STACK.md](../../docs/TECH-STACK.md) | 📖 Reference | Tauri, React, Rust stack — modules, tooling, build |
| [SECURITY-PRIVACY-ROADMAP.md](../../docs/SECURITY-PRIVACY-ROADMAP.md) | ✅ Shipped (v0.2) | Privacy & sessions, Secure exit, DNS, Misc, Phase 5 AppData discovery |
| [PERFORMANCE-TOOL-ROADMAP.md](../../docs/PERFORMANCE-TOOL-ROADMAP.md) | 🔲 Future | PI (Performance) menu — startup, background apps, outdated apps/drivers |
| [FUTURE-TODO-LIST.md](../../docs/FUTURE-TODO-LIST.md) | 🔲 Planned | Downloads picker (v0.2.x); unified bookmark, password, and extension managers (Chrome, Edge, Brave, Firefox) — phases §1–§2 |
| [GITHUB-FIRST-PUSH.md](../../docs/GITHUB-FIRST-PUSH.md) | 📖 Reference | Repo owner: first git init and initial push to GitHub |
| [GITHUB-TEAM-ONBOARDING.md](../../docs/GITHUB-TEAM-ONBOARDING.md) | 📖 Reference | New teammate: clone, setup, pull, branch, commit, first push |
| [LICENSE.md](../../LICENSE.md) | 📖 Reference | MIT License |

## FUTURE-TODO-LIST.md — README wording (canonical)

Use this **Contents** cell unless the doc scope changes:

> Planned features: **Downloads picker** (Misc — list/select/delete, v0.2.x) and unified **bookmark**, **password**, and **extension** managers for Chrome, Edge, Brave, and Firefox (post v0.3+)

**Status:** `🔲 Planned`

## Workflow: add or rename a doc

```
- [ ] Create or rename file under docs/
- [ ] Add header block (Created, Status, Product, Context)
- [ ] Update this SKILL inventory table if needed
- [ ] Add/update README Project docs row (Document | Contents | Status)
- [ ] Cross-link from related roadmaps (INITIAL-PROPOSAL, README Roadmap section)
```

## Workflow: mark doc shipped

Change Status in the doc header and README row to `✅ Shipped`. Move detailed implementation notes to TECH-STACK or README “Version history” if user-facing.

## Related README sections

| README section | Links to |
|----------------|----------|
| Roadmap | INITIAL-PROPOSAL, SECURITY-PRIVACY-ROADMAP, PERFORMANCE-TOOL-ROADMAP |
| What it does | SECURITY-PRIVACY-ROADMAP (privacy categories) |
| Technology Stack | TECH-STACK.md |

## Session kickoff

| Task | Say in chat |
|------|-------------|
| Update doc index | *“Update README Project docs per /docs skill.”* |
| Downloads picker | *“Implement FUTURE-TODO-LIST §1 — Downloads picker.”* |
| Future browser managers | *“Implement FUTURE-TODO-LIST §2 Phase A — unified bookmark manager.”* |
