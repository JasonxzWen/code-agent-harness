import { describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execa } from "execa";
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

describe("apply_patch tool", () => {
  test("is registered with ask permission and returns preview metadata", async () => {
    const repo = await createGitRepo({
      "src/index.ts": `export const value = "old";\n`
    });

    try {
      const registry = createDefaultToolRegistry();
      const specs = registry.specs();
      const spec = specs.find((tool) => tool.name === "apply_patch");
      expect(spec?.defaultPermission).toBe("ask");
      expect(spec?.requiresPermission).toBe(true);

      const preflight = await registry.prepare(
        {
          id: "patch-preview",
          name: "apply_patch",
          input: {
            patch: replaceOldWithNewPatch()
          }
        },
        {
          repoRoot: repo
        }
      );

      expect(preflight.ok).toBe(true);
      if (preflight.ok) {
        expect(preflight.prepared.preview?.title).toBe("Patch preview");
        expect(preflight.prepared.preview?.summary.fileCount).toBe(1);
        expect(preflight.prepared.preview?.body).toContain("diff --git");
      }
    } finally {
      await rm(repo, { recursive: true, force: true });
    }
  });

  test("rejects invalid patch syntax", async () => {
    const repo = await createGitRepo({
      "src/index.ts": `export const value = "old";\n`
    });

    try {
      const result = await preparePatch(repo, "this is not a patch");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.result.error?.kind).toBe("tool_validation_error");
      }
    } finally {
      await rm(repo, { recursive: true, force: true });
    }
  });

  test("rejects path traversal patches", async () => {
    const repo = await createGitRepo({
      "src/index.ts": `export const value = "old";\n`
    });

    try {
      const result = await preparePatch(
        repo,
        [
          "diff --git a/../outside.txt b/../outside.txt",
          "--- a/../outside.txt",
          "+++ b/../outside.txt",
          "@@ -1 +1 @@",
          "-old",
          "+new",
          ""
        ].join("\n")
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.result.error?.kind).toBe("path_policy_violation");
      }
    } finally {
      await rm(repo, { recursive: true, force: true });
    }
  });

  test("rejects patch paths with traversal segments even inside the repository", async () => {
    const repo = await createGitRepo({
      "src/index.ts": `export const value = "old";\n`
    });

    try {
      const result = await preparePatch(
        repo,
        [
          "diff --git a/src/../src/index.ts b/src/../src/index.ts",
          "--- a/src/../src/index.ts",
          "+++ b/src/../src/index.ts",
          "@@ -1 +1 @@",
          `-export const value = "old";`,
          `+export const value = "new";`,
          ""
        ].join("\n")
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.result.error?.kind).toBe("path_policy_violation");
      }
    } finally {
      await rm(repo, { recursive: true, force: true });
    }
  });

  test("rejects patch paths that escape through symlinks", async () => {
    const tempRoot = await mkdtemp(path.join(tmpdir(), "agent-harness-patch-"));
    const repo = path.join(tempRoot, "repo");
    const outside = path.join(tempRoot, "outside");

    try {
      await mkdir(outside, { recursive: true });
      await writeFile(path.join(outside, "leaked.txt"), "old\n");
      await initializeGitRepo(repo, {
        "src/index.ts": `export const value = "old";\n`
      });
      await symlink(
        outside,
        path.join(repo, "outside-link"),
        process.platform === "win32" ? "junction" : "dir"
      );

      const result = await preparePatch(
        repo,
        [
          "diff --git a/outside-link/leaked.txt b/outside-link/leaked.txt",
          "--- a/outside-link/leaked.txt",
          "+++ b/outside-link/leaked.txt",
          "@@ -1 +1 @@",
          "-old",
          "+new",
          ""
        ].join("\n")
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.result.error?.kind).toBe("path_policy_violation");
      }
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });

  test("rejects secret-looking patch paths", async () => {
    const repo = await createGitRepo({
      "src/index.ts": `export const value = "old";\n`
    });

    try {
      const result = await preparePatch(
        repo,
        [
          "diff --git a/.env b/.env",
          "new file mode 100644",
          "--- /dev/null",
          "+++ b/.env",
          "@@ -0,0 +1 @@",
          "+TOKEN=secret",
          ""
        ].join("\n")
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.result.error?.kind).toBe("secret_policy_violation");
      }
    } finally {
      await rm(repo, { recursive: true, force: true });
    }
  });

  test("rejects binary, mode, and symlink patches", async () => {
    const repo = await createGitRepo({
      "src/index.ts": `export const value = "old";\n`
    });

    try {
      const binary = await preparePatch(
        repo,
        [
          "diff --git a/image.bin b/image.bin",
          "new file mode 100644",
          "index 0000000..1111111",
          "GIT binary patch",
          "literal 0",
          ""
        ].join("\n")
      );
      const mode = await preparePatch(
        repo,
        [
          "diff --git a/src/index.ts b/src/index.ts",
          "old mode 100644",
          "new mode 100755",
          "--- a/src/index.ts",
          "+++ b/src/index.ts",
          "@@ -1 +1 @@",
          `-export const value = "old";`,
          `+export const value = "new";`,
          ""
        ].join("\n")
      );
      const symlinkPatch = await preparePatch(
        repo,
        [
          "diff --git a/link.txt b/link.txt",
          "new file mode 120000",
          "--- /dev/null",
          "+++ b/link.txt",
          "@@ -0,0 +1 @@",
          "+../outside.txt",
          ""
        ].join("\n")
      );

      for (const result of [binary, mode, symlinkPatch]) {
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.result.error?.kind).toBe("patch_policy_violation");
        }
      }
    } finally {
      await rm(repo, { recursive: true, force: true });
    }
  });

  test("rejects dirty touched files", async () => {
    const repo = await createGitRepo({
      "src/index.ts": `export const value = "old";\n`
    });

    try {
      await writeRepoFile(repo, "src/index.ts", `export const value = "local";\n`);
      const result = await preparePatch(repo, replaceOldWithNewPatch());
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.result.error?.kind).toBe("patch_policy_violation");
      }
    } finally {
      await rm(repo, { recursive: true, force: true });
    }
  });

  test("rejects non-applicable patches without partial writes", async () => {
    const repo = await createGitRepo({
      "src/index.ts": `export const value = "old";\n`
    });

    try {
      const result = await preparePatch(
        repo,
        [
          "diff --git a/src/index.ts b/src/index.ts",
          "--- a/src/index.ts",
          "+++ b/src/index.ts",
          "@@ -1 +1 @@",
          `-export const value = "missing";`,
          `+export const value = "new";`,
          ""
        ].join("\n")
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.result.error?.kind).toBe("patch_policy_violation");
      }
      await expect(readFile(path.join(repo, "src/index.ts"), "utf8")).resolves.toBe(
        `export const value = "old";\n`
      );
    } finally {
      await rm(repo, { recursive: true, force: true });
    }
  });

  test("accepts hunk content lines that look like file headers", async () => {
    const repo = await createGitRepo({
      "src/index.ts": "-- old\nkeep\n"
    });

    try {
      const registry = createDefaultToolRegistry();
      const result = await registry.execute(
        {
          id: "patch-header-like-content",
          name: "apply_patch",
          input: {
            patch: [
              "diff --git a/src/index.ts b/src/index.ts",
              "--- a/src/index.ts",
              "+++ b/src/index.ts",
              "@@ -1,2 +1,2 @@",
              "--- old",
              "+++ new",
              " keep",
              ""
            ].join("\n")
          }
        },
        {
          repoRoot: repo,
          permission: "allow"
        }
      );

      expect(result.ok).toBe(true);
      await expect(readFile(path.join(repo, "src/index.ts"), "utf8")).resolves.toBe(
        "++ new\nkeep\n"
      );
    } finally {
      await rm(repo, { recursive: true, force: true });
    }
  });

  test("rejects too-large patches", async () => {
    const repo = await createGitRepo({
      "src/index.ts": `export const value = "old";\n`
    });

    try {
      const result = await preparePatch(
        repo,
        `diff --git a/a.txt b/a.txt\n${"x".repeat(200_001)}`
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.result.error?.kind).toBe("patch_policy_violation");
      }
    } finally {
      await rm(repo, { recursive: true, force: true });
    }
  });

  test("truncates long patch previews", async () => {
    const repo = await createGitRepo({
      "src/index.ts": `export const value = "old";\n`
    });

    try {
      const preflight = await preparePatch(repo, replaceOldWithNewPatch(), {
        maxPreviewBytes: 10
      });
      expect(preflight.ok).toBe(true);
      if (preflight.ok) {
        expect(preflight.prepared.preview?.truncated).toBe(true);
        expect(preflight.prepared.preview?.body).toHaveLength(10);
      }
    } finally {
      await rm(repo, { recursive: true, force: true });
    }
  });

  test("does not write without approval", async () => {
    const repo = await createGitRepo({
      "src/index.ts": `export const value = "old";\n`
    });

    try {
      const registry = createDefaultToolRegistry();
      const result = await registry.execute(
        {
          id: "patch-denied",
          name: "apply_patch",
          input: {
            patch: replaceOldWithNewPatch()
          }
        },
        {
          repoRoot: repo
        }
      );

      expect(result.ok).toBe(false);
      expect(result.error?.kind).toBe("permission_denied");
      await expect(readFile(path.join(repo, "src/index.ts"), "utf8")).resolves.toBe(
        `export const value = "old";\n`
      );
    } finally {
      await rm(repo, { recursive: true, force: true });
    }
  });

  test("applies approved patches without staging or committing", async () => {
    const repo = await createGitRepo({
      "src/index.ts": `export const value = "old";\n`
    });

    try {
      const registry = createDefaultToolRegistry();
      const result = await registry.execute(
        {
          id: "patch-approved",
          name: "apply_patch",
          input: {
            patch: replaceOldWithNewPatch()
          }
        },
        {
          repoRoot: repo,
          permission: "allow"
        }
      );

      expect(result.ok).toBe(true);
      const output = expectObjectOutput(result.output);
      expect(output.applied).toBe(true);
      expect(JSON.stringify(output.files)).toContain("src/index.ts");
      await expect(readFile(path.join(repo, "src/index.ts"), "utf8")).resolves.toBe(
        `export const value = "new";\n`
      );

      const staged = await git(repo, ["diff", "--cached", "--name-only"]);
      expect(staged.stdout).toBe("");
      const log = await git(repo, ["log", "--oneline"]);
      expect(log.stdout.split(/\r?\n/)).toHaveLength(1);
    } finally {
      await rm(repo, { recursive: true, force: true });
    }
  });
});

