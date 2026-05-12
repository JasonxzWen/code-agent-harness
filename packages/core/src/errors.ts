import type { AgentError, AgentErrorKind, JsonObject } from "./types";

export function createAgentError(
  kind: AgentErrorKind,
  message: string,
  details?: JsonObject
): AgentError {
  // What: 统一创建结构化 AgentError。Why: tool/provider/core 失败都需要可 trace、
  // 可断言的 error kind。How: details 可选，避免空 details 污染 JSONL。
  return details === undefined ? { kind, message } : { kind, message, details };
}

export function errorFromUnknown(kind: AgentErrorKind, error: unknown): AgentError {
  // What: 把 unknown 异常收敛为 AgentError。Why: catch 到的值不一定是 Error，
  // 但 agent loop 必须返回结构化失败。How: Error 取 message，其他值转字符串放 details。
  if (error instanceof Error) {
    return createAgentError(kind, error.message);
  }

  return createAgentError(kind, "Unknown error", {
    value: String(error)
  });
}

export function agentErrorToJson(error: AgentError): JsonObject {
  // What: 将 AgentError 转为 JsonObject。Why: trace event data 只接受 JSON object。
  // How: 显式复制 kind/message/details，避免把 class 或 prototype 信息写入 trace。
  const serialized: JsonObject = {
    kind: error.kind,
    message: error.message
  };

  if (error.details !== undefined) {
    serialized.details = error.details;
  }

  return serialized;
}
