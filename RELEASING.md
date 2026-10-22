# Releasing Docubil

For maintainers. Contributors only need to add a changeset to their PR (see
[CONTRIBUTING.md](CONTRIBUTING.md#writing-a-changeset)).

Docubil follows [Semantic Versioning](https://semver.org/) and keeps a
[Keep a Changelog](https://keepachangelog.com/)-style `CHANGELOG.md`, managed
with [Changesets](https://github.com/changesets/changesets). The process
mirrors LatestArr's (DECISIONS.md, [D-008](DECISIONS.md#d-008)). While the
major version is `0`, breaking changes may land in minor releases.

## How a release happens

Nothing is run by hand. A maintainer's job is to write the highlights, then
review and merge one PR.

1. **PRs land on `main` carrying changesets** (`.changeset/*.md`), one per
   user-visible change.
2. **`.github/workflows/release.yml` keeps a "chore: version packages" PR
   open** while changesets are pending. Each push to `main` rebuilds it by
   running `npm run version-packages`, which:
   - writes one consolidated `CHANGELOG.md` entry for the next version
     (`scripts/write-changelog.mjs`), grouped under Security / New /
     Improved / Fixed and linked to each PR;
   - bumps `package.json` (`changeset version`), deletes the consumed
     changesets, and syncs `package-lock.json`.
3. **Write the release highlights on that PR** (below). The **Release
   highlights** CI check stays red until you do.
4. **Merge it.** That push has no pending changesets and an untagged
   version, so the same workflow:
   - builds and pushes `ghcr.io/jshields-ca/docubil:X.Y.Z` and `:latest`
     (amd64 + arm64);
   - only once the image is pushed, creates tag `vX.Y.Z` and a GitHub
     Release whose body is built by `scripts/build-release-notes.mjs`.

**The Version Packages PR is pushed with `GITHUB_TOKEN`**, which doesn't
trigger other workflows, so CI won't run on it by itself. Close and reopen
the PR to run the required checks before merging.

### Bump types

When running `npx changeset`: `patch` for fixes, `minor` for new features
or anything a self-hoster must act on (pre-1.0), `major` reserved for 1.0
and deliberate breaking changes after it. The release takes the highest
bump among its changesets.

### Batch releases around a theme

Hold the Version Packages PR open and let related work accumulate, then
merge when there's a coherent story to tell. A release with a clear "why"
reads as intentional; a trickle of thinly described patch releases reads as
noise. The exception is an urgent fix (a real bug, a security issue) that
shouldn't wait for unrelated work.

## Release highlights

Every release opens with a short **Highlights** section written by a person:
a one-line theme in bold, then two to four plain-language bullets on what
matters most to someone checking or fixing PDFs. For a release that changed
the UI, add a screenshot. It lives in `.github/release-highlights/vX.Y.Z.md`.

1. The release workflow comments on the Version Packages PR with a **Write
   the highlights** link. It opens GitHub's editor on that PR's branch with
   the file already named and the template
   (`.github/release-highlights/TEMPLATE.md`) filled in.
2. Replace the template's comments with the highlights and commit. The
   check turns green and the comment switches to ✅.
3. Merge the PR.

**Write them last.** changesets/action rebuilds the PR branch from `main`
whenever another PR merges, which drops the file; the comment and the red
check come back when that happens. (Committing the file to `main` in a
normal PR also works if you already know the version number.)

Breaking changes or manual upgrade steps go under a `### Before you upgrade`
heading in the same file.

## Release notes are built, not copied

The GitHub Release body is assembled from:

| Section | Source |
|---|---|
| Highlights | `.github/release-highlights/vX.Y.Z.md` |
| What's changed | That version's `CHANGELOG.md` section, with each "Technical details" block removed |
| Upgrading | `docker pull` and Compose lines for the new image |
| Full changelog | Compare link from the previous tag, plus a link to `CHANGELOG.md` |

`CHANGELOG.md` keeps the technical detail, collapsed, for contributors.
Preview the notes locally at any time:

```bash
node scripts/build-release-notes.mjs 0.2.0
```

…and preview what the next version's changelog entry will look like by
running `npm run version-packages` on a throwaway branch.

## After a release

Do a quick full docs pass for anything the release made stale: `README.md`
(features, screenshots), `CONTRIBUTING.md`, `PLAN.md` (phase status), and
`docs/`, not just the files the release's own PRs touched.

## First-time setup

These repository settings must be on for the workflow to work (see also
`.github/REPOSITORY_SETTINGS.md`):

- **Settings → Actions → General → Workflow permissions:** "Read and write
  permissions", and **"Allow GitHub Actions to create and approve pull
  requests"** (changesets/action opens the Version Packages PR).
- **GHCR package visibility:** after the first image push, check under
  **your profile → Packages → docubil → Package settings** that it's public.

## History

`v0.1.0` (2026-09-20) was cut by hand: `standard-version` couldn't see the
hand-written `[Unreleased]` notes, so the section was renamed, the version
bumped with `npm version`, and the tag pushed, which triggered the old
tag-based workflow. Releases after it use the flow above. The pending
`[Unreleased]` notes were converted into changesets when the switch was made.

`v0.1.0` is kept as published: deleting a release, its tag and its image
breaks anyone who pinned it, and leaves `CHANGELOG.md` pointing at nothing.
It has known problems, all fixed for 0.2.0: a fresh Docker volume fails to
start, reports 404 in Docker, and most automatic fixes aren't saved into the
downloaded PDF. Its GitHub Release carries a "Known issues" note saying so.
