# alpha.gov.bb

Turborepo + pnpm monorepo. TanStack Start web app.

## Layout

```
apps/web         # TanStack Start - citizen portal
packages/config  # shared tsconfig
```

## Develop

You only need **Docker** installed. Node and pnpm run inside containers.

```bash
docker compose --profile dev up      # dev server on http://localhost:3000 (HMR)
./check.sh                           # vitest + eslint + tsc + prettier
./verify.sh                          # check.sh + pnpm audit + semgrep + Playwright e2e
```

The repo is bind-mounted into the dev/check containers, so edits are picked
up immediately — no rebuild needed for a code change. `verify.sh` builds a
production-like image and runs the Playwright suite against it.

If `.env.local` exists at `apps/web/.env.local`, it is passed through to the
dev container automatically.

### Running without Docker

Node 20+ and pnpm 9 on the host work fine too:

```bash
pnpm install
pnpm dev          # apps/web on http://localhost:3000
pnpm build
pnpm typecheck
```
