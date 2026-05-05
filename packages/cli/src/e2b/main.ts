#!/usr/bin/env bun

// e2b/main.ts — Orchestrator: deploys an agent on E2B

import type { CloudOrchestrator } from "../shared/orchestrate.js";

import { getErrorMessage } from "@neosantara/jelma-shared";
import pkg from "../../package.json" with { type: "json" };
import { runOrchestration } from "../shared/orchestrate.js";
import { initTelemetry } from "../shared/telemetry.js";
import { agents, resolveAgent } from "./agents.js";
import {
  createServer,
  downloadFile,
  ensureE2BAuthenticated,
  getServerName,
  interactiveSession,
  promptE2BSandboxName,
  promptE2BSize,
  runServer,
  uploadFile,
  waitForReady,
} from "./e2b.js";

async function main() {
  const agentName = process.argv[2];
  if (!agentName) {
    console.error("Usage: bun run e2b/main.ts <agent>");
    console.error(`Agents: ${Object.keys(agents).join(", ")}`);
    process.exit(1);
  }

  const agent = resolveAgent(agentName);

  const cloud: CloudOrchestrator = {
    cloudName: "e2b",
    cloudLabel: "E2B",
    runner: {
      runServer,
      uploadFile,
      downloadFile,
    },
    async authenticate() {
      await promptE2BSandboxName();
      await ensureE2BAuthenticated();
    },
    async promptSize() {
      await promptE2BSize();
    },
    async createServer(name: string) {
      return createServer(name);
    },
    getServerName,
    async waitForReady() {
      await waitForReady();
    },
    interactiveSession,
  };

  await runOrchestration(cloud, agent, agentName);
}

initTelemetry(pkg.version);
main().catch((err) => {
  process.stderr.write(`\x1b[0;31mFatal: ${getErrorMessage(err)}\x1b[0m\n`);
  process.exit(1);
});
