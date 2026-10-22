---
"docubil": patch
---

**Fixed:** Behind a reverse proxy, every user shared one rate limit, so a few busy people could lock everyone else out for 15 minutes. Set the new `TRUST_PROXY` option (usually `1`) when Docubil sits behind nginx, Caddy, Traefik or a tunnel, and each user gets their own limit again.

<details>
<summary>Technical details</summary>

`TRUST_PROXY` is passed to Express's `trust proxy` setting: a number is a hop count, `true`/`false` are booleans, anything else (addresses, subnets, `loopback`) passes through. Unset keeps today's behaviour, which is correct without a proxy; trusting `X-Forwarded-For` without one would let clients spoof their address. Also stops `express-rate-limit`'s `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` log on every proxied request. Covered by `tests/trustProxy.test.js`. Fixes #58.

</details>
