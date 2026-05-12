import { lstat, realpath } from "node:fs/promises";
import path from "node:path";
import { execa } from "execa";
import { z } from "zod";
import { createAgentError } from "@code-agent-harness/core";
import type {
  JsonObject,
  JsonValue,
  ToolDefinition,
  ToolExecutorContext,
  ToolPreview
} from "@code-agent-harness/core";
import { integerSchema, objectJsonSchema, stringSchema } from "./json-schema";
import {
  assertNotSecretPath,
  resolveSafePath,
  toPosixPath,
  ToolPolicyError
} from "./policies";

const MAX_PATCH_BYTES = 200_000;
const MAX_PATCH_FILES = 20;
const DEFAULT_PREVIEW_BYTES = 20_000;

const ApplyPatchInputSchema = z
  .object({
    patch: z.string().min(1),
    cwd: z.string().default("."),
    maxPreviewBytes: z.number().int().min(1).max(50_000).default(DEFAULT_PREVIEW_BYTES)
  })
  .strict();

type ApplyPatchInput = z.infer<typeof ApplyPatchInputSchema>;

type PatchFileChange = JsonObject & {
  path: string;
  status: "added" | "modified" | "deleted";
  additions: number;
  deletions: number;
};

interface ParsedPatch {
  changes: PatchFileChange[];
  patchBytes: number;
}

interface PatchPreflight {
  parsed: ParsedPatch;
  cwd: string;
  preview: ToolPreview;
}

interface PatchDraft {
  oldPath: string | null | undefined;
  newPath: string | null | undefined;
  additions: number;
  deletions: number;
  sawHunk: boolean;
  hunkOldRemaining: number;
  hunkNewRemaining: number;
}

export const applyPatchTool: ToolDefinition<ApplyPatchInput> = {
  name: "apply_patch",
  description:
    "Apply a bounded unified diff after patch policy checks and explicit approval.",
  defaultPermission: "ask",
  inputSchema: ApplyPatchInputSchema,
  inputJsonSchema: objectJsonSchema(
    {
      patch: stringSchema,
      cwd: stringSchema,
      maxPreviewBytes: integerSchema
    },
    ["patch"]
  ),
  async evaluatePolicy(input, context) {
    return (await preflightPatch(input, context)).preview;
  },
  async execute(input, context) {
    const preflight = await preflightPatch(input, context);
    const result = await git(preflight.cwd, ["apply", "--whitespace=nowarn", "-"], {
      input: input.patch
    });

    if (result.exitCode !== 0) {
      throw new ToolPolicyError(
        createAgentError("tool_execution_error", "Patch apply failed", {
          stderr: boundString(result.stderr)
        })
      );
    }

    return {
      applied: true,
      files: preflight.parsed.changes,
      previewTruncated:
        preflight.parsed.patchBytes > input.maxPreviewBytes ||
        preflight.preview.truncated === true
    };
  },
  buildResultMetadata(output) {
    if (!isJsonObject(output)) {
      return undefined;
    }

    return {
      applied: output.applied === true,
      files: Array.isArray(output.files) ? output.files : [],
      previewTruncated: output.previewTruncated === true
    };
  }
};

async function preflightPatch(
  input: ApplyPatchInput,
  context: ToolExecutorContext
): Promise<PatchPreflight> {
  const parsed = parsePatch(input.patch);
  const cwd = await resolvePatchCwd(context.repoRoot, input.cwd);
  await assertPatchPathsAllowed(context.repoRoot, cwd, parsed.changes);
  await assertTouchedFilesClean(cwd, parsed.changes);
  await assertPatchApplies(cwd, input.patch);

  return {
    parsed,
    cwd,
    preview: buildPreview(parsed, input.patch, input.maxPreviewBytes, cwd)
  };
}

async function resolvePatchCwd(
  repoRoot: string,
  requestedCwd: string
): Promise<string> {
  const cwd = await resolveSafePath(repoRoot, requestedCwd);
  const stats = await lstat(cwd);
  if (!stats.isDirectory()) {
    throw new ToolPolicyError(
      createAgentError("path_policy_violation", "Patch cwd must be a directory", {
        cwd: requestedCwd
      })
    );
  }

  return cwd;
}

