---
"docubil": minor
---

**Fixed:** Checks and fixes no longer guess. When Docubil can't tell something from the document itself, it now says so and leaves it for you instead of writing something wrong.

- **Form fields inside groups are checked.** Forms built in Acrobat or LiveCycle keep their fields inside groups. The IRS Form 1040 reported 1 field; all 236 are checked now.
- **Alt text is read from the document.** Tagged images with alt text are no longer reported as missing it. Untagged documents' images are, correctly, since they can't have any.
- **The language is detected from the text,** not set to English for every document. If the text doesn't make it clear, you're asked to set it.
- **The title comes from the document:** its first heading, or a readable file name, never "Accessible Document". No subject is invented any more.
- **Untagged documents aren't marked as tagged,** which told screen readers to trust tags that didn't exist.
- **Form tooltips come only from readable field names** ("Date of birth"), never internal ones read aloud ("Please enter: p1-t3[0]").

<details>
<summary>Technical details</summary>

- New `src/python/pdf_structure.py`: `iter_terminal_fields()` walks `/Kids` and builds full dotted names; `collect_figures()` walks the structure tree, follows `/RoleMap`, and reads `/Alt` or `/ActualText` and `/Pg`; `human_label()` turns a field name into a tooltip, or returns `None` for generic or internal names. Depth and node caps guard against malformed trees.
- `analyze_pdf.py` reports `hasStructTree` and `figures`. `AccessibilityAnalyzer._checkTextAlternatives` uses figures when tagged, and adds `alt-text-untagged-images` (moderate, unconfident) for a tagged document whose images aren't figures. `analyze()` also returns a `context` (text, heading candidates) that the server passes to remediation with the original file name.
- `remediate_pdf.py`: `markTagged` requires `/StructTreeRoot`, and fixes that can't be applied go in a new `skipped` list. Tooltips are written per field and listed in `tooltipFields`, so `RemediationService` marks only those fields' issues fixed.
- `src/services/languageDetect.js`: function-word counts for en/fr/es/de/it/pt/nl, needing 12+ hits and a 3× lead, otherwise `null`.
- `deriveTitle()` rejects names like `scan0001`, dates and UUIDs.
- Tests: `tests/python/accuracy.test.js` (real PDFs built by `tests/helpers/structuredPDFs.js` through the Python layer; skipped locally without pikepdf, never in CI) and `tests/services/languageDetect.test.js`. Fixes #51, #52, #53, #54, #55, #56.

</details>
