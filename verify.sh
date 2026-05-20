#!/usr/bin/env sh
# Full pre-deploy validation. The deps-container tools (vitest, typecheck,
# eslint, prettier, audit) run together in a single container. Semgrep and
# the production-built e2e suite each need their own image, so they run
# separately but follow the same convention: one line per tool, full output
# kept at .check-logs/<tool>.log on failure. Exits non-zero if any tool
# failed.
set -u

export HOST_UID=$(id -u) HOST_GID=$(id -g)

LOG_DIR=".check-logs"
mkdir -p "$LOG_DIR"

FAILED=0

cleanup() {
  docker compose --profile verify down --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT

run_step() {
  name=$1
  shift
  log="$LOG_DIR/$name.log"
  rm -f "$log"
  start=$(date +%s)
  if "$@" >"$log" 2>&1; then
    elapsed=$(( $(date +%s) - start ))
    printf '[ OK ] %-10s %3ds\n' "$name" "$elapsed"
    rm -f "$log"
  else
    elapsed=$(( $(date +%s) - start ))
    printf '[FAIL] %-10s %3ds  see %s\n' "$name" "$elapsed" "$log"
    FAILED=1
  fi
}

# Single container for the deps-image checks. The inner script prints its
# own one-liner per tool.
docker compose --profile verify run --rm check \
  sh scripts/run-checks.sh vitest typecheck eslint prettier audit
[ $? -eq 0 ] || FAILED=1

run_step semgrep docker compose --profile verify run --rm semgrep
run_step e2e docker compose --profile verify up \
  --abort-on-container-exit --exit-code-from e2e app e2e

exit "$FAILED"
