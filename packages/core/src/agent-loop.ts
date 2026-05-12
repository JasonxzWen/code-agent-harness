import { agentErrorToJson, createAgentError, errorFromUnknown } from "./errors";
import { createRunId } from "./run-id";
import type {
  AgentMessage,
  AgentRunState,
  EventLogger,
  JsonObject,
  PermissionDecision,
  PermissionGate,
  PermissionRequest,
  PreparedToolCall,
  ProviderClient,
  ProviderGenerateRequest,
  ToolPreview,
  ToolExecutionResult,
  ToolExecutorContext,
  ToolRegistry,
  TraceEvent
} from "./types";

export interface RunAgentTaskInput {
  task: string;
  repoRoot: string;
  provider: ProviderClient;
  tools: ToolRegistry;
  maxSteps?: number;
  logger?: EventLogger;
  onEvent?: (event: TraceEvent) => void;
  permissionGate?: PermissionGate;
  signal?: AbortSignal;
}

const SYSTEM_PROMPT = [
  "You are a patch-capable coding agent for v0.2.",
  "Inspect repositories through tools before answering.",
  "Use apply_patch for code changes and wait for explicit approval before writes.",
  "When patch results exist, list modified files and validation status in the final answer.",
  "Cite inspected file paths in final answers.",
  "Do not auto-stage, commit, push, or persist memory."
].join(" ");

export async function runAgentTask(input: RunAgentTaskInput): Promise<AgentRunState> {
  // What: 每次用户任务创建一个独立 run state。Why: runId、messages、toolResults
  // 是 trace、permission 和最终回答的共同锚点。How: core 只保存 provider-neutral
  // 数据，避免把 CLI 或 provider SDK 形状带入 agent loop。
  const maxSteps = input.maxSteps ?? 8;
  const runId = createRunId();
  const signal = input.signal;
  const messages: AgentMessage[] = [
    {
      role: "system",
      content: SYSTEM_PROMPT
    },
    {
      role: "user",
      content: input.task
    }
  ];
  const state: AgentRunState = {
    runId,
    status: "running",
    task: input.task,
    repoRoot: input.repoRoot,
    messages,
    toolResults: []
  };

  await emit(input, runId, "run.started", {
    task: input.task,
    repoRoot: input.repoRoot
  });

  try {
    throwIfRunAborted(signal);

    // What: agent loop 在有限步数内交替调用 provider 和 tools。Why: coding agent
    // 必须先 inspect repo，再基于 tool results 产出 grounded final answer。How:
    // provider 只能返回 final 或 tool_call，所有 tool_call 都经过 registry/permission。
    for (let step = 0; step < maxSteps; step += 1) {
      throwIfRunAborted(signal);

      const tools = input.tools.specs();
      await emit(input, runId, "provider.requested", {
        provider: input.provider.name,
        step,
        toolCount: tools.length
      });

      const providerRequest: ProviderGenerateRequest = {
        runId,
        step,
        messages: state.messages,
        tools
      };
      if (signal !== undefined) {
        providerRequest.signal = signal;
      }

      const response = await abortable(
        signal,
        input.provider.generate(providerRequest)
      );
      throwIfRunAborted(signal);

      await emit(input, runId, "provider.completed", {
        provider: input.provider.name,
        step,
        responseType: response.type
      });

      if (response.type === "final") {
        state.status = "completed";
        state.finalAnswer = response.content;
        state.messages.push({
          role: "assistant",
          content: response.content
        });
        await emit(input, runId, "run.completed", {
          finalAnswer: response.content
        });
        return state;
      }

      // What: provider 请求的每个 tool call 独立处理。Why: 单个失败不能绕过
      // validation、policy 或 permission，也不应阻断同一轮其他合法调用。How:
      // prepare 先生成可执行计划或结构化错误，execute 只在 permission allow 后发生。
      for (const call of response.calls) {
        throwIfRunAborted(signal);

        await emit(input, runId, "tool.started", {
          callId: call.id,
          toolName: call.name
        });

        const preflight = await abortable(
          signal,
          input.tools.prepare(call, createToolContext(input.repoRoot, signal))
        );
        throwIfRunAborted(signal);

        if (!preflight.ok) {
          appendToolResult(state, preflight.result);
          await emitToolCompleted(input, runId, preflight.result);
          continue;
        }

        const permission = await resolvePermission(
          input,
          runId,
          preflight.prepared,
          signal
        );
        throwIfRunAborted(signal);

        if (permission !== "allow") {
          const result = createPermissionDeniedResult(preflight.prepared, permission);
          appendToolResult(state, result);
          await emitToolCompleted(input, runId, result);
          continue;
        }

        const result = await abortable(
          signal,
          input.tools.execute(
            call,
            createToolContext(input.repoRoot, signal, permission)
          )
        );
        throwIfRunAborted(signal);

        appendToolResult(state, result);
        await emitToolCompleted(input, runId, result);
      }
    }

    const error = createAgentError(
      "provider_error",
      `Provider did not produce a final response within ${maxSteps} steps`
    );
    state.status = "failed";
    state.error = error;
    await emit(input, runId, "run.failed", {
      error: agentErrorToJson(error)
    });
    return state;
  } catch (error) {
    if (isRunAbortError(error) || signal?.aborted === true) {
      return abortRun(input, runId, state);
    }

    const agentError = errorFromUnknown("internal_error", error);
    state.status = "failed";
    state.error = agentError;
    await emit(input, runId, "run.failed", {
      error: agentErrorToJson(agentError)
    });
    return state;
  }
}

