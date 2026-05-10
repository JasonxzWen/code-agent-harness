import { createAgentError, errorFromUnknown } from "@code-agent-harness/core";
import type {
  JsonObject,
  ToolCall,
  ToolDefinition,
  ToolExecutionResult,
  ToolExecutorContext,
  ToolRegistry,
  ToolSpec
} from "@code-agent-harness/core";
import { ToolPolicyError } from "./policies";

export class DefaultToolRegistry implements ToolRegistry {
  readonly #tools: Map<string, ToolDefinition>;

  constructor(tools: ToolDefinition[]) {
    this.#tools = new Map(tools.map((tool) => [tool.name, tool]));
  }

  specs(): ToolSpec[] {
    return [...this.#tools.values()].map((tool) => {
      const spec: ToolSpec = {
        name: tool.name,
        description: tool.description,
        inputJsonSchema: tool.inputJsonSchema
      };

      if (tool.requiresPermission === true) {
        spec.requiresPermission = true;
      }

      return spec;
    });
  }

  async execute(
    call: ToolCall,
    context: ToolExecutorContext
  ): Promise<ToolExecutionResult> {
    const tool = this.#tools.get(call.name);
    if (tool === undefined) {
      return {
        callId: call.id,
        toolName: call.name,
        ok: false,
        error: createAgentError("tool_validation_error", "Unknown tool", {
          toolName: call.name
        })
      };
    }

    const parsed = tool.inputSchema.safeParse(call.input);
    if (!parsed.success) {
      return {
        callId: call.id,
        toolName: call.name,
        ok: false,
        error: createAgentError("tool_validation_error", "Invalid tool input", {
          issues: parsed.error.issues.map((issue) => issue.message)
        })
      };
    }

    if (tool.requiresPermission === true && context.permission !== "allow") {
      return {
        callId: call.id,
        toolName: call.name,
        ok: false,
        error: createAgentError("permission_denied", "Tool requires permission", {
          toolName: call.name
        })
      };
    }

    try {
      const output = await tool.execute(parsed.data, context);
      return {
        callId: call.id,
        toolName: call.name,
        ok: true,
        output
      };
    } catch (error) {
      if (error instanceof ToolPolicyError) {
        return {
          callId: call.id,
          toolName: call.name,
          ok: false,
          error: error.agentError
        };
      }

      return {
        callId: call.id,
        toolName: call.name,
        ok: false,
        error: errorFromUnknown("tool_execution_error", error)
      };
    }
  }
}

export function jsonObject(value: unknown): JsonObject {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as JsonObject;
  }

  return {};
}
