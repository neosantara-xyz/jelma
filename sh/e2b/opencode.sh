#!/bin/bash
set -eo pipefail

_ensure_bun() {
    if command -v bun &>/dev/null; then return 0; fi
    printf '\033[0;36mInstalling bun...\033[0m\n' >&2
    curl -fsSL --proto '=https' --show-error https://bun.sh/install?version=1.3.9 | bash >/dev/null || { printf '\033[0;31mFailed to install bun\033[0m\n' >&2; exit 1; }
    export PATH="$HOME/.bun/bin:$PATH"
    command -v bun &>/dev/null || { printf '\033[0;31mbun not found after install\033[0m\n' >&2; exit 1; }
}

_ensure_bun

if [[ -n "${SPAWN_CLI_DIR:-}" && -f "$SPAWN_CLI_DIR/packages/cli/src/e2b/main.ts" ]]; then
    exec bun run "$SPAWN_CLI_DIR/packages/cli/src/e2b/main.ts" opencode "$@"
fi

E2B_JS=$(mktemp)
trap 'rm -f "$E2B_JS"' EXIT
curl -fsSL --proto '=https' "https://github.com/neosantara-xyz/jelma/releases/download/e2b-latest/e2b.js" -o "$E2B_JS"     || { printf '\033[0;31mFailed to download e2b.js\033[0m\n' >&2; exit 1; }

exec bun run "$E2B_JS" opencode "$@"
