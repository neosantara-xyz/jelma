/**
 * cmd-models.test.ts — Tests for `jelma models` command
 */

import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import { asyncTryCatch } from "@neosantara/jelma-shared";
import { createConsoleMocks, restoreMocks } from "./test-helpers";

// ── Mocks ───────────────────────────────────────────────────────────────────

const consoleMocks = createConsoleMocks();

let processExitSpy: ReturnType<typeof spyOn>;
let savedKey: string | undefined;

beforeEach(() => {
  savedKey = process.env.NEOSANTARA_API_KEY;
  consoleMocks.log.mockClear();
  consoleMocks.error.mockClear();
  processExitSpy = spyOn(process, "exit").mockImplementation(() => {
    throw new Error("process.exit");
  });
});

afterEach(() => {
  if (savedKey !== undefined) {
    process.env.NEOSANTARA_API_KEY = savedKey;
  } else {
    delete process.env.NEOSANTARA_API_KEY;
  }
  processExitSpy.mockRestore();
  restoreMocks();
});

// ── Import under test ────────────────────────────────────────────────────────

const { cmdModels } = await import("../commands/models.js");

// ── Helpers ──────────────────────────────────────────────────────────────────

function mockModelsResponse(
  models: Array<{
    id: string;
    capabilities?: string[];
    pricing?: Record<string, number>;
  }>,
) {
  return mock(
    async () =>
      new Response(
        JSON.stringify({
          data: models,
        }),
        {
          status: 200,
        },
      ),
  );
}

function getOutput(): string {
  return [
    ...consoleMocks.log.mock.calls.map((c: unknown[]) => c.join(" ")),
    ...consoleMocks.error.mock.calls.map((c: unknown[]) => c.join(" ")),
  ].join("\n");
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("cmdModels", () => {
  it("exits with error when NEOSANTARA_API_KEY is not set", async () => {
    delete process.env.NEOSANTARA_API_KEY;

    await asyncTryCatch(() => cmdModels());

    expect(processExitSpy).toHaveBeenCalledWith(1);
    const output = getOutput();
    expect(output).toContain("NEOSANTARA_API_KEY is not set");
  });

  it("exits with error on fetch failure", async () => {
    process.env.NEOSANTARA_API_KEY = "sk-test-key";
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock(
      async () =>
        new Response("Internal Server Error", {
          status: 500,
        }),
    );

    await asyncTryCatch(() => cmdModels());

    expect(processExitSpy).toHaveBeenCalledWith(1);
    const output = getOutput();
    expect(output).toContain("Failed to fetch models");

    globalThis.fetch = originalFetch;
  });

  it("displays coding models from valid response", async () => {
    process.env.NEOSANTARA_API_KEY = "sk-test-key";
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockModelsResponse([
      {
        id: "garda-core",
        capabilities: [
          "function_calling",
          "vision",
        ],
        pricing: {
          prompt: 3,
          completion: 15,
        },
      },
      {
        id: "garda-mini",
        capabilities: [
          "function_calling",
        ],
        pricing: {
          prompt: 0.5,
          completion: 1.5,
        },
      },
      {
        id: "embed-v1",
        capabilities: [
          "embedding",
        ],
      },
    ]);

    await cmdModels();

    const output = getOutput();
    expect(output).toContain("garda-core");
    expect(output).toContain("garda-mini");
    // embed-v1 lacks function_calling, not shown by default
    expect(output).not.toContain("embed-v1");
    expect(output).toContain("2 coding models shown");

    globalThis.fetch = originalFetch;
  });

  it("filters models by text filter", async () => {
    process.env.NEOSANTARA_API_KEY = "sk-test-key";
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockModelsResponse([
      {
        id: "garda-core",
        capabilities: [
          "function_calling",
        ],
      },
      {
        id: "garda-mini",
        capabilities: [
          "function_calling",
        ],
      },
      {
        id: "other-model",
        capabilities: [
          "function_calling",
        ],
      },
    ]);

    await cmdModels("garda");

    const output = getOutput();
    expect(output).toContain("garda-core");
    expect(output).toContain("garda-mini");
    expect(output).not.toContain("other-model");
    expect(output).toContain("2 coding models shown");

    globalThis.fetch = originalFetch;
  });

  it("shows all models when showAll flag is true", async () => {
    process.env.NEOSANTARA_API_KEY = "sk-test-key";
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockModelsResponse([
      {
        id: "garda-core",
        capabilities: [
          "function_calling",
        ],
      },
      {
        id: "embed-v1",
        capabilities: [
          "embedding",
        ],
      },
    ]);

    await cmdModels(undefined, true);

    const output = getOutput();
    expect(output).toContain("garda-core");
    expect(output).toContain("embed-v1");

    globalThis.fetch = originalFetch;
  });

  it("shows no-match message when filter yields nothing", async () => {
    process.env.NEOSANTARA_API_KEY = "sk-test-key";
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockModelsResponse([
      {
        id: "garda-core",
        capabilities: [
          "function_calling",
        ],
      },
    ]);

    await cmdModels("nonexistent");

    const output = getOutput();
    expect(output).toContain("No coding models matching");

    globalThis.fetch = originalFetch;
  });

  it("uses coding plan endpoint for nsk_code_ keys", async () => {
    process.env.NEOSANTARA_API_KEY = "nsk_code_test123";
    const originalFetch = globalThis.fetch;
    const fetchMock = mock(async (url: string | URL) => {
      return new Response(
        JSON.stringify({
          data: [
            {
              id: "plan-model",
              capabilities: [
                "function_calling",
              ],
            },
          ],
        }),
        {
          status: 200,
        },
      );
    });
    globalThis.fetch = fetchMock;

    await cmdModels();

    const calledUrl = String(fetchMock.mock.calls[0][0]);
    expect(calledUrl).toContain("/coding/v1/models");

    const output = getOutput();
    expect(output).toContain("Coding plan endpoint");

    globalThis.fetch = originalFetch;
  });
});
