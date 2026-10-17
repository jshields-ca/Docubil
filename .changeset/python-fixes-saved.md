---
"docubil": patch
---

**Fixed:** Automatic fixes for document language, title display, the tagged-PDF flag and form field tooltips were reported but never saved into the downloaded PDF. They're saved now.

<details>
<summary>Technical details</summary>

`RemediationService` runs `remediate_pdf.py` in place (input and output are the same path), but the script opened the file with `pikepdf.open(..., allow_overwriting_input=False)`, so every `save()` raised "Cannot overwrite input file". The service then moved those issues to "remaining" with "Python remediation encountered errors", and only the pdf-lib metadata changes reached the user. No test inspected the remediated file. The Phase 6 accuracy tests (`tests/python/accuracy.test.js`) now do.

</details>
