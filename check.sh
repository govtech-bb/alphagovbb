#!/usr/bin/env sh
# Fast pre-commit loop: vitest, eslint, tsc, prettier — one container, one
# line per tool, per-tool log saved to .check-logs/ on failure.
set -eu
export HOST_UID=$(id -u) HOST_GID=$(id -g)
exec docker compose --profile check run --rm check \
  sh scripts/run-checks.sh vitest typecheck eslint prettier
