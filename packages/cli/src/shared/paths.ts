// shared/paths.ts — Centralized filesystem path resolution
//
// All path helpers live here. Production code imports from this module;
// no other module should call homedir() or construct spawn-specific paths directly.

import { existsSync, mkdirSync, renameSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { tryCatch } from "./result.js";

/** Return the user's home directory, preferring $HOME over os.homedir(). */
export function getUserHome(): string {
  return process.env.HOME || homedir();
}

/**
 * One-time migration of legacy "spawn"-branded storage roots to "jelma".
 * Renames each old dir to its new name when the old exists and the new doesn't,
 * so existing users keep their saved credentials, history, and identity after
 * the rebrand. Best-effort: a failed rename falls through to fresh state.
 *
 * er: only the default roots are migrated; a custom SPAWN_HOME/JELMA_HOME is
 * left untouched (the user owns that path). Upgrade path: manual move.
 */
export function migrateLegacyPaths(): void {
  const home = getUserHome();
  const cacheBase = process.env.XDG_CACHE_HOME || join(home, ".cache");
  const pairs: Array<
    [
      string,
      string,
    ]
  > = [
    [
      join(home, ".config", "spawn"),
      join(home, ".config", "jelma"),
    ],
    [
      join(cacheBase, "spawn"),
      join(cacheBase, "jelma"),
    ],
  ];
  // Only migrate the default data dir when no explicit home override is set.
  if (!process.env.SPAWN_HOME && !process.env.JELMA_HOME) {
    pairs.push([
      join(home, ".spawn"),
      join(home, ".jelma"),
    ]);
  }
  for (const [oldDir, newDir] of pairs) {
    if (existsSync(oldDir) && !existsSync(newDir)) {
      // best-effort; a failed rename (cross-device, perms) falls through to
      // fresh state at the new path.
      tryCatch(() => {
        mkdirSync(dirname(newDir), {
          recursive: true,
        });
        renameSync(oldDir, newDir);
      });
    }
  }
}

/** Returns the directory for jelma data, respecting SPAWN_HOME env var.
 *  SPAWN_HOME must be an absolute path if set; relative paths are rejected
 *  to prevent unintended file writes. */
export function getJelmaDir(): string {
  const spawnHome = process.env.SPAWN_HOME;
  if (!spawnHome) {
    return join(getUserHome(), ".jelma");
  }
  // Require absolute path to prevent path traversal via relative paths
  if (!isAbsolute(spawnHome)) {
    throw new Error(
      `JELMA_HOME must be an absolute path (got "${spawnHome}").\n` + "Example: export JELMA_HOME=/home/user/.jelma",
    );
  }
  // Resolve to canonical form (collapses .. segments)
  const resolved = resolve(spawnHome);

  // SECURITY: Prevent path traversal to system directories
  // Even though the path is absolute, resolve() can normalize paths like
  // /tmp/../../root/.jelma to /root/.spawn, potentially allowing unauthorized
  // file writes to sensitive directories.
  const userHome = getUserHome();
  if (!resolved.startsWith(userHome + "/") && resolved !== userHome) {
    throw new Error("JELMA_HOME must be within your home directory.\n" + `Got: ${resolved}\n` + `Home: ${userHome}`);
  }

  return resolved;
}

/** Path to the jelma history file. */
export function getHistoryPath(): string {
  return join(getJelmaDir(), "history.json");
}

/**
 * Return the path to the per-cloud config file: ~/.config/spawn/{cloud}.json
 * Shared by all cloud modules to avoid repeating the same path construction.
 */
export function getJelmaCloudConfigPath(cloud: string): string {
  return join(getUserHome(), ".config", "jelma", `${cloud}.json`);
}

/** Return the path to the jelma preferences file: ~/.config/spawn/preferences.json */
export function getJelmaPreferencesPath(): string {
  return join(getUserHome(), ".config", "jelma", "preferences.json");
}

/** Return the path to the install referrer file: ~/.config/spawn/.ref */
export function getInstallRefPath(): string {
  return join(getUserHome(), ".config", "jelma", ".ref");
}

/**
 * Return the path to the persistent install ID file.
 * Stable per machine across `spawn` invocations — used as PostHog `distinct_id`
 * for telemetry events and feature-flag bucketing. Path matches the legacy
 * telemetry-id location so existing users keep their identity.
 */
export function getInstallIdPath(): string {
  return join(getUserHome(), ".config", "jelma", ".telemetry-id");
}

/** Return the cache directory for spawn, respecting XDG_CACHE_HOME. */
export function getCacheDir(): string {
  return join(process.env.XDG_CACHE_HOME || join(getUserHome(), ".cache"), "jelma");
}

/** Return the path to the cached manifest file. */
export function getCacheFile(): string {
  return join(getCacheDir(), "manifest.json");
}

/** Return the path to the update-failed sentinel file. */
export function getUpdateFailedPath(): string {
  return join(getUserHome(), ".config", "jelma", ".update-failed");
}

/** Return the path to the last-successful-update-check sentinel file. */
export function getUpdateCheckedPath(): string {
  return join(getUserHome(), ".config", "jelma", ".update-checked");
}

/** Return the path to the user's ~/.ssh directory. */
export function getSshDir(): string {
  return join(getUserHome(), ".ssh");
}

/** Return the system temp directory (wraps os.tmpdir()). */
export function getTmpDir(): string {
  return tmpdir();
}

/**
 * Shell RC marker comments used by install.sh and uninstall.ts.
 * Keep in sync with sh/cli/install.sh — both files use these exact strings.
 */
export const RC_MARKER_START = "# >>> jelma >>>";
export const RC_MARKER_END = "# <<< jelma <<<";

/** Legacy single-line marker written by installer versions before start/end markers. */
export const RC_MARKER_LEGACY = "# Added by jelma installer";
