# GitHub Team Onboarding — Clone, Setup & First Push

**Created:** 2026-06-23  
**Repository:** [edwardkvpgh/allj-cleaner](https://github.com/edwardkvpgh/allj-cleaner)  
**Product:** Detox (AJThink Labs)  
**Audience:** A **new team member** joining on their own laptop (repo already exists on GitHub)

**Not you?** If you are creating the repo from scratch on an empty GitHub remote, use [GITHUB-FIRST-PUSH.md](./GITHUB-FIRST-PUSH.md) instead.

---

## Overview

```text
Get access → Clone → Install tools → npm install → Run app → Branch → Change → Pull → Commit → Push → Pull request (optional)
```

You do **not** run `git init` — the repository already exists. You **clone** it.

---

## Before you start

### Accounts & access

- [ ] GitHub account created
- [ ] Invited as **collaborator** on [edwardkvpgh/allj-cleaner](https://github.com/edwardkvpgh/allj-cleaner) (repo owner adds you under **Settings → Collaborators**)
- [ ] You can open the repo in the browser while logged in

### Software (Windows)

| Tool | Check | Install |
|------|-------|---------|
| **Git** | `git --version` | [git-scm.com/download/win](https://git-scm.com/download/win) |
| **Node.js** 20+ | `node --version` | [nodejs.org](https://nodejs.org/) |
| **Rust** | `rustc --version` | [rustup.rs](https://rustup.rs/) or let `start.bat` install it |
| **Visual Studio C++ Build Tools** | — | [Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) — *Desktop development with C++* (needed for Tauri/Rust on Windows) |

Optional but useful:

- [GitHub CLI](https://cli.github.com/) — `gh auth login` simplifies push/auth
- [Cursor](https://cursor.com/) or VS Code — recommended editor

---

## Step 1 — Pick a folder and clone

Open PowerShell and choose where you keep projects (example: `Downloads` or `Projects`):

```powershell
cd $env:USERPROFILE\Downloads
git clone https://github.com/edwardkvpgh/allj-cleaner.git
cd allj-cleaner
```

Verify remote:

```powershell
git remote -v
```

Expected:

```text
origin  https://github.com/edwardkvpgh/allj-cleaner.git (fetch)
origin  https://github.com/edwardkvpgh/allj-cleaner.git (push)
```

### Clone via SSH (optional)

If you use SSH keys with GitHub:

```powershell
git clone git@github.com:edwardkvpgh/allj-cleaner.git
cd allj-cleaner
```

---

## Step 2 — Authenticate with GitHub (one time per machine)

GitHub does **not** accept account passwords for `git push`. Pick one method.

### Option A — HTTPS + Personal Access Token (classic)

1. Open: https://github.com/settings/tokens  
2. **Generate new token (classic)**  
3. Name: e.g. `Detox laptop`  
4. Scope: **repo** (full control of private repositories)  
5. Generate and **copy** the token (shown once)

Then either:

```powershell
git credential-manager github login
```

…or push once with the token (Credential Manager will remember it):

```powershell
git push
```

When prompted for password, paste the **token**, not your GitHub password.

### Option B — GitHub CLI (recommended)

```powershell
gh auth login
```

Follow prompts (GitHub.com → HTTPS → login via browser). Then:

```powershell
gh auth setup-git
```

### Option C — SSH

1. [Generate SSH key](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)  
2. Add public key: https://github.com/settings/keys  
3. If you cloned with HTTPS, switch remote:

```powershell
git remote set-url origin git@github.com:edwardkvpgh/allj-cleaner.git
```

---

## Step 3 — Install app dependencies

From the cloned `allj-cleaner` folder:

### Easy path (first time on Windows)

```powershell
.\start.bat
```

`start.bat` checks Node/Rust, runs `npm install`, and can launch dev mode.

### Manual path

```powershell
npm install
```

**Do not commit** `node_modules/` — it is in `.gitignore`.

First Rust build can take several minutes.

---

## Step 4 — Run the app

**Daily dev:**

```powershell
.\run.bat
```

**Or manually:**

```powershell
npm run tauri dev
```

**Build release `.exe` (optional):**

```powershell
.\build.bat
```

Output: `src-tauri\target\release\allj-cleaner.exe`

Read more: [README.md](../README.md) → Quick Start & Launcher Files.

---

## Step 5 — Stay up to date (`pull`)

Before you start work each day (or before your first commit):

```powershell
git checkout main
git pull origin main
```

If you are on a feature branch:

```powershell
git checkout main
git pull origin main
git checkout your-branch-name
git merge main
```

---

## Step 6 — Create a branch (recommended)

Avoid committing directly to `main` when working with others:

```powershell
git checkout main
git pull origin main
git checkout -b feature/short-description
```

Examples:

- `feature/thumbnail-cache-tweak`
- `fix/downloads-modal-copy`

---

## Step 7 — Make changes, commit, push

After editing files:

```powershell
git status
git diff
```

Stage only what you intend to commit:

```powershell
git add path\to\file.tsx
git add .
git status
```

Confirm these are **not** staged:

- `node_modules/`
- `dist/`
- `src-tauri/target/`
- `.env` or any secrets/tokens

Commit:

```powershell
git commit -m "Short message: what changed and why"
```

Push your branch (first time for this branch):

```powershell
git push -u origin feature/short-description
```

Later pushes on the same branch:

```powershell
git push
```

---

## Step 8 — Open a Pull Request (team workflow)

After pushing your branch:

1. Open https://github.com/edwardkvpgh/allj-cleaner  
2. GitHub usually shows **Compare & pull request** — click it  
3. Or: **Pull requests → New pull request** → base: `main` ← compare: your branch  
4. Add a short description of what you changed  
5. Request review from the repo owner  
6. After merge, update your local `main`:

```powershell
git checkout main
git pull origin main
```

### Using GitHub CLI

```powershell
gh pr create --title "Your title" --body "What changed and how to test"
```

---

## Daily workflow cheat sheet

| When | Command |
|------|---------|
| Start of day | `git checkout main` → `git pull origin main` |
| New task | `git checkout -b feature/my-task` |
| See changes | `git status` / `git diff` |
| Save work | `git add .` → `git commit -m "message"` |
| Share work | `git push -u origin feature/my-task` |
| After PR merged | `git checkout main` → `git pull origin main` |

---

## First push checklist (new teammate)

| Step | Done |
|------|------|
| Invited to GitHub repo | ☐ |
| `git clone` succeeded | ☐ |
| `git auth` / PAT / `gh auth login` works | ☐ |
| `npm install` or `start.bat` completed | ☐ |
| App runs (`run.bat` or `npm run tauri dev`) | ☐ |
| `git pull origin main` works | ☐ |
| Created feature branch | ☐ |
| Committed with clear message | ☐ |
| `git push` succeeded | ☐ |
| Opened PR (if team uses PRs) | ☐ |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Repository not found` on clone | Ask owner for collaborator access; confirm repo URL |
| `Authentication failed` on push | Use PAT or `gh auth login`, not GitHub password |
| `Permission denied` on push | You may not have write access — confirm collaborator role |
| `rejected` / `non-fast-forward` | Someone else pushed first — `git pull origin main` (or merge `main` into your branch), resolve conflicts, push again |
| Merge conflicts | Open conflicted files, fix `<<<<<<<` markers, `git add`, `git commit`, `git push` |
| Huge slow commit | `git status` — ensure `node_modules` and `src-tauri/target` are not tracked |
| `remote origin already exists` | You are not cloning fresh — `cd` into clone folder or use `git remote -v` to check |
| Rust / Tauri build fails | Install C++ Build Tools; run `rustup update`; try `npm run tauri dev` again |
| Accidentally committed a secret | Revoke token on GitHub, remove from file, new commit — ask team lead if it was pushed |

---

## What never goes in git

| Item | Why |
|------|-----|
| `node_modules/` | Recreated by `npm install` |
| `src-tauri/target/` | Rust build output |
| `dist/` | Frontend build output |
| Personal Access Tokens, `.env` secrets | Security risk |
| Local-only paths hardcoded for one machine | Breaks other teammates |

Already in `.gitignore` — trust it, but always run `git status` before commit.

---

## Related docs

| Document | Use when |
|----------|----------|
| [GITHUB-FIRST-PUSH.md](./GITHUB-FIRST-PUSH.md) | **First person** creates repo and initial push from local folder |
| [README.md](../README.md) | App features, `run.bat` / `build.bat`, roadmap |
| [TECH-STACK.md](./TECH-STACK.md) | Stack overview for developers |
| [INITIAL-PROPOSAL.md](./INITIAL-PROPOSAL.md) | Product scope and architecture |

---

## Optional: ask Cursor to help

In chat:

> *“Walk me through GITHUB-TEAM-ONBOARDING.md — clone, setup, and first push.”*

Cursor can run local setup steps. **You** still authenticate with GitHub for `git push` / `gh auth login`.

---

*New teammate start: clone → `start.bat` → `run.bat` → branch → commit → push → pull request.*
