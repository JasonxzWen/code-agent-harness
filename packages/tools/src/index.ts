export { runCommandTool } from "./command-tool";
export { applyPatchTool } from "./patch-tool";
export {
  gitStatusTool,
  listFilesTool,
  readFileTool,
  searchRepoTool
} from "./read-tools";
export { DefaultToolRegistry } from "./registry";
export {
  assertNotSecretPath,
  assertTextBuffer,
  listSafeFiles,
  resolveSafePath,
  ToolPolicyError
} from "./policies";

import type { ToolDefinition, ToolRegistry } from "@code-agent-harness/core";
import { applyPatchTool } from "./patch-tool";
import { runCommandTool } from "./command-tool";
import {
  gitStatusTool,
  listFilesTool,
  readFileTool,
  searchRepoTool
} from "./read-tools";
import { DefaultToolRegistry } from "./registry";

export function createDefaultToolRegistry(
  tools: ToolDefinition[] = [
    listFilesTool,
    readFileTool,
    searchRepoTool,
    gitStatusTool,
    applyPatchTool,
    runCommandTool
  ]
): ToolRegistry {
  // What: 默认 registry 集中注册 v0.2 可用工具。Why: core/CLI 不应知道每个工具
  // 的实现细节。How: read tools 默认 allow，`apply_patch` 和 `run_command` 在各自
  // ToolDefinition 中声明 ask permission。
  return new DefaultToolRegistry(tools);
}
