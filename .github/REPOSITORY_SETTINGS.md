# Recommended GitHub repository settings

These are settings pages in the GitHub UI, not files in this repo — they
must be applied manually by someone with admin access (the CI workflows in
this repo can't configure them). This is Phase 2 of `PLAN.md`.

## Branch protection (Settings → Branches → Add rule for `main`)

- **Require a pull request before merging** — no direct pushes to `main`.
  - Require at least 1 approval.
  - Dismiss stale approvals when new commits are pushed.
- **Require status checks to pass before merging**, and require branches
  to be up to date. Select these checks once they've run at least once:
  - `test` (from `ci.yml`)
  - `security` (from `ci.yml`)
  - `frontend` (from `ci.yml`)
  - `docker` (from `ci.yml`, build-validation only — never pushes an image)
  - `Analyze (javascript-typescript)` / `Analyze (python)` (from `codeql.yml`)
- **Require conversation resolution before merging.**
- Do **not** allow force pushes or branch deletion on `main`.

## Code security (Settings → Code security and analysis)

- **Dependabot alerts**: on.
- **Dependabot security updates**: on (works alongside `dependabot.yml`,
  which handles routine version-bump PRs; security updates fire
  independently and faster for known CVEs).
- **Secret scanning**: on.
- **Push protection** (blocks commits containing detected secrets): on.
- **Code scanning**: CodeQL is already wired up via `.github/workflows/codeql.yml` —
  once it's run once, results appear automatically under the Security tab.

## General repo settings (Settings → General)

- **Default branch**: `main`.
- Merge strategy: prefer **squash merging** for a clean, linear history
  matching the Conventional Commits convention this project uses; disable
  merge commits and rebase merging unless there's a specific reason to
  keep them.
- Automatically delete head branches after merge: on.

## Access

- Repository visibility, collaborator access, and team permissions are
  specific to your org structure — not prescribed here. As a baseline:
  grant **Write** (not Admin) to regular contributors, and reserve Admin
  for maintainers who need to change these settings.
