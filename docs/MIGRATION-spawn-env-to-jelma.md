# Migration plan: `SPAWN_*` → `JELMA_*` (env vars + `sh/` + backend)

Status: **PLAN — not executed.** This is the deferred "Tier A+E" tranche from the
spawn→jelma rebrand. The user-facing brand is already Jelma (paths, logs, internal
symbols). This document covers the *coupled* rename that cannot be done unilaterally
because three systems share the `SPAWN_*` env contract:

1. the CLI code (`packages/cli/src`) — **reads** `process.env.SPAWN_*`
2. the `sh/` scripts (96 files) — **read/emit** `SPAWN_*` on the VM
3. the **Neosantara backend** — **sets** `SPAWN_*` when it launches agent VMs

If any one renames without the others, recursive spawning and VM provisioning break.

---

## What is and isn't in scope

**In scope (rename `SPAWN_<X>` → `JELMA_<X>`):** the ~40 runtime env vars —
`SPAWN_HOME`, `SPAWN_NAME`, `SPAWN_NON_INTERACTIVE`, `SPAWN_BETA`, `SPAWN_PROMPT`,
`SPAWN_TELEMETRY`, `SPAWN_HEADLESS`, `SPAWN_FAST`, `SPAWN_DEPTH`, `SPAWN_PARENT_ID`,
… (full list: `scripts/migrate-spawn-env.sh`, `ENV_VARS`).

**Explicitly OUT of scope (do NOT rename — see rebrand PR rationale):**

| Thing | Why it stays |
|---|---|
| `Bun.spawn` / `spawnSync` (269×) | language API, not brand |
| recursive-spawn feature (`spawn-config/md/skill.ts`, "child spawns") | "spawn" is the verb for the feature, not the product name |
| `SPAWN_DIGITALOCEAN_ATTRIBUTION_TAG` **value** `"spawn"` | DigitalOcean partner attribution contract (the *symbol* may rename; the string value must stay `"spawn"`) |
| resource IDs: `spawn-key` (AWS), `spawn-${key}` (SSH keys), `managed-by: spawn` (Daytona label), `findSpawnSnapshot` prefix `spawn-${agent}-`, `DOCKER_CONTAINER_NAME="spawn-agent"`, sandbox id `spawn-${uuid}`, session `spawn-auto-update` | these identify **already-provisioned** cloud resources; renaming orphans every VM/snapshot/sandbox created before the change |
| telemetry event names `spawn_launched/connected/deleted` | renaming breaks historical PostHog funnel continuity |

The migration script only touches uppercase env tokens (`\bSPAWN_[A-Z0-9_]+\b`), so the
lowercase resource-id strings above are never matched.

---

## The shim (the safety net that makes this incremental)

`index.ts` currently runs a startup shim that mirrors **`JELMA_* → SPAWN_*`** (new→old)
*before* anything reads env, so today the code reads `SPAWN_*` and users/backend can
already pass either name.

After we rename the code to read `JELMA_*`, we must **flip the shim** to mirror
**`SPAWN_* → JELMA_*`** (old→new), so the backend (still emitting `SPAWN_*`) keeps
working until it's migrated. Only after the backend emits `JELMA_*` do we delete the shim.

```
Phase 0 (today):  code reads SPAWN_*   shim: JELMA_*→SPAWN_*   backend emits SPAWN_*   ✅
Phase 1 (this):   code reads JELMA_*   shim: SPAWN_*→JELMA_*   backend emits SPAWN_*   ✅
Phase 2 (later):  code reads JELMA_*   shim: SPAWN_*→JELMA_*   backend emits JELMA_*   ✅
Phase 3 (final):  code reads JELMA_*   shim: removed           backend emits JELMA_*   ✅
```

Each phase is independently shippable and backward-compatible. Never skip the shim flip
between Phase 0 and Phase 1.

---

## Execution order (do NOT reorder)

1. **Run the script in dry-run**, review the diff scope:
   ```
   bash scripts/migrate-spawn-env.sh            # dry-run, prints counts per file
   ```
2. **Apply** to code + `sh/`:
   ```
   bash scripts/migrate-spawn-env.sh --apply
   ```
3. **Flip the shim** in `packages/cli/src/index.ts`: change the mirror loop from
   `JELMA_* → SPAWN_*` to `SPAWN_* → JELMA_*` (only set the `JELMA_` key when unset).
   Keep `migrateLegacyPaths()` as-is.
4. **Restore the attribution tag value** if the script touched it: ensure
   `…ATTRIBUTION_TAG = "spawn"` still has the lowercase `"spawn"` value (the script
   should not change the value, but verify).
5. **Verify the CLI**: `bunx tsc --noEmit` (0 source errors), `bunx @biomejs/biome lint src/`,
   `bun test` (compare fail count to the documented baseline — expect no *net* new fails),
   and the e2e smoke (`migrateLegacyPaths` + `jelma local <agent>` headless).
6. **Update the docs/help** that reference `SPAWN_*` for users (README, `--help` text).
7. **Backend (separate repo, separate deploy) — coordinate:** the backend must start
   emitting `JELMA_*` (it can emit both during the overlap). Checklist below.
8. **Phase 3:** once backend is confirmed emitting `JELMA_*` in production, delete the
   shim and remove `SPAWN_*` fallbacks. Ship as a clear breaking-change release note.

---

## Backend checklist (Neosantara — must be done in lockstep, Phase 2)

Grep the backend for every `SPAWN_` it writes into the VM environment / cloud-init /
user-data / agent launch command. Each must gain a `JELMA_` equivalent. Known hot vars
the CLI relies on when running as a *child* on a VM:

- [ ] `SPAWN_HOME` → `JELMA_HOME`
- [ ] `SPAWN_NAME` / `SPAWN_NAME_KEBAB` / `SPAWN_NAME_DISPLAY` → `JELMA_*`
- [ ] `SPAWN_PARENT_ID`, `SPAWN_DEPTH` (recursion bookkeeping) → `JELMA_*`
- [ ] `SPAWN_PROMPT`, `SPAWN_ENABLED_STEPS`, `SPAWN_SELECTED_SKILLS`, `SPAWN_SKILL_ENV_PAIRS`
- [ ] `SPAWN_BETA`, `SPAWN_MODE`, `SPAWN_FAST`, `SPAWN_HEADLESS`, `SPAWN_NON_INTERACTIVE`
- [ ] `SPAWN_TELEMETRY*`, `SPAWN_REF`, `SPAWN_CDN`, `SPAWN_AUTO_UPDATE`
- [ ] any cloud-cred delegation paths the backend writes (see note below)

> Note: cloud creds on the VM now live in **both** `~/.config/jelma` and `~/.config/spawn`
> (the rebrand PR dual-writes them). The backend can target either during overlap; prefer
> `~/.config/jelma` once the CLI fully reads jelma.

---

## Rollback

- The script writes nothing in dry-run. The `--apply` pass is a pure text substitution on
  tracked files — `git checkout -- .` reverts it.
- Because the shim is bidirectional during Phases 1–2, a bad deploy can be rolled back to
  the previous CLI release without the backend changing anything.
- Phase 3 (shim removal) is the only hard cut — gate it behind a release that explicitly
  drops `SPAWN_*` support.
