// shared/api.ts — Neosantara API base URL routing
//
// Jelma is a first-party Neosantara tool, so it can pick the right base URL
// itself instead of relying on the caller to set env vars: Coding Plan keys
// (nsk_code_*) only work on the dedicated /coding/* paths, while regular PAYG
// keys only work on the plain paths (see middleware/rateLimit.js
// coding_key_requires_coding_endpoint). NEOSANTARA_*_BASE_URL env vars are
// still honored as an escape hatch (e.g. local dev against a different
// gateway), but normal usage needs zero configuration.

export const NEOSANTARA_BASE = "https://api.neosantara.xyz";

const CODING_TOKEN_PREFIX = "nsk_code_";

export function isCodingPlanKey(apiKey: string): boolean {
  return apiKey.startsWith(CODING_TOKEN_PREFIX);
}

export function anthropicBaseUrl(apiKey: string): string {
  if (process.env.NEOSANTARA_ANTHROPIC_BASE_URL) {
    return process.env.NEOSANTARA_ANTHROPIC_BASE_URL;
  }
  return isCodingPlanKey(apiKey) ? `${NEOSANTARA_BASE}/coding/anthropic` : `${NEOSANTARA_BASE}/anthropic`;
}

export function openaiBaseUrl(apiKey: string): string {
  if (process.env.NEOSANTARA_OPENAI_BASE_URL) {
    return process.env.NEOSANTARA_OPENAI_BASE_URL;
  }
  return isCodingPlanKey(apiKey) ? `${NEOSANTARA_BASE}/coding/v1` : `${NEOSANTARA_BASE}/v1`;
}
