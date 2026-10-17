# Accuracy corpus

Documents with known answers, used to measure how right Docubil's checks and
fixes are (PLAN.md Phase 6, issue #57). They run on every PR as part of
`npm test`, or on their own:

```bash
npm run corpus
```

The run prints a table per check: **tp** (issue correctly reported), **tn**
(correctly not reported), **fp** (false alarm), **fn** (missed). It fails on
any mismatch that isn't recorded in `baseline.json`. It also fails when a
recorded mismatch starts passing: remove it from the baseline so the
improvement can't quietly regress.

It needs Python with `pikepdf` and `pdfplumber` (`pip install -r
requirements.txt`). Without them it's skipped locally, but never in CI.

## What's in it

`cases.js` lists every document with:

- `expect`: per check, whether an issue should be reported. Checks:
  `tagged`, `bookmarks`, `altText`, `contrast`, `readingOrder`, `title`,
  `language`, `headings`, `formTooltips`.
- `remediation` (optional): issue IDs that should be `fixed` or stay
  `remaining`, and `claims` the fixed file must make (`lang`, `marked`,
  `title`). Claims are read back from the file itself, not from Docubil's report.

Most documents are **generated** by `tests/helpers/structuredPDFs.js` at test
time, so the repository holds no third-party files of unclear origin. Files
in `files/` are committed only when their license allows it:

| File | Source | License |
|---|---|---|
| `files/irs-f1040-2010.pdf` | IRS Form 1040 (2010), as prefilled in Mozilla pdf.js's test corpus | Public domain (US federal government work) |

## Adding a document

The best source is a **Wrong result** issue. For each one:

1. Reproduce it as a generated document if you can (add a builder to
   `tests/helpers/structuredPDFs.js`), or commit the file to `files/` only
   if its license allows. Never commit a document someone sent privately.
2. Add a case to `cases.js` with the *correct* answer, even if Docubil
   currently gets it wrong.
3. Run `npm run corpus`. If it fails because Docubil is wrong, either fix
   Docubil in the same PR, or record the mismatch in `baseline.json` with
   the issue number, so it's tracked rather than hidden:

   ```json
   { "knownMismatches": [
     { "id": "some-case/altText/fn", "issue": 123, "note": "Inline images not counted yet" }
   ] }
   ```

## Coverage gaps

Phase 6 aims for about 30 documents. Not covered yet: scanned (image-only)
pages, signed and encrypted files, right-to-left text, tables, lists, a 100+
page document, and the PDF Association's PDF/UA reference suite (pending a
license check).
