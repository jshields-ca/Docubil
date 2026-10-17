---
"docubil": patch
---

**Fixed:** Fixing an encrypted ("secured") PDF produced a file that wouldn't open. Docubil now checks encrypted PDFs but doesn't change them, and explains why. A PDF that needs a password to open is turned away at upload with instructions, instead of being "checked" from unreadable content.

<details>
<summary>Technical details</summary>

`PDFProcessor.validatePDF` now reports `encrypted` (pdf-lib's `isEncrypted`) and `needsPassword` (whether pdf.js, via pdf-parse, can open it with an empty password). `/api/analyze` returns 400 for `needsPassword`. `/api/remediate` returns 422 for any encrypted file: pdf-lib can't decrypt, and its `ignoreEncryption` save wrote output without a readable `/Root`, while removing the encryption would silently drop the author's permission settings. Restriction-only files are still analyzed (pikepdf and pdf.js open them). Covered by `tests/encryption.test.js`.

</details>
