# Decision log

Decisions that shape Docubil and would be expensive to reverse: architecture,
licensing, distribution, process. Each entry records what was decided, why,
and what it costs, so nobody has to dig through old PRs to find out why
something is the way it is.

**Statuses:** `Accepted` (in force) · `Proposed` (recommended, waiting on the
product owner) · `Superseded by D-NNN` (kept for history, no longer in force).

**Adding one:** copy the template at the bottom, take the next number, and
open it as `Proposed` in the PR that needs the decision. The product owner
moves it to `Accepted`. Never renumber or delete an entry. Supersede it instead.

| ID | Decision | Status | Date |
|---|---|---|---|
| [D-001](#d-001) | License under AGPL-3.0-only | Accepted | 2026-09-20 |
| [D-002](#d-002) | Rename the project to Docubil | Accepted | 2026-09-20 |
| [D-003](#d-003) | Untrack committed output PDFs instead of rewriting history | Accepted | 2026-09-20 |
| [D-004](#d-004) | Rebuild the frontend in React + Vite + Tailwind | Accepted | 2026-09-20 |
| [D-005](#d-005) | Distribute as multi-arch images on GHCR | Accepted | 2026-09-20 |
| [D-006](#d-006) | Run on the Active LTS Node release only | Accepted | 2026-09-21 |
| [D-007](#d-007) | Move processing into the browser | Accepted | 2026-10-17 |
| [D-008](#d-008) | Release with Changesets and written highlights | Accepted | 2026-10-17 |
| [D-009](#d-009) | Installable web app first, Windows desktop build later | Accepted | 2026-10-17 |
| [D-010](#d-010) | Offer a free public site that never receives files | Proposed | 2026-10-17 |
| [D-011](#d-011) | Replace `pdf-lib` with the maintained `@cantoo/pdf-lib` fork | Proposed | 2026-10-17 |

---

### D-001

**License under AGPL-3.0-only** · Accepted · 2026-09-20

**Context.** The project started under MIT, but the goal is accessibility for
everyone, and a permissive license lets a company host a modified Docubil as a
paid service without sharing its improvements.

**Decision.** AGPL-3.0-only for all code. Contributions come in under the same
terms (inbound = outbound), and there's no CLA.

**Consequences.** Anyone running a modified Docubil as a network service must
offer its source to that service's users. Some companies won't contribute
under the AGPL. Relicensing later needs every contributor's agreement, which
gets harder as contributors are added.

### D-002

**Rename the project to Docubil** · Accepted · 2026-09-20

**Context.** "PDF Accessibility Tool" (`pdf-accessibility`) was a description,
not a name: hard to search for and impossible to brand.

**Decision.** Docubil everywhere: package, image, container, docs.

**Consequences.** It was a breaking change for anyone running the old image or
container names (noted in 0.1.0's changelog).

### D-003

**Untrack committed output PDFs instead of rewriting history** · Accepted · 2026-09-20

**Context.** Eight remediated PDFs had been committed under `output/` before
it was gitignored.

**Decision.** Remove them from tracking going forward. Don't rewrite history.

**Consequences.** They remain reachable in old commits. A history rewrite would
have broken every existing clone and fork for files that held no sensitive
content.

### D-004

**Rebuild the frontend in React + Vite + Tailwind** · Accepted · 2026-09-20

**Context.** The original UI was about 1,450 lines of dated vanilla HTML/CSS/JS
with no accessibility testing.

**Decision.** A full rebuild in React + Vite + Tailwind, with Framer Motion
for motion and `jest-axe` checks on every component in CI.

**Consequences.** It adds a build step and a second `package.json` (`client/`).
It also makes D-007 practical: the processing code can move into this app.

### D-005

**Distribute as multi-arch images on GHCR** · Accepted · 2026-09-20

**Context.** Self-hosters shouldn't need a source checkout to run Docubil.

**Decision.** Every release publishes `ghcr.io/jshields-ca/docubil:X.Y.Z` and
`:latest` for amd64 and arm64.

**Consequences.** Docker is the only supported way to self-host until D-007 and
D-009 deliver alternatives. Docker Desktop needs admin rights on Windows and
macOS, which rules it out for many people on work machines.

### D-006

**Run on the Active LTS Node release only** · Accepted · 2026-09-21

**Context.** Node 20 reached end-of-life in April 2026. Dependabot keeps
proposing the newest Node image, including releases that aren't LTS yet.

**Decision.** The Docker image, CI, and `engines.node` all track the current
Active LTS release (Node 24). Major Node bumps are made by hand, together, and
Dependabot's major bumps of the `node` image are ignored.

**Consequences.** Node 26 waits until it becomes LTS and has been verified.
The move is a deliberate PR each time, never an automated one.

### D-007

**Move processing into the browser** · Accepted · 2026-10-17

**Context.** People want to check PDFs at work without installing software
(often impossible without admin rights) and without uploading documents to
someone else's server. Today every PDF goes to a Node server, and the deepest
checks need Python plus two native libraries on that server.

**Decision.** Analysis and remediation move into the browser using `pdfjs-dist`
and a maintained `pdf-lib` (see D-011). The [browser-first spike](docs/spikes/browser-first.md)
showed every check the Python layer makes can be done in the browser, more
accurately in three places. The Express server shrinks to serving static files
(and can then disappear), and the Python layer retires once the browser
version matches or beats it on the test corpus (PLAN.md, Phase 7).

**Consequences.**
- PDFs never leave the user's device: a privacy guarantee that can be
  verified, not just a policy.
- The same build serves the public site, a self-hosted copy, and an
  installed app. There's no per-document server cost, which is what makes
  D-010 affordable.
- Large documents are limited by the user's browser memory, not a server's.
- The REST API (`/api/*`) has no future in this design. If someone needs
  server-side batch processing later, it becomes a separate CLI built on the
  same browser-capable core.

### D-008

**Release with Changesets and written highlights** · Accepted · 2026-10-17

**Context.** `standard-version` built the changelog from commit messages, which
produced developer-facing text and broke whenever a squash-merged PR title
wasn't conventional (as happened for 0.1.0). LatestArr's process gives readers
a plain-language summary and keeps technical detail out of the way.

**Decision.** Mirror LatestArr's process:
- Every user-visible PR adds a changeset with a bold category tag (New,
  Improved, Fixed, Security) and a collapsed "Technical details" block.
- A bot-maintained "Version Packages" PR collects them.
- A human writes `.github/release-highlights/vX.Y.Z.md` before merging it.
- Merging cuts the tag, the GitHub Release and the image. See RELEASING.md.

**Consequences.** Contributors write one short changeset per PR. Releases need
a few minutes of human writing, which is deliberate. Conventional Commit PR
titles are still the convention, but nothing depends on them any more.

### D-009

**Installable web app first, Windows desktop build later** · Accepted · 2026-10-17

**Context.** Many intended users are on locked-down work PCs: no admin rights,
no Docker, sometimes no unsigned executables.

**Decision.** Phase 7 ships Docubil as an installable web app (a PWA):
installing it from Edge or Chrome needs no admin rights, and it works offline.
A Windows desktop build (Tauri, per-user installer, signed) is a later phase,
and only if PWA installs turn out to be blocked in practice.

**Consequences.** There's no `.exe` in the near term. Code signing (roughly
US$100–400 a year) is only spent if the desktop build is needed.

### D-010

**Offer a free public site that never receives files** · Proposed · 2026-10-17

**Context.** Most users won't self-host. The owner's concern was that a public
site would cost a lot in bandwidth and processing.

**Decision (proposed).** After D-007, host the built app as a static site
(GitHub Pages or Cloudflare Pages, both free for this size). The user's own
browser does the processing, so hosting cost doesn't grow with documents
processed. Each visitor downloads the app once, about 0.9 MB gzipped as
measured (the UI 117 KB, pdf.js legacy build 144 + 382 KB, pdf-lib 175–244 KB),
and then it's cached.

**Consequences.** Needs a domain decision and a privacy statement that says,
truthfully, "your files never leave your device". No analytics that could
undermine that statement. **Waiting on the owner:** the domain, and whether
the site launches as soon as Phase 7 ships (Phase 8 in PLAN.md).

### D-011

**Replace `pdf-lib` with the maintained `@cantoo/pdf-lib` fork** · Proposed · 2026-10-17

**Context.** `pdf-lib` hasn't had a release since 1.17.1 (May 2022), and both
today's server and the planned browser version depend on it. `@cantoo/pdf-lib`
(2.11.1, September 2026) is an actively maintained fork with the same API. The
spike ran on it without code changes.

**Decision (proposed).** Swap it in at the start of Phase 6, behind the existing tests.

**Consequences.** One dependency changes owner. It also pulls in `culori` and
`node-html-better-parser` for features we don't use. Measured in a Vite
production build, it costs **+69 KB gzipped** (244 KB against 175 KB), about 8%
of the whole browser app (~0.9 MB). That's the price of a maintained library
instead of one with no release since 2022.

---

<details>
<summary>Template</summary>

```markdown
### D-NNN

**Short imperative title** · Proposed · YYYY-MM-DD

**Context.** What forces the decision. Facts, not opinions.

**Decision.** What we'll do.

**Consequences.** What it costs, what it rules out, what follows from it.
```

</details>
