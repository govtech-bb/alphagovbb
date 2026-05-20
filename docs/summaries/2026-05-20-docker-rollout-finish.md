# Docker rollout: finish line

Closed out the two unfinished items from the Docker plan — production-built
e2e and non-root containers — and resolved the upstream merge that landed
between the initial Docker work and now.

## Why this took two passes

The first pass produced everything except a working `app` runtime. The
`build` and `start` scripts on `main` at init referenced a Nitro-shaped
output (`.output/server/index.mjs`) that the project's actual build never
produces. Investigating the history showed no commit had ever exercised
`pnpm build` — the scripts were copy-paste from an older TanStack Start
template and had been broken since the repo was scaffolded the same day.

Upstream then fixed the *paths* (`dist/server/...`) in a separate session,
but `dist/server/server.js` is a Web-standard `{ fetch }` handler with no
HTTP listener. `node dist/server/server.js` exits immediately. So "the
paths are right" wasn't enough — something still had to bind a port.

## What now exists

- **`pnpm start` runs `vite preview`.** TanStack Start is runtime-agnostic
  by design; rather than write a bespoke srvx/Hono entry, we lean on
  `vite preview`, which Vite/TanStack-Start already wrap with srvx/node.
  Zero new dependencies.
- **Dockerfile `runtime` extends `build`** (instead of starting from a
  bare `node:20-slim` and copying `dist/`). Vite needs the full workspace
  install to run preview, so we reuse the `build` stage's filesystem
  intact and only override `CMD`. The `build` stage gained
  `COPY --chown=1000:1000 . .` because the deps stage runs as UID 1000
  and otherwise can't write `dist/`.
- **`vite.config.ts` sets `preview.allowedHosts: true`.** Vite preview
  blocks requests whose Host header isn't whitelisted (DNS-rebinding
  protection); the e2e container reaches `app` by its compose IP, which
  varies per run.
- **e2e service resolves `app` to its container IP at startup.**
  Chromium auto-upgrades single-label hostnames (`app`) to HTTPS, which
  fails against a plain-HTTP server. `*.localhost` names are exempt from
  the upgrade but are hard-mapped to 127.0.0.1 inside Chromium, ignoring
  the docker DNS. IP-based URLs are exempt from both. So the entry
  command is `getent hosts app | awk ...` → `PLAYWRIGHT_BASE_URL`.
- **All containers run non-root.** The `deps` and `e2e` Dockerfile
  stages end with `USER 1000`. The `runtime` stage uses `USER node`.
  The `semgrep` service gets `user: ${HOST_UID}:${HOST_GID}` with
  `HOME=/tmp` so its rule cache has somewhere writable.

## Two latent spec fixes

- `search.spec.ts`: `getByLabel('Search for a service')` matched both the
  `<search>` landmark and the input. Narrowed to
  `getByRole('searchbox', { name: 'Search for a service' })`.
- `severance-calculator.spec.ts`: the "Start your estimate now" link is
  hidden by `rehype-hide-start-links` until a research-access flag is
  granted, and the `/start` subroute it targets doesn't exist as a
  route. Reduced to verifying the landing page heading renders. Extend
  when the calculator form (or the unhidden link) ships.

## Self-inflicted regression fixed

`./verify.sh` now writes `apps/web/playwright-report/`, `coverage/`,
`test-results/`, and `dist/`. The previous `.prettierignore` only
excluded lockfiles, so prettier would scan all those generated files on
the next run and produce thousands of false positives. Added them
plus `.cta.json` (scaffold-managed, accepted as-is) to
`apps/web/.prettierignore`. Same fix in `apps/web/eslint.config.js`
ignores.

## Why no ADR

The vite preview decision was discussed as an ADR candidate
("local production-parity serving uses vite preview, not a bespoke
adapter") but declined — the Dockerfile comment captures the reasoning
inline, and the choice is narrow (local CI parity only; Amplify owns
real prod). If we ever move prod off Amplify and want to serve from
the Docker image directly, this is the spot to revisit.

## Out of scope (still)

- `./verify.sh` exits non-zero because of pre-existing lint/prettier
  debt across the existing source tree (~109 prettier files, ~30+
  eslint errors). These have been on main since well before the
  Docker work and are deferred deliberately.
- Semgrep flags one ReDoS-shaped pattern in `apps/web/src/lib/search.ts`.
  Pre-existing; the input is regex-escaped before interpolation so the
  finding may be a false positive — needs human review, not a one-liner.

## Files touched

- `Dockerfile` — runtime stage extends build; vite preview CMD; non-root
  USER directives on deps and e2e stages; `--chown=1000:1000` on the
  build-stage COPY.
- `apps/web/package.json` — `build: "vite build"`, `start: vite preview ...`.
- `apps/web/vite.config.ts` — `preview.allowedHosts: true`.
- `compose.yml` — `e2e` service resolves `app` to container IP at
  startup; `semgrep` service runs non-root with HOME=/tmp.
- `apps/web/e2e/search.spec.ts` — searchbox role.
- `apps/web/e2e/severance-calculator.spec.ts` — landing-only assertion.
- `apps/web/.prettierignore` — ignore generated dirs + `.cta.json`.
- `apps/web/eslint.config.js` — ignore generated dirs.
- `apps/web/playwright.config.ts` — reformatted.
