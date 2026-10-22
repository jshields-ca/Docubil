---
"docubil": patch
---

**Fixed:** In the Docker image, the accessibility report and its JSON and CSV exports returned "not found", and reports were never cleaned up after 24 hours like the rest of the files. Both work as intended again.

<details>
<summary>Technical details</summary>

`ReportGenerator` wrote to a hard-coded `./reports` while the server serves `/reports`, reads the JSON/CSV data, and runs cleanup in `REPORTS_DIR`. The image sets `REPORTS_DIR=/data/reports`, so reports landed in `/app/reports`: outside the data volume, unreachable, and never deleted. Running from source with the default setting was unaffected. It now honours `REPORTS_DIR`, covered by `tests/reportsDir.test.js`.

**After upgrading:** reports created by older versions may still sit in `/app/reports` inside the container. They're removed when the container is recreated (`docker compose up -d` after pulling does this).

</details>
