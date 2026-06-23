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

### Option A — HTTPS + Personal Access Token    (Use this option )

Create a GitHub token    

1. Open: https://github.com/settings/tokens
2. Generate new token → Generate new token (classic)
3. Name it something like "EDDYs Cleaner Push"
4. Check repo (full control of private repositories)
5. Generate and copy the token — you won’t see it again

6) git credential-manager github login

7) Push

Replace PASTE_YOUR_TOKEN_HERE with your real token:

git push https://edwardkvpgh:PASTE_YOUR_TOKEN_HERE@github.com/edwardkvpgh/allj-cleaner.git main
 

7)  Set upstream for future pushes

git fetch origin
git branch --set-upstream-to=origin/main main

### Option B — SSH  (The best, try later)

```powershell

Generate a key: https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent

Add the public key to GitHub: https://github.com/settings/keys

Switch remote:

git remote set-url origin git@github.com:edwardkvpgh/allj-cleaner.git
git push -u origin main
```

Requires an SSH key added to your GitHub account.

---

## After the first push

For later changes:

```powershell
git add .
git commit -m "Mention here what you changed"
git push

Or

git push https://edwardkvpgh:PASTE_YOUR_TOKEN_HERE@github.com/edwardkvpgh/allj-cleaner.git main

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

## Quick changed-files commands

Use:

```powershell
git status --short
```

If you want only file paths (no status letters):

```powershell
git diff --name-only
git diff --name-only --cached
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `remote origin already exists` | `git remote set-url origin https://github.com/edwardkvpgh/allj-cleaner.git` |
| `push declined due to repository rule violations` | A secret (e.g. token) was committed — remove it from the file, amend commit, revoke token on GitHub, push again |
| `Authentication failed` | Use PAT or `gh auth login`, not account password |
| Huge commit / slow push | Run `git status` — ensure `node_modules` and `target` are ignored |

---

## Optional: let Cursor run setup for you

You can ask:

> *“Run git init, add remote, and initial commit from GITHUB-FIRST-PUSH.md”*

Cursor can do steps 2–4 locally. **You** still run `git push` (or `gh auth login`) — that step needs your GitHub credentials.

---

*Start tomorrow with: “Walk me through GITHUB-FIRST-PUSH.md”*
