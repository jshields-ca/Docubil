---
"docubil": minor
---

**Improved:** Docubil now runs on Node.js 24, the current long-term support release, and on version 5 of its web server framework. Nothing changes if you run the Docker image. Running from source now needs Node.js 24 or newer.

<details>
<summary>Technical details</summary>

- Docker image and every CI job moved from Node 20 (end-of-life April 2026) to Node 24, with `engines.node: ">=24"` in both `package.json` files. Node majors are now bumped by hand together (DECISIONS.md, D-006).
- `express` 4 → 5. No route uses the path syntax Express 5 changed (wildcards, optional params), and `express.urlencoded` already set `extended` explicitly. Verified with the full test suite plus a boot and upload smoke test on Node 24.
- `pdf-lib` (no release since 2022) replaced by its maintained fork `@cantoo/pdf-lib` 2.11, which has the same API (DECISIONS.md, D-011).
- Routine bumps: `pino` 10 (taken in directly from Dependabot PR #43), `helmet` 8, `express-rate-limit` 8, `pino-http` 11, `dotenv` 18, `pikepdf` 10.16, and the client's Vite/Vitest toolchain.

</details>
