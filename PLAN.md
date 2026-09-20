# Docubil — Project Plan

_Last updated: 2026-09-20_

## Vision

Bring PDF accessibility to any workspace, community, or use case — so
everyone has equal access to data, forms, and PDF-based documents,
regardless of budget or technical resources. Docubil analyzes PDFs against
WCAG 2.1 AA/AAA and automatically remediates what can be fixed without
human judgment, while being transparent about what still needs a human.

## Working model

- **Jeremy Shields** — product owner. Reviews, tests, and guides the
  direction; weighs in when a decision is genuinely major (architecture,
  license, branding, anything hard to reverse).
- **Claude** — primary developer. Drives day-to-day implementation,
  audits, and hardening. When a decision is ambiguous or high-stakes,
  spins up a focused sub-agent review before presenting a recommendation,
  rather than guessing or over-asking.

## Audit summary (Phase 0, completed 2026-09-20)

What's already solid:
- Express backend is functional and well-tested (37/37 tests passing,
  ESLint clean). Real security controls exist: PDF magic-byte validation,
  Helmet CSP, CORS allowlist, rate limiting, UUID-validated job IDs,
  non-root Docker user, scheduled file/job cleanup.
- The Python enhancement layer (`pikepdf` + `pdfplumber`) is optional and
  degrades gracefully to heuristic-only analysis when unavailable — good
  design for a tool meant to run in constrained environments.
- Docker/Compose setup is already production-minded (healthcheck, volumes,
  non-root user).

What needs attention:
- **License inconsistency**: `LICENSE` already contains full AGPL-3.0 text,
  but `package.json` and `README.md` still declare MIT. Needs reconciling.
- **Incomplete rebrand**: GitHub repo is `Docubil`; `package.json` name/repo
  URL, README badges/links, and the Docker container name still say
  `pdf-accessibility`.
- **Leaked generated content**: 8 remediated PDF files are committed and
  tracked in git under `output/`, despite that directory now being
  gitignored (the rule only prevents *future* tracking — these predate it).
  Needs a decision: untrack going forward, or a full history rewrite to
  remove the exposure completely.
- **Dependency bloat/risk**: `requirements.txt` lists 12 Python packages;
  the code only uses 2 (`pikepdf`, `pdfplumber`). `npm audit` reports 8
  vulnerabilities (5 high) in the production dependency tree; `multer@1.x`
  has known CVEs patched in 2.x.
- **No governance scaffolding**: no CONTRIBUTING.md, CODE_OF_CONDUCT.md,
  SECURITY.md, issue/PR templates, or CODEOWNERS exist yet.
- **CI covers only lint + test**: no CodeQL, no dependency-audit gate, no
  Dependabot, no accessibility testing of the app's own UI.
- **Frontend** is a functional but visually dated vanilla HTML/CSS/JS app
  (~1,450 lines) — confirmed as a full-rebuild target, not something to
  preserve piecemeal.

## Phases

### Phase 0 — Audit & Planning ✅
**Goal:** Understand what exists before changing anything irreversible.
**Approval metric:** This document, reviewed and accepted by the product
owner.

### Phase 1 — Governance & Rebrand Reconciliation
**Goal:** Docubil is internally consistent and has the baseline docs any
serious open-source project needs.
**Tasks:**
- Reconcile LICENSE/package.json/README to AGPL-3.0 consistently.
- Full rename sweep: package name, repo URLs, badges, Docker image/container
  names, docs — `pdf-accessibility` → `docubil` everywhere.
- Write CONTRIBUTING.md (AGPL-aware: explain copyleft implications for
  contributors), CODE_OF_CONDUCT.md (Contributor Covenant), SECURITY.md
  (vulnerability disclosure + data retention policy for uploaded PDFs).
- Add `.github/ISSUE_TEMPLATE/`, `PULL_REQUEST_TEMPLATE.md`, CODEOWNERS.
- Resolve the leaked-PDF git history question per owner decision.
**Approval metric:** All doc links resolve; `npm run lint && npm test`
still green; PR reviewed and merged by the product owner.

### Phase 2 — Security & CI Hardening
**Goal:** No PR merges without passing security and quality gates.
**Tasks:**
- Add CodeQL workflow (JS + Python).
- Add `npm audit --audit-level=high` and `pip-audit` as CI gates.
- Add Dependabot config for npm + pip.
- Prune `requirements.txt` to actual usage; upgrade `multer` to 2.x and
  resolve remaining `npm audit` findings.
- Document recommended GitHub repo settings (branch protection on `main`,
  required reviews, required status checks, secret scanning/push
  protection) for the owner to apply.
**Approval metric:** CI runs lint + test + CodeQL + dependency audit on
every PR, all green on `main`; branch protection applied.

### Phase 3 — Frontend Rebuild
**Goal:** A modern, accessible, well-animated interface built on
React + Vite + Tailwind (decided 2026-09-20).
**Tasks:**
- New component architecture and design system.
- Purposeful motion (Framer Motion) — polish, not distraction.
- Fully responsive; keyboard and screen-reader navigable throughout.
- axe-core/pa11y wired into CI against the built app.
**Approval metric:** Zero axe-core violations in CI; Lighthouse
accessibility score ≥ 95; product owner sign-off on a preview deploy.

### Phase 4 — Release & Distribution
**Goal:** Anyone can run Docubil via `docker run` or `docker compose up`
without cloning the repo.
**Tasks:**
- GitHub Actions workflow publishing versioned, multi-arch images to
  GitHub Container Registry (GHCR) (decided 2026-09-20) on tagged release.
- Keep SemVer + Conventional Commits + `standard-version` (already
  configured) driving changelog generation.
- Release notes format: short human-readable summary grouped as
  Major/Minor/Fix/Security, with full technical changelog in a collapsed
  `<details>` accordion in the GitHub Release body.
**Approval metric:** `docker compose pull && docker compose up` against a
tagged GHCR image works end-to-end with no source checkout.

### Phase 5 — Community Growth (ongoing)
**Goal:** Docubil is approachable to contributors and users beyond its
original author.
**Tasks:** i18n/l10n groundwork, a lightweight docs site, "good first
issue" labeling, contributor onboarding polish.
**Approval metric:** Reassessed each quarter based on actual community
engagement — not a fixed deliverable.

## Versioning & release notes

SemVer, enforced via Conventional Commits (already set up via
`commitizen`/`cz-git`) and `standard-version`. Every tagged release gets a
GitHub Release with a short categorized summary at the top and full
detail in a collapsible section — see Phase 4.
