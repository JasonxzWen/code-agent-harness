import { createJsonlEventLogger, runAgentTask } from "@code-agent-harness/core";
import type {
  ProviderClient,
  ProviderGenerateRequest,
  ProviderResponse
} from "@code-agent-harness/core";
import { createMockProvider } from "@code-agent-harness/providers";
import { createDefaultToolRegistry } from "@code-agent-harness/tools";
import { execa } from "execa";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
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

// What: 第一段 smoke 验证只读 inspection path。Why: 它是最低成本的 E2E
// 回归信号。How: 使用 fixture repo + mock provider，断言 final answer 和 trace。
assert.equal(state.status, "completed");
assert.ok(state.finalAnswer?.includes("package.json"));
assert.ok(existsSync(tracePath));

const patchRepoRoot = await mkdtemp(path.join(tmpdir(), "agent-harness-smoke-"));
try {
  // What: 第二段 smoke 构造临时 git repo 来验证 approved patch path。Why:
  // apply_patch 需要真实 git working tree 才能覆盖 preflight、apply 和 no-stage 边界。
  // How: 初始化 repo、提交基线文件，再由 deterministic provider 请求 patch。
  await git(patchRepoRoot, ["init"]);
  await git(patchRepoRoot, ["config", "user.email", "agent@example.com"]);
  await git(patchRepoRoot, ["config", "user.name", "Agent Harness"]);
  await mkdir(path.join(patchRepoRoot, "src"), { recursive: true });
  await writeFile(
    path.join(patchRepoRoot, "src", "index.ts"),
    `export const value = "old";\n`
  );
  await git(patchRepoRoot, ["add", "."]);
  await git(patchRepoRoot, ["commit", "-m", "initial"]);

  const patchTracePath = path.join(
    traceDir,
    `smoke-patch-${Date.now().toString()}.jsonl`
  );
  const patchState = await runAgentTask({
    task: "Update value through apply_patch.",
    repoRoot: patchRepoRoot,
    provider: createPatchSmokeProvider(),
    tools: createDefaultToolRegistry(),
    logger: createJsonlEventLogger(patchTracePath),
    permissionGate: {
      check(request) {
        // What: smoke 的 permission gate 自动批准，但仍检查 preview。Why: E2E 要
        // 覆盖“先展示 preview 再写入”的契约。How: 断言 toolName 和 diff preview 后返回 allow。
        assert.equal(request.toolName, "apply_patch");
        assert.ok(request.preview?.body?.includes("diff --git"));
        return Promise.resolve("allow");
      }
    }
  });

  assert.equal(patchState.status, "completed");
  assert.ok(patchState.finalAnswer?.includes("src/index.ts"));
  assert.equal(
    await readFile(path.join(patchRepoRoot, "src", "index.ts"), "utf8"),
    `export const value = "new";\n`
  );
  assert.ok(existsSync(patchTracePath));
} finally {
  await rm(patchRepoRoot, { recursive: true, force: true });
}

console.log(`smoke passed: ${state.runId}`);

function createPatchSmokeProvider(): ProviderClient {
  return {
    name: "patch-smoke",
    generate(request: ProviderGenerateRequest): Promise<ProviderResponse> {
      // What: deterministic provider 第一轮提出 patch，第二轮给 final answer。Why:
      // smoke 不依赖真实模型也能覆盖 provider -> tool -> permission -> final 的闭环。
      // How: step 0 返回 apply_patch tool_call，后续返回包含修改文件的 final。
      if (request.step === 0) {
        return Promise.resolve({
          type: "tool_call",
          calls: [
            {
              id: `${request.runId}-patch`,
              name: "apply_patch",
              input: {
                patch: [
                  "diff --git a/src/index.ts b/src/index.ts",
                  "--- a/src/index.ts",
                  "+++ b/src/index.ts",
                  "@@ -1 +1 @@",
                  `-export const value = "old";`,
                  `+export const value = "new";`,
                  ""
                ].join("\n")
              }
            }
          ]
        });
      }

      return Promise.resolve({
        type: "final",
        content: "Applied src/index.ts through apply_patch."
      });
    }
  };
}

function git(cwd: string, args: string[]) {
  return execa("git", args, {
    cwd
  });
}