function parsePatch(patch: string): ParsedPatch {
  const patchBytes = Buffer.byteLength(patch, "utf8");
  if (patchBytes > MAX_PATCH_BYTES) {
    throw patchPolicyError("Patch exceeds size limit", {
      maxPatchBytes: MAX_PATCH_BYTES,
      patchBytes
    });
  }

  if (patch.includes("\0")) {
    throw patchPolicyError("Binary patch content is denied");
  }

  const lines = patch.split(/\r?\n/);
  const changes: PatchFileChange[] = [];
  let current: PatchDraft | undefined;

  for (const line of lines) {
    assertAllowedPatchMetadata(line);

    if (consumeHunkLine(current, line)) {
      continue;
    }

    if (line.startsWith("diff --git ")) {
      pushDraft(changes, current);
      current = parseDiffGitLine(line);
      continue;
    }

    if (line.startsWith("--- ")) {
      if (current?.sawHunk === true) {
        pushDraft(changes, current);
        current = undefined;
      }
      current ??= createDraft();
      current.oldPath = parsePatchMarkerPath(line.slice(4));
      continue;
    }

    if (line.startsWith("+++ ")) {
      current ??= createDraft();
      current.newPath = parsePatchMarkerPath(line.slice(4));
      continue;
    }

    if (line.startsWith("@@ ")) {
      current ??= createDraft();
      current.sawHunk = true;
      const counts = parseHunkCounts(line);
      current.hunkOldRemaining = counts.oldCount;
      current.hunkNewRemaining = counts.newCount;
      continue;
    }
  }

  pushDraft(changes, current);
  if (changes.length === 0) {
    throw validationError("Patch does not contain file changes");
  }

  if (changes.length > MAX_PATCH_FILES) {
    throw patchPolicyError("Patch touches too many files", {
      maxPatchFiles: MAX_PATCH_FILES,
      fileCount: changes.length
    });
  }

  const seen = new Set<string>();
  for (const change of changes) {
    if (seen.has(change.path)) {
      throw patchPolicyError("Patch touches the same file more than once", {
        path: change.path
      });
    }
    seen.add(change.path);
  }

  return {
    changes,
    patchBytes
  };
}

function parseDiffGitLine(line: string): PatchDraft {
  const rest = line.slice("diff --git ".length);
  const separator = rest.indexOf(" b/");
  if (!rest.startsWith("a/") || separator < 0) {
    throw validationError("Invalid diff --git header");
  }

  return {
    oldPath: normalizePatchPath(rest.slice(2, separator)),
    newPath: normalizePatchPath(rest.slice(separator + 3)),
    additions: 0,
    deletions: 0,
    sawHunk: false,
    hunkOldRemaining: 0,
    hunkNewRemaining: 0
  };
}

function parseHunkCounts(line: string): { oldCount: number; newCount: number } {
  const match = line.match(/^@@ -\d+(?:,(\d+))? \+\d+(?:,(\d+))? @@/);
  if (match === null) {
    throw validationError("Invalid patch hunk header");
  }

  return {
    oldCount: match[1] === undefined ? 1 : Number(match[1]),
    newCount: match[2] === undefined ? 1 : Number(match[2])
  };
}

function consumeHunkLine(draft: PatchDraft | undefined, line: string): boolean {
  if (
    draft === undefined ||
    !draft.sawHunk ||
    (draft.hunkOldRemaining === 0 && draft.hunkNewRemaining === 0)
  ) {
    return false;
  }

  if (line.startsWith("\\")) {
    return true;
  }

  if (line.startsWith("+")) {
    draft.additions += 1;
    draft.hunkNewRemaining -= 1;
    assertHunkCountsNotNegative(draft);
    return true;
  }

  if (line.startsWith("-")) {
    draft.deletions += 1;
    draft.hunkOldRemaining -= 1;
    assertHunkCountsNotNegative(draft);
    return true;
  }

  if (line.startsWith(" ")) {
    draft.hunkOldRemaining -= 1;
    draft.hunkNewRemaining -= 1;
    assertHunkCountsNotNegative(draft);
    return true;
  }

  throw validationError("Invalid patch hunk line");
}

function assertHunkCountsNotNegative(draft: PatchDraft): void {
  if (draft.hunkOldRemaining < 0 || draft.hunkNewRemaining < 0) {
    throw validationError("Patch hunk has more lines than declared");
  }
}

