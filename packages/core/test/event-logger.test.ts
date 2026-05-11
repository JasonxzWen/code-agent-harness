import { describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createJsonlEventLogger } from "../src/event-logger";
import type { TraceEvent } from "../src/types";

describe("createJsonlEventLogger", () => {
  test("redacts secret-like object fields before writing trace JSONL", async () => {
    const tempRoot = await mkdtemp(path.join(tmpdir(), "agent-harness-traces-"));

    try {
      const tracePath = path.join(tempRoot, "nested", "trace.jsonl");
      const logger = createJsonlEventLogger(tracePath);
      const event = createTraceEvent({
        toolName: "read_file",
        path: "src/index.ts",
        apiKey: "sk-test_1234567890abcdef",
        nested: {
          authorization: "Bearer private-value",
          summary: "read safe source file"
        }
      });

      await logger.write(event);

      const rawTrace = await readFile(tracePath, "utf8");
      expect(rawTrace).toContain('"apiKey":"[REDACTED]"');
      expect(rawTrace).toContain('"authorization":"[REDACTED]"');
      expect(rawTrace).not.toContain("sk-test_1234567890abcdef");
      expect(rawTrace).not.toContain("Bearer private-value");
      expect(rawTrace).toContain('"toolName":"read_file"');
      expect(rawTrace).toContain('"path":"src/index.ts"');
      expect(rawTrace).toContain('"summary":"read safe source file"');
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });

  test("redacts API-key-like values embedded in readable trace fields", async () => {
    const tempRoot = await mkdtemp(path.join(tmpdir(), "agent-harness-traces-"));

    try {
      const tracePath = path.join(tempRoot, "trace.jsonl");
      const logger = createJsonlEventLogger(tracePath);
      const event = createTraceEvent({
        result: "provider returned sk-test_1234567890abcdef",
        hints: ["visible context", "github token ghp_1234567890abcdef"],
        count: 2
      });

      await logger.write(event);

      const rawTrace = await readFile(tracePath, "utf8");
      expect(rawTrace).toContain('"result":"provider returned [REDACTED]"');
      expect(rawTrace).toContain(
        '"hints":["visible context","github token [REDACTED]"]'
      );
      expect(rawTrace).not.toContain("sk-test_1234567890abcdef");
      expect(rawTrace).not.toContain("ghp_1234567890abcdef");
      expect(rawTrace).toContain('"count":2');
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });
});

function createTraceEvent(data: TraceEvent["data"]): TraceEvent {
  return {
    runId: "run-test",
    timestamp: "2026-05-11T00:00:00.000Z",
    type: "tool.completed",
    data
  };
}
