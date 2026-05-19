# Docker support: dev container + containerised checks

## Goal

A developer can clone this repo with **only Docker installed on the host** — no Node, pnpm, or anything else — and:

- `docker compose --profile dev up` runs the TanStack Start dev server on `http://localhost:3000` with HMR.
- `./check.sh` runs the fast pre-commit loop (vitest, eslint, tsc, prettier) in a container. Snappy enough for the inner dev loop.
- `./verify.sh` runs the full pre-deploy validation: the `check.sh` suite plus `pnpm audit`, semgrep, and Playwright e2e tests against a built production server. Slower, run before pushing or deploying.

Production deployment remains AWS Amplify; the Docker setup is for local development and CI parity, not a deploy artefact.

## Approach

**One Dockerfile, multiple stages, one `compose.yml` with profiles.**

- Single multi-stage Dockerfile produces three relevant images: a dev image (for `pnpm dev`), a checks image (for fast checks), and a production-like runtime image (for e2e and Amplify-parity testing).
- `compose.yml` defines all services. Compose profiles (`dev`, `check`, `verify`) gate which services start.
- Semgrep and Playwright run from their **upstream official images** rather than installed into our Node image. Reasons: semgrep is a Python tool (~100MB extra); Playwright's image is ~1.5GB and uses Microsoft's hardened browser builds. Pulling those out keeps our app image lean and our test runner correct.
- pnpm store and node_modules cached via BuildKit cache mounts (`--mount=type=cache,target=/pnpm-store`) so dependency installs stay incremental between runs. Source code is bind-mounted in the `dev` profile only; checks run against the image's baked-in source for reproducibility.

### Alternatives considered

- **Single container that runs everything (no Compose).** Simpler today, but the dev container alone forces Compose into the project (bind mounts, env passthrough, port mapping all want it). Once Compose is in, using it for tests too is the consistent choice and costs little extra.
- **Bake semgrep and Playwright browsers into one big test image.** Rejected: slow to build, large to pull, and Microsoft's Playwright image gets browser security updates we'd otherwise have to track ourselves.
- **Skip containerising the fast checks** (run `pnpm` directly on the host). Rejected by requirement: nothing installs on the host.

## Scope

1. **Dockerfile (multi-stage):**
   - `base` — Node 20-slim, corepack-enabled pnpm 9.12.0 pinned to match `package.json` `packageManager` field.
   - `deps` — installs dependencies via `pnpm install --frozen-lockfile` with a BuildKit cache mount on the pnpm store.
   - `dev` — extends `deps`, command defaults to `pnpm --filter web dev`. Used with bind-mounted source.
   - `build` — extends `deps`, runs `pnpm --filter web build`, produces `.output/`.
   - `runtime` — minimal Node 20-slim, copies only `.output/` and runtime essentials. Command: `node --import ./instrument.server.mjs index.mjs`.
   - `check` — extends `deps`, default command runs vitest, eslint, tsc, prettier sequentially with clear pass/fail output.

2. **`compose.yml` (single file, profiles):**
   - `dev` (profile `dev`) — `dev` stage; bind-mounts `apps/web/src`, `apps/web/public`, content; exposes port 3000; passes `.env.local` through.
   - `app` (profile `verify`) — `runtime` stage; healthcheck on `GET /`; no host port (internal to compose network).
   - `check` (profile `check`, `verify`) — `check` stage; exits 0 on pass, non-zero on fail.
   - `audit` (profile `verify`) — same `check` image, runs `pnpm audit --audit-level=high`.
   - `semgrep` (profile `verify`) — official `returntocorp/semgrep` image; bind-mounts source read-only; runs `semgrep scan --config=auto --error`.
   - `e2e` (profile `verify`) — official `mcr.microsoft.com/playwright:v1.x-jammy` image; bind-mounts e2e test directory; depends on `app` healthcheck; runs `pnpm exec playwright test`.

3. **`check.sh`** — thin wrapper: `docker compose --profile check run --rm check`. Exits with the container's exit code.