function parsePatchMarkerPath(raw: string): string | null {
  const marker = raw.split("\t")[0]?.trim();
  if (marker === undefined || marker.length === 0) {
    throw validationError("Invalid patch path marker");
  }

  if (marker === "/dev/null") {
    return null;
  }

  if (marker.startsWith("a/") || marker.startsWith("b/")) {
    return normalizePatchPath(marker.slice(2));
  }

  return normalizePatchPath(marker);
}

function normalizePatchPath(filePath: string): string {
  if (filePath.length === 0) {
    throw validationError("Patch path cannot be empty");
  }

  if (filePath.includes("\0")) {
    throw validationError("Patch path cannot contain null bytes");
  }

  return toPosixPath(filePath);
}

function pushDraft(changes: PatchFileChange[], draft: PatchDraft | undefined): void {
  if (draft === undefined) {
    return;
  }

  if (draft.oldPath === undefined || draft.newPath === undefined) {
    throw validationError("Patch file header is incomplete");
  }

  if (!draft.sawHunk) {
    throw validationError("Patch file change has no hunk");
  }

  if (draft.hunkOldRemaining !== 0 || draft.hunkNewRemaining !== 0) {
    throw validationError("Patch hunk ended before declared line counts");
  }

  if (
    draft.oldPath !== null &&
    draft.newPath !== null &&
    draft.oldPath !== draft.newPath
  ) {
    throw patchPolicyError("Rename patches are denied", {
      oldPath: draft.oldPath,
      newPath: draft.newPath
    });
  }

  const status =
    draft.oldPath === null ? "added" : draft.newPath === null ? "deleted" : "modified";
  const filePath = draft.newPath ?? draft.oldPath;
  if (filePath === null) {
    throw validationError("Patch file path is missing");
  }

  if (draft.additions === 0 && draft.deletions === 0) {
    throw validationError("Patch hunk has no line changes");
  }

  changes.push({
    path: filePath,
    status,
    additions: draft.additions,
    deletions: draft.deletions
  });
}

function createDraft(): PatchDraft {
  return {
    oldPath: undefined,
    newPath: undefined,
    additions: 0,
    deletions: 0,
    sawHunk: false,
    hunkOldRemaining: 0,
    hunkNewRemaining: 0
  };
}

function assertAllowedPatchMetadata(line: string): void {
  if (line === "GIT binary patch" || line.startsWith("Binary files ")) {
    throw patchPolicyError("Binary patches are denied");
  }

  if (
    line.startsWith("old mode ") ||
    line.startsWith("new mode ") ||
    line.startsWith("rename from ") ||
    line.startsWith("rename to ") ||
    line.startsWith("copy from ") ||
    line.startsWith("copy to ") ||
    line.startsWith("similarity index ") ||
    line.startsWith("dissimilarity index ")
  ) {
    throw patchPolicyError("Mode, rename, and copy patches are denied");
  }

  const newFileMode = line.match(/^new file mode (\d+)$/);
  const newMode = newFileMode?.[1];
  if (newMode !== undefined && newMode !== "100644") {
    throw patchPolicyError("Non-regular new file modes are denied", {
      mode: newMode
    });
  }

  const deletedFileMode = line.match(/^deleted file mode (\d+)$/);
  const deletedMode = deletedFileMode?.[1];
  if (deletedMode !== undefined && deletedMode !== "100644") {
    throw patchPolicyError("Non-regular deleted file modes are denied", {
      mode: deletedMode
    });
  }
}

async function assertPatchPathsAllowed(
  repoRoot: string,
  cwd: string,
  changes: PatchFileChange[]
): Promise<void> {
  const realRoot = await realpath(repoRoot);

  for (const change of changes) {
    assertRelativePatchPath(change.path);
    assertNotSecretPath(change.path);

    const absoluteTarget = path.resolve(cwd, change.path);
    assertPathInside(realRoot, absoluteTarget, change.path);
    await assertNoSymlinkPath(realRoot, absoluteTarget, change.path);
  }
}

function assertRelativePatchPath(filePath: string): void {
  if (
    filePath.startsWith("/") ||
    path.isAbsolute(filePath) ||
    /^[A-Za-z]:[\\/]/.test(filePath)
  ) {
    throw new ToolPolicyError(
      createAgentError("path_policy_violation", "Absolute patch paths are denied", {
        path: filePath
      })
    );
  }

  if (filePath.split(/[\\/]+/).includes("..")) {
    throw new ToolPolicyError(
      createAgentError("path_policy_violation", "Patch path traversal is denied", {
        path: filePath
      })
    );
  }
}

