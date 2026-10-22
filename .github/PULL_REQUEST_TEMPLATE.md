## Summary

<!-- What does this PR change, and why? -->

## Related issue(s)

<!-- Fixes #... / Refs #... -->

## What else this affects

<!-- What else uses what you changed: a check's ID, a severity, a limit, a default, a function, an API field, a report column? Search for it.
     List what you found and how it's covered (a test, or why it's unaffected). "Nothing else" is a fine answer once you've looked. -->

## Checklist

- [ ] `npm run lint && npm test` passes (and `npm run lint && npm test && npm run build` in `client/` if it changed)
- [ ] A test covers the change. For a bug fix, the test fails without the fix.
- [ ] A changeset is included (`npx changeset`) if users would notice this change, written as described in CONTRIBUTING.md. No changeset for tests, CI, refactors or docs.
- [ ] Docs updated (README, CONTRIBUTING, `docs/`, `.env.example`) if behaviour or setup changed
- [ ] The PR title follows [Conventional Commits](https://www.conventionalcommits.org/) (`feat: ...`, `fix: ...`); it becomes the squash commit's subject
- [ ] I agree my contribution is licensed under AGPL-3.0-only (see CONTRIBUTING.md)

**Accuracy** (checks and fixes are what people rely on):

- [ ] Changes how a check decides, or what a fix writes into a PDF. If so: a test PDF covers it, and a fix never claims something the document doesn't do (for example marking it tagged when it isn't)
- [ ] Not applicable

**Accessibility of Docubil itself:**

- [ ] UI change: works by keyboard alone, and no new axe violations (`jest-axe` in `client/`)
- [ ] No UI change

**Security and privacy** (say how each ticked item is handled):

- [ ] Handles uploaded files or request data (validated, size-limited, never executed)
- [ ] Adds or changes an API route or a stored file (cleanup and retention still apply)
- [ ] Adds a network request, dependency, or anything that could send document content off the device
- [ ] None of the above

## Screenshots (UI changes)
