---
"docubil": patch
---

**Security:** Includes the fix for an IP-spoofing advisory in a library the web server uses to read client addresses. Docubil's default setup wasn't exposed, because it doesn't trust proxy headers.

<details>
<summary>Technical details</summary>

`proxy-addr` ≤ 2.0.7 ([GHSA-jqcg-44mw-7w3h](https://github.com/advisories/GHSA-jqcg-44mw-7w3h), critical) mis-handles IPv4-mapped IPv6 addresses in a configured trust subnet. It's only reachable with Express's `trust proxy` set, which `server.js` never sets. The Express 5 upgrade resolves `proxy-addr` 2.0.8. Flagged by the `npm audit` CI gate, which had turned `main` red.

</details>
