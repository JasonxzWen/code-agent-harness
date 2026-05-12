import { createJsonlEventLogger, runAgentTask } from "@code-agent-harness/core";
import { createOpenAIProviderFromEnv } from "@code-agent-harness/providers";
import { createDefaultToolRegistry } from "@code-agent-harness/tools";
import path from "node:path";

if (
  process.env.OPENAI_API_KEY === undefined ||
  process.env.OPENAI_API_KEY.length === 0
) {
  // What: live smoke 没有 API key 时显式 skipped。Why: release quality gate 不能被
  // 外部凭证可用性阻塞。How: 输出 skipped 并以 0 退出，避免误报失败或通过真实调用。
  console.log("smoke:live skipped: OPENAI_API_KEY is not set");
  process.exit(0);
}

const repoRoot = path.resolve("fixtures/tiny-ts-repo");
const tracePath = path.resolve(
  ".agent-harness/traces",
  `smoke-live-${Date.now().toString()}.jsonl`
);

const state = await runAgentTask({
  // What: live smoke 走真实 OpenAI provider 和默认 tool registry。Why: 它验证
  // provider boundary，但仍使用 tiny fixture 控制风险。How: maxSteps 有上限，trace
  // 写入本地 `.agent-harness/traces`。
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
