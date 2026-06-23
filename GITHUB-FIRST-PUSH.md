# GitHub First Push — Tomorrow's Setup

**Created:** 2026-06-22  
**Repository:** [edwardkvpgh/allj-cleaner](https://github.com/edwardkvpgh/allj-cleaner)  
**Local folder:** `c:\Users\Emd\Downloads\ALLJ-Cleaner`  
**Status:** Not a git repo yet — remote is empty — straightforward first push.

---

## Before you start

- [ ] [Git for Windows](https://git-scm.com/download/win) installed (`git --version` works)
- [ ] Logged into GitHub as **edwardkvpgh**
- [ ] Repo exists and is empty: https://github.com/edwardkvpgh/allj-cleaner

**Already handled by `.gitignore`** (should **not** appear in `git status`):

- `node_modules/`
- `dist/`
- `src-tauri/target/`

---

## Step 1 — Open terminal in project folder

```powershell
cd "c:\Users\Emd\Downloads\ALLJ-Cleaner"
```

---

## Step 2 — Initialize git (one time)

```powershell
git init
git branch -M main
```

---

## Step 3 — Add GitHub remote (one time)

```powershell
git remote add origin https://github.com/edwardkvpgh/allj-cleaner.git
```

Verify:

```powershell
git remote -v
```

Expected output:

```
origin  https://github.com/edwardkvpgh/allj-cleaner.git (fetch)
origin  https://github.com/edwardkvpgh/allj-cleaner.git (push)
```

---

## Step 4 — Stage and commit

```powershell
git add .
git status
```

Confirm `node_modules/`, `dist/`, and `src-tauri/target/` are **not** listed.

```powershell
git commit -m "Initial commit: EDdys Cleaner desktop app"
```

---

## Step 5 — Push to GitHub

```powershell
git push -u origin main
```

GitHub **does not** accept account passwords for push. Use one option below.

---

## Authentication (pick one)

### Option A — GitHub CLI (easiest)

```powershell
gh auth login
git push -u origin main
```

### Option B — HTTPS + Personal Access Token

1. GitHub → **Settings** → **Developer settings** → **Personal access tokens**
2. Create a token with `repo` scope
3. When `git push` asks for a password, paste the **token** (not your GitHub password)

### Option C — SSH

```powershell
git remote set-url origin git@github.com:edwardkvpgh/allj-cleaner.git
git push -u origin main
```

Requires an SSH key added to your GitHub account.

---

## After the first push

For later changes:

```powershell
git add .
git commit -m "Describe what you changed"
git push
```

---

## Quick checklist

| Step | Command |
|------|---------|
| Open folder | `cd "c:\Users\Emd\Downloads\ALLJ-Cleaner"` |
| Init | `git init` |
| Branch | `git branch -M main` |
| Remote | `git remote add origin https://github.com/edwardkvpgh/allj-cleaner.git` |
| Stage | `git add .` |
| Commit | `git commit -m "Initial commit: EDdys Cleaner desktop app"` |
| Push | `git push -u origin main` |

---

## Tomorrow session order (suggested)

1. **Git setup** — this file (`GITHUB-FIRST-PUSH.md`)
2. **Security & privacy features** — `SECURITY-PRIVACY-ROADMAP.md`

Or ask in chat:

> *“Walk me through GITHUB-FIRST-PUSH.md”*

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `remote origin already exists` | `git remote set-url origin https://github.com/edwardkvpgh/allj-cleaner.git` |
| `failed to push — rejected` | Remote may have a README commit; pull first or force only if you intend to overwrite empty repo |
| `Authentication failed` | Use PAT or `gh auth login`, not account password |
| Huge commit / slow push | Run `git status` — ensure `node_modules` and `target` are ignored |

---

## Optional: let Cursor run setup for you

You can ask:

> *“Run git init, add remote, and initial commit from GITHUB-FIRST-PUSH.md”*

Cursor can do steps 2–4 locally. **You** still run `git push` (or `gh auth login`) — that step needs your GitHub credentials.

---

*Start tomorrow with: “Walk me through GITHUB-FIRST-PUSH.md”*
