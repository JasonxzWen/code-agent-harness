export { runCommandTool } from "./command-tool";
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
    runCommandTool
  ]
): ToolRegistry {
  return new DefaultToolRegistry(tools);
}
