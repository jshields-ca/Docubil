# Docubil — Project Plan

_Last updated: 2026-10-17 · Decisions referenced as D-NNN live in [DECISIONS.md](DECISIONS.md)._

## Vision

Bring PDF accessibility to any workspace, community, or use case, so everyone
has equal access to data, forms, and PDF-based documents regardless of budget
or technical resources. Docubil checks PDFs against WCAG 2.1 AA/AAA, fixes
what can be fixed without human judgment, and is honest about what still
needs a person.

**Where it's heading (D-007, D-009):** Docubil runs entirely in the user's
browser. Documents never leave their device, it installs without admin rights,
and the same build serves a free public site, a self-hosted copy, and an
installed app.

## Working model

- **Jeremy Shields:** product owner. Reviews, tests, and sets direction.
  Decides anything major (architecture, license, branding, cost, anything
  hard to reverse) by moving a `Proposed` entry in DECISIONS.md to `Accepted`.
- **Claude:** primary developer. Drives day-to-day implementation, audits,
  and hardening. Records every significant choice in DECISIONS.md. When a
  call is ambiguous or high-stakes, presents a recommendation with its
  trade-offs instead of guessing.

## How to read this plan

Each phase has a **goal**, a **scope** (what's in and, as importantly, what
isn't), and **success criteria**: checks that can be verified, all of which
must pass before the phase is marked done. A phase that can't meet its
criteria gets re-scoped here, in the open, rather than quietly declared done.

## Status at a glance

| Phase | Theme | Status |
|---|---|---|
| 0–4 | Audit, governance, CI hardening, frontend rebuild, GHCR releases | ✅ Done (v0.1.0) |
| 5 | Project foundations refresh | 🟡 In review |
| 6 | Accuracy baseline | 🟡 Defects fixed, corpus started (13/~30) |
| 7 | Browser-first core and installable app | Planned |
| 8 | Free public site | Planned, D-010 proposed |
| 9 | Windows desktop build | Conditional |
| — | Community growth | Ongoing |

---

## Completed

<details>
<summary>Phases 0–4 and runtime maintenance (Sept 2026)</summary>

**Phase 0, Audit & planning.** Found a license mismatch (AGPL text, MIT
metadata), an incomplete rebrand, committed output PDFs, 10 unused Python
packages, 8 `npm audit` findings, no governance docs, and CI covering only
lint and test. _Done when:_ the owner accepted the audit.

**Phase 1, Governance & rebrand.** AGPL-3.0-only everywhere (D-001), Docubil
everywhere (D-002), CONTRIBUTING/CODE_OF_CONDUCT/SECURITY, issue and PR
templates, CODEOWNERS, committed PDFs untracked (D-003). _Done when:_ all doc
links resolved, and lint and tests were green.

**Phase 2, Security & CI.** CodeQL (JS and Python), `npm audit` and
`pip-audit` gates, Dependabot, `requirements.txt` pruned to the two packages
actually used, `multer` 2.x. _Done when:_ every PR ran lint, test, CodeQL and
dependency audit, all green on `main`.

**Phase 3, Frontend rebuild.** React + Vite + Tailwind + Framer Motion
(D-004), keyboard and screen-reader navigable, `jest-axe` on every component.
_Done when:_ zero axe violations, enforced in CI.

**Phase 4, Release & distribution.** Multi-arch images on GHCR (D-005).
_Done when:_ `docker compose pull && up` against `ghcr.io/jshields-ca/docubil:0.1.0`
worked with no source checkout. _(Phase 5 found that this only held for a
volume that already existed: a fresh one failed at startup. Fixed, and
now covered by CI.)_

**Runtime maintenance.** Node 20 → 24 (D-006), the first Dependabot triage, a
real `pdf-parse` Buffer/Uint8Array bug fixed, and a `docker` build check added
to CI after the first v0.1.0 cut failed.

</details>

---

## Phase 5 — Project foundations refresh

**Goal:** Docubil is ready for outside contributors and users: clear docs, a
visible plan and decision history, structured intake, and a release process
that produces readable notes.

**Scope, in:**
- Release process moved to Changesets + written highlights, mirroring
  LatestArr (D-008): `.changeset/`, `scripts/write-changelog.mjs`,
  `scripts/build-release-notes.mjs`, `.github/release-highlights/`, and a
  Version-Packages release workflow.
- Issue forms: bug, feature, and a dedicated "wrong result" form for false
  positives and negatives, plus a PR template with security and accessibility
  checklists.
- DECISIONS.md (this plan's companion) and this rewrite of PLAN.md.
- The [browser-first spike](docs/spikes/browser-first.md) and its findings.
- Docs sweep: README, CONTRIBUTING, RELEASING, SECURITY in line with all of
  the above. `.env` untracked.
- Dependency triage: 16 Dependabot PRs resolved. 12 were merged (including
  Express 5, which also cleared a critical `proxy-addr` advisory that had
  turned `main` red), pino 10 was taken into this branch from #43, and 3 were
  closed with the reason recorded on each PR. Dependabot ignore rules cover
  the closed ones.
- Bugs found along the way, each fixed with a test that fails without the fix:
  - a fresh `docker-compose.release.yml` install couldn't start (root-owned
    `/data` volume), and local image builds baked in `.env` and host
    `node_modules` (no `.dockerignore`);
  - in Docker, reports were unreachable and never cleaned up (`REPORTS_DIR`
    ignored);
  - the Python-layer fixes were never saved into the downloaded PDF;
  - PDF-derived text was unescaped in the HTML report;
  - behind a reverse proxy, all users shared one rate limit (#58).

  CI now smoke-tests the built image with a fresh volume, so the first two
  can't come back unnoticed.

**Scope, out:** any change to analysis or remediation behaviour (Phase 6).

**Success criteria:**
1. `main` CI is green (lint, test, frontend, security, docker, CodeQL).
2. A dry run, `node scripts/build-release-notes.mjs <version>`, renders
   Highlights / What's changed / Upgrading / Full changelog for the pending
   release.
3. Every open Dependabot PR is merged, closed with a reason, or ignored
   with a comment in `dependabot.yml`.
4. Every relative doc link and anchor resolves, and no doc describes the old
   release process (`standard-version`, `npm run release`) as current or
   the license as anything but AGPL-3.0-only.
5. The owner has reviewed the PR and the `Proposed` decisions (D-010, D-011).

---

## Phase 6 — Accuracy baseline

**Goal:** Know how right Docubil is, and fix the ways it's known to be wrong,
before rebuilding it (Phase 7 needs this to prove the rebuild is at least as
good).

**Scope, in:**
- **A test corpus** under `tests/corpus/`: about 30 PDFs with known answers.
  It covers tagged/untagged, forms (flat and nested), figures with and without
  alt text, non-English text, bookmarks, low contrast, scanned images, signed,
  encrypted, and one large file (100+ pages). Sources: generated by our
  helpers, pdf.js's test corpus (Apache-2.0), and the PDF Association's PDF/UA
  reference suite where its license allows. Each file has a JSON file
  recording the expected findings.
- **A corpus runner** (`npm run corpus`) that reports, per check, true and
  false positives and negatives against those expected findings.
- **The known defects** found by the spike and the Phase 5 docs review, each
  its own issue and PR:
  1. Nested AcroForm fields not counted: 1 of 236 found on IRS Form 1040.
  2. Every image reported as missing alt text, even when the structure tree has it.
  3. `/MarkInfo/Marked` set on documents with no structure tree.
  4. Language hard-coded to `en` when remediating.
  5. Generated tooltips read machine names aloud (`"Please enter: topmostSubform[0]"`).
  6. Python analysis and remediation have no automated tests at all.
  7. A missing title is "fixed" with the placeholder `"Accessible Document"`,
     and the subject is set to `"Document processed for accessibility
     compliance"`. The first silences a WCAG 2.4.2 failure without fixing
     it; the second claims compliance nobody verified. A title should come
     from the document (first heading, or the file name), or be flagged.
- Swap `pdf-lib` for `@cantoo/pdf-lib` (D-011, if accepted).

**Scope, out:** new checks, UI changes, architecture changes.

**Progress (2026-10-17):** the seven defects are fixed with regression tests
(#51–#56; defect 6 by `tests/python/accuracy.test.js`). The corpus runner is
in place (`npm run corpus`, part of `npm test`) with 13 documents across 9
checks, and all of them currently pass: zero false positives or negatives.
The same corpus against the pre-fix code had 2 false positives and at least
18 remediation failures. Remaining: grow the corpus to about 30 documents
(gaps listed in `tests/corpus/README.md`), and `pdf-lib` → `@cantoo/pdf-lib`
once D-011 is decided.

**Success criteria:**
1. `npm run corpus` runs in CI on every PR and fails if any check's accuracy
   drops below the recorded baseline.
2. Zero false positives on the corpus for tagging, language, alt text and
   form-field checks (the ones users act on directly).
3. Each of the seven defects above has a regression test and is fixed, or is
   explicitly re-scoped in this plan with a reason.
4. Remediation never writes a value that misdescribes the document: covered
   by corpus tests that compare a remediated file's claims (`Marked`, `Lang`)
   with what the document actually contains.

---

## Phase 7 — Browser-first core and installable app

**Goal:** All analysis and remediation runs in the user's browser (D-007), and
Docubil can be installed and used offline without admin rights (D-009).

**Scope, in:**
- **7.1 Close the spike's open questions:** behaviour on signed and encrypted
  PDFs (warn before a rewrite invalidates a signature), whole-process memory
  under a 4 GB limit, scanned image-heavy files, and the bundle size
  `@cantoo/pdf-lib` adds. _Partly answered:_ a 200-page, 50 MB PDF analyzes
  and remediates in Chromium in 4.6 s (9.8 s with the CPU throttled 4×), and
  pdf.js's **legacy** build is required, because the modern build fails on
  Chromium 141 ([spike follow-up](docs/spikes/browser-first.md#follow-up-a-large-file-in-a-real-browser-2026-10-17)).
- **7.2 Core library:** `client/src/core/`, framework-free JS modules for
  analyze, remediate and report, running in a Web Worker so the UI stays
  responsive. They are ported from `AccessibilityAnalyzer`, `RemediationService`
  and `ReportGenerator`, and backed by the Phase 6 corpus.
- **7.3 UI switch:** the React app calls the core directly instead of `/api/*`.
  Reports and remediated PDFs are generated and downloaded locally.
- **7.4 Installable app:** a web app manifest plus a service worker that caches
  the app shell, so it installs from Edge or Chrome and works offline.
- **7.5 Server reduced to static hosting:** the Docker image serves the built
  app (nginx or Caddy instead of Express), and `/api/*` and the Python layer
  are removed once 7.2 passes the corpus. That release is the breaking-change
  boundary, called out under "Before you upgrade".

**Scope, out:** the public site (Phase 8), desktop packaging (Phase 9), new checks.

**Success criteria:**
1. **No document leaves the device:** a Playwright test runs a full
   analyze → remediate → download cycle and asserts that no network request
   happens after the app shell loads. It runs in CI.
2. **Works offline:** the same cycle passes in Playwright with the network
   disabled after the first load.
3. **Installs without admin:** installed as a PWA from Edge on a Windows 11
   standard (non-admin) account, and from Chrome on macOS and Ubuntu standard
   accounts, with no elevation prompt. Checked by hand once per release
   and recorded in the release PR.
4. **At least as accurate:** on the Phase 6 corpus, the browser core matches
   or beats the server path on every check.
5. **Usable on big files:** a 200-page, 50 MB PDF analyzes in under 60 s in
   Chromium on a 4 GB machine profile without the tab crashing.
6. Zero axe violations in CI, unchanged from Phase 3.

---

## Phase 8 — Free public site

**Goal:** Anyone can use Docubil from a URL, for free, with the same privacy
guarantee as running it locally (D-010).

**Scope, in:** static hosting (GitHub Pages or Cloudflare Pages) deployed from
each release, a custom domain, and a plain-language privacy page.

**Scope, out:** accounts, analytics, server-side processing.

**Success criteria:**
1. The deployed site passes Phase 7's no-network test, run against the live URL.
2. Hosting costs $0/month at the free tier, with the domain as the only cost.
3. The privacy page's claim ("your files never leave your device") is
   demonstrably true per criterion 1, and links to the test that proves it.

**Waiting on:** D-010 acceptance and a domain choice.

---

## Phase 9 — Windows desktop build (conditional)

**Goal:** A Windows build for workplaces that block PWA installation.

**Trigger:** start only if users report that PWA installs are blocked by their
organization's policies (issue label `install-blocked`). Until then the PWA
covers the need at no cost.

**Approach if triggered:** Tauri, wrapping the Phase 7 build and using the
system WebView2. That's a small binary with a per-user NSIS installer to
`%LOCALAPPDATA%`, so no admin rights. It also ships as a portable `.exe`, and
both are code-signed so SmartScreen doesn't block them.

**Success criteria (if triggered):** installs and runs on a Windows 11
standard account with no UAC prompt, passes Phase 7's no-network test, and
SmartScreen shows the publisher name.

---

## Ongoing — Community growth

Not a phase with an end date. Reviewed quarterly against real engagement:
"good first issue" labels on corpus and documentation work, i18n groundwork
(Docubil's own UI, and the non-English documents it checks), contributor
onboarding polish, and a lightweight docs site once there's enough to warrant it.

## Versioning & release notes

SemVer; while the major version is `0`, breaking changes may land in minor
releases. Changes are recorded as Changesets, and each GitHub Release opens
with human-written highlights (D-008). See [RELEASING.md](RELEASING.md).
