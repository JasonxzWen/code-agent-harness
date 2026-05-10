import { createJsonlEventLogger, runAgentTask } from "@code-agent-harness/core";
import { createOpenAIProviderFromEnv } from "@code-agent-harness/providers";
import { createDefaultToolRegistry } from "@code-agent-harness/tools";
import path from "node:path";

if (
  process.env.OPENAI_API_KEY === undefined ||
  process.env.OPENAI_API_KEY.length === 0
) {
  console.log("smoke:live skipped: OPENAI_API_KEY is not set");
  process.exit(0);
}

const repoRoot = path.resolve("fixtures/tiny-ts-repo");
const tracePath = path.resolve(
  ".agent-harness/traces",
  `smoke-live-${Date.now().toString()}.jsonl`
);

const state = await runAgentTask({
  task: "Explain this repository and cite inspected paths.",
  repoRoot,
  provider: createOpenAIProviderFromEnv(process.env.OPENAI_MODEL),
  tools: createDefaultToolRegistry(),
  logger: createJsonlEventLogger(tracePath),
  maxSteps: 8
});

if (state.status !== "completed") {
  throw new Error(state.error?.message ?? "Live smoke failed");
}

console.log(`smoke:live passed: ${state.runId}`);
