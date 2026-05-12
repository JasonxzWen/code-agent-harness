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
    // What: prepare 是所有 tool call 的预检入口。Why: 模型输入必须先经过
    // tool lookup、strict schema 和 deterministic policy，才能进入 permission prompt。
    // How: 失败统一返回结构化 ToolExecutionResult，成功则返回 PreparedToolCall 和可选 preview。
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
    // What: execute 在真正执行前重复 schema 和 policy 检查。Why: approval 等待期间
    // 输入对应的工作区状态可能变化，permission 也不能绕过 deterministic deny。How:
    // policy 通过且 permission allow 后才调用具体 tool.execute。
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
  // What: 将 Zod 解析出的对象安全地压回 JsonObject。Why: core/tool protocol 只允许
  // JSON object input 进入 permission 和 trace。How: 非对象输入回退为空对象。
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as JsonObject;
  }

  return {};
}
