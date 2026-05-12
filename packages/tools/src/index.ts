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
  return new DefaultToolRegistry(tools);
}
