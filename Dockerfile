# syntax=docker/dockerfile:1.7

# Base image: Node 20 + pnpm 9.12.0 (matches package.json packageManager).
FROM node:20-slim AS base
ENV PNPM_HOME=/root/.local/share/pnpm \
    PATH=/root/.local/share/pnpm:$PATH \
    CI=true
WORKDIR /app
RUN corepack enable \
 && corepack prepare pnpm@9.12.0 --activate \
 && pnpm config set store-dir /pnpm-store

# Dependency install. Only manifests are copied so the install layer caches
# until a package.json or lockfile changes. The pnpm store is a BuildKit cache
# mount so it survives across builds.
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/web/package.json apps/web/
COPY packages/config/package.json packages/config/
RUN --mount=type=cache,id=alphagovbb-pnpm-store,target=/pnpm-store \
    pnpm install --frozen-lockfile
# Chown the installed tree to UID 1000 so that when the named node_modules
# volumes seed themselves from the image, they're owned by a non-root user
# matching the typical host UID. Containers run as $HOST_UID:$HOST_GID via
# compose's `user:` so they can then write into node_modules (vite cache,
# etc.) without permission errors.
RUN chown -R 1000:1000 /app /pnpm-store 2>/dev/null || true
USER 1000
EXPOSE 3000

# Production build. Source is COPYed in (not bind-mounted) so the resulting
# dist/ is reproducible from the image alone. --chown=1000:1000 because the
# deps stage runs as UID 1000; without it `vite build` can't create dist/
# under the freshly-copied apps/web/ (which would otherwise be root-owned).
FROM deps AS build
COPY --chown=1000:1000 . .
RUN --mount=type=cache,id=alphagovbb-pnpm-store,target=/pnpm-store \
    pnpm --filter web build

# Production-like runtime used by the `app` service for e2e tests. The
# TanStack Start build emits a Web-standard { fetch } handler (dist/server/
# server.js) rather than a self-listening HTTP server, so we serve it via
# `vite preview` — Vite's preview-server-plugin wraps the bundle with
# srvx/node and exposes it over HTTP. That requires vite and the rest of
# the workspace install, so this stage extends `build` (which already has
# both deps and the built dist) rather than starting from a bare node image.
FROM build AS runtime
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000
EXPOSE 3000
CMD ["pnpm", "--filter", "web", "start"]

# Playwright runner. Built on Microsoft's hardened browser image so we don't
# track browser security updates ourselves. pnpm is layered on top to install
# project devDependencies (including @playwright/test) consistently.
FROM mcr.microsoft.com/playwright:v1.60.0-jammy AS e2e
ENV PNPM_HOME=/root/.local/share/pnpm \
    PATH=/root/.local/share/pnpm:$PATH \
    CI=true
WORKDIR /app
RUN corepack enable \
 && corepack prepare pnpm@9.12.0 --activate \
 && pnpm config set store-dir /pnpm-store
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/web/package.json apps/web/
COPY packages/config/package.json packages/config/
RUN --mount=type=cache,id=alphagovbb-pnpm-store,target=/pnpm-store \
    pnpm install --frozen-lockfile
RUN chown -R 1000:1000 /app /pnpm-store /root/.local/share/pnpm 2>/dev/null || true
USER 1000
