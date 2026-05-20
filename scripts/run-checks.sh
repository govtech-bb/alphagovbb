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

# Print a one-line coverage summary parsed from vitest's json-summary report.
# Coverage is informational only — never affects pass/fail of the vitest run.
print_coverage_summary() {
  summary="apps/web/coverage/coverage-summary.json"
  [ -f "$summary" ] || return 0
  node -e '
    const s = require("./" + process.argv[1]).total;
    const fmt = (m) => m && typeof m.pct === "number" ? m.pct.toFixed(1) + "%" : "n/a";
    process.stdout.write(
      `[INFO] coverage      ${fmt(s.statements)} stmts  ` +
      `${fmt(s.branches)} branches  ${fmt(s.functions)} funcs  ` +
      `${fmt(s.lines)} lines\n`
    );
  ' "$summary" 2>/dev/null || true
}

for name in "$@"; do
  case "$name" in
    vitest)
      run_tool vitest "pnpm --filter web test -- --coverage"
      print_coverage_summary
      ;;
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
