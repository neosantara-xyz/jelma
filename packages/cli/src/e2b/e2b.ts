import type { VMConnection } from "../history.js";

import { mkdirSync, writeFileSync } from "node:fs";
import { isNumber } from "@neosantara/jelma-shared";
import { Sandbox } from "e2b";
import * as v from "valibot";
import { parseJsonWith } from "../shared/parse.js";
import { getSpawnCloudConfigPath } from "../shared/paths.js";
import { asyncTryCatch } from "../shared/result.js";
import { loadApiToken, logInfo, logStep, openBrowser, prepareStdinForHandoff, prompt } from "../shared/ui.js";

interface E2BConfigFile {
  api_key?: string;
  token?: string;
  domain?: string;
  sandbox_id?: string;
}

const E2BConfigFileSchema = v.object({
  api_key: v.optional(v.string()),
  token: v.optional(v.string()),
  domain: v.optional(v.string()),
  sandbox_id: v.optional(v.string()),
});

interface E2BState {
  sandbox: Sandbox | null;
  sandboxId: string;
  sandboxName: string;
}

const _state: E2BState = {
  sandbox: null,
  sandboxId: "",
  sandboxName: "",
};

function getE2BConfigPath(): string {
  return getSpawnCloudConfigPath("e2b");
}

async function readSavedE2BConfigSafe(): Promise<E2BConfigFile | null> {
  const configFile = Bun.file(getE2BConfigPath());
  if (!(await configFile.exists())) {
    return null;
  }
  const raw = await configFile.text();
  return parseJsonWith(raw, E2BConfigFileSchema);
}

function resolveConfiguredToken(saved: E2BConfigFile | null): string {
  const envToken = process.env.E2B_API_KEY?.trim();
  if (envToken) {
    return envToken;
  }
  return loadApiToken("e2b") || saved?.api_key || saved?.token || "";
}

async function saveE2BConfig(config: { apiKey: string; domain?: string; sandboxId?: string }): Promise<void> {
  const configPath = getE2BConfigPath();
  const dir = configPath.replace(/\/[^/]+$/, "");
  mkdirSync(dir, {
    recursive: true,
    mode: 0o700,
  });

  const payload: E2BConfigFile = {
    api_key: config.apiKey,
    token: config.apiKey,
    ...(config.domain
      ? {
          domain: config.domain,
        }
      : {}),
    ...(config.sandboxId
      ? {
          sandbox_id: config.sandboxId,
        }
      : {}),
  };

  writeFileSync(configPath, `${JSON.stringify(payload, null, 2)}\n`, {
    mode: 0o600,
  });
}

function getE2BKeysUrl(): string {
  return "https://e2b.dev/docs";
}

async function getOrPromptCredentials(): Promise<{
  apiKey: string;
  domain?: string;
}> {
  const saved = await readSavedE2BConfigSafe();
  const configuredApiKey = resolveConfiguredToken(saved);
  const configuredDomain = process.env.E2B_DOMAIN || saved?.domain;

  if (configuredApiKey) {
    return {
      apiKey: configuredApiKey,
      domain: configuredDomain,
    };
  }

  logStep("E2B API key required");
  logInfo("Opening E2B docs to get API key...");
  openBrowser(getE2BKeysUrl());

  for (;;) {
    const token = (await prompt("Paste your E2B API key (starts with e2b_): ")).trim();
    if (!token) {
      continue;
    }

    const validate = await asyncTryCatch(async () => {
      const sandbox = await Sandbox.create({
        apiKey: token,
        ...(configuredDomain
          ? {
              domain: configuredDomain,
            }
          : {}),
      });
      await sandbox.kill();
    });

    if (validate.ok) {
      await saveE2BConfig({
        apiKey: token,
        ...(configuredDomain
          ? {
              domain: configuredDomain,
            }
          : {}),
      });
      return {
        apiKey: token,
        ...(configuredDomain
          ? {
              domain: configuredDomain,
            }
          : {}),
      };
    }

    logInfo("Invalid E2B API key or domain. Please try again.");
  }
}

export async function ensureE2BAuthenticated(): Promise<void> {
  await getOrPromptCredentials();
}

export async function promptE2BSandboxName(): Promise<void> {
  const fallback = process.env.E2B_SANDBOX_NAME || `jelma-${Date.now()}`;
  const name = (await prompt(`Sandbox name [${fallback}]: `)).trim() || fallback;
  _state.sandboxName = name;
}

export async function promptE2BSize(): Promise<void> {
  return;
}

export async function getServerName(): Promise<string> {
  return _state.sandboxName || process.env.E2B_SANDBOX_NAME || `jelma-${Date.now()}`;
}

