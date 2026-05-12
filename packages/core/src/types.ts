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
  inputSchema: z.ZodType<TInput>;
  evaluatePolicy?(
    input: TInput,
    context: ToolExecutorContext
  ): Promise<ToolPreview | void> | ToolPreview | void;
  execute(input: TInput, context: ToolExecutorContext): Promise<JsonValue> | JsonValue;
  buildResultMetadata?(output: JsonValue): JsonObject | undefined;
}

export interface PreparedToolCall {
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