async function resolvePermission(
  input: RunAgentTaskInput,
  runId: string,
  prepared: PreparedToolCall,
  signal: AbortSignal | undefined
): Promise<PermissionDecision> {
  // What: 把 tool 默认权限转成实际执行决策。Why: 模型输出不可信，`ask`
  // 必须暂停给用户或测试 adapter 决定。How: allow 直接通过，deny 直接拒绝，
  // ask 会记录 permission.requested，并把非 allow 的结果都收敛为 deny。
  if (prepared.defaultPermission === "allow") {
    return "allow";
  }

  if (prepared.defaultPermission === "deny") {
    return "deny";
  }

  const request: PermissionRequest = {
    runId,
    callId: prepared.callId,
    toolName: prepared.toolName,
    input: prepared.input,
    reason: "Tool default permission is ask."
  };
  if (prepared.preview !== undefined) {
    request.preview = prepared.preview;
  }

  const requestedData: JsonObject = {
    callId: request.callId,
    toolName: request.toolName,
    input:
      request.preview === undefined
        ? request.input
        : {
            omitted: true,
            reason: "preview_available"
          }
  };
  if (request.reason !== undefined) {
    requestedData.reason = request.reason;
  }
  if (request.preview !== undefined) {
    requestedData.preview = previewForTrace(request.preview);
  }

  // What: trace 中不写入完整 patch input。Why: 大 diff 或敏感内容不应进入
  // JSONL trace。How: 有 preview 时只记录 omitted marker 和 bounded preview metadata。
  await emit(input, runId, "permission.requested", requestedData);

  const rawDecision =
    input.permissionGate === undefined
      ? "deny"
      : await abortable(signal, input.permissionGate.check(request));
  throwIfRunAborted(signal);

  const decision = rawDecision === "allow" ? "allow" : "deny";

  await emit(input, runId, "permission.decided", {
    callId: request.callId,
    toolName: request.toolName,
    decision
  });

  return decision;
}

async function abortRun(
  input: RunAgentTaskInput,
  runId: string,
  state: AgentRunState
): Promise<AgentRunState> {
  const error = createAgentError("aborted", "Run aborted by user");
  state.status = "aborted";
  state.error = error;
  await emit(input, runId, "run.aborted", {
    reason: "user"
  });
  return state;
}

function createToolContext(
  repoRoot: string,
  signal: AbortSignal | undefined,
  permission?: PermissionDecision
): ToolExecutorContext {
  const context: ToolExecutorContext = {
    repoRoot
  };

  if (permission !== undefined) {
    context.permission = permission;
  }

  if (signal !== undefined) {
    context.signal = signal;
  }

  return context;
}

function createPermissionDeniedResult(
  prepared: PreparedToolCall,
  decision: PermissionDecision
): ToolExecutionResult {
  return {
    callId: prepared.callId,
    toolName: prepared.toolName,
    ok: false,
    error: createAgentError("permission_denied", "Tool permission denied", {
      toolName: prepared.toolName,
      decision
    })
  };
}

function appendToolResult(state: AgentRunState, result: ToolExecutionResult): void {
  // What: tool result 同时进入状态和下一轮 provider context。Why: provider 需要
  // 观察执行结果才能继续规划或给 final answer。How: 使用 provider-neutral
  // tool message，OpenAI adapter 再负责映射为其当前支持的消息形状。
  state.toolResults.push(result);
  state.messages.push({
    role: "tool",
    name: result.toolName,
    toolCallId: result.callId,
    content: JSON.stringify(result)
  });
}

async function emitToolCompleted(
  input: RunAgentTaskInput,
  runId: string,
  result: ToolExecutionResult
): Promise<void> {
  const data: JsonObject = {
    callId: result.callId,
    toolName: result.toolName,
    ok: result.ok,
    errorKind: result.error?.kind ?? null
  };
  if (result.metadata !== undefined) {
    data.metadata = result.metadata;
  }
  await emit(input, runId, "tool.completed", data);
}

function previewForTrace(preview: ToolPreview): JsonObject {
  // What: 将用户看到的 preview 缩减为 trace-safe metadata。Why: trace 要可调试，
  // 但不能保存完整大 diff。How: 记录 title、summary、truncated 和 bodyBytes。
  const tracePreview: JsonObject = {
    title: preview.title,
    summary: preview.summary
  };

  if (preview.truncated !== undefined) {
    tracePreview.truncated = preview.truncated;
  }

  if (preview.body !== undefined) {
    tracePreview.bodyBytes = Buffer.byteLength(preview.body, "utf8");
  }

  return tracePreview;
}

async function emit(
  input: RunAgentTaskInput,
  runId: string,
  type: TraceEvent["type"],
  data: JsonObject
): Promise<void> {
  const event: TraceEvent = {
    runId,
    timestamp: new Date().toISOString(),
    type,
    data
  };
  input.onEvent?.(event);
  await input.logger?.write(event);
}

class RunAbortError extends Error {
  constructor() {
    super("Run aborted by user");
    this.name = "RunAbortError";
  }
}

function throwIfRunAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted === true) {
    throw new RunAbortError();
  }
}

function isRunAbortError(error: unknown): error is RunAbortError {
  return error instanceof RunAbortError;
}

async function abortable<T>(
  signal: AbortSignal | undefined,
  operation: Promise<T>
): Promise<T> {
  // What: 给 provider/tool/permission 等异步操作统一接入 abort signal。Why:
  // 用户按 q 或 Ctrl+C 后不能继续写入或推进下一步。How: signal 触发时拒绝
  // promise，并在 operation 完成后移除 listener，避免泄漏。
  if (signal === undefined) {
    return operation;
  }

  throwIfRunAborted(signal);

  return new Promise<T>((resolve, reject) => {
    const abort = (): void => {
      reject(new RunAbortError());
    };

    signal.addEventListener("abort", abort, {
      once: true
    });

    operation.then(resolve, reject).finally(() => {
      signal.removeEventListener("abort", abort);
    });
  });
}
