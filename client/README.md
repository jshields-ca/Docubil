# Docubil frontend

React + Vite + Tailwind CSS source for Docubil's web UI.

## Development

Run the Express API (from the repo root) and the Vite dev server side by
side; Vite proxies `/api`, `/reports`, and `/health` to `localhost:3000`.

```bash
# terminal 1, from the repo root
npm run dev

# terminal 2, from client/
npm install
npm run dev
```

Open the URL Vite prints (typically http://localhost:5173).

## Building

```bash
npm run build
```

Builds straight into `../public`, which the Express server serves as
static files — no separate copy step. This also runs automatically via
`npm run build` at the repo root.

## Testing

```bash
npm test
```

Component tests run under Vitest + Testing Library, with `jest-axe`
asserting each rendered component has no accessibility violations.
