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

assert.equal(state.status, "completed");
assert.ok(state.finalAnswer?.includes("package.json"));
assert.ok(existsSync(tracePath));

const patchRepoRoot = await mkdtemp(path.join(tmpdir(), "agent-harness-smoke-"));
try {
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
