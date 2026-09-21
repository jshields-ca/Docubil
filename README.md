# Docubil

[![CI](https://img.shields.io/github/actions/workflow/status/jshields-ca/Docubil/ci.yml?branch=main&label=CI)](https://github.com/jshields-ca/Docubil/actions)
[![CodeQL](https://img.shields.io/github/actions/workflow/status/jshields-ca/Docubil/codeql.yml?branch=main&label=CodeQL)](https://github.com/jshields-ca/Docubil/actions)
[![License](https://img.shields.io/github/license/jshields-ca/Docubil)](LICENSE)
[![Version](https://img.shields.io/github/package-json/v/jshields-ca/Docubil)](package.json)
[![Issues](https://img.shields.io/github/issues/jshields-ca/Docubil)](https://github.com/jshields-ca/Docubil/issues)
[![Contributors](https://img.shields.io/github/contributors/jshields-ca/Docubil)](https://github.com/jshields-ca/Docubil/graphs/contributors)

Docubil brings PDF accessibility to any workspace, community, or use case. It analyzes PDFs against WCAG 2.1 AA/AAA, automatically fixes what can be fixed safely, and clearly flags what still needs a human — so everyone has equal access to data, forms, and PDF-based documents.

---

## Contents

- [Quick start (Docker)](#quick-start-docker)
- [Features](#features)
- [What gets fixed automatically](#what-gets-fixed-automatically)
- [Development setup](#development-setup)
- [API](#api)
- [Architecture](#architecture)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Contributing](#how-to-contribute)
- [License](#license)

---

## Quick start (Docker)

No clone, no local Node/Python setup — pull and run the published image:

```bash
curl -O https://raw.githubusercontent.com/jshields-ca/Docubil/main/docker-compose.release.yml
docker compose -f docker-compose.release.yml pull
docker compose -f docker-compose.release.yml up -d
```

Then open **http://localhost:3000**.

Every tagged release (`vX.Y.Z`) is published as a multi-arch (amd64/arm64) image to [GitHub Container Registry](https://github.com/jshields-ca/Docubil/pkgs/container/docubil). See [Releases](https://github.com/jshields-ca/Docubil/releases) for version history, or edit the image tag in the compose file to pin a specific version instead of `latest`.

Want to build from source or contribute code instead? See [Development setup](#development-setup) below.

## Features

- 🔍 **Automated PDF Analysis** — real WCAG evaluation via a Python bridge (pikepdf + pdfplumber), not a placeholder checklist
- ♿ **WCAG 2.1 AA & AAA** — choose the compliance level per analysis
- 🔧 **Automatic Remediation** — fixes what's safe to fix (metadata, tagging, language, form tooltips); honestly flags what needs a human (alt text, reading order, complex tables)
- 📊 **Detailed Reports** — HTML, JSON, and CSV export, with real per-issue severity and fix status
- 🧭 **Interactive API Docs** — full OpenAPI 3.0 spec browsable at `/api/docs`
- 🚀 **Modern, Accessible Frontend** — React + Vite + Tailwind CSS + Framer Motion, itself tested with `jest-axe` in CI so the tool practices what it preaches
- 🔒 **Security First** — rate limiting, magic-bytes validation, automatic file cleanup, CodeQL + dependency-audit CI gates

## Supported Standards

- **WCAG 2.1 AA** — standard compliance level required by most accessibility regulations
- **WCAG 2.1 AAA** — enhanced accessibility with stricter requirements
- **PDF/UA** — PDF Universal Accessibility compatibility

## What gets fixed automatically

### ✅ Automatic fixes
- Missing document metadata (title, subject, language)
- Basic document structure and tagging
- Form field accessibility attributes (tooltips)
- Document outline/bookmarks

### ⚠️ Flagged for manual review
- Alternative text for images (needs human context)
- Color contrast verification
- Reading order and complex table structures
- Context-specific content descriptions

Docubil never silently claims a fix it didn't actually make — see `remainingIssuesDetail` in the [API](#api) response.

## Development setup

### Prerequisites

- **Node.js 24+** and npm (see `engines` in `package.json`; the Docker image and CI both run on Node 24)
- **Python 3.11+** (for the PDF analysis/remediation bridge)
- Git

### Setup

```bash
git clone https://github.com/jshields-ca/Docubil.git
cd Docubil
npm install
pip install -r requirements.txt
cp .env.example .env   # edit as needed
```

### Run it

Backend:
```bash
npm run dev
```

Frontend, in a second terminal — Vite proxies API calls to the Express server so both run with hot reload:
```bash
cd client
npm install
npm run dev
```

Open the URL Vite prints (typically http://localhost:5173). See [`client/README.md`](client/README.md) for frontend-specific details.

### Build for production

```bash
npm run build
```

Builds the frontend straight into `public/`, which Express serves as static files. This runs automatically as part of the Docker image build — you don't need to run it by hand for the Docker path above.

### Tests & lint

```bash
npm test && npm run lint          # backend
cd client && npm test && npm run lint   # frontend (includes jest-axe accessibility checks)
```

## API

Full interactive documentation (Swagger UI) is served at **`/api/docs`** once the server is running, with the raw OpenAPI 3.0 spec at `/api/docs.json`. Summary of the main endpoints:

### Upload and analyze
```http
POST /api/analyze
Content-Type: multipart/form-data

pdf: <file>          # PDF, max 50MB
wcagLevel: "AA"      # or "AAA"
```

### Remediate
```http
POST /api/remediate/:jobId
Content-Type: application/json

{ "autoFix": true }
```

### Download the remediated PDF
```http
GET /api/download/:jobId
```

### Job status
```http
GET /api/status/:jobId
```

### Reports
```http
GET /api/report/:jobId/json
GET /api/report/:jobId/csv
```

### Health check
```http
GET /health
```

### Programmatic example

```javascript
const formData = new FormData();
formData.append('pdf', pdfFile);
formData.append('wcagLevel', 'AA');

const { jobId } = await fetch('/api/analyze', { method: 'POST', body: formData })
  .then((r) => r.json());

const result = await fetch(`/api/remediate/${jobId}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ autoFix: true }),
}).then((r) => r.json());
```

## Architecture

```
Docubil/
├── server.js                      # Express server, route wiring
├── src/
│   ├── openapi.js                 # OpenAPI 3.0 spec (served at /api/docs)
│   ├── logger.js                  # pino structured logging
│   ├── db.js                      # file-backed JSON job store
│   ├── services/
│   │   ├── PDFProcessor.js        # metadata/text extraction (pdf-lib + pdf-parse)
│   │   ├── AccessibilityAnalyzer.js  # WCAG analysis orchestration
│   │   ├── PythonBridge.js        # spawns the Python analysis/remediation scripts
│   │   ├── RemediationService.js  # applies safe automatic fixes (pdf-lib + pikepdf)
│   │   └── ReportGenerator.js     # HTML report rendering
│   └── python/
│       ├── analyze_pdf.py         # real WCAG checks via pikepdf + pdfplumber
│       └── remediate_pdf.py       # tagging/metadata/form-tooltip remediation
├── client/                        # Frontend source (React + Vite + Tailwind)
│   └── src/
├── public/                        # Built frontend output (generated, not tracked in git)
├── uploads/ · output/ · reports/  # Temporary storage, auto-cleaned on a schedule
├── package.json                   # Node.js dependencies
└── requirements.txt                # Python dependencies
```

Analysis and remediation degrade gracefully: if the Python bridge is unavailable, `PythonBridge.js` returns `null` rather than throwing, and the pipeline falls back to what `pdf-lib`/`pdf-parse` alone can determine.

## Configuration

Copy `.env.example` to `.env` and adjust as needed — it documents every variable (server port, file size/retention limits, CORS origins, rate limiting, the Python interpreter path, log level). Key defaults:

- **File upload**: 50 MB maximum, PDF files only (validated by magic bytes, not just extension)
- **Rate limiting**: 100 requests per 15 minutes per IP (configurable)
- **File cleanup**: uploaded/output files deleted after 24 hours by a scheduled job
- **CORS**: allow-listed origins via `ALLOWED_ORIGINS`, not wide open by default in production
- **CSP**: Helmet-managed Content Security Policy headers

## Deployment

**Docker (recommended)** — see [Quick start](#quick-start-docker) above for the no-clone path, or build from source for development:

```bash
git clone https://github.com/jshields-ca/Docubil.git
cd Docubil
docker compose up -d --build
```

See [RELEASING.md](RELEASING.md) if you're cutting a new release.

**Manual Node deployment** — if you'd rather not use Docker, run the server directly behind a process manager and reverse proxy:

```bash
NODE_ENV=production PORT=80 npm install -g pm2
pm2 start server.js --name docubil
```

Then configure nginx, Caddy, or similar to proxy requests to the Node process. You are responsible for the Python 3.11+ environment and dependencies in this path — the Docker image handles that for you.

## Browser support

Chrome 80+, Firefox 75+, Safari 13+, Edge 80+.

## How to contribute

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes, with tests
4. Run tests and lint (both `npm test && npm run lint` in the root **and** in `client/`)
5. Commit using [Conventional Commits](https://www.conventionalcommits.org/) — `npx cz` will guide you — since PR titles become the changelog entry on merge
6. Push and open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide, [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for community expectations, and [PLAN.md](PLAN.md) for the project roadmap and current phase.

## Community & support

- [Open an issue](https://github.com/jshields-ca/Docubil/issues) for bugs or feature requests
- [Discussions](https://github.com/jshields-ca/Docubil/discussions) for Q&A and ideas
- [Changelog](CHANGELOG.md) for release history
- [SECURITY.md](SECURITY.md) for reporting a vulnerability privately

## License

GNU Affero General Public License v3.0 (AGPL-3.0) — see [LICENSE](LICENSE) for details.

Docubil is copyleft software: if you run a modified version of Docubil as a network service, you must make your modified source available to its users. See [CONTRIBUTING.md](CONTRIBUTING.md) for what this means for contributors.

---

Built with ❤️ for universal accessibility by Jeremy Shields.