4. **`verify.sh`** — orchestrates the full suite: runs `check`, `audit`, `semgrep` services (no app needed), then brings up `app`, runs `e2e` against it, tears down. Uses `docker compose --profile verify up --abort-on-container-exit --exit-code-from e2e` style orchestration. Returns non-zero if any stage fails.

5. **Playwright setup:**
   - `apps/web/playwright.config.ts` with `baseURL: http://app:3000` for in-container runs, defaulting to `http://localhost:3000` for host runs (env-switched).
   - `apps/web/e2e/` directory for tests.
   - Add `@playwright/test` as a devDependency in `apps/web/package.json`.
   - Add `test:e2e` script to `apps/web/package.json`.

6. **First five e2e tests** (one per major feature):
   - `content-navigation.spec.ts` — home → category listing → content page renders.
   - `search.spec.ts` — type query, submit, see ≥1 result, click first result, land on expected page.
   - `severance-calculator.spec.ts` — fill form (eligible scenario), submit, assert calculated severance figure.
   - `pension-calculator.spec.ts` — fill form, submit, assert calculated pension figure.
   - `errors.spec.ts` — visit `/no-such-thing`, assert 404 page renders. Smoke-test `/javascript-required` and `/service-unavailable` routes load.

7. **`.dockerignore`** — excludes `node_modules`, `.output`, `.turbo`, `.git`, `dist`, `coverage`, env files. Keeps build context small.

8. **README update** — replace the current "Develop" section with the Docker-based workflow. Keep the host-pnpm path documented as an alternative for contributors who already have Node.

9. **Defer to follow-up:** wiring `check.sh` to a git hook (husky/lefthook) and `verify.sh` to a CI workflow. Both are mechanical once the scripts exist.

## Files

**New:**
- `Dockerfile`
- `compose.yml`
- `.dockerignore`
- `check.sh` (executable)
- `verify.sh` (executable)
- `apps/web/playwright.config.ts`
- `apps/web/e2e/content-navigation.spec.ts`
- `apps/web/e2e/search.spec.ts`
- `apps/web/e2e/severance-calculator.spec.ts`
- `apps/web/e2e/pension-calculator.spec.ts`
- `apps/web/e2e/errors.spec.ts`

**Modified:**
- `apps/web/package.json` — adds `@playwright/test`, `test:e2e` script.
- `README.md` — Docker-based dev/test instructions.

## Verify

Acceptance checklist:

- [ ] On a clean machine with **only Docker installed**, `git clone` then `docker compose --profile dev up` produces a working dev server at `http://localhost:3000` with HMR.
- [ ] Editing a `.tsx` file under `apps/web/src` triggers HMR in the running dev container.
- [ ] `./check.sh` runs vitest, eslint, tsc, prettier in a container. Exits 0 on green, non-zero on any failure.
- [ ] `./check.sh` second invocation is significantly faster than first (cache mounts working).
- [ ] `./verify.sh` runs all of: check suite, `pnpm audit --audit-level=high`, semgrep, Playwright e2e tests.
- [ ] Playwright tests run against a built production server (not the dev server) — verifiable from compose logs showing `node ./.output/server/index.mjs` for the `app` service.
- [ ] All five e2e specs pass against the current main branch.
- [ ] Introducing a deliberate lint error makes `check.sh` exit non-zero; reverting it returns to green.
- [ ] Introducing a deliberate failing assertion in an e2e spec makes `verify.sh` exit non-zero.

## Open questions

- **`pnpm audit` baseline.** First run may surface existing high-severity findings. If so, do we (a) treat them as blockers and fix immediately, (b) allowlist with a comment trail, or (c) lower the threshold temporarily? Decide on first failure, not now.
- **Semgrep noise.** `--config=auto` pulls a broad ruleset; first run might be loud. Plan to triage findings on first run and either fix, suppress with `// nosemgrep: <rule-id>`, or narrow the config. Not a design decision — operational decision after first run.
- **Playwright version pinning.** Image tag pin (`v1.x-jammy`) needs a concrete version chosen at implementation time matching the `@playwright/test` package version.
- **Compose project name.** Default is the directory name (`alphagovbb`). Fine, but worth setting `name: alphagovbb` explicitly in `compose.yml` so it's stable regardless of clone location.
