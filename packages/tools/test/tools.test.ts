import { describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
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

  test("blocks symlink escapes outside the repository", async () => {
    const tempRoot = await mkdtemp(path.join(tmpdir(), "agent-harness-"));

    try {
      const repoRoot = path.join(tempRoot, "repo");
      const outsideRoot = path.join(tempRoot, "outside");
      await mkdir(repoRoot);
      await mkdir(outsideRoot);
      await writeFile(path.join(outsideRoot, "leaked.txt"), "outside");

      await symlink(
        outsideRoot,
        path.join(repoRoot, "outside-link"),
        process.platform === "win32" ? "junction" : "dir"
      );

      await expect(
        resolveSafePath(repoRoot, "outside-link/leaked.txt")
      ).rejects.toThrow("Path escapes the repository");
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });

  test("blocks secret-like paths", async () => {
    await expect(resolveSafePath(fixtureRoot, ".env")).rejects.toThrow();
  });
});

describe("default tools", () => {
  test("rejects extra tool input fields", async () => {
    const registry = createDefaultToolRegistry();
    const result = await registry.prepare(
      {
        id: "list-extra",
        name: "list_files",
        input: {
          path: ".",
          unexpected: true
        }
      },
      {
        repoRoot: fixtureRoot
      }
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.result.error?.kind).toBe("tool_validation_error");
    }
  });

  test("rejects unknown tools", async () => {
    const registry = createDefaultToolRegistry();
    const result = await registry.prepare(
      {
        id: "missing",
        name: "missing_tool",
        input: {}
      },
      {
        repoRoot: fixtureRoot
      }
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.result.error?.kind).toBe("tool_validation_error");
    }
  });

  test("rejects invalid tool args", async () => {
    const registry = createDefaultToolRegistry();
    const result = await registry.prepare(
      {
        id: "read-invalid",
        name: "read_file",
        input: {
          path: 123
        }
      },
      {
        repoRoot: fixtureRoot
      }
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.result.error?.kind).toBe("tool_validation_error");
    }
  });

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

  test("reports read_file maxBytes truncation metadata", async () => {
    const registry = createDefaultToolRegistry();
    const result = await registry.execute(
      {
        id: "read-truncated",
        name: "read_file",
        input: {
          path: "src/index.ts",
          maxBytes: 6
        }
      },
      {
        repoRoot: fixtureRoot
      }
    );

    expect(result.ok).toBe(true);
    const output = expectObjectOutput(result.output);
    expect(output.content).toBe("export");
    expect(output.truncated).toBe(true);
    expect(output.maxBytes).toBe(6);
    expect(output.bytesRead).toBe(6);
    expect(Number(output.sizeBytes)).toBeGreaterThan(6);
  });

  test("reports list_files maxResults truncation metadata", async () => {
    const registry = createDefaultToolRegistry();
    const result = await registry.execute(
      {
        id: "list-truncated",
        name: "list_files",
        input: {
          path: ".",
          maxResults: 1
        }
      },
      {
        repoRoot: fixtureRoot
      }
    );

    expect(result.ok).toBe(true);
    const output = expectObjectOutput(result.output);
    expect(output.truncated).toBe(true);
    expect(output.maxResults).toBe(1);
    expect(output.count).toBe(1);
    expect(output.files).toHaveLength(1);
  });

  test("reports search_repo result-limit truncation metadata", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "agent-harness-"));

    try {
      await writeFile(path.join(root, "a.txt"), "needle one\n");
      await writeFile(path.join(root, "b.txt"), "needle two\n");
      await writeFile(path.join(root, "c.txt"), "needle three\n");

      const registry = createDefaultToolRegistry();
      const result = await registry.execute(
        {
          id: "search-truncated",
          name: "search_repo",
          input: {
            query: "needle",
            path: ".",
            maxResults: 2,
            contextLines: 0
          }
        },
        {
          repoRoot: root
        }
      );

      expect(result.ok).toBe(true);
      const output = expectObjectOutput(result.output);
      expect(output.truncated).toBe(true);
      expect(output.maxResults).toBe(2);
      expect(output.matchCount).toBe(2);
      expect(output.matches).toHaveLength(2);
      expect(JSON.stringify(output.matches)).toContain("needle");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
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
    expect(result.output).toBeUndefined();
  });

  test("executes an approved read-only command", async () => {
    const registry = createDefaultToolRegistry();
    const result = await registry.execute(
      {
        id: "cmd-approved",
        name: "run_command",
        input: {
          command: ["bun", "--version"]
        }
      },
      {
        repoRoot: fixtureRoot,
        permission: "allow"
      }
    );

    expect(result.ok).toBe(true);
    expect(JSON.stringify(result.output)).toContain("exitCode");
  });

  test("reports run_command maxOutputBytes truncation metadata", async () => {
    const registry = createDefaultToolRegistry();
    const result = await registry.execute(
      {
        id: "cmd-truncated",
        name: "run_command",
        input: {
          command: ["bun", "--version"],
          maxOutputBytes: 1
        }
      },
      {
        repoRoot: fixtureRoot,
        permission: "allow"
      }
    );

    expect(result.ok).toBe(true);
    const output = expectObjectOutput(result.output);
    expect(output.truncated).toBe(true);
    expect(output.maxOutputBytes).toBe(1);
    expect(output.outputBytes).toBe(1);
    expect(Number(output.sizeBytes)).toBeGreaterThan(1);
    expect(String(output.output).length).toBe(1);
  });

  test("denies write-capable commands even with approval", async () => {
    const registry = createDefaultToolRegistry();
    const result = await registry.execute(
      {
        id: "cmd-write",
        name: "run_command",
        input: {
          command: ["rm", "-rf", "dist"]
        }
      },
      {
        repoRoot: fixtureRoot,
        permission: "allow"
      }
    );

    expect(result.ok).toBe(false);
    expect(result.error?.kind).toBe("command_policy_violation");
  });

  test("denies shell control tokens", async () => {
    const registry = createDefaultToolRegistry();
    const result = await registry.execute(
      {
        id: "cmd-shell-token",
        name: "run_command",
        input: {
          command: ["git", "status", "&&", "git", "status"]
        }
      },
      {
        repoRoot: fixtureRoot,
        permission: "allow"
      }
    );

    expect(result.ok).toBe(false);
    expect(result.error?.kind).toBe("command_policy_violation");
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

function expectObjectOutput(output: unknown): Record<string, unknown> {
  expect(output).toBeDefined();
  expect(typeof output).toBe("object");
  expect(output).not.toBeNull();
  expect(Array.isArray(output)).toBe(false);
  return output as Record<string, unknown>;
}
