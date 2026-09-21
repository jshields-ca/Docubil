# Contributing to Docubil

Thanks for your interest in contributing! Docubil aims to bring PDF
accessibility to any workspace, community, or use case, and community
contributions are what make that possible.

## License and what it means for you

Docubil is licensed under the **GNU Affero General Public License v3.0
(AGPL-3.0-only)** — see [LICENSE](LICENSE).

By submitting a contribution (a pull request, patch, or other content
intended for inclusion in the project), you agree that it is licensed
under the same AGPL-3.0-only terms as the rest of the project. In practice
this means:

- Anyone can use, study, and modify Docubil's source.
- If someone runs a modified version of Docubil as a network service
  (e.g. a hosted SaaS), they must make the modified source available to
  the users of that service. This is the key difference from a permissive
  license like MIT — it's designed to keep improvements to Docubil (and
  services built on it) in the open.
- You keep copyright over your own contributions; you're licensing them
  under AGPL-3.0-only, not assigning them away.

If your employer or institution has a policy on open-source contributions,
please confirm you're clear to contribute under these terms before
submitting a PR.

## Getting started

### Prerequisites

- Node.js 24+ and npm (see `engines` in `package.json`; CI and the Docker
  image both run on Node 24)
- Python 3.11+ (for the accessibility analysis/remediation engine)
- Git

### Setup

```bash
git clone https://github.com/jshields-ca/Docubil.git
cd Docubil
npm install
pip install -r requirements.txt
cp .env.example .env
npm run dev
```

That starts the backend on http://localhost:3000, but `public/` (the
built frontend) is generated output and isn't tracked in git, so a fresh
clone has no UI to serve yet. For frontend work, run the frontend dev
server alongside the backend in a second terminal instead — it proxies
API calls to the backend with hot reload:

```bash
cd client
npm install
npm run dev
```

Open the URL Vite prints (typically http://localhost:5173). See
[`client/README.md`](client/README.md) for frontend-specific details. If
you only need a built UI (not editing the frontend), `npm run build` from
the repo root builds it into `public/` once.

### Running checks locally

```bash
npm run lint       # ESLint
npm run format     # Prettier
npm test           # Jest test suite
npm run test:coverage
```

If you touched `client/`, run its checks too (includes `jest-axe`
accessibility assertions on every component):

```bash
cd client
npm run lint
npm test
npm run build      # confirms the production build still succeeds
```

All of these run in CI on every pull request — please run them locally
first so review cycles aren't spent on things a linter or test run would
have caught.

## Making a change

1. Fork the repository and create a feature branch off `main`:
   `git checkout -b feature/short-description`
2. Make your change. Keep pull requests focused — one logical change per
   PR is much easier to review than a large mixed one.
3. Add or update tests for any behavior change. PRs that reduce test
   coverage on touched code will be asked to add tests before merge.
4. Run `npm run lint && npm test` and confirm both pass.
5. Commit using [Conventional Commits](https://www.conventionalcommits.org/)
   format (`feat:`, `fix:`, `docs:`, `chore:`, etc.) — you can run `npx cz`
   for a guided commit message. This drives automatic changelog generation.
6. Push your branch and open a pull request against `main`, describing
   what changed and why.

## Reporting bugs and requesting features

Please use the issue templates under **Issues → New Issue**. Before
opening a new issue, search existing issues to avoid duplicates.

For security vulnerabilities, do **not** open a public issue — see
[SECURITY.md](SECURITY.md) instead.

## Code style

- Follow the existing ESLint/Prettier configuration; don't introduce new
  style rules without discussion.
- Keep functions and services focused; this codebase favors small,
  testable services (see `src/services/`) over large monolithic files.
- Comment the *why*, not the *what* — code should be readable enough that
  comments explaining what a line does aren't necessary.

## Releasing

Cutting a new version is a maintainer task — see [RELEASING.md](RELEASING.md).

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md).
By participating, you're expected to uphold it.
