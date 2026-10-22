# Recommended GitHub repository settings

These are settings pages in the GitHub UI, not files in this repo — they
must be applied manually by someone with admin access (the CI workflows in
this repo can't configure them). First written in Phase 2 of `PLAN.md`,
updated for the Changesets release flow in Phase 5.

## Protect `main` (Settings → Rules → Rulesets → New branch ruleset)

A ruleset (GitHub's newer replacement for "branch protection rules") named
`main`, **Enforcement: Active**, **Target branches: Include default branch**:

- **Restrict deletions** and **Block force pushes**: on.
- **Require a pull request before merging**: on.
  - **Required approvals: 0** while there's a single maintainer. GitHub never
    lets you approve your own PR, so 1 would block every merge. Raise it to 1
    once there's a second regular reviewer.
  - **Require conversation resolution before merging**: on.
  - Allowed merge methods: **Squash** only (the changelog tooling expects one
    commit per PR).
- **Require status checks to pass**: on. Add these (each appears in the picker
  once it has run at least once):
  - `test`, `security`, `frontend`, `docker` (from `ci.yml`)
  - `Analyze (javascript-typescript)`, `Analyze (python)` (from `codeql.yml`)
  - Leave **Require branches to be up to date** *off*. With it on, every
    merge forces every other open PR, Dependabot's included, to be updated and
    re-run before it can merge.
  - Don't add **Release highlights**: it only runs on the Version Packages PR.
- **Bypass list:** empty. Admins can still edit the ruleset in an emergency,
  which is a deliberate, visible step.

The Version Packages PR is opened with `GITHUB_TOKEN`, which doesn't start
CI. Close and reopen it to run the required checks (see RELEASING.md).

## Code security (Settings → Code security and analysis)

- **Dependabot alerts**: on.
- **Dependabot security updates**: on (works alongside `dependabot.yml`,
  which handles routine version-bump PRs; security updates fire
  independently and faster for known CVEs).
- **Secret scanning**: on.
- **Push protection** (blocks commits containing detected secrets): on.
- **Code scanning**: CodeQL is already wired up via `.github/workflows/codeql.yml` —
  once it's run once, results appear automatically under the Security tab.

## Actions (Settings → Actions → General)

- **Workflow permissions:** "Read and write permissions", and tick **"Allow
  GitHub Actions to create and approve pull requests"**. `release.yml` needs
  both to open and update the "chore: version packages" PR (see RELEASING.md).
  Don't add the **Release highlights** check to the required checks above:
  it only runs on that PR.

## Discussions and labels

- **Discussions: on**, with the default categories. The issue forms link to
  the `Q&A` (`q-a`) and `Ideas` (`ideas`) categories by URL.
- **Labels** the issue forms and Dependabot apply, which must exist or GitHub
  silently drops them (Issues → Labels):

  | Label | Applied by | Meaning |
  |---|---|---|
  | `triage` | every issue form | Not yet looked at by a maintainer |
  | `bug` | Bug report | Something is broken |
  | `accuracy` | Wrong result | A check or fix got a PDF wrong; candidate for the test corpus |
  | `enhancement` | Feature request | New capability |
  | `dependencies` | Dependabot | Dependency update |
  | `docker` | Dependabot | Base image update |
  | `install-blocked` | maintainers | A user can't install the web app at work (the trigger for Phase 9) |
  | `good first issue` | maintainers | Small and well-scoped, for new contributors |

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
