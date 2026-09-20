# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

## [0.0.1] - YYYY-MM-DD
- Initial public release: PDF Accessibility Tool with automated PDF analysis, WCAG AA/AAA compliance, remediation, and reporting. 