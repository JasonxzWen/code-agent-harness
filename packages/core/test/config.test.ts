import { describe, expect, test } from "bun:test";
import { AgentHarnessConfigSchema } from "../src/config";

describe("AgentHarnessConfigSchema", () => {
  test("applies v0.1 defaults", () => {
    expect(AgentHarnessConfigSchema.parse({})).toMatchObject({
      provider: "mock",
      model: "mock-local",
      maxSteps: 8,
      traceDir: ".agent-harness/traces"
    });
  });

  test("rejects invalid max steps", () => {
    expect(() => AgentHarnessConfigSchema.parse({ maxSteps: 0 })).toThrow();
  });
});
