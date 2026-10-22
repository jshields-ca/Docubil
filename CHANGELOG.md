# Changelog

All notable changes to Docubil are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).
While the major version is `0`, breaking changes may still land in minor
releases.

Releases are cut with [Changesets](https://github.com/changesets/changesets);
see `CONTRIBUTING.md` for how to add a changeset to a PR, and `RELEASING.md`
for how a release is made.

## [0.2.0] - 2026-10-22

### Security

- Includes the fix for an IP-spoofing advisory in a library the web server uses to read client addresses. Docubil's default setup wasn't exposed, because it doesn't trust proxy headers. ([#66](https://github.com/jshields-ca/Docubil/pull/66))

  <details>
  <summary>Technical details</summary>

  `proxy-addr` ≤ 2.0.7 ([GHSA-jqcg-44mw-7w3h](https://github.com/advisories/GHSA-jqcg-44mw-7w3h), critical) mis-handles IPv4-mapped IPv6 addresses in a configured trust subnet. It's only reachable with Express's `trust proxy` set, which `server.js` never sets. The Express 5 upgrade resolves `proxy-addr` 2.0.8. Flagged by the `npm audit` CI gate, which had turned `main` red.

  </details>

### Improved

- Docubil now runs on Node.js 24, the current long-term support release, and on version 5 of its web server framework. Nothing changes if you run the Docker image. Running from source now needs Node.js 24 or newer. ([#66](https://github.com/jshields-ca/Docubil/pull/66))

  <details>
  <summary>Technical details</summary>

  - Docker image and every CI job moved from Node 20 (end-of-life April 2026) to Node 24, with `engines.node: ">=24"` in both `package.json` files. Node majors are now bumped by hand together (DECISIONS.md, D-006).
  - `express` 4 → 5. No route uses the path syntax Express 5 changed (wildcards, optional params), and `express.urlencoded` already set `extended` explicitly. Verified with the full test suite plus a boot and upload smoke test on Node 24.
  - Routine bumps: `helmet` 8, `express-rate-limit` 8, `pino-http` 11, `dotenv` 18, `pikepdf` 10.16, and the client's Vite/Vitest toolchain.

  </details>

## [0.1.0] - 2026-09-20

### Added
- Real critical/moderate/minor severity breakdown in `/api/analyze` and `/api/remediate` responses, plus per-issue fixed/remaining detail, replacing a hardcoded proportional guess in the old UI.
- Full frontend rebuild: React + Vite + Tailwind CSS + Framer Motion, replacing the vanilla HTML/CSS/JS app, with accessibility (Vitest + Testing Library + jest-axe) enforced in CI.
- CodeQL scanning, `npm audit` / `pip-audit` CI gates, and Dependabot for npm, pip, GitHub Actions, and Docker.
- `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, GitHub issue/PR templates, and `CODEOWNERS`.
- `PLAN.md`, a phased roadmap tracking project direction for contributors.
- Multi-stage Docker build and a release pipeline publishing versioned, multi-arch images to GitHub Container Registry (see [RELEASING.md](RELEASING.md)).

### Changed
- **BREAKING**: Renamed the project from "PDF Accessibility Tool" (`pdf-accessibility`) to **Docubil**. Updated package name, Docker image/container names, and all documentation references.
- **BREAKING**: Relicensed from MIT to AGPL-3.0-only.

### Fixed
- Resolved all `npm audit` findings in production dependencies (`multer` 1.x→2.x, `uuid` 9.x→11.1.1) and all `pip-audit` findings (`pdfplumber` upgrade, which pulled in a patched `pdfminer.six`).

### Security
- Removed 8 previously committed remediated PDF files from git tracking under `output/`.
- Pruned `requirements.txt` from 12 packages to the 2 actually imported by the analysis code, reducing image size and attack surface.

## [0.0.1] - 2025-07-18
- Initial public release: PDF Accessibility Tool with automated PDF analysis, WCAG AA/AAA compliance, remediation, and reporting. 