async function assertNoSymlinkPath(
  realRoot: string,
  absoluteTarget: string,
  requestedPath: string
): Promise<void> {
  const relative = path.relative(realRoot, absoluteTarget);
  const segments = relative.split(path.sep).filter((segment) => segment.length > 0);
  let current = realRoot;

  for (const segment of segments) {
    current = path.join(current, segment);
    let stats;
    try {
      stats = await lstat(current);
    } catch (error) {
      if (isNotFoundError(error)) {
        return;
      }
      throw error;
    }

    if (stats.isSymbolicLink()) {
      const target = await realpath(current);
      assertPathInside(realRoot, target, requestedPath);
      throw patchPolicyError("Symlink patch paths are denied", {
        path: requestedPath
      });
    }
  }
}

async function assertTouchedFilesClean(
  cwd: string,
  changes: PatchFileChange[]
): Promise<void> {
  const files = changes.map((change) => change.path);
  const result = await git(cwd, ["status", "--porcelain", "--", ...files]);
  if (result.exitCode !== 0) {
    throw patchPolicyError("Unable to inspect touched file status", {
      stderr: boundString(result.stderr)
    });
  }

  if (result.stdout.trim().length > 0) {
    throw patchPolicyError("Touched files have uncommitted changes", {
      files,
      status: result.stdout
        .split(/\r?\n/)
        .filter((line) => line.trim().length > 0)
        .slice(0, 20)
    });
  }
}

async function assertPatchApplies(cwd: string, patch: string): Promise<void> {
  const result = await git(cwd, ["apply", "--check", "--whitespace=nowarn", "-"], {
    input: patch
  });
  if (result.exitCode !== 0) {
    throw patchPolicyError("Patch does not apply cleanly", {
      stderr: boundString(result.stderr)
    });
  }
}

function buildPreview(
  parsed: ParsedPatch,
  patch: string,
  maxPreviewBytes: number,
  cwd: string
): ToolPreview {
  const preview = truncateUtf8(patch, maxPreviewBytes);
  const additions = parsed.changes.reduce((sum, change) => sum + change.additions, 0);
  const deletions = parsed.changes.reduce((sum, change) => sum + change.deletions, 0);

  return {
    title: "Patch preview",
    summary: {
      cwd,
      fileCount: parsed.changes.length,
      files: parsed.changes,
      additions,
      deletions,
      patchBytes: parsed.patchBytes,
      risks: ["writes_worktree", "requires_explicit_approval"]
    },
    body: preview.text,
    truncated: preview.truncated
  };
}

function truncateUtf8(
  value: string,
  maxBytes: number
): { text: string; truncated: boolean } {
  const buffer = Buffer.from(value, "utf8");
  if (buffer.byteLength <= maxBytes) {
    return {
      text: value,
      truncated: false
    };
  }

  return {
    text: buffer.subarray(0, maxBytes).toString("utf8"),
    truncated: true
  };
}

async function git(
  cwd: string,
  args: string[],
  options: { input?: string } = {}
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const execaOptions = {
    cwd,
    reject: false,
    shell: false
  };
  const result =
    options.input === undefined
      ? await execa("git", args, execaOptions)
      : await execa("git", args, {
          ...execaOptions,
          input: options.input
        });

  return {
    exitCode: result.exitCode ?? 0,
    stdout: result.stdout,
    stderr: result.stderr
  };
}

function assertPathInside(
  realRoot: string,
  candidatePath: string,
  requestedPath: string
): void {
  const relative = path.relative(realRoot, candidatePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new ToolPolicyError(
      createAgentError("path_policy_violation", "Patch path escapes the repository", {
        path: requestedPath
      })
    );
  }
}

function validationError(message: string): ToolPolicyError {
  return new ToolPolicyError(createAgentError("tool_validation_error", message));
}

function patchPolicyError(message: string, details?: JsonObject): ToolPolicyError {
  return new ToolPolicyError(
    createAgentError(
      "patch_policy_violation",
      message,
      details === undefined ? undefined : details
    )
  );
}

function boundString(value: string, maxBytes = 2_000): string {
  return truncateUtf8(value, maxBytes).text;
}

function isNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "ENOENT"
  );
}

function isJsonObject(value: JsonValue | undefined): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
