#!/usr/bin/env bash
# Claude PreToolUse hook — runs tests before any git commit
# Exit 0: allow commit | Exit 2: block commit

set -euo pipefail

# Parse the Bash command from stdin (JSON tool input)
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('tool_input', {}).get('command', ''))
except Exception:
    print('')
" 2>/dev/null)

# Only intercept git commit commands
if ! echo "$COMMAND" | grep -qE "^git commit|git commit "; then
    exit 0
fi

REPO_ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel 2>/dev/null || echo "/Users/yasumasa_takemura/projects/chantiko")"
FAILED=0

echo "🧪 Running pre-commit checks..." >&2
echo "" >&2

# ── Frontend: lint ─────────────────────────────────────────────────────────────
if [ -f "$REPO_ROOT/package.json" ]; then
    echo "▶ ESLint..." >&2
    if cd "$REPO_ROOT" && npm run lint --silent 2>&1; then
        echo "✅ ESLint passed" >&2
    else
        echo "❌ ESLint failed" >&2
        FAILED=1
    fi
    echo "" >&2
fi

# ── Frontend: type check ────────────────────────────────────────────────────────
if [ -f "$REPO_ROOT/tsconfig.json" ]; then
    echo "▶ TypeScript type check..." >&2
    if cd "$REPO_ROOT" && npx tsc --noEmit 2>&1; then
        echo "✅ TypeScript passed" >&2
    else
        echo "❌ TypeScript failed" >&2
        FAILED=1
    fi
    echo "" >&2
fi

# ── Python: pytest ─────────────────────────────────────────────────────────────
if [ -f "$REPO_ROOT/pyproject.toml" ] || [ -f "$REPO_ROOT/pytest.ini" ] || [ -f "$REPO_ROOT/setup.cfg" ]; then
    TESTS_DIR="$REPO_ROOT/tests"
    if [ -d "$TESTS_DIR" ] && [ -n "$(ls -A "$TESTS_DIR" 2>/dev/null)" ]; then
        echo "▶ pytest..." >&2
        if cd "$REPO_ROOT" && uv run pytest --tb=short -q 2>&1; then
            echo "✅ pytest passed" >&2
        else
            echo "❌ pytest failed" >&2
            FAILED=1
        fi
        echo "" >&2
    else
        echo "⏭  No Python tests found — skipping pytest" >&2
        echo "" >&2
    fi
fi

# ── Result ──────────────────────────────────────────────────────────────────────
if [ "$FAILED" -eq 1 ]; then
    echo "🚫 Pre-commit checks failed. Fix the issues above before committing." >&2
    exit 2
fi

echo "✅ All checks passed — proceeding with commit." >&2
exit 0
