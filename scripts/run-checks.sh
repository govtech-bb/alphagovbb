#!/usr/bin/env sh
# Run a list of test tools sequentially in the current container, one tool per
# arg. Each tool gets a one-line summary; on failure the tool's full output is
# kept at .check-logs/<tool>.log so the next tool can still run. Returns
# non-zero iff any tool failed.
set -u

LOG_DIR=".check-logs"
mkdir -p "$LOG_DIR"

FAIL_MARKER="$(mktemp)"
trap 'rm -f "$FAIL_MARKER"' EXIT

run_tool() {
  name=$1
  shift
  log="$LOG_DIR/$name.log"
  start=$(date +%s)
  if sh -c "$*" >"$log" 2>&1; then
    elapsed=$(( $(date +%s) - start ))
    printf '[ OK ] %-10s %3ds\n' "$name" "$elapsed"
    rm -f "$log"
  else
    elapsed=$(( $(date +%s) - start ))
    printf '[FAIL] %-10s %3ds  see %s\n' "$name" "$elapsed" "$log"
    echo 1 >>"$FAIL_MARKER"
  fi
}

# Clear stale logs from a previous run for any tools we're about to run.
for name in "$@"; do
  rm -f "$LOG_DIR/$name.log"
done

for name in "$@"; do
  case "$name" in
    vitest)    run_tool vitest    "pnpm --filter web test" ;;
    typecheck) run_tool typecheck "pnpm --filter web typecheck" ;;
    eslint)    run_tool eslint    "pnpm --filter web lint" ;;
    prettier)  run_tool prettier  "pnpm --filter web check" ;;
    audit)     run_tool audit     "pnpm audit --audit-level=high" ;;
    *)
      printf '[FAIL] %-10s     unknown tool name\n' "$name"
      echo 1 >>"$FAIL_MARKER"
      ;;
  esac
done

[ -s "$FAIL_MARKER" ] && exit 1
exit 0
