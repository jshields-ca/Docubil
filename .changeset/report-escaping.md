---
"docubil": patch
---

**Security:** The accessibility report now treats everything taken from an uploaded PDF (its title, author, form field names) and its file name as plain text. A specially crafted PDF could otherwise add its own content to the report page.

<details>
<summary>Technical details</summary>

`ReportGenerator` interpolated `filename`, `pdfInfo.title/author/subject/keywords` and issue `title/description/fixApplied/fixDetails/reason/page/element/impact` into the HTML unescaped. The server's CSP (`script-src 'self'`) blocked inline script execution on the served page, so the exposure was HTML/CSS injection (fake content or forms in a trusted-looking report), plus script execution if a saved report was opened from disk without the CSP. All of these now go through an `esc()` helper. Covered by `tests/services/ReportGenerator.test.js`. The React UI renders via JSX, which already escapes, and CSV cells are quoted with fixed-text prefixes.

</details>
