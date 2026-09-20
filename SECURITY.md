# Security Policy

## Supported Versions

Docubil is currently pre-1.0 and actively developed. Security fixes are
applied to the latest release on `main` only; there is no long-term
support branch yet.

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Instead, report it privately using
[GitHub's private vulnerability reporting](https://github.com/jshields-ca/Docubil/security/advisories/new)
for this repository (Security tab → "Report a vulnerability"). If that is
unavailable to you, contact the maintainer directly through the contact
method listed on their GitHub profile.

Please include:

- A description of the vulnerability and its potential impact
- Steps to reproduce it (a minimal PDF or request that triggers it, if
  applicable)
- Any suggested remediation, if you have one

We aim to acknowledge reports within 5 business days and to provide a
timeline for a fix once the issue is confirmed. We ask that you give us a
reasonable opportunity to address a vulnerability before any public
disclosure.

## Data Handling

Because Docubil's core function is processing user-uploaded PDF documents
(which may contain personal or sensitive information), the following
applies to any self-hosted instance running the default configuration:

- Uploaded PDFs, remediated output, and generated reports are stored on
  local disk (or a mounted volume, in the Docker image) under `uploads/`,
  `output/`, and `reports/` respectively.
- Files are automatically deleted after `FILE_RETENTION_HOURS` (default:
  24 hours) by a scheduled cleanup job.
- No uploaded file content is sent to any third-party or external service
  — all PDF analysis and remediation happens locally within the
  Docubil process (Node.js + local Python subprocess).
- Operators self-hosting Docubil for others are responsible for their own
  data protection obligations (e.g. GDPR) regarding files their users
  upload; Docubil provides the retention/cleanup mechanism but does not
  itself constitute compliance.

## Dependency Security

This project runs automated dependency and static-analysis scanning in CI
(see the CI workflow) and uses Dependabot to keep dependencies current.
Known high/critical vulnerabilities in production dependencies are treated
as bugs and prioritized for a patch release.
