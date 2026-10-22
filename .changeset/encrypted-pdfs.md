---
"docubil": patch
---

**Fixed:** Fixing an encrypted ("secured") PDF produced a file that wouldn't open, and fixing a digitally signed one silently broke its signature. Docubil now checks both kinds but doesn't change them, and explains why. A PDF that needs a password to open is turned away at upload with instructions, instead of being "checked" from unreadable content.

<details>
<summary>Technical details</summary>

`PDFProcessor.validatePDF` now reports `encrypted` (pdf-lib's `isEncrypted`) and `needsPassword` (whether pdf.js, via pdf-parse, can open it with an empty password). `/api/analyze` returns 400 for `needsPassword`. `/api/remediate` returns 422 for any encrypted file: pdf-lib can't decrypt, and its `ignoreEncryption` save wrote output without a readable `/Root`, while removing the encryption would silently drop the author's permission settings. Restriction-only files are still analyzed (pikepdf and pdf.js open them). Signed files (a signature field with a `/V` value) also get 422, because any rewrite invalidates the signature; an empty signature field, as on the IRS 1040, doesn't count. Covered by `tests/encryption.test.js` and `tests/signed.test.js`.

</details>
