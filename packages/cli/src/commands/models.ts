// commands/models.ts — List coding-capable models from Neosantara API

import { isNumber } from "@neosantara/jelma-shared";
import pc from "picocolors";
import * as v from "valibot";
import { openaiBaseUrl } from "../shared/api.js";
import { asyncTryCatch, tryCatch } from "../shared/result.js";

const FETCH_TIMEOUT_MS = 10_000;

const ModelSchema = v.object({
  id: v.string(),
  capabilities: v.optional(v.array(v.string())),
  pricing: v.optional(v.record(v.string(), v.unknown())),
});

const ModelsResponseSchema = v.object({
  data: v.array(ModelSchema),
});

function formatPricing(p: number): string {
  if (p === 0) {
    return "free";
  }
  if (p >= 1000) {
    return `$${(p / 1000).toFixed(2)}K/M`;
  }
  return `$${p.toFixed(2)}/M`;
}

function hasCap(caps: string[] | undefined, name: string): boolean {
  return (caps ?? []).includes(name);
}

function getPricingValue(pricing: Record<string, unknown> | undefined, key: string): number {
  if (!pricing || typeof pricing !== "object") {
    return 0;
  }
  const val = pricing[key];
  return isNumber(val) ? val : 0;
}

export async function cmdModels(filter?: string, showAll?: boolean): Promise<void> {
  const key = process.env.NEOSANTARA_API_KEY;
  if (!key) {
    console.error(pc.red("NEOSANTARA_API_KEY is not set"));
    console.error();
    console.error(`  Set it: ${pc.cyan("export NEOSANTARA_API_KEY=sk-...")}`);
    console.error(`  Or use: ${pc.cyan("NEOSANTARA_API_KEY=sk-... jelma models")}`);
    process.exit(1);
  }

  const baseUrl = openaiBaseUrl(key);

  const fetchResult = await asyncTryCatch(async () => {
    const res = await fetch(`${baseUrl}/models`, {
      headers: {
        Authorization: `Bearer ${key}`,
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`API error ${res.status}: ${text.slice(0, 200)}`);
    }
    return res.json();
  });

  if (!fetchResult.ok) {
    console.error(pc.red(`Failed to fetch models: ${fetchResult.error.message}`));
    process.exit(1);
  }

  const parseResult = tryCatch(() => {
    const parsed = v.safeParse(ModelsResponseSchema, fetchResult.data);
    if (!parsed.success) {
      throw new Error("Invalid response schema");
    }
    return parsed.output.data;
  });

  if (!parseResult.ok) {
    console.error(pc.red("Failed to parse model list from API response"));
    process.exit(1);
  }

  const models = parseResult.data;

  if (models.length === 0) {
    console.log(pc.yellow("No models available for this API key."));
    return;
  }

  // Default: only coding-capable models (function_calling). --all shows everything.
  let filtered = showAll ? models : models.filter((m) => hasCap(m.capabilities, "function_calling"));

  // Text filter
  if (filter) {
    const lower = filter.toLowerCase();
    filtered = filtered.filter((m) => m.id.toLowerCase().includes(lower));
    if (filtered.length === 0) {
      console.log(pc.yellow(`No coding models matching "${filter}".`));
      console.log();
      console.log(`  Run ${pc.cyan("jelma models")} to see all coding models.`);
      console.log(`  Run ${pc.cyan("jelma models all")} to see every model.`);
      return;
    }
  }

  if (filtered.length === 0) {
    console.log(pc.yellow("No coding-capable models found for this API key."));
    console.log();
    console.log(`  Run ${pc.cyan("jelma models all")} to see every model.`);
    return;
  }

  const nameWidth = Math.min(Math.max(...filtered.map((m) => m.id.length), 10) + 2, 48);

  console.log();
  console.log(
    `${pc.bold("Model".padEnd(nameWidth))} ${pc.bold("Pricing (prompt / completion)".padEnd(28))} ${pc.bold("Capabilities")}`,
  );
  console.log(pc.dim("─".repeat(Math.min(process.stdout.columns || 80, 120))));

  for (const m of filtered) {
    const name = m.id.padEnd(nameWidth);
    const promptPrice = formatPricing(getPricingValue(m.pricing, "prompt"));
    const completionPrice = formatPricing(getPricingValue(m.pricing, "completion"));
    const pricing = `${promptPrice.padEnd(10)} ${completionPrice.padEnd(10)}`.padEnd(28);

    const tags: string[] = [];
    if (hasCap(m.capabilities, "vision")) {
      tags.push(pc.cyan("vision"));
    }
    if (hasCap(m.capabilities, "reasoning")) {
      tags.push(pc.yellow("reasoning"));
    }
    if (hasCap(m.capabilities, "function_calling")) {
      tags.push(pc.green("fn-call"));
    }
    if (hasCap(m.capabilities, "json_mode")) {
      tags.push(pc.dim("json"));
    }

    console.log(`${name} ${pricing} ${tags.join(" ")}`);
  }

  console.log();
  console.log(pc.dim(`${filtered.length} coding models shown`));
  if (!showAll) {
    console.log(pc.dim(`Run ${pc.cyan("jelma models all")} to see all ${models.length} models.`));
  }
  if (baseUrl.includes("/coding/")) {
    console.log(pc.dim("Coding plan endpoint — models available under your plan."));
  }
  console.log(pc.dim("Usage: jelma <agent> <cloud> --model <model-id>"));
}
