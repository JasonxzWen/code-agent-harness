import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

type FindingKind = "markdown-english-body" | "source-comment-coverage";

interface Finding {
  kind: FindingKind;
  path: string;
  line?: number;
  message: string;
  text?: string;
}

const ignoredDirectories = new Set([
  ".agent-harness",
  ".git",
  "coverage",
  "dist",
  "node_modules"
]);

const allowedWords = new Set(
  [
    "adr",
    "agent",
    "agents",
    "ai",
    "allow",
    "api",
    "benchmark",
    "body",
    "build",
    "bun",
    "chat",
    "check",
    "checklist",
    "ci",
    "cli",
    "claude",
    "code",
    "codex",
    "command",
    "contract",
    "core",
    "cwd",
    "deny",
    "diff",
    "docs",
    "e2e",
    "error",
    "event",
    "external",
    "file",
    "final",
    "format",
    "function",
    "gate",
    "github",
    "git",
    "how",
    "identifier",
    "ide",
    "ink",
    "json",
    "jsonl",
    "lint",
    "main",
    "markdown",
    "mermaid",
    "metric",
    "mcp",
    "model",
    "node",
    "notes",
    "openai",
    "opencode",
    "package",
    "pass",
    "patch",
    "permission",
    "provider",
    "readme",
    "release",
    "repo",
    "repository",
    "research",
    "review",
    "scope",
    "sdk",
    "sandbox",
    "shell",
    "smoke",
    "source",
    "spec",
    "status",
    "stub",
    "subagents",
    "task",
    "test",
    "tool",
    "trace",
    "tui",
    "typecheck",
    "typescript",
    "ui",
    "utf",
    "what",
    "why",
    "workflow",
    "zod"
  ].map((word) => word.toLowerCase())
);

const allowedPhrases = [
  "Chinese-first Repository Migration",
  "Review focus",
  "What changed",
  "File:line",
  "Quality gates",
  "Self-review",
  "Known limitations",
  "Next step",
  "Benchmark question",
  "OpenAI Codex",
  "Claude Code",
  "GitHub Docs",
  "Read the Docs",
  "AGENTS.md",
  "CHANGELOG.md",
  "README.md"
];

