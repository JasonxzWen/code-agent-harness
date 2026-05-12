import type { z } from "zod";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export type JsonObject = {
  [key: string]: JsonValue;
};

export type AgentErrorKind =
  | "aborted"
  | "config_error"
  | "provider_error"
  | "tool_validation_error"
  | "tool_execution_error"
  | "permission_denied"
  | "path_policy_violation"
  | "secret_policy_violation"
  | "patch_policy_violation"
  | "command_policy_violation"
  | "timeout"
  | "internal_error";

export interface AgentError {
  kind: AgentErrorKind;
  message: string;
  details?: JsonObject;
}

export type AgentMessageRole = "system" | "user" | "assistant" | "tool";

export interface AgentMessage {
  role: AgentMessageRole;
  content: string;
  name?: string;
  toolCallId?: string;
}

export interface ToolSpec {
  name: string;
  description: string;
  inputJsonSchema: JsonObject;
  defaultPermission: PermissionDecision;
  requiresPermission?: boolean;
}

export interface ToolCall {
  id: string;
  name: string;
  input: JsonObject;
}

export type PermissionDecision = "allow" | "ask" | "deny";

export interface ToolPreview {
  title: string;
  summary: JsonObject;
  body?: string;
  truncated?: boolean;
}

export interface PermissionRequest {
  runId: string;
  callId: string;
  toolName: string;
  input: JsonObject;
  reason?: string;
  preview?: ToolPreview;
}

export interface PermissionGate {
  check: (request: PermissionRequest) => Promise<PermissionDecision>;
}

export interface ToolExecutorContext {
  repoRoot: string;
  permission?: PermissionDecision;
  signal?: AbortSignal;
}

export interface ToolExecutionResult {
  callId: string;
  toolName: string;
  ok: boolean;
  output?: JsonValue;
  error?: AgentError;
  metadata?: JsonObject;
}

export interface ToolDefinition<TInput = unknown> extends ToolSpec {
  // What: ToolDefinition 同时描述模型可见 schema、运行时 Zod schema、policy 和执行函数。
  // Why: 模型输入不可信，必须在同一个定义里把提示契约和执行契约绑定。How:
  // registry 先调用 inputSchema/evaluatePolicy，再按 permission 调用 execute。
  inputSchema: z.ZodType<TInput>;
  evaluatePolicy?(
    input: TInput,
    context: ToolExecutorContext
  ): Promise<ToolPreview | void> | ToolPreview | void;
  execute(input: TInput, context: ToolExecutorContext): Promise<JsonValue> | JsonValue;
  buildResultMetadata?(output: JsonValue): JsonObject | undefined;
}

export interface PreparedToolCall {
  // What: PreparedToolCall 是 permission gate 前的安全计划。Why: permission prompt
  // 不能直接消费未校验的 model input。How: registry 只在 schema/policy 通过后产出它，
  // 并可附带 bounded preview。
  callId: string;
  toolName: string;
  input: JsonObject;
  defaultPermission: PermissionDecision;
  preview?: ToolPreview;
}

export type ToolPreflightResult =
  | {
      ok: true;
      prepared: PreparedToolCall;
    }
  | {
      ok: false;
      result: ToolExecutionResult;
    };

export interface ToolRegistry {
  // What: ToolRegistry 拆分 prepare 和 execute。Why: v0.2 patch 需要“预检/预览”
  // 和“批准后重检/写入”两个阶段。How: core 只调用 registry contract，不知道具体 tool 实现。
  specs: () => ToolSpec[];
  prepare: (
    call: ToolCall,
    context: ToolExecutorContext
  ) => Promise<ToolPreflightResult>;
  execute: (
    call: ToolCall,
    context: ToolExecutorContext
  ) => Promise<ToolExecutionResult>;
}

export type ProviderResponse =
  | {
      type: "tool_call";
      calls: ToolCall[];
    }
  | {
      type: "final";
      content: string;
    };

export interface ProviderGenerateRequest {
  runId: string;
  step: number;
  messages: AgentMessage[];
  tools: ToolSpec[];
  signal?: AbortSignal;
}

export interface ProviderClient {
  // What: ProviderClient 是 core 唯一认识的模型边界。Why: OpenAI/Anthropic 等
  // SDK shape 不能泄漏进 core。How: provider adapter 把 SDK 响应归一化为 ProviderResponse。
  name: string;
  generate: (request: ProviderGenerateRequest) => Promise<ProviderResponse>;
}

export type RunStatus = "running" | "completed" | "failed" | "aborted";

export interface AgentRunState {
  runId: string;
  status: RunStatus;
  task: string;
  repoRoot: string;
  messages: AgentMessage[];
  toolResults: ToolExecutionResult[];
  finalAnswer?: string;
  error?: AgentError;
}

export interface TraceEvent {
  runId: string;
  timestamp: string;
  type:
    | "run.started"
    | "provider.requested"
    | "provider.completed"
    | "permission.requested"
    | "permission.decided"
    | "tool.started"
    | "tool.completed"
    | "run.completed"
    | "run.aborted"
    | "run.failed";
  data: JsonObject;
}

export interface EventLogger {
  write: (event: TraceEvent) => Promise<void>;
}
