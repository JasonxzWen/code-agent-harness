import { describe, expect, test } from "bun:test";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createDefaultToolRegistry } from "../src/index";
import { resolveSafePath } from "../src/policies";

const fixtureRoot = path.resolve("fixtures/tiny-ts-repo");

describe("tool policies", () => {
  test("allows paths inside the repository", async () => {
    await expect(resolveSafePath(fixtureRoot, "package.json")).resolves.toContain(
      "package.json"
    );
  });

  test("blocks path traversal", async () => {
    await expect(resolveSafePath(fixtureRoot, "../AGENTS.md")).rejects.toThrow();
  });

  test("blocks secret-like paths", async () => {
    await expect(resolveSafePath(fixtureRoot, ".env")).rejects.toThrow();
  });
});

describe("default tools", () => {
  test("lists and reads safe files", async () => {
    const registry = createDefaultToolRegistry();
    const listResult = await registry.execute(
      {
        id: "list",
        name: "list_files",
        input: {
          path: ".",
          maxResults: 20
        }
      },
      {
        repoRoot: fixtureRoot
      }
    );

    expect(listResult.ok).toBe(true);
    expect(JSON.stringify(listResult.output)).toContain("src/index.ts");

    const readResult = await registry.execute(
      {
        id: "read",
        name: "read_file",
        input: {
          path: "src/index.ts"
        }
      },
      {
        repoRoot: fixtureRoot
      }
    );

    expect(readResult.ok).toBe(true);
    expect(JSON.stringify(readResult.output)).toContain("greet");
  });

  test("denies command execution without approval", async () => {
    const registry = createDefaultToolRegistry();
    const result = await registry.execute(
      {
        id: "cmd",
        name: "run_command",
        input: {
          command: ["bun", "--version"]
        }
      },
      {
        repoRoot: fixtureRoot
      }
    );

    expect(result.ok).toBe(false);
    expect(result.error?.kind).toBe("permission_denied");
  });

  test("denies binary reads", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "agent-harness-"));
    await writeFile(path.join(root, "binary.bin"), Buffer.from([0, 1, 2, 3]));
    const registry = createDefaultToolRegistry();
    const result = await registry.execute(
      {
        id: "read-binary",
        name: "read_file",
        input: {
          path: "binary.bin"
        }
      },
      {
        repoRoot: root
      }
    );

    expect(result.ok).toBe(false);
    expect(result.error?.kind).toBe("tool_execution_error");
  });
});