function parseTimeoutMs(): number {
  const raw = process.env.E2B_TIMEOUT_MS;
  if (!raw) {
    return 60 * 60 * 1000;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 60 * 60 * 1000;
  }
  return parsed;
}

export async function createServer(name: string): Promise<VMConnection> {
  const creds = await getOrPromptCredentials();

  const sandbox = await Sandbox.create({
    apiKey: creds.apiKey,
    ...(creds.domain
      ? {
          domain: creds.domain,
        }
      : {}),
    timeoutMs: parseTimeoutMs(),
    envs: {
      JELMA_SANDBOX_NAME: name,
    },
  });

  _state.sandbox = sandbox;
  _state.sandboxId = sandbox.sandboxId;
  _state.sandboxName = name;

  await saveE2BConfig({
    apiKey: creds.apiKey,
    domain: creds.domain,
    sandboxId: sandbox.sandboxId,
  });

  logInfo(`E2B sandbox created: ${sandbox.sandboxId}`);

  return {
    ip: sandbox.sandboxId,
    user: "user",
    server_id: sandbox.sandboxId,
    server_name: name,
    cloud: "e2b",
  };
}

async function getOrReconnectSandbox(): Promise<Sandbox> {
  if (_state.sandbox) {
    return _state.sandbox;
  }

  const saved = await readSavedE2BConfigSafe();
  const sandboxId = process.env.E2B_SANDBOX_ID || saved?.sandbox_id;
  if (!sandboxId) {
    throw new Error("No E2B sandbox is active. Create a sandbox first.");
  }

  const creds = await getOrPromptCredentials();
  const sandbox = await Sandbox.connect(sandboxId, {
    apiKey: creds.apiKey,
    ...(creds.domain
      ? {
          domain: creds.domain,
        }
      : {}),
  });

  _state.sandbox = sandbox;
  _state.sandboxId = sandbox.sandboxId;
  return sandbox;
}

export async function waitForReady(): Promise<void> {
  const sandbox = await getOrReconnectSandbox();
  await sandbox.commands.run("echo ready");
}

export async function runServer(cmd: string, timeoutSecs?: number): Promise<void> {
  const sandbox = await getOrReconnectSandbox();
  const timeoutMs = isNumber(timeoutSecs) && timeoutSecs > 0 ? timeoutSecs * 1000 : undefined;

  const result = await sandbox.commands.run(cmd, {
    onStdout: (data) => {
      process.stdout.write(data);
    },
    onStderr: (data) => {
      process.stderr.write(data);
    },
    ...(timeoutMs
      ? {
          timeoutMs,
        }
      : {}),
  });

  if (isNumber(result.exitCode) && result.exitCode !== 0) {
    throw new Error(`E2B command failed with exit code ${result.exitCode}`);
  }
}

export async function uploadFile(localPath: string, remotePath: string): Promise<void> {
  const sandbox = await getOrReconnectSandbox();
  const content = await Bun.file(localPath).text();
  await sandbox.files.write(remotePath, content);
}

export async function downloadFile(remotePath: string, localPath: string): Promise<void> {
  const sandbox = await getOrReconnectSandbox();
  const content = await sandbox.files.read(remotePath);
  await Bun.write(localPath, content);
}

export async function interactiveSession(initialCmd: string): Promise<number> {
  const sandbox = await getOrReconnectSandbox();

  prepareStdinForHandoff();
  const tty = await sandbox.pty.create({
    cols: process.stdout.columns || 120,
    rows: process.stdout.rows || 40,
    timeoutMs: 0,
    cwd: "/home/user",
    onData: (data) => {
      process.stdout.write(data);
    },
  });

  const onData = (chunk: Buffer) => {
    void sandbox.pty.sendInput(tty.pid, chunk);
  };

  const onResize = () => {
    void sandbox.pty.resize(tty.pid, {
      cols: process.stdout.columns || 120,
      rows: process.stdout.rows || 40,
    });
  };

  process.stdin.setRawMode?.(true);
  process.stdin.resume();
  process.stdin.on("data", onData);
  process.stdout.on("resize", onResize);

  const sessionResult = await asyncTryCatch(async () => {
    await sandbox.pty.sendInput(tty.pid, new TextEncoder().encode(`${initialCmd}\n`));
    const result = await tty.wait();
    return result.exitCode || 0;
  });

  process.stdin.off("data", onData);
  process.stdout.off("resize", onResize);
  process.stdin.setRawMode?.(false);
  process.stdin.pause();

  if (!sessionResult.ok) {
    throw sessionResult.error;
  }

  return sessionResult.data;
}
