# alpha.gov.bb

Turborepo + pnpm monorepo. TanStack Start web app.

## Layout

```
apps/web         # TanStack Start - citizen portal
packages/ui      # shared React components
packages/config  # shared tsconfig
```

## Develop

```bash
pnpm install
pnpm dev          # runs apps/web on http://localhost:3000
pnpm build
pnpm typecheck
```

Node >= 20. pnpm 9.
