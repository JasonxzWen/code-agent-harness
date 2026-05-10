import type { AgentError, AgentErrorKind, JsonObject } from "./types";

export function createAgentError(
  kind: AgentErrorKind,
  message: string,
  details?: JsonObject
): AgentError {
  return details === undefined ? { kind, message } : { kind, message, details };
}

export function errorFromUnknown(kind: AgentErrorKind, error: unknown): AgentError {
  if (error instanceof Error) {
    return createAgentError(kind, error.message);
  }

  return createAgentError(kind, "Unknown error", {
    value: String(error)
  });
}

export function agentErrorToJson(error: AgentError): JsonObject {
  const serialized: JsonObject = {
    kind: error.kind,
    message: error.message
  };

  if (error.details !== undefined) {
    serialized.details = error.details;
  }

  return serialized;
}
