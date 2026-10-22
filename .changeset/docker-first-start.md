---
"docubil": patch
---

**Fixed:** A fresh install with `docker-compose.release.yml` failed to start ("permission denied" creating its data folders). It starts normally now. Locally built images also no longer pick up your `.env` file or local test files.

<details>
<summary>Technical details</summary>

- The compose files mount a named volume at `/data`, but `/data` didn't exist in the image, so Docker created the volume root-owned and the non-root `appuser` (uid 1001) couldn't `mkdir /data/uploads`. The Dockerfile now creates `/data` owned by `appuser`, and Docker copies that ownership into new volumes. An existing volume that already works is unaffected. A host bind mount needs to be writable by uid 1001.
- New `.dockerignore`: `COPY . .` used to copy `.env`, `.git`, host `node_modules` (replacing the image's production install), `uploads/`/`output/`/`reports/` contents and tests into locally built images. Published images were built from a clean CI checkout, so only `.git` and tests ended up in them.
- CI's `docker` job now starts the built image with a fresh `/data` volume and waits for `/health`.
- Verified locally: the image built, then analyze → report (200) → JSON export (200) → remediate → download on the IRS 1040, with fixes present in the downloaded file.

</details>
