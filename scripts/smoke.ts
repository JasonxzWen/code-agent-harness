import { createJsonlEventLogger, runAgentTask } from "@code-agent-harness/core";
import { createMockProvider } from "@code-agent-harness/providers";
import { createDefaultToolRegistry } from "@code-agent-harness/tools";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { strict as assert } from "node:assert";

const repoRoot = path.resolve("fixtures/tiny-ts-repo");
const traceDir = path.resolve(".agent-harness/traces");
await mkdir(traceDir, { recursive: true });
const tracePath = path.join(traceDir, `smoke-${Date.now().toString()}.jsonl`);

const state = await runAgentTask({
  task: "Explain this repository structure and identify the main modules.",
  repoRoot,
  provider: createMockProvider(),
  tools: createDefaultToolRegistry(),
  logger: createJsonlEventLogger(tracePath)
});

assert.equal(state.status, "completed");
assert.ok(state.finalAnswer?.includes("package.json"));
assert.ok(existsSync(tracePath));

console.log(`smoke passed: ${state.runId}`);