const cjkPattern = /[\u3400-\u9fff]/;
const wordPattern = /[A-Za-z][A-Za-z0-9_:+#.-]*/g;

const repoRoot = path.resolve(process.cwd());
const findings: Finding[] = [];

const files = await walk(repoRoot);
const markdownFiles = files.filter((file) => file.endsWith(".md"));
const sourceFiles = files.filter(isSourceAuditPath).filter((file) => {
  return !file.endsWith("/index.ts");
});

for (const file of markdownFiles) {
  await auditMarkdown(file);
}

for (const file of sourceFiles) {
  await auditSourceComments(file);
}

if (findings.length > 0) {
  console.error(`语言审计发现 ${findings.length.toString()} 个 blocker：`);
  for (const finding of findings.slice(0, 80)) {
    const location =
      finding.line === undefined
        ? finding.path
        : `${finding.path}:${finding.line.toString()}`;
    console.error(`- [${finding.kind}] ${location} ${finding.message}`);
    if (finding.text !== undefined) {
      console.error(`  ${finding.text}`);
    }
  }

  if (findings.length > 80) {
    console.error(`... 另有 ${(findings.length - 80).toString()} 个结果被截断。`);
  }

  process.exit(1);
}

console.log("语言审计通过。");
console.log(`Markdown 文件：${markdownFiles.length.toString()}`);
console.log(`源码文件：${sourceFiles.length.toString()}`);
console.log("Markdown 英文正文 blocker：0");
console.log("源码中文 what/why/how 注释 blocker：0");

async function walk(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const discovered: string[] = [];

  for (const entry of entries) {
    if (entry.isSymbolicLink()) {
      continue;
    }

    const absolutePath = path.join(directory, entry.name);
    const relativePath = toRepoPath(absolutePath);

    if (entry.isDirectory()) {
      if (ignoredDirectories.has(entry.name)) {
        continue;
      }

      discovered.push(...(await walk(absolutePath)));
      continue;
    }

    if (entry.isFile()) {
      discovered.push(relativePath);
    }
  }

  return discovered.sort();
}

async function auditMarkdown(file: string): Promise<void> {
  const content = await readFile(path.join(repoRoot, file), "utf8");
  const lines = content.split(/\r?\n/);
  let inFence = false;

  for (const [index, line] of lines.entries()) {
    const trimmed = line.trim();

    if (/^(```|~~~)/.test(trimmed)) {
      inFence = !inFence;
      continue;
    }

    if (inFence || shouldIgnoreMarkdownLine(trimmed)) {
      continue;
    }

    if (looksLikeEnglishBody(trimmed)) {
      findings.push({
        kind: "markdown-english-body",
        path: file,
        line: index + 1,
        message: "疑似未迁移英文正文；如为技术标识请加入允许规则或补中文解释。",
        text: trimmed
      });
    }
  }
}

async function auditSourceComments(file: string): Promise<void> {
  const content = await readFile(path.join(repoRoot, file), "utf8");
  const commentText = extractComments(content);

  if (
    !cjkPattern.test(commentText) ||
    !commentText.includes("What:") ||
    !commentText.includes("Why:") ||
    !commentText.includes("How:")
  ) {
    findings.push({
      kind: "source-comment-coverage",
      path: file,
      message: "核心源码缺少中文 what/why/how 注释覆盖。"
    });
  }
}

function isSourceAuditPath(file: string): boolean {
  if (file === "scripts/smoke.ts" || file === "scripts/smoke-live.ts") {
    return true;
  }

  if (!file.endsWith(".ts") && !file.endsWith(".tsx")) {
    return false;
  }

  return (
    file.startsWith("apps/cli/src/") ||
    file.startsWith("packages/core/src/") ||
    file.startsWith("packages/providers/src/") ||
    file.startsWith("packages/tools/src/")
  );
}

function shouldIgnoreMarkdownLine(line: string): boolean {
  if (line.length === 0) {
    return true;
  }

  if (/^[-*_]{3,}$/.test(line)) {
    return true;
  }

  if (/^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line)) {
    return true;
  }

  if (/^::[a-z-]+\{.*\}$/.test(line)) {
    return true;
  }

  if (cjkPattern.test(line)) {
    return true;
  }

  return allowedPhrases.some((phrase) => line.includes(phrase));
}

function looksLikeEnglishBody(line: string): boolean {
  const scrubbed = line
    .replace(/`[^`]*`/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/[#>|[\]()*,:;.!?'"=]/g, " ");

  const words = scrubbed.match(wordPattern) ?? [];
  const meaningfulWords = words.filter((word) => {
    const normalized = word.toLowerCase().replace(/[^a-z0-9+#.-]/g, "");

    if (normalized.length < 3) {
      return false;
    }

    if (allowedWords.has(normalized)) {
      return false;
    }

    if (/\d/.test(normalized)) {
      return false;
    }

    if (/^[a-z]+[A-Z]/.test(word)) {
      return false;
    }

    return true;
  });

  return meaningfulWords.length >= 4;
}

function extractComments(content: string): string {
  const comments: string[] = [];
  let inBlock = false;
  let blockBuffer = "";

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (inBlock) {
      const endIndex = trimmed.indexOf("*/");

      if (endIndex >= 0) {
        blockBuffer += ` ${trimmed.slice(0, endIndex)}`;
        comments.push(blockBuffer);
        blockBuffer = "";
        inBlock = false;
      } else {
        blockBuffer += ` ${trimmed}`;
      }

      continue;
    }

    const blockStart = trimmed.indexOf("/*");
    if (blockStart >= 0) {
      const blockEnd = trimmed.indexOf("*/", blockStart + 2);

      if (blockEnd >= 0) {
        comments.push(trimmed.slice(blockStart + 2, blockEnd));
      } else {
        blockBuffer = trimmed.slice(blockStart + 2);
        inBlock = true;
      }
    }

    const lineCommentStart = trimmed.indexOf("//");
    if (lineCommentStart >= 0) {
      comments.push(trimmed.slice(lineCommentStart + 2));
    }
  }

  return comments.join("\n");
}

function toRepoPath(absolutePath: string): string {
  return path.relative(repoRoot, absolutePath).split(path.sep).join("/");
}