function expectObjectOutput(output: unknown): Record<string, unknown> {
  expect(output).toBeDefined();
  expect(typeof output).toBe("object");
  expect(output).not.toBeNull();
  expect(Array.isArray(output)).toBe(false);
  return output as Record<string, unknown>;
}

function replaceOldWithNewPatch(): string {
  return [
    "diff --git a/src/index.ts b/src/index.ts",
    "--- a/src/index.ts",
    "+++ b/src/index.ts",
    "@@ -1 +1 @@",
    `-export const value = "old";`,
    `+export const value = "new";`,
    ""
  ].join("\n");
}

async function preparePatch(
  repoRoot: string,
  patch: string,
  input: Record<string, unknown> = {}
) {
  return createDefaultToolRegistry().prepare(
    {
      id: "patch",
      name: "apply_patch",
      input: {
        patch,
        ...input
      }
    },
    {
      repoRoot
    }
  );
}

async function createGitRepo(files: Record<string, string>): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "agent-harness-patch-"));
  await initializeGitRepo(root, files);
  return root;
}

async function initializeGitRepo(
  root: string,
  files: Record<string, string>
): Promise<void> {
  await mkdir(root, { recursive: true });
  await git(root, ["init"]);
  await git(root, ["config", "user.email", "agent@example.com"]);
  await git(root, ["config", "user.name", "Agent Harness"]);

  for (const [filePath, content] of Object.entries(files)) {
    await writeRepoFile(root, filePath, content);
  }

  await git(root, ["add", "."]);
  await git(root, ["commit", "-m", "initial"]);
}

async function writeRepoFile(
  repoRoot: string,
  filePath: string,
  content: string
): Promise<void> {
  const absolutePath = path.join(repoRoot, filePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, content);
}

function git(cwd: string, args: string[]) {
  return execa("git", args, {
    cwd,
    reject: false
  });
}
