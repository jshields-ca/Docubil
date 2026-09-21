# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Migrated the Docker image and all CI workflows from Node 20 (end-of-life April 2026) to Node 24 (current Active LTS), with an explicit `engines.node` floor in both `package.json` files.
- Routine dependency maintenance: bumped `helmet`, `express-rate-limit`, `pino-http`, `dotenv`, `jest`, `husky`, `lint-staged`, `pikepdf`, and several `client/` and GitHub Actions dependencies to their latest compatible major versions (each verified against real installs/test runs, not just changelogs, before merging).

### Fixed
- `PDFProcessor`'s text extraction (`pdf-parse`) could intermittently fail with a spurious "bad XRef entry" on a well-formed PDF, depending on the JS engine/module loader's handling of `Buffer` vs. `Uint8Array` — fixed by normalizing the input type before parsing.
- The `v0.1.0` Docker image build failed on its first cut: `npm ci --omit=dev` runs the `prepare` script regardless of `--omit=dev`, and `husky` (a devDependency) wasn't installed to satisfy it. Fixed, and re-cut successfully.

### Added
- A `docker` CI job that builds the image on every pull request (validation only, never pushed) so a broken Dockerfile fails a PR instead of a release.

### Documentation
- Updated `README.md`, `CONTRIBUTING.md`, `RELEASING.md`, `PLAN.md`, and `.github/REPOSITORY_SETTINGS.md` to reflect the Node 24 migration, the actual `v0.1.0` release history, and gaps found in a documentation audit.

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