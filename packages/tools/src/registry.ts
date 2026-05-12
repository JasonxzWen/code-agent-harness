import { createAgentError, errorFromUnknown } from "@code-agent-harness/core";
import type {
  JsonObject,
  ToolCall,
  ToolDefinition,
  ToolExecutionResult,
  ToolExecutorContext,
  ToolPreflightResult,
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
        inputJsonSchema: tool.inputJsonSchema,
        defaultPermission: tool.defaultPermission
      };

      if (tool.defaultPermission !== "allow") {
        spec.requiresPermission = true;
      }

      return spec;
    });
  }

  async prepare(
    call: ToolCall,
    context: ToolExecutorContext
  ): Promise<ToolPreflightResult> {
    const tool = this.#tools.get(call.name);
    if (tool === undefined) {
      return {
        ok: false,
        result: {
          callId: call.id,
          toolName: call.name,
          ok: false,
          error: createAgentError("tool_validation_error", "Unknown tool", {
            toolName: call.name
          })
        }
      };
    }

    const parsed = tool.inputSchema.safeParse(call.input);
    if (!parsed.success) {
      return {
        ok: false,
        result: {
          callId: call.id,
          toolName: call.name,
          ok: false,
          error: createAgentError("tool_validation_error", "Invalid tool input", {
            issues: parsed.error.issues.map((issue) => issue.message)
          })
        }
      };
    }

    let preview;
    try {
      preview = await tool.evaluatePolicy?.(parsed.data, context);
    } catch (error) {
      if (error instanceof ToolPolicyError) {
        return {
          ok: false,
          result: {
            callId: call.id,
            toolName: call.name,
            ok: false,
            error: error.agentError
          }
        };
      }

      return {
        ok: false,
        result: {
          callId: call.id,
          toolName: call.name,
          ok: false,
          error: errorFromUnknown("tool_execution_error", error)
        }
      };
    }

    const prepared = {
      callId: call.id,
      toolName: call.name,
      input: jsonObject(parsed.data),
      defaultPermission: tool.defaultPermission
    };

    if (preview !== undefined) {
      return {
        ok: true,
        prepared: {
          ...prepared,
          preview
        }
      };
    }

    return {
      ok: true,
      prepared
    };
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

    try {
      await tool.evaluatePolicy?.(parsed.data, context);
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

    if (tool.defaultPermission !== "allow" && context.permission !== "allow") {
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
      const metadata = tool.buildResultMetadata?.(output);
      const result: ToolExecutionResult = {
        callId: call.id,
        toolName: call.name,
        ok: true,
        output
      };
      if (metadata !== undefined) {
        result.metadata = metadata;
      }
      return result;
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
