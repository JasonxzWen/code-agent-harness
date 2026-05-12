import { readdir, realpath, stat } from "node:fs/promises";
import path from "node:path";
import { createAgentError } from "@code-agent-harness/core";
import type { AgentError } from "@code-agent-harness/core";

const IGNORED_DIRECTORIES = new Set([
  ".agent-harness",
  ".git",
  "coverage",
  "dist",
  "node_modules"
]);

const SECRET_BASENAMES = new Set([".env", ".npmrc", "id_rsa", "id_dsa"]);
const SECRET_EXTENSIONS = new Set([".key", ".pem", ".p12", ".pfx"]);

export class ToolPolicyError extends Error {
  readonly agentError: AgentError;

  constructor(agentError: AgentError) {
    super(agentError.message);
    this.name = "ToolPolicyError";
    this.agentError = agentError;
  }
}

export async function resolveSafePath(
  repoRoot: string,
  requestedPath: string
): Promise<string> {
  // What: 把用户/模型给出的相对路径解析成 repo 内真实路径。Why: `..`、绝对路径
  // 和 symlink 都可能逃逸仓库。How: 先拒绝绝对/secret path，再用 realpath 检查
  // root 和 target 都没有越界。
  if (path.isAbsolute(requestedPath)) {
    throw new ToolPolicyError(
      createAgentError("path_policy_violation", "Absolute paths are not allowed", {
        requestedPath
      })
    );
  }

  assertNotSecretPath(requestedPath);

  const realRoot = await realpath(repoRoot);
  const targetPath = path.resolve(realRoot, requestedPath);
  assertPathInside(realRoot, targetPath, requestedPath);

  const targetRealPath = await realpath(targetPath);
  assertPathInside(realRoot, targetRealPath, requestedPath);
  assertNotSecretPath(path.relative(realRoot, targetRealPath));

  return targetRealPath;
}

export function assertNotSecretPath(filePath: string): void {
  // What: 用文件名和扩展名识别 secret-looking paths。Why: secret 文件不能被读、
  // 搜索或 patch，即使它们位于 repo 内。How: 逐段检查 basename、extension 和
  // private_key 字样。
  const segments = filePath.split(/[\\/]+/);
  for (const segment of segments) {
    const lower = segment.toLowerCase();
    if (
      SECRET_BASENAMES.has(lower) ||
      SECRET_EXTENSIONS.has(path.extname(lower)) ||
      lower.includes("private_key")
    ) {
      throw new ToolPolicyError(
        createAgentError("secret_policy_violation", "Secret-like paths are denied", {
          path: filePath
        })
      );
    }
  }
}

export function assertTextBuffer(buffer: Buffer, filePath: string): void {
  if (buffer.includes(0)) {
    throw new ToolPolicyError(
      createAgentError("tool_execution_error", "Binary files are denied", {
        path: filePath
      })
    );
  }
}

export async function listSafeFiles(
  repoRoot: string,
  startPath: string,
  maxResults: number
): Promise<{ files: string[]; truncated: boolean }> {
  // What: 稳定列出 repo 内可见文件。Why: agent 需要上下文，但不能遍历 ignored、
  // secret 或超量文件。How: DFS 排序遍历，跳过 ignored directories 和 secret-looking
  // paths，达到 maxResults 后显式标记 truncated。
  const root = await realpath(repoRoot);
  const start = await resolveSafePath(repoRoot, startPath);
  const files: string[] = [];
  let truncated = false;

  async function walk(current: string): Promise<void> {
    if (files.length >= maxResults) {
      truncated = true;
      return;
    }

    const entries = await readdir(current, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of entries) {
      if (files.length >= maxResults) {
        truncated = true;
        return;
      }

      if (IGNORED_DIRECTORIES.has(entry.name)) {
        continue;
      }

      const absolutePath = path.join(current, entry.name);
      const relativePath = toPosixPath(path.relative(root, absolutePath));

      try {
        assertNotSecretPath(relativePath);
      } catch {
        continue;
      }

      if (entry.isDirectory()) {
        await walk(absolutePath);
        continue;
      }

      if (entry.isFile()) {
        files.push(relativePath);
      }
    }
  }

  const startStat = await stat(start);
  if (startStat.isDirectory()) {
    await walk(start);
  } else if (startStat.isFile()) {
    files.push(toPosixPath(path.relative(root, start)));
  }

  return { files, truncated };
}

export function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

function assertPathInside(
  realRoot: string,
  candidatePath: string,
  requestedPath: string
): void {
  const relative = path.relative(realRoot, candidatePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new ToolPolicyError(
      createAgentError("path_policy_violation", "Path escapes the repository", {
        requestedPath
      })
    );
  }
}
