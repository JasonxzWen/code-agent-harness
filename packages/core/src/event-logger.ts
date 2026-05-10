import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import type { EventLogger, JsonObject, JsonValue, TraceEvent } from "./types";

const SECRET_KEY_PATTERN = /(api[_-]?key|authorization|password|secret|token)/i;
const SECRET_VALUE_PATTERNS = [
  /sk-[A-Za-z0-9_-]{16,}/g,
  /ghp_[A-Za-z0-9_]{16,}/g,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g
];

export function createJsonlEventLogger(tracePath: string): EventLogger {
  return {
    async write(event) {
      await mkdir(dirname(tracePath), { recursive: true });
      await appendFile(
        tracePath,
        `${JSON.stringify(redactTraceEvent(event))}\n`,
        "utf8"
      );
    }
  };
}

export function redactTraceEvent(event: TraceEvent): TraceEvent {
  return {
    ...event,
    data: redactJson(event.data) as JsonObject
  };
}

export function redactJson(value: JsonValue): JsonValue {
  if (typeof value === "string") {
    return SECRET_VALUE_PATTERNS.reduce(
      (current, pattern) => current.replace(pattern, "[REDACTED]"),
      value
    );
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactJson(item));
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        SECRET_KEY_PATTERN.test(key) ? "[REDACTED]" : redactJson(child)
      ])
    );
  }

  return value;
}
