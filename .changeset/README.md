# Changesets

Each Markdown file here describes one user-visible change waiting for the next
release. Add one to your PR with `npx changeset` (pick `docubil`, then the bump
type), then rewrite its body following
[CONTRIBUTING.md, "Writing a changeset"](../CONTRIBUTING.md#writing-a-changeset).

`scripts/write-changelog.mjs` turns these files into the next `CHANGELOG.md`
entry when the release workflow versions them, and `changeset version` then
deletes them. Changesets' own changelog writer is turned off (`"changelog":
false` in `config.json`) because this repo has a single package whose
`CHANGELOG.md` is the root one, written by our script instead.
