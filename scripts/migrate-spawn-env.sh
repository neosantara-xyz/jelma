#!/usr/bin/env bash
#
# migrate-spawn-env.sh — rename SPAWN_<X> env vars to JELMA_<X> across the CLI
# source and the sh/ scripts. Tier A+E of the spawn→jelma rebrand.
#
# This is a PURE TEXT substitution on the uppercase env-var token
#   \bSPAWN_[A-Z0-9_]+\b   →   JELMA_<same suffix>
# It deliberately does NOT match:
#   - lowercase resource-id strings ("spawn-key", "spawn-${uuid}", "managed-by: spawn")
#   - the bare prefix literal "SPAWN_" used by the shim loop (no suffix → no match)
#   - the VALUE "spawn" of SPAWN_DIGITALOCEAN_ATTRIBUTION_TAG (lowercase, not matched)
#
# Default mode is DRY-RUN (prints what would change). Pass --apply to write.
# Re-running after --apply is a no-op (idempotent): nothing left to match.
#
# After --apply you MUST still, by hand (see docs/MIGRATION-spawn-env-to-jelma.md):
#   1. flip the index.ts shim from  JELMA_*→SPAWN_*  to  SPAWN_*→JELMA_*
#   2. verify tsc / biome / bun test
#   3. coordinate the Neosantara backend to emit JELMA_*

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APPLY=0
[[ "${1:-}" == "--apply" ]] && APPLY=1

# Pattern: SPAWN_ followed by at least one uppercase/digit, word-bounded.
PATTERN='\bSPAWN_([A-Z0-9_]+)\b'

# Target file sets.
mapfile -t FILES < <(
  { find "$ROOT/packages/cli/src" -name '*.ts' -type f 2>/dev/null
    find "$ROOT/sh" -type f \( -name '*.sh' -o -name '*.bash' \) 2>/dev/null
  } | sort -u
)

total=0
changed_files=0
echo "scanning ${#FILES[@]} files under packages/cli/src + sh/ ..."
echo

for f in "${FILES[@]}"; do
  # Count token occurrences in this file (|| true: grep exits 1 on no match,
  # which would trip `set -e`/pipefail otherwise).
  n="$( { grep -oE 'SPAWN_[A-Z0-9_]+' "$f" 2>/dev/null || true; } | wc -l | tr -d ' ')"
  [[ "$n" -eq 0 ]] && continue
  total=$((total + n))
  changed_files=$((changed_files + 1))
  rel="${f#"$ROOT"/}"
  printf '  %4s  %s\n' "$n" "$rel"
  if [[ "$APPLY" -eq 1 ]]; then
    perl -pi -e "s/${PATTERN}/JELMA_\$1/g" "$f"
  fi
done

echo
echo "total occurrences: $total across $changed_files files"

# Safety check: the attribution tag VALUE must remain lowercase "spawn".
TAG_FILE="$ROOT/packages/cli/src/digitalocean/digitalocean.ts"
if [[ -f "$TAG_FILE" ]]; then
  if grep -qE 'ATTRIBUTION_TAG\s*=\s*"spawn"' "$TAG_FILE"; then
    echo 'ok: DigitalOcean ATTRIBUTION_TAG value still "spawn" (DO contract preserved)'
  else
    echo 'WARN: ATTRIBUTION_TAG value changed — restore it to "spawn" before shipping!'
  fi
fi

if [[ "$APPLY" -eq 0 ]]; then
  echo
  echo "DRY-RUN only. Re-run with --apply to write changes."
else
  echo
  echo "applied. NEXT (manual): flip index.ts shim to SPAWN_*→JELMA_*, then"
  echo "verify: (cd packages/cli && bunx tsc --noEmit && bunx @biomejs/biome lint src/ && bun test)"
fi
